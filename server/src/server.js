require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGINS = [process.env.CLIENT_ORIGIN, process.env.PUBLIC_APP_URL]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = http.createServer(app);

// Initialize Socket.io with dedicated per-doctor rooms
const io = initSocket(server, CLIENT_ORIGINS);

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(`  🏥 DigiQueue Backend Server running on port ${PORT}`);
  console.log(`  🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ⚡ Socket.io enabled (CORS: ${CLIENT_ORIGINS.join(', ')})`);
  console.log(`  📋 Health Check: http://localhost:${PORT}/api/health`);
  console.log('========================================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server process terminated.');
  });
});
