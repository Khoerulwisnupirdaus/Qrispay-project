"use client";

/**
 * Privy Auth + Wallet Provider
 *
 * Wraps the app with Privy for:
 * - Social login (Google, Email)
 * - Auto-generated embedded Solana wallets
 * - External wallet support (Phantom, Backpack via standard wallet adapter)
 */

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export default function SolanaWalletProvider({
  children,
}: SolanaWalletProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    console.error("NEXT_PUBLIC_PRIVY_APP_ID is not set");
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["google", "email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#A9DCD3",
          logo: "/rialo-icon.png",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
          solana: {
            createOnLogin: "all-users",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
