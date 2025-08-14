#!/usr/bin/env node
import { spawn } from 'child_process';

console.log('🚀 Starting Jay\'s Frames POS System...');

// Start the server with environment variable
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  env: { ...process.env, PORT: '5000' },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});