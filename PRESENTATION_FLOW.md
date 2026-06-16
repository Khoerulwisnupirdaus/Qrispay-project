# Rialo QRIS Pay — Presentation Flow
### Product Demo Script (~10 minutes)

---

## Slide 1 · Opening (30s)

**Title:** Rialo QRIS Pay — Neofinance Payment Bridge

> "Pay any merchant in Indonesia with crypto. Settled via QRIS. In seconds."

---

## Slide 2 · The Problem (60s)

**"270 million people. 1 QR standard. 0 crypto bridges."**

- Indonesia has **QRIS** — unified QR payment accepted by **30M+ merchants**
- Crypto adoption is growing fast (**18.5M registered traders**)
- But **no way to spend crypto at real merchants**
- Current flow: sell crypto → bank transfer → top-up e-wallet → pay (hours, 2-5% fees)

---

## Slide 3 · The Solution (60s)

**"QRIS Pay bridges crypto to QRIS in one tap."**

| | Before | With QRIS Pay |
|--|--------|---------------|
| Steps | 4+ steps | 1 step |
| Time | Hours | Seconds |
| Fees | 2-5% | Near zero |
| Merchant setup | Required | None (existing QRIS) |

---

## Slide 4 · Live Demo — Login (60s)

> Open **qrispay.vercel.app**, click "Get Started"

1. **Google Login** — no seed phrases, no wallet apps, just click Google
2. Privy creates an **embedded Solana wallet** automatically
3. Dropdown shows **Solana · Privy** address

**Key message:** *"Onboarding in 3 seconds. Your grandma can do this."*

---

## Slide 5 · Live Demo — Rialo Devnet (60s)

> Open dropdown, show Rialo Devnet section

1. QRIS Pay auto-connects to **Rialo Playground**
2. Rialo Devnet address appears — **same as playground account**
3. Click **"Get $RIALO"** — faucet sends **1 $RIALO** from real devnet
4. Click **refresh** — balance updates live

**Key message:** *"Real blockchain. Real tokens. Real transactions."*

---

## Slide 6 · Live Demo — Payment Flow (90s)

> Click "Pay with QRIS", scan QR or enter amount

1. Enter IDR amount (e.g., Rp 50,000)
2. Auto-converts to **$RIALO** at real-time rate
3. **QRIS code** generated
4. Payment confirmed — merchant receives IDR

**Key message:** *"From crypto to merchant's bank account in under 10 seconds."*

---

## Slide 7 · Architecture (60s)

```
User (Browser)
    ↓ Google Login
Privy (Auth + Embedded Wallet)
    ↓ Auto-connect
Rialo Playground API (Devnet)
    ↓ $RIALO tokens
QRIS Pay Frontend (Next.js)
    ↓ Payment request
Middleware API (Express)
    ↓ QRIS generation
Xendit Payment Gateway
    ↓ IDR settlement
Merchant's Bank Account
```

**No app install. No seed phrase. No merchant integration.**

---

## Slide 8 · Why Rialo SVM? (45s)

- **Solana-compatible** — same dev tools, same speed
- **Indonesia-focused** — built for local payment use cases
- **Near-zero fees** and **sub-second finality**
- QRIS Pay designed to migrate from devnet to **Rialo mainnet**

---

## Slide 9 · Competitive Advantage (45s)

| Feature | QRIS Pay | Crypto Debit Cards | P2P OTC |
|---------|----------|--------------------|---------|
| Works in Indonesia | ✅ | Limited | ✅ |
| Merchant count | 30M+ (QRIS) | Partners only | 0 |
| Settlement speed | Seconds | Days | Hours |
| User onboarding | 3 seconds | KYC needed | Manual |
| Merchant setup | None | Integration | N/A |

---

## Slide 10 · Business Model (45s)

1. **Transaction fee** — small % per QRIS payment
2. **Conversion spread** — IDR/crypto margin
3. **B2B API** — white-label for other wallets/exchanges

---

## Slide 11 · Roadmap (45s)

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| Phase 1 ✅ | Q2 2026 | Prototype on Rialo Devnet |
| Phase 2 | Q3 2026 | Xendit QRIS integration (sandbox) |
| Phase 3 | Q4 2026 | Rialo Mainnet migration |
| Phase 4 | Q1 2027 | Public beta — real QRIS payments |
| Phase 5 | Q2 2027 | Multi-token support (USDC, USDT) |

---

## Slide 12 · Closing (30s)

**"The future of payments in Indonesia starts here."**

- 🌐 Live demo: **qrispay.vercel.app**
- 💻 GitHub: **github.com/Khoerulwisnupirdaus/Qrispay-project**
- ⛓️ Built on: **Rialo SVM**

---

## Before Presenting — Checklist

- [ ] Login dulu di qrispay.vercel.app supaya wallet ready
- [ ] Pastikan sudah punya $RIALO balance
- [ ] Buka playground.rialo.io di tab lain (show address match)
- [ ] Test internet stabil
- [ ] Siapkan QRIS merchant untuk demo payment flow
