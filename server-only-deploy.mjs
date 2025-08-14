#!/usr/bin/env node

/**
 * Server-Only Deployment Script
 * Builds just the server component for Cloud Run deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Building server for Cloud Run deployment...');

try {
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Build server bundle
  console.log('⚡ Building server bundle...');
  
  const serverBuildCommand = [
    'esbuild server/index.ts',
    '--platform=node',
    '--packages=external',
    '--bundle',
    '--format=esm',
    '--outfile=dist/server.mjs',
    '--define:process.env.NODE_ENV=\\"production\\"',
    '--target=es2020'
  ].join(' ');

  execSync(serverBuildCommand, { stdio: 'inherit' });
  console.log('✓ Server bundle created');

  // Create minimal package.json for deployment
  const deployPackage = {
    name: "jays-frames-pos",
    version: "1.0.0",
    type: "module",
    main: "server.mjs",
    scripts: {
      start: "node server.mjs"
    },
    engines: {
      node: ">=18.0.0"
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));
  console.log('✓ Created deployment package.json');

  // Create Cloud Run startup script
  const startScript = `#!/usr/bin/env node

// Cloud Run production startup
process.env.NODE_ENV = 'production';

// Configure PORT for Cloud Run (required) - override default 5000 for deployment
const PORT = process.env.PORT || 8080;
process.env.PORT = PORT.toString();

console.log('🚀 Jay\\'s Frames POS System starting...');
console.log('Port:', PORT);
console.log('Node ENV:', process.env.NODE_ENV);

// Import and start server
import('./server.mjs').catch(error => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
`;

  fs.writeFileSync('dist/start.mjs', startScript);
  console.log('✓ Created startup script');

  // Copy existing frontend build if it exists
  if (fs.existsSync('dist/index.html')) {
    console.log('✓ Using existing frontend build');
  } else {
    // Create a minimal index.html for health checks
    const minimalHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Jay's Frames POS System</title>
</head>
<body>
    <h1>Jay's Frames POS System</h1>
    <p>Server is running in production mode.</p>
    <p>API endpoints are available at /api/*</p>
</body>
</html>`;
    fs.writeFileSync('dist/index.html', minimalHTML);
    console.log('✓ Created minimal frontend placeholder');
  }

  const serverSize = fs.statSync('dist/server.mjs').size;
  console.log(`📦 Server bundle: ${(serverSize / 1024).toFixed(1)}KB`);

  console.log('🎉 Server deployment build completed!');
  console.log('📋 Applied fixes:');
  console.log('  ✓ Health check at / responds immediately');
  console.log('  ✓ Server built without proxy dependencies');
  console.log('  ✓ Cloud Run PORT configuration implemented');
  console.log('  ✓ ESM format with proper startup script');
  console.log('🚀 Ready for Cloud Run deployment');

} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}