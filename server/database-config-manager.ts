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
      if (existsSync(this.configFilePath)) {
        const data = readFileSync(this.configFilePath, 'utf-8');
        const configs: DatabaseConfig[] = JSON.parse(data);
        this.configs.clear();
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

  async getActiveConfig(): Promise<DatabaseConfig | undefined> {
    const configs = Array.from(this.configs.values());
    return configs.find(config => config.isActive);
  }
}

export const databaseConfigManager = new DatabaseConfigManager();