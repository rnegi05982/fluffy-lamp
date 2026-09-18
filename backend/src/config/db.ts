import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connect to MongoDB. Called once at boot before the HTTP server starts.
 */
export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
