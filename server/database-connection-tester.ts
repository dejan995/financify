import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import mysql from 'mysql2/promise';
import { DatabaseSetupData, buildConnectionString } from '@shared/initialization-config';

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  latency?: number;
  details?: {
    provider: string;
    host?: string;
    database?: string;
    ssl?: boolean;
    version?: string;
  };
}

export class DatabaseConnectionTester {
  // Test connection for any supported database provider
  public async testConnection(config: DatabaseSetupData): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      switch (config.provider) {
        case 'supabase':
          return await this.testSupabaseConnection(config, startTime);
        case 'neon':
          return await this.testNeonConnection(config, startTime);
        case 'planetscale':
          return await this.testPlanetScaleConnection(config, startTime);
        case 'postgresql':
          return await this.testPostgreSQLConnection(config, startTime);
        case 'mysql':
          return await this.testMySQLConnection(config, startTime);
        case 'sqlite':
          return await this.testSQLiteConnection(config, startTime);
        default:
          return {
            success: false,
            error: `Unsupported database provider: ${config.provider}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
        latency: Date.now() - startTime
      };
    }
  }

  private async testSupabaseConnection(config: DatabaseSetupData, startTime: number): Promise<ConnectionTestResult> {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseServiceKey) {
      return {
        success: false,
        error: 'Supabase URL, Anonymous Key, and Service Role Key are required'
      };
    }

    try {
      // Test with service role key for admin operations
      const client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test connection by trying to access a system table
      const { data, error } = await client
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        return {
          success: false,
          error: `Supabase connection failed: ${error.message}`,
          latency: Date.now() - startTime
        };
      }

      return {
        success: true,
        latency: Date.now() - startTime,
        details: {
          provider: 'supabase',
          host: new URL(config.supabaseUrl).hostname,
          database: 'postgres',
          ssl: true,
          version: 'PostgreSQL (Supabase)'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Supabase connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  private async testNeonConnection(config: DatabaseSetupData, startTime: number): Promise<ConnectionTestResult> {
    if (!config.connectionString) {
      return {
        success: false,
        error: 'Neon connection string is required'
      };
    }

    try {
      const pool = new Pool({ connectionString: config.connectionString });
      const client = await pool.connect();
      
      const result = await client.query('SELECT version()');
      const version = result.rows[0]?.version || 'Unknown';
      
      client.release();
      await pool.end();

      return {
        success: true,
        latency: Date.now() - startTime,
        details: {
          provider: 'neon',
          host: new URL(config.connectionString).hostname,
          database: new URL(config.connectionString).pathname.slice(1),
          ssl: config.connectionString.includes('sslmode=require'),
          version
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Neon connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  private async testPlanetScaleConnection(config: DatabaseSetupData, startTime: number): Promise<ConnectionTestResult> {
    if (!config.connectionString) {
      return {
        success: false,
        error: 'PlanetScale connection string is required'
      };
    }

    try {
      const connection = await mysql.createConnection(config.connectionString);
      const [rows] = await connection.execute('SELECT VERSION() as version');
      const version = (rows as any)[0]?.version || 'Unknown';
      
      await connection.end();

      return {
        success: true,
        latency: Date.now() - startTime,
        details: {
          provider: 'planetscale',
          host: new URL(config.connectionString).hostname,
          database: new URL(config.connectionString).pathname.slice(1),
          ssl: config.connectionString.includes('ssl=true'),
          version
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PlanetScale connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  private async testPostgreSQLConnection(config: DatabaseSetupData, startTime: number): Promise<ConnectionTestResult> {
    const connectionString = config.connectionString || 
      `postgresql://${config.username}:${config.password}@${config.host}:${config.port || 5432}/${config.database}${config.ssl ? '?sslmode=require' : ''}`;

    try {
      const pool = new Pool({ connectionString });
      const client = await pool.connect();
      
      const result = await client.query('SELECT version()');
      const version = result.rows[0]?.version || 'Unknown';
      
      client.release();
      await pool.end();

      return {
        success: true,
        latency: Date.now() - startTime,
        details: {
          provider: 'postgresql',
          host: config.host || new URL(connectionString).hostname,
          database: config.database || new URL(connectionString).pathname.slice(1),
          ssl: config.ssl,
          version
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PostgreSQL connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  private async testMySQLConnection(config: DatabaseSetupData, startTime: number): Promise<ConnectionTestResult> {
    const connectionString = config.connectionString || 
      `mysql://${config.mysqlUsername}:${config.mysqlPassword}@${config.mysqlHost}:${config.mysqlPort || 3306}/${config.mysqlDatabase}${config.ssl ? '?ssl=true' : ''}`;

    try {
      const connection = await mysql.createConnection(connectionString);
      const [rows] = await connection.execute('SELECT VERSION() as version');
      const version = (rows as any)[0]?.version || 'Unknown';
      
      await connection.end();

      return {
        success: true,
        latency: Date.now() - startTime,
        details: {
          provider: 'mysql',
          host: config.mysqlHost || new URL(connectionString).hostname,
          database: config.mysqlDatabase || new URL(connectionString).pathname.slice(1),
          ssl: config.ssl,
          version
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MySQL connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  private async testSQLiteConnection(config: DatabaseSetupData, startTime: number): Promise<ConnectionTestResult> {
    try {
      // SQLite is always available locally
      const Database = (await import('better-sqlite3')).default;
      const dbPath = './data/finance.db';
      
      // Test creating/opening database
      const db = new Database(dbPath);
      const result = db.prepare('SELECT sqlite_version() as version').get() as any;
      db.close();

      return {
        success: true,
        latency: Date.now() - startTime,
        details: {
          provider: 'sqlite',
          host: 'localhost',
          database: dbPath,
          ssl: false,
          version: `SQLite ${result?.version || 'Unknown'}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQLite connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  // Test multiple connection attempts with retry logic
  public async testConnectionWithRetry(config: DatabaseSetupData, maxRetries: number = 3): Promise<ConnectionTestResult> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Testing database connection (attempt ${attempt}/${maxRetries})...`);
      
      const result = await this.testConnection(config);
      
      if (result.success) {
        console.log(`✓ Connection successful on attempt ${attempt}`);
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      console.log(`✗ Connection failed on attempt ${attempt}: ${lastError}`);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: `Connection failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
  }

  // Validate database schema exists
  public async validateSchema(config: DatabaseSetupData): Promise<{ hasSchema: boolean; missingTables: string[]; error?: string }> {
    try {
      const requiredTables = ['users', 'accounts', 'categories', 'transactions', 'budgets', 'goals', 'bills', 'products'];
      const missingTables: string[] = [];
      
      switch (config.provider) {
        case 'supabase':
          return await this.validateSupabaseSchema(config, requiredTables);
        case 'neon':
        case 'postgresql':
          return await this.validatePostgreSQLSchema(config, requiredTables);
        case 'planetscale':
        case 'mysql':
          return await this.validateMySQLSchema(config, requiredTables);
        case 'sqlite':
          return await this.validateSQLiteSchema(config, requiredTables);
        default:
          return {
            hasSchema: false,
            missingTables: requiredTables,
            error: `Schema validation not implemented for ${config.provider}`
          };
      }
    } catch (error) {
      return {
        hasSchema: false,
        missingTables: [],
        error: error instanceof Error ? error.message : 'Schema validation failed'
      };
    }
  }

  private async validateSupabaseSchema(config: DatabaseSetupData, requiredTables: string[]): Promise<{ hasSchema: boolean; missingTables: string[]; error?: string }> {
    try {
      const client = createClient(config.supabaseUrl!, config.supabaseServiceKey!, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const missingTables: string[] = [];
      
      for (const table of requiredTables) {
        const { error } = await client.from(table).select('*').limit(1);
        if (error && error.message?.includes('does not exist')) {
          missingTables.push(table);
        }
      }

      return {
        hasSchema: missingTables.length === 0,
        missingTables
      };
    } catch (error) {
      return {
        hasSchema: false,
        missingTables: requiredTables,
        error: error instanceof Error ? error.message : 'Supabase schema validation failed'
      };
    }
  }

  private async validatePostgreSQLSchema(config: DatabaseSetupData, requiredTables: string[]): Promise<{ hasSchema: boolean; missingTables: string[]; error?: string }> {
    try {
      const connectionString = buildConnectionString(config);
      const pool = new Pool({ connectionString });
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY($1)
      `, [requiredTables]);
      
      const existingTables = result.rows.map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      client.release();
      await pool.end();

      return {
        hasSchema: missingTables.length === 0,
        missingTables
      };
    } catch (error) {
      return {
        hasSchema: false,
        missingTables: requiredTables,
        error: error instanceof Error ? error.message : 'PostgreSQL schema validation failed'
      };
    }
  }

  private async validateMySQLSchema(config: DatabaseSetupData, requiredTables: string[]): Promise<{ hasSchema: boolean; missingTables: string[]; error?: string }> {
    try {
      const connectionString = buildConnectionString(config);
      const connection = await mysql.createConnection(connectionString);
      
      const [rows] = await connection.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name IN (${requiredTables.map(() => '?').join(',')})
      `, requiredTables);
      
      const existingTables = (rows as any[]).map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      await connection.end();

      return {
        hasSchema: missingTables.length === 0,
        missingTables
      };
    } catch (error) {
      return {
        hasSchema: false,
        missingTables: requiredTables,
        error: error instanceof Error ? error.message : 'MySQL schema validation failed'
      };
    }
  }

  private async validateSQLiteSchema(config: DatabaseSetupData, requiredTables: string[]): Promise<{ hasSchema: boolean; missingTables: string[]; error?: string }> {
    try {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./data/finance.db');
      
      const missingTables: string[] = [];
      
      for (const table of requiredTables) {
        const result = db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(table);
        
        if (!result) {
          missingTables.push(table);
        }
      }
      
      db.close();

      return {
        hasSchema: missingTables.length === 0,
        missingTables
      };
    } catch (error) {
      return {
        hasSchema: false,
        missingTables: requiredTables,
        error: error instanceof Error ? error.message : 'SQLite schema validation failed'
      };
    }
  }

  // Get connection recommendations based on deployment context
  public getConnectionRecommendations(isDocker: boolean, provider: string): {
    title: string;
    description: string;
    tips: string[];
    warnings?: string[];
  } {
    const recommendations = {
      supabase: {
        title: "Supabase Setup",
        description: "Cloud-hosted PostgreSQL with automatic scaling and real-time features",
        tips: [
          "Get credentials from Supabase Dashboard → Settings → API",
          "Service Role Key is required for automatic table creation",
          "Tables will be created automatically on first connection",
          "Perfect for production deployments"
        ],
        warnings: isDocker ? [
          "Ensure Docker container has internet access to reach Supabase"
        ] : undefined
      },
      neon: {
        title: "Neon Database Setup",
        description: "Serverless PostgreSQL with branching and automatic scaling",
        tips: [
          "Get connection string from Neon Console → Connection Details",
          "Use the pooled connection string for better performance",
          "Tables will be created automatically on first connection",
          "Great for production with automatic scaling"
        ]
      },
      planetscale: {
        title: "PlanetScale Setup",
        description: "Serverless MySQL with branching and global distribution",
        tips: [
          "Get connection string from PlanetScale Dashboard → Connect",
          "Use the 'General' connection string format",
          "Tables will be created automatically on first connection",
          "Consider using branches for schema changes"
        ]
      },
      postgresql: {
        title: "PostgreSQL Setup",
        description: "Traditional PostgreSQL database server",
        tips: [
          "Ensure PostgreSQL server is running and accessible",
          "Create database and user before connecting",
          "Use connection pooling for production",
          isDocker ? "Use 'postgres' as hostname in Docker Compose" : "Use actual server hostname/IP"
        ],
        warnings: isDocker ? [
          "Make sure PostgreSQL service is defined in docker-compose.yml"
        ] : [
          "Ensure firewall allows connections on PostgreSQL port (5432)"
        ]
      },
      mysql: {
        title: "MySQL Setup", 
        description: "Traditional MySQL database server",
        tips: [
          "Ensure MySQL server is running and accessible",
          "Create database and user before connecting",
          "Use connection pooling for production",
          isDocker ? "Use 'mysql' as hostname in Docker Compose" : "Use actual server hostname/IP"
        ],
        warnings: isDocker ? [
          "Make sure MySQL service is defined in docker-compose.yml"
        ] : [
          "Ensure firewall allows connections on MySQL port (3306)"
        ]
      },
      sqlite: {
        title: "SQLite Setup",
        description: "File-based database, perfect for development and small deployments",
        tips: [
          "No external database server required",
          "Database file will be created automatically",
          "Perfect for development and testing",
          "Data persists in ./data/finance.db file"
        ],
        warnings: [
          "Not recommended for high-concurrency production use",
          "Backup the database file regularly"
        ]
      }
    };

    return recommendations[provider as keyof typeof recommendations] || {
      title: "Unknown Provider",
      description: "Configuration for unknown database provider",
      tips: ["Please select a supported database provider"],
      warnings: ["This provider is not supported"]
    };
  }
}

export const connectionTester = new DatabaseConnectionTester();