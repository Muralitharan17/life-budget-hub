/*
  # Add Profile-Based Data Isolation

  1. Schema Changes
    - Add `profile_name` column to all relevant tables
    - Update unique constraints to include profile_name
    - Maintain backward compatibility with existing data
    
  2. Data Migration
    - Set default profile_name for existing data
    - Update constraints and indexes
    
  3. Security
    - Update RLS policies to include profile_name filtering
    - Maintain user-level security while adding profile isolation
*/

-- Add profile_name column to budget_periods
ALTER TABLE budget_periods 
ADD COLUMN IF NOT EXISTS profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- Add profile_name column to budget_configs
ALTER TABLE budget_configs 
ADD COLUMN IF NOT EXISTS profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- Add profile_name column to investment_portfolios
ALTER TABLE investment_portfolios 
ADD COLUMN IF NOT EXISTS profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- Add profile_name column to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- Add profile_name column to transaction_history
ALTER TABLE transaction_history 
ADD COLUMN IF NOT EXISTS profile_name VARCHAR(50) NOT NULL DEFAULT 'murali';

-- Drop existing unique constraints and recreate with profile_name
ALTER TABLE budget_periods DROP CONSTRAINT IF EXISTS budget_periods_user_id_budget_year_budget_month_key;
ALTER TABLE budget_periods ADD CONSTRAINT budget_periods_user_profile_period 
  UNIQUE(user_id, profile_name, budget_year, budget_month);

ALTER TABLE budget_configs DROP CONSTRAINT IF EXISTS budget_configs_user_id_budget_period_id_key;
ALTER TABLE budget_configs DROP CONSTRAINT IF EXISTS budget_configs_user_id_budget_year_budget_month_key;
ALTER TABLE budget_configs ADD CONSTRAINT budget_configs_user_profile_period 
  UNIQUE(user_id, profile_name, budget_year, budget_month);

-- Update the period_name generation to include profile
ALTER TABLE budget_periods 
DROP COLUMN IF EXISTS period_name;

ALTER TABLE budget_periods 
ADD COLUMN period_name TEXT GENERATED ALWAYS AS (
  profile_name || '_' || budget_year || '-' || LPAD(budget_month::TEXT, 2, '0')
) STORED;

-- Create new indexes for profile-based queries
CREATE INDEX IF NOT EXISTS idx_budget_periods_user_profile_period 
  ON budget_periods(user_id, profile_name, budget_year, budget_month);

CREATE INDEX IF NOT EXISTS idx_budget_configs_user_profile_period 
  ON budget_configs(user_id, profile_name, budget_year, budget_month);

CREATE INDEX IF NOT EXISTS idx_investment_portfolios_user_profile_period 
  ON investment_portfolios(user_id, profile_name, budget_year, budget_month);

CREATE INDEX IF NOT EXISTS idx_transactions_user_profile_period 
  ON transactions(user_id, profile_name, budget_year, budget_month);

CREATE INDEX IF NOT EXISTS idx_transaction_history_user_profile_period 
  ON transaction_history(user_id, profile_name, budget_year, budget_month);

-- Update the ensure_budget_period function to include profile_name
CREATE OR REPLACE FUNCTION ensure_budget_period(p_user_id UUID, p_profile_name VARCHAR(50), p_year INTEGER, p_month INTEGER)
RETURNS UUID AS $$
DECLARE
    period_id UUID;
BEGIN
    -- Try to get existing period
    SELECT id INTO period_id
    FROM budget_periods
    WHERE user_id = p_user_id 
      AND profile_name = p_profile_name 
      AND budget_year = p_year 
      AND budget_month = p_month;
    
    -- Create if doesn't exist
    IF period_id IS NULL THEN
        INSERT INTO budget_periods (user_id, profile_name, budget_year, budget_month)
        VALUES (p_user_id, p_profile_name, p_year, p_month)
        RETURNING id INTO period_id;
    END IF;
    
    RETURN period_id;
END;
$$ language 'plpgsql';

-- Update the sync_budget_period_data function to include profile_name
CREATE OR REPLACE FUNCTION sync_budget_period_data()
RETURNS TRIGGER AS $$
DECLARE
    period_id UUID;
BEGIN
    -- Ensure budget period exists and get its ID
    period_id := ensure_budget_period(NEW.user_id, NEW.profile_name, NEW.budget_year, NEW.budget_month);
    
    -- Set the budget_period_id
    NEW.budget_period_id := period_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update the transaction audit function to include profile_name
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO transaction_history (
            transaction_id, user_id, profile_name, budget_year, budget_month,
            action, new_values, changes_description
        )
        VALUES (
            NEW.id, NEW.user_id, NEW.profile_name, NEW.budget_year, NEW.budget_month,
            'created', to_jsonb(NEW), 'Transaction created'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO transaction_history (
            transaction_id, user_id, profile_name, budget_year, budget_month,
            action, old_values, new_values, changes_description
        )
        VALUES (
            NEW.id, NEW.user_id, NEW.profile_name, NEW.budget_year, NEW.budget_month,
            'updated', to_jsonb(OLD), to_jsonb(NEW), 'Transaction updated'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO transaction_history (
            transaction_id, user_id, profile_name, budget_year, budget_month,
            action, old_values, changes_description
        )
        VALUES (
            OLD.id, OLD.user_id, OLD.profile_name, OLD.budget_year, OLD.budget_month,
            'deleted', to_jsonb(OLD), 'Transaction deleted'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Update the current_month_summary view to include profile_name
DROP VIEW IF EXISTS current_month_summary;
CREATE OR REPLACE VIEW current_month_summary AS
SELECT 
    bp.user_id,
    bp.profile_name,
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
GROUP BY bp.user_id, bp.profile_name, bp.budget_year, bp.budget_month, bp.period_name, 
         bc.monthly_salary, bc.budget_percentage, bc.allocation_need, 
         bc.allocation_want, bc.allocation_savings, bc.allocation_investments;

-- Grant access to the updated view
GRANT SELECT ON current_month_summary TO authenticated;

-- Update RLS policies to include profile_name (policies remain user-scoped for security)
-- The profile filtering will be handled at the application level

-- Create a helper function to get available profiles for a user
CREATE OR REPLACE FUNCTION get_user_profiles(p_user_id UUID)
RETURNS TABLE(profile_name VARCHAR(50), last_activity TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        bp.profile_name,
        MAX(bp.updated_at) as last_activity
    FROM budget_periods bp
    WHERE bp.user_id = p_user_id
    GROUP BY bp.profile_name
    ORDER BY last_activity DESC;
END;
$$ language 'plpgsql';

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_profiles(UUID) TO authenticated;