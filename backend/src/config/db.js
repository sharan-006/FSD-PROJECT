const mongoose = require('mongoose');
const net = require('net');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

let mongoServerInstance = null;

// Reusable TCP port availability checker
function isPortOpen(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Reusable MongoDB Connection Module
 * Supports local MongoDB instance and MongoDB Atlas
 */
async function connectDB() {
  const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qveue';
  let finalUri = rawUri;

  console.log(`[DB] Preparing MongoDB connection...`);

  // Detect local connection target
  const isLocal = rawUri.includes('127.0.0.1') || rawUri.includes('localhost');

  if (isLocal) {
    const open = await isPortOpen(27017);
    if (!open) {
      console.log(`ℹ [DB] Local MongoDB daemon not detected on port 27017.`);
      console.log(`🚀 [DB] Launching dedicated persistent local MongoDB engine on port 27017...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const dbPath = path.join(__dirname, '../../data/mongodb');
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }

        mongoServerInstance = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbPath,
            storageEngine: 'wiredTiger'
          }
        });
        finalUri = mongoServerInstance.getUri() + 'qveue';
        console.log(`✓ [DB] Local MongoDB engine ready on port 27017 (Storage: ${dbPath})`);
      } catch (err) {
        console.warn(`[DB] Note on local engine launch: ${err.message}`);
      }
    } else {
      console.log(`✓ [DB] Detected active MongoDB daemon listening on port 27017.`);
    }
  }

  // Connect to MongoDB via Mongoose
  try {
    const maskedUri = finalUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`[DB] Connecting to: ${maskedUri}`);

    await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true // Ensure partial unique indexes and secondary indexes are built
    });

    console.log(`===============================================`);
    console.log(`✓ [DB] Connected to MongoDB successfully!`);
    console.log(`📦 Database Name: ${mongoose.connection.name}`);
    console.log(`🌐 Cluster Host: ${mongoose.connection.host}:${mongoose.connection.port || ''}`);
    console.log(`📡 Ready State: Connected (1)`);
    console.log(`===============================================`);

    return mongoose.connection;
  } catch (err) {
    console.error(`===============================================`);
    console.error(`❌ [DB] MongoDB Connection Failure:`);
    console.error(`   ${err.message}`);
    console.error(`   Please check your MONGODB_URI in backend/.env`);
    console.error(`===============================================`);
    throw err;
  }
}

/**
 * Disconnect from MongoDB (useful for test suites and graceful shutdown)
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServerInstance) {
      await mongoServerInstance.stop();
      mongoServerInstance = null;
    }
    console.log(`[DB] Disconnected from MongoDB cleanly.`);
  } catch (err) {
    console.error(`[DB] Error during disconnect:`, err);
  }
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  mongoose
};
