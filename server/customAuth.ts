import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, LoginUser, RegisterUser } from "@shared/schema";
import { z } from "zod";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      passwordHash: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      role: string;
      isActive: boolean;
      isEmailVerified: boolean;
      emailVerificationToken: string | null;
      passwordResetToken: string | null;
      passwordResetExpires: Date | null;
      lastLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [hashed, salt] = hashedPassword.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      return false;
    }
  }

  static generateSessionId(): string {
    return randomBytes(32).toString("hex");
  }

  static createSessionExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days from now
    return expiry;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  static async createDefaultAdmin(): Promise<User | null> {
    try {
      // Check if any users exist - if not, don't create default admin
      // Let the initialization wizard handle this
      const userCount = await storage.getUserCount();
      if (userCount === 0) {
        console.log("No users found - initialization wizard will handle admin creation");
        return null;
      }

      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        return existingAdmin;
      }

      const hashedPassword = await AuthService.hashPassword("admin123");
      const adminUser = await storage.createUser({
        username: "admin",
        email: "admin@financetracker.com",
        passwordHash: hashedPassword,
        firstName: "System",
        lastName: "Administrator",
        profileImageUrl: null,
        role: "admin",
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLoginAt: null,
      });

      console.log("Default admin created with username: admin, password: admin123");
      return adminUser;
    } catch (error) {
      console.error("Error creating default admin:", error);
      return null;
    }
  }
}

export function setupAuth(app: Express) {
  // Session configuration
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }

          if (!user.isActive) {
            return done(null, false, { message: "Account is disabled" });
          }

          const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid username or password" });
          }

          // Update last login
          await storage.updateUser(user.id, { lastLoginAt: new Date() });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      if (!AuthService.isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (!AuthService.isValidPassword(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password and create user
      const hashedPassword = await AuthService.hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        passwordHash: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        profileImageUrl: null,
        role: "user",
        isActive: true,
        isEmailVerified: false,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLoginAt: null,
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password hash to client
        const { passwordHash, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.status(500).json({ message: "Authentication error" });
      }
      
      if (!user) {
        console.log("Login failed:", info?.message || "Invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        const { passwordHash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { passwordHash, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Create default admin on startup
  AuthService.createDefaultAdmin().catch(console.error);
}

// Authentication middleware
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export function requireActiveUser(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({ message: "Account is disabled" });
  }
  
  next();
}