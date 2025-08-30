import { DatabaseConfig } from '@shared/database-config';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

class DatabaseConfigManager {
  private configFilePath = './data/database-configs.json';
  private configs: Map<string, DatabaseConfig> = new Map();

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs() {
    try {
      // First, check for environment variable configuration
      this.loadFromEnvironment();
      
      // Then load from file if no env config exists
      if (this.configs.size === 0 && existsSync(this.configFilePath)) {
        const data = readFileSync(this.configFilePath, 'utf-8');
        const configs: DatabaseConfig[] = JSON.parse(data);
        configs.forEach(config => {
          this.configs.set(config.id, config);
        });
      }
    } catch (error) {
      console.warn('Failed to load database configs:', error);
      this.configs.clear();
    }
  }

  private saveConfigs() {
    try {
      const configs = Array.from(this.configs.values());
      writeFileSync(this.configFilePath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('Failed to save database configs:', error);
    }
  }

  async getAllConfigs(): Promise<DatabaseConfig[]> {
    return Array.from(this.configs.values());
  }

  async getConfig(id: string): Promise<DatabaseConfig | undefined> {
    return this.configs.get(id);
  }

  async saveConfig(config: DatabaseConfig): Promise<void> {
    this.configs.set(config.id, config);
    this.saveConfigs();
  }

  async deleteConfig(id: string): Promise<void> {
    this.configs.delete(id);
    this.saveConfigs();
  }

  private loadFromEnvironment() {
    // Check for Supabase environment variables
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_KEY) {
      const envConfig: DatabaseConfig = {
        id: 'env-supabase',
        name: 'Environment Supabase',
        provider: 'supabase',
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
        isActive: true,
        isConnected: true,
        ssl: true,
        maxConnections: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.configs.set(envConfig.id, envConfig);
    }
    
    // Check for PostgreSQL environment variables
    if (process.env.DATABASE_URL) {
      const envConfig: DatabaseConfig = {
        id: 'env-postgres',
        name: 'Environment PostgreSQL',
        provider: 'postgresql',
        connectionString: process.env.DATABASE_URL,
        isActive: true,
        isConnected: true,
        ssl: true,
        maxConnections: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.configs.set(envConfig.id, envConfig);
    }
  }

  async getActiveConfig(): Promise<DatabaseConfig | undefined> {
    const configs = Array.from(this.configs.values());
    return configs.find(config => config.isActive);
  }
}

export const databaseConfigManager = new DatabaseConfigManager();