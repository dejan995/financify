import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorage } from './storage';
import type { 
  User, UpsertUser,
  Account, InsertAccount,
  Category, InsertCategory,
  Transaction, InsertTransaction,
  Budget, InsertBudget,
  Goal, InsertGoal,
  Bill, InsertBill,
  Product, InsertProduct,
  SystemConfig, InsertSystemConfig,
  ActivityLog, InsertActivityLog
} from '@shared/schema';

export class SupabaseStorageNew implements IStorage {
  private client: SupabaseClient;
  private serviceClient: SupabaseClient;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceKey: string;

  constructor(supabaseUrl: string, supabaseAnonKey: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.supabaseServiceKey = supabaseServiceKey;

    // Create both anon and service clients
    this.client = createClient(supabaseUrl, supabaseAnonKey);
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('SupabaseStorageNew initialized with both anon and service clients');
  }

  async initializeSchema(): Promise<void> {
    console.log('Supabase schema initialization - creating all required tables...');
    
    const tables = [
      { name: 'users', sql: this.getUsersTableSQL() },
      { name: 'accounts', sql: this.getAccountsTableSQL() },
      { name: 'categories', sql: this.getCategoriesTableSQL() }, 
      { name: 'transactions', sql: this.getTransactionsTableSQL() },
      { name: 'budgets', sql: this.getBudgetsTableSQL() },
      { name: 'goals', sql: this.getGoalsTableSQL() },
      { name: 'bills', sql: this.getBillsTableSQL() },
      { name: 'products', sql: this.getProductsTableSQL() }
    ];

    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        
        // First try to access the table to see if it exists
        const { error: testError } = await this.serviceClient
          .from(table.name)
          .select('*')
          .limit(1);

        if (testError && testError.message?.includes('does not exist')) {
          console.log(`Table ${table.name} doesn't exist, creating...`);
          
          // Create table using direct SQL execution
          const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.supabaseServiceKey}`,
              'apikey': this.supabaseServiceKey,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql: table.sql })
          });

          if (response.ok) {
            console.log(`✓ Table ${table.name} created successfully`);
            
            // Verify creation by testing access again
            const { error: verifyError } = await this.serviceClient
              .from(table.name)
              .select('*')
              .limit(1);
              
            if (verifyError) {
              console.log(`⚠ Table ${table.name} creation verification failed:`, verifyError.message);
            } else {
              console.log(`✓ Table ${table.name} verified working`);
            }
          } else {
            const errorText = await response.text();
            console.log(`Failed to create table ${table.name}:`, errorText);
            
            // If exec_sql doesn't exist, provide manual instructions
            if (errorText.includes('does not exist') || errorText.includes('function')) {
              console.log(`\n=== MANUAL TABLE CREATION REQUIRED ===`);
              console.log(`Go to your Supabase dashboard > SQL Editor and run:`);
              console.log(table.sql);
              console.log(`======================================\n`);
            }
          }
        } else {
          console.log(`✓ Table ${table.name} already exists and accessible`);
        }
      } catch (err) {
        console.log(`Error with table ${table.name}:`, err);
      }
    }

    console.log('Supabase schema initialization completed');
  }

  private getAllTablesSQL(): string {
    return `
${this.getUsersTableSQL()}
${this.getAccountsTableSQL()}
${this.getCategoriesTableSQL()}
${this.getTransactionsTableSQL()}
${this.getBudgetsTableSQL()}
${this.getGoalsTableSQL()}
${this.getBillsTableSQL()}
${this.getProductsTableSQL()}
`;
  }

  private getUsersTableSQL(): string {
    return `
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
`;
  }

  private getAccountsTableSQL(): string {
    return `
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
`;
  }

  private getCategoriesTableSQL(): string {
    return `
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
`;
  }

  private getTransactionsTableSQL(): string {
    return `
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
`;
  }

  private getBudgetsTableSQL(): string {
    return `
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
`;
  }

  private getGoalsTableSQL(): string {
    return `
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
`;
  }

  private getBillsTableSQL(): string {
    return `
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
`;
  }

  private getProductsTableSQL(): string {
    return `
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
`;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    console.log('Creating user in Supabase with service client...');
    
    const dbUserData = {
      username: userData.username,
      email: userData.email,
      password_hash: userData.passwordHash,
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      profile_image_url: userData.profileImageUrl || null,
      role: userData.role || 'user',
      is_active: userData.isActive ?? true,
      is_email_verified: userData.isEmailVerified ?? false,
      email_verification_token: userData.emailVerificationToken || null,
      password_reset_token: userData.passwordResetToken || null,
      password_reset_expires: userData.passwordResetExpires || null,
      last_login_at: userData.lastLoginAt || null,
    };

    console.log('Inserting user data:', JSON.stringify(dbUserData, null, 2));

    try {
      const { data, error } = await this.serviceClient
        .from('users')
        .insert(dbUserData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        
        if (error.message?.includes('does not exist')) {
          throw new Error('Users table does not exist. Please create it manually in Supabase dashboard first.');
        }
        
        if (error.message?.includes('duplicate key')) {
          throw new Error(`User with username "${userData.username}" or email "${userData.email}" already exists`);
        }

        throw new Error(`Failed to create user: ${error.message}`);
      }

      if (!data) {
        throw new Error('User creation succeeded but no data was returned');
      }

      console.log('User created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log(`[SupabaseStorage] Looking up user: ${username}`);
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined; // No rows found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    if (!data) return undefined;

    console.log(`[SupabaseStorage] Raw user data:`, JSON.stringify(data, null, 2));
    console.log(`[SupabaseStorage] is_active value:`, data.is_active, 'type:', typeof data.is_active);

    // Transform Supabase data to our User interface
    const transformedUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      passwordHash: data.password_hash,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      role: data.role,
      isActive: data.is_active,
      isEmailVerified: data.is_email_verified,
      emailVerificationToken: data.email_verification_token,
      passwordResetToken: data.password_reset_token,
      passwordResetExpires: data.password_reset_expires,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    console.log(`[SupabaseStorage] Transformed user:`, JSON.stringify(transformedUser, null, 2));
    return transformedUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined; // No rows found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    if (!data) return undefined;

    // Transform Supabase data to our User interface
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      passwordHash: data.password_hash,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      role: data.role,
      isActive: data.is_active,
      isEmailVerified: data.is_email_verified,
      emailVerificationToken: data.email_verification_token,
      passwordResetToken: data.password_reset_token,
      passwordResetExpires: data.password_reset_expires,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined; // No rows found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    if (!data) return undefined;

    // Transform Supabase data to our User interface
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      passwordHash: data.password_hash,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      role: data.role,
      isActive: data.is_active,
      isEmailVerified: data.is_email_verified,
      emailVerificationToken: data.email_verification_token,
      passwordResetToken: data.password_reset_token,
      passwordResetExpires: data.password_reset_expires,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }



  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User> {
    const dbUpdates: any = {};
    
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.isEmailVerified !== undefined) dbUpdates.is_email_verified = updates.isEmailVerified;
    if (updates.emailVerificationToken !== undefined) dbUpdates.email_verification_token = updates.emailVerificationToken;
    if (updates.passwordResetToken !== undefined) dbUpdates.password_reset_token = updates.passwordResetToken;
    if (updates.passwordResetExpires !== undefined) dbUpdates.password_reset_expires = updates.passwordResetExpires;
    if (updates.lastLoginAt !== undefined) dbUpdates.last_login_at = updates.lastLoginAt;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.serviceClient
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!data) {
      throw new Error('Update succeeded but no data was returned');
    }

    return data;
  }



  async getUserCount(): Promise<number> {
    const { count, error } = await this.serviceClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to get user count: ${error.message}`);
    }

    return count || 0;
  }

  // Helper method to test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.serviceClient
        .from('users')
        .select('count')
        .limit(1);

      if (error && error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Users table does not exist. Please create it manually in Supabase dashboard.'
        };
      }

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    const { data, error } = await this.serviceClient.from('accounts').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to get accounts: ${error.message}`);
    return data || [];
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await this.serviceClient.from('accounts').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get account: ${error.message}`);
    return data || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const { data, error } = await this.serviceClient.from('accounts').insert(account).select().single();
    if (error) throw new Error(`Failed to create account: ${error.message}`);
    return data;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const { data, error } = await this.serviceClient.from('accounts').update(account).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update account: ${error.message}`);
    return data || undefined;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('accounts').delete().eq('id', id);
    return !error;
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    const { data, error } = await this.serviceClient.from('categories').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to get categories: ${error.message}`);
    return data || [];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const { data, error } = await this.serviceClient.from('categories').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get category: ${error.message}`);
    return data || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await this.serviceClient.from('categories').insert(category).select().single();
    if (error) throw new Error(`Failed to create category: ${error.message}`);
    return data;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const { data, error } = await this.serviceClient.from('categories').update(category).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update category: ${error.message}`);
    return data || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('categories').delete().eq('id', id);
    return !error;
  }

  // Transaction methods
  async getTransactions(userId: number, filters?: {
    accountId?: number;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Transaction[]> {
    let query = this.serviceClient.from('transactions').select('*').eq('user_id', userId);
    
    if (filters?.accountId) query = query.eq('account_id', filters.accountId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);
    if (filters?.type) query = query.eq('type', filters.type);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get transactions: ${error.message}`);
    return data || [];
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const { data, error } = await this.serviceClient.from('transactions').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get transaction: ${error.message}`);
    return data || undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await this.serviceClient.from('transactions').insert(transaction).select().single();
    if (error) throw new Error(`Failed to create transaction: ${error.message}`);
    return data;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const { data, error } = await this.serviceClient.from('transactions').update(transaction).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update transaction: ${error.message}`);
    return data || undefined;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('transactions').delete().eq('id', id);
    return !error;
  }

  // Budget methods
  async getBudgets(userId: number): Promise<Budget[]> {
    const { data, error } = await this.serviceClient.from('budgets').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to get budgets: ${error.message}`);
    return data || [];
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const { data, error } = await this.serviceClient.from('budgets').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get budget: ${error.message}`);
    return data || undefined;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const { data, error } = await this.serviceClient.from('budgets').insert(budget).select().single();
    if (error) throw new Error(`Failed to create budget: ${error.message}`);
    return data;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const { data, error } = await this.serviceClient.from('budgets').update(budget).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update budget: ${error.message}`);
    return data || undefined;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('budgets').delete().eq('id', id);
    return !error;
  }

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    const { data, error } = await this.serviceClient.from('goals').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to get goals: ${error.message}`);
    return data || [];
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const { data, error } = await this.serviceClient.from('goals').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get goal: ${error.message}`);
    return data || undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const { data, error } = await this.serviceClient.from('goals').insert(goal).select().single();
    if (error) throw new Error(`Failed to create goal: ${error.message}`);
    return data;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const { data, error } = await this.serviceClient.from('goals').update(goal).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update goal: ${error.message}`);
    return data || undefined;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('goals').delete().eq('id', id);
    return !error;
  }

  // Bill methods
  async getBills(userId: number): Promise<Bill[]> {
    const { data, error } = await this.serviceClient.from('bills').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to get bills: ${error.message}`);
    return data || [];
  }

  async getBill(id: number): Promise<Bill | undefined> {
    const { data, error } = await this.serviceClient.from('bills').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get bill: ${error.message}`);
    return data || undefined;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const { data, error } = await this.serviceClient.from('bills').insert(bill).select().single();
    if (error) throw new Error(`Failed to create bill: ${error.message}`);
    return data;
  }

  async updateBill(id: number, bill: Partial<InsertBill>): Promise<Bill | undefined> {
    const { data, error } = await this.serviceClient.from('bills').update(bill).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update bill: ${error.message}`);
    return data || undefined;
  }

  async deleteBill(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('bills').delete().eq('id', id);
    return !error;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.serviceClient.from('products').select('*');
    if (error) throw new Error(`Failed to get products: ${error.message}`);
    return data || [];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const { data, error } = await this.serviceClient.from('products').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get product: ${error.message}`);
    return data || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const { data, error } = await this.serviceClient.from('products').select('*').eq('barcode', barcode).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get product by barcode: ${error.message}`);
    return data || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await this.serviceClient.from('products').insert(product).select().single();
    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return data;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const { data, error } = await this.serviceClient.from('products').update(product).eq('id', id).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update product: ${error.message}`);
    return data || undefined;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await this.serviceClient.from('products').select('*').ilike('name', `%${query}%`);
    if (error) throw new Error(`Failed to search products: ${error.message}`);
    return data || [];
  }

  // Analytics methods
  async getAccountBalance(userId: number): Promise<number> {
    const { data, error } = await this.serviceClient
      .from('transactions')
      .select('amount')
      .eq('user_id', userId);
    
    if (error) throw new Error(`Failed to get account balance: ${error.message}`);
    
    const balance = (data || []).reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
    return balance;
  }

  async getMonthlyIncome(userId: number, month: string): Promise<number> {
    const { data, error } = await this.serviceClient
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('date', `${month}-01`)
      .lt('date', `${month}-31`);
    
    if (error) throw new Error(`Failed to get monthly income: ${error.message}`);
    
    const income = (data || []).reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
    return income;
  }

  async getMonthlyExpenses(userId: number, month: string): Promise<number> {
    const { data, error } = await this.serviceClient
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', `${month}-01`)
      .lt('date', `${month}-31`);
    
    if (error) throw new Error(`Failed to get monthly expenses: ${error.message}`);
    
    const expenses = (data || []).reduce((total, transaction) => total + Math.abs(parseFloat(transaction.amount)), 0);
    return expenses;
  }

  async getCategorySpending(userId: number, startDate: string, endDate: string): Promise<{ categoryId: number; amount: number; categoryName: string }[]> {
    const { data, error } = await this.serviceClient
      .from('transactions')
      .select(`
        category_id,
        amount,
        categories!inner(name)
      `)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw new Error(`Failed to get category spending: ${error.message}`);
    
    const spending = (data || []).reduce((acc, transaction) => {
      const existing = acc.find(item => item.categoryId === transaction.category_id);
      if (existing) {
        existing.amount += Math.abs(parseFloat(transaction.amount));
      } else {
        acc.push({
          categoryId: transaction.category_id,
          amount: Math.abs(parseFloat(transaction.amount)),
          categoryName: (transaction.categories as any)?.name || 'Unknown'
        });
      }
      return acc;
    }, [] as { categoryId: number; amount: number; categoryName: string }[]);
    
    return spending;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.serviceClient.from('users').select('*');
    if (error) throw new Error(`Failed to get all users: ${error.message}`);
    return data || [];
  }

  async deleteUser(id: number): Promise<boolean> {
    const { error } = await this.serviceClient.from('users').delete().eq('id', id);
    return !error;
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }> {
    const { data, error } = await this.serviceClient.from('users').select('is_active, role');
    if (error) throw new Error(`Failed to get user stats: ${error.message}`);
    
    const stats = (data || []).reduce((acc, user) => {
      acc.totalUsers++;
      if (user.is_active) acc.activeUsers++;
      if (user.role === 'admin') acc.adminUsers++;
      return acc;
    }, { totalUsers: 0, activeUsers: 0, adminUsers: 0 });
    
    return stats;
  }

  // System config methods
  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    let query = this.serviceClient.from('system_configs').select('*');
    if (category) query = query.eq('category', category);
    
    const { data, error } = await query;
    if (error) throw new Error(`Failed to get system configs: ${error.message}`);
    return data || [];
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const { data, error } = await this.serviceClient.from('system_configs').select('*').eq('key', key).single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get system config: ${error.message}`);
    return data || undefined;
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const { data, error } = await this.serviceClient.from('system_configs').insert(config).select().single();
    if (error) throw new Error(`Failed to create system config: ${error.message}`);
    return data;
  }

  async updateSystemConfig(key: string, config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    const { data, error } = await this.serviceClient.from('system_configs').update(config).eq('key', key).select().single();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update system config: ${error.message}`);
    return data || undefined;
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    const { error } = await this.serviceClient.from('system_configs').delete().eq('key', key);
    return !error;
  }

  // Activity log methods
  async getActivityLogs(filters?: { userId?: number; action?: string; resource?: string; limit?: number }): Promise<ActivityLog[]> {
    let query = this.serviceClient.from('activity_logs').select('*');
    
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.action) query = query.eq('action', filters.action);
    if (filters?.resource) query = query.eq('resource', filters.resource);
    if (filters?.limit) query = query.limit(filters.limit);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to get activity logs: ${error.message}`);
    return data || [];
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const { data, error } = await this.serviceClient.from('activity_logs').insert(log).select().single();
    if (error) throw new Error(`Failed to create activity log: ${error.message}`);
    return data;
  }

  async deleteActivityLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const { count, error } = await this.serviceClient
      .from('activity_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) throw new Error(`Failed to delete activity logs: ${error.message}`);
    return count || 0;
  }

  // System stats method
  async getSystemStats(): Promise<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }> {
    try {
      const [transactions, accounts, categories, products] = await Promise.all([
        this.serviceClient.from('transactions').select('id', { count: 'exact', head: true }),
        this.serviceClient.from('accounts').select('id', { count: 'exact', head: true }),
        this.serviceClient.from('categories').select('id', { count: 'exact', head: true }),
        this.serviceClient.from('products').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalTransactions: transactions.count || 0,
        totalAccounts: accounts.count || 0,
        totalCategories: categories.count || 0,
        totalProducts: products.count || 0,
        systemHealth: 'healthy'
      };
    } catch (error) {
      return {
        totalTransactions: 0,
        totalAccounts: 0,
        totalCategories: 0,
        totalProducts: 0,
        systemHealth: 'error'
      };
    }
  }
}