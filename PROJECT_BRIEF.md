# Project Brief: Rialo QRIS Pay
### Neofinance Payment Infrastructure — R&D Prototype

---

## Perkenalan

Perkenalkan, saya **wzscarlet** (Khoirul Wisnu Pirdaus). Saya seorang software engineer yang saat ini sedang mengembangkan prototype aplikasi pembayaran berbasis blockchain sebagai bagian dari inisiatif riset dan pengembangan skill di bidang **distributed systems**, **financial technology**, dan **Web3 infrastructure**.

Dokumen ini menjelaskan project yang sedang saya bangun, motivasi teknis di baliknya, serta relevansinya terhadap kompetensi engineering yang saya kembangkan.

---

## Ringkasan Project

**Rialo QRIS Pay** adalah prototype aplikasi pembayaran yang memungkinkan pengguna membayar merchant di Indonesia menggunakan stablecoin (USDC) melalui sistem **QRIS** — standar pembayaran QR code nasional yang diregulasi oleh Bank Indonesia.

Aplikasi ini berjalan di atas **Rialo Network** (berbasis Solana Virtual Machine / SVM), sebuah Layer-1 blockchain yang didesain untuk transaksi keuangan real-world dengan karakteristik:

- **Settlement ~50ms** — konfirmasi transaksi hampir instan
- **Zero gas fees** — biaya transaksi ditanggung oleh jaringan (Rialo Cruise)
- **40+ juta merchant** — kompatibel dengan seluruh merchant QRIS di Indonesia

---

## Motivasi & Konteks

### Mengapa Project Ini?

1. **Skill Development** — Membangun kompetensi di area yang high-demand: smart contract development, API integration, payment system architecture, dan frontend engineering
2. **Portfolio Engineering** — Demonstrasi kemampuan teknis end-to-end: dari smart contract (Rust/Anchor) hingga frontend (Next.js/TypeScript) dan middleware (Express.js)
3. **Industry Relevance** — Pembayaran digital adalah sektor yang terus berkembang di Indonesia (GoPay, OVO, DANA, dll). Memahami infrastruktur di baliknya memberikan perspektif yang valuable

### Mengapa Blockchain / SVM?

Blockchain bukan sekadar "crypto". Dalam konteks ini, SVM digunakan karena:
- **Programmable escrow** — dana terkunci di smart contract hingga settlement terkonfirmasi, menghilangkan risiko fraud
- **Auditability** — setiap transaksi tercatat permanen dan bisa diverifikasi publik
- **Interoperability** — arsitektur SVM memungkinkan integrasi cross-chain di masa depan
- **Speed** — Rialo SVM memproses transaksi dalam milidetik, setara atau lebih cepat dari payment gateway konvensional

---

## Arsitektur Teknis

