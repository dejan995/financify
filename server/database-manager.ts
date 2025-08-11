import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool } from '@neondatabase/serverless';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { DatabaseConfig, DatabaseProvider, MigrationLog, databaseProviderInfo } from '@shared/database-config';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class DatabaseManager {
  private connections: Map<string, any> = new Map();
  private activeConnectionId: string | null = null;
  private configs: Map<string, DatabaseConfig> = new Map();
  private migrationLogs: Map<string, MigrationLog> = new Map();

  constructor() {
    this.loadConfigurations();
  }

  private loadConfigurations() {
    // Load from localStorage or file system in production
    const storedConfigs = this.getStoredConfigurations();
    storedConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });
  }

  private getStoredConfigurations(): DatabaseConfig[] {
    // In a real implementation, this would load from a persistent store
    // For now, return empty array - configs will be added via API
    return [];
  }

  private saveConfigurations() {
    // In a real implementation, this would persist to a store
    // For now, we'll keep them in memory
  }

  async addDatabaseConfig(config: Omit<DatabaseConfig, 'id' | 'createdAt' | 'updatedAt' | 'isConnected' | 'lastConnectionTest'>): Promise<DatabaseConfig> {
    const newConfig: DatabaseConfig = {
      ...config,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isConnected: false
    };

    // Optionally test connection before adding (don't fail if connection test fails)
    try {
      const connectionTest = await this.testConnection(newConfig);
      newConfig.isConnected = connectionTest.success;
      newConfig.lastConnectionTest = new Date();
      
      // Allow saving even if connection test fails - user can fix connection later
      if (!connectionTest.success) {
        console.warn(`Warning: Connection test failed for ${newConfig.name}: ${connectionTest.error}`);
      }
    } catch (error) {
      console.warn(`Warning: Could not test connection for ${newConfig.name}:`, error);
      newConfig.isConnected = false;
      newConfig.lastConnectionTest = new Date();
    }

    this.configs.set(newConfig.id, newConfig);
    this.saveConfigurations();

    return newConfig;
  }

  async updateDatabaseConfig(id: string, updates: Partial<DatabaseConfig>): Promise<DatabaseConfig | undefined> {
    const config = this.configs.get(id);
    if (!config) return undefined;

    const updatedConfig: DatabaseConfig = {
      ...config,
      ...updates,
      id: config.id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    // Test connection if connection string changed
    if (updates.connectionString && updates.connectionString !== config.connectionString) {
      const connectionTest = await this.testConnection(updatedConfig);
      updatedConfig.isConnected = connectionTest.success;
      updatedConfig.lastConnectionTest = new Date();

      if (!connectionTest.success) {
        throw new Error(`Connection test failed: ${connectionTest.error}`);
      }
    }

    this.configs.set(id, updatedConfig);
    this.saveConfigurations();

    return updatedConfig;
  }

  async deleteDatabaseConfig(id: string): Promise<boolean> {
    if (this.activeConnectionId === id) {
      throw new Error('Cannot delete the active database configuration');
    }

    const deleted = this.configs.delete(id);
    if (deleted) {
      this.connections.delete(id);
      this.saveConfigurations();
    }
    return deleted;
  }

  getDatabaseConfigs(): DatabaseConfig[] {
    return Array.from(this.configs.values());
  }

  getDatabaseConfig(id: string): DatabaseConfig | undefined {
    return this.configs.get(id);
  }

  async testConnection(config: DatabaseConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      // Validate required fields first
      if (!config.connectionString) {
        return {
          success: false,
          error: "Connection string is required"
        };
      }

      const connection = await this.createConnection(config);
      
      // Test with a simple query based on dialect
      const providerInfo = databaseProviderInfo[config.provider];
      
      if (providerInfo.dialect === 'sqlite') {
        await (connection as any).prepare('SELECT 1').get();
      } else if (providerInfo.dialect === 'mysql') {
        await (connection as any).execute('SELECT 1');
      } else {
        // PostgreSQL
        const pool = connection as Pool;
        await pool.query('SELECT 1');
      }

      const latency = Date.now() - startTime;
      
      return { success: true, latency };
    } catch (error) {
      let errorMessage = "Connection failed";
      
      if (error instanceof Error) {
        // Provide more helpful error messages for common issues
        if (error.message.includes("WebSocket")) {
          errorMessage = "WebSocket connection failed. This usually means invalid credentials or network issues.";
        } else if (error.message.includes("auth")) {
          errorMessage = "Authentication failed. Please check your credentials.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Connection timeout. Please check your host and port.";
        } else if (error.message.includes("ENOTFOUND")) {
          errorMessage = "Host not found. Please check your host address.";
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  private async createConnection(config: DatabaseConfig) {
    const providerInfo = databaseProviderInfo[config.provider];
    
    switch (providerInfo.dialect) {
      case 'postgresql':
        const pool = new Pool({ connectionString: config.connectionString });
        return pool;
        
      case 'mysql':
        const mysqlConnection = await mysql.createConnection(config.connectionString);
        return mysqlConnection;
        
      case 'sqlite':
        const sqliteDb = new Database(config.connectionString.replace('file:', ''));
        return sqliteDb;
        
      default:
        throw new Error(`Unsupported database dialect: ${(providerInfo as any)?.dialect || 'unknown'}`);
    }
  }

  async switchActiveDatabase(configId: string): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Database configuration not found: ${configId}`);
    }

    if (!config.isConnected) {
      const connectionTest = await this.testConnection(config);
      if (!connectionTest.success) {
        throw new Error(`Cannot switch to database: ${connectionTest.error}`);
      }
    }

    // Set all other configs to inactive
    for (const [id, cfg] of Array.from(this.configs.entries())) {
      if (id !== configId) {
        cfg.isActive = false;
      }
    }

    config.isActive = true;
    this.activeConnectionId = configId;
    this.saveConfigurations();

    // Update environment variable for the application
    process.env.DATABASE_URL = config.connectionString;
  }

  getActiveConnection(): DatabaseConfig | undefined {
    if (!this.activeConnectionId) return undefined;
    return this.configs.get(this.activeConnectionId);
  }

  async migrateData(fromConfigId: string | null, toConfigId: string): Promise<string> {
    const toConfig = this.configs.get(toConfigId);
    if (!toConfig) {
      throw new Error(`Target database configuration not found: ${toConfigId}`);
    }

    // Handle "memory" as null for consistency
    if (fromConfigId === "memory") {
      fromConfigId = null;
    }

    const migrationId = randomUUID();
    const migrationLog: MigrationLog = {
      id: migrationId,
      fromProvider: fromConfigId ? (fromConfigId.startsWith('supabase-') ? 'supabase' : this.configs.get(fromConfigId)?.provider) : undefined,
      toProvider: toConfig.provider,
      status: 'pending',
      startedAt: new Date(),
      recordsMigrated: 0
    };

    this.migrationLogs.set(migrationId, migrationLog);

    try {
      migrationLog.status = 'in_progress';
      
      // Get source data (either from memory storage or another database)
      const sourceData = await this.extractAllData(fromConfigId);
      
      // Create connection to target database
      const targetConnection = await this.createConnection(toConfig);
      const targetDb = this.createDrizzleInstance(targetConnection, toConfig.provider);
      
      // Ensure schema exists in target database
      await this.ensureSchema(targetConnection, toConfig.provider);
      
      // Migrate data in order (respecting foreign key constraints)
      let totalRecords = 0;
      
      // 1. Users first
      if (sourceData.users.length > 0) {
        await this.insertUsers(targetConnection, sourceData.users, toConfig.provider);
        totalRecords += sourceData.users.length;
      }
      
      // 2. Categories
      if (sourceData.categories.length > 0) {
        await this.insertCategories(targetConnection, sourceData.categories, toConfig.provider);
        totalRecords += sourceData.categories.length;
      }
      
      // 3. Accounts
      if (sourceData.accounts.length > 0) {
        await this.insertAccounts(targetConnection, sourceData.accounts, toConfig.provider);
        totalRecords += sourceData.accounts.length;
      }
      
      // 4. Transactions
      if (sourceData.transactions.length > 0) {
        await this.insertTransactions(targetConnection, sourceData.transactions, toConfig.provider);
        totalRecords += sourceData.transactions.length;
      }
      
      // 5. Other entities
      if (sourceData.budgets.length > 0) {
        await this.insertBudgets(targetConnection, sourceData.budgets, toConfig.provider);
        totalRecords += sourceData.budgets.length;
      }
      
      if (sourceData.goals.length > 0) {
        await this.insertGoals(targetConnection, sourceData.goals, toConfig.provider);
        totalRecords += sourceData.goals.length;
      }
      
      if (sourceData.bills.length > 0) {
        await this.insertBills(targetConnection, sourceData.bills, toConfig.provider);
        totalRecords += sourceData.bills.length;
      }
      
      if (sourceData.products.length > 0) {
        await this.insertProducts(targetConnection, sourceData.products, toConfig.provider);
        totalRecords += sourceData.products.length;
      }

      migrationLog.status = 'completed';
      migrationLog.completedAt = new Date();
      migrationLog.recordsMigrated = totalRecords;
      
    } catch (error) {
      migrationLog.status = 'failed';
      migrationLog.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      migrationLog.completedAt = new Date();
      throw error;
    } finally {
      this.migrationLogs.set(migrationId, migrationLog);
    }

    return migrationId;
  }

  private createDrizzleInstance(connection: any, provider: DatabaseProvider) {
    const providerInfo = databaseProviderInfo[provider];
    
    switch (providerInfo.dialect) {
      case 'postgresql':
        return drizzle(connection, { schema });
      case 'mysql':
        return drizzleMysql(connection, { schema, mode: 'default' });
      case 'sqlite':
        return drizzleSqlite(connection, { schema });
      default:
        throw new Error(`Unsupported dialect: ${(providerInfo as any)?.dialect || 'unknown'}`);
    }
  }

  private async ensureSchema(db: any, provider: DatabaseProvider) {
    console.log(`Ensuring schema exists for ${provider}`);
    
    try {
      // Import the schema and migration utilities
      const schema = await import('@shared/schema');
      
      // For SQLite, we need to create tables manually since we're not using migrations
      if (provider === 'sqlite') {
        // Create tables if they don't exist
        const createTableQueries = [
          `CREATE TABLE IF NOT EXISTS "users" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "username" text NOT NULL,
            "email" text NOT NULL,
            "password_hash" text NOT NULL,
            "first_name" text,
            "last_name" text,
            "profile_image_url" text,
            "role" text DEFAULT 'user' NOT NULL,
            "is_active" integer DEFAULT true NOT NULL,
            "is_email_verified" integer DEFAULT false NOT NULL,
            "email_verification_token" text,
            "password_reset_token" text,
            "password_reset_expires" integer,
            "last_login_at" integer,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL
          )`,
          `CREATE TABLE IF NOT EXISTS "categories" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" integer NOT NULL,
            "name" text NOT NULL,
            "color" text NOT NULL,
            "type" text DEFAULT 'expense' NOT NULL,
            "parent_id" integer,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
            FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE set null
          )`,
          `CREATE TABLE IF NOT EXISTS "accounts" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" integer NOT NULL,
            "name" text NOT NULL,
            "type" text NOT NULL,
            "balance" real DEFAULT 0 NOT NULL,
            "currency" text DEFAULT 'USD' NOT NULL,
            "is_active" integer DEFAULT true NOT NULL,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
          )`,
          `CREATE TABLE IF NOT EXISTS "transactions" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" integer NOT NULL,
            "account_id" integer NOT NULL,
            "category_id" integer,
            "amount" real NOT NULL,
            "description" text NOT NULL,
            "date" integer NOT NULL,
            "type" text NOT NULL,
            "tags" text,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
            FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE cascade,
            FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null
          )`,
          `CREATE TABLE IF NOT EXISTS "budgets" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" integer NOT NULL,
            "category_id" integer NOT NULL,
            "amount" real NOT NULL,
            "period" text DEFAULT 'monthly' NOT NULL,
            "start_date" integer NOT NULL,
            "end_date" integer,
            "is_active" integer DEFAULT true NOT NULL,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
            FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade
          )`,
          `CREATE TABLE IF NOT EXISTS "goals" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" integer NOT NULL,
            "name" text NOT NULL,
            "description" text,
            "target_amount" real NOT NULL,
            "current_amount" real DEFAULT 0 NOT NULL,
            "target_date" integer,
            "is_completed" integer DEFAULT false NOT NULL,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
          )`,
          `CREATE TABLE IF NOT EXISTS "bills" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "user_id" integer NOT NULL,
            "name" text NOT NULL,
            "amount" real NOT NULL,
            "due_date" integer NOT NULL,
            "frequency" text DEFAULT 'monthly' NOT NULL,
            "category_id" integer,
            "account_id" integer,
            "is_active" integer DEFAULT true NOT NULL,
            "last_paid" integer,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
            FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null,
            FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE set null
          )`,
          `CREATE TABLE IF NOT EXISTS "products" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "name" text NOT NULL,
            "barcode" text,
            "category" text,
            "brand" text,
            "average_price" real,
            "currency" text DEFAULT 'USD' NOT NULL,
            "created_at" integer DEFAULT (unixepoch()) NOT NULL,
            "updated_at" integer DEFAULT (unixepoch()) NOT NULL
          )`
        ];

        // Execute each CREATE TABLE query
        for (const query of createTableQueries) {
          db.run(query);
        }
        
        console.log(`Created SQLite schema with ${createTableQueries.length} tables`);
      } else {
        // For other database types, we would run proper migrations
        // For now, we assume they exist or use Drizzle's push feature
        console.log(`Schema verification for ${provider} - assuming tables exist`);
      }
    } catch (error) {
      console.error(`Error ensuring schema for ${provider}:`, error);
      throw error;
    }
  }

  private async extractAllData(fromConfigId: string | null) {
    // If fromConfigId is null or "memory", extract from memory storage
    if (!fromConfigId || fromConfigId === "memory") {
      const { storage } = await import('./storage');
      return {
        users: await storage.getAllUsers(),
        categories: await storage.getCategories(0), // Get all categories
        accounts: [], // We'll need to get all accounts across all users
        transactions: [], // We'll need to get all transactions across all users  
        budgets: [], // We'll need to get all budgets across all users
        goals: [], // We'll need to get all goals across all users
        bills: [], // We'll need to get all bills across all users
        products: await storage.getProducts(),
      };
    }

    // Check if it's a Supabase configuration from initialization system
    if (fromConfigId.startsWith('supabase-')) {
      try {
        const { databaseConfigManager } = await import('./database-config-manager');
        const supabaseConfigs = await databaseConfigManager.getAllConfigs();
        const supabaseConfig = supabaseConfigs.find((cfg: any) => cfg.id === fromConfigId);
        
        if (supabaseConfig) {
          // Use current Supabase storage to extract data
          const { storage } = await import('./storage');
          return {
            users: await storage.getAllUsers(),
            categories: await storage.getCategories(0),
            accounts: [], // We'll need to get all accounts across all users
            transactions: [], // We'll need to get all transactions across all users  
            budgets: [], // We'll need to get all budgets across all users
            goals: [], // We'll need to get all goals across all users
            bills: [], // We'll need to get all bills across all users
            products: await storage.getProducts(),
          };
        }
      } catch (error) {
        console.error('Error accessing Supabase config:', error);
      }
    }

    // Extract from another database
    const sourceConfig = this.configs.get(fromConfigId);
    if (!sourceConfig) {
      throw new Error(`Source database configuration not found: ${fromConfigId}`);
    }

    const sourceConnection = await this.createConnection(sourceConfig);
    const sourceDb = this.createDrizzleInstance(sourceConnection, sourceConfig.provider);

    return {
      users: await (sourceDb as any).select().from(schema.users),
      categories: await (sourceDb as any).select().from(schema.categories),
      accounts: await (sourceDb as any).select().from(schema.accounts),
      transactions: await (sourceDb as any).select().from(schema.transactions),
      budgets: await (sourceDb as any).select().from(schema.budgets),
      goals: await (sourceDb as any).select().from(schema.goals),
      bills: await (sourceDb as any).select().from(schema.bills),
      products: await (sourceDb as any).select().from(schema.products),
    };
  }

  private async insertUsers(connection: any, users: any[], provider: DatabaseProvider) {
    if (users.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, 
          profile_image_url, role, is_active, is_email_verified,
          email_verification_token, password_reset_token, password_reset_expires,
          last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const user of users) {
        stmt.run(
          user.username,
          user.email,
          user.passwordHash,
          user.firstName || null,
          user.lastName || null,
          user.profileImageUrl || null,
          user.role || 'user',
          user.isActive ? 1 : 0,
          user.isEmailVerified ? 1 : 0,
          user.emailVerificationToken || null,
          user.passwordResetToken || null,
          user.passwordResetExpires ? Math.floor(new Date(user.passwordResetExpires).getTime() / 1000) : null,
          user.lastLoginAt ? Math.floor(new Date(user.lastLoginAt).getTime() / 1000) : null,
          user.createdAt ? Math.floor(new Date(user.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          user.updatedAt ? Math.floor(new Date(user.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.users).values(users);
    }
  }

  private async insertCategories(connection: any, categories: any[], provider: DatabaseProvider) {
    if (categories.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO categories (
          user_id, name, color, type, parent_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const category of categories) {
        stmt.run(
          category.userId,
          category.name,
          category.color,
          category.type || 'expense',
          category.parentId || null,
          category.createdAt ? Math.floor(new Date(category.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          category.updatedAt ? Math.floor(new Date(category.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.categories).values(categories);
    }
  }

  private async insertAccounts(connection: any, accounts: any[], provider: DatabaseProvider) {
    if (accounts.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO accounts (
          user_id, name, type, balance, currency, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const account of accounts) {
        stmt.run(
          account.userId,
          account.name,
          account.type,
          account.balance || 0,
          account.currency || 'USD',
          account.isActive ? 1 : 0,
          account.createdAt ? Math.floor(new Date(account.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          account.updatedAt ? Math.floor(new Date(account.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.accounts).values(accounts);
    }
  }

  private async insertTransactions(connection: any, transactions: any[], provider: DatabaseProvider) {
    if (transactions.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO transactions (
          user_id, account_id, category_id, amount, description, date, type, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const transaction of transactions) {
        stmt.run(
          transaction.userId,
          transaction.accountId,
          transaction.categoryId || null,
          transaction.amount,
          transaction.description,
          transaction.date ? Math.floor(new Date(transaction.date).getTime() / 1000) : Math.floor(Date.now() / 1000),
          transaction.type,
          transaction.tags || null,
          transaction.createdAt ? Math.floor(new Date(transaction.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          transaction.updatedAt ? Math.floor(new Date(transaction.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.transactions).values(transactions);
    }
  }

  private async insertBudgets(connection: any, budgets: any[], provider: DatabaseProvider) {
    if (budgets.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO budgets (
          user_id, category_id, amount, period, start_date, end_date, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const budget of budgets) {
        stmt.run(
          budget.userId,
          budget.categoryId,
          budget.amount,
          budget.period || 'monthly',
          budget.startDate ? Math.floor(new Date(budget.startDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
          budget.endDate ? Math.floor(new Date(budget.endDate).getTime() / 1000) : null,
          budget.isActive ? 1 : 0,
          budget.createdAt ? Math.floor(new Date(budget.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          budget.updatedAt ? Math.floor(new Date(budget.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.budgets).values(budgets);
    }
  }

  private async insertGoals(connection: any, goals: any[], provider: DatabaseProvider) {
    if (goals.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO goals (
          user_id, name, description, target_amount, current_amount, target_date, is_completed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const goal of goals) {
        stmt.run(
          goal.userId,
          goal.name,
          goal.description || null,
          goal.targetAmount,
          goal.currentAmount || 0,
          goal.targetDate ? Math.floor(new Date(goal.targetDate).getTime() / 1000) : null,
          goal.isCompleted ? 1 : 0,
          goal.createdAt ? Math.floor(new Date(goal.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          goal.updatedAt ? Math.floor(new Date(goal.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.goals).values(goals);
    }
  }

  private async insertBills(connection: any, bills: any[], provider: DatabaseProvider) {
    if (bills.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO bills (
          user_id, name, amount, due_date, frequency, category_id, account_id, is_active, last_paid, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const bill of bills) {
        stmt.run(
          bill.userId,
          bill.name,
          bill.amount,
          bill.dueDate ? Math.floor(new Date(bill.dueDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
          bill.frequency || 'monthly',
          bill.categoryId || null,
          bill.accountId || null,
          bill.isActive ? 1 : 0,
          bill.lastPaid ? Math.floor(new Date(bill.lastPaid).getTime() / 1000) : null,
          bill.createdAt ? Math.floor(new Date(bill.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          bill.updatedAt ? Math.floor(new Date(bill.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.bills).values(bills);
    }
  }

  private async insertProducts(connection: any, products: any[], provider: DatabaseProvider) {
    if (products.length === 0) return;
    
    if (provider === 'sqlite') {
      // For SQLite, use raw SQL to avoid Drizzle type conversion issues
      const stmt = connection.prepare(`
        INSERT INTO products (
          name, barcode, category, brand, average_price, currency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const product of products) {
        stmt.run(
          product.name,
          product.barcode || null,
          product.category || null,
          product.brand || null,
          product.averagePrice || null,
          product.currency || 'USD',
          product.createdAt ? Math.floor(new Date(product.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
          product.updatedAt ? Math.floor(new Date(product.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)
        );
      }
    } else {
      // For other databases, use Drizzle ORM
      const db = this.createDrizzleInstance(connection, provider);
      await db.insert(schema.products).values(products);
    }
  }

  getMigrationLogs(): MigrationLog[] {
    return Array.from(this.migrationLogs.values());
  }

  getMigrationLog(id: string): MigrationLog | undefined {
    return this.migrationLogs.get(id);
  }
}

export const databaseManager = new DatabaseManager();