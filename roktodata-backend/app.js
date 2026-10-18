import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { env, isProduction } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimiters.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import fraudRoutes from "./routes/fraudRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.disable("x-powered-by");
// Needed behind a reverse proxy so rate limiting sees the real client IP.
app.set("trust proxy", env.TRUST_PROXY);
// Query values are plain strings or string arrays; nested objects like ?a[$ne]=1 are never produced.
app.set("query parser", "simple");

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "10kb" }));
app.use(sanitizeInput);

// Friendly response for anyone opening the API's base URL in a browser.
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Roktodata API চলছে।", health: "/api/health" });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api", apiLimiter);
app.use("/api/otp", otpRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/fraud-reports", fraudRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
