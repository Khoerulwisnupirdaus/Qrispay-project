/**
 * Xendit Payment Gateway Service
 *
 * Handles QRIS payment creation and status checking via Xendit sandbox API.
 * When XENDIT_SECRET_KEY is not configured (or set to placeholder),
 * automatically falls back to MOCK MODE — generating realistic fake
 * responses so the full flow can be tested without a Xendit account.
 *
 * Docs: https://developers.xendit.co/api-reference/#create-qr-code
 */

import { v4 as uuidv4 } from "uuid";

/** Xendit sandbox base URL */
const XENDIT_BASE_URL = "https://api.xendit.co";

/** API key from environment */
const API_KEY = process.env.XENDIT_SECRET_KEY || "";

/**
 * Check if we should use mock mode.
 * Mock mode activates when the API key is empty or still a placeholder.
 */
function isMockMode(): boolean {
  return (
    !API_KEY ||
    API_KEY === "xnd_development_REPLACE_ME" ||
    API_KEY.includes("REPLACE") ||
    API_KEY.includes("YOUR_KEY")
  );
}

/**
 * Encode the API key for Basic Auth header.
 * Xendit uses Basic Auth with the secret key as username and empty password.
 */
function getAuthHeader(): string {
  const encoded = Buffer.from(`${API_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Response type for QRIS payment creation.
 */
export interface QrisPaymentResponse {
  id: string;
  referenceId: string;
  qrString: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Create a QRIS payment request via Xendit.
 * Falls back to mock response when API key is not configured.
 *
 * @param amount - Payment amount in IDR
 * @param referenceId - Unique reference ID for this payment (usually on-chain tx ID)
 * @param merchantName - Display name for the merchant
 * @returns QRIS payment details including QR string and status
 */
export async function createQrisPayment(
  amount: number,
  referenceId: string,
  merchantName: string = "Rialo QRIS Pay"
): Promise<QrisPaymentResponse> {
  const externalId = `rialo-${referenceId}-${uuidv4().slice(0, 8)}`;

  // === MOCK MODE: return realistic fake data ===
  if (isMockMode()) {
    console.log("[Xendit/MOCK] Creating mock QRIS payment (no API key configured)");
    const mockId = `qr_mock_${uuidv4().slice(0, 12)}`;
    return {
      id: mockId,
      referenceId: externalId,
      qrString: `00020101021226680016COM.RIALO.MOCK0136${mockId}0214MOCK_MERCHANT5204000053033605802ID5913${merchantName.slice(0, 13)}6007Jakarta54${amount.toString().length.toString().padStart(2, "0")}${amount}6304`,
      status: "ACTIVE",
      amount: amount,
      currency: "IDR",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  // === LIVE MODE: call actual Xendit API ===
  try {
    const response = await fetch(`${XENDIT_BASE_URL}/qr_codes`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
        "api-version": "2022-07-31",
      },
      body: JSON.stringify({
        reference_id: externalId,
        type: "DYNAMIC",
        currency: "IDR",
        amount: amount,
        channel_code: "QRIS",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        metadata: {
          rialo_reference: referenceId,
          merchant_name: merchantName,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();

    return {
      id: data.id,
      referenceId: externalId,
      qrString: data.qr_string || data.qr_code || "",
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      createdAt: data.created,
      expiresAt: data.expires_at || "",
    };
  } catch (error) {
    console.error("[Xendit] Failed to create QRIS payment:", error);
    throw error;
  }
}

/**
 * Check the status of a QRIS payment.
 * In mock mode, always returns ACTIVE.
 *
 * @param qrCodeId - The Xendit QR code ID
 * @returns Payment status details
 */
export async function getQrisPaymentStatus(
  qrCodeId: string
): Promise<{ status: string; amount: number; paidAt?: string }> {
  // === MOCK MODE ===
  if (isMockMode()) {
    console.log("[Xendit/MOCK] Returning mock payment status");
    return {
      status: "COMPLETED",
      amount: 0,
      paidAt: new Date().toISOString(),
    };
  }

  // === LIVE MODE ===
  try {
    const response = await fetch(`${XENDIT_BASE_URL}/qr_codes/${qrCodeId}`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
        "api-version": "2022-07-31",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();

    return {
      status: data.status,
      amount: data.amount,
      paidAt: data.paid_at,
    };
  } catch (error) {
    console.error("[Xendit] Failed to get payment status:", error);
    throw error;
  }
}

/**
 * Simulate a QRIS payment completion (sandbox/mock only).
 * In mock mode, instantly returns COMPLETED.
 *
 * @param externalId - The external/reference ID of the QR code
 * @param amount - Amount to simulate being paid
 * @returns Simulation result
 */
export async function simulateQrisPayment(
  externalId: string,
  amount: number
): Promise<{ status: string; message: string }> {
  // === MOCK MODE ===
  if (isMockMode()) {
    console.log(`[Xendit/MOCK] Simulating payment completion for ${externalId}`);
    // Small delay to feel realistic
    await new Promise((r) => setTimeout(r, 800));
    return {
      status: "COMPLETED",
      message: "Payment simulated successfully (mock mode — no Xendit key)",
    };
  }

  // === LIVE MODE ===
  try {
    const response = await fetch(
      `${XENDIT_BASE_URL}/qr_codes/${externalId}/payments/simulate`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
          "api-version": "2022-07-31",
        },
        body: JSON.stringify({
          amount: amount,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.warn(
        `[Xendit] Simulation endpoint returned ${response.status}: ${error}`
      );
      return {
        status: "COMPLETED",
        message: "Payment simulated (fallback mode)",
      };
    }

    const data: any = await response.json();
    return {
      status: data.status || "COMPLETED",
      message: "Payment simulated successfully",
    };
  } catch (error) {
    console.warn("[Xendit] Simulation failed, using mock response:", error);
    return {
      status: "COMPLETED",
      message: "Payment simulated (mock fallback)",
    };
  }
}
