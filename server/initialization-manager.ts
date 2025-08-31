import { existsSync, writeFileSync, readFileSync } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";
import { DatabaseProvider } from "@shared/database-config";
import {
  DatabaseSetupData,
  AdminSetupData,
  validateDatabaseConfig,
  buildConnectionString,
} from "@shared/initialization-config";
import { environmentManager } from "./environment-manager";
import {
  connectionTester,
  ConnectionTestResult,
} from "./database-connection-tester";
import { AuthService } from "./customAuth";
import { SQLiteStorage } from "./sqlite-storage";
import { UpsertUser } from "@shared/schema";

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
    connectionString?: string;
    envGenerated?: boolean;
  };
  deploymentContext?: {
    isDocker: boolean;
    hasEnvFile: boolean;
    detectedProvider: string | null;
  };
  createdAt?: Date;
}

export class InitializationManager {
  private configPath = "./data/initialization.json";
  constructor() {
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory() {
    try {
      await mkdir("./data", { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  // Check if application has been initialized
  public isInitialized(): boolean {
    // Priority 1: Check environment variables (for Docker/production deployments)
    const envContext = environmentManager.getDeploymentContext();
    if (envContext.detectedProvider && envContext.envValidation?.isValid) {
      console.log(
        `App initialized via environment variables (${envContext.detectedProvider})`,
      );
      return true;
    }

    // Priority 2: Check initialization file
    if (!existsSync(this.configPath)) {
      return false;
    }

    try {
      const config: InitializationConfig = JSON.parse(
        readFileSync(this.configPath, "utf8"),
      );
      return config.isInitialized === true;
    } catch (error) {
      console.error("Error reading initialization config:", error);
      return false;
    }
  }

  // Get current initialization status
  public getInitializationStatus(): InitializationConfig {
    const envContext = environmentManager.getDeploymentContext();

    // Priority 1: Environment variables (Docker/production)
    if (envContext.detectedProvider && envContext.envValidation?.isValid) {
      return {
        isInitialized: true,
        database: {
          provider: envContext.detectedProvider as DatabaseProvider,
          name: "Environment Database",
          connectionString: this.getConnectionStringFromEnv(
            envContext.detectedProvider,
          ),
          envGenerated: true,
        },
        deploymentContext: envContext,
        createdAt: new Date(),
      };
    }

    // Priority 2: Saved configuration file
    if (!existsSync(this.configPath)) {
      return {
        isInitialized: false,
        deploymentContext: envContext,
      };
    }

    try {
      const config = JSON.parse(readFileSync(this.configPath, "utf8"));
      return {
        ...config,
        deploymentContext: envContext,
      };
    } catch (error) {
      console.error("Error reading initialization config:", error);
      return {
        isInitialized: false,
        deploymentContext: envContext,
      };
    }
  }

  private getConnectionStringFromEnv(provider: string): string {
    switch (provider) {
      case "supabase":
        return `supabase://${process.env.SUPABASE_URL}`;
      case "neon":
      case "planetscale":
      case "postgresql":
      case "mysql":
        return process.env.DATABASE_URL || "";
      case "sqlite":
        return process.env.SQLITE_DATABASE_PATH || "./data/finance.db";
      default:
        return "";
    }
  }
  // Test database connection without saving configuration
  public async testDatabaseConnection(
    config: DatabaseSetupData,
  ): Promise<ConnectionTestResult> {
    console.log(`Testing ${config.provider} database connection...`);

    // Validate configuration first
    const validation = validateDatabaseConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Configuration validation failed: ${validation.errors.join(", ")}`,
      };
    }

    try {
      // Use the robust connection tester
      const result = await connectionTester.testConnectionWithRetry(config, 3);

      if (result.success) {
        console.log(
          `✓ ${config.provider} connection successful (${result.latency}ms)`,
        );

        // Also validate schema if connection is successful
        const schemaValidation = await connectionTester.validateSchema(config);
        if (
          !schemaValidation.hasSchema &&
          schemaValidation.missingTables.length > 0
        ) {
          console.log(
            `⚠ Schema validation: ${schemaValidation.missingTables.length} tables missing`,
          );
          result.details = {
            ...result.details,
            schemaStatus: "missing_tables",
            missingTables: schemaValidation.missingTables,
          };
        }
      } else {
        console.log(`✗ ${config.provider} connection failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown connection error",
        latency: 0,
      };
    }
  }

  // Initialize the application with admin user and database
  public async initializeApplication(
    adminData: AdminSetupData,
    databaseConfig: DatabaseSetupData,
  ): Promise<{
    success: boolean;
    adminUser?: any;
    database?: any;
    envGenerated?: boolean;
    deploymentInstructions?: string;
    error?: string;
  }> {
    try {
      console.log(
        `Starting initialization with ${databaseConfig.provider} provider...`,
      );

      // Get deployment context
      const deploymentContext = environmentManager.getDeploymentContext();
      console.log("Deployment context:", deploymentContext);

      // First, test the database connection
      const connectionTest = await this.testDatabaseConnection(databaseConfig);
      if (!connectionTest.success) {
        return {
          success: false,
          error: `Database connection failed: ${connectionTest.error}`,
        };
      }

      console.log(
        `✓ Database connection test passed (${connectionTest.latency}ms)`,
      );

      // Initialize storage based on provider
      let storage: any;
      let envGenerated = false;

      // Generate environment file if requested
      if (databaseConfig.generateEnvFile && !databaseConfig.useExistingEnv) {
        console.log("Generating .env file...");
        environmentManager.backupExistingEnv();
        environmentManager.generateEnvFile(
          databaseConfig,
          deploymentContext.isDocker,
        );

        if (deploymentContext.hasDockerCompose) {
          environmentManager.generateDockerComposeOverride(databaseConfig);
        }

        envGenerated = true;
        console.log("✓ Environment configuration generated");
      }
      if (databaseConfig.provider === "sqlite") {
        console.log("Initializing SQLite storage...");
        storage = new SQLiteStorage("./data/finance.db");
      } else if (databaseConfig.provider === "supabase") {
        console.log("Initializing Supabase storage...");
        const { SupabaseStorageNew } = await import("./supabase-storage-new");

        if (!databaseConfig.supabaseServiceKey) {
          throw new Error(
            "Supabase Service Role Key is required for automatic setup",
          );
        }

        storage = new SupabaseStorageNew(
          databaseConfig.supabaseUrl!,
          databaseConfig.supabaseAnonKey!,
          databaseConfig.supabaseServiceKey!,
        );

        // Initialize Supabase schema
        try {
          await storage.initializeSchema();
          console.log("✓ Supabase schema initialized");
        } catch (error) {
          console.error("Supabase schema check failed:", error);
          throw new Error(
            `Supabase setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      } else if (databaseConfig.provider === "neon") {
        console.log("Initializing Neon database storage...");
        const { DatabaseStorage } = await import("./database-storage");
        storage = new DatabaseStorage(databaseConfig.connectionString!);
      } else if (databaseConfig.provider === "postgresql") {
        console.log("Initializing PostgreSQL storage...");
        const { DatabaseStorage } = await import("./database-storage");
        const connectionString = buildConnectionString(databaseConfig);
        storage = new DatabaseStorage(connectionString);
      } else if (databaseConfig.provider === "mysql") {
        console.log("Initializing MySQL storage...");
        // MySQL storage would need to be implemented
        // For now, fall back to SQLite with a warning
        console.warn(
          "MySQL storage not yet implemented, falling back to SQLite",
        );
        storage = new SQLiteStorage("./data/finance.db");
      } else if (databaseConfig.provider === "planetscale") {
        console.log("Initializing PlanetScale storage...");
        // PlanetScale uses MySQL protocol
        console.warn(
          "PlanetScale storage not yet implemented, falling back to SQLite",
        );
        storage = new SQLiteStorage("./data/finance.db");
      } else {
        console.warn(
          `Provider ${databaseConfig.provider} not fully implemented, using SQLite`,
        );
        storage = new SQLiteStorage("./data/finance.db");
      }

      // Create admin user
      console.log("Creating admin user:", adminData.username);
      const hashedPassword = await AuthService.hashPassword(adminData.password);

      const userDataToCreate = {
        username: adminData.username,
        email: adminData.email,
        passwordHash: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        profileImageUrl: null,
        role: "admin",
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLoginAt: null,
      } as UpsertUser;

      const adminUser = await storage.createUser(userDataToCreate);
      console.log(
        `✓ Admin user created: ${adminUser.username} (ID: ${adminUser.id})`,
      );

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
          connectionString: buildConnectionString(databaseConfig),
          envGenerated,
        },
        deploymentContext: deploymentContext,
        createdAt: new Date(),
      };

      writeFileSync(this.configPath, JSON.stringify(initConfig, null, 2));
      console.log("✓ Initialization configuration saved");

      // Generate deployment instructions
      const deploymentInstructions =
        environmentManager.generateDeploymentInstructions(databaseConfig);

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
          connectionString: buildConnectionString(databaseConfig),
        },
        envGenerated,
        deploymentInstructions,
      };
    } catch (error) {
      console.error("Full initialization error:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown initialization error",
      };
    }
  }

  // Get setup recommendations based on deployment context
  public getSetupRecommendations(): {
    recommendedProvider: string;
    deploymentType: string;
    recommendations: string[];
    warnings?: string[];
  } {
    const context = environmentManager.getDeploymentContext();

    if (context.isDocker) {
      return {
        recommendedProvider: "supabase",
        deploymentType: "Docker Container",
        recommendations: [
          "Supabase is recommended for Docker deployments",
          "No additional containers needed",
          "Automatic scaling and backups",
          "Environment variables will be configured automatically",
        ],
        warnings: ["Ensure container has internet access for cloud databases"],
      };
    }

    if (context.hasEnvFile && context.detectedProvider) {
      return {
        recommendedProvider: context.detectedProvider,
        deploymentType: "Standalone with Existing Configuration",
        recommendations: [
          `Detected ${context.detectedProvider} configuration in .env`,
          "You can use existing configuration or reconfigure",
          "Backup will be created before any changes",
        ],
      };
    }

    return {
      recommendedProvider: "sqlite",
      deploymentType: "Standalone Development",
      recommendations: [
        "SQLite is perfect for development and testing",
        "No external database server required",
        "Easy to backup and migrate later",
        "Can upgrade to cloud database anytime",
      ],
    };
  }
  // Reset initialization (for development/testing)
  public resetInitialization(): void {
    console.log("Resetting initialization...");

    // Remove initialization file
    if (existsSync(this.configPath)) {
      try {
        require("fs").unlinkSync(this.configPath);
        console.log("✓ Removed initialization config");
      } catch (error) {
        console.error("Failed to reset initialization:", error);
      }
    }

    // Optionally backup and remove .env file
    if (existsSync("./.env")) {
      try {
        environmentManager.backupExistingEnv();
        console.log("✓ Backed up .env file");
      } catch (error) {
        console.error("Failed to backup .env file:", error);
      }
    }

    console.log("✓ Initialization reset complete");
  }
}

export const initializationManager = new InitializationManager();
