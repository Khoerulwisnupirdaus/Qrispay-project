"use client";

/**
 * QR Scanner Component
 *
 * Camera-based QR code scanner for reading merchant QRIS codes.
 * Uses html5-qrcode library for browser camera access.
 * Extracts merchant name and amount from QRIS payload.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import styles from "./QRScanner.module.css";

interface QRScannerProps {
  /** Callback when a QR code is successfully scanned */
  onScanSuccess: (data: QrisScanResult) => void;
  /** Callback to close/cancel the scanner */
  onClose: () => void;
}

export interface QrisScanResult {
  /** Raw QR code data string */
  rawData: string;
  /** Extracted merchant name (if available) */
  merchantName: string;
  /** Extracted IDR amount (if available, 0 = user enters amount) */
  idrAmount: number;
  /** Merchant ID from QRIS payload */
  merchantId: string;
}

/**
 * Parse a QRIS EMVCo QR payload to extract merchant info.
 * QRIS follows the EMVCo Merchant Presented Mode specification.
 *
 * @param data - Raw QRIS string
 * @returns Parsed QRIS result
 */
function parseQrisData(data: string): QrisScanResult {
  let merchantName = "Unknown Merchant";
  let idrAmount = 0;
  let merchantId = "";

  try {
    // QRIS uses TLV (Tag-Length-Value) format
    // Tag 59: Merchant Name
    // Tag 54: Transaction Amount
    // Tag 26-51: Merchant Account Information

    const extractTLV = (tag: string, source: string): string => {
      const tagIndex = source.indexOf(tag);
      if (tagIndex === -1) return "";
      const lengthStr = source.substring(tagIndex + tag.length, tagIndex + tag.length + 2);
      const length = parseInt(lengthStr, 10);
      if (isNaN(length)) return "";
      return source.substring(tagIndex + tag.length + 2, tagIndex + tag.length + 2 + length);
    };

    // Extract merchant name (tag 59)
    const name = extractTLV("59", data);
    if (name) merchantName = name;

    // Extract amount (tag 54)
    const amount = extractTLV("54", data);
    if (amount) idrAmount = parseInt(amount, 10) || 0;

    // Extract merchant ID from tag 26 sub-fields
    const merchantInfo = extractTLV("26", data);
    if (merchantInfo) {
      merchantId = extractTLV("01", merchantInfo) || merchantInfo.slice(0, 20);
    }
  } catch (err) {
    console.warn("Failed to parse QRIS data:", err);
  }

  return { rawData: data, merchantName, idrAmount, merchantId };
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qris-scanner-" + Date.now());

  /** Initialize camera scanner */
  const startScanner = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code detected
          console.log("[QR] Scanned:", decodedText);
          const result = parseQrisData(decodedText);
          
          // Stop scanner before callback
          scanner.stop().catch(console.error);
          setIsScanning(false);
          onScanSuccess(result);
        },
        () => {
          // QR code not detected in this frame (ignore)
        }
      );
    } catch (err: any) {
      console.error("[QR] Scanner error:", err);
      setIsScanning(false);
      setError(
        err.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access."
          : "Could not start camera. Try manual input instead."
      );
    }
  }, [onScanSuccess]);

  /** Cleanup scanner on unmount */
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  /** Handle manual QRIS input submission */
  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    const result = parseQrisData(manualInput.trim());
    onScanSuccess(result);
  };

  /** Use demo QRIS data for testing */
  const useDemoQris = () => {
    const demoData =
      "00020101021126570011ID.DANA.WWW011893600915310710271702152009150107102717020303UMI51440014ID.CO.QRIS.WWW0215ID20232784903070303UMI5204549953033605405250005802ID5913WARUNG MAKAN6007JAKARTA61051027062190515DEMO1234567890163046B5A";
    const result = parseQrisData(demoData);
    result.merchantName = "WARUNG MAKAN DEMO";
    result.idrAmount = 25000;
    onScanSuccess(result);
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.scannerCard} animate-scale-in`}>
        {/* Header */}
        <div className={styles.scannerHeader}>
          <h2>Scan QRIS Code</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close scanner">
            ✕
          </button>
        </div>

        {/* Scanner area */}
        {!manualMode ? (
          <div className={styles.scannerArea}>
            <div id={containerRef.current} className={styles.cameraView}></div>

            {!isScanning && !error && (
              <div className={styles.startPrompt}>
                <button className="btn btn-primary btn-lg" onClick={startScanner}>
                  📷 Start Camera
                </button>
              </div>
            )}

            {isScanning && (
              <div className={styles.scanGuide}>
                <div className={styles.scanFrame}>
                  <div className={styles.scanCorner} data-pos="tl"></div>
                  <div className={styles.scanCorner} data-pos="tr"></div>
                  <div className={styles.scanCorner} data-pos="bl"></div>
                  <div className={styles.scanCorner} data-pos="br"></div>
                  <div className={styles.scanLine}></div>
                </div>
                <p className={styles.scanText}>Point camera at QRIS code</p>
              </div>
            )}

            {error && (
              <div className={styles.errorBox}>
                <p>⚠️ {error}</p>
                <button className="btn btn-secondary mt-md" onClick={() => setManualMode(true)}>
                  Enter Code Manually
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Manual input mode */
          <div className={styles.manualInput}>
            <p className="text-muted mb-md">
              Paste the QRIS data string from your merchant:
            </p>
            <textarea
              className={`input ${styles.qrisTextarea}`}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="00020101021126570011..."
              rows={4}
            />
            <button
              className="btn btn-primary btn-full mt-md"
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
            >
              Submit QRIS Data
            </button>
          </div>
        )}

        {/* Bottom actions */}
        <div className={styles.bottomActions}>
          {!manualMode ? (
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setManualMode(true)}
            >
              ⌨️ Enter Manually
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setManualMode(false)}
            >
              📷 Use Camera
            </button>
          )}
          <button className="btn btn-secondary btn-full" onClick={useDemoQris}>
            🧪 Use Demo QRIS
          </button>
        </div>
      </div>
    </div>
  );
}
