import { 
  users, accounts, categories, transactions, budgets, goals, bills, products, systemConfig, activityLogs,
  type User, type InsertUser, type Account, type InsertAccount, 
  type Category, type InsertCategory, type Transaction, type InsertTransaction,
  type Budget, type InsertBudget, type Goal, type InsertGoal,
  type Bill, type InsertBill, type Product, type InsertProduct,
  type SystemConfig, type InsertSystemConfig, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
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

    // Initialize with default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Groceries", type: "expense", color: "#0F766E" },
      { name: "Dining Out", type: "expense", color: "#10B981" },
      { name: "Transportation", type: "expense", color: "#F59E0B" },
      { name: "Entertainment", type: "expense", color: "#3B82F6" },
      { name: "Utilities", type: "expense", color: "#8B5CF6" },
      { name: "Shopping", type: "expense", color: "#EF4444" },
      { name: "Healthcare", type: "expense", color: "#EC4899" },
      { name: "Salary", type: "income", color: "#10B981" },
      { name: "Freelance", type: "income", color: "#059669" },
      { name: "Investments", type: "income", color: "#0D9488" },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = {
        id: this.currentId++,
        userId: 1, // Default user
        name: cat.name,
        type: cat.type,
        color: cat.color,
        parentId: null,
        isDefault: true,
      };
      this.categories.set(category.id, category);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentId++,
      role: insertUser.role || "user",
      isActive: insertUser.isActive ?? true,
      lastLogin: insertUser.lastLogin || null,
      preferences: insertUser.preferences || null,
      avatar: insertUser.avatar || null,
      phoneNumber: insertUser.phoneNumber || null,
      dateOfBirth: insertUser.dateOfBirth || null,
      timezone: insertUser.timezone || "UTC",
      currency: insertUser.currency || "USD",
      language: insertUser.language || "en",
      emailNotifications: insertUser.emailNotifications ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Accounts
  async getAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const account: Account = {
      ...insertAccount,
      id: this.currentId++,
      balance: insertAccount.balance || "0.00",
      isActive: insertAccount.isActive ?? true,
      createdAt: new Date(),
    };
    this.accounts.set(account.id, account);
    return account;
  }

  async updateAccount(id: number, accountData: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updated = { ...account, ...accountData };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      category => category.userId === userId || category.isDefault
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      id: this.currentId++,
      color: insertCategory.color || "#6b7280",
      parentId: insertCategory.parentId ?? null,
      isDefault: insertCategory.isDefault ?? false,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated = { ...category, ...categoryData };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Transactions
  async getTransactions(userId: number, filters?: {
    accountId?: number;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Transaction[]> {
    let result = Array.from(this.transactions.values()).filter(transaction => transaction.userId === userId);
    
    if (filters?.accountId) {
      result = result.filter(t => t.accountId === filters.accountId);
    }
    if (filters?.categoryId) {
      result = result.filter(t => t.categoryId === filters.categoryId);
    }
    if (filters?.startDate) {
      result = result.filter(t => t.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(t => t.date <= filters.endDate!);
    }
    if (filters?.type) {
      result = result.filter(t => t.type === filters.type);
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      ...insertTransaction,
      id: this.currentId++,
      notes: insertTransaction.notes ?? null,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    
    // Update account balance
    const account = this.accounts.get(transaction.accountId);
    if (account) {
      const amount = parseFloat(transaction.amount);
      const newBalance = parseFloat(account.balance) + (transaction.type === "income" ? amount : -amount);
      account.balance = newBalance.toFixed(2);
      this.accounts.set(account.id, account);
    }
    
    return transaction;
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated = { ...transaction, ...transactionData };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Budgets
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.userId === userId);
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const budget: Budget = {
      ...insertBudget,
      id: this.currentId++,
      isActive: insertBudget.isActive ?? true,
      period: insertBudget.period || "monthly",
      createdAt: new Date(),
    };
    this.budgets.set(budget.id, budget);
    return budget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updated = { ...budget, ...budgetData };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Goals
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const goal: Goal = {
      ...insertGoal,
      id: this.currentId++,
      description: insertGoal.description ?? null,
      currentAmount: insertGoal.currentAmount || "0.00",
      targetDate: insertGoal.targetDate ?? null,
      isCompleted: insertGoal.isCompleted ?? false,
      createdAt: new Date(),
    };
    this.goals.set(goal.id, goal);
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updated = { ...goal, ...goalData };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Bills
  async getBills(userId: number): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(bill => bill.userId === userId);
  }

  async getBill(id: number): Promise<Bill | undefined> {
    return this.bills.get(id);
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const bill: Bill = {
      ...insertBill,
      id: this.currentId++,
      notes: insertBill.notes ?? null,
      isRecurring: insertBill.isRecurring ?? true,
      isPaid: insertBill.isPaid ?? false,
      createdAt: new Date(),
    };
    this.bills.set(bill.id, bill);
    return bill;
  }

  async updateBill(id: number, billData: Partial<InsertBill>): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (!bill) return undefined;
    
    const updated = { ...bill, ...billData };
    this.bills.set(id, updated);
    return updated;
  }

  async deleteBill(id: number): Promise<boolean> {
    return this.bills.delete(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.barcode === barcode);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      ...insertProduct,
      id: this.currentId++,
      barcode: insertProduct.barcode ?? null,
      brand: insertProduct.brand ?? null,
      category: insertProduct.category ?? null,
      lastPrice: insertProduct.lastPrice ?? null,
      averagePrice: insertProduct.averagePrice ?? null,
      createdAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { ...product, ...productData };
    this.products.set(id, updated);
    return updated;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.brand?.toLowerCase().includes(lowercaseQuery) ||
      product.category?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Analytics
  async getAccountBalance(userId: number): Promise<number> {
    const userAccounts = await this.getAccounts(userId);
    return userAccounts.reduce((total, account) => total + parseFloat(account.balance), 0);
  }

  async getMonthlyIncome(userId: number, month: string): Promise<number> {
    const transactions = await this.getTransactions(userId, {
      type: "income",
      startDate: `${month}-01`,
      endDate: `${month}-31`
    });
    return transactions.reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
  }

  async getMonthlyExpenses(userId: number, month: string): Promise<number> {
    const transactions = await this.getTransactions(userId, {
      type: "expense",
      startDate: `${month}-01`,
      endDate: `${month}-31`
    });
    return transactions.reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
  }

  async getCategorySpending(userId: number, startDate: string, endDate: string): Promise<{ categoryId: number; amount: number; categoryName: string }[]> {
    const transactions = await this.getTransactions(userId, {
      type: "expense",
      startDate,
      endDate
    });
    
    const categoryTotals = new Map<number, number>();
    transactions.forEach(transaction => {
      const current = categoryTotals.get(transaction.categoryId) || 0;
      categoryTotals.set(transaction.categoryId, current + parseFloat(transaction.amount));
    });

    const result = [];
    for (const [categoryId, amount] of Array.from(categoryTotals.entries())) {
      const category = this.categories.get(categoryId);
      result.push({
        categoryId,
        amount,
        categoryName: category?.name || "Unknown"
      });
    }

    return result.sort((a, b) => b.amount - a.amount);
  }

  // Admin - User Management
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...userData, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; adminUsers: number }> {
    const users = Array.from(this.users.values());
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      adminUsers: users.filter(u => u.role === 'admin').length
    };
  }

  // Admin - System Configuration
  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    const configs = Array.from(this.systemConfigs.values());
    return category ? configs.filter(c => c.category === category) : configs;
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    return this.systemConfigs.get(key);
  }

  async createSystemConfig(insertConfig: InsertSystemConfig): Promise<SystemConfig> {
    const config: SystemConfig = {
      ...insertConfig,
      id: this.currentId++,
      description: insertConfig.description || null,
      category: insertConfig.category || "general",
      isPublic: insertConfig.isPublic ?? false,
      updatedAt: new Date(),
    };
    this.systemConfigs.set(config.key, config);
    return config;
  }

  async updateSystemConfig(key: string, configData: Partial<InsertSystemConfig>): Promise<SystemConfig | undefined> {
    const config = this.systemConfigs.get(key);
    if (config) {
      const updatedConfig = { ...config, ...configData, updatedAt: new Date() };
      this.systemConfigs.set(key, updatedConfig);
      return updatedConfig;
    }
    return undefined;
  }

  async deleteSystemConfig(key: string): Promise<boolean> {
    return this.systemConfigs.delete(key);
  }

  // Admin - Activity Logs
  async getActivityLogs(filters?: { userId?: number; action?: string; resource?: string; limit?: number }): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values());
    
    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters?.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    
    if (filters?.resource) {
      logs = logs.filter(log => log.resource === filters.resource);
    }
    
    // Sort by creation date descending
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }
    
    return logs;
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const log: ActivityLog = {
      ...insertLog,
      id: this.currentId++,
      resourceId: insertLog.resourceId || null,
      details: insertLog.details || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
      createdAt: new Date(),
    };
    this.activityLogs.set(log.id, log);
    return log;
  }

  async deleteActivityLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const logs = Array.from(this.activityLogs.values());
    const toDelete = logs.filter(log => log.createdAt < cutoffDate);
    
    toDelete.forEach(log => this.activityLogs.delete(log.id));
    
    return toDelete.length;
  }

  // Admin - System Analytics
  async getSystemStats(): Promise<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }> {
    const totalTransactions = this.transactions.size;
    const totalAccounts = this.accounts.size;
    const totalCategories = this.categories.size;
    const totalProducts = this.products.size;
    
    // Simple health check based on system utilization
    const systemHealth = totalTransactions > 0 ? "healthy" : "inactive";
    
    return {
      totalTransactions,
      totalAccounts,
      totalCategories,
      totalProducts,
      systemHealth
    };
  }
}

export const storage = new MemStorage();
