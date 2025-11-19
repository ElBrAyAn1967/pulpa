import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // TypeScript configuration for build
  typescript: {
    // Ignore type errors during build (only for Vercel deployment issues)
    ignoreBuildErrors: false,
  },

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

    // Exclude envio directory from compilation
    config.module.rules.push({
      test: /envio\//,
      loader: 'ignore-loader',
    });

    // Ignore optional React Native dependencies that aren't needed for web
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    // Ignore missing optional dependencies warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/pino/ },
      { module: /envio\// },
      /Can't resolve '@react-native-async-storage\/async-storage'/,
      /Can't resolve 'pino-pretty'/,
    ];

    return config;
  },

  // Transpile problematic packages
  transpilePackages: ['@rainbow-me/rainbowkit', '@walletconnect/ethereum-provider'],
};

export default nextConfig;
