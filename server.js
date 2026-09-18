import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dns from "node:dns";

// Prefer IPv4 for outbound DNS lookups. Some hosts (Render's free tier
// included) don't have an outbound route to certain services' IPv6
// addresses and fail with ENETUNREACH otherwise — this affects any
// outbound connection (SMTP, MongoDB, etc.), not just one library.
dns.setDefaultResultOrder("ipv4first");

import connectDB from "./config/db.js";
import contactRoutes from "./routes/contactRoutes.js";

import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect MongoDB
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.warn("MongoDB connection string (MONGODB_URI) is missing in .env");
}

const app = express();

/* =========================
   CORS Configuration
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

/* =========================
   Middlewares
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   Routes
========================= */

// API Routes
app.use("/api/contacts", contactRoutes);

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running successfully...",
  });
});

/* =========================
   Error Handling
========================= */

app.use(notFound);
app.use(errorHandler);

/* =========================
   Server
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`,
  );
});
