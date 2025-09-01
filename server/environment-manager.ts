import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DatabaseSetupData, getEnvironmentTemplate, getDockerComposeEnv } from '@shared/initialization-config';

export class EnvironmentManager {
  private envPath = './.env';
  private envExamplePath = './.env.example';

  // Check if .env file exists and has database configuration
  public hasExistingEnvConfig(): boolean {
    if (!existsSync(this.envPath)) {
      return false;
    }

    try {
      const envContent = readFileSync(this.envPath, 'utf8');
      
      // Check for any database configuration
      return (
        envContent.includes('SUPABASE_URL=') ||
        envContent.includes('DATABASE_URL=') ||
        envContent.includes('MYSQL_HOST=') ||
        envContent.includes('POSTGRES_HOST=')
      );
    } catch (error) {
      return false;
    }
  }

  // Read existing environment variables
  public getExistingEnvConfig(): Record<string, string> {
    if (!existsSync(this.envPath)) {
      return {};
    }

    try {
      const envContent = readFileSync(this.envPath, 'utf8');
      const envVars: Record<string, string> = {};
      
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          envVars[key.trim()] = value.trim();
        }
      });
      
      return envVars;
    } catch (error) {
      console.error('Error reading .env file:', error);
      return {};
    }
  }

  // Detect database provider from existing environment
  public detectProviderFromEnv(): string | null {
    const envVars = this.getExistingEnvConfig();
    
    if (envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY && envVars.SUPABASE_SERVICE_KEY) {
      return 'supabase';
    }
    
    if (envVars.DATABASE_URL) {
      const url = envVars.DATABASE_URL;
      if (url.includes('neon.tech') || url.includes('neon.')) {
        return 'neon';
      }
      if (url.includes('planetscale.') || url.includes('pscale.')) {
        return 'planetscale';
      }
      if (url.startsWith('postgresql://')) {
        return 'postgresql';
      }
      if (url.startsWith('mysql://')) {
        return 'mysql';
      }
    }
    
    if (envVars.POSTGRES_HOST || envVars.POSTGRES_DB) {
      return 'postgresql';
    }
    
    if (envVars.MYSQL_HOST || envVars.MYSQL_DATABASE) {
      return 'mysql';
    }
    
    return null;
  }

  // Generate .env file from database configuration
  public generateEnvFile(config: DatabaseSetupData, isDocker: boolean = false): void {
    const envVars = isDocker ? getDockerComposeEnv(config) : getEnvironmentTemplate(config.provider, config);
    
    // Read existing .env to preserve non-database variables
    const existingEnv = this.getExistingEnvConfig();
    
    // Merge with new database configuration (new config takes precedence)
    const finalEnv = { ...existingEnv, ...envVars };
    
    // Generate .env content
    const envContent = this.generateEnvContent(finalEnv, config.provider);
    
    // Write to .env file
    writeFileSync(this.envPath, envContent);
    console.log(`✓ Generated .env file for ${config.provider} provider`);
  }

  // Generate .env content with comments and sections
  private generateEnvContent(envVars: Record<string, string>, provider: string): string {
    const lines: string[] = [];
    
    lines.push('# Personal Finance Tracker - Environment Configuration');
    lines.push(`# Generated on: ${new Date().toISOString()}`);
    lines.push(`# Database Provider: ${provider.toUpperCase()}`);
    lines.push('');
    
    // Application Configuration
    lines.push('# Application Configuration');
    lines.push(`NODE_ENV=${envVars.NODE_ENV || 'production'}`);
    lines.push(`PORT=${envVars.PORT || '5000'}`);
    lines.push(`SESSION_SECRET=${envVars.SESSION_SECRET || 'change-this-in-production'}`);
    lines.push('');
    
    // Database Configuration
    lines.push('# Database Configuration');
    
    switch (provider) {
      case 'supabase':
        lines.push('# Supabase Configuration');
        lines.push(`SUPABASE_URL=${envVars.SUPABASE_URL || ''}`);
        lines.push(`SUPABASE_ANON_KEY=${envVars.SUPABASE_ANON_KEY || ''}`);
        lines.push(`SUPABASE_SERVICE_KEY=${envVars.SUPABASE_SERVICE_KEY || ''}`);
        break;
        
      case 'neon':
        lines.push('# Neon Database Configuration');
        lines.push(`DATABASE_URL=${envVars.DATABASE_URL || ''}`);
        break;
        
      case 'planetscale':
        lines.push('# PlanetScale Database Configuration');
        lines.push(`DATABASE_URL=${envVars.DATABASE_URL || ''}`);
        break;
        
      case 'postgresql':
        lines.push('# PostgreSQL Configuration');
        lines.push(`DATABASE_URL=${envVars.DATABASE_URL || ''}`);
        if (envVars.POSTGRES_HOST) {
          lines.push('');
          lines.push('# PostgreSQL Individual Parameters (for Docker Compose)');
          lines.push(`POSTGRES_HOST=${envVars.POSTGRES_HOST}`);
          lines.push(`POSTGRES_PORT=${envVars.POSTGRES_PORT || '5432'}`);
          lines.push(`POSTGRES_DB=${envVars.POSTGRES_DB || ''}`);
          lines.push(`POSTGRES_USER=${envVars.POSTGRES_USER || ''}`);
          lines.push(`POSTGRES_PASSWORD=${envVars.POSTGRES_PASSWORD || ''}`);
        }
        break;
        
      case 'mysql':
        lines.push('# MySQL Configuration');
        lines.push(`DATABASE_URL=${envVars.DATABASE_URL || ''}`);
        if (envVars.MYSQL_HOST) {
          lines.push('');
          lines.push('# MySQL Individual Parameters (for Docker Compose)');
          lines.push(`MYSQL_HOST=${envVars.MYSQL_HOST}`);
          lines.push(`MYSQL_PORT=${envVars.MYSQL_PORT || '3306'}`);
          lines.push(`MYSQL_DATABASE=${envVars.MYSQL_DATABASE || ''}`);
          lines.push(`MYSQL_USER=${envVars.MYSQL_USER || ''}`);
          lines.push(`MYSQL_PASSWORD=${envVars.MYSQL_PASSWORD || ''}`);
        }
        break;
        
      case 'sqlite':
        lines.push('# SQLite Configuration (file-based database)');
        lines.push(`SQLITE_DATABASE_PATH=${envVars.SQLITE_DATABASE_PATH || './data/finance.db'}`);
        break;
    }
    
    lines.push('');
    lines.push('# Optional: Force memory storage (for testing)');
    lines.push('# USE_MEMORY_STORAGE=true');
    lines.push('');
    
    // Add any other existing environment variables
    const dbKeys = new Set([
      'NODE_ENV', 'PORT', 'SESSION_SECRET',
      'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY',
      'DATABASE_URL', 'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD',
      'MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD',
      'SQLITE_DATABASE_PATH'
    ]);
    
    const otherVars = Object.entries(envVars).filter(([key]) => !dbKeys.has(key));
    if (otherVars.length > 0) {
      lines.push('# Other Configuration');
      otherVars.forEach(([key, value]) => {
        lines.push(`${key}=${value}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  // Create Docker Compose override for specific database
  public generateDockerComposeOverride(config: DatabaseSetupData): void {
    const overrideContent = this.generateDockerOverrideContent(config);
    writeFileSync('./docker-compose.override.yml', overrideContent);
    console.log(`✓ Generated docker-compose.override.yml for ${config.provider}`);
  }

  private generateDockerOverrideContent(config: DatabaseSetupData): string {
    const lines: string[] = [];
    
    lines.push('# Docker Compose Override - Generated by Initialization Wizard');
    lines.push(`# Database Provider: ${config.provider.toUpperCase()}`);
    lines.push(`# Generated on: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('version: "3.8"');
    lines.push('');
    lines.push('services:');
    lines.push('  finance-app:');
    lines.push('    environment:');
    
    const envVars = getDockerComposeEnv(config);
    Object.entries(envVars).forEach(([key, value]) => {
      lines.push(`      - ${key}=${value}`);
    });
    
    // Add database service if using PostgreSQL or MySQL locally
    if (config.provider === 'postgresql' && !config.connectionString) {
      lines.push('');
      lines.push('  postgres:');
      lines.push('    image: postgres:15-alpine');
      lines.push('    environment:');
      lines.push(`      - POSTGRES_DB=${config.database}`);
      lines.push(`      - POSTGRES_USER=${config.username}`);
      lines.push(`      - POSTGRES_PASSWORD=${config.password}`);
      lines.push('    ports:');
      lines.push(`      - "${config.port || 5432}:5432"`);
      lines.push('    volumes:');
      lines.push('      - postgres_data:/var/lib/postgresql/data');
      lines.push('    restart: unless-stopped');
      lines.push('');
      lines.push('volumes:');
      lines.push('  postgres_data:');
    }
    
    if (config.provider === 'mysql' && !config.connectionString) {
      lines.push('');
      lines.push('  mysql:');
      lines.push('    image: mysql:8.0');
      lines.push('    environment:');
      lines.push(`      - MYSQL_DATABASE=${config.mysqlDatabase}`);
      lines.push(`      - MYSQL_USER=${config.mysqlUsername}`);
      lines.push(`      - MYSQL_PASSWORD=${config.mysqlPassword}`);
      lines.push('      - MYSQL_ROOT_PASSWORD=rootpassword');
      lines.push('    ports:');
      lines.push(`      - "${config.mysqlPort || 3306}:3306"`);
      lines.push('    volumes:');
      lines.push('      - mysql_data:/var/lib/mysql');
      lines.push('    restart: unless-stopped');
      lines.push('');
      lines.push('volumes:');
      lines.push('  mysql_data:');
    }
    
    return lines.join('\n');
  }

  // Backup existing .env file
  public backupExistingEnv(): void {
    if (existsSync(this.envPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./.env.backup.${timestamp}`;
      
      try {
        const content = readFileSync(this.envPath, 'utf8');
        writeFileSync(backupPath, content);
        console.log(`✓ Backed up existing .env to ${backupPath}`);
      } catch (error) {
        console.error('Failed to backup .env file:', error);
      }
    }
  }

  // Validate environment variables for a provider
  public validateEnvironmentVariables(provider: string): { isValid: boolean; missing: string[]; errors: string[] } {
    const envVars = this.getExistingEnvConfig();
    const missing: string[] = [];
    const errors: string[] = [];
    
    switch (provider) {
      case 'supabase':
        if (!envVars.SUPABASE_URL) missing.push('SUPABASE_URL');
        if (!envVars.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
        if (!envVars.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY');
        
        if (envVars.SUPABASE_URL && !envVars.SUPABASE_URL.startsWith('https://')) {
          errors.push('SUPABASE_URL must start with https://');
        }
        break;
        
      case 'neon':
      case 'planetscale':
      case 'postgresql':
      case 'mysql':
        if (!envVars.DATABASE_URL) missing.push('DATABASE_URL');
        break;
        
      case 'sqlite':
        // SQLite doesn't require environment variables
        break;
        
      default:
        errors.push(`Unsupported provider: ${provider}`);
    }
    
    if (!envVars.SESSION_SECRET) {
      missing.push('SESSION_SECRET');
    }
    
    return {
      isValid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    };
  }

  // Generate deployment instructions
  public generateDeploymentInstructions(config: DatabaseSetupData): string {
    const instructions: string[] = [];
    
    instructions.push('# Deployment Instructions');
    instructions.push('');
    instructions.push('## Standalone Deployment');
    instructions.push('');
    instructions.push('1. Ensure .env file is configured (already done)');
    instructions.push('2. Install dependencies: `npm install`');
    instructions.push('3. Build the application: `npm run build`');
    instructions.push('4. Start the application: `npm start`');
    instructions.push('');
    instructions.push('## Docker Deployment');
    instructions.push('');
    instructions.push('1. Ensure .env file is configured (already done)');
    instructions.push('2. Build and start: `docker-compose up -d --build`');
    instructions.push('3. View logs: `docker-compose logs -f finance-app`');
    instructions.push('');
    
    // Provider-specific instructions
    switch (config.provider) {
      case 'supabase':
        instructions.push('## Supabase Setup Notes');
        instructions.push('- Tables will be created automatically on first run');
        instructions.push('- No manual SQL execution required');
        instructions.push('- Row Level Security (RLS) is disabled for simplicity');
        instructions.push('- You can enable RLS later in Supabase dashboard if needed');
        break;
        
      case 'neon':
        instructions.push('## Neon Database Notes');
        instructions.push('- Ensure your Neon database is running');
        instructions.push('- Tables will be created automatically on first run');
        instructions.push('- Connection pooling is handled by Neon');
        break;
        
      case 'planetscale':
        instructions.push('## PlanetScale Notes');
        instructions.push('- Ensure your PlanetScale database is running');
        instructions.push('- Tables will be created automatically on first run');
        instructions.push('- Consider using PlanetScale branching for schema changes');
        break;
        
      case 'postgresql':
        instructions.push('## PostgreSQL Notes');
        instructions.push('- Ensure PostgreSQL server is running and accessible');
        instructions.push('- Database and user should already exist');
        instructions.push('- Tables will be created automatically on first run');
        break;
        
      case 'mysql':
        instructions.push('## MySQL Notes');
        instructions.push('- Ensure MySQL server is running and accessible');
        instructions.push('- Database and user should already exist');
        instructions.push('- Tables will be created automatically on first run');
        break;
        
      case 'sqlite':
        instructions.push('## SQLite Notes');
        instructions.push('- Database file will be created automatically');
        instructions.push('- No external database server required');
        instructions.push('- Perfect for development and small deployments');
        break;
    }
    
    instructions.push('');
    instructions.push('## Health Check');
    instructions.push('- Application health: http://localhost:5000/api/initialization/status');
    instructions.push('- Admin login: Use the credentials you just created');
    instructions.push('');
    instructions.push('## Troubleshooting');
    instructions.push('- Check application logs for any connection errors');
    instructions.push('- Verify database credentials and network connectivity');
    instructions.push('- Ensure firewall allows database connections');
    
    return instructions.join('\n');
  }

  // Create environment template file
  public createEnvTemplate(): void {
    const template = `# Personal Finance Tracker - Environment Configuration Template
# Copy this file to .env and configure your settings

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Database Configuration
# Choose one of the following database options:

# Option 1: Supabase (Recommended for cloud deployment)
# SUPABASE_URL=https://your-project-ref.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_KEY=your-service-role-key

# Option 2: Neon Database (Serverless PostgreSQL)
# DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Option 3: PlanetScale (Serverless MySQL)
# DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/database?ssl={"rejectUnauthorized":true}

# Option 4: External PostgreSQL
# DATABASE_URL=postgresql://username:password@host:5432/database_name
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DB=finance_db
# POSTGRES_USER=finance_user
# POSTGRES_PASSWORD=finance_password

# Option 5: External MySQL
# DATABASE_URL=mysql://username:password@host:3306/database_name
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_DATABASE=finance_db
# MYSQL_USER=finance_user
# MYSQL_PASSWORD=finance_password

# Option 6: SQLite (Development/Local)
# SQLITE_DATABASE_PATH=./data/finance.db

# Optional: Force memory storage (for testing)
# USE_MEMORY_STORAGE=true

# Docker Compose Configuration (automatically set when using docker-compose)
# These are set automatically by docker-compose.yml
# POSTGRES_DB=finance_db
# POSTGRES_USER=finance_user
# POSTGRES_PASSWORD=finance_password
`;

    if (!existsSync(this.envExamplePath)) {
      writeFileSync(this.envExamplePath, template);
      console.log('✓ Created .env.example template');
    }
  }

  // Check if running in Docker
  public isRunningInDocker(): boolean {
    return (
      existsSync('/.dockerenv') ||
      process.env.DOCKER_CONTAINER === 'true' ||
      process.env.HOSTNAME?.startsWith('docker-') ||
      false
    );
  }

  // Get deployment context
  public getDeploymentContext(): {
    isDocker: boolean;
    hasDockerCompose: boolean;
    hasEnvFile: boolean;
    detectedProvider: string | null;
    envValidation: ReturnType<EnvironmentManager['validateEnvironmentVariables']> | null;
  } {
    const isDocker = this.isRunningInDocker();
    const hasDockerCompose = existsSync('./docker-compose.yml') || existsSync('./deployment/docker-compose.yml');
    const hasEnvFile = existsSync(this.envPath);
    const detectedProvider = this.detectProviderFromEnv();
    
    let envValidation = null;
    if (detectedProvider) {
      envValidation = this.validateEnvironmentVariables(detectedProvider);
    }
    
    return {
      isDocker,
      hasDockerCompose,
      hasEnvFile,
      detectedProvider,
      envValidation
    };
  }
}

export const environmentManager = new EnvironmentManager();