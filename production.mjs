#!/usr/bin/env node

// Simple production server startup
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

import('./server/index.ts').then(() => {
  console.log('Production server started');
}).catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});