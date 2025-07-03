import { pgTable, text, serial, integer, boolean, decimal, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // user, admin
  isActive: boolean("is_active").notNull().default(true),
  forcePasswordChange: boolean("force_password_change").notNull().default(false),
  lastLogin: timestamp("last_login"),
  preferences: text("preferences"), // JSON string for user preferences
  avatar: text("avatar"), // URL or base64 image
  phoneNumber: text("phone_number"),
  dateOfBirth: date("date_of_birth"),
  timezone: text("timezone").default("UTC"),
  currency: text("currency").default("USD"),
  language: text("language").default("en"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User sessions table for authentication
export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit, investment
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // income, expense
  color: text("color").notNull().default("#0F766E"),
  parentId: integer("parent_id"), // for subcategories
  isDefault: boolean("is_default").notNull().default(false),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  date: date("date").notNull(),
  type: text("type").notNull(), // income, expense
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull().default("monthly"), // monthly, yearly
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  targetDate: date("target_date"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  frequency: text("frequency").notNull(), // monthly, yearly, weekly
  isRecurring: boolean("is_recurring").notNull().default(true),
  isPaid: boolean("is_paid").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode").unique(),
  category: text("category"),
  brand: text("brand"),
  lastPrice: decimal("last_price", { precision: 10, scale: 2 }),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isPublic: boolean("is_public").notNull().default(false),
  updatedBy: integer("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: integer("resource_id"),
  details: text("details"), // JSON string for additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
