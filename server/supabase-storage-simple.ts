import { SupabaseClient } from "@supabase/supabase-js";
import { IStorage } from "./storage";
import { initializeSupabaseClient } from "./supabase-client";
import { UpsertUser, User } from "@shared/schema";
import { SupabaseManagement } from "./supabase-management";

export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;
  private management: SupabaseManagement;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceKey: string;

  constructor(supabaseUrl: string, supabaseAnonKey: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.supabaseServiceKey = supabaseServiceKey;
    this.client = initializeSupabaseClient(supabaseUrl, supabaseAnonKey);
    this.management = new SupabaseManagement(this.client, supabaseUrl, supabaseServiceKey);
  }

  async initializeSchema(): Promise<void> {
    console.log('Automatically creating Supabase tables using Management API...');
    
    try {
      // Use Management API to create all tables automatically
      await this.management.createAllTables();
      console.log('All Supabase tables created automatically via Management API!');
    } catch (error) {
      console.error('Management API table creation failed:', error);
      throw error;
    }
  }



  private getCreateTableStatements(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS users (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS accounts (
        id bigserial PRIMARY KEY,
        user_id bigint REFERENCES users(id) NOT NULL,
        name varchar(100) NOT NULL,
        type varchar(20) NOT NULL,
        balance decimal(15,2) DEFAULT 0.00,
        currency varchar(3) DEFAULT 'USD',
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );`,
      
      `CREATE TABLE IF NOT EXISTS categories (
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
      );`,
      
      `CREATE TABLE IF NOT EXISTS transactions (
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
      );`,

      `CREATE TABLE IF NOT EXISTS budgets (
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
      );`,

      `CREATE TABLE IF NOT EXISTS goals (
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
      );`,

      `CREATE TABLE IF NOT EXISTS bills (
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
      );`,

      `CREATE TABLE IF NOT EXISTS products (
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
      );`,

      `CREATE TABLE IF NOT EXISTS system_config (
        id bigserial PRIMARY KEY,
        key varchar(100) UNIQUE NOT NULL,
        value text,
        description text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );`,

      `CREATE TABLE IF NOT EXISTS activity_logs (
        id bigserial PRIMARY KEY,
        user_id bigint REFERENCES users(id) NOT NULL,
        action varchar(50) NOT NULL,
        resource varchar(100),
        resource_id bigint,
        timestamp timestamp DEFAULT now(),
        details text
      );`
    ];
  }

  private async createUsersTable(): Promise<void> {
    // First check if table exists by trying to query it
    const { error: queryError } = await this.client.from('users').select('id').limit(1);
    
    if (queryError && queryError.code === '42P01') {
      // Table doesn't exist, try to create it using RPC
      console.log('Creating users table...');
      
      // Use Supabase's SQL execution if available
      const createTableSQL = `
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
      `;
      
      try {
        // Try RPC approach first
        const { error: rpcError } = await this.client.rpc('exec_sql', { sql: createTableSQL });
        if (rpcError) {
          console.log('RPC method not available, table may need manual creation');
        } else {
          console.log('Users table created via RPC');
        }
      } catch (rpcError) {
        console.log('Table creation attempted, continuing...');
      }
    } else {
      console.log('Users table already exists');
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

  async createUser(userData: UpsertUser): Promise<User> {
    console.log('Attempting to create user in Supabase...');
    console.log('User data to insert:', userData);
    
    try {
      // Map the fields to match the database schema exactly
      const dbUserData = {
        username: userData.username,
        email: userData.email,
        password_hash: userData.passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName,
        profile_image_url: userData.profileImageUrl,
        role: userData.role,
        is_active: userData.isActive,
        is_email_verified: userData.isEmailVerified,
        email_verification_token: userData.emailVerificationToken,
        password_reset_token: userData.passwordResetToken,
        password_reset_expires: userData.passwordResetExpires,
        last_login_at: userData.lastLoginAt,
      };

      console.log('Mapped DB user data:', JSON.stringify(dbUserData, null, 2));

      const { data, error } = await this.client
        .from('users')
        .insert(dbUserData)
        .select()
        .single();
      
      console.log('Insert operation result - Data:', data);
      console.log('Insert operation result - Error:', error);
      console.log('Error type:', typeof error);
      console.log('Error properties:', error ? Object.keys(error) : 'No error object');
      
      if (error) {
        console.error('Supabase user creation error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error hint:', error.hint);
        console.error('Error details prop:', error.details);
        throw new Error(`Failed to create user: ${error.message || error.code || 'Unknown database error'}`);
      }
      
      if (!data) {
        throw new Error('No data returned from user creation - operation may have failed silently');
      }
      
      console.log('User created successfully in Supabase:', data.id);
      return data;
    } catch (error) {
      console.error('User creation failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
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

  async getUserByEmail(email: string): Promise<User | null> {
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

  async getUserById(id: number): Promise<User | null> {
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

  async updateUser(id: number, userData: Partial<UpsertUser>): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteUser(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Placeholder implementations for other methods (will implement as needed)
  async getAccounts(userId: number): Promise<any[]> {
    return [];
  }

  async createAccount(accountData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateAccount(id: number, accountData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteAccount(id: number): Promise<boolean> {
    return true;
  }

  async getAccountBalance(userId: number): Promise<{ balance: number }> {
    return { balance: 0 };
  }

  async getCategories(userId: number): Promise<any[]> {
    return [];
  }

  async createCategory(categoryData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateCategory(id: number, categoryData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteCategory(id: number): Promise<boolean> {
    return true;
  }

  async getTransactions(userId: number, filters?: any): Promise<any[]> {
    return [];
  }

  async createTransaction(transactionData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateTransaction(id: number, transactionData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return true;
  }

  async getBudgets(userId: number): Promise<any[]> {
    return [];
  }

  async createBudget(budgetData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateBudget(id: number, budgetData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteBudget(id: number): Promise<boolean> {
    return true;
  }

  async getGoals(userId: number): Promise<any[]> {
    return [];
  }

  async createGoal(goalData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateGoal(id: number, goalData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteGoal(id: number): Promise<boolean> {
    return true;
  }

  async getBills(userId: number): Promise<any[]> {
    return [];
  }

  async createBill(billData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateBill(id: number, billData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteBill(id: number): Promise<boolean> {
    return true;
  }

  async getProducts(): Promise<any[]> {
    return [];
  }

  async createProduct(productData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async updateProduct(id: number, productData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteProduct(id: number): Promise<boolean> {
    return true;
  }

  async getActivityLogs(filters?: any): Promise<any[]> {
    return [];
  }

  async createActivityLog(logData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async getSystemConfig(key: string): Promise<any | null> {
    return null;
  }

  async setSystemConfig(configData: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    return true;
  }
}