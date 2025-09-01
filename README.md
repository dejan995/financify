# Personal Finance Tracker

A comprehensive personal finance management application built with modern full-stack architecture. Track expenses, manage budgets, set financial goals, monitor multiple accounts, handle bill reminders, generate detailed reports, and scan receipts for automated expense tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-20.x-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## ✨ Features

### Core Financial Management
- **Multi-Account Support**: Manage checking, savings, credit, and investment accounts
- **Transaction Tracking**: Comprehensive expense and income tracking with categories
- **Budget Management**: Create and monitor category-based budgets with time periods
- **Financial Goals**: Set and track progress toward financial objectives
- **Bill Management**: Recurring bill reminders and payment tracking

### Advanced Features
- **Receipt Scanner**: OCR-powered receipt scanning with product database
- **Analytics & Reports**: Detailed financial analytics with interactive charts
- **Category Management**: Hierarchical expense categorization with color coding
- **Product Database**: Scanned product database for quick expense entry
- **Multi-Database Support**: PostgreSQL, Supabase, and SQLite compatibility

### Security & Administration
- **User Authentication**: Secure session-based authentication with role-based access
- **Admin Interface**: User management, system statistics, and database administration
- **Data Encryption**: Password hashing with scrypt for enhanced security
- **Session Management**: Secure session handling with configurable expiration

