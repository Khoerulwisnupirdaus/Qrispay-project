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
              {/* Rialo abstract R mark — organic tubes with rounded ends */}
              <path
                d="M9 10.5C9 9.67 9.67 9 10.5 9H15C17.76 9 20 11.24 20 14C20 15.86 18.97 17.47 17.44 18.27L20.5 23H18L15.1 18.5H12V23H10V11H10.5C9.67 11 9 10.67 9 10.5ZM12 16.5H15C16.66 16.5 18 15.16 18 14C18 12.34 16.66 11 15 11H12V16.5Z"
                fill="white"
                opacity="0.95"
              />
              {/* Accent dot */}
              <circle cx="22.5" cy="10" r="1.8" fill="white" opacity="0.5" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#7C3AED" />
                  <stop offset="1" stopColor="#A78BFA" />
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
