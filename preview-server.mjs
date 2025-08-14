#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

console.log('🔥 REPLIT PREVIEW SERVER FOR JAY\'S FRAMES POS');
console.log(`🔌 Starting on port: ${PORT}`);

app.use(express.json());

// Use the freshly built files in dist/public
const staticPath = path.join(__dirname, 'dist', 'public');
console.log(`📁 Static files: ${staticPath}`);
console.log(`📄 Files exist: ${fs.existsSync(staticPath)}`);

if (fs.existsSync(staticPath)) {
  const files = fs.readdirSync(staticPath);
  console.log(`📋 Available: ${files.join(', ')}`);
}

// Serve static files
app.use(express.static(staticPath));

// Essential API endpoints
app.get('/api/frames', (req, res) => {
  res.json([
    { id: 'F001', name: 'Oak Frame', price: 28.50, material: 'Wood', color: 'Natural' },
    { id: 'F002', name: 'Metal Frame', price: 35.00, material: 'Metal', color: 'Black' },
    { id: 'F003', name: 'Gold Frame', price: 45.00, material: 'Wood', color: 'Gold' }
  ]);
});

app.get('/api/customers', (req, res) => res.json([]));
app.get('/api/orders', (req, res) => res.json([]));
app.post('/api/orders', (req, res) => res.json({ id: Date.now(), ...req.body }));
app.post('/api/customers', (req, res) => res.json({ id: Date.now(), ...req.body }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Jay\'s Frames POS', port: PORT });
});

// Root health for deployment
app.get('/', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ 
      status: 'Jay\'s Frames POS System Running',
      port: PORT,
      files: fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : []
    });
  }
});

// Catch all for React routing
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Application not found', path: staticPath });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ JAY'S FRAMES POS PREVIEW SERVER RUNNING`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`💰 READY FOR BUSINESS`);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));