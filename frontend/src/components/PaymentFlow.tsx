"use client";

/**
 * Payment Flow Component
 *
 * Multi-step payment process:
 * Step 1: Review scanned QRIS data + amount
 * Step 2: Confirm and lock USDC (simulated on-chain tx)
 * Step 3: Processing — middleware calls Xendit
 * Step 4: Receipt — payment confirmation
 */

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { QrisScanResult } from "./QRScanner";
import styles from "./PaymentFlow.module.css";

/** Middleware API base URL */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Simulated exchange rate: 1 USD = 15,800 IDR */
const EXCHANGE_RATE = 15800;

interface PaymentFlowProps {
  /** QRIS scan result from QR Scanner */
  qrisData: QrisScanResult;
  /** Callback to go back to scan screen */
  onBack: () => void;
  /** Callback when payment is fully completed */
  onComplete: () => void;
}

type PaymentStep = "review" | "confirming" | "processing" | "success" | "error";

export default function PaymentFlow({ qrisData, onBack, onComplete }: PaymentFlowProps) {
  const { publicKey } = useWallet();
  const [step, setStep] = useState<PaymentStep>("review");
  const [customAmount, setCustomAmount] = useState<string>(
    qrisData.idrAmount > 0 ? qrisData.idrAmount.toString() : ""
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [paymentId, setPaymentId] = useState("");

  /** Calculate USDC amount from IDR */
  const idrAmount = parseInt(customAmount) || 0;
  const usdcAmount = idrAmount > 0 ? (idrAmount / EXCHANGE_RATE) : 0;
  const usdcSmallestUnit = Math.round(usdcAmount * 1_000_000); // 6 decimals

  /**
   * Execute the payment flow:
   * 1. Simulate on-chain USDC lock (in devnet, we just create a fake tx)
   * 2. Call middleware to initiate QRIS payment via Xendit
   * 3. Simulate QRIS completion (sandbox mode)
   */
  const handleConfirmPayment = async () => {
    if (idrAmount <= 0) return;

    try {
      setStep("confirming");

      // Step 1: Simulate on-chain lock transaction
      // In production, this would be an actual Anchor program call
      const fakeTxSig = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      setTxSignature(fakeTxSig);

      // Small delay to simulate tx confirmation
      await new Promise((r) => setTimeout(r, 1500));

      setStep("processing");

      // Step 2: Call middleware to create QRIS payment
      const initiateRes = await fetch(`${API_URL}/api/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onChainTxId: fakeTxSig,
          userWallet: publicKey?.toBase58() || "unknown",
          usdcAmount: usdcSmallestUnit,
          idrAmount: idrAmount,
          exchangeRate: EXCHANGE_RATE * 100,
          qrisData: qrisData.rawData,
        }),
      });

      if (!initiateRes.ok) {
        throw new Error("Middleware payment initiation failed");
      }

      const initiateData = await initiateRes.json();
      setPaymentId(initiateData.paymentId);

      // Step 3: Simulate QRIS payment completion (sandbox)
      await new Promise((r) => setTimeout(r, 2000));

      const simulateRes = await fetch(`${API_URL}/api/payment/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: initiateData.paymentId }),
      });

      if (!simulateRes.ok) {
        throw new Error("Payment simulation failed");
      }

      setStep("success");
    } catch (err: any) {
      console.error("[Payment] Flow failed:", err);
      setErrorMessage(err.message || "Payment failed. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className={styles.flowContainer}>
      {/* Step: Review */}
      {step === "review" && (
        <div className={`${styles.stepCard} animate-slide-up`}>
          <div className={styles.stepHeader}>
            <button className={styles.backBtn} onClick={onBack}>
              ← Back
            </button>
            <h2>Review Payment</h2>
          </div>

          {/* Merchant Info */}
          <div className={styles.merchantCard}>
            <div className={styles.merchantIcon}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="#A9DCD3" fillOpacity="0.08" />
                <path d="M10 14h16M10 18h10M10 22h13" stroke="#A9DCD3" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="22" y="20" width="6" height="6" rx="1.5" fill="#A9DCD3" fillOpacity="0.2" stroke="#A9DCD3" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <h3 className={styles.merchantName}>{qrisData.merchantName}</h3>
              <p className="text-sm text-muted text-mono">
                {qrisData.merchantId || "QRIS Merchant"}
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className={styles.amountSection}>
            <label className={styles.amountLabel}>Payment Amount (IDR)</label>
            <div className={styles.amountInputWrapper}>
              <span className={styles.currencyPrefix}>Rp</span>
              <input
                type="number"
                className={styles.amountInput}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0"
                min="1000"
                disabled={qrisData.idrAmount > 0}
              />
            </div>

            {/* Quick amount buttons */}
            {qrisData.idrAmount === 0 && (
              <div className={styles.quickAmounts}>
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    className={styles.quickBtn}
                    onClick={() => setCustomAmount(amt.toString())}
                  >
                    {(amt / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversion Display */}
          {idrAmount > 0 && (
            <div className={styles.conversionCard}>
              <div className={styles.convRow}>
                <span className="text-muted">You Pay</span>
                <span className={styles.usdcAmount}>
                  {usdcAmount.toFixed(4)} USDC
                </span>
              </div>
              <div className={styles.convDivider}></div>
              <div className={styles.convRow}>
                <span className="text-muted">Merchant Receives</span>
                <span className={styles.idrAmount}>
                  Rp {idrAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className={styles.convRow}>
                <span className="text-muted text-xs">Rate</span>
                <span className="text-xs text-muted">
                  1 USDC = Rp {EXCHANGE_RATE.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            className="btn btn-primary btn-lg btn-full mt-lg"
            onClick={handleConfirmPayment}
            disabled={idrAmount <= 0}
          >
            🔒 Lock & Pay {usdcAmount > 0 ? `${usdcAmount.toFixed(4)} USDC` : ""}
          </button>

          <p className={`${styles.disclaimer} text-xs text-muted text-center mt-sm`}>
            Secured by Rialo on-chain escrow — near-zero fees
          </p>
        </div>
      )}

      {/* Step: Confirming (on-chain) */}
      {step === "confirming" && (
        <div className={`${styles.stepCard} ${styles.processingCard} animate-scale-in`}>
          <div className={styles.processingIcon}>
            <div className="spinner spinner-lg"></div>
          </div>
          <h2>Locking USDC</h2>
          <p className="text-muted">
            Broadcasting Reactive Transaction to Rialo Network...
          </p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "40%" }}></div>
          </div>
          <p className="text-xs text-muted text-mono mt-sm">
            Escrow PDA locking {usdcAmount.toFixed(4)} USDC • sub-second finality
          </p>
        </div>
      )}

      {/* Step: Processing (QRIS via middleware) */}
      {step === "processing" && (
        <div className={`${styles.stepCard} ${styles.processingCard} animate-scale-in`}>
          <div className={styles.processingIcon}>
            <div className={styles.qrisIcon}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="4" y="4" width="56" height="56" rx="12" stroke="#0D9488" strokeWidth="2" />
                <rect x="12" y="12" width="16" height="16" rx="4" fill="#0D9488" opacity="0.3" />
                <rect x="36" y="12" width="16" height="16" rx="4" fill="#0D9488" opacity="0.3" />
                <rect x="12" y="36" width="16" height="16" rx="4" fill="#0D9488" opacity="0.3" />
                <rect x="36" y="36" width="16" height="16" rx="2" fill="var(--primary)" opacity="0.5" />
              </svg>
            </div>
          </div>
          <h2>Processing QRIS</h2>
          <p className="text-muted">
            Settling IDR to merchant via QRIS network...
          </p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "75%" }}></div>
          </div>
          <div className={styles.processingSteps}>
            <div className={styles.pStep} data-done="true">✓ USDC locked on Rialo (sub-second)</div>
            <div className={styles.pStep} data-done="true">✓ QRIS payment initiated</div>
            <div className={styles.pStep} data-active="true">⟳ Settling to merchant...</div>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className={`${styles.stepCard} ${styles.successCard} animate-scale-in`}>
          <div className={styles.successIcon}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#059669" strokeWidth="3" />
              <path
                d="M24 40L35 51L56 30"
                stroke="#059669"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.checkmark}
              />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Payment Successful!</h2>
          <p className="text-muted">Merchant has received the payment</p>

          {/* Receipt */}
          <div className={styles.receiptCard}>
            <div className={styles.receiptRow}>
              <span>Merchant</span>
              <span>{qrisData.merchantName}</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Amount (IDR)</span>
              <span className="font-bold">Rp {idrAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Amount (USDC)</span>
              <span className="font-bold text-mono">{usdcAmount.toFixed(4)} USDC</span>
            </div>
            <div className={styles.receiptDivider}></div>
            <div className={styles.receiptRow}>
              <span>Transaction</span>
              <span className="text-mono text-xs">
                {txSignature.slice(0, 12)}...{txSignature.slice(-6)}
              </span>
            </div>
            <div className={styles.receiptRow}>
              <span>Payment ID</span>
              <span className="text-mono text-xs">
                {paymentId.slice(0, 16)}...
              </span>
            </div>
            <div className={styles.receiptRow}>
              <span>Time</span>
              <span>{new Date().toLocaleString("id-ID")}</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Network</span>
              <span className="badge badge-info">Rialo SVM</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Gas Fee</span>
              <span className="text-mono text-xs">Near-zero</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Status</span>
              <span className="badge badge-success">Confirmed</span>
            </div>
          </div>

          <button className="btn btn-primary btn-full mt-lg" onClick={onComplete}>
            Done
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === "error" && (
        <div className={`${styles.stepCard} ${styles.errorCard} animate-scale-in`}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#DC2626" strokeWidth="2.5" />
              <path d="M24 14v12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
              <circle cx="24" cy="32" r="2" fill="#DC2626" />
            </svg>
          </div>
          <h2>Payment Failed</h2>
          <p className="text-muted">{errorMessage}</p>
          <div className={styles.errorActions}>
            <button className="btn btn-primary btn-full" onClick={() => setStep("review")}>
              Try Again
            </button>
            <button className="btn btn-secondary btn-full" onClick={onBack}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
