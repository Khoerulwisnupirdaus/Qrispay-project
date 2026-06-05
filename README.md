# Rialo QRIS Pay

> **Neofinance Payment Bridge** — Pay any merchant in Indonesia with stablecoins ($RIALO), settled via QRIS in real-time.

![Status](https://img.shields.io/badge/Status-Prototype-orange)
![Chain](https://img.shields.io/badge/Chain-Rialo%20SVM-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

QRIS Pay bridges blockchain-based payments with Indonesia's national QR payment system (QRIS). Users pay with $RIALO, merchants receive IDR — all settled in seconds with near-zero fees.

**Current Phase:** Prototype / Proof of Concept on Rialo Devnet

## Architecture

```
Frontend (Next.js 16)  →  Middleware API (Express)  →  Xendit (QRIS Gateway)
         ↕                        ↕
   Privy Auth             Rialo Playground API
   (Embedded Wallet)      (Devnet Keys + Faucet)
```

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | Next.js 16 + React + TypeScript | Auth, wallet, payment UI |
| **Auth** | Privy (Google/Email login) | Embedded Solana wallet creation |
| **Devnet** | Rialo Playground API (proxy) | Keypair generation, faucet, balance |
| **Middleware API** | Node.js + Express + TypeScript | Payment orchestration, currency conversion |
| **Payment Gateway** | Xendit (Sandbox) | QRIS settlement to merchant |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Run Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Configure Privy App ID
npm run dev                   # Runs on http://localhost:3000
```

### Run Middleware API

```bash
cd middleware-api
npm install
cp .env.example .env          # Configure settings
npm run dev                   # Runs on http://localhost:3001
```

## API Routes (Frontend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rialo/connect` | Register + login to Rialo Playground, generate keypair |
| POST | `/api/rialo/faucet` | Request devnet $RIALO tokens |

## Middleware API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/rate` | Current USD/IDR exchange rate |
| GET | `/api/rate/convert?idrAmount=X` | Convert IDR to USDC |
| POST | `/api/payment/initiate` | Create QRIS payment |
| POST | `/api/payment/simulate` | Simulate payment (sandbox) |
| GET | `/api/payment/:id/status` | Check payment status |
| POST | `/api/payment/webhook` | Xendit webhook callback |

## Payment Flow

1. User logs in with Google/Email via Privy
2. Embedded Solana wallet auto-created
3. Rialo Devnet account linked via Playground API
4. User scans merchant's QRIS code
5. App calculates $RIALO amount from IDR
6. Middleware creates QRIS payment via Xendit
7. Merchant receives IDR via QRIS

## Tech Stack

- **Blockchain:** Rialo SVM (Solana-compatible)
- **Auth:** Privy (Google, Email, embedded wallet)
- **Devnet:** Rialo Playground API
- **Backend:** Node.js, Express, TypeScript
- **Frontend:** Next.js 16, React 19, TypeScript
- **Payment Gateway:** Xendit (QRIS)

## License

MIT
