-- Supabase Setup SQL
-- Run this in your Supabase SQL Editor to create all required tables

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id bigserial PRIMARY KEY,
  username varchar(50) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  profile_image_url text,
  role varchar(20) DEFAULT 'user',
  is_active boolean DEFAULT true,
  is_email_verified boolean DEFAULT false,
  email_verification_token varchar(255),
  password_reset_token varchar(255),
  password_reset_expires timestamp,
  last_login_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(20) NOT NULL,
  balance decimal(15,2) DEFAULT 0,
  currency varchar(3) DEFAULT 'USD',
  is_active boolean DEFAULT true,
  institution varchar(100),
  account_number varchar(50),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(20) NOT NULL,
  color varchar(7),
  parent_id bigint REFERENCES public.categories(id),
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  account_id bigint REFERENCES public.accounts(id) NOT NULL,
  category_id bigint REFERENCES public.categories(id),
  amount decimal(15,2) NOT NULL,
  description text,
  transaction_date date NOT NULL,
  type varchar(20) NOT NULL,
  status varchar(20) DEFAULT 'completed',
  reference_number varchar(100),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  category_id bigint REFERENCES public.categories(id) NOT NULL,
  name varchar(100) NOT NULL,
  amount decimal(15,2) NOT NULL,
  period varchar(20) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0,
  target_date date,
  status varchar(20) DEFAULT 'active',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  account_id bigint REFERENCES public.accounts(id) NOT NULL,
  category_id bigint REFERENCES public.categories(id),
  name varchar(100) NOT NULL,
  amount decimal(15,2) NOT NULL,
  due_date date NOT NULL,
  frequency varchar(20) NOT NULL,
  is_recurring boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_paid_date date,
  next_due_date date,
  auto_pay boolean DEFAULT false,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES public.users(id) NOT NULL,
  name varchar(200) NOT NULL,
  brand varchar(100),
  category varchar(100),
  barcode varchar(50),
  average_price decimal(10,2),
  unit varchar(20),
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (admins can manage all users, users can only see themselves)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (role = 'admin');

-- Create policies for other tables (users can only access their own data)
CREATE POLICY "Users can manage their own accounts" ON public.accounts
  FOR ALL USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can manage their own goals" ON public.goals
  FOR ALL USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can manage their own bills" ON public.bills
  FOR ALL USING (user_id = auth.uid()::bigint);

CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (user_id = auth.uid()::bigint);