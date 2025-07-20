-- Update transactions table to support refund and investment types
-- and add missing fields expected by the application

-- Add new transaction types
ALTER TABLE transactions 
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
  ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense', 'refund', 'investment'));

-- Add missing fields that the application expects
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS payment_type text,
  ADD COLUMN IF NOT EXISTS spent_for text,
  ADD COLUMN IF NOT EXISTS refund_for text;

-- Update existing description field to be nullable since we have spent_for/refund_for
ALTER TABLE transactions 
  ALTER COLUMN description DROP NOT NULL;

-- Create an index for better filtering by type
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Add a trigger to automatically set spent_for or refund_for based on description
CREATE OR REPLACE FUNCTION sync_transaction_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If spent_for is not set but description is, copy it
  IF NEW.spent_for IS NULL AND NEW.description IS NOT NULL AND NEW.type = 'expense' THEN
    NEW.spent_for = NEW.description;
  END IF;
  
  -- If refund_for is not set but description is, copy it
  IF NEW.refund_for IS NULL AND NEW.description IS NOT NULL AND NEW.type = 'refund' THEN
    NEW.refund_for = NEW.description;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_transaction_fields_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_transaction_fields();

-- Create a view that matches the application's expected structure
CREATE OR REPLACE VIEW app_transactions AS
SELECT 
  id,
  user_id,
  amount,
  category,
  subcategory,
  COALESCE(spent_for, refund_for, description) as description,
  date,
  type,
  notes,
  tag,
  payment_type,
  spent_for,
  refund_for,
  created_at,
  updated_at
FROM transactions;

-- Grant access to the view
GRANT ALL ON app_transactions TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can manage own app_transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
