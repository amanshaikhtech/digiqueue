const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer, clientOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: clientOrigin || '*',
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    // Client joins room for specific doctor
    socket.on('join-doctor', (doctorId) => {
      if (doctorId) {
        const roomName = `doctor:${doctorId}`;
        socket.join(roomName);
        console.log(`[Socket] Socket ${socket.id} joined room ${roomName}`);
      }
    });

    socket.on('leave-doctor', (doctorId) => {
      if (doctorId) {
        const roomName = `doctor:${doctorId}`;
        socket.leave(roomName);
        console.log(`[Socket] Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
