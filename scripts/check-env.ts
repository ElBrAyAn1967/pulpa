#!/usr/bin/env bun
/**
 * Environment Variable Validation Script
 *
 * Checks that all required environment variables are properly configured
 * Run with: bun run scripts/check-env.ts
 */

type EnvCheck = {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
};

const ENV_CHECKS: EnvCheck[] = [
  // Critical Blockchain Variables
  {
    name: 'TREASURY_PRIVATE_KEY',
    required: true,
    description: 'Treasury wallet private key (MINTER role)',
    validator: (val) => val.startsWith('0x') && val.length === 66,
    errorMessage: 'Must be a valid private key (0x + 64 hex characters)',
  },
  {
    name: 'NEXT_PUBLIC_TOKEN_ADDRESS',
    required: true,
    description: '$PULPA token contract address',
    validator: (val) => /^0x[a-fA-F0-9]{40}$/.test(val),
    errorMessage: 'Must be a valid Ethereum address',
  },
  {
    name: 'NEXT_PUBLIC_CHAIN_ID',
    required: true,
    description: 'Chain ID (10 for Optimism)',
    validator: (val) => val === '10' || val === '11155420',
    errorMessage: 'Must be 10 (Optimism) or 11155420 (Optimism Sepolia)',
  },
  {
    name: 'NEXT_PUBLIC_OPTIMISM_RPC_URL',
    required: true,
    description: 'Public RPC URL for Optimism',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    errorMessage: 'Must be a valid HTTP(S) URL',
  },
  {
    name: 'OPTIMISM_RPC_URL',
    required: true,
    description: 'Server-side RPC URL for Optimism',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    errorMessage: 'Must be a valid HTTP(S) URL',
  },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validator: (val) => val.startsWith('postgresql://') && val.includes('sslmode=require'),
    errorMessage: 'Must be a valid PostgreSQL URL with sslmode=require',
  },

  // Authentication
  {
    name: 'AUTH_SECRET',
    required: true,
    description: 'NextAuth secret key',
    validator: (val) => val.length >= 32,
    errorMessage: 'Must be at least 32 characters long',
  },
  {
    name: 'AUTH_URL',
    required: true,
    description: 'Application base URL',
    validator: (val) => val.startsWith('http://') || val.startsWith('https://'),
    errorMessage: 'Must be a valid HTTP(S) URL',
  },

  // Web3 Infrastructure
  {
    name: 'NEXT_PUBLIC_DYNAMIC_API_KEY',
    required: true,
    description: 'Dynamic.xyz API key',
  },
  {
    name: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    required: false,
    description: 'WalletConnect project ID (optional)',
  },

  // Optional
  {
    name: 'GOOGLE_GEMINI_API_KEY',
    required: false,
    description: 'Google Gemini API key (optional)',
  },
  {
    name: 'NEXT_PUBLIC_DISTRIBUTION_AMOUNT',
    required: false,
    description: 'Token amount per distribution',
    validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
    errorMessage: 'Must be a positive number',
  },
  {
    name: 'RATE_LIMIT_NFC_PER_HOUR',
    required: false,
    description: 'Max distributions per NFC per hour',
    validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
    errorMessage: 'Must be a positive number',
  },
  {
    name: 'RATE_LIMIT_RECIPIENT_TOTAL',
    required: false,
    description: 'Max distributions per recipient (total)',
    validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
    errorMessage: 'Must be a positive number',
  },
];

function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n');

  let hasErrors = false;
  let hasWarnings = false;

  for (const check of ENV_CHECKS) {
    const value = process.env[check.name];

    // Check if required variable is missing
    if (check.required && !value) {
      console.error(`❌ ${check.name}: MISSING (REQUIRED)`);
      console.error(`   Description: ${check.description}`);
      hasErrors = true;
      continue;
    }

    // Check if optional variable is missing
    if (!check.required && !value) {
      console.warn(`⚠️  ${check.name}: Not set (optional)`);
      console.warn(`   Description: ${check.description}`);
      hasWarnings = true;
      continue;
    }

    // Validate value format
    if (value && check.validator && !check.validator(value)) {
      console.error(`❌ ${check.name}: INVALID FORMAT`);
      console.error(`   Description: ${check.description}`);
      console.error(`   Error: ${check.errorMessage || 'Invalid format'}`);
      hasErrors = true;
      continue;
    }

    // Success
    const displayValue = check.name.includes('SECRET') || check.name.includes('PRIVATE_KEY')
      ? '***HIDDEN***'
      : check.name.includes('PASSWORD')
      ? '***HIDDEN***'
      : value!.length > 50
      ? value!.substring(0, 30) + '...'
      : value!;

    console.log(`✅ ${check.name}: ${displayValue}`);
  }

  console.log('\n');

  // Summary
  if (hasErrors) {
    console.error('❌ Environment check FAILED - missing required variables');
    console.error('   Copy .env.example to .env and fill in the required values');
    process.exit(1);
  }

  if (hasWarnings) {
    console.warn('⚠️  Environment check completed with warnings');
    console.warn('   Some optional variables are not set');
  } else {
    console.log('✅ All environment variables configured correctly!');
  }

  // Additional checks
  console.log('\n🔍 Additional validation...\n');

  // Check if in production
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Running in PRODUCTION mode');

    // Production-specific checks
    if (process.env.AUTH_URL?.includes('localhost')) {
      console.error('❌ AUTH_URL still points to localhost in production!');
      hasErrors = true;
    }

    if (!process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL?.includes('alchemy') &&
        !process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL?.includes('infura') &&
        !process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL?.includes('quicknode')) {
      console.warn('⚠️  Using public RPC in production (recommend private RPC)');
    }
  } else {
    console.log('✅ Running in DEVELOPMENT mode');
  }

  console.log('\n');

  if (hasErrors) {
    process.exit(1);
  }
}

// Run checks
checkEnvironment();
