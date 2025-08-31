import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { IStorage } from './storage';
import { 
  User, Account, Category, Transaction, Budget, Goal, Bill, Product, SystemConfig, ActivityLog,
  UpsertUser, InsertAccount, InsertCategory, InsertTransaction, InsertBudget, 
  InsertGoal, InsertBill, InsertProduct, InsertSystemConfig, InsertActivityLog
} from '@shared/schema';
import { eq, and, sql, desc, asc, like, gte, lte } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  private db: any;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool, { schema });
  }

  async close() {
    await this.pool.end();
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
    // Create a clean user object excluding null timestamp fields
    const { lastLoginAt, passwordResetExpires, ...cleanUser } = user;
    
    const result = await this.db.insert(schema.users).values({
      ...cleanUser,
      // Only include timestamp fields if they have actual values
      ...(lastLoginAt && { lastLoginAt }),
      ...(passwordResetExpires && { passwordResetExpires }),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User | undefined> {
    // Handle timestamp fields properly for updates as well
    const { lastLoginAt, passwordResetExpires, ...cleanUpdates } = updates;
    
    const result = await this.db.update(schema.users)
      .set({ 
        ...cleanUpdates,
        ...(lastLoginAt !== undefined && { lastLoginAt }),
        ...(passwordResetExpires !== undefined && { passwordResetExpires }),
        updatedAt: new Date() 
      })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
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
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const result = await this.db.update(schema.accounts)
      .set(account)
      .where(eq(schema.accounts.id, id))
      .returning();
    return result[0];
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.accounts).where(eq(schema.accounts.id, id));
    return result.rowCount > 0;
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return await this.db.select().from(schema.categories)
      .where(sql`${schema.categories.userId} = ${userId} OR ${schema.categories.userId} = 0`);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await this.db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(schema.categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await this.db.update(schema.categories)
      .set(category)
      .where(eq(schema.categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.categories).where(eq(schema.categories.id, id));
    return result.rowCount > 0;
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

    return await query.orderBy(desc(schema.transactions.date));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await this.db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).limit(1);
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db.insert(schema.transactions).values({
      ...transaction,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await this.db.update(schema.transactions)
      .set(transaction)
      .where(eq(schema.transactions.id, id))
      .returning();
    return result[0];
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.transactions).where(eq(schema.transactions.id, id));
    return result.rowCount > 0;
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
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const result = await this.db.update(schema.budgets)
      .set(budget)
      .where(eq(schema.budgets.id, id))
      .returning();
    return result[0];
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.budgets).where(eq(schema.budgets.id, id));
    return result.rowCount > 0;
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
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const result = await this.db.update(schema.goals)
      .set(goal)
      .where(eq(schema.goals.id, id))
      .returning();
    return result[0];
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.goals).where(eq(schema.goals.id, id));
    return result.rowCount > 0;
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
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateBill(id: number, bill: Partial<InsertBill>): Promise<Bill | undefined> {
    const result = await this.db.update(schema.bills)
      .set(bill)
      .where(eq(schema.bills.id, id))
      .returning();
    return result[0];
  }

  async deleteBill(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.bills).where(eq(schema.bills.id, id));
    return result.rowCount > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await this.db.select().from(schema.products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await this.db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    return result[0];
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const result = await this.db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(schema.products).values({
      ...product,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await this.db.update(schema.products)
      .set(product)
      .where(eq(schema.products.id, id))
      .returning();
    return result[0];
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await this.db.select().from(schema.products)
      .where(sql`${schema.products.name} ILIKE ${`%${query}%`} OR ${schema.products.brand} ILIKE ${`%${query}%`} OR ${schema.products.category} ILIKE ${`%${query}%`}`);
  }

  // Analytics
  async getAccountBalance(userId: number): Promise<{ balance: number }> {
    const accounts = await this.getAccounts(userId);
    const balance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
    return { balance };
  }

  async getMonthlyIncome(userId: number, month: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'income'),
          sql`DATE_TRUNC('month', ${schema.transactions.date}) = ${month}-01`
        )
      );
    return result[0]?.total || 0;
  }

  async getMonthlyExpenses(userId: number, month: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.type, 'expense'),
          sql`DATE_TRUNC('month', ${schema.transactions.date}) = ${month}-01`
        )
      );
    return result[0]?.total || 0;
  }

  async getCategorySpending(userId: number, startDate: string, endDate: string): Promise<{ categoryId: number; amount: number; categoryName: string }[]> {
    const result = await this.db
      .select({
        categoryId: schema.transactions.categoryId,
        amount: sql<number>`SUM(${schema.transactions.amount})`,
        categoryName: schema.categories.name,
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

    return result.map((row: any) => ({
      categoryId: row.categoryId,
      amount: row.amount,
      categoryName: row.categoryName || 'Unknown',
    }));
  }

  // Admin - User Management
  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(schema.users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.users).where(eq(schema.users.id, id));
    return result.rowCount > 0;
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }> {
    const stats = await this.db
      .select({
        totalUsers: sql<number>`COUNT(*)`,
        activeUsers: sql<number>`COUNT(*) FILTER (WHERE ${schema.users.isActive} = true)`,
        adminUsers: sql<number>`COUNT(*) FILTER (WHERE ${schema.users.role} = 'admin')`,
      })
      .from(schema.users);

    return stats[0] || { totalUsers: 0, activeUsers: 0, adminUsers: 0 };
  }

  // Admin - System Configuration
  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    if (category) {
      return await this.db.select().from(schema.systemConfig).where(eq(schema.systemConfig.category, category));
    }
    return await this.db.select().from(schema.systemConfig);
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const result = await this.db.select().from(schema.systemConfig).where(eq(schema.systemConfig.key, key)).limit(1);
    return result[0];
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const result = await this.db.insert(schema.systemConfig).values({
      ...config,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateSystemConfig(key: string, config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    const result = await this.db.update(schema.systemConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(schema.systemConfig.key, key))
      .returning();
    return result[0];
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    const result = await this.db.delete(schema.systemConfig).where(eq(schema.systemConfig.key, key));
    return result.rowCount > 0;
  }

  // Admin - Activity Logs
  async getActivityLogs(filters?: { userId?: number; action?: string; resource?: string; limit?: number }): Promise<ActivityLog[]> {
    let query = this.db.select().from(schema.activityLogs);

    if (filters?.userId) {
      query = query.where(eq(schema.activityLogs.userId, filters.userId));
    }
    if (filters?.action) {
      query = query.where(eq(schema.activityLogs.action, filters.action));
    }
    if (filters?.resource) {
      query = query.where(eq(schema.activityLogs.resource, filters.resource));
    }

    query = query.orderBy(desc(schema.activityLogs.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await this.db.insert(schema.activityLogs).values({
      ...log,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async deleteActivityLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.db.delete(schema.activityLogs)
      .where(sql`${schema.activityLogs.createdAt} < ${cutoffDate}`);
    
    return result.rowCount || 0;
  }

  // Admin - System Analytics
  async getSystemStats(): Promise<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }> {
    const [transactionCount, accountCount, categoryCount, productCount] = await Promise.all([
      this.db.select({ count: sql<number>`COUNT(*)` }).from(schema.transactions),
      this.db.select({ count: sql<number>`COUNT(*)` }).from(schema.accounts),
      this.db.select({ count: sql<number>`COUNT(*)` }).from(schema.categories),
      this.db.select({ count: sql<number>`COUNT(*)` }).from(schema.products),
    ]);

    return {
      totalTransactions: transactionCount[0]?.count || 0,
      totalAccounts: accountCount[0]?.count || 0,
      totalCategories: categoryCount[0]?.count || 0,
      totalProducts: productCount[0]?.count || 0,
      systemHealth: "healthy",
    };
  }
}