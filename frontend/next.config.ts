import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * Uses Turbopack (default in Next.js 16) with resolve aliases
 * to stub out Node.js built-ins that Solana web3.js references.
 */
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // Stub Node.js built-ins for browser compatibility with Solana
      fs: { browser: "./src/stubs/empty.ts" },
      os: { browser: "./src/stubs/empty.ts" },
      path: { browser: "./src/stubs/empty.ts" },
    },
  },

  reactStrictMode: true,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
