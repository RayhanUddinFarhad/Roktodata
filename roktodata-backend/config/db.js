import mongoose from "mongoose";
import { env, isProduction } from "./env.js";

// Strip query operators ($gt, $ne, ...) from any user value that reaches a filter.
mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, {
    // Build indexes automatically in development; in production create them deliberately.
    autoIndex: !isProduction,
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
