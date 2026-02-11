const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connect() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('truckPlanner');
    console.log('✅ Connected to MongoDB Atlas');

    // Create indexes for recurring bookings
    await db.collection('bookings').createIndex(
      { recurringKey: 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ Created unique sparse index on recurringKey');

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function getDatabase() {
  if (!db) {
    await connect();
  }
  return db;
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connect,
  getDatabase,
  close,
};
