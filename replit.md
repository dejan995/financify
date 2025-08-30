# Overview

Personal Finance Tracker is a comprehensive full-stack financial management application built with a modern tech stack. The application enables users to track expenses, manage budgets, set financial goals, monitor multiple accounts, handle bill reminders, and includes advanced features like OCR receipt scanning. It supports multi-database architecture with PostgreSQL, Supabase, and SQLite compatibility, making it suitable for both development and production environments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18**: Modern component-based UI with TypeScript
- **Vite**: Fast build tool and development server
- **Wouter**: Lightweight client-side routing
- **Tailwind CSS + Shadcn/UI**: Utility-first CSS framework with pre-built components
- **React Query (TanStack)**: Data fetching, caching, and synchronization
- **React Hook Form**: Form state management with Zod validation

## Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Custom Authentication**: Session-based auth using Passport.js with bcrypt password hashing
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **Multi-Storage Pattern**: Abstracted storage interface supporting multiple database backends

## Database Design
- **Multi-Provider Support**: PostgreSQL (primary), Supabase, SQLite, and Neon Database
- **Schema-First Approach**: Centralized schema definitions in `/shared/schema.ts`
- **Drizzle Migrations**: Automated database schema versioning
- **Storage Abstraction**: Common interface (`IStorage`) for seamless database switching

## Authentication & Security
- **Session Management**: Express-session with secure HTTP-only cookies
- **Password Security**: Scrypt-based hashing with random salts
- **Role-Based Access**: User/admin roles with protected routes
- **CSRF Protection**: Session-based authentication prevents CSRF attacks

## Core Financial Features
- **Account Management**: Multi-account support (checking, savings, credit, investment)
- **Transaction Tracking**: Categorized income/expense tracking with receipt scanning
- **Budget System**: Period-based budgets with real-time progress monitoring
- **Goal Tracking**: Financial goal setting with progress visualization
- **Bill Management**: Recurring bill reminders and payment tracking
- **Analytics Engine**: Real-time financial reporting and trend analysis

## Development Features
- **Docker Ready**: Complete containerization with development/production profiles
- **Health Checks**: Built-in monitoring endpoints for container orchestration
- **Initialization Wizard**: WordPress-style setup flow for first-time configuration
- **Hot Reload**: Vite-powered development experience with instant updates

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Client-side data fetching and caching
- **wouter**: Lightweight React router
- **drizzle-orm**: Type-safe database ORM
- **express**: Node.js web framework
- **passport**: Authentication middleware

## UI Component Libraries
- **@radix-ui/***: Headless UI components (dialog, select, dropdown, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Database Providers
- **@supabase/supabase-js**: Supabase client SDK
- **@neondatabase/serverless**: Neon Database serverless driver
- **better-sqlite3**: SQLite3 database driver
- **bcryptjs**: Password hashing library

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Type system
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **esbuild**: Production JavaScript bundling

## Production Infrastructure
- **Docker**: Containerization platform
- **nginx**: Reverse proxy and load balancer (via docker-compose)
- **memorystore**: In-memory session storage for development