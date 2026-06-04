"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Header from "@/components/Header";
import QRScanner, { QrisScanResult } from "@/components/QRScanner";
import PaymentFlow from "@/components/PaymentFlow";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

type AppState = "idle" | "scanning" | "payment";

/* ── SVG Icon Components ─────────────────────────────── */

const IconQR = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="2" y="2" width="40" height="40" rx="10" stroke="#7C3AED" strokeWidth="1.5" />
    <rect x="9" y="9" width="10" height="10" rx="3" fill="#7C3AED" />
    <rect x="25" y="9" width="10" height="10" rx="3" fill="#A78BFA" />
    <rect x="9" y="25" width="10" height="10" rx="3" fill="#A78BFA" />
    <circle cx="30" cy="30" r="5" fill="#7C3AED" />
    <path d="M28 30l2 2 3-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBolt = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="#7C3AED" fillOpacity="0.08" />
    <path d="M22 12L14 22h5l-1 6 8-10h-5l1-6z" fill="#7C3AED" />
  </svg>
);

const IconClock = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="#0D9488" fillOpacity="0.08" />
    <circle cx="20" cy="20" r="8" stroke="#0D9488" strokeWidth="1.8" />
    <path d="M20 15v5l3.5 2" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLayers = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="#6366F1" fillOpacity="0.08" />
    <path d="M20 12l8 4-8 4-8-4 8-4z" fill="#6366F1" fillOpacity="0.3" stroke="#6366F1" strokeWidth="1.5" />
    <path d="M12 20l8 4 8-4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 24l8 4 8-4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const IconShield = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="#059669" fillOpacity="0.08" />
    <path d="M20 11l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10v-5l7-3z" stroke="#059669" strokeWidth="1.8" fill="#059669" fillOpacity="0.1" />
    <path d="M17 20l2 2 4-4" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Main Page ───────────────────────────────────────── */

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

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [connected]);

  return (
    <div className={styles.app}>
      <Header onLogoClick={handleReset} />

      <main className={styles.main}>
        {/* ═══════════ DISCONNECTED — Landing ═══════════ */}
        {!connected && (
          <div className={`${styles.landing} animate-fade-in`}>
            {/* Hero */}
            <section className={styles.hero}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                Live on Rialo SVM Devnet
              </div>

              <h1 className={styles.heroTitle}>
                Pay merchants with crypto.
                <br />
                <span className={styles.heroTitleLight}>Settled via QRIS, instantly.</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Use USDC to pay any of Indonesia&apos;s 40 million QRIS merchants.
                Sub-second on-chain settlement, near-zero fees, fully non-custodial.
              </p>

              <div className={styles.heroActions}>
                <WalletMultiButton />
                <a href="#how-it-works" className={styles.heroSecondaryBtn}>
                  How it works <IconArrowRight />
                </a>
              </div>
            </section>

            {/* Metrics Strip */}
            <section className={styles.metricsStrip}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>&lt;1s</span>
                <span className={styles.metricLabel}>Settlement</span>
              </div>
              <div className={styles.metricDot} />
              <div className={styles.metric}>
                <span className={styles.metricValue}>~$0</span>
                <span className={styles.metricLabel}>Near-Zero Fee</span>
              </div>
              <div className={styles.metricDot} />
              <div className={styles.metric}>
                <span className={styles.metricValue}>40M+</span>
                <span className={styles.metricLabel}>QRIS Merchants</span>
              </div>
            </section>

            {/* Bento Features */}
            <section className={`${styles.bentoGrid} reveal-stagger`}>
              {/* Primary — full-width hero card */}
              <div className={`${styles.bentoCard} ${styles.bentoPrimary} tilt-3d shimmer-overlay`}>
                <div className={styles.bentoPrimaryInner}>
                  <div>
                    <span className={styles.cardLabel}>Core Product</span>
                    <h2 className={styles.cardTitleLg}>
                      Scan any QRIS code.
                      <br />Pay with USDC.
                    </h2>
                    <p className={styles.cardDesc}>
                      Point your camera at a merchant&apos;s QR code — your stablecoin
                      converts to IDR and reaches them in real-time. No banks, no delays.
                    </p>
                  </div>
                  <div className={styles.bentoPrimaryVisual}>
                    <IconQR />
                  </div>
                </div>
              </div>

              {/* 2-col row */}
              <div className={`${styles.bentoCard} ${styles.bentoAccentA} tilt-3d`}>
                <IconBolt />
                <span className={styles.cardLabel}>Low-Cost</span>
                <h3 className={styles.cardTitle}>Near-zero fees</h3>
                <p className={styles.cardDesc}>
                  Rialo&apos;s DAG-based architecture keeps transaction
                  fees stable and predictable — near-zero for every payment.
                </p>
              </div>

              <div className={`${styles.bentoCard} ${styles.bentoAccentB} tilt-3d`}>
                <IconClock />
                <span className={styles.cardLabel}>Finality</span>
                <h3 className={styles.cardTitle}>Sub-second settlement</h3>
                <p className={styles.cardDesc}>
                  Rialo&apos;s DAG consensus confirms payments faster than
                  a merchant&apos;s terminal can beep.
                </p>
              </div>

              {/* 2-col row */}
              <div className={`${styles.bentoCard} ${styles.bentoLight} tilt-3d`}>
                <IconLayers />
                <span className={styles.cardLabel}>Infrastructure</span>
                <h3 className={styles.cardTitle}>Native HTTPS calls</h3>
                <p className={styles.cardDesc}>
                  Rialo smart contracts call external APIs directly —
                  no oracles needed. QRIS settlement verified on-chain.
                </p>
              </div>

              <div className={`${styles.bentoCard} ${styles.bentoLight} tilt-3d`}>
                <IconShield />
                <span className={styles.cardLabel}>Security</span>
                <h3 className={styles.cardTitle}>On-chain escrow</h3>
                <p className={styles.cardDesc}>
                  Smart contracts lock funds in a PDA until the QRIS settlement
                  is confirmed. Fully auditable.
                </p>
              </div>
            </section>

            {/* How It Works */}
            <section className={`${styles.howSection} reveal`} id="how-it-works">
              <h2 className={styles.sectionTitle}>Three steps to pay</h2>
              <p className={styles.sectionSub}>Works with any Solana-compatible wallet</p>

              <div className={styles.stepsRow}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>01</div>
                  <h4>Connect wallet</h4>
                  <p>Phantom, Backpack, or any Solana wallet. One tap.</p>
                </div>
                <div className={styles.stepDivider}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M15 8l4 4-4 4" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>02</div>
                  <h4>Scan QRIS</h4>
                  <p>Point your camera at any merchant&apos;s QR code across Indonesia.</p>
                </div>
                <div className={styles.stepDivider}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M15 8l4 4-4 4" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>03</div>
                  <h4>Confirm &amp; pay</h4>
                  <p>USDC → IDR, settled on-chain in sub-second. Receipt generated instantly.</p>
                </div>
              </div>
            </section>

            {/* Dark Globe Section */}
            <section className={`${styles.globeSection} reveal`}>
              <div className={styles.globeContent}>
                <div className={styles.globeText}>
                  <h2 className={styles.globeTitle}>Rialo</h2>
                  <p className={styles.globeTagline}>
                    Real-world payments,<br />powered by blockchain.
                  </p>
                  <div className={styles.globeLinks}>
                    <div className={styles.globeLinkCol}>
                      <span className={styles.globeLinkHead}>Product</span>
                      <a href="#">QRIS Pay</a>
                      <a href="#">Wallet</a>
                      <a href="#">API Docs</a>
                    </div>
                    <div className={styles.globeLinkCol}>
                      <span className={styles.globeLinkHead}>Network</span>
                      <a href="#">Rialo SVM</a>
                      <a href="#">Explorer</a>
                      <a href="#">Devnet</a>
                    </div>
                    <div className={styles.globeLinkCol}>
                      <span className={styles.globeLinkHead}>Community</span>
                      <a href="https://x.com/Wisnu100802" target="_blank" rel="noopener">Twitter/X</a>
                      <a href="https://github.com/Khoerulwisnupirdaus/Qrispay-project" target="_blank" rel="noopener">GitHub</a>
                      <a href="#">Discord</a>
                    </div>
                  </div>
                </div>
                <div className={styles.globeVisual}>
                  <Globe size={380} dotColor="rgba(255,255,255,0.55)" dotSize={1.1} speed={0.002} className={styles.globeCanvas} />
                </div>
              </div>
              <div className={styles.globeFooter}>
                <span>© 2026 Rialo QRIS Pay · Built by wzscarlet</span>
                <span>Powered by Rialo Network · Subzero Labs</span>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════ CONNECTED — Idle ═══════════ */}
        {connected && appState === "idle" && (
          <div className={`${styles.idleScreen} animate-fade-in`}>
            <div className={styles.idleCard}>
              <div className={styles.scanIcon}>
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                  <rect x="4" y="4" width="64" height="64" rx="16" stroke="#E9E5F5" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M4 22V12a8 8 0 018-8h10" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M50 4h10a8 8 0 018 8v10" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M68 50v10a8 8 0 01-8 8H50" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M22 68H12a8 8 0 01-8-8V50" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="20" y="20" width="12" height="12" rx="3" fill="#7C3AED" opacity="0.12" />
                  <rect x="40" y="20" width="12" height="12" rx="3" fill="#7C3AED" opacity="0.08" />
                  <rect x="20" y="40" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.08" />
                  <rect x="40" y="40" width="12" height="12" rx="3" fill="#A78BFA" opacity="0.12" />
                </svg>
              </div>

              <h2 className={styles.idleTitle}>Ready to pay</h2>
              <p className={styles.idleSubtitle}>Scan a merchant&apos;s QRIS code to begin</p>

              <button
                className="btn btn-primary btn-lg btn-full"
                onClick={() => setAppState("scanning")}
                id="scan-qris-button"
              >
                Scan QRIS Code
              </button>

              <div className={styles.idleInfo}>
                <div className={styles.infoRow}>
                  <span>Network</span><span>Rialo SVM Devnet</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Finality</span><span>Sub-second</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Fees</span><span>Near-zero</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Rate</span><span>1 USDC ≈ Rp 15,800</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ Scanning ═══════════ */}
        {connected && appState === "scanning" && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setAppState("idle")}
          />
        )}

        {/* ═══════════ Payment Flow ═══════════ */}
        {connected && appState === "payment" && scanResult && (
          <PaymentFlow
            qrisData={scanResult}
            onBack={() => setAppState("idle")}
            onComplete={handleReset}
          />
        )}
      </main>


    </div>
  );
}
