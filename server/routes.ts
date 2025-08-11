import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, setStorageFromWizard } from "./storage";
import { setupAuth, requireAuth, requireAdmin, AuthService } from "./customAuth";
import { 
  insertAccountSchema, insertCategorySchema, insertTransactionSchema,
  insertBudgetSchema, insertGoalSchema, insertBillSchema, insertProductSchema,
  insertUserSchema, updateUserSchema, insertSystemConfigSchema, insertActivityLogSchema
} from "@shared/schema";
import { databaseManager } from "./database-manager";
import { insertDatabaseConfigSchema } from "@shared/database-config";
import { initializationSchema } from "@shared/initialization-config";
import { initializationManager } from "./initialization-manager";

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if app is initialized (WordPress-style)
  app.get("/api/initialization/status", async (req, res) => {
    try {
      const status = initializationManager.getInitializationStatus();
      res.json(status);
    } catch (error) {
      res.json({ isInitialized: false });
    }
  });

  // Test database connection (before initialization)
  app.post("/api/initialization/test-database", async (req, res) => {
    try {
      const { provider, host, port, database, username, password, connectionString, supabaseUrl, supabaseAnonKey, supabaseServiceKey } = req.body;
      
      // Validate Supabase fields if provider is supabase
      if (provider === 'supabase') {
        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
          return res.json({ 
            success: false, 
            error: 'Supabase URL, Anonymous Key, and Service Role Key are required' 
          });
        }
      }
      
      const result = await initializationManager.testDatabaseConnection({
        provider,
        host,
        port,
        database,
        username,
        password,
        connectionString,
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceKey,
      });

      res.json(result);
    } catch (error) {
      res.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      });
    }
  });

  // Initialize the application (WordPress-style)
  app.post("/api/initialization", async (req, res) => {
    try {
      const { admin, database } = initializationSchema.parse(req.body);

      // Check if already initialized
      if (initializationManager.isInitialized()) {
        return res.status(400).json({ message: "Application is already initialized" });
      }

      // Initialize the application
      const result = await initializationManager.initializeApplication(admin, database);

      if (result.success) {
        // Set storage from the completed initialization
        await setStorageFromWizard(database.provider, database);
        
        res.json({
          message: "Application initialized successfully",
          admin: result.adminUser,
          database: result.database,
          isInitialized: true
        });
      } else {
        res.status(400).json({
          message: "Initialization failed",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Initialization error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      res.status(500).json({
        message: "Initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      });
    }
  });

  // Auth middleware
  setupAuth(app);

  // Protected route examples
  app.get("/api/protected", requireAuth, async (req: any, res) => {
    const userId = req.user?.id;
    res.json({ message: "Access granted", userId });
  });

  // Accounts API
  app.get("/api/accounts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = insertAccountSchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const account = await storage.createAccount(result.data);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.get("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.put("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertAccountSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const account = await storage.updateAccount(id, result.data);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Categories API  
  app.get("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = insertCategorySchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const category = await storage.createCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Transactions API
  app.get("/api/transactions", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, categoryId, startDate, endDate, type } = req.query;
      
      const filters = {
        accountId: accountId ? parseInt(accountId as string) : undefined,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string
      };

      const transactions = await storage.getTransactions(userId, filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = insertTransactionSchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const transaction = await storage.createTransaction(result.data);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Budgets API
  app.get("/api/budgets", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = insertBudgetSchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const budget = await storage.createBudget(result.data);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  // Goals API
  app.get("/api/goals", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = insertGoalSchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const goal = await storage.createGoal(result.data);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Bills API
  app.get("/api/bills", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bills = await storage.getBills(userId);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post("/api/bills", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = insertBillSchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const bill = await storage.createBill(result.data);
      res.status(201).json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(500).json({ message: "Failed to create bill" });
    }
  });

  // Products API (public endpoints)
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const products = await storage.searchProducts(q as string);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      const product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const result = insertProductSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const product = await storage.createProduct(result.data);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Analytics API
  app.get("/api/analytics/balance", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const balance = await storage.getAccountBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get("/api/analytics/income/:month", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { month } = req.params;
      const income = await storage.getMonthlyIncome(userId, month);
      res.json({ income });
    } catch (error) {
      console.error("Error fetching income:", error);
      res.status(500).json({ message: "Failed to fetch income" });
    }
  });

  app.get("/api/analytics/expenses/:month", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { month } = req.params;
      const expenses = await storage.getMonthlyExpenses(userId, month);
      res.json({ expenses });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/analytics/category-spending", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const spending = await storage.getCategorySpending(userId, startDate as string, endDate as string);
      res.json(spending);
    } catch (error) {
      console.error("Error fetching category spending:", error);
      res.status(500).json({ message: "Failed to fetch category spending" });
    }
  });

  // Initialize admin user in Supabase (temporary endpoint for setup)
  app.post("/api/admin/create-from-initialization", async (req: any, res) => {
    try {
      // Get initialization config
      const config = initializationManager.getInitializationStatus();
      if (!config.isInitialized || !config.adminUser) {
        return res.status(400).json({ message: "No initialization data found" });
      }

      // Check if admin user already exists
      const existingUser = await storage.getUserByUsername(config.adminUser.username);
      if (existingUser) {
        return res.json({ message: "Admin user already exists", user: existingUser });
      }

      // Create the admin user in Supabase with the same credentials as initialization
      const hashedPassword = await AuthService.hashPassword("Admin123!");
      const adminUser = await storage.createUser({
        username: config.adminUser.username,
        email: config.adminUser.email,
        passwordHash: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        profileImageUrl: null,
        role: "admin",
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLoginAt: null,
      });

      console.log("Admin user created in Supabase:", adminUser.username);
      const { passwordHash, ...safeUser } = adminUser;
      res.json({ message: "Admin user created successfully", user: safeUser });
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password hashes from response
      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const { password, ...userData } = req.body;
      
      // Hash the password using the same method as registration
      const hashedPassword = await AuthService.hashPassword(password || "defaultpassword123");
      
      // Create a UpsertUser object with all required fields
      const userToCreate: any = {
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        role: userData.role || "user",
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        isEmailVerified: true, // Admin created users are auto-verified
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLoginAt: null
      };
      
      const user = await storage.createUser(userToCreate);
      // Remove password hash from response
      const { passwordHash, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateUserSchema.parse(req.body);
      
      // If password is provided, hash it
      if (updates.password) {
        const { password, ...otherUpdates } = updates;
        const hashedPassword = await AuthService.hashPassword(password);
        const finalUpdates = {
          ...otherUpdates,
          passwordHash: hashedPassword
        };
        const user = await storage.updateUser(id, finalUpdates);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      } else {
        // No password update, just update other fields
        const { password, ...finalUpdates } = updates;
        const user = await storage.updateUser(id, finalUpdates);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/users/stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  app.get("/api/admin/system/stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system statistics" });
    }
  });

  // Database Management Routes
  app.get("/api/admin/databases", requireAdmin, async (req: any, res) => {
    try {
      const configs = databaseManager.getDatabaseConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching database configs:", error);
      res.status(500).json({ message: "Failed to fetch database configurations" });
    }
  });

  app.post("/api/admin/databases", requireAdmin, async (req: any, res) => {
    try {
      const configData = insertDatabaseConfigSchema.parse(req.body);
      const config = await databaseManager.addDatabaseConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error adding database config:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to add database configuration" 
      });
    }
  });

  app.put("/api/admin/databases/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const updates = insertDatabaseConfigSchema.partial().parse(req.body);
      const config = await databaseManager.updateDatabaseConfig(id, updates);
      
      if (!config) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error updating database config:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update database configuration" 
      });
    }
  });

  app.delete("/api/admin/databases/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const deleted = await databaseManager.deleteDatabaseConfig(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      res.json({ message: "Database configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting database config:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete database configuration" 
      });
    }
  });

  app.post("/api/admin/databases/:id/test", requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const config = databaseManager.getDatabaseConfig(id);
      
      if (!config) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      const result = await databaseManager.testConnection(config);
      res.json(result);
    } catch (error) {
      console.error("Error testing database connection:", error);
      res.status(500).json({ message: "Failed to test database connection" });
    }
  });

  app.post("/api/admin/databases/:id/activate", requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      await databaseManager.switchActiveDatabase(id);
      
      res.json({ message: "Database activated successfully" });
    } catch (error) {
      console.error("Error activating database:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to activate database" 
      });
    }
  });

  app.post("/api/admin/databases/migrate", requireAdmin, async (req: any, res) => {
    try {
      const { fromConfigId, toConfigId } = req.body;
      
      if (!toConfigId) {
        return res.status(400).json({ message: "Target database configuration is required" });
      }
      
      const migrationId = await databaseManager.migrateData(fromConfigId || null, toConfigId);
      res.json({ migrationId, message: "Migration started successfully" });
    } catch (error) {
      console.error("Error starting migration:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to start data migration" 
      });
    }
  });

  app.get("/api/admin/databases/migrations", requireAdmin, async (req: any, res) => {
    try {
      const migrations = databaseManager.getMigrationLogs();
      res.json(migrations);
    } catch (error) {
      console.error("Error fetching migration logs:", error);
      res.status(500).json({ message: "Failed to fetch migration logs" });
    }
  });

  app.get("/api/admin/databases/migrations/:id", requireAdmin, async (req: any, res) => {
    try {
      const id = req.params.id;
      const migration = databaseManager.getMigrationLog(id);
      
      if (!migration) {
        return res.status(404).json({ message: "Migration log not found" });
      }
      
      res.json(migration);
    } catch (error) {
      console.error("Error fetching migration log:", error);
      res.status(500).json({ message: "Failed to fetch migration log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}