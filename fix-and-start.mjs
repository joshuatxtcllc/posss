#!/usr/bin/env node

// Fix package.json and start server
import { readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';

console.log('🔧 Fixing package.json syntax error...');

try {
  // Read current package.json
  const packageContent = readFileSync('./package.json', 'utf8');
  
  // Fix the double comma syntax error
  const fixedContent = packageContent.replace(
    '"build": "npm run build:client && npm run build:server && npm run start",,',
    '"build": "npm run build:client && npm run build:server",'
  );
  
  // Write the fixed version
  writeFileSync('./package.json', fixedContent);
  console.log('✅ Fixed package.json syntax error');
  
  // Now start the development server
  console.log('🚀 Starting development server...');
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '5000'
    }
  });
  
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  const cleanup = () => {
    console.log('Shutting down server...');
    server.kill('SIGTERM');
    setTimeout(() => {
      server.kill('SIGKILL');
      process.exit(0);
    }, 3000);
  };
  
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  
} catch (error) {
  console.error('Failed to fix package.json:', error);
  process.exit(1);
}