# Profile Architecture Fix Plan

## Problem Statement
Currently, the application has inconsistent profile handling:
- Supabase data is user-based (single user account)
- UI shows profile switching (Murali/Valar) but data isn't isolated
- Configuration for one profile affects the other profile

## Root Cause
The `currentUser` state (murali/valar/combined) is only used for UI display and localStorage operations, but ALL Supabase operations ignore this and save to the single logged-in user account.

## Required Database Schema Changes

### 1. Add Profile Column to All Tables
```sql
-- Add profile_name to budget_configs
ALTER TABLE budget_configs ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'default';

-- Add profile_name to investment_portfolios  
ALTER TABLE investment_portfolios ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'default';

-- Add profile_name to transactions
ALTER TABLE transactions ADD COLUMN profile_name VARCHAR(50) NOT NULL DEFAULT 'default';

-- Update unique constraints
DROP INDEX IF EXISTS budget_configs_user_month_year;
CREATE UNIQUE INDEX budget_configs_user_profile_period 
ON budget_configs(user_id, profile_name, budget_month, budget_year);
```

### 2. Update TypeScript Interfaces
```typescript
export interface BudgetConfig {
  id: string;
  user_id: string;
  profile_name: string;  // NEW FIELD
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
```

## Required Code Changes

### 1. Update useBudgetData Hook
```typescript
export function useBudgetData(month: number, year: number, profileName: string) {
  // Add profileName parameter and use in all queries
  const { data: budgetData, error: budgetError } = await supabase
    .from('budget_configs')
    .select('*')
    .eq('user_id', user.id)
    .eq('profile_name', profileName)  // NEW FILTER
    .eq('budget_month', month)
    .eq('budget_year', year)
    .maybeSingle();
}
```

### 2. Update All Save Functions
```typescript
const handleSalaryUpdate = async (
  salary: number,
  percentage: number,
  allocation: BudgetAllocation,
) => {
  await saveBudgetConfig({
    monthly_salary: salary,
    budget_percentage: percentage,
    allocation_need: allocation.need,
    allocation_want: allocation.want,
    allocation_savings: allocation.savings,
    allocation_investments: allocation.investments,
    profile_name: currentUser,  // NEW FIELD
  });
};
```

### 3. Update BudgetDashboard Component
```typescript
// Pass currentUser to useBudgetData
const {
  budgetConfig,
  portfolios,
  transactions: supabaseTransactions,
  loading: dataLoading,
  saveBudgetConfig,
  saveInvestmentPortfolio,
  addTransaction,
  refetch,
} = useBudgetData(selectedMonth, selectedYear, currentUser);
```

## Implementation Steps

### Phase 1: Database Migration
1. Add profile_name columns to all tables
2. Set default values for existing data
3. Update constraints and indexes

### Phase 2: Backend Updates
1. Update all Supabase queries to include profile_name
2. Update all insert/update operations
3. Test data isolation

### Phase 3: Frontend Updates
1. Update useBudgetData hook
2. Update all save functions
3. Update data flow in BudgetDashboard
4. Test profile switching

### Phase 4: Data Migration
1. Migrate existing localStorage data to appropriate profiles
2. Handle data conflicts
3. Provide migration UI for users

## Benefits After Fix

✅ **True Profile Isolation**: Murali and Valar have completely separate data
✅ **Shared Account**: Both can use the same login but maintain separate budgets
✅ **Combined View**: Still works for household budget analysis
✅ **Data Integrity**: No accidental cross-profile data contamination
✅ **Scalable**: Can easily add more profiles (kids, business, etc.)

## Alternative Solutions

### Option A: Separate User Accounts
- Pro: Complete isolation, simple implementation
- Con: Requires multiple email accounts, no shared household view

### Option B: Profile-Based Partitioning (Current + Fix)
- Pro: Single account, shared access, proper isolation
- Con: Requires database schema changes

### Option C: Hybrid Approach
- Pro: Flexible, can handle both scenarios
- Con: Complex implementation, potential confusion

## Recommendation
Implement Option B (Profile-Based Partitioning) as it provides the best user experience while maintaining proper data isolation.
