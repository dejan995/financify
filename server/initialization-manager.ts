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
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (config.provider === 'sqlite') {
        // SQLite is always available locally
        return { success: true };
      }

      // Handle Supabase differently
      if (config.provider === 'supabase') {
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
          return { success: false, error: 'Supabase URL and Anonymous Key are required' };
        }
        
        const { testSupabaseConnection } = await import('./supabase-client');
        return await testSupabaseConnection(config.supabaseUrl, config.supabaseAnonKey);
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
        // Initialize Supabase storage
        const { SupabaseStorage } = await import('./supabase-storage');
        storage = new SupabaseStorage(databaseConfig.supabaseUrl!, databaseConfig.supabaseAnonKey!);
      } else {
        // For external databases, add configuration and use it
        dbConfigResult = await this.databaseManager.addDatabaseConfig({
          name: databaseConfig.name,
          provider: databaseConfig.provider,
          host: databaseConfig.host || '',
          port: databaseConfig.port ? parseInt(databaseConfig.port) : null,
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
      const hashedPassword = await AuthService.hashPassword(adminData.password);
      const adminUser = await storage.createUser({
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
      } as UpsertUser);

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
      console.error('Initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown initialization error'
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