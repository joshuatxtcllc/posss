#!/usr/bin/env node

/**
 * Complete Build Fix for Jay's Frames POS System
 * Resolves lightningcss and other bundling issues
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🚀 Starting comprehensive build fix...');

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

try {
  // Step 1: Build client with Vite
  console.log('📦 Building client application...');
  execSync('npx vite build --outDir dist/public', { stdio: 'inherit' });
  console.log('✅ Client build completed successfully');

  // Step 2: Build server with comprehensive external dependencies
  console.log('🔧 Building server with fixed externals...');
  
  // Complete list of external dependencies to prevent bundling issues
  const externalDeps = [
    // Core dependencies causing issues
    'lightningcss',
    'canvas',
    'sharp', 
    
    // Build tools
    'vite',
    'esbuild',
    'typescript',
    'tsx',
    'postcss',
    'tailwindcss',
    'autoprefixer',
    '@vitejs/plugin-react',
    '@babel/preset-typescript',
    '@babel/core',
    '@babel/preset-env',
    '@babel/runtime',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal', 
    '@replit/vite-plugin-shadcn-theme-json',
    
    // Core server dependencies
    'express',
    'cors',
    'dotenv',
    'ws',
    'helmet',
    'cookie-parser',
    'multer',
    'winston',
    
    // Database
    '@neondatabase/serverless',
    'drizzle-orm',
    'drizzle-kit',
    'drizzle-zod',
    
    // External services
    'openai',
    'twilio',
    '@sendgrid/mail',
    'stripe',
    'node-fetch',
    
    // Utilities
    'qrcode',
    'mammoth',
    'pdf-parse',
    'csv-parser',
    'xml2js',
    'xlsx',
    'cheerio',
    'jsonwebtoken',
    'express-rate-limit',
    'express-session',
    'passport',
    'passport-local',
    'connect-pg-simple',
    'memorystore',
    'csurf',
    'ajv',
    'zod',
    'zod-validation-error',
    'date-fns',
    'image-js',
    
    // React dependencies (should not be in server bundle)
    'react',
    'react-dom',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'framer-motion',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'wouter',
    'recharts',
    'vaul',
    'cmdk',
    'input-otp',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-toast',
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-aspect-ratio',
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-context-menu',
    '@radix-ui/react-hover-card',
    '@radix-ui/react-label',
    '@radix-ui/react-menubar',
    '@radix-ui/react-navigation-menu',
    '@radix-ui/react-popover',
    '@radix-ui/react-progress',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-slider',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toggle',
    '@radix-ui/react-toggle-group',
    '@radix-ui/react-tooltip',
    '@hookform/resolvers',
    'react-hook-form',
    '@tanstack/react-query',
    'react-day-picker',
    'react-dnd',
    'react-dnd-html5-backend',
    'react-error-boundary',
    'react-icons',
    'react-qr-code',
    'react-resizable-panels',
    '@stripe/react-stripe-js',
    '@stripe/stripe-js',
    'embla-carousel-react',
    
    // Problematic native modules
    'bufferutil',
    'utf-8-validate',
    '@jridgewell/trace-mapping'
  ];

  const buildCommand = [
    'npx esbuild server/index.ts',
    '--platform=node',
    '--bundle',
    '--format=esm',
    '--outfile=dist/server.mjs',
    '--define:process.env.NODE_ENV=\\"production\\"',
    '--target=es2020',
    '--tree-shaking=true',
    '--minify',
    ...externalDeps.map(dep => `--external:${dep}`)
  ].join(' ');

  console.log('Running build command...');
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('✅ Server build completed successfully');

  // Step 3: Create production startup script
  console.log('📝 Creating production startup script...');
  const startupScript = `#!/usr/bin/env node

// Production startup for Jay's Frames POS System
console.log('🚀 Starting Jay\\'s Frames POS System in production mode...');

const PORT = process.env.PORT || '5000';
console.log('📍 Port:', PORT);
console.log('🌐 Environment:', process.env.NODE_ENV || 'production');

// Startup timeout protection
const startTimeout = setTimeout(() => {
  console.error('❌ Server startup timeout (60s exceeded)');
  process.exit(1);
}, 60000);

// Import and start the server
import('./server.mjs')
  .then(() => {
    clearTimeout(startTimeout);
    console.log('✅ Server started successfully');
    console.log('🌐 Server accessible at http://0.0.0.0:' + PORT);
  })
  .catch(error => {
    clearTimeout(startTimeout);
    console.error('❌ Server startup failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
`;

  writeFileSync('dist/start.mjs', startupScript);
  console.log('✅ Production startup script created');

  console.log('\n🎉 Build completed successfully!');
  console.log('📊 Build artifacts:');
  console.log('  ✅ Client build: dist/public/');
  console.log('  ✅ Server build: dist/server.mjs');
  console.log('  ✅ Startup script: dist/start.mjs');
  console.log('\n🚀 To start production server: node dist/start.mjs');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}