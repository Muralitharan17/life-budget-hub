/*
  # Implement Proper Budget Period Tracking

  1. New Tables
    - `budget_periods` - Master table for tracking budget periods (month/year combinations)
    
  2. Schema Changes
    - Add `budget_period_id` to all relevant tables
    - Add explicit `budget_month` and `budget_year` columns for easy filtering
    - Drop dependency on created_at/updated_at for period filtering
    
  3. Data Migration
    - Migrate existing data to new structure
    - Create budget periods for existing data
    
  4. Security
    - Update RLS policies for new structure
    - Maintain data isolation per user and period
*/

-- Drop existing tables to recreate with proper structure
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS investment_portfolios CASCADE;
DROP TABLE IF EXISTS budget_configs CASCADE;
DROP TABLE IF EXISTS budget_periods CASCADE;

-- Create budget_periods table - Master table for month/year tracking
CREATE TABLE budget_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  period_name TEXT GENERATED ALWAYS AS (budget_year || '-' || LPAD(budget_month::TEXT, 2, '0')) STORED,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one period per user per month/year
  UNIQUE(user_id, budget_year, budget_month)
);

-- Create budget_configs table with period tracking
CREATE TABLE budget_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  budget_period_id UUID REFERENCES budget_periods(id) ON DELETE CASCADE NOT NULL,
  
  -- Explicit month/year for easy filtering (denormalized for performance)
  budget_year INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  
  -- Budget configuration
  monthly_salary DECIMAL(15,2) DEFAULT 0 NOT NULL,
  budget_percentage DECIMAL(5,2) DEFAULT 100 NOT NULL,
  allocation_need DECIMAL(5,2) DEFAULT 50 NOT NULL,
  allocation_want DECIMAL(5,2) DEFAULT 30 NOT NULL,
  allocation_savings DECIMAL(5,2) DEFAULT 10 NOT NULL,
  allocation_investments DECIMAL(5,2) DEFAULT 10 NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one config per user per period
  UNIQUE(user_id, budget_period_id),
  UNIQUE(user_id, budget_year, budget_month)
);

