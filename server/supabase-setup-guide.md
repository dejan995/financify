# Supabase Setup Guide

## Required Steps for Automatic Initialization

The new Supabase integration requires manual table creation in your Supabase dashboard before running the initialization wizard.

### 1. Go to your Supabase Dashboard

1. Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### 2. Create the Users Table

Copy and paste this SQL into the SQL Editor and click "Run":

```sql
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

-- Disable RLS for simpler initial setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### 3. Get Your Credentials

1. Go to "Settings" → "API" in your Supabase dashboard
2. Copy your:
   - **Project URL** (starts with `https://`)
   - **Anonymous Key** (public key)
   - **Service Role Key** (secret key - keep this secure!)

### 4. Run the Initialization Wizard

Now you can use the initialization wizard in the application with your Supabase credentials. The system will automatically verify the table exists and create your admin user.

## Why Manual Setup?

Supabase doesn't allow programmatic table creation through service role keys for security reasons. This one-time manual setup ensures proper database initialization while maintaining security best practices.