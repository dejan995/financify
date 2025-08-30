# Database Setup Guide

This guide covers database configuration and management for the Personal Finance Tracker application.

## Supported Databases

The application supports multiple database providers with seamless switching:

- **Supabase** - Recommended for cloud deployments
- **PostgreSQL** - Traditional SQL database 
- **SQLite** - Lightweight, file-based (development)
- **Neon Database** - Serverless PostgreSQL
- **PlanetScale** - Serverless MySQL (via MySQL2 adapter)

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Accounts
```sql
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment')),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Categories
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Transactions
```sql
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Budgets
```sql
CREATE TABLE budgets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Goals
```sql
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0.00,
    target_date DATE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bills
```sql
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products
```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_products_user_id ON products(user_id);
```

## Supabase Setup

### 1. Create Supabase Project
1. Visit [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Fill in project details and create

### 2. Get Supabase Credentials
```bash
# From Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Environment Configuration
```env
# .env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 4. Automatic Schema Creation
The application automatically creates all required tables on first connection. No manual SQL execution required!

### 5. Row Level Security (Optional)
```sql
-- Enable RLS for enhanced security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their own data" ON accounts
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only see their own transactions" ON transactions
    FOR ALL USING (auth.uid()::text = user_id);
```

## PostgreSQL Setup

### Local Development
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE finance_tracker;
CREATE USER financeuser WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE finance_tracker TO financeuser;
\q
```

### Environment Configuration
```env
# .env
DATABASE_URL=postgresql://financeuser:secure_password@localhost:5432/finance_tracker
```

### Production Setup
```bash
# AWS RDS PostgreSQL
DATABASE_URL=postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/finance_tracker

# Google Cloud SQL
DATABASE_URL=postgresql://username:password@your-cloud-sql-ip:5432/finance_tracker

# Azure Database for PostgreSQL
DATABASE_URL=postgresql://username:password@your-server.postgres.database.azure.com:5432/finance_tracker
```

## SQLite Setup

### Development Configuration
SQLite is used automatically in development when no other database is configured.

```bash
# Database file location
./data/finance_tracker.db
```

### Environment Configuration
```env
# .env (SQLite is default, no configuration needed)
NODE_ENV=development
```

### Manual SQLite Setup
```javascript
// server/sqlite-storage.ts
import Database from 'better-sqlite3';

const db = new Database('./data/finance_tracker.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
```

## Neon Database Setup

