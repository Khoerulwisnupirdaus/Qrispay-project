"use client";

/**
 * Header Component
 *
 * App header with logo, network badge, balance display, and auth controls.
 * User button opens a dropdown with profile + balance + logout.
 */

import React, { useState, useRef, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import BalanceDisplay from "./BalanceDisplay";
import styles from "./Header.module.css";

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { authenticated, user, login, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /** Find Solana wallet — multiple fallback strategies */
  // Debug: log all wallets to help troubleshoot
  if (authenticated && wallets?.length) {
    console.log("[Rialo] All wallets:", wallets.map((w: any) => ({ address: w.address, chainType: w.chainType, chain: w.chain, type: w.walletClientType })));
  }
  if (authenticated && user?.linkedAccounts) {
    console.log("[Rialo] Linked accounts:", user.linkedAccounts.filter((a: any) => a.type === "wallet").map((a: any) => ({ address: a.address, chainType: a.chainType, chain: a.chain, type: a.walletClientType })));
  }

  // Strategy 1: from useWallets hook — Solana addresses are base58 (no 0x prefix)
  const solanaWallet = wallets?.find((w: any) => w.chainType === "solana" || (w.address && !w.address.startsWith("0x")));
  // Strategy 2: from linkedAccounts — find non-EVM address
  const linkedSolana = user?.linkedAccounts?.find(
    (a: any) => a.type === "wallet" && a.address && !a.address.startsWith("0x")
  ) as any;
  
  const walletAddress = solanaWallet?.address || linkedSolana?.address || null;

  /** Truncate wallet address for display */
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  /** Get user display name */
  const displayName = user?.google?.name
    || user?.email?.address?.split("@")[0]
    || shortAddress
    || "User";

  /** Get user email */
  const userEmail = user?.google?.email || user?.email?.address || null;

  const handleLogoClick = () => {
    if (onLogoClick) onLogoClick();
  };

  /** Copy wallet address to clipboard */
  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
    }
  };

  /** Close menu on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          {authenticated ? (
            <div className={styles.userWrap} ref={menuRef}>
              <button
                className={styles.userBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                type="button"
              >
                <span className={styles.userAvatar}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className={styles.userName}>{displayName}</span>
                <svg className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  {/* Profile section */}
                  <div className={styles.dropdownProfile}>
                    <span className={styles.dropdownAvatar}>
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className={styles.dropdownName}>{displayName}</p>
                      {userEmail && (
                        <p className={styles.dropdownEmail}>{userEmail}</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.dropdownDivider} />

                  {/* Wallet address */}
                  {walletAddress ? (
                    <button className={styles.dropdownItem} onClick={copyAddress} type="button">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M10 4V3a2 2 0 00-2-2H3a2 2 0 00-2 2v5a2 2 0 002 2h1" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      <span className={styles.walletAddrWrap}>
                        <span className={styles.walletAddrTag}>Solana · Privy</span>
                        <span>{shortAddress}</span>
                      </span>
                      <span className={styles.dropdownHint}>Copy</span>
                    </button>
                  ) : (
                    <div className={styles.dropdownItem}>
                      <span className={styles.walletCreating}>
                        <span className={styles.walletSpinner} />
                        Setting up wallet...
                      </span>
                    </div>
                  )}

                  <div className={styles.dropdownDivider} />

                  {/* Balance */}
                  {walletAddress && (
                    <div className={styles.dropdownBalance}>
                      <BalanceDisplay walletAddress={walletAddress} showFaucet={true} userEmail={userEmail} />
                    </div>
                  )}

                  <div className={styles.dropdownDivider} />

                  {/* Logout */}
                  <button className={styles.dropdownLogout} onClick={() => { logout(); setMenuOpen(false); }} type="button">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 1H3a2 2 0 00-2 2v8a2 2 0 002 2h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
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
