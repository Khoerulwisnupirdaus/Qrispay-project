"use client";

/**
 * Home Page — Rialo QRIS Pay
 *
 * Premium landing page for the neofinance payment dApp.
 * Three states: Landing (disconnected), Idle (connected), Payment flow.
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
            <div className={styles.hero}>
              <div className={styles.heroGlow}></div>

              {/* Hero Icon — Animated QRIS symbol */}
              <div className={styles.heroIcon}>
                <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="88" y2="88">
                      <stop stopColor="#7B6EF6" />
                      <stop offset="0.5" stopColor="#A78BFA" />
                      <stop offset="1" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="4" width="80" height="80" rx="20" stroke="url(#hg)" strokeWidth="2" />
                  <rect x="16" y="16" width="22" height="22" rx="6" fill="url(#hg)" opacity="0.5" />
                  <rect x="50" y="16" width="22" height="22" rx="6" fill="url(#hg)" opacity="0.35" />
                  <rect x="16" y="50" width="22" height="22" rx="6" fill="url(#hg)" opacity="0.35" />
                  <circle cx="61" cy="61" r="12" fill="url(#hg)" opacity="0.7" />
                  <path d="M56 61L59.5 64.5L67 57" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h1 className={styles.heroTitle}>
                Pay with <span className={styles.gradientText}>Crypto</span>,
                <br />Settle via <span className={styles.gradientText}>QRIS</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Neofinance meets real-world payments. Use stablecoins on
                Rialo to pay any merchant in Indonesia — settled via QRIS
                with 50ms finality and zero gas fees.
              </p>

              <WalletMultiButton />

              <p className={styles.heroNote}>
                Connect your wallet to get started — powered by Rialo Network
              </p>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>50ms</div>
                <div className={styles.statLabel}>Block Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>$0</div>
                <div className={styles.statLabel}>Gas Fees</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>40M+</div>
                <div className={styles.statLabel}>QRIS Merchants</div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className={styles.features}>
              <div className={`${styles.featureCard} glass-card`}>
                <div className={styles.featureIcon}>⚡</div>
                <h3>50ms Finality</h3>
                <p>Rialo&apos;s ultra-fast consensus settles payments instantly</p>
              </div>
              <div className={`${styles.featureCard} glass-card`}>
                <div className={styles.featureIcon}>🌐</div>
                <h3>Native Bridge</h3>
                <p>On-chain contracts connect directly to QRIS — no oracles</p>
              </div>
              <div className={`${styles.featureCard} glass-card`}>
                <div className={styles.featureIcon}>🚀</div>
                <h3>Zero Gas</h3>
                <p>Rialo Cruise enables fully gasless transactions</p>
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
                    <p>Link your Rialo wallet — or sign in with email via Account Abstraction</p>
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

            {/* Trusted by */}
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

        {/* ============ CONNECTED — Idle / Scan Prompt ============ */}
        {connected && appState === "idle" && (
          <div className={`${styles.idleScreen} animate-fade-in`}>
            <div className={styles.idleCard}>
              <div className={styles.scanPromptIcon}>
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                  {/* Dashed frame */}
                  <rect x="8" y="8" width="84" height="84" rx="18" stroke="rgba(123,110,246,0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
                  {/* Corner brackets */}
                  <path d="M8 28V18a10 10 0 0110-10h10" stroke="#7B6EF6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M72 8h10a10 10 0 0110 10v10" stroke="#7B6EF6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M92 72v10a10 10 0 01-10 10h-10" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" />
                  <path d="M28 92H18a10 10 0 01-10-10V72" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" />
                  {/* Inner pattern */}
                  <rect x="28" y="28" width="18" height="18" rx="5" fill="#7B6EF6" opacity="0.2" />
                  <rect x="54" y="28" width="18" height="18" rx="5" fill="#7B6EF6" opacity="0.12" />
                  <rect x="28" y="54" width="18" height="18" rx="5" fill="#22D3EE" opacity="0.12" />
                  <rect x="54" y="54" width="18" height="18" rx="5" fill="#22D3EE" opacity="0.2" />
                  {/* Scan line */}
                  <line x1="16" y1="50" x2="84" y2="50" stroke="url(#scan-line)" strokeWidth="1.5" opacity="0.5" />
                  <defs>
                    <linearGradient id="scan-line" x1="16" y1="50" x2="84" y2="50">
                      <stop stopColor="transparent" />
                      <stop offset="0.3" stopColor="#7B6EF6" />
                      <stop offset="0.7" stopColor="#22D3EE" />
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
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Network</span>
                  <span className={styles.statValue}>Rialo (SVM Devnet)</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Finality</span>
                  <span className={styles.statValue}>~50ms</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Gas</span>
                  <span className={styles.statValue}>Free (Rialo Cruise)</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Rate</span>
                  <span className={styles.statValue}>1 USDC ≈ Rp 15,800</span>
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
          Rialo QRIS Pay • A{" "}
          <span className={styles.gradientText}>Rialo Network</span>{" "}
          neofinance dApp by{" "}
          <span className={styles.gradientText}>Subzero Labs</span>
        </p>
        <p className="text-xs text-muted">MVP on SVM Devnet — Mainnet coming soon</p>
      </footer>
    </div>
  );
}
