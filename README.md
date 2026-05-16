# Rialo QRIS Pay

> **Neofinance Payment Bridge** — Pay any merchant in Indonesia with stablecoins (USDC), settled via QRIS in real-time.

![Status](https://img.shields.io/badge/Status-Prototype-orange)
![Chain](https://img.shields.io/badge/Chain-Solana%20(SVM)-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

QRIS Pay bridges blockchain-based stablecoin payments with Indonesia's national QR payment system (QRIS). Users pay with USDC, merchants receive IDR — all settled in seconds with near-zero fees.

**Current Phase:** Prototype / Proof of Concept on Solana Devnet

## Architecture

```
Frontend (Next.js 16)  →  Middleware API (Express)  →  Xendit (QRIS Gateway)
                                  ↕
                        Smart Contract (Anchor/Rust)
                           Solana Devnet
```

| Layer | Tech | Purpose |
|-------|------|---------|
| **Smart Contract** | Rust + Anchor | Escrow (lock/confirm/cancel USDC) |
| **Middleware API** | Node.js + Express + TypeScript | Payment orchestration, currency conversion |
| **Frontend** | Next.js 16 + React + TypeScript | Wallet connection, QR scanning, payment UI |
| **Payment Gateway** | Xendit (Sandbox) | QRIS settlement to merchant |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Run Middleware API

```bash
cd middleware-api
npm install
cp .env.example .env    # Configure your settings
npm run dev             # Runs on http://localhost:3001
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev             # Runs on http://localhost:3000
```

### Smart Contract (Anchor)

> Requires Rust + Solana CLI + Anchor CLI toolchain

```bash
cd anchor
anchor build
anchor deploy
```

## API Endpoints

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

1. User connects Solana wallet (Phantom/Backpack)
2. User scans merchant's QRIS code
3. App calculates USDC amount from IDR
4. USDC locked in on-chain escrow (PDA)
5. Middleware creates QRIS payment via Xendit
6. Merchant receives IDR via QRIS
7. Escrow released on-chain

## Tech Stack

- **Blockchain:** Solana (SVM-compatible — designed for future Rialo Network migration)
- **Smart Contract:** Rust + Anchor Framework
- **Backend:** Node.js, Express, TypeScript
- **Frontend:** Next.js 16, React 19, TypeScript
- **Payment Gateway:** Xendit (QRIS)
- **Wallet:** Phantom, Backpack (Solana Wallet Adapter)

## License

MIT
