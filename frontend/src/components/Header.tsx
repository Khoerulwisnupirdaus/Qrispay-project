"use client";

/**
 * Header Component
 *
 * App header with logo, network badge, and wallet connect button.
 * Logo is clickable — returns to home/landing.
 */

import React, { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import styles from "./Header.module.css";

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
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (onLogoClick) onLogoClick();
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Logo — clickable, returns to home */}
        <button className={styles.logo} onClick={handleLogoClick} type="button">
          <div className={styles.logoIcon}>
            <img
              src="/rialo-icon.png"
              alt="Rialo"
              width={32}
              height={32}
              style={{ borderRadius: 8 }}
            />
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
