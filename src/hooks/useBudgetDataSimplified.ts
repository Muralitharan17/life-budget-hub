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

// Simple budget config table that doesn't depend on budget_periods
interface SimpleBudgetConfig {
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

export function useBudgetData(month: number, year: number, profileName: string) {
  const [budgetConfig, setBudgetConfig] = useState<SimpleBudgetConfig | null>(null);
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

      // Try to fetch from a custom budget_configs_simple table first, fallback to localStorage for now
      // Since we're in transition, we'll create a simple local storage based approach
      const storageKey = `budget_config_${user.id}_${profileName}_${month}_${year}`;
      const storedConfig = localStorage.getItem(storageKey);
      
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setBudgetConfig(parsedConfig);
      } else {
        setBudgetConfig(null);
      }

      // For now, set empty arrays for portfolios and transactions
      // These will be implemented once the database migration is complete
      setPortfolios([]);
      setTransactions([]);

    } catch (err) {
      console.error('Fetch budget data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (config: Partial<SimpleBudgetConfig>) => {
    if (!user || !profileName || profileName === 'combined') return;

    try {
      console.log('Saving budget config:', { user: user.id, profileName, month, year, config });
      
      const budgetData: SimpleBudgetConfig = {
        id: crypto.randomUUID(),
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Budget data to save:', budgetData);

      // For now, save to localStorage until database migration is complete
      const storageKey = `budget_config_${user.id}_${profileName}_${month}_${year}`;
      localStorage.setItem(storageKey, JSON.stringify(budgetData));
      
      console.log('Budget config saved successfully to localStorage:', budgetData);
      setBudgetConfig(budgetData);
      return budgetData;
    } catch (err) {
      console.error('Save budget config error:', err);
      throw err;
    }
  };

  const saveInvestmentPortfolio = async (portfolio: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('saveInvestmentPortfolio called but not implemented yet');
    return null;
  };

  const updateInvestmentPortfolio = async (id: string, updates: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('updateInvestmentPortfolio called but not implemented yet');
    return null;
  };

  const deleteInvestmentPortfolio = async (id: string) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('deleteInvestmentPortfolio called but not implemented yet');
  };

  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('addTransaction called but not implemented yet');
    return null;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('updateTransaction called but not implemented yet');
    return null;
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('deleteTransaction called but not implemented yet');
  };

  const refundTransaction = async (originalTransactionId: string, refundAmount: number, reason: string) => {
    if (!user || !profileName || profileName === 'combined') return;

    // TODO: Implement when database migration is complete
    console.log('refundTransaction called but not implemented yet');
    return null;
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
