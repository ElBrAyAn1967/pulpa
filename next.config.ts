import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Empty turbopack config to silence the error (we're using webpack for builds)
  turbopack: {},

  // Webpack configuration to exclude test files from thread-stream
  webpack: (config, { isServer }) => {
    // Exclude test files from thread-stream package
    config.module.rules.push({
      test: /node_modules\/thread-stream\/.*\.(test|spec)\.(js|ts)$/,
      loader: 'ignore-loader',
    });

    // Exclude test directories
    config.module.rules.push({
      test: /node_modules\/thread-stream\/test\//,
      loader: 'ignore-loader',
    });

    return config;
  },

  // Transpile problematic packages
  transpilePackages: ['@rainbow-me/rainbowkit', '@walletconnect/ethereum-provider'],
};

export default nextConfig;
