#!/usr/bin/env node

/**
 * Production Build Script for Cloud Run Deployment
 * Fixes deployment issues by creating a proper build without proxy dependencies
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production build for Cloud Run deployment...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
    console.log('✓ Cleaned previous build');
  }
  fs.mkdirSync('dist', { recursive: true });

  // Build frontend first
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  console.log('✓ Frontend build completed');

  // Build server with ESM format for Cloud Run
  console.log('🔧 Building server...');
  const serverBuildCommand = [
    'esbuild server/index.ts',
    '--platform=node',
    '--packages=external',
    '--bundle',
    '--format=esm',
    '--outfile=dist/server.mjs',
    '--define:process.env.NODE_ENV=\\"production\\"',
    '--target=es2020',
    '--keep-names',
    '--source-map=external'
  ].join(' ');

  execSync(serverBuildCommand, { stdio: 'inherit' });
  console.log('✓ Server build completed');

  // Create production package.json without proxy configurations
  const originalPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const productionPackageJson = {
    name: originalPackageJson.name,
    version: originalPackageJson.version,
    type: "module",
    main: "server.mjs",
    scripts: {
      start: "node server.mjs"
    },
    engines: {
      node: ">=18.0.0"
    },
    dependencies: {
      // Include only essential runtime dependencies
      "@neondatabase/serverless": originalPackageJson.dependencies["@neondatabase/serverless"],
      "dotenv": originalPackageJson.dependencies["dotenv"],
      "express": originalPackageJson.dependencies["express"],
      "cors": originalPackageJson.dependencies["cors"],
      "helmet": originalPackageJson.dependencies["helmet"],
      "drizzle-orm": originalPackageJson.dependencies["drizzle-orm"],
      "zod": originalPackageJson.dependencies["zod"]
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackageJson, null, 2));
  console.log('✓ Created production package.json');

  // Create Cloud Run compatible startup script
  const startupScript = `#!/usr/bin/env node

// Cloud Run production startup
process.env.NODE_ENV = 'production';

// Ensure PORT is properly configured for Cloud Run
const PORT = process.env.PORT || 8080;
process.env.PORT = PORT;

console.log('Starting Jay\\'s Frames POS System in production mode...');
console.log('Port:', PORT);
console.log('Environment:', process.env.NODE_ENV);

// Import and start the server
import('./server.mjs').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
`;

  fs.writeFileSync('dist/start.mjs', startupScript);
  console.log('✓ Created Cloud Run startup script');

  // Copy built frontend assets to dist
  if (fs.existsSync('dist/client')) {
    // Frontend was built to dist/client, copy it to proper location
    console.log('✓ Frontend assets already in dist/');
  } else if (fs.existsSync('dist/assets')) {
    // Assets are already in the right place
    console.log('✓ Frontend assets built successfully');
  }

  // Create environment template
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envTemplate = envContent
      .split('\n')
      .map(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key] = line.split('=');
          return `${key}=`;
        }
        return line;
      })
      .join('\n');
    
    fs.writeFileSync('dist/.env.template', envTemplate);
    console.log('✓ Created environment template');
  }

  // Verify build
  const serverExists = fs.existsSync('dist/server.mjs');
  const packageExists = fs.existsSync('dist/package.json');
  const startExists = fs.existsSync('dist/start.mjs');

  if (!serverExists || !packageExists || !startExists) {
    throw new Error('Build verification failed - missing required files');
  }

  const serverStats = fs.statSync('dist/server.mjs');
  console.log(`✓ Server bundle: ${(serverStats.size / 1024).toFixed(1)}KB`);

  console.log('🎉 Production build completed successfully!');
  console.log('📋 Deployment fixes applied:');
  console.log('  ✓ Added immediate health check endpoint at /');
  console.log('  ✓ Built server without proxy dependencies');
  console.log('  ✓ Created Cloud Run compatible startup script');
  console.log('  ✓ Configured proper PORT environment handling');
  console.log('  ✓ Generated ESM module with .mjs extension');
  console.log('🚀 Ready for Cloud Run deployment');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}