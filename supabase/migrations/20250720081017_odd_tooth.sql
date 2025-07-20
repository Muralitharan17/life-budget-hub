/*
  # Fix Profile-Based Schema Issues
  
  This migration ensures the database schema properly supports profile-based data isolation
  by checking and adding missing columns and constraints.
*/

-- First, let's check if profile_name columns exist and add them if missing

-- Add profile_name to budget_configs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_configs' AND column_name = 'profile_name') THEN
        ALTER TABLE budget_configs ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';
        
        -- Update unique constraint
        ALTER TABLE budget_configs DROP CONSTRAINT IF EXISTS budget_configs_user_id_key;
        ALTER TABLE budget_configs DROP CONSTRAINT IF EXISTS budget_configs_user_id_budget_period_id_key;
        ALTER TABLE budget_configs DROP CONSTRAINT IF EXISTS budget_configs_user_id_budget_year_budget_month_key;
        ALTER TABLE budget_configs ADD CONSTRAINT budget_configs_user_profile_period 
          UNIQUE(user_id, profile_name, budget_year, budget_month);
    END IF;
END $$;

-- Add profile_name to investment_portfolios if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'investment_portfolios' AND column_name = 'profile_name') THEN
        ALTER TABLE investment_portfolios ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';
    END IF;
END $$;

-- Add profile_name to transactions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'profile_name') THEN
        ALTER TABLE transactions ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';
    END IF;
END $$;

-- Add budget_year and budget_month to budget_configs if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budget_configs' AND column_name = 'budget_year') THEN
        ALTER TABLE budget_configs ADD COLUMN budget_year INTEGER;
        ALTER TABLE budget_configs ADD COLUMN budget_month INTEGER CHECK (budget_month >= 1 AND budget_month <= 12);
        
        -- Set default values for existing records
        UPDATE budget_configs SET 
          budget_year = EXTRACT(YEAR FROM created_at),
          budget_month = EXTRACT(MONTH FROM created_at)
        WHERE budget_year IS NULL OR budget_month IS NULL;
        
        -- Make them NOT NULL after setting values
        ALTER TABLE budget_configs ALTER COLUMN budget_year SET NOT NULL;
        ALTER TABLE budget_configs ALTER COLUMN budget_month SET NOT NULL;
    END IF;
END $$;

-- Add budget_year and budget_month to investment_portfolios if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'investment_portfolios' AND column_name = 'budget_year') THEN
        ALTER TABLE investment_portfolios ADD COLUMN budget_year INTEGER;
        ALTER TABLE investment_portfolios ADD COLUMN budget_month INTEGER CHECK (budget_month >= 1 AND budget_month <= 12);
        
        -- Set default values for existing records
        UPDATE investment_portfolios SET 
          budget_year = EXTRACT(YEAR FROM created_at),
          budget_month = EXTRACT(MONTH FROM created_at)
        WHERE budget_year IS NULL OR budget_month IS NULL;
        
        -- Make them NOT NULL after setting values
        ALTER TABLE investment_portfolios ALTER COLUMN budget_year SET NOT NULL;
        ALTER TABLE investment_portfolios ALTER COLUMN budget_month SET NOT NULL;
    END IF;
END $$;

-- Add budget_year and budget_month to transactions if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'budget_year') THEN
        ALTER TABLE transactions ADD COLUMN budget_year INTEGER;
        ALTER TABLE transactions ADD COLUMN budget_month INTEGER CHECK (budget_month >= 1 AND budget_month <= 12);
        
        -- Set default values for existing records based on transaction_date or date
        UPDATE transactions SET 
          budget_year = COALESCE(EXTRACT(YEAR FROM transaction_date), EXTRACT(YEAR FROM date), EXTRACT(YEAR FROM created_at)),
          budget_month = COALESCE(EXTRACT(MONTH FROM transaction_date), EXTRACT(MONTH FROM date), EXTRACT(MONTH FROM created_at))
        WHERE budget_year IS NULL OR budget_month IS NULL;
        
        -- Make them NOT NULL after setting values
        ALTER TABLE transactions ALTER COLUMN budget_year SET NOT NULL;
        ALTER TABLE transactions ALTER COLUMN budget_month SET NOT NULL;
    END IF;
END $$;

-- Ensure transaction_date column exists (rename from date if needed)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'transaction_date') THEN
        -- Check if 'date' column exists and rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'date') THEN
            ALTER TABLE transactions RENAME COLUMN date TO transaction_date;
        ELSE
            -- Add transaction_date column if neither exists
            ALTER TABLE transactions ADD COLUMN transaction_date DATE NOT NULL DEFAULT CURRENT_DATE;
        END IF;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_configs_user_profile_period 
  ON budget_configs(user_id, profile_name, budget_year, budget_month);

CREATE INDEX IF NOT EXISTS idx_investment_portfolios_user_profile_period 
  ON investment_portfolios(user_id, profile_name, budget_year, budget_month);

CREATE INDEX IF NOT EXISTS idx_transactions_user_profile_period 
  ON transactions(user_id, profile_name, budget_year, budget_month);

-- Update existing data to have proper profile names (default to 'murali')
UPDATE budget_configs SET profile_name = 'murali' WHERE profile_name IS NULL OR profile_name = '';
UPDATE investment_portfolios SET profile_name = 'murali' WHERE profile_name IS NULL OR profile_name = '';
UPDATE transactions SET profile_name = 'murali' WHERE profile_name IS NULL OR profile_name = '';

-- Ensure RLS policies exist and are correct
DROP POLICY IF EXISTS "Users can manage own budget configs" ON budget_configs;
CREATE POLICY "Users can manage own budget configs" 
  ON budget_configs FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own portfolios" ON investment_portfolios;
CREATE POLICY "Users can manage own portfolios" 
  ON investment_portfolios FOR ALL 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions" 
  ON transactions FOR ALL 
  USING (auth.uid() = user_id);