import mongoose from 'mongoose';

export let dbConnected = false;

export async function connectToMongo(uri: string | undefined, timeoutMs = 5000): Promise<boolean> {
  if (!uri) return false;
  try {
    const connPromise = mongoose.connect(uri, {
      autoIndex: true,
      // use new URL parser and unified topology are the defaults in modern mongoose
    });
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), timeoutMs));
    await Promise.race([connPromise, timeout]);
    dbConnected = true;
    return true;
  } catch (err) {
    dbConnected = false;
    try {
      await mongoose.disconnect();
    } catch {}
    return false;
  }
}

export async function disconnect() {
  if (dbConnected) {
    await mongoose.disconnect();
    dbConnected = false;
  }
}
