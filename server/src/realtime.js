const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');

// Socket.IO is only started by index.js. The tests use the app without it,
// so sendToUser does nothing when it has not been started.
let io = null;

function startRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // The browser sends its login token when it connects
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth.token, config.jwtSecret);
      socket.userId = payload.id;
      next();
    } catch (err) {
      next(new Error('Please log in first'));
    }
  });

  // Each user joins a room with their id, so we can send events to just them
  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });
}

function sendToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

module.exports = { startRealtime, sendToUser };
