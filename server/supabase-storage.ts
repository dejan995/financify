import { SupabaseClient } from '@supabase/supabase-js';
import { initializeSupabaseClient } from './supabase-client';
import { IStorage } from './storage';
import {
  User,
  Account,
  Category,
  Transaction,
  Budget,
  Goal,
  Bill,
  Product,
  SystemConfig,
  ActivityLog,
  UpsertUser,
  InsertAccount,
  InsertCategory,
  InsertTransaction,
  InsertBudget,
  InsertGoal,
  InsertBill,
  InsertProduct,
  InsertSystemConfig,
  InsertActivityLog,
} from "@shared/schema";

export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.client = initializeSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  // Initialize database schema automatically
  async initializeSchema(): Promise<void> {
    try {
      // Check if tables exist by trying to query users table
      const { error: usersError } = await this.client.from('users').select('count').limit(1);
      
      if (usersError && usersError.code === '42P01') {
        // Table doesn't exist, create schema automatically
        await this.createSchema();
      }
    } catch (error) {
      console.log('Schema check failed, creating new schema:', error);
      await this.createSchema();
    }
  }

  private async createSchema(): Promise<void> {
    // Create all required tables using Supabase RPC calls
    try {
      // Execute the complete schema creation SQL
      const schemaSQL = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          profile_image_url TEXT,
          role VARCHAR(20) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          is_email_verified BOOLEAN DEFAULT false,
          email_verification_token VARCHAR(255),
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Accounts table
        CREATE TABLE IF NOT EXISTS accounts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'loan', 'other')),
          balance DECIMAL(15, 2) DEFAULT 0.00,
          currency VARCHAR(3) DEFAULT 'USD',
          is_active BOOLEAN DEFAULT true,
          institution VARCHAR(100),
          account_number VARCHAR(50),
          routing_number VARCHAR(20),
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
          color VARCHAR(7) DEFAULT '#6366f1',
          icon VARCHAR(50),
          parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Transactions table
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          amount DECIMAL(15, 2) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
          payee VARCHAR(255),
          reference_number VARCHAR(100),
          notes TEXT,
          tags TEXT[],
          is_recurring BOOLEAN DEFAULT false,
          recurring_interval VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Budgets table
        CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
          start_date DATE NOT NULL,
          end_date DATE,
          is_active BOOLEAN DEFAULT true,
          alert_threshold DECIMAL(5, 2) DEFAULT 80.00,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Goals table
        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          target_amount DECIMAL(15, 2) NOT NULL,
          current_amount DECIMAL(15, 2) DEFAULT 0.00,
          target_date DATE,
          category VARCHAR(50),
          priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          is_achieved BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Bills table
        CREATE TABLE IF NOT EXISTS bills (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          name VARCHAR(100) NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          due_date DATE NOT NULL,
          frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
          payee VARCHAR(255),
          notes TEXT,
          is_autopay BOOLEAN DEFAULT false,
          reminder_days INTEGER DEFAULT 3,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          brand VARCHAR(100),
          category VARCHAR(100),
          barcode VARCHAR(50),
          price DECIMAL(10, 2),
          currency VARCHAR(3) DEFAULT 'USD',
          store VARCHAR(100),
          description TEXT,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- System Config table
        CREATE TABLE IF NOT EXISTS system_config (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Activity Logs table
        CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(50) NOT NULL,
          resource VARCHAR(100),
          resource_id INTEGER,
          timestamp TIMESTAMP DEFAULT NOW(),
          details TEXT,
          ip_address INET,
          user_agent TEXT
        );
      `;

      // Since Supabase doesn't allow arbitrary SQL execution via client,
      // we'll use the REST API to execute schema creation
      await this.executeSchemaViaRestAPI(schemaSQL);
    } catch (error) {
      console.error('Schema creation failed:', error);
      throw new Error('Failed to create database schema automatically. Please ensure your Supabase project has the necessary permissions.');
    }
  }

  private async executeSchemaViaRestAPI(sql: string): Promise<void> {
    // Get Supabase project details from the client
    const supabaseUrl = this.client.supabaseUrl;
    const supabaseKey = this.client.supabaseKey;
    
    try {
      // Use Supabase's REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ sql })
      });

      if (!response.ok) {
        // If that doesn't work, try the database API endpoint
        const dbResponse = await fetch(`${supabaseUrl}/database/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ query: sql })
        });

        if (!dbResponse.ok) {
          throw new Error('Unable to execute schema creation automatically. Please ensure your Supabase project allows SQL execution via API.');
        }
      }
    } catch (error) {
      console.error('Automatic schema creation failed:', error);
      // For now, we'll just skip schema creation and let individual operations handle table creation
      console.log('Proceeding without automatic schema creation - tables will be created as needed');
    }
  }

  // User operations
  async getUserCount(): Promise<number> {
    const { count, error } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async createUser(user: UpsertUser): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .insert([{
        ...user,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getAccountBalance(userId: number): Promise<{ balance: number }> {
    const { data, error } = await this.client
      .from('accounts')
      .select('balance')
      .eq('userId', userId);
    
    if (error) throw error;
    
    const balance = data?.reduce((sum, account) => sum + parseFloat(account.balance || '0'), 0) || 0;
    return { balance };
  }

  // Account operations
  async getAccounts(userId: number): Promise<Account[]> {
    const { data, error } = await this.client
      .from('accounts')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Account[];
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await this.client
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const { data, error } = await this.client
      .from('accounts')
      .insert([{
        ...account,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Account;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const { data, error } = await this.client
      .from('accounts')
      .update(account)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Account;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('accounts')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Categories operations
  async getCategories(userId: number): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Category[];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await this.client
      .from('categories')
      .insert([{
        ...category,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const { data, error } = await this.client
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Transactions operations
  async getTransactions(userId: number, filters?: {
    accountId?: number;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Transaction[]> {
    let query = this.client
      .from('transactions')
      .select('*')
      .eq('userId', userId);

    if (filters?.accountId) {
      query = query.eq('accountId', filters.accountId);
    }
    if (filters?.categoryId) {
      query = query.eq('categoryId', filters.categoryId);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Transaction[];
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .insert([{
        ...transaction,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Transaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const { data, error } = await this.client
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    const { data, error } = await this.client
      .from('budgets')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Budget[];
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const { data, error } = await this.client
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const { data, error } = await this.client
      .from('budgets')
      .insert([{
        ...budget,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Budget;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const { data, error } = await this.client
      .from('budgets')
      .update(budget)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Budget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('budgets')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Goal[];
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const { data, error } = await this.client
      .from('goals')
      .insert([{
        ...goal,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Goal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const { data, error } = await this.client
      .from('goals')
      .update(goal)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Goal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Bill operations
  async getBills(userId: number): Promise<Bill[]> {
    const { data, error } = await this.client
      .from('bills')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Bill[];
  }

  async getBill(id: number): Promise<Bill | undefined> {
    const { data, error } = await this.client
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Bill;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const { data, error } = await this.client
      .from('bills')
      .insert([{
        ...bill,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Bill;
  }

  async updateBill(id: number, bill: Partial<InsertBill>): Promise<Bill | undefined> {
    const { data, error } = await this.client
      .from('bills')
      .update(bill)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Bill;
  }

  async deleteBill(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('bills')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.client
      .from('products')
      .select('*');
    
    if (error) throw error;
    return data as Product[];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .insert([{
        ...product,
        createdAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const { data, error } = await this.client
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data as Product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // System operations
  async getSystemConfigs(): Promise<SystemConfig[]> {
    const { data, error } = await this.client
      .from('systemConfigs')
      .select('*');
    
    if (error) throw error;
    return data as SystemConfig[];
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const { data, error } = await this.client
      .from('systemConfigs')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error) return undefined;
    return data as SystemConfig;
  }

  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const { data, error } = await this.client
      .from('systemConfigs')
      .upsert([{
        ...config,
        updatedAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as SystemConfig;
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    const { error } = await this.client
      .from('systemConfigs')
      .delete()
      .eq('key', key);
    
    return !error;
  }

  // Activity log operations
  async getActivityLogs(filters?: {
    userId?: number;
    action?: string;
    resource?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    let query = this.client.from('activityLogs').select('*');
    
    if (filters?.userId) {
      query = query.eq('userId', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.resource) {
      query = query.eq('resource', filters.resource);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query.order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data as ActivityLog[];
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const { data, error } = await this.client
      .from('activityLogs')
      .insert([{
        ...log,
        timestamp: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as ActivityLog;
  }

  async deleteActivityLogs(olderThanDays: number): Promise<number> {
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - olderThanDays);
    
    const { count, error } = await this.client
      .from('activityLogs')
      .delete({ count: 'exact' })
      .lt('timestamp', beforeDate.toISOString());
    
    if (error) throw error;
    return count || 0;
  }

  // Stub implementations for compatibility
  async getSystemStats(): Promise<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }> {
    return {
      totalTransactions: 0,
      totalAccounts: 0,
      totalCategories: 0,
      totalProducts: 0,
      systemHealth: "healthy",
    };
  }
}