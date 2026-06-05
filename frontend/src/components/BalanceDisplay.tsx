"use client";

/**
 * Balance Display Component
 *
 * Shows SOL and USDC balance for the user's wallet.
 * Auto-refreshes every 30 seconds.
 */

import React, { useEffect, useState, useCallback } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import styles from "./BalanceDisplay.module.css";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

/** USDC Mint address on Devnet (use mainnet address for production) */
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

interface BalanceDisplayProps {
  walletAddress: string | null;
  compact?: boolean;
}

export default function BalanceDisplay({ walletAddress, compact = false }: BalanceDisplayProps) {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const pubkey = new PublicKey(walletAddress);

      // Fetch SOL balance
      const sol = await connection.getBalance(pubkey);
      setSolBalance(sol / LAMPORTS_PER_SOL);

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
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

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
          <span className={styles.balanceLabel}>SOL</span>
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
    </div>
  );
}
