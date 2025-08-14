// Quick start script that starts the development server immediately
import { spawn, exec } from 'child_process';

console.log('🚀 Starting development server...');

// Clean up any existing processes on port 5000
console.log('🧹 Cleaning up existing processes...');
exec('pkill -f "tsx server/index.ts" || true', (error) => {
  if (error && !error.message.includes('No matching processes')) {
    console.log('Process cleanup completed');
  }
  
  // Wait a moment then start server
  setTimeout(() => {
    const server = spawn('tsx', ['server/index.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '5000'
      }
    });
    
    setupServerHandlers(server);
  }, 1000);
});

function setupServerHandlers(server) {

server.on('error', (error) => {
    if (error.message.includes('EADDRINUSE')) {
      console.error('❌ Port 5000 is still in use. Trying to force cleanup...');
      exec('fuser -k 5000/tcp || true', () => {
        console.log('🔄 Retrying server start in 3 seconds...');
        setTimeout(() => {
          const retryServer = spawn('tsx', ['server/index.ts'], {
            stdio: 'inherit',
            env: {
              ...process.env,
              NODE_ENV: 'development',
              PORT: '5000'
            }
          });
          setupServerHandlers(retryServer);
        }, 3000);
      });
    } else {
      console.error('Server error:', error.message);
      process.exit(1);
    }
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Keep process alive and handle shutdown
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
  });
}