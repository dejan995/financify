import { z } from "zod";
import { supportedDatabaseProviders } from "./database-config";

export const databaseSetupSchema = z.object({
  provider: z.enum(supportedDatabaseProviders),
  name: z.string().min(1, "Database name is required"),
  
  // PostgreSQL/Neon fields
  host: z.string().optional(),
  port: z.string().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  
  // Connection string (for Neon, PlanetScale, external PostgreSQL)
  connectionString: z.string().optional(),
  
  // Supabase-specific fields
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  supabaseServiceKey: z.string().optional(),
  
  // MySQL-specific fields
  mysqlHost: z.string().optional(),
  mysqlPort: z.string().optional(),
  mysqlDatabase: z.string().optional(),
  mysqlUsername: z.string().optional(),
  mysqlPassword: z.string().optional(),
  
  // SSL and connection options
  ssl: z.boolean().default(true),
  maxConnections: z.number().min(1).max(100).default(10),
  
  // Environment variable generation
  generateEnvFile: z.boolean().default(true),
  useExistingEnv: z.boolean().default(false),
}).refine((data) => {
  // Validation rules for each provider
  switch (data.provider) {
    case 'supabase':
      return data.supabaseUrl && data.supabaseAnonKey && data.supabaseServiceKey;
    case 'neon':
    case 'planetscale':
      return data.connectionString;
    case 'mysql':
      return data.connectionString || (data.mysqlHost && data.mysqlDatabase && data.mysqlUsername);
    case 'postgresql':
      return data.connectionString || (data.host && data.database && data.username);
    case 'sqlite':
      return true; // SQLite doesn't need connection params
    default:
      return false;
  }
}, {
  message: "Required connection parameters are missing for the selected provider",
  path: ["provider"],
});

export const adminSetupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password is too long"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const initializationSchema = z.object({
  admin: adminSetupSchema,
  database: databaseSetupSchema,
});

export type AdminSetupData = z.infer<typeof adminSetupSchema>;
export type DatabaseSetupData = z.infer<typeof databaseSetupSchema>;
export type InitializationData = z.infer<typeof initializationSchema>;

// Environment variable templates for each provider
export const getEnvironmentTemplate = (provider: string, config: DatabaseSetupData): Record<string, string> => {
  const baseEnv = {
    NODE_ENV: "production",
    PORT: "5000",
    SESSION_SECRET: generateSessionSecret(),
  };

  switch (provider) {
    case 'supabase':
      return {
        ...baseEnv,
        SUPABASE_URL: config.supabaseUrl || "",
        SUPABASE_ANON_KEY: config.supabaseAnonKey || "",
        SUPABASE_SERVICE_KEY: config.supabaseServiceKey || "",
      };
    
    case 'neon':
    case 'planetscale':
      return {
        ...baseEnv,
        DATABASE_URL: config.connectionString || "",
      };
    
    case 'postgresql':
      if (config.connectionString) {
        return {
          ...baseEnv,
          DATABASE_URL: config.connectionString,
        };
      }
      return {
        ...baseEnv,
        DATABASE_URL: `postgresql://${config.username}:${config.password}@${config.host}:${config.port || 5432}/${config.database}${config.ssl ? '?sslmode=require' : ''}`,
        POSTGRES_HOST: config.host || "",
        POSTGRES_PORT: config.port || "5432",
        POSTGRES_DB: config.database || "",
        POSTGRES_USER: config.username || "",
        POSTGRES_PASSWORD: config.password || "",
      };
    
    case 'mysql':
      if (config.connectionString) {
        return {
          ...baseEnv,
          DATABASE_URL: config.connectionString,
        };
      }
      return {
        ...baseEnv,
        DATABASE_URL: `mysql://${config.mysqlUsername}:${config.mysqlPassword}@${config.mysqlHost}:${config.mysqlPort || 3306}/${config.mysqlDatabase}${config.ssl ? '?ssl=true' : ''}`,
        MYSQL_HOST: config.mysqlHost || "",
        MYSQL_PORT: config.mysqlPort || "3306",
        MYSQL_DATABASE: config.mysqlDatabase || "",
        MYSQL_USER: config.mysqlUsername || "",
        MYSQL_PASSWORD: config.mysqlPassword || "",
      };
    
    case 'sqlite':
      return {
        ...baseEnv,
        // SQLite doesn't need connection variables
        SQLITE_DATABASE_PATH: "./data/finance.db",
      };
    
    default:
      return baseEnv;
  }
};

