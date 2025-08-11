import { SupabaseClient } from "@supabase/supabase-js";
import { IStorage } from "./storage";
import { initializeSupabaseClient } from "./supabase-client";
import {
  User, NewUser, SelectUser,
  Account, NewAccount, SelectAccount,
  Category, NewCategory, SelectCategory,
  Transaction, NewTransaction, SelectTransaction,
  Budget, NewBudget, SelectBudget,
  Goal, NewGoal, SelectGoal,
  Bill, NewBill, SelectBill,
  Product, NewProduct, SelectProduct,
  ActivityLog, NewActivityLog, SelectActivityLog,
  SystemConfig, NewSystemConfig, SelectSystemConfig
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
    // For Supabase, we need the user to create the schema manually
    // since the JavaScript client doesn't allow arbitrary SQL execution
    console.log('Supabase requires manual schema creation');
    
    const instructions = [
      "SUPABASE SETUP REQUIRED:",
      "",
      "The database tables don't exist yet. Please follow these steps:",
      "",
      "1. Open your Supabase project dashboard",
      "2. Go to the SQL Editor tab", 
      "3. Copy and paste the SQL schema from: server/supabase-schema.sql",
      "4. Click 'Run' to create all the required tables",
      "5. Return here and try the setup again",
      "",
      "The schema file contains all the necessary tables for the Personal Finance Tracker application."
    ].join('\n');
    
    throw new Error(instructions);
  }

  // User operations
  async getUserCount(): Promise<number> {
    const { count, error } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  async createUser(userData: NewUser): Promise<SelectUser> {
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserByUsername(username: string): Promise<SelectUser | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getUserByEmail(email: string): Promise<SelectUser | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getUserById(id: number): Promise<SelectUser | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateUser(id: number, userData: Partial<NewUser>): Promise<SelectUser> {
    const { data, error } = await this.client
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await this.client
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getUsers(): Promise<SelectUser[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Account operations
  async getAccounts(userId: number): Promise<SelectAccount[]> {
    const { data, error } = await this.client
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createAccount(accountData: NewAccount): Promise<SelectAccount> {
    const { data, error } = await this.client
      .from('accounts')
      .insert(accountData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateAccount(id: number, accountData: Partial<NewAccount>): Promise<SelectAccount> {
    const { data, error } = await this.client
      .from('accounts')
      .update(accountData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAccount(id: number): Promise<void> {
    const { error } = await this.client
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getAccountBalance(userId: number): Promise<number> {
    const { data, error } = await this.client
      .from('accounts')
      .select('balance')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return (data || []).reduce((total, account) => total + Number(account.balance), 0);
  }

  // Category operations
  async getCategories(userId: number): Promise<SelectCategory[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async createCategory(categoryData: NewCategory): Promise<SelectCategory> {
    const { data, error } = await this.client
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCategory(id: number, categoryData: Partial<NewCategory>): Promise<SelectCategory> {
    const { data, error } = await this.client
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: number): Promise<void> {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Transaction operations
  async getTransactions(userId: number, limit?: number, offset?: number): Promise<SelectTransaction[]> {
    let query = this.client
      .from('transactions')
      .select(`
        *,
        account:accounts(name, type),
        category:categories(name, color)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 50) - 1);

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  async createTransaction(transactionData: NewTransaction): Promise<SelectTransaction> {
    const { data, error } = await this.client
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTransaction(id: number, transactionData: Partial<NewTransaction>): Promise<SelectTransaction> {
    const { data, error } = await this.client
      .from('transactions')
      .update(transactionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTransaction(id: number): Promise<void> {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Budget operations
  async getBudgets(userId: number): Promise<SelectBudget[]> {
    const { data, error } = await this.client
      .from('budgets')
      .select(`
        *,
        category:categories(name, color)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createBudget(budgetData: NewBudget): Promise<SelectBudget> {
    const { data, error } = await this.client
      .from('budgets')
      .insert(budgetData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBudget(id: number, budgetData: Partial<NewBudget>): Promise<SelectBudget> {
    const { data, error } = await this.client
      .from('budgets')
      .update(budgetData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteBudget(id: number): Promise<void> {
    const { error } = await this.client
      .from('budgets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Goal operations
  async getGoals(userId: number): Promise<SelectGoal[]> {
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createGoal(goalData: NewGoal): Promise<SelectGoal> {
    const { data, error } = await this.client
      .from('goals')
      .insert(goalData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateGoal(id: number, goalData: Partial<NewGoal>): Promise<SelectGoal> {
    const { data, error } = await this.client
      .from('goals')
      .update(goalData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteGoal(id: number): Promise<void> {
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Bill operations
  async getBills(userId: number): Promise<SelectBill[]> {
    const { data, error } = await this.client
      .from('bills')
      .select(`
        *,
        account:accounts(name),
        category:categories(name, color)
      `)
      .eq('user_id', userId)
      .order('due_date');
    
    if (error) throw error;
    return data || [];
  }

  async createBill(billData: NewBill): Promise<SelectBill> {
    const { data, error } = await this.client
      .from('bills')
      .insert(billData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBill(id: number, billData: Partial<NewBill>): Promise<SelectBill> {
    const { data, error } = await this.client
      .from('bills')
      .update(billData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteBill(id: number): Promise<void> {
    const { error } = await this.client
      .from('bills')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Product operations
  async getProducts(userId: number): Promise<SelectProduct[]> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createProduct(productData: NewProduct): Promise<SelectProduct> {
    const { data, error } = await this.client
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProduct(id: number, productData: Partial<NewProduct>): Promise<SelectProduct> {
    const { data, error } = await this.client
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteProduct(id: number): Promise<void> {
    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Activity Log operations
  async getActivityLogs(userId: number, limit?: number): Promise<SelectActivityLog[]> {
    let query = this.client
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  async createActivityLog(logData: NewActivityLog): Promise<SelectActivityLog> {
    const { data, error } = await this.client
      .from('activity_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // System Config operations
  async getSystemConfig(key: string): Promise<SelectSystemConfig | null> {
    const { data, error } = await this.client
      .from('system_config')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async setSystemConfig(configData: NewSystemConfig): Promise<SelectSystemConfig> {
    const { data, error } = await this.client
      .from('system_config')
      .upsert(configData, { onConflict: 'key' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteSystemConfig(key: string): Promise<void> {
    const { error } = await this.client
      .from('system_config')
      .delete()
      .eq('key', key);
    
    if (error) throw error;
  }
}