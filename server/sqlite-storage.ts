import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/sqlite-schema';
import fs from 'fs';
import path from 'path';
import { IStorage } from './storage';
import { 
  User, Account, Category, Transaction, Budget, Goal, Bill, Product, SystemConfig, ActivityLog,
  UpsertUser, InsertAccount, InsertCategory, InsertTransaction, InsertBudget, 
  InsertGoal, InsertBill, InsertProduct, InsertSystemConfig, InsertActivityLog
} from '@shared/schema';
import { eq, and, sql, desc, asc, like, gte, lte } from 'drizzle-orm';

export class SQLiteStorage implements IStorage {
  private db: any;
  private sqlite: Database.Database;

  constructor(dbPath: string = './data/finance.db') {
    // Create data directory if it doesn't exist
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, { schema });
    
    // Enable foreign keys and WAL mode for better performance
    this.sqlite.pragma('foreign_keys = ON');
    this.sqlite.pragma('journal_mode = WAL');
    
    // Initialize schema
    this.initializeSchema();
  }

  private initializeSchema() {
    // Create tables if they don't exist
    try {
      // Check if users table exists, if not create all tables
      const tableExists = this.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
      
      if (!tableExists) {
        console.log('Initializing SQLite database schema...');
        
        // Create tables in dependency order
        this.sqlite.exec(`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "username" TEXT NOT NULL UNIQUE,
            "email" TEXT NOT NULL UNIQUE,
            "password_hash" TEXT NOT NULL,
            "first_name" TEXT,
            "last_name" TEXT,
            "profile_image_url" TEXT,
            "role" TEXT NOT NULL DEFAULT 'user',
            "is_active" INTEGER NOT NULL DEFAULT 1,
            "is_email_verified" INTEGER NOT NULL DEFAULT 0,
            "email_verification_token" TEXT,
            "password_reset_token" TEXT,
            "password_reset_expires" TEXT,
            "last_login_at" TEXT,
            "created_at" TEXT NOT NULL,
            "updated_at" TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS "categories" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "user_id" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "color" TEXT NOT NULL DEFAULT '#0F766E',
            "parent_id" INTEGER,
            "is_default" INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
            FOREIGN KEY ("parent_id") REFERENCES "categories" ("id")
          );

          CREATE TABLE IF NOT EXISTS "accounts" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "user_id" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "balance" REAL NOT NULL DEFAULT 0,
            "is_active" INTEGER NOT NULL DEFAULT 1,
            "created_at" TEXT NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
          );

          CREATE TABLE IF NOT EXISTS "transactions" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "user_id" INTEGER NOT NULL,
            "account_id" INTEGER NOT NULL,
            "category_id" INTEGER NOT NULL,
            "amount" REAL NOT NULL,
            "description" TEXT NOT NULL,
            "notes" TEXT,
            "date" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "created_at" TEXT NOT NULL,
            FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
            FOREIGN KEY ("account_id") REFERENCES "accounts" ("id"),
            FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
          );

          CREATE TABLE IF NOT EXISTS "budgets" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "userId" INTEGER NOT NULL,
            "categoryId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            "amount" REAL NOT NULL,
            "spent" REAL NOT NULL DEFAULT 0,
            "period" TEXT NOT NULL,
            "startDate" TEXT NOT NULL,
            "endDate" TEXT NOT NULL,
            "isActive" INTEGER NOT NULL DEFAULT 1,
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "users" ("id"),
            FOREIGN KEY ("categoryId") REFERENCES "categories" ("id")
          );

          CREATE TABLE IF NOT EXISTS "goals" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "userId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "targetAmount" REAL NOT NULL,
            "currentAmount" REAL NOT NULL DEFAULT 0,
            "targetDate" TEXT,
            "category" TEXT NOT NULL,
            "isActive" INTEGER NOT NULL DEFAULT 1,
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "users" ("id")
          );

          CREATE TABLE IF NOT EXISTS "bills" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "userId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            "amount" REAL NOT NULL,
            "dueDate" TEXT NOT NULL,
            "frequency" TEXT NOT NULL,
            "categoryId" INTEGER NOT NULL,
            "accountId" INTEGER,
            "isPaid" INTEGER NOT NULL DEFAULT 0,
            "isActive" INTEGER NOT NULL DEFAULT 1,
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "users" ("id"),
            FOREIGN KEY ("categoryId") REFERENCES "categories" ("id"),
            FOREIGN KEY ("accountId") REFERENCES "accounts" ("id")
          );

          CREATE TABLE IF NOT EXISTS "products" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "name" TEXT NOT NULL,
            "brand" TEXT,
            "category" TEXT,
            "barcode" TEXT,
            "averagePrice" REAL,
            "createdAt" TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS "system_configs" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "key" TEXT NOT NULL UNIQUE,
            "value" TEXT NOT NULL,
            "description" TEXT,
            "updatedAt" TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS "activity_logs" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "userId" INTEGER NOT NULL,
            "action" TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "entityId" INTEGER,
            "details" TEXT,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "users" ("id")
          );
        `);

        console.log('SQLite database schema initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing SQLite schema:', error);
    }
  }

  async close() {
    this.sqlite.close();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: UpsertUser): Promise<User> {
    const now = new Date().toISOString();
    const result = await this.db.insert(schema.users).values({
      ...user,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const result = await this.db.update(schema.users)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(schema.users).orderBy(asc(schema.users.username));
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.users).where(eq(schema.users.id, id));
    return result.changes > 0;
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }> {
    const totalUsers = await this.db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const activeUsers = await this.db.select({ count: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.isActive, true));
    const admins = await this.db.select({ count: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.role, 'admin'));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      adminUsers: admins[0]?.count || 0
    };
  }

  // Accounts
  async getAccounts(userId: number): Promise<Account[]> {
    return await this.db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const result = await this.db.select().from(schema.accounts).where(eq(schema.accounts.id, id)).limit(1);
    return result[0];
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const result = await this.db.insert(schema.accounts).values({
      ...account,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const result = await this.db.update(schema.accounts)
      .set(updates)
      .where(eq(schema.accounts.id, id))
      .returning();
    return result[0];
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.accounts).where(eq(schema.accounts.id, id));
    return result.changes > 0;
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return await this.db.select().from(schema.categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await this.db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(schema.categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await this.db.update(schema.categories)
      .set(updates)
      .where(eq(schema.categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.categories).where(eq(schema.categories.id, id));
    return result.changes > 0;
  }

  // Transactions
  async getTransactions(userId: number, filters?: { 
    accountId?: number; 
    categoryId?: number; 
    startDate?: string; 
    endDate?: string; 
    type?: string; 
  }): Promise<Transaction[]> {
    let query = this.db.select().from(schema.transactions).where(eq(schema.transactions.userId, userId));

    if (filters?.accountId) {
      query = query.where(eq(schema.transactions.accountId, filters.accountId));
    }

    if (filters?.categoryId) {
      query = query.where(eq(schema.transactions.categoryId, filters.categoryId));
    }

    if (filters?.startDate) {
      query = query.where(gte(schema.transactions.date, filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where(lte(schema.transactions.date, filters.endDate));
    }

    if (filters?.type) {
      query = query.where(eq(schema.transactions.type, filters.type));
    }

    query = query.orderBy(desc(schema.transactions.date));

    return await query;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await this.db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).limit(1);
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db.insert(schema.transactions).values({
      ...transaction,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await this.db.update(schema.transactions)
      .set(updates)
      .where(eq(schema.transactions.id, id))
      .returning();
    return result[0];
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.transactions).where(eq(schema.transactions.id, id));
    return result.changes > 0;
  }

  // Budgets
  async getBudgets(userId: number): Promise<Budget[]> {
    return await this.db.select().from(schema.budgets).where(eq(schema.budgets.userId, userId));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const result = await this.db.select().from(schema.budgets).where(eq(schema.budgets.id, id)).limit(1);
    return result[0];
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const result = await this.db.insert(schema.budgets).values({
      ...budget,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateBudget(id: number, updates: Partial<InsertBudget>): Promise<Budget | undefined> {
    const result = await this.db.update(schema.budgets)
      .set(updates)
      .where(eq(schema.budgets.id, id))
      .returning();
    return result[0];
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.budgets).where(eq(schema.budgets.id, id));
    return result.changes > 0;
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return await this.db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const result = await this.db.select().from(schema.goals).where(eq(schema.goals.id, id)).limit(1);
    return result[0];
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await this.db.insert(schema.goals).values({
      ...goal,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateGoal(id: number, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const result = await this.db.update(schema.goals)
      .set(updates)
      .where(eq(schema.goals.id, id))
      .returning();
    return result[0];
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.goals).where(eq(schema.goals.id, id));
    return result.changes > 0;
  }

  // Bills
  async getBills(userId: number): Promise<Bill[]> {
    return await this.db.select().from(schema.bills).where(eq(schema.bills.userId, userId));
  }

  async getBill(id: number): Promise<Bill | undefined> {
    const result = await this.db.select().from(schema.bills).where(eq(schema.bills.id, id)).limit(1);
    return result[0];
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const result = await this.db.insert(schema.bills).values({
      ...bill,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateBill(id: number, updates: Partial<InsertBill>): Promise<Bill | undefined> {
    const result = await this.db.update(schema.bills)
      .set(updates)
      .where(eq(schema.bills.id, id))
      .returning();
    return result[0];
  }

  async deleteBill(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.bills).where(eq(schema.bills.id, id));
    return result.changes > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await this.db.select().from(schema.products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await this.db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(schema.products).values({
      ...product,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await this.db.update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.products).where(eq(schema.products.id, id));
    return result.changes > 0;
  }

  // System
  async getSystemStats(): Promise<{ totalTransactions: number; totalAccounts: number; totalCategories: number; totalProducts: number; systemHealth: string }> {
    const totalTransactions = await this.db.select({ count: sql<number>`count(*)` }).from(schema.transactions);
    const totalAccounts = await this.db.select({ count: sql<number>`count(*)` }).from(schema.accounts);
    const totalCategories = await this.db.select({ count: sql<number>`count(*)` }).from(schema.categories);
    const totalProducts = await this.db.select({ count: sql<number>`count(*)` }).from(schema.products);

    return {
      totalTransactions: totalTransactions[0]?.count || 0,
      totalAccounts: totalAccounts[0]?.count || 0,
      totalCategories: totalCategories[0]?.count || 0,
      totalProducts: totalProducts[0]?.count || 0,
      systemHealth: 'good'
    };
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const result = await this.db.insert(schema.systemConfig).values({
      ...config,
      updatedAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await this.db.insert(schema.activityLog).values({
      ...log,
      createdAt: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  // Additional methods required by IStorage interface
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const result = await this.db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);
    return result[0];
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(like(schema.products.name, `%${query}%`));
  }

  async getAccountBalance(userId: number): Promise<number> {
    const accounts = await this.getAccounts(userId);
    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  async getMonthlyIncome(userId: number, month: string): Promise<number> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    const result = await this.db.select({ total: sql<number>`sum(amount)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'income'),
          gte(schema.transactions.date, startDate),
          lte(schema.transactions.date, endDate)
        )
      );
    
    return result[0]?.total || 0;
  }

  async getMonthlyExpenses(userId: number, month: string): Promise<number> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    const result = await this.db.select({ total: sql<number>`sum(amount)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'expense'),
          gte(schema.transactions.date, startDate),
          lte(schema.transactions.date, endDate)
        )
      );
    
    return result[0]?.total || 0;
  }

  async getCategorySpending(userId: number, startDate: string, endDate: string): Promise<{ categoryId: number; amount: number; categoryName: string }[]> {
    const result = await this.db.select({
      categoryId: schema.transactions.categoryId,
      amount: sql<number>`sum(amount)`,
      categoryName: schema.categories.name
    })
      .from(schema.transactions)
      .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'expense'),
          gte(schema.transactions.date, startDate),
          lte(schema.transactions.date, endDate)
        )
      )
      .groupBy(schema.transactions.categoryId, schema.categories.name);
    
    return result.map(r => ({ categoryId: r.categoryId, amount: r.amount, categoryName: r.categoryName || 'Unknown' }));
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const result = await this.db.select().from(schema.systemConfig).where(eq(schema.systemConfig.key, key)).limit(1);
    return result[0];
  }

  async updateSystemConfig(key: string, config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    const result = await this.db.update(schema.systemConfig)
      .set({ ...config, updatedAt: new Date().toISOString() })
      .where(eq(schema.systemConfig.key, key))
      .returning();
    return result[0];
  }

  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    if (category) {
      return await this.db.select().from(schema.systemConfig).where(eq(schema.systemConfig.category, category));
    }
    return await this.db.select().from(schema.systemConfig);
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    const result = await this.db.delete(schema.systemConfig).where(eq(schema.systemConfig.key, key));
    return result.changes > 0;
  }

  async getActivityLogs(filters?: { userId?: number; action?: string; resource?: string; limit?: number }): Promise<ActivityLog[]> {
    let query = this.db.select().from(schema.activityLog);

    if (filters?.userId) {
      query = query.where(eq(schema.activityLog.userId, filters.userId));
    }

    if (filters?.action) {
      query = query.where(eq(schema.activityLog.action, filters.action));
    }

    query = query.orderBy(desc(schema.activityLog.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    return await this.logActivity(log);
  }

  async deleteActivityLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await this.db.delete(schema.activityLog)
      .where(lte(schema.activityLog.createdAt, cutoffDate.toISOString()));
    
    return result.changes;
  }

  async getRecentActivity(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    return await this.db.select().from(schema.activityLog)
      .where(eq(schema.activityLog.userId, userId))
      .orderBy(desc(schema.activityLog.createdAt))
      .limit(limit);
  }

  async bulkInsertTransactions(transactions: InsertTransaction[]): Promise<Transaction[]> {
    const result = await this.db.insert(schema.transactions)
      .values(transactions.map(t => ({ ...t, createdAt: new Date().toISOString() })))
      .returning();
    return result;
  }

  async getTransactionsByDateRange(userId: number, startDate: string, endDate: string): Promise<Transaction[]> {
    return await this.db.select().from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          gte(schema.transactions.date, startDate),
          lte(schema.transactions.date, endDate)
        )
      )
      .orderBy(desc(schema.transactions.date));
  }

  async getUserActivitySummary(userId: number): Promise<{ lastLogin: Date | null; totalTransactions: number; totalSpent: number }> {
    const totalTransactions = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId));
    
    const totalSpent = await this.db.select({ total: sql<number>`sum(amount)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'expense')
        )
      );

    return {
      lastLogin: null, // Would need a login tracking table
      totalTransactions: totalTransactions[0]?.count || 0,
      totalSpent: totalSpent[0]?.total || 0
    };
  }
}