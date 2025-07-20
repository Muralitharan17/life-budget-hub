# Supabase Setup Guide

This application requires a Supabase database to store your budget data. Follow these steps to set up Supabase:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Note your project URL and anon key

## 2. Set Environment Variables

Create a `.env.local` file in your project root with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Run Database Migrations

The application includes migration files in `supabase/migrations/`. Run these to set up your database:

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your_project_id`
4. Run migrations: `supabase db push`

## 4. Required Tables

The following tables will be created by the migrations:

- `profiles` - User profile information
- `budget_configs` - Salary and budget allocation settings
- `investment_portfolios` - Investment portfolio configurations
- `investment_categories` - Categories within portfolios
- `investment_funds` - Individual funds within categories
- `transactions` - Daily financial transactions
- `monthly_summaries` - Monthly aggregated data

## 5. Authentication

Enable authentication in your Supabase project:

1. Go to Authentication → Settings
2. Enable email authentication
3. Configure any additional providers you want

## Common Issues

### Tables Don't Exist (Error 42P01)

- Run the database migrations: `supabase db push`
- Check that your migrations ran successfully

### Access Denied (Error PGRST301)

- Row Level Security (RLS) is enabled by default
- The migrations include appropriate RLS policies
- Make sure you're authenticated when accessing the app

### Connection Failed

- Check your environment variables are set correctly
- Verify your Supabase project is active
- Check your internet connection

## Fallback Mode

If Supabase is not configured, the application will fall back to localStorage for development purposes. However, data will not persist across devices and month/year filtering may not work correctly.
