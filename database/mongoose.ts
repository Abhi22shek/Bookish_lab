import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Please provide MONGODB_URI in the environment variables");
}

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null
    }
}

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error("Failed to connect to database", error);
        throw error;
    }
    console.log("Successfully connected to database");
    return cached.conn;
}