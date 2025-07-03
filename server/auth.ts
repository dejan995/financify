import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  avatar?: string;
}

export interface SessionData {
  userId: number;
  username: string;
  role: string;
  sessionId: string;
  expiresAt: Date;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateSessionId(): string {
    return randomBytes(32).toString("hex");
  }

  static createSessionExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days
    return expiry;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static generateDefaultAdminUser() {
    return {
      username: "admin",
      email: "admin@finance.app",
      name: "System Administrator",
      role: "admin",
      isActive: true,
      forcePasswordChange: true,
      password: "admin123" // Default password - must be changed on first login
    };
  }
}

// Middleware for authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware for admin role
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Middleware for active users only
export function requireActiveUser(req: any, res: any, next: any) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.session.user.isActive) {
    return res.status(403).json({ message: "Account is deactivated" });
  }
  next();
}