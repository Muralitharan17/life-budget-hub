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
    if (!user || !profileName || profileName === 'combined') {
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

      // For now, use localStorage for profile-based data storage
      // This ensures immediate functionality while database migration is completed
      const storageKey = `budget_config_${user.id}_${profileName}_${month}_${year}`;
      const storedConfig = localStorage.getItem(storageKey);
      
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig);
          setBudgetConfig(parsedConfig);
          console.log('Loaded budget config from localStorage:', parsedConfig);
        } catch (err) {
          console.error('Error parsing stored config:', err);
          setBudgetConfig(null);
        }
      } else {
        setBudgetConfig(null);
      }

      // Load portfolios from localStorage
      const portfolioStorageKey = `investment_portfolios_${user.id}_${profileName}_${month}_${year}`;
      const storedPortfolios = localStorage.getItem(portfolioStorageKey);
      
      if (storedPortfolios) {
        try {
          const parsedPortfolios = JSON.parse(storedPortfolios);
          setPortfolios(parsedPortfolios);
          console.log('Loaded portfolios from localStorage:', parsedPortfolios);
        } catch (err) {
          console.error('Error parsing stored portfolios:', err);
          setPortfolios([]);
        }
      } else {
        setPortfolios([]);
      }

      // Load transactions from localStorage
      const transactionStorageKey = `transactions_${user.id}_${profileName}_${month}_${year}`;
      const storedTransactions = localStorage.getItem(transactionStorageKey);
      
      if (storedTransactions) {
        try {
          const parsedTransactions = JSON.parse(storedTransactions);
          setTransactions(parsedTransactions);
          console.log('Loaded transactions from localStorage:', parsedTransactions);
        } catch (err) {
          console.error('Error parsing stored transactions:', err);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }

    } catch (err) {
      console.error('Fetch budget data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (config: Partial<BudgetConfig>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      console.log('Saving budget config:', { user: user.id, profileName, month, year, config });
      
      const budgetData: BudgetConfig = {
        id: budgetConfig?.id || crypto.randomUUID(),
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
        created_at: budgetConfig?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Budget data to save:', budgetData);

      // Save to localStorage for immediate functionality
      const storageKey = `budget_config_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(storageKey, JSON.stringify(budgetData));
      
      console.log('Budget config saved successfully to localStorage:', budgetData);
      setBudgetConfig(budgetData);

      // Try to save to Supabase as well (if possible)
      try {
        // First, try to find or create a budget period
        let budgetPeriodId = null;
        
        const { data: existingPeriod, error: periodError } = await supabase
          .from('budget_periods')
          .select('id')
          .eq('user_id', user.id)
          .eq('budget_month', month)
          .eq('budget_year', year)
          .maybeSingle();

        if (existingPeriod) {
          budgetPeriodId = existingPeriod.id;
        } else if (!periodError || periodError.code === 'PGRST116') {
          // Create new budget period
          const { data: newPeriod, error: createError } = await supabase
            .from('budget_periods')
            .insert({
              user_id: user.id,
              budget_month: month,
              budget_year: year,
              period_name: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
              is_active: true,
            })
            .select('id')
            .single();

          if (!createError && newPeriod) {
            budgetPeriodId = newPeriod.id;
          }
        }

        if (budgetPeriodId) {
          const supabaseData = {
            user_id: user.id,
            budget_period_id: budgetPeriodId,
            budget_month: month,
            budget_year: year,
            monthly_salary: budgetData.monthly_salary,
            budget_percentage: budgetData.budget_percentage,
            allocation_need: budgetData.allocation_need,
            allocation_want: budgetData.allocation_want,
            allocation_savings: budgetData.allocation_savings,
            allocation_investments: budgetData.allocation_investments,
          };

          const { error: saveError } = await supabase
            .from('budget_configs')
            .upsert(supabaseData);

          if (saveError) {
            console.warn('Could not save to Supabase:', saveError);
          } else {
            console.log('Also saved to Supabase successfully');
          }
        }
      } catch (supabaseErr) {
        console.warn('Supabase save failed, but localStorage save succeeded:', supabaseErr);
      }

      return budgetData;
    } catch (err) {
      console.error('Save budget config error:', err);
      throw err;
    }
  };

  const saveInvestmentPortfolio = async (portfolio: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      const portfolioData: InvestmentPortfolio = {
        id: crypto.randomUUID(),
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        name: portfolio.name || '',
        allocation_type: portfolio.allocation_type || 'percentage',
        allocation_value: portfolio.allocation_value || 0,
        allocated_amount: portfolio.allocated_amount || 0,
        invested_amount: portfolio.invested_amount || 0,
        allow_direct_investment: portfolio.allow_direct_investment || false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newPortfolios = [...portfolios, portfolioData];
      setPortfolios(newPortfolios);

      // Save to localStorage
      const portfolioStorageKey = `investment_portfolios_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(portfolioStorageKey, JSON.stringify(newPortfolios));
      
      console.log('Portfolio saved to localStorage:', portfolioData);
      return portfolioData;
    } catch (err) {
      console.error('Save portfolio error:', err);
      throw err;
    }
  };

  const updateInvestmentPortfolio = async (id: string, updates: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      const updatedPortfolios = portfolios.map(p => 
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      );
      setPortfolios(updatedPortfolios);

      // Save to localStorage
      const portfolioStorageKey = `investment_portfolios_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(portfolioStorageKey, JSON.stringify(updatedPortfolios));
      
      const updatedPortfolio = updatedPortfolios.find(p => p.id === id);
      console.log('Portfolio updated in localStorage:', updatedPortfolio);
      return updatedPortfolio;
    } catch (err) {
      console.error('Update portfolio error:', err);
      throw err;
    }
  };

  const deleteInvestmentPortfolio = async (id: string) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      const updatedPortfolios = portfolios.filter(p => p.id !== id);
      setPortfolios(updatedPortfolios);

      // Save to localStorage
      const portfolioStorageKey = `investment_portfolios_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(portfolioStorageKey, JSON.stringify(updatedPortfolios));
      
      console.log('Portfolio deleted from localStorage');
    } catch (err) {
      console.error('Delete portfolio error:', err);
      throw err;
    }
  };

  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      const transactionData: Transaction = {
        id: crypto.randomUUID(),
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        type: transaction.type || 'expense',
        category: transaction.category || 'need',
        amount: transaction.amount || 0,
        description: transaction.description,
        notes: transaction.notes,
        transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
        transaction_time: transaction.transaction_time,
        payment_type: transaction.payment_type,
        spent_for: transaction.spent_for,
        tag: transaction.tag,
        portfolio_id: transaction.portfolio_id,
        investment_type: transaction.investment_type,
        refund_for: transaction.refund_for,
        original_transaction_id: transaction.original_transaction_id,
        status: transaction.status || 'active',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newTransactions = [transactionData, ...transactions];
      setTransactions(newTransactions);

      // Save to localStorage
      const transactionStorageKey = `transactions_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(transactionStorageKey, JSON.stringify(newTransactions));
      
      console.log('Transaction saved to localStorage:', transactionData);
      return transactionData;
    } catch (err) {
      console.error('Add transaction error:', err);
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      );
      setTransactions(updatedTransactions);

      // Save to localStorage
      const transactionStorageKey = `transactions_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(transactionStorageKey, JSON.stringify(updatedTransactions));
      
      const updatedTransaction = updatedTransactions.find(t => t.id === id);
      console.log('Transaction updated in localStorage:', updatedTransaction);
      return updatedTransaction;
    } catch (err) {
      console.error('Update transaction error:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, is_deleted: true, deleted_at: new Date().toISOString() } : t
      );
      setTransactions(updatedTransactions.filter(t => !t.is_deleted));

      // Save to localStorage
      const transactionStorageKey = `transactions_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(transactionStorageKey, JSON.stringify(updatedTransactions));
      
      console.log('Transaction deleted from localStorage');
    } catch (err) {
      console.error('Delete transaction error:', err);
      throw err;
    }
  };

  const refundTransaction = async (originalTransactionId: string, refundAmount: number, reason: string) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      // Create refund transaction
      const refundTransaction = await addTransaction({
        type: 'refund',
        category: 'need', // Will be updated based on original transaction
        amount: refundAmount,
        description: `Refund: ${reason}`,
        refund_for: originalTransactionId,
        status: 'active',
      });

      // Update original transaction status
      const originalTransaction = transactions.find(t => t.id === originalTransactionId);
      if (originalTransaction) {
        const isFullRefund = refundAmount === originalTransaction.amount;
        await updateTransaction(originalTransactionId, {
          status: isFullRefund ? 'refunded' : 'partial_refund',
          original_transaction_id: refundTransaction?.id
        });
      }

      return refundTransaction;
    } catch (err) {
      console.error('Refund transaction error:', err);
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
