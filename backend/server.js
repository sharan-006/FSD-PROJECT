const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const { connectDB } = require('./src/config/db');
const { setupSocketIO } = require('./src/socket/socketHandler');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const counterRoutes = require('./src/routes/counterRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const Organization = require('./src/models/Organization');
const seedDatabase = require('./src/utils/seedData');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Attach io to express app for access in controllers
app.set('io', io);
setupSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Lightweight)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.url.startsWith('/api/health')) {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'QVeue Real-Time Core',
    timestamp: new Date().toISOString(),
    aiEngineReady: true
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is fresh
    const orgCount = await Organization.countDocuments({});
    if (orgCount === 0) {
      console.log('ℹ [DB] Empty database detected. Auto-seeding initial demo data...');
      await seedDatabase();
    }

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 QVeue Backend Server Running on Port ${PORT}`);
      console.log(`📡 WebSocket & Real-Time Sync Activated`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
