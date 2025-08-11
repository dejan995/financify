# Personal Finance Tracker

## Overview

This is a comprehensive personal finance management application built with a modern full-stack architecture. The application provides users with tools to track expenses, manage budgets, set financial goals, monitor accounts, handle bill reminders, generate reports, and scan receipts for expense tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API endpoints
- **Development**: Hot module replacement with Vite integration

### Key Design Decisions
- **Monorepo Structure**: Shared schema and types between client and server
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Modern UI**: Component-based architecture with accessible design
- **Performance**: Query optimization with React Query caching
- **Responsive Design**: Mobile-first approach with adaptive sidebar

## Key Components

### Database Schema
- **Users**: User authentication and profile management
- **Accounts**: Multiple account types (checking, savings, credit, investment)
- **Categories**: Hierarchical expense/income categorization with color coding
- **Transactions**: Core financial transactions with rich metadata
- **Budgets**: Category-based budget tracking with time periods
- **Goals**: Financial goal setting with progress tracking
- **Bills**: Recurring bill management and reminders
- **Products**: Scanned product database for receipt processing

### API Endpoints
- `/api/accounts` - Account management (CRUD operations)
- `/api/categories` - Category management
- `/api/transactions` - Transaction tracking with filtering
- `/api/budgets` - Budget creation and monitoring
- `/api/goals` - Financial goal management
- `/api/bills` - Bill reminder system
- `/api/products` - Product database for scanner
- `/api/analytics/*` - Financial analytics and reporting

### Frontend Pages
- **Dashboard**: Overview with cards, charts, and recent activity
- **Transactions**: Comprehensive transaction management with filtering
- **Budgets**: Budget creation and progress monitoring
- **Goals**: Financial goal setting and tracking
- **Accounts**: Multi-account management
- **Bills**: Bill reminder and payment tracking
- **Categories**: Category management for organizing transactions
- **Products**: Product database management for receipt scanning
- **Reports**: Advanced analytics and data visualization
- **Scanner**: Receipt scanning and product recognition

## Data Flow

1. **User Input**: Forms with React Hook Form and Zod validation
2. **API Requests**: TanStack React Query for optimized server communication
3. **Database Operations**: Drizzle ORM with type-safe queries
4. **Real-time Updates**: Query invalidation for immediate UI updates
5. **Error Handling**: Centralized error management with toast notifications

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling with validation
- **@radix-ui/***: Accessible UI primitives
- **recharts**: Data visualization for analytics
- **wouter**: Lightweight React router

### Development Tools
- **drizzle-kit**: Database migration and schema management
- **tsx**: TypeScript execution for server development
- **esbuild**: Fast bundling for production builds
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development
- **Server**: Express server with Vite middleware for HMR
- **Database**: Neon serverless PostgreSQL with migrations
- **Environment**: Environment variables for database connection

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: ESBuild bundling for server code
- **Database**: Drizzle schema push for deployment
- **Serving**: Express serves both API and static files

### Environment Configuration
- `NODE_ENV`: Environment detection
- `DATABASE_URL`: PostgreSQL connection string
- `REPL_ID`: Replit-specific configuration

## Changelog
```
Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Added Categories and Products management pages to sidebar navigation
- July 03, 2025. Fixed comprehensive theming system with text-danger to text-destructive replacement
- July 03, 2025. Improved color contrast: darker green in light mode, lighter red in dark mode
- July 03, 2025. Replaced Replit authentication with custom user management system featuring scrypt password hashing, session-based authentication, role-based access control, and comprehensive user registration/login functionality
- July 03, 2025. Fixed authentication system issues - corrected password hashing consistency between admin user creation and login authentication, added confirmPassword validation to registration form
- August 11, 2025. Fixed admin user update functionality - resolved password validation error when updating users without changing passwords by filtering empty password fields
- August 11, 2025. Successfully implemented SQLite as default database to resolve Neon WebSocket connectivity issues - created comprehensive SQLite storage implementation with automatic database file generation, proper schema management, and full interface compatibility
- August 11, 2025. Created comprehensive initialization wizard for first-time app setup - includes step-by-step admin user creation and database provider selection (SQLite, PostgreSQL, MySQL, Neon, PlanetScale, Supabase) with beautiful UI and form validation
- August 11, 2025. Restructured database initialization to prevent WebSocket connectivity issues - app now uses memory storage for cloud providers until connection is verified, eliminating silent failures and providing proper user feedback
- August 11, 2025. Implemented WordPress-style initialization wizard with proper database connection testing - users can now test database connections before proceeding, preventing WebSocket failures and providing clear feedback on connectivity issues
- August 11, 2025. Updated Supabase integration to use standard React process with Project URL and Anonymous Key instead of connection strings - created comprehensive SupabaseStorage implementation, enhanced initialization wizard with proper Supabase field validation, and integrated connection testing to prevent WebSocket issues
- August 11, 2025. Implemented fully automatic Supabase schema initialization - users now only need to provide Supabase URL and API key, database tables are created automatically without any manual SQL execution required
- August 11, 2025. Simplified Supabase integration to work with existing public schema - automatic table creation during first use, no manual SQL required, leverages Supabase's default schema structure
- August 11, 2025. Fixed broken CRUD operations throughout the application - resolved "storage2.getUser is not a function" errors by implementing missing getUser method in SupabaseStorageNew class and proper storage configuration restoration
- August 11, 2025. Disabled default admin creation since admin user is properly created during initialization wizard, preventing duplicate admin user creation
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```