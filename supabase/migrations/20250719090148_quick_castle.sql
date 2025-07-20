/*
  # Initial Budget App Schema

  1. New Tables
    - `profiles` - User profile information
    - `budget_configs` - User salary and budget allocation settings
    - `investment_portfolios` - Investment portfolio configurations
    - `investment_categories` - Categories within portfolios
    - `investment_funds` - Individual funds within categories
    - `transactions` - Daily financial transactions
    - `monthly_summaries` - Monthly aggregated data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_configs table
CREATE TABLE IF NOT EXISTS budget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  monthly_salary numeric NOT NULL DEFAULT 0,
  budget_percentage numeric NOT NULL DEFAULT 70,
  allocation_need numeric NOT NULL DEFAULT 50,
  allocation_want numeric NOT NULL DEFAULT 30,
  allocation_savings numeric NOT NULL DEFAULT 15,
  allocation_investments numeric NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create investment_portfolios table
CREATE TABLE IF NOT EXISTS investment_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  allocation_type text NOT NULL CHECK (allocation_type IN ('percentage', 'amount')),
  allocation_value numeric NOT NULL DEFAULT 0,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  allow_direct_investment boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create investment_categories table
CREATE TABLE IF NOT EXISTS investment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES investment_portfolios(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  allocation_type text NOT NULL CHECK (allocation_type IN ('percentage', 'amount')),
  allocation_value numeric NOT NULL DEFAULT 0,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create investment_funds table
CREATE TABLE IF NOT EXISTS investment_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES investment_categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  invested_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL CHECK (category IN ('need', 'want', 'savings', 'investments')),
  subcategory text,
  description text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monthly_summaries table
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  total_income numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  need_spent numeric NOT NULL DEFAULT 0,
  want_spent numeric NOT NULL DEFAULT 0,
  savings_amount numeric NOT NULL DEFAULT 0,
  investments_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Budget configs policies
CREATE POLICY "Users can manage own budget config"
  ON budget_configs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Investment portfolios policies
CREATE POLICY "Users can manage own portfolios"
  ON investment_portfolios
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Investment categories policies
CREATE POLICY "Users can manage own categories"
  ON investment_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investment_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_portfolios 
      WHERE id = portfolio_id AND user_id = auth.uid()
    )
  );

-- Investment funds policies
CREATE POLICY "Users can manage own funds"
  ON investment_funds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investment_categories ic
      JOIN investment_portfolios ip ON ic.portfolio_id = ip.id
      WHERE ic.id = category_id AND ip.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investment_categories ic
      JOIN investment_portfolios ip ON ic.portfolio_id = ip.id
      WHERE ic.id = category_id AND ip.user_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Monthly summaries policies
CREATE POLICY "Users can manage own summaries"
  ON monthly_summaries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_configs_user_id ON budget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_portfolios_user_id ON investment_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_categories_portfolio_id ON investment_categories(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_investment_funds_category_id ON investment_funds(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_id ON monthly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_year_month ON monthly_summaries(year, month);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_configs_updated_at BEFORE UPDATE ON budget_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_portfolios_updated_at BEFORE UPDATE ON investment_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_categories_updated_at BEFORE UPDATE ON investment_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_funds_updated_at BEFORE UPDATE ON investment_funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_summaries_updated_at BEFORE UPDATE ON monthly_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();