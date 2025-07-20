# Enhanced Budget Tracker Setup

This guide will help you set up the enhanced database schema with full CRUD operations and datetime tracking.

## 🔥 IMPORTANT: Database Recreation

This setup will **DELETE ALL EXISTING DATA** and recreate tables with enhanced structure. Make sure to backup any important data before proceeding.

## Step 1: Apply the Migration

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Go to "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire content from `supabase/migrations/20250720000000_recreate_all_tables.sql`
   - Paste it in the SQL Editor
   - Click "Run" to execute

## Step 2: Verify Tables Created

After running the migration, verify these tables exist:

- ✅ `profiles` - User profile information
- ✅ `budget_configs` - Budget configuration and salary info
- ✅ `investment_portfolios` - Investment portfolio definitions
- ✅ `transactions` - All transactions with full datetime tracking
- ✅ `transaction_history` - Audit trail for all changes

## Step 3: Test the Application

1. **Refresh your application**
2. **Login/Signup** - This will create your profile
3. **Configure your budget** - Set salary and allocations
4. **Add transactions** - Test all modules (Need, Want, Savings, Investments)

## 🆕 New Features Available

### Enhanced Transaction Management

- **Full CRUD Operations**: Create, Read, Update, Delete
- **Soft Delete**: Transactions are marked as deleted, not permanently removed
- **Refund Processing**: Full and partial refunds with audit trail
- **Investment Amount Reduction**: Reduce investment amounts with history tracking
- **Enhanced Datetime Tracking**: Separate date and time fields for precise tracking

### Transaction Types Supported

- `expense` - Regular expenses (Need/Want)
- `income` - Income transactions
- `refund` - Refund transactions
- `investment` - Investment transactions
- `savings` - Savings transactions
- `transfer` - Transfer between categories

### Status Tracking

- `active` - Normal active transaction
- `cancelled` - Cancelled transaction
- `refunded` - Fully refunded transaction
- `partial_refund` - Partially refunded transaction

### Audit Trail

- Complete history of all changes
- Track who made changes and when
- Store old and new values for all updates

## 🔧 Available Operations

### Budget Configuration

```typescript
// Save/Update budget config
const { data, error } = await saveBudgetConfig({
  monthly_salary: 50000,
  budget_percentage: 100,
  allocation_need: 50,
  allocation_want: 30,
  allocation_savings: 10,
  allocation_investments: 10,
});
```

### Investment Portfolios

```typescript
// Create portfolio
await saveInvestmentPortfolio({
  name: "Mutual Funds",
  allocation_type: "percentage",
  allocation_value: 60,
  allow_direct_investment: true,
});

// Update portfolio
await updateInvestmentPortfolio(portfolioId, {
  invested_amount: 25000,
});

// Delete portfolio (soft delete)
await deleteInvestmentPortfolio(portfolioId);
```

### Transactions

```typescript
// Add transaction
await addTransaction({
  type: "expense",
  category: "need",
  amount: 1500,
  description: "Groceries",
  date: "2025-01-20",
  time: "14:30:00",
  payment_type: "upi",
  spent_for: "Monthly groceries",
  tag: "food",
});

// Update transaction
await updateTransaction(transactionId, {
  amount: 1600,
  notes: "Updated amount after checking receipt",
});

// Delete transaction
await deleteTransaction(transactionId); // Soft delete

// Process refund
await refundTransaction(originalTransactionId, 500, "Defective product");

// Reduce investment amount
await reduceInvestmentAmount(investmentId, 1000, "Market correction");
```

## 🛡️ Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Audit Trail**: All changes are logged with timestamps
- **Soft Deletes**: Data is preserved for audit purposes
- **Foreign Key Constraints**: Data integrity is maintained

## 📊 Month/Year Filtering

The new system properly filters data by month and year:

- Transactions are filtered at the database level
- Improved performance with proper indexing
- Accurate monthly reports and summaries

## 🐛 Troubleshooting

### If tables don't exist:

1. Check if the migration ran successfully
2. Verify RLS policies are created
3. Check for any SQL errors in the output

### If data isn't showing:

1. Check browser console for errors
2. Verify user is authenticated
3. Check RLS policies allow access

### If network errors persist:

1. Verify Supabase URL and API key
2. Check internet connectivity
3. Application falls back to localStorage when Supabase is unavailable

## 📝 Migration Notes

This migration:

- ✅ Drops all existing tables
- ✅ Creates new enhanced schema
- ✅ Sets up proper relationships and constraints
- ✅ Enables RLS for security
- ✅ Creates audit triggers
- ✅ Adds performance indexes

**Important**: All existing data will be lost. This is a fresh start with the enhanced schema.
