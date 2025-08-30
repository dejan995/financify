#!/usr/bin/env node

/**
 * Script to generate database-configs.json based on environment variables
 * This allows users to create the config file programmatically instead of hardcoding values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(path.dirname(__dirname), 'data');
const configPath = path.join(dataDir, 'database-configs.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data directory');
}

// Default empty configuration
let configs = [];

// Check for environment variables and generate config accordingly
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_KEY) {
  console.log('Found Supabase environment variables, creating Supabase config...');
  configs.push({
    id: `supabase-${Date.now()}`,
    name: 'Environment Supabase Database',
    provider: 'supabase',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    isActive: true,
    isConnected: true,
    ssl: true,
    maxConnections: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastConnectionTest: new Date().toISOString()
  });
}

if (process.env.DATABASE_URL) {
  console.log('Found DATABASE_URL environment variable, creating PostgreSQL config...');
  configs.push({
    id: `postgres-${Date.now()}`,
    name: 'Environment PostgreSQL Database',
    provider: 'postgresql',
    connectionString: process.env.DATABASE_URL,
    isActive: true,
    isConnected: true,
    ssl: true,
    maxConnections: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastConnectionTest: new Date().toISOString()
  });
}

// If no environment variables found, create empty config for manual setup
if (configs.length === 0) {
  console.log('No database environment variables found, creating empty config file...');
  console.log('You can either:');
  console.log('1. Set environment variables (SUPABASE_URL, etc.) and run this script again');
  console.log('2. Use the web interface to configure your database');
  console.log('3. Manually edit data/database-configs.json');
}

// Write the configuration file
fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
console.log(`✓ Generated database configuration file: ${configPath}`);

if (configs.length > 0) {
  console.log(`✓ Created ${configs.length} database configuration(s)`);
  configs.forEach(config => {
    console.log(`  - ${config.name} (${config.provider})`);
  });
} else {
  console.log('ℹ Configuration file created but empty - configure via web interface or environment variables');
}