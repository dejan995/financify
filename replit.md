# Personal Finance Tracker

## Overview

A comprehensive personal finance management application built with a modern full-stack TypeScript architecture. The system provides multi-account expense tracking, budget management, financial goal setting, bill reminders, and advanced analytics. Key features include receipt scanning with OCR, hierarchical categorization, and multi-database support with seamless provider switching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interfaces
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod resolvers for validation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js 20+ with Express.js framework
- **Language**: TypeScript with ESM modules for modern JavaScript features
- **Authentication**: Custom session-based authentication using Passport.js with scrypt password hashing
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **API Design**: RESTful endpoints with consistent JSON response formatting
- **Session Storage**: Express-session with configurable memory or database storage

### Data Storage Solutions
- **Multi-Database Support**: Architecture supports PostgreSQL, Supabase, SQLite, Neon Database, and PlanetScale
- **Primary Providers**: 
  - Supabase for cloud deployments (recommended)
  - PostgreSQL for traditional SQL setups
  - SQLite for development and lightweight deployments
- **Schema Management**: Drizzle ORM with shared schema definitions across all providers
- **Database Switching**: Runtime provider switching through configuration management system

### Authentication and Authorization
- **Session-Based Auth**: HTTP-only cookies with secure session management
- **Password Security**: Scrypt-based password hashing with salt for enhanced security
- **Role-Based Access**: Admin and user roles with protected route middleware
- **Account Management**: User profiles with email verification and password reset functionality

### Application Initialization
- **Setup Wizard**: WordPress-style initialization process for first-time setup
- **Database Configuration**: Dynamic database provider selection and connection testing
- **Admin Account Creation**: Automatic admin user creation during initialization
- **Configuration Persistence**: JSON-based configuration storage in data directory

### Deployment and Scaling
- **Containerization**: Full Docker support with development and production configurations
- **Health Monitoring**: Built-in health check endpoints for container orchestration
- **Environment Flexibility**: Environment-based configuration with development/production modes
- **Asset Management**: Vite-based asset bundling with hot reload in development

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection pooling
- **@supabase/supabase-js**: Supabase client for cloud database integration
- **better-sqlite3**: High-performance SQLite driver for local development
- **drizzle-orm**: Type-safe ORM with multi-database support
- **express**: Web application framework for API server
- **passport**: Authentication middleware with local strategy support

### Frontend UI Dependencies
- **@radix-ui/***: Comprehensive accessible UI component library
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation with Zod schema integration
- **class-variance-authority**: Utility for component variant management
- **clsx**: Conditional className utility for dynamic styling

### Security and Validation
- **bcryptjs**: Password hashing library (fallback to scrypt)
- **zod**: Runtime type validation and schema definition
- **express-session**: Session management with secure cookie handling
- **memorystore**: Memory-based session storage for development

### Development Tools
- **vite**: Modern build tool with hot module replacement
- **typescript**: Type system for enhanced developer experience
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and introspection tools
- **tsx**: TypeScript execution for development server

### Cloud Services Integration
- **Supabase**: Primary cloud database provider with real-time features
- **Neon Database**: Serverless PostgreSQL for scalable deployments
- **PlanetScale**: Serverless MySQL option for global distribution
- **Docker**: Containerization for consistent deployment environments