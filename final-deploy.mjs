#!/usr/bin/env node

import fs from 'fs';

console.log('Creating final deployment...');

// Clean start
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Copy the standalone server
fs.copyFileSync('standalone-server.ts', 'dist/server.ts');

// Create package.json with minimal dependencies
const pkg = {
  "name": "jays-frames-pos",
  "type": "module",
  "main": "server.ts",
  "scripts": {
    "start": "npx tsx server.ts"
  },
  "dependencies": {
    "tsx": "latest",
    "express": "latest"
  }
};
fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));

// Create minimal public directory
fs.mkdirSync('dist/public', { recursive: true });
fs.writeFileSync('dist/public/index.html', '<html><body><h1>Jay\'s Frames POS</h1><p>System Online</p></body></html>');

console.log('Final deployment ready - using standalone server');
console.log('Health checks: /, /health, /ready');
console.log('Port: Uses PORT env var or 5000');
console.log('Dependencies: Only express and tsx');