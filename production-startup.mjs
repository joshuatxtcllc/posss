#!/usr/bin/env node

/**
 * Production Startup Script for Cloud Run Deployment
 * 
 * This script ensures the application starts correctly in production
 * with proper ESM module format and Cloud Run compatibility
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Force production environment
process.env.NODE_ENV = 'production';

console.log('🚀 Starting production application...');
console.log(`📍 Port: ${process.env.PORT || '5000'}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV}`);

async function startProduction() {
  try {
    // Check if built server exists
    if (!fs.existsSync('dist/server.mjs')) {
      console.log('📦 Server not built, building now...');
      
      // Build with ESM format for import.meta support
      await execAsync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.mjs --define:process.env.NODE_ENV=\\"production\\" --target=es2020 --minify');
      console.log('✓ Server built successfully');
    }

    // Start the built server
    console.log('🎯 Starting built server...');
    const { spawn } = await import('child_process');
    
    const serverProcess = spawn('node', ['dist/server.mjs'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Server startup failed:', error);
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code || 0);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down...');
      serverProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down...');
      serverProcess.kill('SIGINT');
    });

  } catch (error) {
    console.error('❌ Production startup failed:', error.message);
    process.exit(1);
  }
}

startProduction();