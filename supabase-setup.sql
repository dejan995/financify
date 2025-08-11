-- Complete Supabase Database Setup for Personal Finance Tracker
-- Run this SQL in your Supabase dashboard > SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  parent_id BIGINT REFERENCES public.categories(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  account_id BIGINT REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  receipt_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  category TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency TEXT NOT NULL,
  next_due_date DATE NOT NULL,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id BIGINT REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  auto_pay BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  barcode TEXT UNIQUE,
  last_price DECIMAL(10,2),
  average_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Create helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);

-- Grant necessary permissions (adjust if needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Confirm setup
SELECT 'Database setup completed successfully' as status;