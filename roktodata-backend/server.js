import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import app from "./app.js";
import { ensureRequestExpiryIndex } from "./models/PatientRequest.js";

try {
  await connectDB();
} catch (err) {
  console.error("Could not connect to MongoDB:", err.message);
  process.exit(1);
}

// Not fatal: the API still works, past-date requests just aren't auto-deleted.
await ensureRequestExpiryIndex().catch((err) =>
  console.error("Could not create the blood request expiry index:", err.message),
);

const server = app.listen(env.PORT, () => {
  console.log(`Roktodata API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  // Force-exit if open connections keep the server from closing.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  shutdown("unhandledRejection");
});
