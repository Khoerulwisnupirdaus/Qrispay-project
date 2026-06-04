"use client";

/**
 * Header Component
 *
 * App header with logo, network badge, and wallet connect button.
 * Logo is clickable — returns to home/landing.
 */

import React, { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import dynamic from "next/dynamic";
import styles from "./Header.module.css";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

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
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  const handleLogoClick = () => {
    if (onLogoClick) onLogoClick();
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Logo — clickable, returns to home */}
        <button className={styles.logo} onClick={handleLogoClick} type="button">
          <div className={styles.logoIcon}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="17" fill="#000102" />
              <circle cx="17" cy="17" r="12" stroke="#A9DCD3" strokeWidth="2" fill="none" />
              <line x1="17" y1="5" x2="17" y2="29" stroke="#A9DCD3" strokeWidth="1" opacity="0.35" />
              <line x1="5" y1="17" x2="29" y2="17" stroke="#A9DCD3" strokeWidth="1" opacity="0.35" />
              <ellipse cx="17" cy="17" rx="6" ry="12" stroke="#A9DCD3" strokeWidth="1" opacity="0.35" />
              <line x1="22" y1="22" x2="30" y2="30" stroke="#A9DCD3" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className={styles.logoTitle}>Rialo</h1>
            <p className={styles.logoSub}>QRIS Pay</p>
          </div>
        </button>

        {/* Right side */}
        <div className={styles.headerRight}>
          <div className={styles.networkBadge}>
            <span className={styles.networkDot} />
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
