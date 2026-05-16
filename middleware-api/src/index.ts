/**
 * Rialo QRIS Middleware — Main Entry Point
 *
 * Express server that bridges on-chain Solana payments
 * to QRIS fiat settlement via Xendit payment gateway.
 *
 * Endpoints:
 * - /api/payment/* — Payment lifecycle management
 * - /api/rate/*    — Exchange rate queries
 * - /health        — Health check
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/payment";
import rateRoutes from "./routes/rate";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

// ============================================================
// Middleware
// ============================================================

/** Parse JSON request bodies */
app.use(express.json());

/** Enable CORS for frontend */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

/** Request logging */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================================
// Routes
// ============================================================

/** Payment lifecycle routes */
app.use("/api/payment", paymentRoutes);

/** Exchange rate routes */
app.use("/api/rate", rateRoutes);

/** Health check endpoint */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "rialo-qris-middleware",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    solana: {
      rpc: process.env.SOLANA_RPC_URL || "not configured",
      programId: process.env.PROGRAM_ID || "not configured",
    },
  });
});

/** Root endpoint */
app.get("/", (_req, res) => {
  res.json({
    name: "Rialo QRIS Pay — Middleware API",
    version: "1.0.0",
    docs: {
      payment: "/api/payment",
      rate: "/api/rate",
      health: "/health",
    },
  });
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║   🚀 Rialo QRIS Middleware API                      ║
  ║   Running on http://localhost:${PORT}                  ║
  ║   Solana RPC: ${(process.env.SOLANA_RPC_URL || "not set").slice(0, 35).padEnd(35)}    ║
  ║   Program ID: ${(process.env.PROGRAM_ID || "not set").slice(0, 35).padEnd(35)}║
  ╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
