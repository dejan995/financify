import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAccountSchema, insertCategorySchema, insertTransactionSchema,
  insertBudgetSchema, insertGoalSchema, insertBillSchema, insertProductSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const CURRENT_USER_ID = 1; // Mock current user

  // Accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts(CURRENT_USER_ID);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const data = insertAccountSchema.parse({ ...req.body, userId: CURRENT_USER_ID });
      const account = await storage.createAccount(data);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, data);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAccount(id);
      if (!deleted) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json({ message: "Account deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories(CURRENT_USER_ID);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse({ ...req.body, userId: CURRENT_USER_ID });
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const { accountId, categoryId, startDate, endDate, type } = req.query;
      const filters = {
        accountId: accountId ? parseInt(accountId as string) : undefined,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string,
      };
      const transactions = await storage.getTransactions(CURRENT_USER_ID, filters);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse({ ...req.body, userId: CURRENT_USER_ID });
      const transaction = await storage.createTransaction(data);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, data);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTransaction(id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ message: "Transaction deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Budgets
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets(CURRENT_USER_ID);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const data = insertBudgetSchema.parse({ ...req.body, userId: CURRENT_USER_ID });
      const budget = await storage.createBudget(data);
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: "Invalid budget data" });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, data);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: "Invalid budget data" });
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBudget(id);
      if (!deleted) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json({ message: "Budget deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals(CURRENT_USER_ID);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const data = insertGoalSchema.parse({ ...req.body, userId: CURRENT_USER_ID });
      const goal = await storage.createGoal(data);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.put("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertGoalSchema.partial().parse(req.body);
      const goal = await storage.updateGoal(id, data);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id);
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json({ message: "Goal deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Bills
  app.get("/api/bills", async (req, res) => {
    try {
      const bills = await storage.getBills(CURRENT_USER_ID);
      res.json(bills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post("/api/bills", async (req, res) => {
    try {
      const data = insertBillSchema.parse({ ...req.body, userId: CURRENT_USER_ID });
      const bill = await storage.createBill(data);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ message: "Invalid bill data" });
    }
  });

  app.put("/api/bills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertBillSchema.partial().parse(req.body);
      const bill = await storage.updateBill(id, data);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      res.status(400).json({ message: "Invalid bill data" });
    }
  });

  app.delete("/api/bills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBill(id);
      if (!deleted) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json({ message: "Bill deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bill" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { search } = req.query;
      const products = search 
        ? await storage.searchProducts(search as string)
        : await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const product = await storage.getProductByBarcode(req.params.barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  // Analytics
  app.get("/api/analytics/balance", async (req, res) => {
    try {
      const balance = await storage.getAccountBalance(CURRENT_USER_ID);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get("/api/analytics/monthly", async (req, res) => {
    try {
      const { month } = req.query;
      const currentMonth = month as string || new Date().toISOString().slice(0, 7);
      
      const income = await storage.getMonthlyIncome(CURRENT_USER_ID, currentMonth);
      const expenses = await storage.getMonthlyExpenses(CURRENT_USER_ID, currentMonth);
      
      res.json({ income, expenses, savings: income - expenses });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly data" });
    }
  });

  app.get("/api/analytics/category-spending", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const start = startDate as string || `${currentMonth}-01`;
      const end = endDate as string || `${currentMonth}-31`;
      
      const spending = await storage.getCategorySpending(CURRENT_USER_ID, start, end);
      res.json(spending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category spending" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
