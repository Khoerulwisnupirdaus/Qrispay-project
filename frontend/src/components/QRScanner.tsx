"use client";

/**
 * QR Scanner Component
 *
 * Camera-based QRIS scanner. Supports:
 * - Live camera scanning (auto-start)
 * - Manual paste input
 * - Demo mode for testing
 *
 * QRIS uses EMVCo TLV format. Parser handles real-world merchant codes.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import styles from "./QRScanner.module.css";

interface QRScannerProps {
  onScanSuccess: (data: QrisScanResult) => void;
  onClose: () => void;
}

export interface QrisScanResult {
  rawData: string;
  merchantName: string;
  idrAmount: number;
  merchantId: string;
}

/**
 * Proper EMVCo TLV parser for QRIS payloads.
 *
 * TLV format: [TAG 2 chars][LENGTH 2 chars][VALUE N chars]
 * Tags are parsed sequentially, not via string indexOf (which can match substrings).
 */
function parseTLV(data: string): Map<string, string> {
  const result = new Map<string, string>();
  let i = 0;

  while (i + 4 <= data.length) {
    const tag = data.substring(i, i + 2);
    const lenStr = data.substring(i + 2, i + 4);
    const len = parseInt(lenStr, 10);

    if (isNaN(len) || len < 0 || i + 4 + len > data.length) break;

    const value = data.substring(i + 4, i + 4 + len);
    result.set(tag, value);
    i += 4 + len;
  }

  return result;
}

