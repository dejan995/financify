-- Supabase Setup SQL for Personal Finance Tracker
-- Run this once in your Supabase SQL Editor to create all required tables

-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
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

-- Accounts table for financial accounts
CREATE TABLE IF NOT EXISTS accounts (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(20) NOT NULL,
  balance decimal(15,2) DEFAULT 0.00,
  currency varchar(3) DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Categories table for transaction categorization
CREATE TABLE IF NOT EXISTS categories (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(10) NOT NULL,
  color varchar(7) DEFAULT '#6366f1',
  icon varchar(50),
  parent_id bigint REFERENCES categories(id),
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Transactions table for financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  account_id bigint REFERENCES accounts(id) NOT NULL,
  category_id bigint REFERENCES categories(id),
  amount decimal(15,2) NOT NULL,
  description text,
  date date NOT NULL,
  type varchar(10) NOT NULL,
  payee varchar(255),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Budgets table for budget management
CREATE TABLE IF NOT EXISTS budgets (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  category_id bigint REFERENCES categories(id),
  name varchar(100) NOT NULL,
  amount decimal(15,2) NOT NULL,
  period varchar(20) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Goals table for financial goals
CREATE TABLE IF NOT EXISTS goals (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0.00,
  target_date date,
  category varchar(50),
  priority varchar(10) DEFAULT 'medium',
  is_achieved boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Bills table for bill management
CREATE TABLE IF NOT EXISTS bills (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  account_id bigint REFERENCES accounts(id),
  category_id bigint REFERENCES categories(id),
  name varchar(100) NOT NULL,
  amount decimal(15,2) NOT NULL,
  due_date date NOT NULL,
  frequency varchar(20) NOT NULL,
  payee varchar(255),
  is_autopay boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Products table for receipt scanning
CREATE TABLE IF NOT EXISTS products (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  name varchar(255) NOT NULL,
  brand varchar(100),
  category varchar(100),
  barcode varchar(50),
  price decimal(10,2),
  currency varchar(3) DEFAULT 'USD',
  store varchar(100),
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  id bigserial PRIMARY KEY,
  key varchar(100) UNIQUE NOT NULL,
  value text,
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) NOT NULL,
  action varchar(50) NOT NULL,
  resource varchar(100),
  resource_id bigint,
  timestamp timestamp DEFAULT now(),
  details text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);