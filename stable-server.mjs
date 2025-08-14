#!/usr/bin/env node

/**
 * Stable Server Startup Script
 * Prevents server from exiting prematurely and handles shutdown gracefully
 */

import { spawn } from 'child_process';

console.log('🚀 Starting stable server...');

let serverProcess;

function startServer() {
  console.log('🚀 Starting application server on port 5000...');
  
  serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '5000'
    }
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Server startup error:', error.message);
  });

  serverProcess.on('exit', (code, signal) => {
    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      console.log('✓ Server shutdown gracefully');
      return;
    }
    
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}, signal: ${signal}`);
      console.log('🔄 Keeping process alive for debugging...');
    }
  });

  // Confirm server startup
  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      console.log('✓ Server should be running on port 5000');
    }
  }, 3000);
}

// Start the server
startServer();

// Graceful shutdown handler
const shutdown = () => {
  console.log('\nShutting down server...');
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
    process.exit(0);
  }, 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep the process alive
process.stdin.resume();
console.log('📡 Server manager running - press Ctrl+C to stop');