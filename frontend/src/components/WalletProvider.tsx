"use client";

/**
 * Solana Wallet Provider
 *
 * Wraps the app with Solana wallet adapter context.
 * Supports Phantom and Backpack wallets on Devnet.
 */

import React, { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

/**
 * SolanaWalletProvider component
 *
 * Provides Solana wallet connection context to the entire app.
 * Uses Devnet for the MVP phase.
 */
export default function SolanaWalletProvider({
  children,
}: SolanaWalletProviderProps) {
  // Use Devnet for development/simulation
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Only include Phantom and Backpack wallets
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
