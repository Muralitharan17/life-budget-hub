import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface BudgetConfig {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  monthly_salary: number;
  budget_percentage: number;
  allocation_need: number;
  allocation_want: number;
  allocation_savings: number;
  allocation_investments: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPortfolio {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  name: string;
  allocation_type: 'percentage' | 'amount';
  allocation_value: number;
  allocated_amount: number;
  invested_amount: number;
  allow_direct_investment: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  type: 'expense' | 'income' | 'refund' | 'investment' | 'savings' | 'transfer';
  category: 'need' | 'want' | 'savings' | 'investments';
  amount: number;
  description?: string;
  notes?: string;
  transaction_date: string;
  transaction_time?: string;
  payment_type?: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'other';
  spent_for?: string;
  tag?: string;
  portfolio_id?: string;
  investment_type?: string;
  refund_for?: string;
  original_transaction_id?: string;
  status: 'active' | 'cancelled' | 'refunded' | 'partial_refund';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export function useBudgetData(month: number, year: number, profileName: string) {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [portfolios, setPortfolios] = useState<InvestmentPortfolio[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBudgetData = async () => {
    if (!user || !profileName) {
      setBudgetConfig(null);
      setPortfolios([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching budget data for:', { user: user.id, profileName, month, year });

            // Fetch budget config for specific profile
      // First try with profile_name column (new schema), fallback to without it (old schema)
      let budgetData = null;
      let budgetError = null;

      try {
        const { data, error } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .maybeSingle();
        budgetData = data;
        budgetError = error;
      } catch (err) {
        // Profile_name column doesn't exist yet, try without it
        console.log('Trying fallback query without profile_name column');
        const { data, error } = await supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .maybeSingle();
        budgetData = data;
        budgetError = error;

        // Add profile_name to the data for consistency
        if (budgetData) {
          budgetData.profile_name = profileName;
        }
      }

      if (budgetError && budgetError.code !== 'PGRST116') {
        console.error('Budget config fetch error:', budgetError);
        throw budgetError;
      }

      console.log('Fetched budget config:', budgetData);
      setBudgetConfig(budgetData);

            // Fetch investment portfolios for specific profile
      let portfolioData = null;
      let portfolioError = null;

      try {
        const { data, error } = await supabase
          .from('investment_portfolios')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_active', true);
        portfolioData = data;
        portfolioError = error;
      } catch (err) {
        // Profile_name column doesn't exist yet, try without it
        console.log('Trying fallback query for portfolios without profile_name column');
        const { data, error } = await supabase
          .from('investment_portfolios')
          .select('*')
          .eq('user_id', user.id)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_active', true);
        portfolioData = data;
        portfolioError = error;

        // Add profile_name to the data for consistency
        if (portfolioData) {
          portfolioData = portfolioData.map((p: any) => ({ ...p, profile_name: profileName }));
        }
      }

      if (portfolioError) {
        console.error('Portfolio fetch error:', portfolioError);
        throw portfolioError;
      }

      console.log('Fetched portfolios:', portfolioData);
      setPortfolios(portfolioData || []);

            // Fetch transactions for specific profile
      let transactionData = null;
      let transactionError = null;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_name', profileName)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false });
        transactionData = data;
        transactionError = error;
      } catch (err) {
        // Profile_name column doesn't exist yet, try without it
        console.log('Trying fallback query for transactions without profile_name column');
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false });
        transactionData = data;
        transactionError = error;

        // Add profile_name to the data for consistency
        if (transactionData) {
          transactionData = transactionData.map((t: any) => ({ ...t, profile_name: profileName }));
        }
      }

      if (transactionError) {
        console.error('Transaction fetch error:', transactionError);
        throw transactionError;
      }

      console.log('Fetched transactions:', transactionData);
      setTransactions(transactionData || []);
    } catch (err) {
      console.error('Fetch budget data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (config: Partial<BudgetConfig>) => {
    if (!user || !profileName) return;

    try {
      console.log('Saving budget config:', { user: user.id, profileName, month, year, config });
      
      const budgetData = {
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        monthly_salary: config.monthly_salary || 0,
        budget_percentage: config.budget_percentage || 100,
        allocation_need: config.allocation_need || 0,
        allocation_want: config.allocation_want || 0,
        allocation_savings: config.allocation_savings || 0,
        allocation_investments: config.allocation_investments || 0,
      };

      console.log('Budget data to save:', budgetData);

      const { data, error } = await supabase
        .from('budget_configs')
        .upsert(budgetData, {
          onConflict: 'user_id,profile_name,budget_year,budget_month'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving budget config:', error);
        throw error;
      }
      
      console.log('Budget config saved successfully:', data);
      setBudgetConfig(data);
      return data;
    } catch (err) {
      console.error('Save budget config error:', err);
      throw err;
    }
  };

  const saveInvestmentPortfolio = async (portfolio: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName) return;

    try {
      const portfolioData = {
        ...portfolio,
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
      };

      const { data, error } = await supabase
        .from('investment_portfolios')
        .insert(portfolioData)
        .select()
        .single();

      if (error) throw error;
      setPortfolios(prev => [...prev, data]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateInvestmentPortfolio = async (id: string, updates: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName) return;

    try {
      const { data, error } = await supabase
        .from('investment_portfolios')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .select()
        .single();

      if (error) throw error;
      setPortfolios(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteInvestmentPortfolio = async (id: string) => {
    if (!user || !profileName) return;

    try {
      const { error } = await supabase
        .from('investment_portfolios')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName);

      if (error) throw error;
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!user || !profileName) return;

    try {
      const transactionData = {
        ...transaction,
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;
      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user || !profileName) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName)
        .select()
        .single();

      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !profileName) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('profile_name', profileName);

      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const refundTransaction = async (originalTransactionId: string, refundAmount: number, reason: string) => {
    if (!user || !profileName) return;

    try {
      // Create refund transaction
      const refundData = {
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        type: 'refund' as const,
        category: 'need' as const, // Will be updated based on original transaction
        amount: refundAmount,
        description: `Refund: ${reason}`,
        transaction_date: new Date().toISOString().split('T')[0],
        refund_for: originalTransactionId,
        status: 'active' as const,
      };

      const { data: refundTransaction, error: refundError } = await supabase
        .from('transactions')
        .insert(refundData)
        .select()
        .single();

      if (refundError) throw refundError;

      // Update original transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: refundAmount === transactions.find(t => t.id === originalTransactionId)?.amount 
            ? 'refunded' 
            : 'partial_refund',
          original_transaction_id: refundTransaction.id
        })
        .eq('id', originalTransactionId)
        .eq('user_id', user.id)
        .eq('profile_name', profileName);

      if (updateError) throw updateError;

      // Refresh data
      await fetchBudgetData();
      return refundTransaction;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user, month, year, profileName]);

  return {
    budgetConfig,
    portfolios,
    transactions,
    loading,
    error,
    saveBudgetConfig,
    saveInvestmentPortfolio,
    updateInvestmentPortfolio,
    deleteInvestmentPortfolio,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refundTransaction,
    refetch: fetchBudgetData
  };
}
