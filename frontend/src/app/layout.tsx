import type { Metadata, Viewport } from "next";
import "./globals.css";
import SolanaWalletProvider from "@/components/WalletProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#06060F",
};

export const metadata: Metadata = {
  title: "Rialo QRIS Pay — Neofinance Payments on Rialo Network",
  description:
    "Pay any merchant in Indonesia using USDC stablecoin. Sub-second on-chain settlement, near-zero fees, and native real-world connectivity — powered by Rialo Network (Subzero Labs).",
  keywords: ["QRIS", "Rialo", "neofinance", "USDC", "stablecoin", "payment", "dApp", "Indonesia", "Subzero Labs", "SVM", "Layer-1"],
  icons: {
    icon: "/rialo-icon.png",
    apple: "/rialo-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QRIS Pay",
  },
};

/**
 * Root Layout
 *
 * Wraps the entire application with:
 * - Solana wallet provider (for wallet connection)
 * - Global CSS styles
 * - HTML metadata + mobile viewport + PWA manifest
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
