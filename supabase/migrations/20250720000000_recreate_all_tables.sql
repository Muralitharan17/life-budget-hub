-- Comprehensive migration to recreate all tables with proper datetime fields and CRUD support
-- This will drop existing tables and create new ones with enhanced structure

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS investment_portfolios CASCADE;
DROP TABLE IF EXISTS budget_configs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create budget_configs table
CREATE TABLE budget_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  monthly_salary DECIMAL(15,2) DEFAULT 0 NOT NULL,
  budget_percentage DECIMAL(5,2) DEFAULT 100 NOT NULL,
  allocation_need DECIMAL(5,2) DEFAULT 50 NOT NULL,
  allocation_want DECIMAL(5,2) DEFAULT 30 NOT NULL,
  allocation_savings DECIMAL(5,2) DEFAULT 10 NOT NULL,
  allocation_investments DECIMAL(5,2) DEFAULT 10 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create investment_portfolios table
CREATE TABLE investment_portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  allocation_type TEXT CHECK (allocation_type IN ('percentage', 'amount')) DEFAULT 'percentage' NOT NULL,
  allocation_value DECIMAL(15,2) DEFAULT 0 NOT NULL,
  allocated_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  invested_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
  allow_direct_investment BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create enhanced transactions table with full CRUD support
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  type TEXT CHECK (type IN ('expense', 'income', 'refund', 'investment', 'savings', 'transfer')) NOT NULL,
  category TEXT CHECK (category IN ('need', 'want', 'savings', 'investments')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  notes TEXT,
  
  -- Date and time tracking
  date DATE NOT NULL,
  time TIME,
  
  -- Additional metadata
  payment_type TEXT CHECK (payment_type IN ('cash', 'card', 'upi', 'netbanking', 'cheque', 'other')),
  spent_for TEXT, -- What was this expense for
  tag TEXT, -- Custom tags for categorization
  
  -- Investment specific fields
  portfolio_id UUID REFERENCES investment_portfolios(id),
  investment_type TEXT, -- SIP, lumpsum, etc.
  
  -- Refund tracking
  refund_for UUID REFERENCES transactions(id), -- If this is a refund, reference to original transaction
  original_transaction_id UUID REFERENCES transactions(id), -- If original transaction was refunded
  
  -- Status and tracking
  status TEXT CHECK (status IN ('active', 'cancelled', 'refunded', 'partial_refund')) DEFAULT 'active' NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Ensure amount is positive for expenses and investments
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create transaction_history table for audit trail
CREATE TABLE transaction_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- What changed
  action TEXT CHECK (action IN ('created', 'updated', 'deleted', 'refunded', 'amount_reduced')) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changes_description TEXT,
  
  -- When and who
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX idx_investment_portfolios_user_id ON investment_portfolios(user_id);
CREATE INDEX idx_budget_configs_user_id ON budget_configs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_configs_updated_at BEFORE UPDATE ON budget_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_portfolios_updated_at BEFORE UPDATE ON investment_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Budget configs policies
CREATE POLICY "Users can manage own budget config" ON budget_configs FOR ALL USING (auth.uid() = user_id);

-- Investment portfolios policies
CREATE POLICY "Users can manage own portfolios" ON investment_portfolios FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Transaction history policies
CREATE POLICY "Users can view own transaction history" ON transaction_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transaction history" ON transaction_history FOR INSERT WITH CHECK (true);

-- Create function to log transaction changes
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO transaction_history (transaction_id, user_id, action, new_values, changes_description)
        VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW), 'Transaction created');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO transaction_history (transaction_id, user_id, action, old_values, new_values, changes_description)
        VALUES (NEW.id, NEW.user_id, 'updated', to_jsonb(OLD), to_jsonb(NEW), 'Transaction updated');
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO transaction_history (transaction_id, user_id, action, old_values, changes_description)
        VALUES (OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD), 'Transaction deleted');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for transaction audit trail
CREATE TRIGGER transaction_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();