### Deployment & Scaling
- **Docker Ready**: Complete containerization with production optimizations
- **Cloud Database Support**: Native Supabase and PostgreSQL cloud integration
- **Responsive Design**: Mobile-first approach with adaptive sidebar
- **Health Monitoring**: Built-in health checks and monitoring endpoints

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn** package manager
- **Docker** (optional, for containerized deployment)
- **PostgreSQL** or **Supabase** account (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/finance-tracker.git
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Choose your deployment method:**

   **Option A: Environment Variables (Recommended)**
   ```bash
   # Generate configuration for your database provider
   node scripts/setup-database-config.js template supabase
   # Edit .env with your actual credentials
   
   # Start the development server
   npm run dev
   ```

   **Option B: Configuration Script**
   ```bash
   # Set environment variables first, then generate config
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export SUPABASE_SERVICE_KEY="your-service-key"
   
   # Generate configuration
   node scripts/setup-database-config.js generate supabase
   
   # Start the development server
   npm run dev
   ```

   **Option C: Web Interface Setup**
   ```bash
   # Start with SQLite (no configuration needed)
   npm run dev
   # Complete setup through the initialization wizard
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

### First-Time Setup

1. **Complete the initialization wizard** - Configure your admin user and database
2. **Log in with your admin credentials**
3. **Set up your financial accounts** - Add your bank accounts, credit cards, etc.
4. **Create expense categories** - Organize your transactions
5. **Start tracking your finances!**

## 🛠 Technology Stack

### Frontend Architecture
- **React 18** - Modern component-based UI framework with TypeScript
- **Wouter** - Minimalist client-side routing
- **TanStack React Query** - Server state management and caching
- **Radix UI** - Accessible component primitives with shadcn/ui design system
- **Tailwind CSS** - Utility-first CSS framework with CSS variables for theming
- **Vite** - Fast development build tool with hot module replacement
- **Recharts** - Composable charting library for data visualization

### Backend Architecture
- **Node.js** - JavaScript runtime with Express.js web framework
- **TypeScript** - End-to-end type safety with server-side implementation
- **Drizzle ORM** - Type-safe database operations with PostgreSQL dialect
- **Zod** - Schema validation library for request/response validation
- **Passport.js** - Authentication middleware with session management
- **Express Session** - Secure session handling with configurable storage

### Database Support & Schema
- **PostgreSQL** - Primary production database with full feature support
- **Supabase** - Cloud PostgreSQL with real-time features and automatic schema creation
- **SQLite** - Development database with automatic file generation
- **Neon Database** - Serverless PostgreSQL option for cloud deployments

#### Core Database Tables
- **Users**: Authentication, profiles, and role-based access control
- **Accounts**: Multi-account support (checking, savings, credit, investment)
- **Categories**: Hierarchical expense/income categorization with color coding
- **Transactions**: Core financial transactions with rich metadata and filtering
- **Budgets**: Category-based budget tracking with configurable time periods
- **Goals**: Financial goal setting with progress tracking and target dates
- **Bills**: Recurring bill management with reminders and payment tracking
- **Products**: Scanned product database for receipt processing and quick entry

### Development & Deployment
- **Docker** - Complete containerization with multi-stage builds
- **Docker Compose** - Multi-container orchestration for development and production
- **Nginx** - Reverse proxy, load balancer, and SSL termination
- **ESBuild** - Fast JavaScript bundling for production optimization
- **Hot Module Replacement** - Instant development updates with Vite integration

### Key Design Decisions
- **Monorepo Structure**: Shared schema and types between client and server
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Modern UI**: Component-based architecture with accessible design patterns
- **Performance**: Query optimization with React Query caching and database indexes
- **Responsive Design**: Mobile-first approach with adaptive sidebar layout
- **Security**: Session-based authentication with scrypt password hashing
- **Scalability**: Docker containerization with horizontal scaling support

### Data Flow Architecture
1. **User Input**: Forms with React Hook Form and Zod validation
2. **API Requests**: TanStack React Query for optimized server communication
3. **Database Operations**: Drizzle ORM with type-safe queries
4. **Real-time Updates**: Query invalidation for immediate UI updates
5. **Error Handling**: Centralized error management with toast notifications

## 📁 Project Structure

```
finance-tracker/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── dashboard/    # Dashboard-specific components
│   │   │   ├── forms/        # Form components
│   │   │   ├── layout/       # Layout components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries
│   │   ├── pages/            # Page components
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Application entry point
│   └── index.html            # HTML template
├── server/                   # Backend Express application
│   ├── customAuth.ts         # Authentication logic
│   ├── database-config-manager.ts  # Database configuration
│   ├── database-storage.ts   # Database abstraction layer
│   ├── initialization-manager.ts   # App initialization
│   ├── routes.ts             # API route definitions
│   ├── sqlite-storage.ts     # SQLite implementation
│   ├── storage.ts            # Storage interface
│   ├── supabase-storage-new.ts     # Supabase implementation
│   ├── index.ts              # Server entry point
│   └── vite.ts               # Vite integration
├── shared/                   # Shared code between client/server
│   ├── database-config.ts    # Database configuration types
│   ├── initialization-config.ts    # Initialization types
│   └── schema.ts             # Database schema and types
├── deployment/               # Docker deployment configuration
│   ├── Dockerfile            # Production container
│   ├── docker-compose.yml    # Development orchestration
│   ├── docker-compose.prod.yml     # Production orchestration
│   ├── docker-compose.override.yml # Development overrides
│   └── nginx.conf            # Nginx configuration
├── scripts/                  # Utility scripts
│   ├── deploy.sh             # Deployment automation
│   ├── setup-database-config.js    # Database config generator
│   └── healthcheck.js        # Container health checks
├── database-setup/           # Database initialization
│   └── supabase-setup.sql    # Supabase schema setup
├── docs/                     # Project documentation
│   ├── api.md                # API documentation
│   ├── database.md           # Database setup guide
│   ├── docker-README.md      # Docker deployment guide
│   └── CONTRIBUTING.md       # Contribution guidelines
├── data/                     # Local data directory (gitignored)
├── .env.example              # Environment template
├── .dockerignore             # Docker ignore patterns
├── package.json              # Node.js dependencies
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── README.md                 # Project documentation
```

## 🔧 Configuration

### Environment Variables

Enhanced environment variable support with automatic generation and validation:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `5000` |
| `SESSION_SECRET` | Session encryption key | Yes | - |
| `DATABASE_URL` | Database connection string | Conditional | - |
| `SUPABASE_URL` | Supabase project URL | Conditional | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Conditional | - |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Conditional | - |
| `POSTGRES_HOST` | PostgreSQL host | Conditional | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | Conditional | `5432` |
| `POSTGRES_DB` | PostgreSQL database | Conditional | - |
| `POSTGRES_USER` | PostgreSQL username | Conditional | - |
| `POSTGRES_PASSWORD` | PostgreSQL password | Conditional | - |
| `MYSQL_HOST` | MySQL host | Conditional | `localhost` |
| `MYSQL_PORT` | MySQL port | Conditional | `3306` |
| `MYSQL_DATABASE` | MySQL database | Conditional | - |
| `MYSQL_USER` | MySQL username | Conditional | - |
| `MYSQL_PASSWORD` | MySQL password | Conditional | - |
| `SQLITE_DATABASE_PATH` | SQLite file path | Conditional | `./data/finance.db` |

### Database Configuration Methods

The application supports multiple configuration approaches with automatic prioritization:

1. **Environment Variables** (Highest Priority) - Perfect for Docker and production
2. **Initialization Wizard** (Medium Priority) - User-friendly web interface
3. **Configuration Scripts** (Developer-friendly) - Command-line tools

#### Method 1: Environment Variables (Recommended)

The most robust method, especially for Docker deployments:

**Supabase (Recommended for Cloud)**
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Neon Database (Serverless PostgreSQL)**
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**PlanetScale (Serverless MySQL)**
```env
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/database?ssl={"rejectUnauthorized":true}
```

**PostgreSQL**
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
# Optional: Individual parameters for Docker Compose
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=finance_db
POSTGRES_USER=finance_user
POSTGRES_PASSWORD=finance_password
```

**MySQL**
```env
DATABASE_URL=mysql://username:password@host:3306/database_name
# Optional: Individual parameters for Docker Compose
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=finance_db
MYSQL_USER=finance_user
MYSQL_PASSWORD=finance_password
```

**SQLite (Development)**
```env
SQLITE_DATABASE_PATH=./data/finance.db
```

#### Method 2: Initialization Wizard (Recommended for First-Time Users)

The enhanced initialization wizard now supports:
- **All Database Providers**: Supabase, Neon, PlanetScale, PostgreSQL, MySQL, SQLite
- **Automatic Environment Generation**: Creates .env files automatically
- **Connection Testing**: Validates credentials before proceeding
- **Docker Detection**: Automatically configures for Docker deployments
- **Schema Validation**: Checks for required database tables
- **Deployment Instructions**: Provides next steps after setup

```bash
# Start the application
npm run dev

# Navigate to http://localhost:5000
# Follow the initialization wizard
```

#### Method 3: Configuration Scripts

Enhanced command-line tools for developers:

```bash
# Detect current configuration
node scripts/setup-database-config.js detect

# Generate configuration for specific provider
node scripts/setup-database-config.js generate supabase

# Create template for manual editing
node scripts/setup-database-config.js template postgresql

# Validate current configuration
node scripts/setup-database-config.js validate

# Reset all configuration
node scripts/setup-database-config.js reset
```

### Supported Database Providers

| Provider | Type | Best For | Auto-Setup | Connection Method |
|----------|------|----------|------------|-------------------|
| **Supabase** | Cloud PostgreSQL | Production | ✅ Full | URL + API Keys |
| **Neon** | Serverless PostgreSQL | Production | ✅ Full | Connection String |
| **PlanetScale** | Serverless MySQL | Production | ✅ Full | Connection String |
| **PostgreSQL** | Traditional SQL | Self-hosted | ✅ Full | URL or Individual Fields |
| **MySQL** | Traditional SQL | Self-hosted | ✅ Full | URL or Individual Fields |
| **SQLite** | File-based | Development | ✅ Full | File Path |

## 🚀 Deployment Options

### Method 1: Environment Variables (Recommended)

Enhanced environment variable support with automatic detection and validation:

#### Standalone Deployment with Environment Variables
```bash
# 1. Generate configuration for your provider
node scripts/setup-database-config.js template supabase

# 2. Edit .env with your actual credentials
# For Supabase: Add your project URL and API keys
# For others: Add connection strings or individual parameters

# 3. Validate configuration
node scripts/setup-database-config.js validate

# 4. Start the application
npm run dev
```

#### Docker Deployment with Environment Variables
```bash
# 1. Generate Docker-optimized configuration
node scripts/setup-database-config.js generate supabase

# 2. Use the deployment script
scripts/deploy.sh dev    # Development mode
scripts/deploy.sh prod   # Production mode

# 3. Or manually with Docker Compose
docker compose -f deployment/docker-compose.yml up -d
```

### Method 2: Configuration Script

Enhanced configuration scripts with multi-provider support:

```bash
# Detect current configuration
node scripts/setup-database-config.js detect

# Generate configuration with environment variables
SUPABASE_URL=your-url SUPABASE_ANON_KEY=your-key SUPABASE_SERVICE_KEY=your-service-key \
node scripts/setup-database-config.js generate supabase

# Create template for manual editing
node scripts/setup-database-config.js template postgresql

# Validate configuration
node scripts/setup-database-config.js validate

# Start the application
npm run dev
```

### Method 3: Web Interface Setup

Enhanced initialization wizard with comprehensive provider support:

```bash
# Start the application (uses SQLite by default)
npm run dev

# Navigate to http://localhost:5000
# Follow the enhanced initialization wizard:
# 1. Create admin account
# 2. Choose database provider (Supabase, Neon, PostgreSQL, MySQL, SQLite)
# 3. Configure connection parameters
# 4. Test database connection
# 5. Generate .env file automatically
# 6. Complete setup with deployment instructions
```

## 🐳 Docker Deployment

### Quick Start with Docker

Enhanced Docker support with automatic database configuration:

```bash
# Generate Docker-optimized configuration
node scripts/setup-database-config.js generate supabase

# Development mode with hot reload
scripts/deploy.sh dev

# Production mode with optimizations
scripts/deploy.sh prod

# Or use docker-compose directly
docker-compose -f deployment/docker-compose.yml up -d
```

### Docker Environment Configuration

1. **Enhanced Docker support:**
   - Automatic environment variable detection
   - Support for all database providers
   - Automatic Docker Compose override generation
   - Built-in database services for PostgreSQL and MySQL
   - Persistent volume management

2. **Database options in Docker:**
   - **Cloud databases** (Supabase, Neon, PlanetScale): Use external services
   - **Included PostgreSQL**: Automatic container with persistent storage
   - **Included MySQL**: Alternative to PostgreSQL with persistent storage
   - **SQLite**: File-based storage with volume mounting

3. **Automatic configuration:**
   - Environment variables take precedence
   - Docker Compose overrides generated automatically
   - Service dependencies managed automatically
   - Health checks and monitoring included

### Docker Services

- **finance-app**: Main application server with multi-database support
- **postgres**: PostgreSQL database service (optional, for local development)
- **mysql**: MySQL database service (optional, alternative to PostgreSQL)
- **redis**: Session storage and caching (optional, for production)
- **nginx**: Reverse proxy and SSL termination (production only)

### Production Deployment

1. **Environment-based deployment (Recommended)**
   ```bash
   # Generate production configuration
   node scripts/setup-database-config.js generate supabase
   
   # Deploy with production settings
   scripts/deploy.sh prod
   ```

2. **Manual Docker Compose deployment**
   ```bash
   # Generate and configure environment
   node scripts/setup-database-config.js template supabase
   # Edit .env with your production credentials
   
   # Deploy with production configuration
   docker compose -f deployment/docker-compose.yml -f deployment/docker-compose.prod.yml up -d
   ```

3. **SSL Configuration (for production)**
   ```bash
   # Place SSL certificates in deployment/ssl/
   # Update deployment/nginx.conf with your domain
   ```

4. **Domain and DNS Setup**
   - Point your domain to the server
   - Update nginx configuration with your domain name

### Backup and Maintenance

```bash
# Create backup of data and database
scripts/deploy.sh backup

# Update application with latest code
scripts/deploy.sh update

# Clean up all containers and volumes (⚠️ DATA LOSS)
scripts/deploy.sh cleanup
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/user` - Get current user info

### Financial Data Endpoints
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

- `GET /api/transactions` - List transactions with filtering
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

- `GET /api/categories` - List expense categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

- `GET /api/budgets` - List user budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

- `GET /api/goals` - List financial goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Analytics Endpoints
- `GET /api/analytics/balance` - Get account balance
- `GET /api/analytics/monthly` - Monthly income/expense data
- `GET /api/analytics/category-spending` - Category spending analysis

### Administration Endpoints
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users` - Create new user (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/system/stats` - System statistics (admin only)

## 🔐 Security

### Authentication
- **Session-based authentication** with secure session cookies
- **Password hashing** using scrypt with salt
- **Role-based access control** (admin/user roles)
- **CSRF protection** via SameSite cookies

### Data Protection
- **Input validation** with Zod schemas
- **SQL injection prevention** via parameterized queries
- **XSS protection** through Content Security Policy
- **Rate limiting** on authentication endpoints

### Production Security
- **HTTPS enforcement** via Nginx redirect
- **Security headers** (HSTS, X-Frame-Options, etc.)
- **Environment variable protection**
- **Database connection encryption**

## 📈 Performance & Monitoring

### Performance Optimizations
- **Lazy loading** of route components
- **Bundle splitting** for optimal loading
- **Image optimization** with proper formats
- **Gzip compression** for static assets
- **Database query optimization** with indexes

### Monitoring
- **Health check endpoints** for container orchestration
- **Application metrics** via built-in statistics
- **Error logging** with structured formatting
- **Performance monitoring** through request timing

### Caching Strategy
- **Browser caching** for static assets
- **React Query caching** for API responses
- **Session caching** via Redis (optional)
- **Database query caching** at ORM level

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit tests** for utility functions
- **Component tests** for React components
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows

## 🚀 Development

### Development Server
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check
```

### Code Quality
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Husky** for pre-commit hooks

### Database Operations
```bash
# Push schema changes
npm run db:push

# Generate database migrations
npm run db:generate

# Apply migrations
npm run db:migrate
```

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure Docker builds pass
- Follow the existing code style

### Code Review Process
- All changes require pull request review
- Tests must pass in CI/CD pipeline
- Documentation must be updated
- Security considerations must be addressed

## 📝 Changelog

### Recent Updates

#### January 2025 - System Stabilization & Docker Support
- **Codebase Cleanup**: Removed complex database migration system that was causing critical LSP errors and system instability
- **Eliminated SQLite storage implementation** that had compatibility issues with the main PostgreSQL schema
- **Cleaned up database manager** references across all server files to improve system reliability  
- **Simplified database testing** in initialization wizard for improved stability
- **Fixed all LSP diagnostics** - codebase now has zero TypeScript errors
- **Maintained core functionality** while removing problematic migration features

#### Environment Variable Integration
- **Standalone Environment Variable Support**: Both Docker and standalone deployments now use environment variables for configuration
- **Configuration Priority System**: Environment variables take precedence over JSON files for seamless Docker deployment
- **Database Config Generator**: Created `setup-database-config.js` script to generate configurations from environment variables
- **Improved .gitignore**: Added `data/initialization.json` to prevent committing runtime-generated files
- **Unified Deployment**: Single deployment approach works for both Docker and standalone environments

#### Docker Deployment Setup
- **Created production-ready Dockerfile** with multi-stage builds for optimized image size
- **Added comprehensive docker-compose.yml** with PostgreSQL, Redis, and application services
- **Configured environment variables** for flexible deployment across different environments
- **Added development overrides** for hot-reload development with Docker
- **Included security best practices** and production deployment guidelines
- **Created backup and monitoring strategies** for production deployments

#### Documentation & Project Finalization
- **Created comprehensive README.md** covering all aspects of the application
- **Documented complete technology stack** and architecture decisions
- **Added detailed API documentation** with all endpoints and usage examples
- **Included security guidelines** and best practices for production deployment
- **Provided troubleshooting guides** and performance optimization tips
- **Created complete development workflow** documentation for contributors

#### Previous Major Updates
- **August 2025**: Added Supabase integration and automatic schema initialization - users now only need to provide Supabase URL and API key, database tables are created automatically without any manual SQL execution required
- **August 2025**: Simplified Supabase integration to work with existing public schema - automatic table creation during first use, no manual SQL required, leverages Supabase's default schema structure
- **August 2025**: Fixed broken CRUD operations throughout the application - resolved "storage2.getUser is not a function" errors by implementing missing getUser method in SupabaseStorageNew class and proper storage configuration restoration
- **August 2025**: Enhanced admin interface database status detection to properly show "Supabase" instead of "In Memory" when using Supabase storage
- **August 2025**: Implemented automatic Supabase table creation for all required database tables (accounts, categories, transactions, budgets, goals, bills, products) to prevent "relation does not exist" errors
- **August 2025**: Fixed session deserialization errors by adding proper error handling and storage availability checks in authentication system
- **July 2025**: Implemented custom authentication system with role-based access - replaced Replit authentication with custom user management system featuring scrypt password hashing, session-based authentication, role-based access control, and comprehensive user registration/login functionality
- **July 2025**: Fixed authentication system issues - corrected password hashing consistency between admin user creation and login authentication, added confirmPassword validation to registration form
- **July 2025**: Added Categories and Products management pages to sidebar navigation
- **July 2025**: Fixed comprehensive theming system with text-danger to text-destructive replacement
- **July 2025**: Improved color contrast: darker green in light mode, lighter red in dark mode
- **January 2025**: Fixed navigation sidebar visibility - sidebar now only appears for authenticated users, login page displays without navigation for better user experience

#### System Architecture Decisions
- **WordPress-style initialization wizard** with proper database connection testing - users can now test database connections before proceeding, preventing WebSocket failures and providing clear feedback on connectivity issues
- **Restructured database initialization** to prevent WebSocket connectivity issues - app now uses memory storage for cloud providers until connection is verified, eliminating silent failures and providing proper user feedback
- **Successfully implemented SQLite as default database** to resolve Neon WebSocket connectivity issues - created comprehensive SQLite storage implementation with automatic database file generation, proper schema management, and full interface compatibility
- **Fixed admin user update functionality** - resolved password validation error when updating users without changing passwords by filtering empty password fields

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
npm run db:check

# Reset database schema
npm run db:reset

# View database logs
docker-compose logs postgres
```

#### Authentication Problems
- Verify session secret is configured
- Check user credentials in database
- Ensure cookies are enabled in browser
- Verify HTTPS configuration in production

#### Build Issues
```bash
# Clear build cache
rm -rf dist client/dist

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run check
```

### Performance Issues
- Monitor database query performance
- Check for memory leaks in long-running sessions
- Analyze bundle size with webpack-bundle-analyzer
- Review server logs for bottlenecks

## 📞 Support

### Documentation
- [API Documentation](./docs/api.md)
- [Docker Deployment Guide](./docker-README.md)
- [Database Setup Guide](./docs/database.md)
- [Contribution Guidelines](./CONTRIBUTING.md)

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and community support
- **Wiki**: Additional documentation and tutorials

### Professional Support
For enterprise deployments and custom features, contact the development team.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **Express.js Community** for the robust backend framework  
- **Supabase Team** for the excellent database platform
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for the beautiful component library
- **Open Source Community** for the countless libraries that make this project possible

## Development Philosophy

This project follows modern full-stack development principles with a focus on:
- **User Experience**: Clean, intuitive interface with responsive design
- **Developer Experience**: Type safety, hot reloading, and comprehensive tooling
- **Production Ready**: Docker deployment, health monitoring, and scalability
- **Security First**: Secure authentication, input validation, and data protection
- **Performance**: Optimized queries, caching strategies, and efficient bundling

## User Preferences
- **Communication Style**: Simple, everyday language for non-technical users
- **Design Approach**: Mobile-first responsive design with accessibility
- **Development Workflow**: Hot module replacement with comprehensive error handling

---

**Built with ❤️ for better financial management**

For more information, visit our [documentation](./docs/) or check out the [live demo](https://your-demo-url.com).