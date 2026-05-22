# Rialo QRIS Pay — Project Context
> Catatan ini untuk model/session baru supaya ga miss konteks.
> Owner: **wzscarlet** (Khoirul Wisnu Pirdaus)
> Last updated: 2026-05-23

---

## Siapa Owner

- Nama: **wzscarlet** (Khoirul Wisnu Pirdaus)
- Role: AI-native solo builder
- GitHub: github.com/Khoerulwisnupirdaus
- Twitter/X: x.com/Wisnu100802
- Bahasa: Indonesia (chat pakai bahasa Indonesia casual)
- Style: To the point, ga suka basa-basi, ga suka over-acting

## Preferensi Owner

- **JANGAN buka browser** tanpa diminta — owner lebih suka cek sendiri
- **JANGAN push ke GitHub** tanpa diminta — tanya dulu kalau bukan code change
- **JANGAN over-acting** — lakukan sesuai yang diminta, ga lebih
- Suka desain **premium/clean** — benci vibecoding look (emoji icons, generic cards)
- Prefer **file teks** buat dokumen yang di-share ke orang (bukan artifact/markdown)
- Build log/presentasi dalam **Bahasa Indonesia**

---

## Project Overview

**Rialo QRIS Pay** = Neofinance payment dApp yang memungkinkan user bayar merchant Indonesia pakai USDC lewat QRIS (standar QR nasional Bank Indonesia). Berjalan di Rialo Network.

## Tech Stack

| Layer | Tech | Path |
|---|---|---|
| Smart Contract | Rust, Anchor Framework | `anchor/programs/qris-payment/` |
| Middleware API | Express.js, TypeScript | `middleware-api/` |
| Frontend | Next.js 16, React, TypeScript, CSS Modules | `frontend/` |
| Blockchain | Rialo Network (SVM-compatible) | Devnet |
| Payment Gateway | Xendit API (sandbox mode) | via middleware |

## Architecture Flow

```
User wallet (Phantom/Backpack)
    → Frontend (Next.js) — scan QRIS
    → Middleware API (Express) — rate conversion USDC→IDR
    → Rialo SVM — smart contract PDA escrow lock/release
    → Xendit API — QRIS settlement to merchant
```

---

## Rialo Network — FAKTA YANG SUDAH DIVERIFIKASI

> ⚠️ Jangan pakai klaim yang belum diverifikasi

| Klaim | Status | Detail |
|---|---|---|
| L1 blockchain by Subzero Labs | ✅ Benar | |
| SVM compatible | ✅ Benar | Solana VM, bisa pakai Anchor/Rust |
| Sub-second finality | ✅ Benar | DAG-based consensus |
| Near-zero fees | ✅ Benar | "Stable, predictable fees" |
| Native HTTPS calls | ✅ Benar | Smart contract bisa call API tanpa oracle |
| Event-driven execution | ✅ Benar | Contract bisa sleep/wake on trigger |
| RISC-V support | ✅ Benar | Selain SVM |
| $20M seed by Pantera | ✅ Benar | + Coinbase Ventures, Hashed |
| "Rialo Cruise" (gasless) | ❌ TIDAK ADA | Istilah ini ga ada di docs resmi |
| "50ms finality" | ❌ Terlalu spesifik | Pakai "sub-second" |

---

## Deployment

| Platform | URL | Detail |
|---|---|---|
| Frontend (Netlify) | https://qrispaydev.netlify.app | Auto-deploy dari GitHub main |
| GitHub | github.com/Khoerulwisnupirdaus/Qrispay-project | Public repo |
| Middleware API | Belum deployed | Rencana: AWS EC2 VPS via PM2 + Nginx |

### Netlify Config
- Build command: `npm run build` (dari `frontend/`)
- Publish dir: `frontend/out`
- `next.config.ts` set `output: 'export'` untuk static export
- Webpack fallbacks untuk Node.js polyfills (Solana libs)

### Environment Variables (JANGAN commit)
- `XENDIT_SECRET_KEY` — di middleware .env
- `NEXT_PUBLIC_API_URL` — harus di-set di Netlify project settings

---

## Design System — Current (v4)

- **Theme**: Light mode, lavender background (`#D4D0E8`)
- **Accent**: Purple (`#7C3AED` → `#A78BFA`)
- **Cards**: Bento grid — dark primary, purple-tint, teal-tint, white
- **Icons**: Custom inline SVG components (BUKAN emoji)
- **Font**: Inter (body), Space Grotesk (display), JetBrains Mono (mono)
- **Logo**: Generated 3D purple R mark (PNG di `/public/rialo-icon.png`)
- **Nav**: Floating frosted glass bar, rounded corners
- **Inspired by**: tria.so — clean, minimal, bold sections

---

## File-File Penting

| File | Fungsi |
|---|---|
| `frontend/src/app/page.tsx` | Landing page + connected idle screen |
| `frontend/src/app/page.module.css` | Page styles (bento grid, hero, steps) |
| `frontend/src/app/globals.css` | Design system tokens + utilities |
| `frontend/src/components/Header.tsx` | Nav bar + wallet + logo |
| `frontend/src/components/QRScanner.tsx` | Camera QRIS scanner + manual input |
| `frontend/src/components/PaymentFlow.tsx` | Payment confirmation + processing |
| `frontend/src/app/layout.tsx` | Root layout + PWA meta |
| `frontend/public/manifest.json` | PWA manifest |
| `frontend/next.config.ts` | Static export + polyfills |
| `netlify.toml` | Netlify build config |
| `PRESENTASI_QRIS_PAY.txt` | Presentasi buat Rialo (Bahasa Indonesia) |

---

## Known Issues & Status

- [ ] QR scanner: perlu test lagi di warung setelah fix TLV parser + wider scan area
- [ ] Xendit integration: masih sandbox, belum punya production API key
- [ ] Middleware API: belum deployed ke VPS (masih localhost)
- [ ] PWA: manifest ada tapi belum test install di Android/iOS
- [ ] Hydration warning: WalletMultiButton SSR mismatch (cosmetic, not critical)

---

## Riwayat Keputusan

1. **Dark → Light mode** — owner minta mirip tria.so
2. **Emoji → SVG icons** — owner bilang emoji = vibecoding
3. **Generic cube logo → 3D purple R PNG** — owner pilih yang 3D
4. **50ms → sub-second** — dikoreksi setelah riset Rialo docs
5. **Rialo Cruise dihapus** — istilah ga resmi
6. **Native HTTPS calls ditambah** — fitur real Rialo yang relevan

---

## Konten & External

- **ARC Discord bio** sudah dibuat (builder intro format)
- **X thread** sudah disiapkan (vibecoder angle + 6 tweet thread)
- **Presentasi** file teks di `PRESENTASI_QRIS_PAY.txt`
- Semua konten positioning: "AI-native solo builder shipping real-world use case on Rialo"
