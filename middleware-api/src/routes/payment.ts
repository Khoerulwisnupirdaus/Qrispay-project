/**
 * Payment Routes
 *
 * Handles the payment lifecycle:
 * - POST /api/payment/initiate  — Start a QRIS payment after on-chain lock
 * - POST /api/payment/webhook   — Xendit payment callback
 * - POST /api/payment/simulate  — Simulate QRIS payment (sandbox only)
 * - GET  /api/payment/:id/status — Check payment status
 */

import { Router, Request, Response } from "express";
import {
  createQrisPayment,
  getQrisPaymentStatus,
  simulateQrisPayment,
} from "../services/xendit";
import { formatIdr, formatUsdc } from "../utils/converter";

const router = Router();

/**
 * In-memory payment store for MVP.
 * In production, this would be a database (PostgreSQL/MongoDB).
 */
interface PaymentRecord {
  id: string;
  onChainTxId: string;
  userWallet: string;
  usdcAmount: number;
  idrAmount: number;
  exchangeRate: number;
  qrisData: string;
  xenditQrId: string;
  xenditRefId: string;
  status: "pending" | "locked" | "qris_created" | "paid" | "confirmed" | "failed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const paymentStore = new Map<string, PaymentRecord>();

/**
 * POST /api/payment/initiate
 *
 * Called by the frontend after the user locks USDC on-chain.
 * Creates a QRIS payment via Xendit for the merchant to receive IDR.
 *
 * Body: { onChainTxId, userWallet, usdcAmount, idrAmount, exchangeRate, qrisData }
 */
router.post("/initiate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { onChainTxId, userWallet, usdcAmount, idrAmount, exchangeRate, qrisData } = req.body;

    // Validate required fields
    if (!onChainTxId || !userWallet || !usdcAmount || !idrAmount) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    console.log(`[Payment] Initiating payment for ${formatUsdc(usdcAmount)} USDC → ${formatIdr(idrAmount)}`);

    // Create QRIS payment via Xendit
    const qrisPayment = await createQrisPayment(idrAmount, onChainTxId);

    // Store payment record
    const paymentId = qrisPayment.referenceId;
    const record: PaymentRecord = {
      id: paymentId,
      onChainTxId,
      userWallet,
      usdcAmount,
      idrAmount,
      exchangeRate,
      qrisData: qrisData || "",
      xenditQrId: qrisPayment.id,
      xenditRefId: qrisPayment.referenceId,
      status: "qris_created",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    paymentStore.set(paymentId, record);

    console.log(`[Payment] QRIS created: ${paymentId} | Xendit ID: ${qrisPayment.id}`);

    res.json({
      success: true,
      paymentId,
      qrisPayment: {
        id: qrisPayment.id,
        qrString: qrisPayment.qrString,
        amount: qrisPayment.amount,
        expiresAt: qrisPayment.expiresAt,
      },
      display: {
        usdcFormatted: formatUsdc(usdcAmount),
        idrFormatted: formatIdr(idrAmount),
      },
    });
  } catch (error: any) {
    console.error("[Payment] Initiation failed:", error);
    res.status(500).json({ error: "Failed to create QRIS payment", details: error.message });
  }
});

/**
 * POST /api/payment/webhook
 *
 * Xendit sends payment status updates to this endpoint.
 * When QRIS is scanned and paid, this confirms the on-chain payment.
 */
router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data } = req.body;

    // Verify webhook token (basic security)
    const webhookToken = req.headers["x-callback-token"];
    if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.warn("[Webhook] Invalid webhook token received");
      res.status(401).json({ error: "Invalid webhook token" });
      return;
    }

    console.log(`[Webhook] Received event: ${event}`);

    if (event === "qr.payment" && data?.status === "COMPLETED") {
      const referenceId = data.qr_code?.reference_id || data.reference_id;

      // Find matching payment
      const payment = paymentStore.get(referenceId);
      if (payment) {
        payment.status = "paid";
        payment.updatedAt = new Date();
        paymentStore.set(referenceId, payment);

        console.log(`[Webhook] Payment ${referenceId} marked as paid`);

        // TODO: In production, confirm on-chain payment here
        // This would call the smart contract's confirm_payment instruction
        // using the middleware wallet's keypair
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Webhook] Processing failed:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * POST /api/payment/simulate
 *
 * Simulate a QRIS payment being completed (sandbox/dev only).
 * This bypasses actual QRIS scanning for testing.
 *
 * Body: { paymentId }
 */
router.post("/simulate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      res.status(400).json({ error: "paymentId is required" });
      return;
    }

    const payment = paymentStore.get(paymentId);
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    console.log(`[Simulate] Simulating QRIS payment for ${paymentId}`);

    // Simulate via Xendit sandbox
    const result = await simulateQrisPayment(payment.xenditQrId, payment.idrAmount);

    // Update payment status
    payment.status = "paid";
    payment.updatedAt = new Date();
    paymentStore.set(paymentId, payment);

    console.log(`[Simulate] Payment ${paymentId} simulated: ${result.status}`);

    res.json({
      success: true,
      status: result.status,
      message: result.message,
      payment: {
        id: paymentId,
        status: payment.status,
        idrAmount: formatIdr(payment.idrAmount),
        usdcAmount: formatUsdc(payment.usdcAmount),
      },
    });
  } catch (error: any) {
    console.error("[Simulate] Failed:", error);
    res.status(500).json({ error: "Simulation failed", details: error.message });
  }
});

/**
 * GET /api/payment/:id/status
 *
 * Check the current status of a payment.
 */
router.get("/:id/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payment = paymentStore.get(id);
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // Also check Xendit status for live updates
    let xenditStatus = null;
    if (payment.xenditQrId) {
      try {
        xenditStatus = await getQrisPaymentStatus(payment.xenditQrId);
      } catch {
        // Xendit might not respond in sandbox mode
      }
    }

    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        onChainTxId: payment.onChainTxId,
        userWallet: payment.userWallet,
        usdcAmount: payment.usdcAmount,
        idrAmount: payment.idrAmount,
        usdcFormatted: formatUsdc(payment.usdcAmount),
        idrFormatted: formatIdr(payment.idrAmount),
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      xenditStatus,
    });
  } catch (error: any) {
    console.error("[Status] Check failed:", error);
    res.status(500).json({ error: "Status check failed" });
  }
});

export default router;
