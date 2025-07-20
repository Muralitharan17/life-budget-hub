-- Database migration to add profile-based data isolation
-- This script adds profile_name columns to all tables and updates constraints

-- 1. Add profile_name column to budget_configs
ALTER TABLE budget_configs 
ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- 2. Add profile_name column to investment_portfolios
ALTER TABLE investment_portfolios 
ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- 3. Add profile_name column to transactions
ALTER TABLE transactions 
ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- 4. Add profile_name column to transaction_history
ALTER TABLE transaction_history 
ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- 5. Update unique constraints for budget_configs
-- Drop existing constraint if it exists
DROP INDEX IF EXISTS budget_configs_user_month_year;
DROP INDEX IF EXISTS budget_configs_user_profile_period;

-- Create new unique constraint that includes profile_name
CREATE UNIQUE INDEX budget_configs_user_profile_period 
ON budget_configs(user_id, profile_name, budget_month, budget_year);

-- 6. Update unique constraints for investment_portfolios if needed
-- Create unique constraint for portfolio names per user, profile, and period
DROP INDEX IF EXISTS investment_portfolios_user_profile_name_period;
CREATE UNIQUE INDEX investment_portfolios_user_profile_name_period 
ON investment_portfolios(user_id, profile_name, name, budget_month, budget_year)
WHERE is_active = true;

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_configs_profile_period 
ON budget_configs(profile_name, budget_month, budget_year);

CREATE INDEX IF NOT EXISTS idx_investment_portfolios_profile_period 
ON investment_portfolios(profile_name, budget_month, budget_year);

CREATE INDEX IF NOT EXISTS idx_transactions_profile_period 
ON transactions(profile_name, budget_month, budget_year);

CREATE INDEX IF NOT EXISTS idx_transaction_history_profile_period 
ON transaction_history(profile_name, budget_month, budget_year);

-- 8. Update existing data to set appropriate profile names
-- For now, set all existing data to 'murali' profile
-- This can be adjusted based on actual user data migration needs

-- Note: The default value 'murali' ensures existing data is not lost
-- and can be migrated to appropriate profiles later if needed

-- Optional: Add check constraints to ensure valid profile names
ALTER TABLE budget_configs 
ADD CONSTRAINT budget_configs_profile_name_check 
CHECK (profile_name IN ('murali', 'valar'));

ALTER TABLE investment_portfolios 
ADD CONSTRAINT investment_portfolios_profile_name_check 
CHECK (profile_name IN ('murali', 'valar'));

ALTER TABLE transactions 
ADD CONSTRAINT transactions_profile_name_check 
CHECK (profile_name IN ('murali', 'valar'));

ALTER TABLE transaction_history 
ADD CONSTRAINT transaction_history_profile_name_check 
CHECK (profile_name IN ('murali', 'valar'));
