"use client";

/**
 * Balance Display Component
 *
 * Shows $RIALO and USDC balance for the user's Rialo wallet.
 * Connects to Rialo devnet via playground API proxy.
 * Uses the user's real email so the Rialo address matches their playground account.
 * Includes faucet button to request real devnet $RIALO tokens.
 */

import React, { useEffect, useState, useCallback } from "react";
import styles from "./BalanceDisplay.module.css";

interface BalanceDisplayProps {
  walletAddress: string | null;
  userEmail?: string | null;
  compact?: boolean;
  showFaucet?: boolean;
  onBalanceChange?: (balance: number) => void;
}

export default function BalanceDisplay({
  walletAddress,
  userEmail,
  compact = false,
  showFaucet = false,
  onBalanceChange,
}: BalanceDisplayProps) {
  const [rialoBalance, setRialoBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [rialoAddress, setRialoAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /** Connect to Rialo devnet */
  const connectRialo = useCallback(async () => {
    if (!walletAddress || connecting) return;
    setConnecting(true);

    try {
      const res = await fetch("/api/rialo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, email: userEmail }),
      });

      const data = await res.json();
      if (data.success && data.rialoAddress) {
        setRialoAddress(data.rialoAddress);
        setRialoBalance(data.balance ?? 0);
        onBalanceChange?.(data.balance ?? 0);
      } else {
        console.error("[Rialo] Connect failed:", data.error);
      }
    } catch (err) {
      console.error("[Rialo] Connect error:", err);
    } finally {
      setConnecting(false);
      setLoading(false);
    }
  }, [walletAddress, userEmail, connecting, onBalanceChange]);

  useEffect(() => {
    if (walletAddress && !rialoAddress) {
      connectRialo();
    }
  }, [walletAddress, rialoAddress, connectRialo]);

  /** Copy Rialo address */
  const copyRialoAddress = () => {
    if (rialoAddress) {
      navigator.clipboard.writeText(rialoAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /** Request devnet $RIALO */
  const requestFaucet = async () => {
    if (!walletAddress || faucetLoading) return;
    setFaucetLoading(true);
    setFaucetMsg(null);

    try {
      const res = await fetch("/api/rialo/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, email: userEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setFaucetMsg(`${data.amount} $RIALO received!`);
        if (rialoBalance !== null) {
          const newBal = rialoBalance + parseFloat(data.amount || "1");
          setRialoBalance(newBal);
          onBalanceChange?.(newBal);
        }
      } else {
        setFaucetMsg(data.error || "Faucet error — try again");
      }
    } catch (err) {
      console.error("[Rialo] Faucet error:", err);
      setFaucetMsg("Network error — try again");
    } finally {
      setFaucetLoading(false);
      setTimeout(() => setFaucetMsg(null), 4000);
    }
  };

  if (!walletAddress || loading) return null;

  if (compact) {
    return (
      <div className={styles.compactWrap}>
        <span className={styles.compactItem}>
          <span className={styles.compactIcon}>◎</span>
          {rialoBalance !== null ? rialoBalance.toFixed(2) : "—"}
        </span>
        <span className={styles.compactDivider} />
        <span className={styles.compactItem}>
          <span className={styles.compactIcon}>$</span>
          {usdcBalance.toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.balanceCard}>
      {/* Rialo devnet address with copy button */}
      {rialoAddress && (
        <button className={styles.rialoAddr} onClick={copyRialoAddress} type="button">
          <span className={styles.rialoAddrLabel}>Rialo Devnet</span>
          <span className={styles.rialoAddrValue}>
            {rialoAddress.slice(0, 6)}...{rialoAddress.slice(-4)}
          </span>
          <span className={styles.rialoAddrCopy}>{copied ? "Copied!" : "Copy"}</span>
        </button>
      )}

      <div className={styles.balanceRow}>
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>$RIALO</span>
          <span className={styles.balanceValue}>
            {rialoBalance !== null ? rialoBalance.toFixed(4) : "—"}
          </span>
        </div>
        <div className={styles.balanceDivider} />
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>USDC</span>
          <span className={styles.balanceValue}>
            {usdcBalance.toFixed(2)}
          </span>
        </div>
      </div>

      {showFaucet && (
        <div className={styles.faucetWrap}>
          <button
            className={styles.faucetBtn}
            onClick={requestFaucet}
            disabled={faucetLoading || !rialoAddress}
            type="button"
          >
            {faucetLoading ? (
              <span className={styles.faucetSpinner} />
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {faucetLoading ? "Requesting..." : connecting ? "Connecting..." : "Get $RIALO"}
          </button>
          {faucetMsg && (
            <span className={`${styles.faucetMsg} ${faucetMsg.includes("received") ? styles.faucetSuccess : styles.faucetError}`}>
              {faucetMsg}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
