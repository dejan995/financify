#!/usr/bin/env node

/**
 * Health check script for Docker containers
 * This script checks if the application is running and responding correctly
 */

import http from 'http';
import { exit } from 'process';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/initialization/status',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200 || res.statusCode === 304) {
    console.log('Health check passed');
    exit(0);
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    exit(1);
  }
});

req.on('timeout', () => {
  console.error('Health check timeout');
  req.destroy();
  exit(1);
});

req.on('error', (error) => {
  console.error('Health check error:', error.message);
  exit(1);
});

req.end();