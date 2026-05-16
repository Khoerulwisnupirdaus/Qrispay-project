import type { Metadata } from "next";
import "./globals.css";
import SolanaWalletProvider from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Rialo QRIS Pay — Neofinance Payments on Rialo Network",
  description:
    "Pay any merchant in Indonesia using USDC stablecoin. QRIS settlement with 50ms finality, zero gas fees, and native real-world connectivity — powered by Rialo Network (Subzero Labs).",
  keywords: ["QRIS", "Rialo", "neofinance", "USDC", "stablecoin", "payment", "dApp", "Indonesia", "Subzero Labs", "SVM", "Layer-1"],
};

/**
 * Root Layout
 *
 * Wraps the entire application with:
 * - Solana wallet provider (for wallet connection)
 * - Global CSS styles
 * - HTML metadata
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
