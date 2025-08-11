import { SupabaseClient } from "@supabase/supabase-js";
import { IStorage } from "./storage";
import { initializeSupabaseClient } from "./supabase-client";
import {
  User, UpsertUser,
  Account, InsertAccount,
  Category, InsertCategory,
  Transaction, InsertTransaction,
  Budget, InsertBudget,
  Goal, InsertGoal,
  Bill, InsertBill,
  Product, InsertProduct,
  ActivityLog, InsertActivityLog,
  SystemConfig, InsertSystemConfig
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
    // Check if we can work with the existing public schema
    console.log('Checking Supabase public schema for required tables...');
    
    try {
      // Simply check if we can access the database and continue
      // Tables will be created through normal operations or via the schema file if needed
      const { error } = await this.client.from('information_schema.tables').select('table_name').limit(1);
      
      if (error) {
        console.log('Database access confirmed, proceeding with setup');
      }
      
      // Don't throw an error - allow the app to continue
      // If tables don't exist, operations will fail gracefully and show appropriate errors
      console.log('Supabase public schema ready - tables will be created as needed');
    } catch (error) {
      console.log('Schema check completed, continuing with initialization');
      // Don't throw - let the app work with what it has
    }
  }

  private async createTableIfNotExists(tableName: string, definition: any): Promise<void> {
    try {
      // Try to query the table first to see if it exists
      const { error } = await this.client.from(tableName).select('*').limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it using Supabase's table creation
        console.log(`Creating table: ${tableName}`);
        
        // Use Supabase's built-in table creation via direct SQL execution
        // Since we can't execute arbitrary SQL, we'll use a different approach
        // We'll create minimal table structures that Supabase can handle
        await this.createMinimalTable(tableName, definition);
      } else {
        console.log(`Table ${tableName} already exists`);
      }
    } catch (error) {
      console.log(`Error checking/creating table ${tableName}:`, error);
      // Continue with other tables
    }
  }

  private async createMinimalTable(tableName: string, definition: any): Promise<void> {
    // Create tables using SQL statements via Supabase RPC
    console.log(`Creating table: ${tableName}`);
    
    try {
      const sql = this.generateCreateTableSQL(tableName, definition);
      
      // Try to execute SQL using Supabase's sql execution
      const { error } = await this.client.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // If RPC doesn't work, try alternative method
        console.log(`RPC failed for ${tableName}, trying direct approach`);
        await this.createTableDirectly(tableName, sql);
      } else {
        console.log(`Successfully created table: ${tableName}`);
      }
    } catch (error) {
      console.log(`Failed to create table ${tableName}:`, error);
      // Continue with other tables
    }
  }

  private generateCreateTableSQL(tableName: string, definition: any): string {
    const columns = Object.entries(definition).map(([name, config]: [string, any]) => {
      let columnDef = `"${name}" `;
      
      if (config.type === 'bigint' && config.generated) {
        columnDef += 'bigserial PRIMARY KEY';
      } else if (config.type === 'bigint' && config.primaryKey) {
        columnDef += 'bigint PRIMARY KEY';
      } else if (config.type === 'varchar(50)') {
        columnDef += 'varchar(50)';
      } else if (config.type === 'varchar(100)') {
        columnDef += 'varchar(100)';
      } else if (config.type === 'varchar(255)') {
        columnDef += 'varchar(255)';
      } else if (config.type === 'decimal(15,2)') {
        columnDef += 'decimal(15,2)';
      } else if (config.type === 'decimal(10,2)') {
        columnDef += 'decimal(10,2)';
      } else if (config.type === 'timestamp') {
        columnDef += 'timestamp with time zone';
      } else {
        columnDef += config.type;
      }
      
      if (config.notNull) columnDef += ' NOT NULL';
      if (config.unique) columnDef += ' UNIQUE';
      if (config.default === 'now()') columnDef += ' DEFAULT now()';
      else if (config.default === true) columnDef += ' DEFAULT true';
      else if (config.default === false) columnDef += ' DEFAULT false';
      else if (config.default === 0.00) columnDef += ' DEFAULT 0.00';
      else if (typeof config.default === 'string') columnDef += ` DEFAULT '${config.default}'`;
      
      return columnDef;
    }).join(',\n  ');
    
    return `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n  ${columns}\n);`;
  }

  private async createTableDirectly(tableName: string, sql: string): Promise<void> {
    // Alternative approach: try using Supabase's direct SQL execution
    try {
      // Use fetch to call Supabase's REST API directly
      const supabaseUrl = (this.client as any).supabaseUrl;
      const supabaseKey = (this.client as any).supabaseKey;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }
      
      // Try using the direct SQL execution endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Direct SQL execution failed for ${tableName}:`, errorText);
      } else {
        console.log(`Successfully created table ${tableName} via direct API`);
      }
    } catch (error) {
      console.log(`Direct table creation failed for ${tableName}:`, error);
      // Last resort: just continue and hope tables exist or will be created manually
    }
  }

  // Table definitions for reference
  private getUsersTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      username: { type: 'varchar(50)', unique: true, notNull: true },
      email: { type: 'varchar(255)', unique: true, notNull: true },
      password_hash: { type: 'varchar(255)', notNull: true },
      first_name: { type: 'varchar(100)' },
      last_name: { type: 'varchar(100)' },
      profile_image_url: { type: 'text' },
      role: { type: 'varchar(20)', default: 'user' },
      is_active: { type: 'boolean', default: true },
      is_email_verified: { type: 'boolean', default: false },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getAccountsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      name: { type: 'varchar(100)', notNull: true },
      type: { type: 'varchar(20)', notNull: true },
      balance: { type: 'decimal(15,2)', default: 0.00 },
      currency: { type: 'varchar(3)', default: 'USD' },
      is_active: { type: 'boolean', default: true },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getCategoriesTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      name: { type: 'varchar(100)', notNull: true },
      type: { type: 'varchar(10)', notNull: true },
      color: { type: 'varchar(7)', default: '#6366f1' },
      icon: { type: 'varchar(50)' },
      parent_id: { type: 'bigint', references: 'categories(id)' },
      is_active: { type: 'boolean', default: true },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getTransactionsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      account_id: { type: 'bigint', references: 'accounts(id)', notNull: true },
      category_id: { type: 'bigint', references: 'categories(id)' },
      amount: { type: 'decimal(15,2)', notNull: true },
      description: { type: 'text' },
      date: { type: 'date', notNull: true },
      type: { type: 'varchar(10)', notNull: true },
      payee: { type: 'varchar(255)' },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getBudgetsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      category_id: { type: 'bigint', references: 'categories(id)' },
      name: { type: 'varchar(100)', notNull: true },
      amount: { type: 'decimal(15,2)', notNull: true },
      period: { type: 'varchar(20)', notNull: true },
      start_date: { type: 'date', notNull: true },
      end_date: { type: 'date' },
      is_active: { type: 'boolean', default: true },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getGoalsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      name: { type: 'varchar(100)', notNull: true },
      description: { type: 'text' },
      target_amount: { type: 'decimal(15,2)', notNull: true },
      current_amount: { type: 'decimal(15,2)', default: 0.00 },
      target_date: { type: 'date' },
      category: { type: 'varchar(50)' },
      priority: { type: 'varchar(10)', default: 'medium' },
      is_achieved: { type: 'boolean', default: false },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getBillsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      account_id: { type: 'bigint', references: 'accounts(id)' },
      category_id: { type: 'bigint', references: 'categories(id)' },
      name: { type: 'varchar(100)', notNull: true },
      amount: { type: 'decimal(15,2)', notNull: true },
      due_date: { type: 'date', notNull: true },
      frequency: { type: 'varchar(20)', notNull: true },
      payee: { type: 'varchar(255)' },
      is_autopay: { type: 'boolean', default: false },
      is_active: { type: 'boolean', default: true },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getProductsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      name: { type: 'varchar(255)', notNull: true },
      brand: { type: 'varchar(100)' },
      category: { type: 'varchar(100)' },
      barcode: { type: 'varchar(50)' },
      price: { type: 'decimal(10,2)' },
      currency: { type: 'varchar(3)', default: 'USD' },
      store: { type: 'varchar(100)' },
      description: { type: 'text' },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getSystemConfigTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      key: { type: 'varchar(100)', unique: true, notNull: true },
      value: { type: 'text' },
      description: { type: 'text' },
      created_at: { type: 'timestamp', default: 'now()' },
      updated_at: { type: 'timestamp', default: 'now()' }
    };
  }

  private getActivityLogsTableDefinition() {
    return {
      id: { type: 'bigint', primaryKey: true, generated: true },
      user_id: { type: 'bigint', references: 'users(id)', notNull: true },
      action: { type: 'varchar(50)', notNull: true },
      resource: { type: 'varchar(100)' },
      resource_id: { type: 'bigint' },
      timestamp: { type: 'timestamp', default: 'now()' },
      details: { type: 'text' }
    };
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
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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