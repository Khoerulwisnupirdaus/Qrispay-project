"use client";

/**
 * Home Page — Rialo QRIS Pay
 *
 * Tria-inspired landing with bold colored feature cards,
 * clean stats bar, and premium neofinance aesthetic.
 */

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Header from "@/components/Header";
import QRScanner, { QrisScanResult } from "@/components/QRScanner";
import PaymentFlow from "@/components/PaymentFlow";
import styles from "./page.module.css";

type AppState = "idle" | "scanning" | "payment";

export default function HomePage() {
  const { connected } = useWallet();
  const [appState, setAppState] = useState<AppState>("idle");
  const [scanResult, setScanResult] = useState<QrisScanResult | null>(null);

  const handleScanSuccess = (result: QrisScanResult) => {
    setScanResult(result);
    setAppState("payment");
  };

  const handleReset = () => {
    setScanResult(null);
    setAppState("idle");
  };

  return (
    <div className={styles.app}>
      <Header />

      <main className={styles.main}>
        {/* ============ DISCONNECTED — Landing ============ */}
        {!connected && (
          <div className={`${styles.landing} animate-fade-in`}>
            {/* Hero */}
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}>
                Your crypto should do{"\n"}
                <span className={styles.gradientText}>more than sit in a wallet</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Pay any merchant in Indonesia with USDC — settled instantly
                via QRIS on Rialo Network. Zero gas. 50ms finality.
              </p>

              <div className={styles.heroActions}>
                <WalletMultiButton />
              </div>

              <p className={styles.heroNote}>
                Connect your wallet to start paying — powered by Rialo Network
              </p>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>50ms</div>
                <div className={styles.statLabel}>Finality</div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>$0</div>
                <div className={styles.statLabel}>Gas Fees</div>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>40M+</div>
                <div className={styles.statLabel}>Merchants</div>
              </div>
            </div>

            {/* Feature Cards — Tria-style */}
            <div className={styles.featuresGrid}>
              {/* QRIS Pay — Main feature, full width */}
              <div className={`${styles.featureCard} ${styles.fullWidth} dark`}>
                <span className={styles.featureTag}>QRIS Pay</span>
                <h3>Scan. Pay. Done.</h3>
                <p>
                  Point your camera at any QRIS code in Indonesia. Your USDC
                  converts to IDR and settles in real-time — no middlemen,
                  no delays.
                </p>
              </div>

              {/* Zero Gas */}
              <div className={`${styles.featureCard} violet`}>
                <span className={styles.featureEmoji}>⚡</span>
                <span className={styles.featureTag}>Rialo Cruise</span>
                <h3>Zero Gas Fees</h3>
                <p>
                  Gasless transactions on Rialo Network. Every payment is free.
                </p>
              </div>

              {/* Instant Settlement */}
              <div className={`${styles.featureCard} teal`}>
                <span className={styles.featureEmoji}>🔄</span>
                <span className={styles.featureTag}>Settlement</span>
                <h3>50ms Finality</h3>
                <p>
                  Rialo&apos;s SVM processes your payment in milliseconds.
                </p>
              </div>

              {/* Cross-Chain */}
              <div className={`${styles.featureCard} lime`}>
                <span className={styles.featureEmoji}>🌐</span>
                <span className={styles.featureTag}>Cross-Chain</span>
                <h3>Multi-Chain Ready</h3>
                <p>
                  Built on SVM — compatible with Solana ecosystem. Bridge from
                  any chain.
                </p>
              </div>

              {/* Security */}
              <div className={`${styles.featureCard} white`}>
                <span className={styles.featureEmoji}>🔒</span>
                <span className={styles.featureTag}>Security</span>
                <h3>On-Chain Escrow</h3>
                <p>
                  Smart contract locks funds until QRIS settlement confirms.
                  Trustless and auditable.
                </p>
              </div>
            </div>

            {/* How it Works */}
            <div className={styles.howItWorks}>
              <h2 className={styles.sectionTitle}>How It Works</h2>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div>
                    <h4>Connect Wallet</h4>
                    <p>Link your Rialo wallet — Phantom, Backpack, or any Solana wallet</p>
                  </div>
                </div>
                <div className={styles.stepLine}></div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div>
                    <h4>Scan QRIS</h4>
                    <p>Point your camera at any merchant&apos;s QRIS code across Indonesia</p>
                  </div>
                </div>
                <div className={styles.stepLine}></div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div>
                    <h4>Confirm &amp; Pay</h4>
                    <p>USDC converts to IDR and settles on-chain in 50ms — gasless</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Built on */}
            <div className={styles.trustedBar}>
              <span className={styles.trustedLabel}>Built on</span>
              <div className={styles.trustedLogos}>
                <span className={styles.trustedLogo}>RIALO</span>
                <span className={styles.trustedLogo}>SUBZERO LABS</span>
                <span className={styles.trustedLogo}>SVM</span>
                <span className={styles.trustedLogo}>QRIS</span>
              </div>
            </div>
          </div>
        )}

        {/* ============ CONNECTED — Idle ============ */}
        {connected && appState === "idle" && (
          <div className={`${styles.idleScreen} animate-fade-in`}>
            <div className={styles.idleCard}>
              <div className={styles.scanPromptIcon}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <rect x="6" y="6" width="68" height="68" rx="16" stroke="#D4D0E8" strokeWidth="1.5" strokeDasharray="5 3" />
                  <path d="M6 24V14a8 8 0 018-8h10" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M56 6h10a8 8 0 018 8v10" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M74 56v10a8 8 0 01-8 8h-10" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M24 74H14a8 8 0 01-8-8V56" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="24" y="24" width="14" height="14" rx="4" fill="#7C3AED" opacity="0.15" />
                  <rect x="42" y="24" width="14" height="14" rx="4" fill="#7C3AED" opacity="0.1" />
                  <rect x="24" y="42" width="14" height="14" rx="4" fill="#A78BFA" opacity="0.1" />
                  <rect x="42" y="42" width="14" height="14" rx="4" fill="#A78BFA" opacity="0.15" />
                  <line x1="14" y1="40" x2="66" y2="40" stroke="url(#sl)" strokeWidth="1.5" opacity="0.4" />
                  <defs>
                    <linearGradient id="sl" x1="14" y1="40" x2="66" y2="40">
                      <stop stopColor="transparent" />
                      <stop offset="0.3" stopColor="#7C3AED" />
                      <stop offset="0.7" stopColor="#A78BFA" />
                      <stop offset="1" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h2 className={styles.idleTitle}>Ready to Pay</h2>
              <p className={styles.idleSubtitle}>
                Scan a merchant&apos;s QRIS code to start your payment
              </p>

              <button
                className="btn btn-primary btn-lg btn-full"
                onClick={() => setAppState("scanning")}
                id="scan-qris-button"
              >
                📱 Scan QRIS Code
              </button>

              <div className={styles.idleStats}>
                <div className={styles.idleStatRow}>
                  <span className={styles.idleStatLabel}>Network</span>
                  <span className={styles.idleStatValue}>Rialo SVM Devnet</span>
                </div>
                <div className={styles.idleStatRow}>
                  <span className={styles.idleStatLabel}>Finality</span>
                  <span className={styles.idleStatValue}>~50ms</span>
                </div>
                <div className={styles.idleStatRow}>
                  <span className={styles.idleStatLabel}>Gas</span>
                  <span className={styles.idleStatValue}>Free</span>
                </div>
                <div className={styles.idleStatRow}>
                  <span className={styles.idleStatLabel}>Rate</span>
                  <span className={styles.idleStatValue}>1 USDC ≈ Rp 15,800</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ Scanning ============ */}
        {connected && appState === "scanning" && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setAppState("idle")}
          />
        )}

        {/* ============ Payment Flow ============ */}
        {connected && appState === "payment" && scanResult && (
          <PaymentFlow
            qrisData={scanResult}
            onBack={() => setAppState("idle")}
            onComplete={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Rialo QRIS Pay — A{" "}
          <span className={styles.gradientText}>Rialo Network</span>{" "}
          neofinance dApp by Subzero Labs
        </p>
        <p className="text-xs text-muted">MVP on SVM Devnet — Mainnet coming soon</p>
      </footer>
    </div>
  );
}
