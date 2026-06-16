# QRIS Pay — Potential Q&A

---

## Product & Business

### 1. "How is this different from just selling crypto on an exchange and paying with GoPay?"

That process takes 4+ steps and hours. Sell on exchange, wait for bank transfer, top-up e-wallet, then pay. QRIS Pay does it in one step, in seconds. The user never leaves the app, and there's no manual withdrawal or bank transfer involved.

---

### 2. "Who is your target user?"

Crypto holders in Indonesia who want to spend their tokens at real merchants without going through the sell-withdraw-topup cycle. There are 18.5 million registered crypto traders in Indonesia — most of them can't spend their holdings anywhere.

---

### 3. "Why would a user hold RIALO instead of just using GoPay or OVO?"

RIALO is a blockchain asset — it can earn yield, be used in DeFi, transferred peer-to-peer without intermediaries, and is borderless. GoPay/OVO are closed-loop systems tied to one provider. QRIS Pay gives RIALO real-world utility that those apps can't offer.

---

### 4. "What's your revenue model?"

Three streams: transaction fee (0.5-1% per payment), conversion spread on the RIALO/IDR rate, and a future B2B API for other wallets and exchanges to integrate QRIS payments.

---

### 5. "Do merchants need to do anything to accept QRIS Pay?"

No. Zero merchant integration. We use the existing QRIS infrastructure — any of the 30M+ QRIS merchants in Indonesia can receive payment without knowing crypto is involved. They just see a normal QRIS transaction and receive IDR.

---

## Technical

### 6. "How does the payment settlement actually work?"

User sends RIALO → our middleware converts it to an IDR amount → calls Xendit API to generate a QRIS code → merchant scans or receives the QRIS payment → Xendit settles IDR to the merchant's bank account. The crypto-to-fiat conversion happens in our middleware layer.

---

### 7. "What happens if the QRIS payment fails after the user already sent RIALO?"

In production, we'll use a smart contract escrow. RIALO is locked in a PDA (Program Derived Address), not sent directly. If QRIS payment fails, the escrow releases back to the user. No funds are lost. Right now on devnet this flow is simulated.

---

### 8. "Why Privy instead of Phantom or other wallets?"

Privy lets users log in with Google or Email — no browser extension, no seed phrase, no app download. This is critical for mass adoption in Indonesia where most people don't have Phantom installed. The wallet is created invisibly in the background.

---

### 9. "Is the user's private key safe with Privy?"

Yes. Privy uses MPC (Multi-Party Computation) — the private key is split into shares and never exists in full on any single server. Even Privy themselves can't access the user's key. It's non-custodial.

---

### 10. "How do you handle the exchange rate between RIALO and IDR?"

The middleware API fetches real-time USD/IDR rates and applies the RIALO/USD conversion. In production, this would be sourced from on-chain oracles or DEX price feeds to ensure transparency and accuracy.

---

### 11. "What's your latency? How long does a payment take?"

On devnet, wallet creation takes 3-5 seconds (first time only). The QRIS generation itself is under 2 seconds. Total payment flow from tap to merchant receiving IDR: under 10 seconds.

---

## Rialo-Specific

### 12. "Why build on Rialo instead of Solana mainnet?"

Rialo is SVM-compatible, so we get the same developer tools and speed, but Rialo is specifically designed for the Indonesian market. Lower fees, local focus, and aligned ecosystem. We want to be part of the chain that's purpose-built for Indonesia's payment infrastructure.

---

### 13. "How tightly coupled are you to Rialo? Could this work on Solana too?"

The architecture is modular. The payment middleware and Xendit integration are chain-agnostic. The wallet and on-chain components use SVM, so technically it could work on Solana too. But we're building for Rialo because that's where the Indonesia-focused ecosystem is.

---

### 14. "What do you need from Rialo to go to mainnet?"

Three things: SDK/API access for mainnet keypair and transaction management, technical guidance on smart contract deployment for the escrow program, and grant funding to cover Xendit production costs and initial liquidity.

---

### 15. "How will you handle the wallet migration from devnet to mainnet?"

Since Rialo is SVM-compatible, the keypair format (ed25519) is the same. We can either migrate existing keys or generate new mainnet keys using the same auth flow. The user experience won't change — they still log in with Google and see their balance.

---

## Critical / Tough Questions

### 16. "Is this legal in Indonesia? What about crypto payment regulations?"

We're not processing crypto as payment directly to merchants. The merchant receives IDR through QRIS — a fully regulated payment channel. Our middleware handles the conversion. This is similar to how crypto debit cards work globally. However, we're aware of BI (Bank Indonesia) regulations and will work with legal counsel before production launch.

---

### 17. "You're basically just a wrapper around Xendit. What's your moat?"

Xendit handles QRIS settlement, but our moat is the full-stack integration: embedded wallet onboarding, on-chain escrow for trustless settlement, real-time conversion, and the UX that makes crypto spending invisible to both user and merchant. Anyone can call the Xendit API, but building the crypto bridge with proper escrow and key management is the hard part.

---

### 18. "What if RIALO price drops 10% between the user initiating payment and merchant receiving IDR?"

The conversion is locked at the moment of payment initiation. The escrow locks the exact RIALO amount needed at the current rate. There's no price exposure window because settlement happens in seconds, not minutes. For larger amounts, we can implement slippage protection.

---

### 19. "You only have devnet tokens. How will users get real RIALO?"

Initially through CEX/DEX listings where users buy RIALO. Long-term, we want to build a direct IDR-to-RIALO on-ramp within the app — user deposits IDR via bank transfer and receives RIALO directly. This is part of the Phase 4 roadmap.

---

### 20. "Your MVP is live but there are no real transactions. How do you validate demand?"

The MVP proves the technical feasibility — real devnet tokens, real wallet creation, real QRIS code generation. For demand validation, Indonesia has 18.5M crypto traders and 30M+ QRIS merchants. The gap between these two markets is our opportunity. Next step is a closed beta with real payments to validate conversion rates and user behavior.
