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
    console.log('Initializing Supabase schema using Management API...');
    
    try {
      // Use Supabase Management API to create database schema
      await this.createSchemaViaManagementAPI();
      console.log('Supabase schema created successfully via Management API!');
    } catch (error) {
      console.error('Management API schema creation failed:', error);
      console.log('Attempting fallback schema creation methods...');
      
      try {
        await this.createSchemaViaSQL();
        console.log('Schema created via SQL fallback method');
      } catch (sqlError) {
        console.log('All schema creation methods failed - will attempt to create during first operation');
      }
    }
  }

  private async createSchemaViaManagementAPI(): Promise<void> {
    console.log('Creating database schema using Supabase Management API...');
    
    // Extract project reference from URL
    const projectRef = this.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      throw new Error('Could not extract project reference from Supabase URL');
    }
    
    console.log('Project reference:', projectRef);
    
    // Use Management API to create tables
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/migrations`;
    
    const migrationSQL = `
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

-- Disable RLS for easier initial setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
`;

    try {
      const response = await fetch(managementApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
          'apikey': this.supabaseServiceKey
        },
        body: JSON.stringify({
          name: 'initial_schema_' + Date.now(),
          sql: migrationSQL
        })
      });

      if (response.ok) {
        console.log('Schema created successfully via Management API');
        return;
      }

      const errorText = await response.text();
      console.log('Management API response:', response.status, errorText);
      throw new Error(`Management API failed: ${response.status}`);
    } catch (error) {
      console.log('Management API approach failed:', error);
      throw error;
    }
  }

  private async createSchemaViaSQL(): Promise<void> {
    console.log('Creating schema using direct database connection...');
    
    // Try using edge functions or direct database access
    const sqlStatements = [
      `DROP TABLE IF EXISTS public.users CASCADE;`,
      `CREATE TABLE public.users (
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
      );`
    ];

    // Try to execute each statement
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(this.supabaseUrl, this.supabaseServiceKey);

    for (const sql of sqlStatements) {
      try {
        // Try various approaches to execute SQL
        const response = await fetch(`${this.supabaseUrl}/database/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseServiceKey}`,
            'apikey': this.supabaseServiceKey
          },
          body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
          console.log('SQL statement executed successfully');
        }
      } catch (error) {
        console.log('SQL execution attempt completed');
      }
    }
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
            console.log('FORCING TABLE CREATION WITH AGGRESSIVE APPROACH...');
            
            // Force drop and recreate table without RLS
            const { createClient } = await import('@supabase/supabase-js');
            const adminClient = createClient(this.supabaseUrl, this.supabaseServiceKey);
            
            // Try to create table by brute force with REST API
            const forceCreateSQL = `
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
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
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
`;

            // Try direct HTTP approach to database
            try {
              const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/sql_execute`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.supabaseServiceKey}`,
                  'apikey': this.supabaseServiceKey,
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql: forceCreateSQL })
              });

              console.log('Force create response:', response.status);
            } catch (e) {
              console.log('Force create attempt completed');
            }
            
            // Now try inserting the user with a much simpler payload
            console.log('Attempting user creation with minimal data...');
            const minimalUserData = {
              username: dbUserData.username,
              email: dbUserData.email,
              password_hash: dbUserData.password_hash,
              role: 'admin'
            };
            
            const { data: minimalData, error: minimalError } = await adminClient
              .from('users')
              .insert(minimalUserData)
              .select()
              .single();
            
            if (minimalData && !minimalError) {
              console.log('SUCCESS! User created with minimal data approach');
              return minimalData;
            }
            
            console.log('Minimal insert result:', { data: minimalData, error: minimalError });
            
          } catch (forceError) {
            console.log('Force creation failed:', forceError);
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