import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(uri = config.mongoUri) {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB connected to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
