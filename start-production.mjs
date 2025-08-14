#!/usr/bin/env node

/**
 * Production Server Starter
 * This script starts the production server after ensuring the build is ready
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Jay\'s Frames POS Production Server...');

// Check if build exists
if (!fs.existsSync('dist/server.mjs')) {
  console.log('📦 Build not found, running build first...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  buildProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully');
      startServer();
    } else {
      console.error('❌ Build failed');
      process.exit(1);
    }
  });
} else {
  console.log('✅ Build found, starting server...');
  startServer();
}

function startServer() {
  // Start the production server
  const server = spawn('node', ['dist/server.mjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000'
    }
  });

  server.on('error', (error) => {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle graceful shutdown
  const cleanup = () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
    setTimeout(() => {
      server.kill('SIGKILL');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}