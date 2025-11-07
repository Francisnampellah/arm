import mongoose from 'mongoose';

export async function connectToDatabase(mongoUri: string): Promise<typeof mongoose> {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  return mongoose;
}


