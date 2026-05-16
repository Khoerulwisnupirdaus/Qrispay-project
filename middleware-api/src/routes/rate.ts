/**
 * Rate Routes
 *
 * Provides exchange rate information for USD ↔ IDR conversion.
 * Frontend uses this to display accurate pricing before payment.
 *
 * - GET /api/rate — Get current USD/IDR exchange rate
 * - GET /api/rate/convert — Convert between USD and IDR
 */

import { Router, Request, Response } from "express";
import {
  getCurrentExchangeRate,
  usdcToIdr,
  idrToUsdc,
  formatUsdc,
  formatIdr,
} from "../utils/converter";

const router = Router();

/**
 * GET /api/rate
 *
 * Returns the current USD/IDR exchange rate used by the system.
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const rate = await getCurrentExchangeRate();

    res.json({
      success: true,
      rate: {
        usdToIdr: rate / 100, // Human-readable rate
        idrToUsd: 100 / rate, // Inverse
        rawRate: rate, // Scaled by 100
        source: "fallback", // Would be "api" in production
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Rate] Failed to get exchange rate:", error);
    res.status(500).json({ error: "Failed to get exchange rate" });
  }
});

/**
 * GET /api/rate/convert
 *
 * Convert between USDC and IDR amounts.
 *
 * Query params:
 * - usdcAmount: USDC in smallest unit (optional)
 * - idrAmount: IDR amount (optional)
 * - One of the two must be provided
 */
router.get("/convert", async (req: Request, res: Response): Promise<void> => {
  try {
    const { usdcAmount, idrAmount } = req.query;
    const rate = await getCurrentExchangeRate();

    if (usdcAmount) {
      const usdc = parseInt(usdcAmount as string);
      const idr = usdcToIdr(usdc, rate);

      res.json({
        success: true,
        conversion: {
          from: { amount: usdc, currency: "USDC", formatted: formatUsdc(usdc) },
          to: { amount: idr, currency: "IDR", formatted: formatIdr(idr) },
          rate: rate / 100,
        },
      });
    } else if (idrAmount) {
      const idr = parseInt(idrAmount as string);
      const usdc = idrToUsdc(idr, rate);

      res.json({
        success: true,
        conversion: {
          from: { amount: idr, currency: "IDR", formatted: formatIdr(idr) },
          to: { amount: usdc, currency: "USDC", formatted: formatUsdc(usdc) },
          rate: rate / 100,
        },
      });
    } else {
      res.status(400).json({ error: "Provide usdcAmount or idrAmount" });
    }
  } catch (error: any) {
    console.error("[Rate] Conversion failed:", error);
    res.status(500).json({ error: "Conversion failed" });
  }
});

export default router;
