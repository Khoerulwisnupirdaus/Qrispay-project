"use client";

/**
 * Header Component
 *
 * App header with logo, network badge, balance display, and auth controls.
 * Uses Privy for authentication state.
 */

import React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import BalanceDisplay from "./BalanceDisplay";
import styles from "./Header.module.css";

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const walletAddress = wallets?.[0]?.address || null;

  /** Truncate wallet address for display */
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  /** Get user display name */
  const displayName = user?.google?.name
    || user?.email?.address?.split("@")[0]
    || shortAddress
    || "User";

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

          {authenticated && walletAddress && (
            <BalanceDisplay walletAddress={walletAddress} compact />
          )}

          {authenticated ? (
            <button className={styles.userBtn} onClick={logout} title="Logout">
              <span className={styles.userAvatar}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className={styles.userName}>{displayName}</span>
            </button>
          ) : (
            <button className={styles.loginBtn} onClick={login}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
