-- Incremental migration to add missing columns to existing tables
-- This preserves existing data while adding new functionality

-- First, let's check and add missing columns to investment_portfolios
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'investment_portfolios' AND column_name = 'is_active') THEN
        ALTER TABLE investment_portfolios ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    END IF;
    
    -- Add allow_direct_investment column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'investment_portfolios' AND column_name = 'allow_direct_investment') THEN
        ALTER TABLE investment_portfolios ADD COLUMN allow_direct_investment BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

-- Add missing columns to transactions table
DO $$ 
BEGIN
    -- Add is_deleted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'is_deleted') THEN
        ALTER TABLE transactions ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'status') THEN
        ALTER TABLE transactions ADD COLUMN status TEXT CHECK (status IN ('active', 'cancelled', 'refunded', 'partial_refund')) DEFAULT 'active' NOT NULL;
    END IF;
    
    -- Add time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'time') THEN
        ALTER TABLE transactions ADD COLUMN time TIME;
    END IF;
    
    -- Add payment_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'payment_type') THEN
        ALTER TABLE transactions ADD COLUMN payment_type TEXT CHECK (payment_type IN ('cash', 'card', 'upi', 'netbanking', 'cheque', 'other'));
    END IF;
    
    -- Add spent_for column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'spent_for') THEN
        ALTER TABLE transactions ADD COLUMN spent_for TEXT;
    END IF;
    
    -- Add tag column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'tag') THEN
        ALTER TABLE transactions ADD COLUMN tag TEXT;
    END IF;
    
    -- Add portfolio_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'portfolio_id') THEN
        ALTER TABLE transactions ADD COLUMN portfolio_id UUID REFERENCES investment_portfolios(id);
    END IF;
    
    -- Add investment_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'investment_type') THEN
        ALTER TABLE transactions ADD COLUMN investment_type TEXT;
    END IF;
    
    -- Add refund_for column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'refund_for') THEN
        ALTER TABLE transactions ADD COLUMN refund_for UUID REFERENCES transactions(id);
    END IF;
    
    -- Add original_transaction_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'original_transaction_id') THEN
        ALTER TABLE transactions ADD COLUMN original_transaction_id UUID REFERENCES transactions(id);
    END IF;
    
    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'deleted_at') THEN
        ALTER TABLE transactions ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update transaction types to include new types if the column exists
DO $$ 
BEGIN
    -- Check if the type column has constraints and update them
    BEGIN
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
            CHECK (type IN ('expense', 'income', 'refund', 'investment', 'savings', 'transfer'));
    EXCEPTION WHEN OTHERS THEN
        -- If it fails, the constraint might not exist or have a different name
        NULL;
    END;
END $$;

-- Create transaction_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS transaction_history (
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_investment_portfolios_is_active ON investment_portfolios(is_active);
CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);

-- Enable RLS on transaction_history if it doesn't have it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transaction_history' 
        AND policyname = 'Users can view own transaction history'
    ) THEN
        ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own transaction history" 
            ON transaction_history FOR SELECT 
            USING (auth.uid() = user_id);
            
        CREATE POLICY "System can insert transaction history" 
            ON transaction_history FOR INSERT 
            WITH CHECK (true);
    END IF;
END $$;

-- Create or replace the audit function
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

-- Create the audit trigger if it doesn't exist
DROP TRIGGER IF EXISTS transaction_audit_trigger ON transactions;
CREATE TRIGGER transaction_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

-- Update existing transactions to have active status
UPDATE transactions SET status = 'active' WHERE status IS NULL;

-- Update existing portfolios to be active
UPDATE investment_portfolios SET is_active = true WHERE is_active IS NULL;
