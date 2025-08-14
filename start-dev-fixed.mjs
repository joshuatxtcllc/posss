#!/usr/bin/env node

/**
 * Fixed Development Server Startup Script
 * Resolves SIGTERM handling and server exit issues
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Starting development servers...');

// Build the client first if it doesn't exist
if (!existsSync('dist/public/index.html')) {
  console.log('📦 Building client assets...');
  try {
    execSync('npm run build:client', { stdio: 'inherit' });
    console.log('✅ Client build completed');
  } catch (error) {
    console.error('❌ Client build failed:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Starting application server on port 5000...');

// Start the server process with proper signal handling
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle process exit properly
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  console.log('Shutting down development servers...');
  
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (!serverProcess.killed) {
        console.log('⚠️ Force killing server process...');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// Handle signals properly
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep the process alive
process.stdin.resume();

console.log('✅ Development environment started');
console.log('🌐 Server accessible at http://localhost:5000');
console.log('📱 Press Ctrl+C to stop the server');