// Generate a secure session secret
function generateSessionSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Docker Compose environment template
export const getDockerComposeEnv = (config: DatabaseSetupData): Record<string, string> => {
  const env = getEnvironmentTemplate(config.provider, config);
  
  // Add Docker-specific overrides
  if (config.provider === 'postgresql' && !config.connectionString) {
    // Use Docker service names for internal connections
    env.DATABASE_URL = `postgresql://${config.username}:${config.password}@postgres:5432/${config.database}${config.ssl ? '?sslmode=require' : ''}`;
  }
  
  if (config.provider === 'mysql' && !config.connectionString) {
    env.DATABASE_URL = `mysql://${config.mysqlUsername}:${config.mysqlPassword}@mysql:3306/${config.mysqlDatabase}${config.ssl ? '?ssl=true' : ''}`;
  }
  
  return env;
};

// Validation helpers
export const validateDatabaseConfig = (config: DatabaseSetupData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  switch (config.provider) {
    case 'supabase':
      if (!config.supabaseUrl) errors.push("Supabase URL is required");
      if (!config.supabaseAnonKey) errors.push("Supabase Anonymous Key is required");
      if (!config.supabaseServiceKey) errors.push("Supabase Service Role Key is required");
      
      if (config.supabaseUrl && !config.supabaseUrl.startsWith('https://')) {
        errors.push("Supabase URL must start with https://");
      }
      break;
      
    case 'neon':
      if (!config.connectionString) errors.push("Neon connection string is required");
      if (config.connectionString && !config.connectionString.startsWith('postgresql://')) {
        errors.push("Neon connection string must be a PostgreSQL URL");
      }
      break;
      
    case 'planetscale':
      if (!config.connectionString) errors.push("PlanetScale connection string is required");
      if (config.connectionString && !config.connectionString.startsWith('mysql://')) {
        errors.push("PlanetScale connection string must be a MySQL URL");
      }
      break;
      
    case 'postgresql':
      if (!config.connectionString) {
        if (!config.host) errors.push("PostgreSQL host is required");
        if (!config.database) errors.push("PostgreSQL database name is required");
        if (!config.username) errors.push("PostgreSQL username is required");
        if (!config.password) errors.push("PostgreSQL password is required");
      }
      break;
      
    case 'mysql':
      if (!config.connectionString) {
        if (!config.mysqlHost) errors.push("MySQL host is required");
        if (!config.mysqlDatabase) errors.push("MySQL database name is required");
        if (!config.mysqlUsername) errors.push("MySQL username is required");
        if (!config.mysqlPassword) errors.push("MySQL password is required");
      }
      break;
      
    case 'sqlite':
      // SQLite doesn't need validation
      break;
      
    default:
      errors.push("Unsupported database provider");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Connection string builders
export const buildConnectionString = (config: DatabaseSetupData): string => {
  switch (config.provider) {
    case 'postgresql':
      if (config.connectionString) return config.connectionString;
      return `postgresql://${config.username}:${config.password}@${config.host}:${config.port || 5432}/${config.database}${config.ssl ? '?sslmode=require' : ''}`;
    
    case 'mysql':
      if (config.connectionString) return config.connectionString;
      return `mysql://${config.mysqlUsername}:${config.mysqlPassword}@${config.mysqlHost}:${config.mysqlPort || 3306}/${config.mysqlDatabase}${config.ssl ? '?ssl=true' : ''}`;
    
    case 'neon':
    case 'planetscale':
      return config.connectionString || "";
    
    case 'supabase':
      return `supabase://${config.supabaseUrl}`;
    
    case 'sqlite':
      return "sqlite:./data/finance.db";
    
    default:
      return "";
  }
};