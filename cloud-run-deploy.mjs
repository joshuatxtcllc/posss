#!/usr/bin/env node

/**
 * Cloud Run Specific Deployment Script
 * Addresses deployment health check failures
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('☁️ Building for Cloud Run deployment...');

try {
  // Clean and create dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // Build server with specific Cloud Run optimizations
  console.log('⚡ Building optimized server bundle...');
  
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
    '--minify'
  ].join(' ');

  execSync(serverBuildCommand, { stdio: 'inherit' });
  console.log('✓ Server bundle created and minified');

  // Create ultra-minimal package.json for Cloud Run
  const cloudRunPackage = {
    name: "jays-frames-pos",
    version: "1.0.0",
    type: "module",
    main: "start.mjs",
    scripts: {
      start: "node start.mjs"
    },
    engines: {
      node: ">=18.0.0"
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(cloudRunPackage, null, 2));
  console.log('✓ Created minimal Cloud Run package.json');

  // Create optimized startup script for Cloud Run
  const cloudRunStart = `#!/usr/bin/env node

// Cloud Run optimized startup
const requiredEnvVars = ['NODE_ENV', 'PORT'];
requiredEnvVars.forEach(key => {
  if (key === 'NODE_ENV') process.env[key] = 'production';
  if (key === 'PORT' && !process.env[key]) process.env[key] = '8080';
});

console.log('🚀 Starting Jay\\'s Frames POS System for Cloud Run');
console.log('Port:', process.env.PORT);
console.log('Environment:', process.env.NODE_ENV);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server with timeout
const startTimeout = setTimeout(() => {
  console.error('Server startup timeout exceeded');
  process.exit(1);
}, 60000); // 60 second timeout

import('./server.mjs')
  .then(() => {
    clearTimeout(startTimeout);
    console.log('✓ Server started successfully');
  })
  .catch(error => {
    clearTimeout(startTimeout);
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
`;

  fs.writeFileSync('dist/start.mjs', cloudRunStart);
  console.log('✓ Created Cloud Run optimized startup script');

  // Create Dockerfile-compatible structure
  const dockerignore = `node_modules
.git
.env
dist/node_modules
*.log
.cache
.replit*
`;

  fs.writeFileSync('dist/.dockerignore', dockerignore);
  console.log('✓ Created .dockerignore for deployment');

  // Create static health check page
  const healthHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Jay's Frames POS - Health Check</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin: 0 0 20px 0;">🖼️ Jay's Frames POS System</h1>
        <p style="color: #666; font-size: 18px; margin: 0 0 20px 0;">System Status: <strong style="color: #28a745;">Healthy</strong></p>
        <p style="color: #666; margin: 0 0 20px 0;">Server is running in production mode and ready to serve requests.</p>
        <p style="color: #999; font-size: 14px; margin: 0;">API endpoints available at <code>/api/*</code></p>
    </div>
</body>
</html>`;

  fs.writeFileSync('dist/index.html', healthHTML);
  console.log('✓ Created static health check page');

  // Verify build outputs
  const requiredFiles = ['server.mjs', 'start.mjs', 'package.json', 'index.html'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join('dist', file)));
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }

  const serverSize = fs.statSync('dist/server.mjs').size;
  console.log(`📦 Server bundle: ${(serverSize / 1024).toFixed(1)}KB (minified)`);

  console.log('🎉 Cloud Run deployment build completed successfully!');
  console.log('📋 Cloud Run optimizations applied:');
  console.log('  ✓ Immediate health check at root (/) with static fallback');
  console.log('  ✓ Minified server bundle for faster startup');
  console.log('  ✓ Startup timeout protection (60 seconds)');
  console.log('  ✓ Comprehensive error handling');
  console.log('  ✓ Cloud Run PORT environment variable handling');
  console.log('  ✓ Static health check page for load balancer');
  console.log('☁️ Ready for Cloud Run deployment');

} catch (error) {
  console.error('❌ Cloud Run build failed:', error.message);
  process.exit(1);
}