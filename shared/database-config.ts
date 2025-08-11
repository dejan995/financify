import { z } from "zod";

export const supportedDatabaseProviders = [
  "neon",
  "planetscale", 
  "supabase",
  "mysql",
  "postgresql",
  "sqlite"
] as const;

export type DatabaseProvider = typeof supportedDatabaseProviders[number];

export const databaseConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Database name is required"),
  provider: z.enum(supportedDatabaseProviders),
  connectionString: z.string().optional(),
  // Supabase-specific fields
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  supabaseServiceKey: z.string().optional(),
  // Traditional database fields
  host: z.string().optional(),
  port: z.string().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean().default(false),
  isConnected: z.boolean().default(false),
  lastConnectionTest: z.date().optional(),
  ssl: z.boolean().default(true),
  maxConnections: z.number().min(1).max(100).default(10),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertDatabaseConfigSchema = databaseConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isConnected: true,
  lastConnectionTest: true,
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type InsertDatabaseConfig = z.infer<typeof insertDatabaseConfigSchema>;

export const migrationLogSchema = z.object({
  id: z.string(),
  fromProvider: z.enum(supportedDatabaseProviders).optional(),
  toProvider: z.enum(supportedDatabaseProviders),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  recordsMigrated: z.number().default(0),
  errorMessage: z.string().optional(),
  migrationDetails: z.record(z.any()).optional(),
});

export type MigrationLog = z.infer<typeof migrationLogSchema>;

export const databaseProviderInfo = {
  neon: {
    name: "Neon",
    description: "Serverless PostgreSQL platform",
    dialect: "postgresql" as const,
    defaultPort: 5432,
    supportsSsl: true,
    connectionStringFormat: "postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]"
  },
  planetscale: {
    name: "PlanetScale", 
    description: "Serverless MySQL platform",
    dialect: "mysql" as const,
    defaultPort: 3306,
    supportsSsl: true,
    connectionStringFormat: "mysql://[user[:password]@][host][:port][/dbname][?param1=value1&...]"
  },
  supabase: {
    name: "Supabase",
    description: "Open source Firebase alternative with PostgreSQL",
    dialect: "postgresql" as const,
    defaultPort: 5432,
    supportsSsl: true,
    connectionStringFormat: "Supabase URL + Anonymous Key",
    requiresCredentials: ["supabaseUrl", "supabaseAnonKey"] as const
  },
  mysql: {
    name: "MySQL",
    description: "Traditional MySQL database",
    dialect: "mysql" as const,
    defaultPort: 3306,
    supportsSsl: true,
    connectionStringFormat: "mysql://[user[:password]@][host][:port][/dbname][?param1=value1&...]"
  },
  postgresql: {
    name: "PostgreSQL",
    description: "Traditional PostgreSQL database",
    dialect: "postgresql" as const,
    defaultPort: 5432,
    supportsSsl: true,
    connectionStringFormat: "postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]"
  },
  sqlite: {
    name: "SQLite",
    description: "File-based SQL database",
    dialect: "sqlite" as const,
    defaultPort: null,
    supportsSsl: false,
    connectionStringFormat: "file:./data.db or :memory:"
  }
} as const;