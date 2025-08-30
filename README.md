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

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

### First-Time Setup

1. **Complete the initialization wizard** - Configure your admin user and database
2. **Log in with your admin credentials**
3. **Set up your financial accounts** - Add your bank accounts, credit cards, etc.
4. **Create expense categories** - Organize your transactions
5. **Start tracking your finances!**

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern component-based UI framework
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful component library
- **TanStack React Query** - Powerful data fetching and caching
- **Wouter** - Minimalist client-side routing
- **Recharts** - Composable charting library
- **Vite** - Fast development build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Server-side type safety
- **Drizzle ORM** - Type-safe database operations
- **Zod** - Schema validation library
- **Passport.js** - Authentication middleware
- **Express Session** - Session management

### Database Support
- **PostgreSQL** - Primary production database
- **Supabase** - Cloud PostgreSQL with real-time features
- **SQLite** - Development and lightweight deployments
- **Neon Database** - Serverless PostgreSQL option

### Development & Deployment
- **Docker** - Containerization platform
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **ESBuild** - Fast JavaScript bundler
- **Hot Module Replacement** - Instant development updates

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
├── docker/                   # Docker configuration
│   ├── Dockerfile            # Production container
│   ├── docker-compose.yml    # Development orchestration
│   ├── docker-compose.prod.yml     # Production orchestration
│   ├── docker-compose.override.yml # Development overrides
│   ├── nginx.conf            # Nginx configuration
│   └── deploy.sh             # Deployment automation
├── data/                     # Local data directory
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

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `5000` |
| `SESSION_SECRET` | Session encryption key | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | Conditional | - |
| `SUPABASE_URL` | Supabase project URL | Conditional | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Conditional | - |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Conditional | - |

### Database Configuration

#### Supabase (Recommended for Cloud)
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

#### PostgreSQL
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

#### SQLite (Development)
```env
# SQLite is used by default in development
# No configuration required
```

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Development mode
./deploy.sh dev

# Production mode
./deploy.sh prod

# Custom deployment
docker-compose up -d
```

### Docker Services

- **finance-app**: Main application server
- **postgres**: PostgreSQL database (optional)
- **redis**: Session storage and caching (optional)
- **nginx**: Reverse proxy and SSL termination (production)

### Production Deployment

1. **Configure environment**
   ```bash
   cp .env.example .env.production
   # Edit with production values
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
   ```

3. **Set up SSL certificates**
   ```bash
   # Place SSL certificates in ./ssl/
   # Update nginx.conf with your domain
   ```

4. **Configure domain and DNS**
   - Point your domain to the server
   - Update nginx configuration with your domain name

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
- **Codebase Cleanup**: Removed complex database migration system causing LSP errors
- **Docker Integration**: Complete containerization with production optimizations
- **Multi-stage Builds**: Optimized Docker images for production deployment
- **Health Monitoring**: Added comprehensive health checks and monitoring
- **Security Enhancements**: Improved authentication and session management
- **Documentation**: Complete deployment guides and API documentation

#### Previous Versions
- **August 2025**: Added Supabase integration and automatic schema initialization
- **July 2025**: Implemented custom authentication system with role-based access
- **Initial Release**: Core financial tracking functionality with React frontend

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

---

**Built with ❤️ for better financial management**

For more information, visit our [documentation](./docs/) or check out the [live demo](https://your-demo-url.com).