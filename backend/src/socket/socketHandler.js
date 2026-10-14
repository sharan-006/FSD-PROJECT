/**
 * QVeue Real-Time Socket.IO Handler
 * 
 * Manages real-time queue rooms, live display boards, staff desk sync,
 * and instant notification push events.
 */

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    // Join specific queue room (for customer live tracking / public boards)
    socket.on('join:queue', (queueId) => {
      if (queueId) {
        socket.join(`queue:${queueId}`);
        // console.log(`[Socket] ${socket.id} joined queue:${queueId}`);
      }
    });

    socket.on('leave:queue', (queueId) => {
      if (queueId) {
        socket.leave(`queue:${queueId}`);
      }
    });

    // Join private customer room for targeted notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        // console.log(`[Socket] ${socket.id} joined user:${userId}`);
      }
    });

    // Join staff room
    socket.on('join:staff', ({ staffId, orgId, serviceId }) => {
      if (staffId) socket.join(`staff:${staffId}`);
      if (orgId) socket.join(`org:${orgId}`);
      if (serviceId) socket.join(`service:${serviceId}`);
    });

    // Join admin room
    socket.on('join:admin', () => {
      socket.join('admin:room');
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = {
  setupSocketIO
};
