import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Define client build path early
const clientBuildPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'dist/public')
  : path.join(__dirname, '../dist/public');

// Trust proxy for accurate client IPs
app.set('trust proxy', true);
const PORT = parseInt(process.env.PORT || process.env.REPL_PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://*.replit.app', 'https://*.replit.dev']
    : [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://0.0.0.0:5173',
        'https://5173-jayframes-rest-express.replit.dev',
        /^https:\/\/.*\.replit\.dev$/,
        /^https:\/\/.*\.replit\.app$/
      ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoints (specific paths first)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: "Jay's Frames POS System",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Register all routes and start server
async function startServer() {
  try {
    // Register all API routes FIRST before static middleware
    console.log('🔧 Registering API routes before static middleware...');
    const { registerRoutes } = await import('./routes');
    const httpServer = await registerRoutes(app);
    console.log('✅ API routes registered successfully');

    // NOW set up static file serving AFTER API routes
    console.log(`📁 Serving static files from: ${clientBuildPath}`);
    console.log(`📂 Directory exists: ${fs.existsSync(clientBuildPath)}`);

    // List files in the directory for debugging
    if (fs.existsSync(clientBuildPath)) {
      console.log('📋 Files in client build directory:');
      const files = fs.readdirSync(clientBuildPath);
      files.forEach(file => console.log(`  - ${file}`));
    }

    app.use(express.static(clientBuildPath, {
      index: false,  // Don't serve index.html automatically
      redirect: false,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    // Development mode: Proxy to Vite dev server or serve development assets
    if (process.env.NODE_ENV === 'development') {
      // Serve client source files for development
      app.use('/src', express.static(path.join(process.cwd(), 'client/src')));
      app.use('/node_modules', express.static(path.join(process.cwd(), 'node_modules')));
      
      // Serve Vite dev files
      app.get('/vite.svg', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'client/public/vite.svg'));
      });
      
      app.get('/@vite/client', (req, res) => {
        res.status(404).send('Vite dev server not running');
      });
    }

    // Handle client-side routing (catch-all for React app)
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }

      const indexPath = path.join(clientBuildPath, 'index.html');
      console.log(`📄 Serving React app from: ${indexPath}`);

      if (!fs.existsSync(indexPath)) {
        console.error(`❌ index.html not found at: ${indexPath}`);
        return res.status(404).send('Jay\'s Frames POS not found - please run build first');
      }

      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving React app:', err);
          res.status(500).send('Server Error');
        }
      });
    });

    // Error handling middleware (comes LAST)
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: err.message 
      });
    });

    // Start the server
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Jay's Frames POS System running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Server bound to 0.0.0.0:${PORT}`);
      console.log('🎯 Ready for customers!');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Prevent process from exiting prematurely
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

export default app;