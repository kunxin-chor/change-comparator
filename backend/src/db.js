const { MongoClient } = require('mongodb');

let client;
let db;

async function connectToMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'code_diff_comment';

  if (!uri) {
    throw new Error('Missing MONGODB_URI env var');
  }

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(dbName);
  console.log(`Connected to MongoDB database: ${dbName}`);

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('MongoDB not connected yet. Call connectToMongo() first.');
  }
  return db;
}

module.exports = {
  connectToMongo,
  getDb
};
