"use client";

/**
 * Balance Display Component
 *
 * Shows $RIALO (native) and USDC balance for the user's wallet.
 * Includes faucet button to request devnet tokens.
 * Auto-refreshes every 30 seconds.
 */

import React, { useEffect, useState, useCallback } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import styles from "./BalanceDisplay.module.css";

const RPC_URL =
  process.env.NEXT_PUBLIC_RIALO_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.devnet.solana.com";

/** USDC Mint address on Devnet (placeholder — replace with Meridian mint when available) */
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

interface BalanceDisplayProps {
  walletAddress: string | null;
  compact?: boolean;
  showFaucet?: boolean;
  onBalanceChange?: (balance: number) => void;
}

export default function BalanceDisplay({
  walletAddress,
  compact = false,
  showFaucet = false,
  onBalanceChange,
}: BalanceDisplayProps) {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const pubkey = new PublicKey(walletAddress);

      // Fetch native balance ($RIALO / SOL on devnet)
      const sol = await connection.getBalance(pubkey);
      const bal = sol / LAMPORTS_PER_SOL;
      setSolBalance(bal);
      onBalanceChange?.(bal);

      // Fetch USDC balance (SPL token)
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
          mint: new PublicKey(USDC_MINT_DEVNET),
        });

        if (tokenAccounts.value.length > 0) {
          const amount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setUsdcBalance(amount);
        } else {
          setUsdcBalance(0);
        }
      } catch {
        setUsdcBalance(0);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch balances:", err);
      setLoading(false);
    }
  }, [walletAddress, onBalanceChange]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  /** Request devnet airdrop */
  const requestFaucet = async () => {
    if (!walletAddress || faucetLoading) return;
    setFaucetLoading(true);
    setFaucetMsg(null);

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const pubkey = new PublicKey(walletAddress);
      const sig = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      setFaucetMsg("1 $RIALO received!");
      // Refresh balance
      setTimeout(fetchBalances, 1000);
    } catch (err: unknown) {
      console.error("Faucet error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("429") || msg.includes("rate")) {
        setFaucetMsg("Rate limited — try again later");
      } else {
        setFaucetMsg("Faucet error — try again");
      }
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
          {solBalance !== null ? solBalance.toFixed(2) : "—"}
        </span>
        <span className={styles.compactDivider} />
        <span className={styles.compactItem}>
          <span className={styles.compactIcon}>$</span>
          {usdcBalance !== null ? usdcBalance.toFixed(2) : "—"}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.balanceCard}>
      <div className={styles.balanceRow}>
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>$RIALO</span>
          <span className={styles.balanceValue}>
            {solBalance !== null ? solBalance.toFixed(4) : "—"}
          </span>
        </div>
        <div className={styles.balanceDivider} />
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>USDC</span>
          <span className={styles.balanceValue}>
            {usdcBalance !== null ? usdcBalance.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      {showFaucet && (
        <div className={styles.faucetWrap}>
          <button
            className={styles.faucetBtn}
            onClick={requestFaucet}
            disabled={faucetLoading}
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
    </div>
  );
}