-- Create investment_portfolios table with period tracking
CREATE TABLE investment_portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  budget_period_id UUID REFERENCES budget_periods(id) ON DELETE CASCADE NOT NULL,
  
  -- Explicit month/year for easy filtering
  budget_year INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  
  -- Portfolio details
  name TEXT NOT NULL,
  allocation_type TEXT CHECK (allocation_type IN ('percentage', 'amount')) DEFAULT 'percentage' NOT NULL,
  allocation_value DECIMAL(15,2) DEFAULT 0 NOT NULL,
  allocated_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  invested_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  allow_direct_investment BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create transactions table with period tracking
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  budget_period_id UUID REFERENCES budget_periods(id) ON DELETE CASCADE NOT NULL,
  
  -- Explicit month/year for easy filtering
  budget_year INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  
  -- Transaction details
  type TEXT CHECK (type IN ('expense', 'income', 'refund', 'investment', 'savings', 'transfer')) NOT NULL,
  category TEXT CHECK (category IN ('need', 'want', 'savings', 'investments')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  notes TEXT,
  
  -- Transaction date (separate from budget period)
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  
  -- Additional metadata
  payment_type TEXT CHECK (payment_type IN ('cash', 'card', 'upi', 'netbanking', 'cheque', 'other')),
  spent_for TEXT,
  tag TEXT,
  
  -- Investment specific fields
  portfolio_id UUID REFERENCES investment_portfolios(id),
  investment_type TEXT,
  
  -- Refund tracking
  refund_for UUID REFERENCES transactions(id),
  original_transaction_id UUID REFERENCES transactions(id),
  
  -- Status and tracking
  status TEXT CHECK (status IN ('active', 'cancelled', 'refunded', 'partial_refund')) DEFAULT 'active' NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  
  -- Audit fields (for record keeping, not period filtering)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create transaction_history table with period tracking
CREATE TABLE transaction_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  budget_period_id UUID REFERENCES budget_periods(id) ON DELETE CASCADE NOT NULL,
  
  -- Explicit month/year for easy filtering
  budget_year INTEGER NOT NULL,
  budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
  
  -- Change tracking
  action TEXT CHECK (action IN ('created', 'updated', 'deleted', 'refunded', 'amount_reduced')) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changes_description TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- Create indexes for optimal performance
CREATE INDEX idx_budget_periods_user_year_month ON budget_periods(user_id, budget_year, budget_month);
CREATE INDEX idx_budget_periods_period_name ON budget_periods(period_name);

CREATE INDEX idx_budget_configs_user_period ON budget_configs(user_id, budget_year, budget_month);
CREATE INDEX idx_budget_configs_period_id ON budget_configs(budget_period_id);

CREATE INDEX idx_investment_portfolios_user_period ON investment_portfolios(user_id, budget_year, budget_month);
CREATE INDEX idx_investment_portfolios_period_id ON investment_portfolios(budget_period_id);
CREATE INDEX idx_investment_portfolios_active ON investment_portfolios(is_active);

CREATE INDEX idx_transactions_user_period ON transactions(user_id, budget_year, budget_month);
CREATE INDEX idx_transactions_period_id ON transactions(budget_period_id);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_deleted ON transactions(is_deleted);

CREATE INDEX idx_transaction_history_user_period ON transaction_history(user_id, budget_year, budget_month);
CREATE INDEX idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_period_id ON transaction_history(budget_period_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_budget_periods_updated_at BEFORE UPDATE ON budget_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_configs_updated_at BEFORE UPDATE ON budget_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_portfolios_updated_at BEFORE UPDATE ON investment_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create budget period if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_budget_period(p_user_id UUID, p_year INTEGER, p_month INTEGER)
RETURNS UUID AS $$
DECLARE
    period_id UUID;
BEGIN
    -- Try to get existing period
    SELECT id INTO period_id
    FROM budget_periods
    WHERE user_id = p_user_id AND budget_year = p_year AND budget_month = p_month;
    
    -- Create if doesn't exist
    IF period_id IS NULL THEN
        INSERT INTO budget_periods (user_id, budget_year, budget_month)
        VALUES (p_user_id, p_year, p_month)
        RETURNING id INTO period_id;
    END IF;
    
    RETURN period_id;
END;
$$ language 'plpgsql';

-- Function to sync budget period data when inserting/updating records
CREATE OR REPLACE FUNCTION sync_budget_period_data()
RETURNS TRIGGER AS $$
DECLARE
    period_id UUID;
BEGIN
    -- Ensure budget period exists and get its ID
    period_id := ensure_budget_period(NEW.user_id, NEW.budget_year, NEW.budget_month);
    
    -- Set the budget_period_id
    NEW.budget_period_id := period_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-sync budget period data
CREATE TRIGGER sync_budget_configs_period BEFORE INSERT OR UPDATE ON budget_configs FOR EACH ROW EXECUTE FUNCTION sync_budget_period_data();
CREATE TRIGGER sync_investment_portfolios_period BEFORE INSERT OR UPDATE ON investment_portfolios FOR EACH ROW EXECUTE FUNCTION sync_budget_period_data();
CREATE TRIGGER sync_transactions_period BEFORE INSERT OR UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION sync_budget_period_data();
CREATE TRIGGER sync_transaction_history_period BEFORE INSERT OR UPDATE ON transaction_history FOR EACH ROW EXECUTE FUNCTION sync_budget_period_data();

-- Enhanced transaction audit function
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO transaction_history (
            transaction_id, user_id, budget_year, budget_month,
            action, new_values, changes_description
        )
        VALUES (
            NEW.id, NEW.user_id, NEW.budget_year, NEW.budget_month,
            'created', to_jsonb(NEW), 'Transaction created'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO transaction_history (
            transaction_id, user_id, budget_year, budget_month,
            action, old_values, new_values, changes_description
        )
        VALUES (
            NEW.id, NEW.user_id, NEW.budget_year, NEW.budget_month,
            'updated', to_jsonb(OLD), to_jsonb(NEW), 'Transaction updated'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO transaction_history (
            transaction_id, user_id, budget_year, budget_month,
            action, old_values, changes_description
        )
        VALUES (
            OLD.id, OLD.user_id, OLD.budget_year, OLD.budget_month,
            'deleted', to_jsonb(OLD), 'Transaction deleted'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create transaction audit trigger
CREATE TRIGGER transaction_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

-- Enable Row Level Security
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Budget periods policies
CREATE POLICY "Users can manage own budget periods" ON budget_periods FOR ALL USING (auth.uid() = user_id);

-- Budget configs policies
CREATE POLICY "Users can manage own budget configs" ON budget_configs FOR ALL USING (auth.uid() = user_id);

-- Investment portfolios policies
CREATE POLICY "Users can manage own portfolios" ON investment_portfolios FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Transaction history policies
CREATE POLICY "Users can view own transaction history" ON transaction_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transaction history" ON transaction_history FOR INSERT WITH CHECK (true);

-- Create helper views for easy querying

-- View for current month data
CREATE OR REPLACE VIEW current_month_summary AS
SELECT 
    bp.user_id,
    bp.budget_year,
    bp.budget_month,
    bp.period_name,
    bc.monthly_salary,
    bc.budget_percentage,
    bc.allocation_need,
    bc.allocation_want,
    bc.allocation_savings,
    bc.allocation_investments,
    COUNT(DISTINCT ip.id) as portfolio_count,
    COUNT(DISTINCT t.id) as transaction_count,
    COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.category = 'need' THEN t.amount ELSE 0 END), 0) as need_spent,
    COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.category = 'want' THEN t.amount ELSE 0 END), 0) as want_spent,
    COALESCE(SUM(CASE WHEN t.type IN ('savings', 'investment') AND t.category = 'savings' THEN t.amount ELSE 0 END), 0) as savings_amount,
    COALESCE(SUM(CASE WHEN t.type = 'investment' AND t.category = 'investments' THEN t.amount ELSE 0 END), 0) as investments_amount
FROM budget_periods bp
LEFT JOIN budget_configs bc ON bp.id = bc.budget_period_id
LEFT JOIN investment_portfolios ip ON bp.id = ip.budget_period_id AND ip.is_active = true
LEFT JOIN transactions t ON bp.id = t.budget_period_id AND t.is_deleted = false AND t.status = 'active'
WHERE bp.is_active = true
GROUP BY bp.user_id, bp.budget_year, bp.budget_month, bp.period_name, 
         bc.monthly_salary, bc.budget_percentage, bc.allocation_need, 
         bc.allocation_want, bc.allocation_savings, bc.allocation_investments;

-- Grant access to views
GRANT SELECT ON current_month_summary TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view own month summary" ON budget_periods FOR SELECT USING (auth.uid() = user_id);

-- Insert sample data for current month (optional)
-- This will be handled by the application when users first access a month/year