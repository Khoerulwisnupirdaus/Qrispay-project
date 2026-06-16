"use client";

/**
 * Balance Display Component
 *
 * Shows $RIALO and USDC balance for the user's Rialo wallet.
 * Connects to Rialo devnet via playground API proxy.
 * If user already has a playground account, prompts for password.
 */

import React, { useEffect, useState, useCallback } from "react";
import { generatePassword } from "@/lib/rialo-playground";
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
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Password prompt state
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pgPassword, setPgPassword] = useState("");
  const [pgError, setPgError] = useState<string | null>(null);
  const [pgLoading, setPgLoading] = useState(false);

  // Store password for faucet calls
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  // Password to show for newly created accounts
  const [newAccountPw, setNewAccountPw] = useState<string | null>(null);
  // Show/hide password toggle
  const [showPw, setShowPw] = useState(false);
  // Show/hide for password input
  const [showPgInput, setShowPgInput] = useState(false);

  // Load saved password from localStorage on mount
  useEffect(() => {
    if (walletAddress) {
      const stored = localStorage.getItem(`rialo_pw_${walletAddress}`);
      if (stored) {
        setNewAccountPw(stored);
        setSavedPassword(stored);
      }
    }
  }, [walletAddress]);

  /** Connect to Rialo devnet */
  const connectRialo = useCallback(async (password?: string) => {
    try {
      const res = await fetch("/api/rialo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          email: userEmail,
          playgroundPassword: password || undefined,
        }),
      });

      const data = await res.json();

      if (data.needsPassword) {
        setNeedsPassword(true);
        setLoading(false);
        return;
      }

      if (data.success && data.rialoAddress) {
        setRialoAddress(data.rialoAddress);
        setRialoBalance(data.balance ?? 0);
        setNeedsPassword(false);
        if (password) setSavedPassword(password);
        if (data.isNewAccount && data.playgroundPassword) {
          setNewAccountPw(data.playgroundPassword);
          // Persist to localStorage
          if (walletAddress) {
            localStorage.setItem(`rialo_pw_${walletAddress}`, data.playgroundPassword);
          }
        }
        onBalanceChange?.(data.balance ?? 0);
      } else if (data.error) {
        setPgError(data.error);
      }
    } catch (err) {
      console.error("[Rialo] Connect error:", err);
    } finally {
      setLoading(false);
      setPgLoading(false);
    }
  }, [walletAddress, userEmail, onBalanceChange]);

  /** Auto-connect on mount */
  useEffect(() => {
    if (walletAddress && !rialoAddress && !needsPassword) {
      connectRialo();
    }
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Submit playground password */
  const handlePasswordSubmit = async () => {
    if (!pgPassword.trim()) return;
    setPgLoading(true);
    setPgError(null);
    await connectRialo(pgPassword);
  };

  /** Skip password — use separate QRIS Pay account */
  const handleSkip = async () => {
    setNeedsPassword(false);
    setPgLoading(true);
    // Connect without email to force deterministic account
    try {
      const res = await fetch("/api/rialo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json();
      if (data.success && data.rialoAddress) {
        setRialoAddress(data.rialoAddress);
        setRialoBalance(data.balance ?? 0);
        onBalanceChange?.(data.balance ?? 0);
      }
    } catch (err) {
      console.error("[Rialo] Skip connect error:", err);
    } finally {
      setPgLoading(false);
    }
  };

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
        body: JSON.stringify({
          walletAddress,
          email: userEmail,
          playgroundPassword: savedPassword || undefined,
        }),
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

  if (!walletAddress) return null;
  if (loading) return null;

  // Password prompt UI
  if (needsPassword && !rialoAddress) {
    return (
      <div className={styles.balanceCard}>
        <div className={styles.pgPrompt}>
          <span className={styles.pgNote}>
            You already have a Rialo Playground account. Enter your playground password to use the same address.
          </span>
          <div className={styles.pgInputWrap}>
            <input
              className={styles.pgInput}
              type={showPgInput ? "text" : "password"}
              placeholder="Playground password"
              value={pgPassword}
              onChange={(e) => setPgPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            <button
              type="button"
              className={styles.pgToggleBtn}
              onClick={() => setShowPgInput(!showPgInput)}
              title={showPgInput ? "Hide password" : "Show password"}
            >
              {showPgInput ? "🙈" : "👁️"}
            </button>
          </div>
          {pgError && <span className={styles.pgError}>{pgError}</span>}
          <div className={styles.pgActions}>
            <button
              className={styles.pgSubmitBtn}
              onClick={handlePasswordSubmit}
              disabled={pgLoading || !pgPassword.trim()}
              type="button"
            >
              {pgLoading ? "Connecting..." : "Connect"}
            </button>
            <button
              className={styles.pgSkipBtn}
              onClick={handleSkip}
              disabled={pgLoading}
              type="button"
            >
              Skip (new address)
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      {rialoAddress && (
        <button className={styles.rialoAddr} onClick={copyRialoAddress} type="button">
          <span className={styles.rialoAddrLabel}>Rialo Devnet</span>
          <span className={styles.rialoAddrValue}>
            {rialoAddress.slice(0, 6)}...{rialoAddress.slice(-4)}
          </span>
          <span className={styles.rialoAddrCopy}>{copied ? "Copied!" : "Copy"}</span>
        </button>
      )}

      <div className={styles.balanceHeader}>
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
        <button
          className={`${styles.refreshBtn} ${refreshing ? styles.refreshSpin : ""}`}
          onClick={async () => {
            if (refreshing) return;
            setRefreshing(true);
            await connectRialo(savedPassword || undefined);
            setRefreshing(false);
          }}
          disabled={refreshing}
          type="button"
          title="Refresh balance"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 7a5.5 5.5 0 019.37-3.9M12.5 7a5.5 5.5 0 01-9.37 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M11.5 1v2.5H9M2.5 13v-2.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
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
            {faucetLoading ? "Requesting..." : "Get $RIALO"}
          </button>
          {faucetMsg && (
            <span className={`${styles.faucetMsg} ${faucetMsg.includes("received") ? styles.faucetSuccess : styles.faucetError}`}>
              {faucetMsg}
            </span>
          )}
        </div>
      )}

      {rialoAddress && !compact && (
        <div className={styles.pgNewNote}>
          <span>Playground account credentials:</span>
          <span>Login at <strong>playground.rialo.io</strong> with:</span>
          <div className={styles.pgPwRow}>
            <code className={styles.pgNewPw}>
              {showPw ? (newAccountPw || savedPassword || generatePassword(walletAddress)) : "••••••••••••"}
            </code>
            <button
              type="button"
              className={styles.pgToggleBtn}
              onClick={() => setShowPw(!showPw)}
              title={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