```
┌─────────────────────────────────────────────────────────┐
│                    RIALO QRIS PAY                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Frontend  │───▶│  Middleware   │───▶│ Rialo SVM    │  │
│  │ Next.js   │    │  Express.js  │    │ (Blockchain)  │  │
│  │ React/TS  │    │  REST API    │    │ Anchor/Rust   │  │
│  └──────────┘    └──────────────┘    └──────────────┘  │
│       │                 │                    │          │
│       │           ┌─────┴──────┐      ┌─────┴──────┐  │
│       │           │ Xendit API │      │ PDA Escrow  │  │
│       │           │ (QRIS sim) │      │ (On-chain)  │  │
│       │           └────────────┘      └────────────┘  │
│       │                                                │
│  ┌────┴──────────────────────────────────────────────┐ │
│  │              Solana Wallet Adapter                 │ │
│  │         (Phantom, Backpack, Solflare)              │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Teknologi | Fungsi |
|-------|-----------|--------|
| **Smart Contract** | Rust, Anchor Framework | PDA-based escrow, on-chain payment logic |
| **Middleware API** | Node.js, Express, TypeScript | Currency conversion, QRIS simulation, webhook handler |
| **Frontend** | Next.js 16, React, TypeScript, CSS Modules | UI/UX, wallet integration, QR scanner |
| **Blockchain** | Rialo Network (SVM / Solana-compatible) | Transaction settlement, state management |
| **Payment Gateway** | Xendit API (sandbox mode) | QRIS code generation & settlement simulation |

---

## Status Pengembangan

| Komponen | Status | Keterangan |
|----------|--------|------------|
| Smart Contract (Anchor) | ✅ Selesai | PDA escrow, fund locking, release mechanism |
| Middleware API | ✅ Selesai | 7 endpoint REST, rate conversion, mock payment |
| Frontend UI | ✅ Selesai | Landing page, wallet connect, QR scanner, payment flow |
| E2E Test Flow | ✅ Verified | Initiate → Simulate → Status Check |
| Xendit Live Integration | 🔄 Pending | Menunggu production API key |
| Mainnet Deployment | 🔄 Pending | Saat ini di Devnet untuk testing |
| Mobile Responsive | ✅ Selesai | 3 breakpoints (768px, 480px, 360px) |
| PWA Support | ✅ Selesai | Installable via browser (Add to Home Screen) |

**Catatan:** Project ini masih dalam tahap pengembangan (MVP/prototype). Sebelumnya sempat dikembangkan di repository Rialo namun dipindahkan ke repository terpisah untuk fokus dan modularitas. Saat ini menggunakan **Solana Devnet** (testnet) dan **Xendit Sandbox** — belum menggunakan uang asli.

---

## Kompetensi yang Dikembangkan

Melalui project ini, berikut skill engineering yang sedang dan sudah saya kembangkan:

### Backend & Infrastructure
- **Smart contract development** dengan Rust dan Anchor Framework
- **REST API design** dengan Express.js dan TypeScript
- **Security patterns**: PDA-based escrow, webhook signature verification, rate limiting
- **Environment management**: `.env` separation, secret handling, `.gitignore` best practices

### Frontend & UX
- **Modern React** dengan Next.js 16 (App Router, Turbopack)
- **Responsive design** mobile-first approach dengan CSS Modules
- **Wallet integration** menggunakan Solana Wallet Adapter
- **Camera API** untuk QR code scanning

### DevOps & Deployment
- **Version control** dengan Git dan GitHub
- **Static site deployment** (Netlify configuration)
- **Cloud infrastructure** (AWS EC2 setup untuk VPS development)
- **CI/CD awareness** — Netlify auto-deploy dari GitHub

### Domain Knowledge
- **Payment system architecture** — understanding QRIS flow, settlement process
- **Blockchain fundamentals** — SVM, PDAs, transaction lifecycle
- **Financial compliance** — awareness of BI regulations, KYC/AML considerations

---

## Roadmap Selanjutnya

| Phase | Target | Timeline |
|-------|--------|----------|
| **Phase 1** (Current) | MVP prototype, E2E flow verified | ✅ Done |
| **Phase 2** | Xendit live integration, security audit | Q3 2026 |
| **Phase 3** | Mainnet deployment, real merchant testing | Q4 2026 |
| **Phase 4** | Mobile app (React Native / PWA), multi-currency | 2027 |

---

## Repository & Demo

- **GitHub**: [github.com/Khoerulwisnupirdaus/Qrispay-project](https://github.com/Khoerulwisnupirdaus/Qrispay-project)
- **Network**: Rialo SVM Devnet (Solana-compatible testnet)
- **Status**: Development / Prototype — tidak menggunakan dana riil

---

## Penutup

Project ini adalah inisiatif pengembangan skill pribadi yang saya jalankan di luar jam kerja. Tujuannya bukan untuk profit komersial, melainkan untuk:

1. **Membangun portfolio teknis** yang menunjukkan kemampuan full-stack engineering
2. **Memperdalam pemahaman** tentang payment infrastructure dan distributed systems
3. **Mengikuti perkembangan teknologi** di bidang fintech dan blockchain yang sedang berkembang pesat

Saya terbuka untuk berdiskusi lebih lanjut mengenai aspek teknis atau strategis dari project ini.

---

*Disusun oleh: **wzscarlet** (Khoirul Wisnu Pirdaus)*
*Terakhir diperbarui: Mei 2026*
