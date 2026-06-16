"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import QRScanner, { QrisScanResult } from "@/components/QRScanner";
import PaymentFlow from "@/components/PaymentFlow";
import styles from "./page.module.css";

const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

type AppState = "idle" | "scanning" | "payment";

/* ── SVG Icon Components ─────────────────────────────── */

const IconQR = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="2" y="2" width="40" height="40" rx="10" stroke="#A9DCD3" strokeWidth="1.5" />
    <rect x="9" y="9" width="10" height="10" rx="3" fill="#A9DCD3" />
    <rect x="25" y="9" width="10" height="10" rx="3" fill="#7CC4B8" />
    <rect x="9" y="25" width="10" height="10" rx="3" fill="#7CC4B8" />
    <circle cx="30" cy="30" r="5" fill="#A9DCD3" />
    <path d="M28 30l2 2 3-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBolt = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="#A9DCD3" fillOpacity="0.08" />
    <path d="M22 12L14 22h5l-1 6 8-10h-5l1-6z" fill="#A9DCD3" />
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
    <rect width="40" height="40" rx="12" fill="#7CC4B8" fillOpacity="0.08" />
    <path d="M20 12l8 4-8 4-8-4 8-4z" fill="#7CC4B8" fillOpacity="0.3" stroke="#7CC4B8" strokeWidth="1.5" />
    <path d="M12 20l8 4 8-4" stroke="#7CC4B8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 24l8 4 8-4" stroke="#7CC4B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
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
  const { authenticated, login } = usePrivy();
  const connected = authenticated;
  const [appState, setAppState] = useState<AppState>("idle");
  const [scanResult, setScanResult] = useState<QrisScanResult | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleScanSuccess = (result: QrisScanResult) => {
    setScanResult(result);
    setAppState("payment");
    setShowLanding(false);
  };

  const handleReset = () => {
    setScanResult(null);
    setAppState("idle");
    setShowLanding(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }), 50);
  };

  const handleStartScan = () => {
    setShowLanding(false);
    setAppState("scanning");
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
  }, [connected, showLanding]);

  /* Scroll-driven benefit card spread + pattern glow */
  const stackRef = useRef<HTMLDivElement>(null);
  const patternRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleScrollEffects = useCallback(() => {
    const viewH = window.innerHeight;

    // ── Benefit card spread ──
    const stack = stackRef.current;
    if (stack) {
      const rect = stack.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH * 1.4)));
      const cards = stack.querySelectorAll<HTMLElement>('[data-benefit]');
      cards.forEach((card, i) => {
        if (i === 0) return;
        const threshold = i * 0.15;
        const cardProgress = Math.max(0, Math.min(1, (progress - threshold) / 0.35));
        const eased = 1 - Math.pow(1 - cardProgress, 3);
        const marginTop = -70 + (86 * eased);
        card.style.marginTop = `${marginTop}px`;
      });
    }

    // ── Pattern glow sweep: top-left → bottom-right ──
    const pattern = patternRef.current;
    const glow = glowRef.current;
    if (pattern && glow) {
      const rect = pattern.getBoundingClientRect();
      const sectionH = rect.height;
      const scrolledInto = viewH - rect.top;
      const progress = Math.max(0, Math.min(1, scrolledInto / (sectionH + viewH)));
      const x = progress * 100;
      const y = progress * 100;
      glow.style.background = `radial-gradient(ellipse 800px 300px at ${x}% ${y}%, rgba(218,165,32,0.5) 0%, rgba(218,165,32,0.15) 35%, transparent 65%)`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScrollEffects, { passive: true });
    handleScrollEffects();
    return () => window.removeEventListener('scroll', handleScrollEffects);
  }, [handleScrollEffects, connected, showLanding]);

  return (
    <div className={styles.app}>
      <Header onLogoClick={handleReset} />

      <main className={styles.main}>
        {/* ═══════════ Landing Page ═══════════ */}
        {(!connected || (connected && showLanding && appState === "idle")) && (
          <>
          {/* Hero — dark gradient with glass card */}
          <section className={styles.heroWrap}>
            <div className={`${styles.heroCard} animate-fade-in`}>
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
                {connected ? (
                  <button className="btn btn-primary btn-lg" onClick={handleStartScan}>
                    Scan QRIS Code
                  </button>
                ) : (
                  <div className={styles.authButtons}>
                    <button className="btn btn-primary btn-lg" onClick={login}>
                      Get Started
                    </button>
                  </div>
                )}
                <a href="#how-it-works" className={styles.heroSecondaryBtn}>
                  How it works <IconArrowRight />
                </a>
              </div>
            </div>
          </section>

          {/* Pattern Zone — QR background between hero & footer */}
          <div className={styles.patternZone} ref={patternRef as React.RefObject<HTMLDivElement>}>
          <div className={styles.patternGlow} ref={glowRef} />
          <div className={`${styles.landing} animate-fade-in`}>
            {/* Metrics + Why Choose Us — unified card */}
            <div className={styles.unifiedCard}>
              <div className={styles.metricsRow}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>&lt;1s</span>
                  <span className={styles.metricLabel}>Settlement</span>
                </div>
                <div className={styles.metricDivider} />
                <div className={styles.metric}>
                  <span className={styles.metricValue}>~$0</span>
                  <span className={styles.metricLabel}>Near-Zero Fee</span>
                </div>
                <div className={styles.metricDivider} />
                <div className={styles.metric}>
                  <span className={styles.metricValue}>40M+</span>
                  <span className={styles.metricLabel}>QRIS Merchants</span>
                </div>
              </div>

              <div className={styles.benefitHeader}>
                <span className={styles.benefitBadge}>✦ Why choose us</span>
                <h2 className={styles.benefitTitle}>Built for speed, designed for trust</h2>
              </div>
            </div>
            <div className={styles.benefitStack} ref={stackRef}>
              <div className={styles.benefitCard} data-benefit="0">
                <div className={styles.benefitIcon}><IconBolt /></div>
                <div className={styles.benefitText}>
                  <h3>Near-zero fees</h3>
                  <p>SVM-based architecture keeps fees stable and predictable for every payment.</p>
                </div>
              </div>
              <div className={styles.benefitCard} data-benefit="1" style={{ marginTop: '-70px' }}>
                <div className={styles.benefitIcon}><IconClock /></div>
                <div className={styles.benefitText}>
                  <h3>Sub-second settlement</h3>
                  <p>Payments confirm faster than a merchant&apos;s terminal can beep.</p>
                </div>
              </div>
              <div className={styles.benefitCard} data-benefit="2" style={{ marginTop: '-70px' }}>
                <div className={styles.benefitIcon}><IconLayers /></div>
                <div className={styles.benefitText}>
                  <h3>Indonesia-focused</h3>
                  <p>Built specifically for the Indonesian market and payment infrastructure.</p>
                </div>
              </div>
              <div className={styles.benefitCard} data-benefit="3" style={{ marginTop: '-70px' }}>
                <div className={styles.benefitIcon}><IconShield /></div>
                <div className={styles.benefitText}>
                  <h3>On-chain escrow</h3>
                  <p>Funds locked in PDA until QRIS settlement is confirmed. Fully auditable.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.landing}>
            {/* How It Works */}
            <section className={`${styles.howSection} reveal`} id="how-it-works">
              <h2 className={styles.sectionTitle}>Three steps to pay</h2>
              <p className={styles.sectionSub}>Works with any Solana-compatible wallet</p>

              <div className={styles.stepsRow}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>01</div>
                  <h4>Sign Up / Log In</h4>
                  <p>Login securely with your Google or Email account. No seed phrases needed.</p>
                </div>
                <div className={styles.stepDivider}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M15 8l4 4-4 4" stroke="#000102" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>02</div>
                  <h4>Scan QRIS</h4>
                  <p>Point your camera at any merchant&apos;s QR code across Indonesia.</p>
                </div>
                <div className={styles.stepDivider}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M15 8l4 4-4 4" stroke="#000102" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>03</div>
                  <h4>Confirm &amp; pay</h4>
                  <p>RIALO → IDR, settled on-chain in sub-second. Receipt generated instantly.</p>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className={`${styles.ctaSection} reveal`}>
              <div className={styles.ctaCard}>
                <div className={styles.ctaText}>
                  <h2>Start paying with crypto today.</h2>
                  {connected ? (
                    <button className="btn btn-primary btn-lg" onClick={handleStartScan}>
                      Scan QRIS Code
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={login}>
                      Get Started
                    </button>
                  )}
                  <p>Join thousands of users bridging crypto to real-world payments.</p>
                </div>
                <div className={styles.ctaVisual}>
                  <img src="/cta-phone.png" alt="QRIS Pay" width={200} height={200} style={{ objectFit: 'contain' }} />
                </div>
              </div>
            </section>
          </div>
          </div>{/* end patternZone */}

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
          </>
        )}

        {/* ═══════════ CONNECTED — Idle ═══════════ */}
        {connected && !showLanding && appState === "idle" && (
          <div className={`${styles.idleScreen} animate-fade-in`}>
            <div className={styles.idleCard}>
              <div className={styles.scanIcon}>
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                  <rect x="4" y="4" width="64" height="64" rx="16" stroke="#E9E5F5" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M4 22V12a8 8 0 018-8h10" stroke="#A9DCD3" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M50 4h10a8 8 0 018 8v10" stroke="#A9DCD3" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M68 50v10a8 8 0 01-8 8H50" stroke="#7CC4B8" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M22 68H12a8 8 0 01-8-8V50" stroke="#7CC4B8" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="20" y="20" width="12" height="12" rx="3" fill="#A9DCD3" opacity="0.12" />
                  <rect x="40" y="20" width="12" height="12" rx="3" fill="#A9DCD3" opacity="0.08" />
                  <rect x="20" y="40" width="12" height="12" rx="3" fill="#7CC4B8" opacity="0.08" />
                  <rect x="40" y="40" width="12" height="12" rx="3" fill="#7CC4B8" opacity="0.12" />
                </svg>
              </div>

              <h2 className={styles.idleTitle}>Ready to pay</h2>
              <p className={styles.idleSubtitle}>Scan a merchant&apos;s QRIS code to begin</p>

              <button
                className="btn btn-primary btn-lg btn-full"
                onClick={handleStartScan}
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
        {connected && !showLanding && appState === "scanning" && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setAppState("idle")}
          />
        )}

        {/* ═══════════ Payment Flow ═══════════ */}
        {connected && !showLanding && appState === "payment" && scanResult && (
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
