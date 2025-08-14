import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Jay\'s Frames POS System - Starting Server Daemon');

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Jay\'s Frames POS',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API proxy for backend services (if needed)
app.use('/api', (req, res, next) => {
  // For now, just return a placeholder
  res.status(503).json({ error: 'Backend API not connected' });
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ POS System running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Serving static files from: ${path.join(__dirname, 'dist', 'public')}`);
  console.log(`✅ Health check available at: http://0.0.0.0:${PORT}/health`);
  console.log('🔄 Server is now persistent and ready for connections');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is in use, trying alternative...`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Keep process alive and handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Prevent process from exiting
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit, keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, keep server running
});

console.log('⚡ Server daemon initialized and monitoring for connections');