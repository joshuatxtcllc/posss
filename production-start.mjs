#!/usr/bin/env node

/**
 * Production-only server startup script
 * This script ensures the application starts in production mode
 * without any development dependencies or configurations
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

// Ensure PORT is available for the server
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

process.env.PORT = process.env.PORT || process.env.REPL_PORT || '5000';

console.log('🚀 Starting production server (deployment mode)...');
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Port: ${process.env.PORT}`);

// Check if built server exists
const builtServerPath = path.join(__dirname, 'dist', 'server.mjs');
const useBuiltServer = fs.existsSync(builtServerPath);

let startCommand, startArgs;

if (useBuiltServer) {
  console.log('📦 Using optimized production build');
  startCommand = 'node';
  startArgs = ['dist/server.mjs'];
} else {
  console.log('🔧 Starting TypeScript server in production mode');
  startCommand = 'npx';
  startArgs = ['tsx', 'server/index.ts'];
}

const server = spawn(startCommand, startArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('error', (error) => {
  console.error('❌ Production server failed to start:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Production server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
const cleanup = () => {
  console.log('\n🛑 Shutting down production server...');
  server.kill('SIGTERM');
  setTimeout(() => {
    server.kill('SIGKILL');
    process.exit(0);
  }, 5000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

console.log('✅ Production server started successfully');