function parseQrisData(data: string): QrisScanResult {
  let merchantName = "Merchant";
  let idrAmount = 0;
  let merchantId = "";

  try {
    const tlv = parseTLV(data);

    // Tag 59: Merchant Name
    if (tlv.has("59")) merchantName = tlv.get("59")!;

    // Tag 54: Transaction Amount
    if (tlv.has("54")) {
      const raw = tlv.get("54")!;
      idrAmount = Math.round(parseFloat(raw)) || 0;
    }

    // Tag 26-51: Merchant Account Information (try 26 first, then 51)
    for (const tag of ["26", "51", "27", "28"]) {
      if (tlv.has(tag)) {
        const sub = parseTLV(tlv.get(tag)!);
        // Sub-tag 00: globally unique identifier
        // Sub-tag 01: merchant PAN or ID
        // Sub-tag 02: merchant ID
        merchantId = sub.get("02") || sub.get("01") || sub.get("00") || tlv.get(tag)!.slice(0, 30);
        break;
      }
    }

    // Tag 58: Country Code (ID = Indonesia, confirms QRIS)
    // Tag 52: Merchant Category Code
    // Tag 53: Transaction Currency (360 = IDR)

    // If no name found, try to use city (tag 60)
    if (merchantName === "Merchant" && tlv.has("60")) {
      merchantName = `Merchant - ${tlv.get("60")}`;
    }
  } catch (err) {
    console.warn("[QRIS] Parse error:", err);
  }

  return { rawData: data, merchantName, idrAmount, merchantId };
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualInput, setManualInput] = useState("");
  const [lastScanned, setLastScanned] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef("qr-" + Date.now());
  const hasStarted = useRef(false);

  /** Start camera scanner */
  const startScanner = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    try {
      setError(null);
      await new Promise((r) => setTimeout(r, 400));

      const el = document.getElementById(containerId.current);
      if (!el) {
        hasStarted.current = false;
        setError("Scanner element not found. Try manual input.");
        return;
      }

      const scanner = new Html5Qrcode(containerId.current, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Use 80% of viewport for scan area — better for real-world QRIS stickers
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.8;
            return { width: Math.floor(size), height: Math.floor(size) };
          },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          console.log("[QR] Scanned:", decodedText.substring(0, 60) + "...");

          // Prevent duplicate scans
          if (decodedText === lastScanned) return;
          setLastScanned(decodedText);

          const result = parseQrisData(decodedText);

          // Vibrate on success (mobile feedback)
          if (navigator.vibrate) navigator.vibrate(100);

          scanner.stop().catch(console.error);
          setIsScanning(false);
          onScanSuccess(result);
        },
        () => {} // frame without QR — ignore
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("[QR] Scanner error:", err);
      hasStarted.current = false;
      setIsScanning(false);

      const msg = err.message || String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Camera access denied. Tap 'Allow' when prompted, or use manual input.");
      } else if (msg.includes("NotFound") || msg.includes("device")) {
        setError("No camera found. Use manual input to paste QRIS data.");
      } else {
        setError("Could not start camera. Try manual input instead.");
      }
    }
  }, [onScanSuccess, lastScanned]);

  /** Auto-start when in camera mode */
  useEffect(() => {
    if (mode === "camera") {
      hasStarted.current = false;
      startScanner();
    }

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      hasStarted.current = false;
    };
  }, [mode, startScanner]);

  /** Manual submit */
  const handleManualSubmit = () => {
    const text = manualInput.trim();
    if (!text) return;
    onScanSuccess(parseQrisData(text));
  };

  /** Demo QRIS for testing */
  const useDemoQris = () => {
    onScanSuccess({
      rawData: "00020101021126570011ID.DANA.WWW011893600915310710271702152009150107102717020303UMI51440014ID.CO.QRIS.WWW0215ID20232784903070303UMI5204549953033605405250005802ID5913WARUNG MAKAN6007JAKARTA61051027062190515DEMO12345678901630",
      merchantName: "WARUNG MAKAN DEMO",
      idrAmount: 25000,
      merchantId: "DEMO1234567890",
    });
  };

  return (
    <div className={styles.scannerContainer}>
      {/* Header */}
      <div className={styles.scannerHeader}>
        <button className={styles.closeBtn} onClick={onClose}>← Back</button>
        <h2>Scan QRIS</h2>
      </div>

      {/* Mode toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === "camera" ? styles.active : ""}`}
          onClick={() => setMode("camera")}
        >
          Camera
        </button>
        <button
          className={`${styles.modeBtn} ${mode === "manual" ? styles.active : ""}`}
          onClick={() => setMode("manual")}
        >
          Manual Input
        </button>
      </div>

      {/* Camera mode */}
      {mode === "camera" && (
        <>
          <div className={styles.scannerViewport}>
            <div id={containerId.current} style={{ width: "100%", height: "100%" }} />

            <div className={`${styles.cornerMarker} tl`} />
            <div className={`${styles.cornerMarker} tr`} />
            <div className={`${styles.cornerMarker} bl`} />
            <div className={`${styles.cornerMarker} br`} />

            {!isScanning && !error && (
              <div className={styles.cameraStatus}>
                <div className="spinner spinner-lg" />
                <p>Starting camera...</p>
              </div>
            )}

            {error && (
              <div className={styles.cameraStatus}>
                <p>{error}</p>
                <button className="btn btn-secondary mt-md" onClick={() => setMode("manual")}>
                  Use Manual Input
                </button>
              </div>
            )}
          </div>

          <div className={styles.demoSection}>
            <h4>No QRIS code? Use demo merchant</h4>
            <p>Simulated payment — Warung Makan Demo (Rp 25.000)</p>
            <button className={styles.demoBtn} onClick={useDemoQris}>
              Use Demo QRIS
            </button>
          </div>
        </>
      )}

      {/* Manual mode */}
      {mode === "manual" && (
        <>
          <div className={styles.manualInput}>
            <label>Paste QRIS data string from merchant:</label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="00020101021126570011..."
              rows={5}
            />
            <button
              className="btn btn-primary btn-full mt-md"
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
            >
              Submit QRIS Data
            </button>
          </div>

          <div className={styles.demoSection}>
            <h4>No QRIS code? Use demo merchant</h4>
            <p>Simulated payment — Warung Makan Demo (Rp 25.000)</p>
            <button className={styles.demoBtn} onClick={useDemoQris}>
              Use Demo QRIS
            </button>
          </div>
        </>
      )}
    </div>
  );
}
