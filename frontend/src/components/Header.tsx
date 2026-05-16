"use client";

/**
 * Header Component
 *
 * App header with logo, network badge, and wallet connect button.
 * Shows connected wallet address and balance.
 */

import React from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  /** Fetch SOL balance when wallet connects */
  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
              <path
                d="M8 12L16 8L24 12V20L16 24L8 20V12Z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M16 8V24M8 12L24 20M24 12L8 20"
                stroke="white"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#6C5CE7" />
                  <stop offset="1" stopColor="#00CEC9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className={styles.logoTitle}>Rialo</h1>
            <p className={styles.logoSub}>QRIS Pay</p>
          </div>
        </div>

        {/* Right side: network + wallet */}
        <div className={styles.headerRight}>
          <div className={styles.networkBadge}>
            <span className={styles.networkDot}></span>
            Rialo SVM
          </div>

          {connected && balance !== null && (
            <div className={styles.balance}>
              {balance.toFixed(2)} SOL
            </div>
          )}

          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
