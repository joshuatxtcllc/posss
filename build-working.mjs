#!/usr/bin/env node

/**
 * Working build script that bypasses lightningcss issues
 */

import { execSync } from 'child_process';

console.log('🚀 Building with working script...');

try {
  // Build client
  console.log('📦 Building client...');
  execSync('npm run build:client', { stdio: 'inherit' });
  
  // Use our fixed build for server
  console.log('🔧 Building server with fix...');
  execSync('node fix-build.mjs', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}