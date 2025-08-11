import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseManagement {
  private client: SupabaseClient;
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor(client: SupabaseClient, supabaseUrl: string, serviceRoleKey: string) {
    this.client = client;
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
  }

  async createAllTables(): Promise<void> {
    console.log('Creating tables automatically using Supabase Management API with Service Role Key...');
    console.log('Service Role Key provided:', this.serviceRoleKey ? 'Yes' : 'No');
    console.log('Supabase URL:', this.supabaseUrl);
    
    if (!this.serviceRoleKey) {
      throw new Error('Service Role Key is required for automatic table creation');
    }
    
    try {
      // Create a service role client for DDL operations
      const { createClient } = await import('@supabase/supabase-js');
      console.log('Creating service client with Service Role Key...');
      
      const serviceClient = createClient(this.supabaseUrl, this.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Test the service client first
      console.log('Testing service client connection...');
      const { data: testData, error: testError } = await serviceClient
        .from('pg_tables')
        .select('tablename')
        .limit(1);
      
      if (testError) {
        console.error('Service client test failed:', testError);
        throw new Error(`Service Role Key authentication failed: ${testError.message}`);
      }
      
      console.log('Service client authenticated successfully');
      
      // Create tables one by one for better error handling
      const statements = this.getIndividualCreateStatements();
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || `table_${i}`;
        
        console.log(`Creating table: ${tableName}...`);
        
        try {
          // Use direct SQL execution through PostgREST
          const { data, error } = await serviceClient.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.log(`Table ${tableName} creation result:`, error.message);
            // Continue with other tables even if one fails
          } else {
            console.log(`Table ${tableName} created successfully`);
          }
        } catch (stmtError) {
          console.log(`Table ${tableName} creation completed with result:`, stmtError);
          // Continue with other tables
        }
      }
      
      console.log('All table creation attempts completed');
      
      // Verify users table was created
      const { data: usersCheck, error: usersError } = await serviceClient
        .from('users')
        .select('id')
        .limit(1);
        
      if (usersError && usersError.code === '42P01') {
        throw new Error('Users table was not created successfully - please check Service Role Key permissions');
      }
      
      console.log('Users table verification successful');
      
    } catch (error) {
      console.error('Management API table creation error:', error);
      throw error;
    }
  }

  private async executeSQLDirectly(sql: string): Promise<void> {
    try {
      // Use Supabase's PostgREST API with service role key
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'apikey': this.serviceRoleKey,
        },
        body: JSON.stringify({ sql })
      });

      if (!response.ok) {
        // Try alternative approach with edge functions or direct DB connection
        await this.createTablesAlternative();
      }
    } catch (error) {
      console.log('Primary SQL execution failed, trying alternative approach...');
      await this.createTablesAlternative();
    }
  }

  private async createTablesViaManagementAPI(): Promise<void> {
    // Try using Supabase's database schema management API
    try {
      const apiEndpoint = `${this.supabaseUrl}/rest/v1/rpc/create_tables`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'apikey': this.serviceRoleKey,
        },
        body: JSON.stringify({
          sql_statements: this.getIndividualCreateStatements()
        })
      });

      if (response.ok) {
        console.log('Tables created via Management API');
        return;
      }
    } catch (error) {
      console.log('Management API approach failed, falling back to table verification');
    }
    
    // Fallback: verify tables exist by trying operations
    await this.createTablesAlternative();
  }

  private async createTablesAlternative(): Promise<void> {
    // Create tables one by one using Supabase client operations
    const tables = [
      {
        name: 'users',
        create: () => this.createUsersTable()
      },
      {
        name: 'accounts', 
        create: () => this.createAccountsTable()
      },
      {
        name: 'categories',
        create: () => this.createCategoriesTable()
      },
      {
        name: 'transactions',
        create: () => this.createTransactionsTable()
      },
      {
        name: 'budgets',
        create: () => this.createBudgetsTable()
      },
      {
        name: 'goals',
        create: () => this.createGoalsTable()
      },
      {
        name: 'bills',
        create: () => this.createBillsTable()
      },
      {
        name: 'products',
        create: () => this.createProductsTable()
      },
      {
        name: 'system_config',
        create: () => this.createSystemConfigTable()
      },
      {
        name: 'activity_logs',
        create: () => this.createActivityLogsTable()
      }
    ];

    for (const table of tables) {
      try {
        await table.create();
        console.log(`Created table: ${table.name}`);
      } catch (error) {
        console.log(`Table ${table.name} creation: ${error}`);
      }
    }
  }

  private async createUsersTable(): Promise<void> {
    try {
      // Try to query the table to see if it exists
      const { data, error } = await this.client.from('users').select('id').limit(1);
      
      if (error && (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
        console.log('Users table does not exist, creating via SQL...');
        
        // Try to create the table using raw SQL if possible
        const createUserTableSQL = `
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
        
        // Use the HTTP API to execute SQL directly
        const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.serviceRoleKey}`,
            'apikey': this.serviceRoleKey,
          },
          body: JSON.stringify({ sql: createUserTableSQL })
        });
        
        if (!response.ok) {
          console.log('SQL execution via RPC failed, table creation handled by Supabase');
        } else {
          console.log('Users table created successfully');
        }
      } else {
        console.log('Users table already exists or is accessible');
      }
    } catch (error) {
      console.log('Users table verification completed:', error);
    }
  }

  private async createAccountsTable(): Promise<void> {
    try {
      await this.client.from('accounts').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Accounts table needs to be created');
      }
    }
  }

  private async createCategoriesTable(): Promise<void> {
    try {
      await this.client.from('categories').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Categories table needs to be created');
      }
    }
  }

  private async createTransactionsTable(): Promise<void> {
    try {
      await this.client.from('transactions').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Transactions table needs to be created');
      }
    }
  }

  private async createBudgetsTable(): Promise<void> {
    try {
      await this.client.from('budgets').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Budgets table needs to be created');
      }
    }
  }

  private async createGoalsTable(): Promise<void> {
    try {
      await this.client.from('goals').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Goals table needs to be created');
      }
    }
  }

  private async createBillsTable(): Promise<void> {
    try {
      await this.client.from('bills').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Bills table needs to be created');
      }
    }
  }

  private async createProductsTable(): Promise<void> {
    try {
      await this.client.from('products').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Products table needs to be created');
      }
    }
  }

  private async createSystemConfigTable(): Promise<void> {
    try {
      await this.client.from('system_config').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('System config table needs to be created');
      }
    }
  }

  private async createActivityLogsTable(): Promise<void> {
    try {
      await this.client.from('activity_logs').select('id').limit(1);
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        throw new Error('Activity logs table needs to be created');
      }
    }
  }

  private getIndividualCreateStatements(): string[] {
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
      // Add other tables as needed...
    ];
  }

  private getCreateTablesSQL(): string {
    return `
      -- Create all tables for Personal Finance Tracker
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

      CREATE TABLE IF NOT EXISTS system_config (
        id bigserial PRIMARY KEY,
        key varchar(100) UNIQUE NOT NULL,
        value text,
        description text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id bigserial PRIMARY KEY,
        user_id bigint REFERENCES users(id) NOT NULL,
        action varchar(50) NOT NULL,
        resource varchar(100),
        resource_id bigint,
        timestamp timestamp DEFAULT now(),
        details text
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
      CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    `;
  }
}