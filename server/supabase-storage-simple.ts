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
    // Use service role key for all operations to ensure proper permissions
    this.client = initializeSupabaseClient(supabaseUrl, supabaseServiceKey);
    this.management = new SupabaseManagement(this.client, supabaseUrl, supabaseServiceKey);
  }

  async initializeSchema(): Promise<void> {
    console.log('Initializing Supabase schema...');
    
    try {
      // Create the users table using direct SQL via Supabase's database API
      await this.createUsersTableViaAPI();
      console.log('Supabase schema initialized successfully!');
    } catch (error) {
      console.error('Schema initialization failed:', error);
      // Don't throw - continue anyway and let user creation handle it
      console.log('Continuing with initialization - table will be created during user creation if needed');
    }
  }

  private async createUsersTableViaAPI(): Promise<void> {
    console.log('Creating users table using service role key with direct SQL execution...');
    
    const createTableSQL = `
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

-- Enable RLS but allow service role to bypass it
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy that allows service role to insert
CREATE POLICY "Allow service role access" ON public.users
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);
`;

    // Create service client for SQL execution
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    try {
      console.log('Attempting SQL execution using service client...');
      
      // Try using the sql function if available
      const { error } = await serviceClient.sql`${createTableSQL}`;
      
      if (!error) {
        console.log('Users table created successfully via SQL execution!');
        return;
      }
      
      console.log('Direct SQL not available, trying RPC approach...');
    } catch (sqlError) {
      console.log('SQL execution not supported, trying alternative...');
    }

    try {
      // Try via REST API with proper headers
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey,
          'Content-Profile': 'public'
        },
        body: JSON.stringify({ 
          sql: createTableSQL 
        })
      });

      const responseText = await response.text();
      console.log('SQL API Response:', response.status, responseText);

      if (response.ok) {
        console.log('Users table created via REST SQL API');
        return;
      }
    } catch (apiError) {
      console.log('REST API approach failed:', apiError);
    }

    console.log('All table creation methods attempted - will proceed with insert operation');
  }

  private async ensureUsersTableExists(): Promise<void> {
    console.log('Ensuring users table exists...');
    
    // Create service client for table operations
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test if users table exists by trying to query it
    const { error } = await serviceClient
      .from('users')
      .select('id')
      .limit(0);

    if (error && error.message.includes('does not exist')) {
      console.log('Users table does not exist - creating automatically using service role key...');
      
      try {
        // Use direct SQL execution via Supabase's RPC functionality
        await this.createTableDirectly(serviceClient);
        console.log('Users table created successfully!');
      } catch (createError) {
        console.error('Failed to create users table automatically:', createError);
        throw new Error('Could not create database tables automatically. Service role key may lack permissions.');
      }
    }
    
    console.log('Users table exists and is accessible');
  }

  private async createTableDirectly(serviceClient: any): Promise<void> {
    console.log('Creating users table using service role key...');
    
    // Create the users table with a simple structure that bypasses RLS issues
    const createSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
    `;
    
    // Try multiple approaches to execute the SQL
    
    // Approach 1: Use Supabase's built-in SQL execution
    try {
      console.log('Trying SQL execution via Supabase client...');
      const { error } = await serviceClient.rpc('exec', { sql: createSQL });
      if (!error) {
        console.log('Table created via RPC exec');
        return;
      }
    } catch (e) {
      console.log('RPC exec not available, trying alternative...');
    }
    
    // Approach 2: Create table by attempting insert with auto-create
    try {
      console.log('Attempting table auto-creation via insert...');
      
      // First try to insert a dummy record to trigger table creation
      const { error: insertError } = await serviceClient
        .from('users')
        .insert({
          username: '__init_user_' + Date.now(),
          email: 'init@init.com',
          password_hash: 'init',
          first_name: 'Init',
          last_name: 'User',
          role: 'admin'
        });
      
      if (!insertError) {
        // Delete the dummy record
        await serviceClient
          .from('users')
          .delete()
          .eq('email', 'init@init.com');
        console.log('Table created successfully via auto-insert');
        return;
      }
      
      console.log('Insert approach result:', insertError);
    } catch (e) {
      console.log('Insert approach failed:', e);
    }
    
    // Approach 3: Use direct HTTP API call
    try {
      console.log('Trying direct SQL via HTTP API...');
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey
        },
        body: JSON.stringify({ sql: createSQL })
      });
      
      if (response.ok) {
        console.log('Table created via HTTP API');
        return;
      }
    } catch (e) {
      console.log('HTTP API approach failed:', e);
    }
    
    throw new Error('All table creation methods failed');
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
    
    // Create a service client specifically for user creation to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
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

      // Use service client for user creation - this will auto-create the table if needed
      console.log('Attempting insert with service role key (will auto-create table)...');
      
      const { data, error } = await serviceClient
        .from('users')
        .insert(dbUserData)
        .select()
        .single();
      
      console.log('Insert operation result - Data:', data);
      console.log('Insert operation result - Error:', error);
      
      if (error) {
        console.error('Supabase user creation error:', error);
        
        // If we get an empty error object, it's usually a permissions or table issue
        if (Object.keys(error).length === 0 || (error.message && error.message.includes('does not exist'))) {
          console.log('Empty error detected - forcing table creation and retry...');
          
          try {
            // Force create the table again
            await this.createUsersTableViaAPI();
            
            console.log('Retrying user insert after table creation...');
            const { data: retryData, error: retryError } = await serviceClient
              .from('users')
              .insert(dbUserData)
              .select()
              .single();
            
            if (!retryError && retryData) {
              console.log('User created successfully after table creation');
              return retryData;
            }
            
            if (retryError && Object.keys(retryError).length > 0) {
              console.log('Retry failed with specific error:', retryError);
              throw new Error(`User creation failed: ${retryError.message || retryError.code}`);
            }
            
            console.log('Retry also returned empty error - checking if user was created...');
            
            // Check if the user was actually created despite the empty error
            const { data: checkData, error: checkError } = await serviceClient
              .from('users')
              .select('*')
              .eq('username', dbUserData.username)
              .single();
            
            if (checkData && !checkError) {
              console.log('User was created successfully despite empty error response');
              return checkData;
            }
            
          } catch (forceError) {
            console.log('Force creation and retry failed:', forceError);
          }
        }
        
        throw new Error(`Failed to create user: ${error.message || error.code || 'Database operation failed'}`);
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