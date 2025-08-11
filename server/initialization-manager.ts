import { existsSync, writeFileSync, readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { DatabaseConfig, DatabaseProvider } from '@shared/database-config';
import { DatabaseManager } from './database-manager';
import { AuthService } from './customAuth';
import { SQLiteStorage } from './sqlite-storage';
import { UpsertUser } from '@shared/schema';

interface InitializationConfig {
  isInitialized: boolean;
  adminUser?: {
    id: number;
    username: string;
    email: string;
  };
  database?: {
    provider: DatabaseProvider;
    name: string;
    configId?: string;
  };
  createdAt?: Date;
}

export class InitializationManager {
  private configPath = './data/initialization.json';
  private databaseManager: DatabaseManager;

  constructor() {
    this.databaseManager = new DatabaseManager();
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory() {
    try {
      await mkdir('./data', { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  // Check if application has been initialized
  public isInitialized(): boolean {
    if (!existsSync(this.configPath)) {
      return false;
    }

    try {
      const config: InitializationConfig = JSON.parse(readFileSync(this.configPath, 'utf8'));
      return config.isInitialized === true;
    } catch (error) {
      return false;
    }
  }

  // Get current initialization status
  public getInitializationStatus(): InitializationConfig {
    if (!existsSync(this.configPath)) {
      return { isInitialized: false };
    }

    try {
      return JSON.parse(readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      return { isInitialized: false };
    }
  }

  // Test database connection without saving configuration
  public async testDatabaseConnection(config: {
    provider: DatabaseProvider;
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    connectionString?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceKey?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (config.provider === 'sqlite') {
        // SQLite is always available locally
        return { success: true };
      }

      // Handle Supabase differently
      if (config.provider === 'supabase') {
        console.log('Server received Supabase config:', {
          supabaseUrl: config.supabaseUrl,
          supabaseAnonKey: config.supabaseAnonKey ? 'PROVIDED' : 'MISSING',
          supabaseServiceKey: config.supabaseServiceKey ? 'PROVIDED' : 'MISSING',
          supabaseServiceKeyLength: config.supabaseServiceKey?.length || 0,
          supabaseServiceKeyValue: config.supabaseServiceKey || 'undefined/empty'
        });
        
        if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseServiceKey || 
            config.supabaseUrl.trim() === '' || config.supabaseAnonKey.trim() === '' || config.supabaseServiceKey.trim() === '') {
          return { success: false, error: 'Supabase URL, Anonymous Key, and Service Role Key are all required' };
        }
        
        const { testSupabaseConnection } = await import('./supabase-client');
        return await testSupabaseConnection(config.supabaseUrl, config.supabaseAnonKey, config.supabaseServiceKey!);
      }

      // For other providers, test the connection
      const testConfig: Omit<DatabaseConfig, 'id' | 'createdAt' | 'updatedAt' | 'isConnected' | 'lastConnectionTest'> = {
        name: 'Test Connection',
        provider: config.provider,
        connectionString: config.connectionString || '',
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: true,
        isActive: false,
        maxConnections: 10,
      };

      return await this.databaseManager.testConnection(testConfig as DatabaseConfig);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  // Initialize the application with admin user and database
  public async initializeApplication(adminData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }, databaseConfig: {
    provider: DatabaseProvider;
    name: string;
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    connectionString?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceKey?: string;
  }): Promise<{ success: boolean; adminUser?: any; database?: any; error?: string }> {
    try {
      // First, test the database connection
      const connectionTest = await this.testDatabaseConnection(databaseConfig);
      if (!connectionTest.success) {
        return {
          success: false,
          error: `Database connection failed: ${connectionTest.error}`
        };
      }

      // Initialize storage based on provider
      let storage: any;
      let dbConfigResult: DatabaseConfig | null = null;

      if (databaseConfig.provider === 'sqlite') {
        // Initialize SQLite storage
        storage = new SQLiteStorage('./data/finance.db');
      } else if (databaseConfig.provider === 'supabase') {
        // Initialize new Supabase storage implementation
        const { SupabaseStorageNew } = await import('./supabase-storage-new');
        console.log('Initializing new Supabase storage with credentials:');
        console.log('- URL:', databaseConfig.supabaseUrl);
        console.log('- Anon Key provided:', databaseConfig.supabaseAnonKey ? 'Yes' : 'No');
        console.log('- Service Key provided:', databaseConfig.supabaseServiceKey ? 'Yes' : 'No');
        
        if (!databaseConfig.supabaseServiceKey) {
          throw new Error('Supabase Service Role Key is required for automatic setup');
        }
        
        storage = new SupabaseStorageNew(databaseConfig.supabaseUrl!, databaseConfig.supabaseAnonKey!, databaseConfig.supabaseServiceKey!);
        
        // Initialize Supabase schema - new implementation checks table existence
        try {
          await storage.initializeSchema();
          console.log('Supabase schema check completed - tables verified');
        } catch (error) {
          console.error('Supabase schema check failed:', error);
          // For new implementation, we fail fast if tables don't exist
          throw new Error(`Supabase setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // For external databases, add configuration and use it
        dbConfigResult = await this.databaseManager.addDatabaseConfig({
          name: databaseConfig.name,
          provider: databaseConfig.provider,
          host: databaseConfig.host || '',
          port: databaseConfig.port ? parseInt(databaseConfig.port) : undefined,
          database: databaseConfig.database || '',
          username: databaseConfig.username || '',
          password: databaseConfig.password || '',
          connectionString: databaseConfig.connectionString || '',
          ssl: true,
          isActive: true, // Activate since connection test passed
        });

        // For now, we'll use SQLite as primary storage and sync later
        // This avoids WebSocket issues during initialization
        storage = new SQLiteStorage('./data/finance.db');
      }

      // Create admin user
      console.log('Creating admin user:', adminData.username);
      const hashedPassword = await AuthService.hashPassword(adminData.password);
      console.log('Password hashed successfully');
      
      const userDataToCreate = {
        username: adminData.username,
        email: adminData.email,
        passwordHash: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        profileImageUrl: null,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLoginAt: null,
      } as UpsertUser;
      
      console.log('Admin user data prepared:', userDataToCreate);
      const adminUser = await storage.createUser(userDataToCreate);
      
      console.log('Admin user created successfully:', adminUser.id);

      // Save initialization configuration
      const initConfig: InitializationConfig = {
        isInitialized: true,
        adminUser: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
        },
        database: {
          provider: databaseConfig.provider,
          name: databaseConfig.name,
          configId: dbConfigResult?.id,
        },
        createdAt: new Date(),
      };

      writeFileSync(this.configPath, JSON.stringify(initConfig, null, 2));

      console.log('Initialization successful:', {
        adminUserId: adminUser.id,
        provider: databaseConfig.provider
      });

      return {
        success: true,
        adminUser: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
        },
        database: {
          provider: databaseConfig.provider,
          name: databaseConfig.name,
          configId: dbConfigResult?.id,
        },
      };
    } catch (error) {
      console.error('Full initialization error:', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', (error as any)?.name);
      console.error('Error message:', (error as any)?.message);
      console.error('Error code:', (error as any)?.code);
      console.error('Error details:', (error as any)?.details);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : `Unknown initialization error: ${JSON.stringify(error)}`
      };
    }
  }

  // Reset initialization (for development/testing)
  public resetInitialization(): void {
    if (existsSync(this.configPath)) {
      try {
        require('fs').unlinkSync(this.configPath);
      } catch (error) {
        console.error('Failed to reset initialization:', error);
      }
    }
  }
}

export const initializationManager = new InitializationManager();