### 1. Create Neon Account
1. Visit [neon.tech](https://neon.tech)
2. Sign up for an account
3. Create a new project

### 2. Get Connection String
```bash
# From Neon Dashboard > Connection Details
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Environment Configuration
```env
# .env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Database Management

### Initialization Wizard
The application includes a built-in initialization wizard:

1. **First Launch**: Navigate to application URL
2. **Admin Setup**: Create initial admin user
3. **Database Selection**: Choose database provider
4. **Connection Testing**: Verify database connectivity
5. **Schema Creation**: Automatic table creation
6. **Ready to Use**: Start managing finances

### Manual Database Operations

#### Create Admin User
```sql
INSERT INTO users (id, username, password_hash, role)
VALUES (
    'admin-' || EXTRACT(EPOCH FROM NOW()),
    'admin',
    '$scrypt$N=16384,r=8,p=1$...',  -- hashed password
    'admin'
);
```

#### Reset Database
```sql
-- Drop all tables (be careful!)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Data Migration

#### Export Data
```bash
# PostgreSQL
pg_dump -h localhost -U financeuser finance_tracker > backup.sql

# SQLite
sqlite3 ./data/finance_tracker.db .dump > backup.sql
```

#### Import Data
```bash
# PostgreSQL
psql -h localhost -U financeuser finance_tracker < backup.sql

# SQLite
sqlite3 ./data/finance_tracker.db < backup.sql
```

#### Cross-Database Migration
The application includes built-in migration tools:

```javascript
// Use the admin interface to migrate between databases
// Navigate to /admin > Database Management > Migration Tools
```

## Performance Optimization

### Query Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 'user123' ORDER BY date DESC;

-- Add covering indexes
CREATE INDEX idx_transactions_user_date_cover ON transactions(user_id, date) INCLUDE (amount, description, type);
```

### Connection Pooling
```javascript
// server/database-storage.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idle_timeout: 10000,
  connect_timeout: 10000,
});
```

### Batch Operations
```javascript
// Batch insert transactions
const insertTransactions = async (transactions) => {
  const query = `
    INSERT INTO transactions (id, amount, description, date, type, account_id, category_id, user_id)
    VALUES ${transactions.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ')}
  `;
  
  const values = transactions.flatMap(t => [t.id, t.amount, t.description, t.date, t.type, t.accountId, t.categoryId, t.userId]);
  
  return await pool.query(query, values);
};
```

## Backup and Recovery

### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# PostgreSQL backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/finance_tracker_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/finance_tracker_$DATE.sql"

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: finance_tracker_$DATE.sql.gz"
```

### Backup Schedule
```bash
# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### Recovery Process
```bash
# Restore from backup
gunzip -c backup_file.sql.gz | psql $DATABASE_URL

# Point-in-time recovery (Supabase/Neon)
# Use provider's dashboard for PITR
```

## Monitoring

### Database Health Checks
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('finance_tracker'));

-- Monitor active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'finance_tracker';

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Performance Metrics
```javascript
// server/routes.ts - Add monitoring endpoint
app.get('/api/admin/database/stats', async (req, res) => {
  const stats = await storage.getDatabaseStats();
  res.json(stats);
});
```

## Security

### Connection Security
```env
# Always use SSL in production
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Connection timeout
DATABASE_URL=postgresql://user:pass@host:5432/db?connect_timeout=10
```

### User Privileges
```sql
-- Create read-only user for reporting
CREATE USER reporter WITH PASSWORD 'reporting_password';
GRANT CONNECT ON DATABASE finance_tracker TO reporter;
GRANT USAGE ON SCHEMA public TO reporter;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporter;
```

### Data Encryption
```sql
-- Encrypt sensitive columns (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted data
INSERT INTO sensitive_data (id, encrypted_field)
VALUES (1, crypt('sensitive_value', gen_salt('bf')));

-- Query encrypted data
SELECT * FROM sensitive_data 
WHERE encrypted_field = crypt('sensitive_value', encrypted_field);
```

## Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check database service status
sudo systemctl status postgresql

# Verify connection parameters
psql "postgresql://user:pass@host:5432/db" -c "SELECT version();"
```

#### Permission Denied
```sql
-- Check user permissions
\du
\l

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE finance_tracker TO financeuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO financeuser;
```

#### Schema Issues
```sql
-- Check if tables exist
\dt

-- Recreate schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Run initialization wizard
```

### Performance Issues
```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'transactions' AND n_distinct > 100;

-- Analyze table statistics
ANALYZE transactions;

-- Update planner statistics
VACUUM ANALYZE;
```

### Debug Mode
```env
# Enable detailed database logging
DEBUG=drizzle:query
LOG_LEVEL=debug
```

## Best Practices

### Schema Design
- Use appropriate data types (DECIMAL for money)
- Add constraints for data integrity
- Create indexes on frequently queried columns
- Use foreign keys to maintain referential integrity

### Query Performance
- Use LIMIT for large result sets
- Implement pagination for lists
- Cache frequently accessed data
- Use prepared statements

### Security
- Never store plain text passwords
- Use parameterized queries to prevent SQL injection
- Implement row-level security where appropriate
- Regular security audits and updates

### Maintenance
- Regular backups with testing restore procedures
- Monitor database performance and query patterns
- Update statistics regularly
- Plan for capacity growth

---

For additional support, refer to the [main documentation](../README.md) or consult your database provider's documentation.