#!/usr/bin/env node

/**
 * Enhanced script to generate database configuration and .env files
 * Supports all database providers with robust environment variable handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const dataDir = path.join(projectRoot, 'data');
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data directory');
}

// Generate secure session secret
function generateSessionSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Read existing .env file
function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      env[key.trim()] = value.trim();
    }
  });
  
  return env;
}

// Generate .env file content
function generateEnvContent(provider, config = {}) {
  const lines = [];
  
  lines.push('# Personal Finance Tracker - Environment Configuration');
  lines.push(`# Generated on: ${new Date().toISOString()}`);
  lines.push(`# Database Provider: ${provider.toUpperCase()}`);
  lines.push('');
  
  // Application Configuration
  lines.push('# Application Configuration');
  lines.push(`NODE_ENV=${config.NODE_ENV || 'production'}`);
  lines.push(`PORT=${config.PORT || '5000'}`);
  lines.push(`SESSION_SECRET=${config.SESSION_SECRET || generateSessionSecret()}`);
  lines.push('');
  
  // Database Configuration
  lines.push('# Database Configuration');
  
  switch (provider) {
    case 'supabase':
      lines.push('# Supabase Configuration');
      lines.push(`SUPABASE_URL=${config.SUPABASE_URL || 'https://your-project-ref.supabase.co'}`);
      lines.push(`SUPABASE_ANON_KEY=${config.SUPABASE_ANON_KEY || 'your-anon-key'}`);
      lines.push(`SUPABASE_SERVICE_KEY=${config.SUPABASE_SERVICE_KEY || 'your-service-role-key'}`);
      break;
      
    case 'neon':
      lines.push('# Neon Database Configuration');
      lines.push(`DATABASE_URL=${config.DATABASE_URL || 'postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require'}`);
      break;
      
    case 'planetscale':
      lines.push('# PlanetScale Database Configuration');
      lines.push(`DATABASE_URL=${config.DATABASE_URL || 'mysql://username:password@aws.connect.psdb.cloud/database'}`);
      break;
      
    case 'postgresql':
      lines.push('# PostgreSQL Configuration');
      lines.push(`DATABASE_URL=${config.DATABASE_URL || 'postgresql://username:password@localhost:5432/finance_db'}`);
      lines.push('');
      lines.push('# PostgreSQL Individual Parameters (for Docker Compose)');
      lines.push(`POSTGRES_HOST=${config.POSTGRES_HOST || 'localhost'}`);
      lines.push(`POSTGRES_PORT=${config.POSTGRES_PORT || '5432'}`);
      lines.push(`POSTGRES_DB=${config.POSTGRES_DB || 'finance_db'}`);
      lines.push(`POSTGRES_USER=${config.POSTGRES_USER || 'finance_user'}`);
      lines.push(`POSTGRES_PASSWORD=${config.POSTGRES_PASSWORD || 'change-this-password'}`);
      break;
      
    case 'mysql':
      lines.push('# MySQL Configuration');
      lines.push(`DATABASE_URL=${config.DATABASE_URL || 'mysql://username:password@localhost:3306/finance_db'}`);
      lines.push('');
      lines.push('# MySQL Individual Parameters (for Docker Compose)');
      lines.push(`MYSQL_HOST=${config.MYSQL_HOST || 'localhost'}`);
      lines.push(`MYSQL_PORT=${config.MYSQL_PORT || '3306'}`);
      lines.push(`MYSQL_DATABASE=${config.MYSQL_DATABASE || 'finance_db'}`);
      lines.push(`MYSQL_USER=${config.MYSQL_USER || 'finance_user'}`);
      lines.push(`MYSQL_PASSWORD=${config.MYSQL_PASSWORD || 'change-this-password'}`);
      break;
      
    case 'sqlite':
      lines.push('# SQLite Configuration (file-based database)');
      lines.push(`SQLITE_DATABASE_PATH=${config.SQLITE_DATABASE_PATH || './data/finance.db'}`);
      break;
  }
  
  lines.push('');
  lines.push('# Optional: Force memory storage (for testing)');
  lines.push('# USE_MEMORY_STORAGE=true');
  
  return lines.join('\n');
}

// Detect current database provider from environment
function detectProvider() {
  const env = readEnvFile();
  
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_KEY) {
    return 'supabase';
  }
  
  if (env.DATABASE_URL) {
    const url = env.DATABASE_URL;
    if (url.includes('neon.tech') || url.includes('neon.')) return 'neon';
    if (url.includes('planetscale.') || url.includes('pscale.')) return 'planetscale';
    if (url.startsWith('postgresql://')) return 'postgresql';
    if (url.startsWith('mysql://')) return 'mysql';
  }
  
  if (env.POSTGRES_HOST || env.POSTGRES_DB) return 'postgresql';
  if (env.MYSQL_HOST || env.MYSQL_DATABASE) return 'mysql';
  if (env.SQLITE_DATABASE_PATH) return 'sqlite';
  
  return null;
}

// Command handlers
function showHelp() {
  console.log(`
Personal Finance Tracker - Database Configuration Script
Commands:
  help                    Show this help message
  detect                  Detect current database configuration
  generate [provider]     Generate .env file for specific provider
  validate               Validate current .env configuration
  template [provider]     Create .env template for provider
  reset                  Reset database configuration

Providers:
  supabase               Supabase (recommended for production)
  neon                   Neon Database (serverless PostgreSQL)
  planetscale            PlanetScale (serverless MySQL)
  postgresql             Traditional PostgreSQL
  mysql                  Traditional MySQL
  sqlite                 SQLite (development)

Examples:
  node scripts/setup-database-config.js detect
  node scripts/setup-database-config.js generate supabase
  node scripts/setup-database-config.js template postgresql
  
Environment Variables:
  Set these before running 'generate' command:
  
  Supabase:
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_ANON_KEY=your-anon-key
    SUPABASE_SERVICE_KEY=your-service-key
  
  PostgreSQL/Neon:
    DATABASE_URL=postgresql://user:pass@host:port/db
  
  MySQL/PlanetScale:
    DATABASE_URL=mysql://user:pass@host:port/db
`);
}
Usage: node scripts/setup-database-config.js [command] [options]
function detectConfiguration() {
  console.log('🔍 Detecting database configuration...\n');
  
  const env = readEnvFile();
  const provider = detectProvider();
  
  if (!provider) {
    console.log('❌ No database configuration detected');
    console.log('\nTo set up a database:');
    console.log('1. Run: node scripts/setup-database-config.js template [provider]');
    console.log('2. Edit the generated .env file');
    console.log('3. Run: node scripts/setup-database-config.js validate');
    return;
  }
  
  console.log(`✓ Detected provider: ${provider.toUpperCase()}`);
  console.log('\nConfiguration details:');
  
  switch (provider) {
    case 'supabase':
      console.log(`  URL: ${env.SUPABASE_URL}`);
      console.log(`  Anon Key: ${env.SUPABASE_ANON_KEY ? '***' + env.SUPABASE_ANON_KEY.slice(-8) : 'Not set'}`);
      console.log(`  Service Key: ${env.SUPABASE_SERVICE_KEY ? '***' + env.SUPABASE_SERVICE_KEY.slice(-8) : 'Not set'}`);
      break;
    case 'neon':
    case 'planetscale':
    case 'postgresql':
    case 'mysql':
      console.log(`  Connection URL: ${env.DATABASE_URL ? env.DATABASE_URL.replace(/:\/\/[^@]+@/, '://***:***@') : 'Not set'}`);
      break;
    case 'sqlite':
      console.log(`  Database Path: ${env.SQLITE_DATABASE_PATH || './data/finance.db'}`);
      break;
function generateConfiguration(provider) {
  if (!provider) {
    console.log('❌ Provider is required. Use: generate [provider]');
    console.log('Available providers: supabase, neon, planetscale, postgresql, mysql, sqlite');
    return;
  }
  
  console.log(`🔧 Generating .env configuration for ${provider.toUpperCase()}...\n`);
  
  // Read existing environment variables
  const existingEnv = readEnvFile();
  
  // Generate configuration based on provider and environment variables
  let config = { ...existingEnv };
  
  switch (provider) {
    case 'supabase':
      config.SUPABASE_URL = process.env.SUPABASE_URL || config.SUPABASE_URL || 'https://your-project-ref.supabase.co';
      config.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY || 'your-anon-key';
      config.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || config.SUPABASE_SERVICE_KEY || 'your-service-role-key';
      break;
      
    case 'neon':
      config.DATABASE_URL = process.env.DATABASE_URL || config.DATABASE_URL || 'postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require';
      break;
      
    case 'planetscale':
      config.DATABASE_URL = process.env.DATABASE_URL || config.DATABASE_URL || 'mysql://username:password@aws.connect.psdb.cloud/database';
      break;
      
    case 'postgresql':
      config.DATABASE_URL = process.env.DATABASE_URL || config.DATABASE_URL || 'postgresql://finance_user:finance_password@localhost:5432/finance_db';
      config.POSTGRES_HOST = process.env.POSTGRES_HOST || config.POSTGRES_HOST || 'localhost';
      config.POSTGRES_PORT = process.env.POSTGRES_PORT || config.POSTGRES_PORT || '5432';
      config.POSTGRES_DB = process.env.POSTGRES_DB || config.POSTGRES_DB || 'finance_db';
      config.POSTGRES_USER = process.env.POSTGRES_USER || config.POSTGRES_USER || 'finance_user';
      config.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || config.POSTGRES_PASSWORD || 'change-this-password';
      break;
      
    case 'mysql':
      config.DATABASE_URL = process.env.DATABASE_URL || config.DATABASE_URL || 'mysql://finance_user:finance_password@localhost:3306/finance_db';
      config.MYSQL_HOST = process.env.MYSQL_HOST || config.MYSQL_HOST || 'localhost';
      config.MYSQL_PORT = process.env.MYSQL_PORT || config.MYSQL_PORT || '3306';
      config.MYSQL_DATABASE = process.env.MYSQL_DATABASE || config.MYSQL_DATABASE || 'finance_db';
      config.MYSQL_USER = process.env.MYSQL_USER || config.MYSQL_USER || 'finance_user';
      config.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || config.MYSQL_PASSWORD || 'change-this-password';
      break;
      
    case 'sqlite':
      config.SQLITE_DATABASE_PATH = process.env.SQLITE_DATABASE_PATH || config.SQLITE_DATABASE_PATH || './data/finance.db';
      break;
      
    default:
      console.log(`❌ Unsupported provider: ${provider}`);
      return;
  }
  
  // Ensure required fields
  config.NODE_ENV = config.NODE_ENV || 'production';
  config.PORT = config.PORT || '5000';
  config.SESSION_SECRET = config.SESSION_SECRET || generateSessionSecret();
  
  // Backup existing .env
  if (fs.existsSync(envPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `.env.backup.${timestamp}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`✓ Backed up existing .env to ${backupPath}`);
  }
  
  // Generate and write .env file
  const envContent = generateEnvContent(provider, config);
  fs.writeFileSync(envPath, envContent);
  
  console.log(`✓ Generated .env file for ${provider}`);
  console.log(`✓ Configuration saved to: ${envPath}`);
  
  // Show next steps
  console.log('\n📋 Next Steps:');
  console.log('1. Review and edit the .env file with your actual credentials');
  console.log('2. Run: node scripts/setup-database-config.js validate');
  console.log('3. Start the application: npm run dev');
}
  }
function createTemplate(provider) {
  if (!provider) {
    console.log('❌ Provider is required. Use: template [provider]');
    return;
  }
  
  console.log(`📝 Creating .env template for ${provider.toUpperCase()}...\n`);
  
  const templateContent = generateEnvContent(provider, {});
  const templatePath = `.env.${provider}.template`;
  
  fs.writeFileSync(templatePath, templateContent);
  console.log(`✓ Template created: ${templatePath}`);
  console.log('\n📋 To use this template:');
  console.log(`1. Copy: cp ${templatePath} .env`);
  console.log('2. Edit .env with your actual credentials');
  console.log('3. Run: node scripts/setup-database-config.js validate');
}
  
function validateConfiguration() {
  console.log('🔍 Validating database configuration...\n');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ No .env file found');
    console.log('Run: node scripts/setup-database-config.js template [provider]');
    return;
  }
  
  const env = readEnvFile();
  const provider = detectProvider();
  
  if (!provider) {
    console.log('❌ No valid database configuration detected in .env');
    return;
  }
  
  console.log(`✓ Detected provider: ${provider.toUpperCase()}`);
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  if (!env.SESSION_SECRET || env.SESSION_SECRET === 'your-super-secret-session-key-change-this-in-production') {
    warnings.push('SESSION_SECRET should be changed from default value');
  }
  
  switch (provider) {
    case 'supabase':
      if (!env.SUPABASE_URL || env.SUPABASE_URL === 'https://your-project-ref.supabase.co') missing.push('SUPABASE_URL');
      if (!env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY === 'your-anon-key') missing.push('SUPABASE_ANON_KEY');
      if (!env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY === 'your-service-role-key') missing.push('SUPABASE_SERVICE_KEY');
      break;
      
    case 'neon':
    case 'planetscale':
    case 'postgresql':
    case 'mysql':
      if (!env.DATABASE_URL || env.DATABASE_URL.includes('username:password')) missing.push('DATABASE_URL');
      break;
      
    case 'sqlite':
      // SQLite doesn't require external configuration
      break;
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required configuration:');
    missing.forEach(key => console.log(`  - ${key}`));
    console.log('\nPlease update your .env file with the correct values.');
    return;
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }
  
  console.log('✅ Configuration validation passed!');
  console.log('\n📋 Ready to start:');
  console.log('  Development: npm run dev');
  console.log('  Production: npm start');
  console.log('  Docker: docker-compose up -d');
}
  console.log(`\n✓ Configuration appears valid for ${provider}`);
function resetConfiguration() {
  console.log('🔄 Resetting database configuration...\n');
  
  const filesToRemove = [
    envPath,
    './data/initialization.json',
    './data/database-configs.json',
    './docker-compose.override.yml'
  ];
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${file}.backup.${timestamp}`;
      fs.copyFileSync(file, backupPath);
      fs.unlinkSync(file);
      console.log(`✓ Removed ${file} (backed up to ${backupPath})`);
    }
  });
  
  console.log('\n✅ Configuration reset complete');
  console.log('Run the initialization wizard or use this script to set up a new configuration.');
}
}
// Main execution
switch (command) {
  case 'help':
    showHelp();
    break;
    
  case 'detect':
    detectConfiguration();
    break;
    
  case 'generate':
    generateConfiguration(args[1]);
    break;
    
  case 'template':
    createTemplate(args[1]);
    break;
    
  case 'validate':
    validateConfiguration();
    break;
    
  case 'reset':
    resetConfiguration();
    break;
    
  default:
    console.log('❌ Unknown command. Use "help" for usage information.');
    process.exit(1);
}