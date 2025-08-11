import {
  User,
  Account,
  Category,
  Transaction,
  Budget,
  Goal,
  Bill,
  Product,
  SystemConfig,
  ActivityLog,
  UpsertUser,
  InsertAccount,
  InsertCategory,
  InsertTransaction,
  InsertBudget,
  InsertGoal,
  InsertBill,
  InsertProduct,
  InsertSystemConfig,
  InsertActivityLog,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<UpsertUser>): Promise<User | undefined>;

  // Accounts
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Categories
  getCategories(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Transactions
  getTransactions(userId: number, filters?: {
    accountId?: number;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // Budgets
  getBudgets(userId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;

  // Goals
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;

  // Bills
  getBills(userId: number): Promise<Bill[]>;
  getBill(id: number): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: number, bill: Partial<InsertBill>): Promise<Bill | undefined>;
  deleteBill(id: number): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  searchProducts(query: string): Promise<Product[]>;

  // Analytics
  getAccountBalance(userId: number): Promise<number>;
  getMonthlyIncome(userId: number, month: string): Promise<number>;
  getMonthlyExpenses(userId: number, month: string): Promise<number>;
  getCategorySpending(userId: number, startDate: string, endDate: string): Promise<{ categoryId: number; amount: number; categoryName: string }[]>;

  // Admin - User Management
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }>;

  // Admin - System Configuration
  getSystemConfigs(category?: string): Promise<SystemConfig[]>;
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(key: string, config: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined>;
  deleteSystemConfig(key: string): Promise<boolean>;

  // Admin - Activity Logs
  getActivityLogs(filters?: { userId?: number; action?: string; resource?: string; limit?: number }): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  deleteActivityLogs(olderThanDays: number): Promise<number>;

  // Admin - System Analytics
  getSystemStats(): Promise<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private budgets: Map<number, Budget>;
  private goals: Map<number, Goal>;
  private bills: Map<number, Bill>;
  private products: Map<number, Product>;
  private systemConfigs: Map<string, SystemConfig>;
  private activityLogs: Map<number, ActivityLog>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.goals = new Map();
    this.bills = new Map();
    this.products = new Map();
    this.systemConfigs = new Map();
    this.activityLogs = new Map();
    this.currentId = 1;

    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Food & Dining", type: "expense", color: "#ff6b6b", isDefault: true },
      { name: "Transportation", type: "expense", color: "#4ecdc4", isDefault: true },
      { name: "Shopping", type: "expense", color: "#45b7d1", isDefault: true },
      { name: "Entertainment", type: "expense", color: "#f9ca24", isDefault: true },
      { name: "Bills & Utilities", type: "expense", color: "#f0932b", isDefault: true },
      { name: "Healthcare", type: "expense", color: "#eb4d4b", isDefault: true },
      { name: "Education", type: "expense", color: "#6c5ce7", isDefault: true },
      { name: "Personal Care", type: "expense", color: "#fd79a8", isDefault: true },
      { name: "Salary", type: "income", color: "#00b894", isDefault: true },
      { name: "Business Income", type: "income", color: "#00cec9", isDefault: true },
      { name: "Investment Returns", type: "income", color: "#74b9ff", isDefault: true },
      { name: "Other Income", type: "income", color: "#a29bfe", isDefault: true },
    ];

    defaultCategories.forEach((categoryData) => {
      const category: Category = {
        id: this.currentId++,
        ...categoryData,
        userId: 0, // System categories
        parentId: null,
      };
      this.categories.set(category.id, category);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: this.currentId++,
      username: userData.username,
      email: userData.email,
      passwordHash: userData.passwordHash,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role ?? "user",
      isActive: userData.isActive ?? true,
      isEmailVerified: userData.isEmailVerified ?? false,
      emailVerificationToken: userData.emailVerificationToken ?? null,
      passwordResetToken: userData.passwordResetToken ?? null,
      passwordResetExpires: userData.passwordResetExpires ?? null,
      lastLoginAt: userData.lastLoginAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Account operations
  async getAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const account: Account = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertAccount,
      balance: insertAccount.balance ?? "0",
      isActive: insertAccount.isActive ?? true,
    };
    this.accounts.set(account.id, account);
    return account;
  }

  async updateAccount(id: number, accountData: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...accountData };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Category operations
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(category => 
      category.userId === userId || category.userId === 0 // Include system categories
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.currentId++,
      ...insertCategory,
      color: insertCategory.color ?? "#0F766E",
      parentId: insertCategory.parentId ?? null,
      isDefault: insertCategory.isDefault ?? false,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Transaction operations
  async getTransactions(userId: number, filters?: {
    accountId?: number;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(transaction => transaction.userId === userId);

    if (filters) {
      if (filters.accountId) {
        transactions = transactions.filter(t => t.accountId === filters.accountId);
      }
      if (filters.categoryId) {
        transactions = transactions.filter(t => t.categoryId === filters.categoryId);
      }
      if (filters.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate!);
      }
      if (filters.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate!);
      }
      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }
    }

    return transactions;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertTransaction,
      notes: insertTransaction.notes ?? null,
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...transactionData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Budget operations
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.userId === userId);
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const budget: Budget = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertBudget,
      period: insertBudget.period ?? "monthly",
      isActive: insertBudget.isActive ?? true,
    };
    this.budgets.set(budget.id, budget);
    return budget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;

    const updatedBudget = { ...budget, ...budgetData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const goal: Goal = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertGoal,
      description: insertGoal.description ?? null,
      currentAmount: insertGoal.currentAmount ?? "0",
      targetDate: insertGoal.targetDate ?? null,
      isCompleted: insertGoal.isCompleted ?? false,
    };
    this.goals.set(goal.id, goal);
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal = { ...goal, ...goalData };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Bill operations
  async getBills(userId: number): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(bill => bill.userId === userId);
  }

  async getBill(id: number): Promise<Bill | undefined> {
    return this.bills.get(id);
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const bill: Bill = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertBill,
      notes: insertBill.notes ?? null,
      isRecurring: insertBill.isRecurring ?? true,
      isPaid: insertBill.isPaid ?? false,
    };
    this.bills.set(bill.id, bill);
    return bill;
  }

  async updateBill(id: number, billData: Partial<InsertBill>): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (!bill) return undefined;

    const updatedBill = { ...bill, ...billData };
    this.bills.set(id, updatedBill);
    return updatedBill;
  }

  async deleteBill(id: number): Promise<boolean> {
    return this.bills.delete(id);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    for (const product of this.products.values()) {
      if (product.barcode === barcode) {
        return product;
      }
    }
    return undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertProduct,
      barcode: insertProduct.barcode ?? null,
      category: insertProduct.category ?? null,
      brand: insertProduct.brand ?? null,
      lastPrice: insertProduct.lastPrice ?? null,
      averagePrice: insertProduct.averagePrice ?? null,
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(query.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Analytics operations
  async getAccountBalance(userId: number): Promise<number> {
    const accounts = await this.getAccounts(userId);
    return accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
  }

  async getMonthlyIncome(userId: number, month: string): Promise<number> {
    const transactions = await this.getTransactions(userId, {
      type: "income",
      startDate: `${month}-01`,
      endDate: `${month}-31`,
    });
    return transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  }

  async getMonthlyExpenses(userId: number, month: string): Promise<number> {
    const transactions = await this.getTransactions(userId, {
      type: "expense",
      startDate: `${month}-01`,
      endDate: `${month}-31`,
    });
    return transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  }

  async getCategorySpending(userId: number, startDate: string, endDate: string): Promise<{ categoryId: number; amount: number; categoryName: string }[]> {
    const transactions = await this.getTransactions(userId, {
      type: "expense",
      startDate,
      endDate,
    });

    const spending = new Map<number, number>();
    for (const transaction of transactions) {
      const current = spending.get(transaction.categoryId) || 0;
      spending.set(transaction.categoryId, current + parseFloat(transaction.amount));
    }

    const result = [];
    for (const [categoryId, amount] of spending.entries()) {
      const category = await this.getCategory(categoryId);
      result.push({
        categoryId,
        amount,
        categoryName: category?.name || "Unknown",
      });
    }

    return result;
  }

  // Admin - User Management
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }> {
    const users = Array.from(this.users.values());
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      adminUsers: users.filter(u => u.role === "admin").length,
    };
  }

  // System Config methods
  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    const configs = Array.from(this.systemConfigs.values());
    return category ? configs.filter(c => c.category === category) : configs;
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfigs.get(key);
  }

  async createSystemConfig(insertConfig: InsertSystemConfig): Promise<SystemConfig> {
    const config: SystemConfig = {
      id: this.currentId++,
      ...insertConfig,
      updatedAt: new Date(),
    };
    this.systemConfigs.set(config.key, config);
    return config;
  }

  async updateSystemConfig(key: string, configData: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    const config = this.systemConfigs.get(key);
    if (!config) return undefined;

    const updatedConfig = { ...config, ...configData, updatedAt: new Date() };
    this.systemConfigs.set(key, updatedConfig);
    return updatedConfig;
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    return this.systemConfigs.delete(key);
  }

  // Activity Log methods
  async getActivityLogs(filters?: { userId?: number; action?: string; resource?: string; limit?: number }): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values());

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }
    }

    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: this.currentId++,
      createdAt: new Date(),
      ...insertLog,
      resourceId: insertLog.resourceId ?? null,
      details: insertLog.details ?? null,
      ipAddress: insertLog.ipAddress ?? null,
      userAgent: insertLog.userAgent ?? null,
    };
    this.activityLogs.set(log.id, log);
    return log;
  }

  async deleteActivityLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    for (const [id, log] of this.activityLogs.entries()) {
      if (log.createdAt < cutoffDate) {
        this.activityLogs.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async getSystemStats(): Promise<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }> {
    return {
      totalTransactions: this.transactions.size,
      totalAccounts: this.accounts.size,
      totalCategories: this.categories.size,
      totalProducts: this.products.size,
      systemHealth: "healthy",
    };
  }
}

import { DatabaseStorage } from './database-storage';
import { SQLiteStorage } from './sqlite-storage';
import { databaseManager } from './database-manager';

// Initialize storage based on environment and active database configuration
function initializeStorage(): IStorage {
  // Check for explicit memory storage flag
  if (process.env.USE_MEMORY_STORAGE === 'true') {
    console.log('Using in-memory storage');
    return new MemStorage();
  }

  // Force SQLite to avoid WebSocket issues with Neon
  // Check for active database configuration from database manager
  const activeConfig = databaseManager.getActiveConnection();
  if (activeConfig && activeConfig.provider !== 'neon') {
    console.log(`Using database storage with ${activeConfig.provider}`);
    if (activeConfig.provider === 'sqlite') {
      return new SQLiteStorage(activeConfig.connectionString.replace('file:', ''));
    } else if (activeConfig.provider === 'postgresql' && !activeConfig.connectionString.includes('neon')) {
      return new DatabaseStorage(activeConfig.connectionString);
    }
  }
  
  // Default to SQLite storage (avoid Neon WebSocket issues)
  console.log('Using SQLite database storage (default - avoiding WebSocket issues)');
  return new SQLiteStorage('./data/finance.db');
}

export const storage = initializeStorage();