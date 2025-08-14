#!/usr/bin/env node
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

console.log('Starting Jay\'s Frames POS System directly...');

// Serve built static files
const publicPath = join(__dirname, 'dist', 'public');
if (existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log('✅ Serving static files from:', publicPath);
} else {
  console.log('❌ Static files not found at:', publicPath);
}

// Fallback to serve index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = join(publicPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('POS System not found - please run build first');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Jay's Frames POS running on http://0.0.0.0:${PORT}`);
  console.log('✅ Ready to serve customers');
});