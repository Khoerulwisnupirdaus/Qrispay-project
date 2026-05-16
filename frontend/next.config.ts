import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * - output: 'export' → static HTML build for Netlify/Vercel/any CDN
 * - turbopack resolveAlias → dev mode Node.js stubs
 * - webpack fallback → production build Node.js stubs
 */
const nextConfig: NextConfig = {
  output: "export",

  turbopack: {
    resolveAlias: {
      // Stub Node.js built-ins for browser compatibility with Solana (dev mode)
      fs: { browser: "./src/stubs/empty.ts" },
      os: { browser: "./src/stubs/empty.ts" },
      path: { browser: "./src/stubs/empty.ts" },
    },
  },

  // Production build: webpack fallbacks for Solana's Node.js imports
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    return config;
  },

  reactStrictMode: true,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
