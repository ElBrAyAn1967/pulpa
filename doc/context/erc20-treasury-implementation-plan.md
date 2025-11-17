# ERC20 Token Distribution Treasury - Implementation Plan

## Overview
This document provides a comprehensive plan to replicate Patrimo's treasury service flow for onboarding new users with any ERC20 token distribution. The system automatically funds new user wallets with tokens and gas upon signup with a referral code.

**Reference Implementation**: [Patrimo Treasury Service](../src/services/treasury.ts)

---

## Architecture Summary

### Core Components
1. **TreasuryService** - Server-side singleton managing token distribution
2. **API Routes** - REST endpoints for funding operations
3. **Onboarding Hook** - Client-side coordination
4. **Helper Functions** - User-facing utilities
5. **Persistent Storage** - Deduplication and history tracking

### Flow Diagram
```
User Signs Up with Referral Code
         ↓
Privy Creates Embedded Wallet
         ↓
useOnboarding Hook Detects New User
         ↓
Call /api/treasury/welcome
         ↓
TreasuryService Validates & Checks History
         ↓
Send Token + ETH Concurrently (Promise.allSettled)
         ↓
Record in .funding-history.json
         ↓
Update Database (receivedFunding: true)
         ↓
Show Success Notification
```

---

## Implementation Steps

### Step 1: Treasury Service Setup

#### 1.1 Create Treasury Service Class
**File**: `src/services/treasury.ts`

**Key Features**:
- Singleton pattern for single instance management
- Persistent funding history (`.funding-history.json`)
- In-memory pending transactions tracking
- Concurrent token + gas distribution
- Retry logic with exponential backoff
- Nonce management for transaction ordering

**Core Methods**:
```typescript
class TreasuryService {
  // Send ERC20 tokens to recipient
  async sendWelcomeBonus(
    recipientAddress: Address,
    amount: string,
    retries: number = 3
  ): Promise<{ success: boolean; hash?: string; error?: string }>

  // Send ETH for gas fees
  async sendGasFunds(
    recipientAddress: Address,
    ethAmount: string = '0.001',
    retries: number = 3
  ): Promise<{ success: boolean; hash?: string; error?: string }>

  // Send both token + ETH concurrently
  async sendCompleteWelcomePackage(
    recipientAddress: Address,
    tokenAmount: string,
    ethAmount: string
  ): Promise<{
    success: boolean;
    tokenHash?: string;
    ethHash?: string;
    error?: string;
    results: { token: {...}, eth: {...} }
  }>

  // Check treasury token balance
  async checkTreasuryBalance(): Promise<bigint>

  // Check treasury ETH balance
  async checkTreasuryEthBalance(): Promise<bigint>

  // Get both balances formatted
  async getTreasuryBalances(): Promise<{
    token: { raw: bigint; formatted: string };
    eth: { raw: bigint; formatted: string };
  }>

  // Estimate gas for transaction
  async estimateGas(
    recipientAddress: Address,
    amount: string
  ): Promise<bigint>

  // Get treasury address
  getTreasuryAddress(): Address
}

export const getTreasuryService = (): TreasuryService;
```

**Critical Implementation Details**:

1. **Deduplication Strategy** (3 layers):
   ```typescript
   // Layer 1: Persistent file-based history
   function wasAlreadyFunded(address: string, amount: string): boolean {
     const history = loadFundingHistory();
     return history.some(record =>
       record.address.toLowerCase() === address.toLowerCase() &&
       record.amount === amount
     );
   }

   // Layer 2: In-memory pending transactions
   const pendingTransactions = new Set<string>();

   // Layer 3: Database flag (receivedFunding)
   // Checked in API route via account record
   ```

2. **Transaction Key Format**:
   ```typescript
   // For tokens
   const transactionKey = `${recipientAddress.toLowerCase()}-${amount}`;

   // For ETH
   const transactionKey = `eth-${recipientAddress.toLowerCase()}-${ethAmount}`;
   ```

3. **Funding History Schema**:
   ```typescript
   interface FundingRecord {
     address: string;        // Lowercase recipient address
     amount: string;         // Token or ETH amount
     hash: string;           // Transaction hash (prefix 'eth-' for gas)
     timestamp: number;      // Unix timestamp
     userId?: string;        // Optional user ID
   }
   ```

4. **Nonce Management**:
   ```typescript
   // Get pending nonce to prevent race conditions
   const nonce = await this.publicClient.getTransactionCount({
     address: this.account.address,
     blockTag: 'pending'
   });
   ```

5. **Concurrent Execution**:
   ```typescript
   // Send both token and ETH in parallel
   const [tokenResult, ethResult] = await Promise.allSettled([
     this.sendWelcomeBonus(recipientAddress, tokenAmount),
     this.sendGasFunds(recipientAddress, ethAmount)
   ]);
   ```

#### 1.2 Configuration
**File**: `src/config/index.ts`

```typescript
export const appConfig = {
  treasury: {
    fundingAmount: '100',      // Default token amount
    gasFundingAmount: '0.001', // Default ETH amount
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  tokens: {
    yourToken: {
      address: '0x...' as Address,
      symbol: 'TKN',
      decimals: 18, // Adjust based on your token
      name: 'Your Token',
    }
  },
  chains: {
    primary: arbitrum, // Or your preferred chain
  }
};
```

#### 1.3 Environment Variables
**File**: `.env.local`

```bash
# Treasury Configuration
TREASURY_PRIVATE_KEY=0x...              # Private key for treasury wallet
NEXT_PUBLIC_ALCHEMY_API_KEY=...         # RPC provider API key (optional)

# Token Configuration
NEXT_PUBLIC_TOKEN_ADDRESS=0x...         # Your ERC20 token address
NEXT_PUBLIC_CHAIN_ID=42161              # Chain ID (Arbitrum = 42161)

# Database
DATABASE_URL=postgresql://...           # PostgreSQL connection string
```

**Security Notes**:
- Treasury private key should be in production secrets manager (AWS Secrets Manager, Vault, etc.)
- Use separate treasury wallet with limited funds
- Never commit `.env.local` to version control

---

### Step 2: API Routes

#### 2.1 Welcome Package Endpoint
**File**: `src/app/api/treasury/welcome/route.ts`

**Features**:
- Rate limiting (1 welcome package per address per 24 hours)
- Balance validation before sending
- Duplicate prevention via service layer
- Detailed error responses

**Request Schema**:
```typescript
POST /api/treasury/welcome
Content-Type: application/json

{
  "recipient": "0x...",        // Required: recipient address
  "tokenAmount": "100",        // Optional: default from config
  "ethAmount": "0.001"         // Optional: default from config
}
```

**Response Schema**:
```typescript
{
  "success": true,
  "tokenHash": "0x...",        // Token transfer transaction hash
  "ethHash": "0x...",          // ETH transfer transaction hash
  "tokenAmount": "100",
  "ethAmount": "0.001",
  "recipient": "0x...",
  "balances": {
    "token": { "raw": "...", "formatted": "100.00" },
    "eth": { "raw": "...", "formatted": "0.0010" }
  },
  "message": "Successfully sent welcome package",
  "results": {
    "token": { "success": true, "hash": "0x..." },
    "eth": { "success": true, "hash": "0x..." }
  }
}
```

**Rate Limiting Implementation**:
```typescript
interface WelcomeRateLimitEntry {
  requests: number;
  resetTime: number;
}

const welcomeRateLimitMap = new Map<string, WelcomeRateLimitEntry>();
const WELCOME_RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const MAX_WELCOME_REQUESTS_PER_DAY = 1;

function checkWelcomeRateLimit(address: string): {
  allowed: boolean;
  resetTime?: number
} {
  const now = Date.now();
  const key = address.toLowerCase();
  const entry = welcomeRateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    welcomeRateLimitMap.set(key, {
      requests: 1,
      resetTime: now + WELCOME_RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  if (entry.requests >= MAX_WELCOME_REQUESTS_PER_DAY) {
    return { allowed: false, resetTime: entry.resetTime };
  }

  entry.requests += 1;
  return { allowed: true };
}
```

#### 2.2 Treasury Status Endpoint
**File**: `src/app/api/treasury/status/route.ts`

```typescript
GET /api/treasury/status

Response:
{
  "success": true,
  "treasury": {
    "address": "0x...",
    "balance": "10000.00 TKN",
    "ethBalance": "1.2500 ETH",
    "isReady": true
  }
}
```

---

### Step 3: Client-Side Integration

#### 3.1 Onboarding Hook
**File**: `src/hooks/useOnboarding.ts`

**Purpose**: Detect new users and coordinate funding flow

**Features**:
- Wallet readiness detection with retry
- Database-backed funding status check
- Referral code management
- Retry funding capability

**Key Logic**:
```typescript
export function useOnboarding() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const [state, setState] = useState<OnboardingState>({
    isProcessing: false,
    isFunded: false,
    error: null,
    referralCode: null,
  });

  useEffect(() => {
    // Wait for Privy auth and wallet creation
    if (!ready || !authenticated || !user) return;

    // Check funding status from database
    const checkFundingStatus = async (attempt = 1) => {
      const walletAddress = wallets.find(w =>
        w.walletClientType === 'privy' || w.connectorType === 'embedded'
      )?.address;

      if (!walletAddress) {
        // Retry with exponential backoff
        if (attempt < maxAttempts) {
          setTimeout(() => checkFundingStatus(attempt + 1), delay);
        }
        return;
      }

      // Check database for funding status
      const response = await fetch(`/api/accounts/create?appWallet=${walletAddress}`);
      const result = await response.json();

      if (result.account?.receivedFunding) {
        setState(prev => ({ ...prev, isFunded: true }));
      }
    };

    checkFundingStatus();
  }, [ready, authenticated, user, wallets]);

  const retryFunding = async () => { /* ... */ };

  return { isProcessing, isFunded, error, retryFunding };
}
```

#### 3.2 Helper Functions
**File**: `src/utils/treasury-helpers.ts`

```typescript
// Fund new user (called from auth flow)
export async function fundNewUser(userAddress: Address): Promise<boolean> {
  const toastId = toast.loading('Enviando paquete de bienvenida...');

  try {
    // Client-side deduplication check
    const fundedUsers = JSON.parse(localStorage.getItem('fundedUsers') || '[]');
    if (fundedUsers.includes(userAddress.toLowerCase())) {
      toast.info('Usuario ya financiado');
      return true;
    }

    // Call API
    const response = await fetch('/api/treasury/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: userAddress,
        tokenAmount: '100',
        ethAmount: '0.001',
      }),
    });

    const result = await response.json();

    if (result.success) {
      markUserAsFunded(userAddress);
      toast.success('¡Paquete de bienvenida enviado!');
      return true;
    }

    // Handle rate limiting
    if (response.status === 429) {
      toast.warning('Límite de velocidad alcanzado');
      return false;
    }

    toast.error('Error al enviar fondos');
    return false;

  } catch (error) {
    toast.error('Error inesperado');
    return false;
  }
}

// Check treasury status
export async function checkTreasuryStatus() {
  const response = await fetch('/api/treasury/status');
  return await response.json();
}

// Check if wallet eligible for funding
export async function isWalletEligibleForFunding(
  userAddress: Address
): Promise<boolean> {
  const fundedUsers = JSON.parse(localStorage.getItem('fundedUsers') || '[]');
  return !fundedUsers.includes(userAddress.toLowerCase());
}

// Mark user as funded (localStorage)
export function markUserAsFunded(userAddress: Address): void {
  const fundedUsers = JSON.parse(localStorage.getItem('fundedUsers') || '[]');
  fundedUsers.push(userAddress.toLowerCase());
  localStorage.setItem('fundedUsers', JSON.stringify(fundedUsers));
}
```

#### 3.3 Authentication Integration
**File**: `src/components/buttons/auth-button-privy.tsx`

**Funding Trigger Point**:
```typescript
const { login } = usePrivy({
  onComplete: async ({ user, isNewUser }) => {
    if (isNewUser) {
      const referralCode = localStorage.getItem('patrimo_referral_code');

      if (referralCode) {
        // Get embedded wallet address
        const wallet = wallets.find(w => w.walletClientType === 'privy');

        if (wallet) {
          // Trigger funding via account creation API
          // (API route handles funding if referral code is valid)
          await fetch('/api/accounts/create', {
            method: 'POST',
            body: JSON.stringify({
              username: user.email?.address,
              appWallet: wallet.address,
              referralCode
            })
          });
        }
      }
    }
  }
});
```

---

### Step 4: Database Schema

#### 4.1 Prisma Schema
**File**: `prisma/schema.prisma`

```prisma
model Account {
  id              String    @id @default(cuid())
  username        String    @unique
  appWallet       String    @unique
  email           String?
  referralCode    String?
  receivedFunding Boolean   @default(false)  // Funding status flag
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  referral        Referral? @relation(fields: [referralCode], references: [code])
  onboardingForm  OnboardingForm?
}

model Referral {
  id          String    @id @default(cuid())
  code        String    @unique
  usageCount  Int       @default(0)
  maxUses     Int       @default(1)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  accounts    Account[]
}

model OnboardingForm {
  id              String   @id @default(cuid())
  accountId       String   @unique
  riskScore       Float
  formData        Json
  createdAt       DateTime @default(now())

  account         Account  @relation(fields: [accountId], references: [id])
}
```

#### 4.2 Database Service
**File**: `src/services/database.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAccountWithFunding(
  username: string,
  appWallet: string,
  email?: string,
  referralCode?: string
) {
  // Check if account exists
  const existing = await prisma.account.findUnique({
    where: { appWallet }
  });

  if (existing) {
    return { account: existing, isNew: false };
  }

  // Validate referral code
  let shouldFund = false;
  if (referralCode) {
    const referral = await prisma.referral.findUnique({
      where: { code: referralCode }
    });

    if (referral?.isActive && referral.usageCount < referral.maxUses) {
      shouldFund = true;
    }
  }

  // Create account
  const account = await prisma.account.create({
    data: {
      username,
      appWallet,
      email,
      referralCode,
      receivedFunding: false, // Will be updated after funding
    }
  });

  return { account, isNew: true, shouldFund };
}

export async function markAccountAsFunded(appWallet: string) {
  return await prisma.account.update({
    where: { appWallet },
    data: { receivedFunding: true }
  });
}
```

---

### Step 5: Onboarding Flow

#### 5.1 Onboarding Page
**File**: `src/app/onboarding/page.tsx`

**Purpose**: Landing page for users with referral codes (e.g., from NFC tags)

**Features**:
- Parse referral code from URL (`?ref=CODE`)
- Validate referral code
- Store in localStorage for auth flow
- Display welcome message with bonus badge

**URL Format**:
```
https://yourapp.com/onboarding?ref=NFC001
```

**Key Implementation**:
```typescript
'use client'

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const { ready, authenticated } = usePrivy();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already authenticated
    if (ready && authenticated) {
      router.push('/dashboard');
      return;
    }

    // Parse and validate referral code
    const code = searchParams.get('ref');
    if (code) {
      const valid = appConfig.referralCodes.validate(code);
      if (valid) {
        setReferralCode(code);
        localStorage.setItem('patrimo_referral_code', code);
        toast.success('¡Código de referencia válido!');
      } else {
        toast.error('Código de referencia inválido');
      }
    }
  }, [searchParams, ready, authenticated]);

  return (
    <div className="onboarding-container">
      <h1>Welcome to YourApp</h1>

      {referralCode && (
        <Badge>🎁 100 TKN Welcome Bonus</Badge>
      )}

      <AuthButton>Create Account</AuthButton>
    </div>
  );
}
```

#### 5.2 Funding Status Component
**File**: `src/components/onboarding/FundingStatus.tsx`

**Purpose**: Display funding progress to user

```typescript
'use client'

export function FundingStatus() {
  const { isProcessing, isFunded, error, retryFunding } = useOnboarding();

  if (!isProcessing && !isFunded && !error) {
    return null;
  }

  return (
    <Card className="funding-status">
      {isProcessing && (
        <div>
          <Loader2 className="animate-spin" />
          <p>Processing welcome bonus...</p>
          <p className="text-sm">Sending 100 TKN to your account...</p>
        </div>
      )}

      {isFunded && (
        <div>
          <CheckCircle className="text-green-500" />
          <p>Bonus received!</p>
          <p className="text-sm">100 TKN deposited to your account</p>
        </div>
      )}

      {error && (
        <div>
          <XCircle className="text-destructive" />
          <p>Error processing bonus</p>
          <Button onClick={retryFunding}>Retry</Button>
        </div>
      )}
    </Card>
  );
}
```

---

## Testing Strategy

### Unit Tests

#### Treasury Service Tests
```typescript
// tests/services/treasury.test.ts
describe('TreasuryService', () => {
  test('should send tokens successfully', async () => {
    const treasury = getTreasuryService();
    const result = await treasury.sendWelcomeBonus(testAddress, '100');
    expect(result.success).toBe(true);
    expect(result.hash).toBeDefined();
  });

  test('should prevent duplicate funding', async () => {
    const treasury = getTreasuryService();

    // First funding should succeed
    await treasury.sendWelcomeBonus(testAddress, '100');

    // Second funding should fail
    const result = await treasury.sendWelcomeBonus(testAddress, '100');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already been funded');
  });

  test('should handle insufficient balance', async () => {
    const treasury = getTreasuryService();
    const result = await treasury.sendWelcomeBonus(testAddress, '999999');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });
});
```

### Integration Tests

#### API Route Tests
```typescript
// tests/api/treasury/welcome.test.ts
describe('/api/treasury/welcome', () => {
  test('should fund new user with valid request', async () => {
    const response = await fetch('/api/treasury/welcome', {
      method: 'POST',
      body: JSON.stringify({
        recipient: testAddress,
        tokenAmount: '100',
        ethAmount: '0.001'
      })
    });

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.tokenHash).toBeDefined();
    expect(result.ethHash).toBeDefined();
  });

  test('should enforce rate limiting', async () => {
    // First request
    await fetch('/api/treasury/welcome', {
      method: 'POST',
      body: JSON.stringify({ recipient: testAddress })
    });

    // Second request (should be rate limited)
    const response = await fetch('/api/treasury/welcome', {
      method: 'POST',
      body: JSON.stringify({ recipient: testAddress })
    });

    expect(response.status).toBe(429);
  });
});
```

### Manual Testing Checklist

#### Setup Phase
- [ ] Treasury wallet funded with tokens and ETH
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Referral codes seeded

#### Functional Testing
- [ ] New user with valid referral code receives tokens + ETH
- [ ] New user without referral code does NOT receive funding
- [ ] Existing user does NOT receive duplicate funding
- [ ] Rate limiting prevents multiple claims (24h window)
- [ ] Error handling for insufficient treasury balance
- [ ] Transaction retry logic works (network errors)
- [ ] Concurrent requests properly handled (no race conditions)

#### Edge Cases
- [ ] Multiple browser tabs open during funding
- [ ] Browser refresh during funding process
- [ ] Network disconnect mid-transaction
- [ ] Invalid wallet address handling
- [ ] Treasury out of funds scenario
- [ ] Gas price spike during transaction
- [ ] Nonce conflicts with concurrent operations

#### Monitoring
- [ ] Transaction hashes logged correctly
- [ ] Funding history file updated
- [ ] Database receivedFunding flag set
- [ ] Toast notifications appear properly
- [ ] Error messages are user-friendly

---

## Security Considerations

### Critical Security Measures

1. **Private Key Management**
   - ⚠️ **NEVER** commit private keys to version control
   - Use environment variables for development
   - Production: AWS Secrets Manager, HashiCorp Vault, or similar
   - Separate treasury wallet with limited funds (not your main wallet)

2. **Rate Limiting**
   - 24-hour window per address for welcome packages
   - In-memory + persistent tracking
   - Consider IP-based rate limiting for additional protection

3. **Deduplication** (3-layer system)
   - Persistent file-based history (survives restarts)
   - In-memory pending transactions (prevents concurrent duplicates)
   - Database flag (cross-service validation)

4. **Amount Validation**
   - Validate all amounts server-side
   - Check treasury balance before sending
   - Prevent negative or zero amounts
   - Cap maximum funding amounts

5. **Address Validation**
   - Verify address format (checksum validation)
   - Blacklist known bad actors
   - Consider geofencing for compliance

6. **Transaction Security**
   - Use nonce management to prevent race conditions
   - Implement gas price limits
   - Set reasonable timeout values
   - Monitor for unusual activity patterns

### Production Hardening

```typescript
// Additional security middleware
export async function verifyFundingEligibility(
  address: Address
): Promise<{ eligible: boolean; reason?: string }> {
  // Check blacklist
  const isBlacklisted = await checkBlacklist(address);
  if (isBlacklisted) {
    return { eligible: false, reason: 'Address blacklisted' };
  }

  // Check existing funding
  const alreadyFunded = wasAlreadyFunded(address, amount);
  if (alreadyFunded) {
    return { eligible: false, reason: 'Already funded' };
  }

  // Check rate limit
  const rateLimited = checkWelcomeRateLimit(address);
  if (!rateLimited.allowed) {
    return { eligible: false, reason: 'Rate limited' };
  }

  // Verify wallet age (prevent sybil attacks)
  const walletAge = await getWalletAge(address);
  if (walletAge < MIN_WALLET_AGE) {
    return { eligible: false, reason: 'Wallet too new' };
  }

  return { eligible: true };
}
```

---

## Monitoring & Alerting

### Key Metrics to Track

```typescript
// metrics.ts
export const treasuryMetrics = {
  // Funding operations
  totalFundingRequests: 0,
  successfulFundings: 0,
  failedFundings: 0,
  duplicateAttempts: 0,
  rateLimitedRequests: 0,

  // Treasury health
  tokenBalance: '0',
  ethBalance: '0',
  lowBalanceAlerts: 0,

  // Performance
  averageFundingTime: 0,
  concurrentRequests: 0,

  // Errors
  networkErrors: 0,
  nonceConflicts: 0,
  gasEstimationFailures: 0,
};

// Log to monitoring service (Datadog, New Relic, etc.)
export function logTreasuryMetrics() {
  console.log('[Metrics]', JSON.stringify(treasuryMetrics));
  // Send to monitoring service
}
```

### Alerts to Configure

1. **Low Balance Alert**
   - Trigger: Token balance < 1000 or ETH balance < 0.1
   - Action: Email/Slack notification to ops team

2. **Failed Transaction Alert**
   - Trigger: 3+ consecutive failed transactions
   - Action: Investigate network/contract issues

3. **Rate Limit Spike**
   - Trigger: 10+ rate limited requests in 1 hour
   - Action: Potential abuse investigation

4. **Duplicate Prevention**
   - Trigger: 5+ duplicate attempts detected
   - Action: Check for bot activity

### Dashboard Metrics

```typescript
// Admin dashboard endpoint
GET /api/admin/treasury/metrics

Response:
{
  "overview": {
    "totalFunded": 1250,
    "totalDistributed": "125000 TKN",
    "averageFundingTime": "15s",
    "successRate": "98.5%"
  },
  "treasury": {
    "tokenBalance": "50000 TKN",
    "ethBalance": "5.2500 ETH",
    "estimatedRemaining": 500 // users
  },
  "recent": {
    "last24h": 45,
    "last7d": 320,
    "last30d": 1250
  },
  "errors": {
    "rateLimited": 12,
    "duplicates": 5,
    "networkErrors": 2
  }
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review and audit all smart contract interactions
- [ ] Test on testnet with real transaction flows
- [ ] Set up monitoring and alerting
- [ ] Configure production secrets (treasury private key)
- [ ] Create separate treasury wallet with limited funds
- [ ] Document emergency procedures
- [ ] Set up backup treasury wallet

### Deployment

- [ ] Deploy database schema migrations
- [ ] Seed initial referral codes
- [ ] Configure environment variables
- [ ] Fund treasury wallet (tokens + ETH)
- [ ] Verify API endpoints are accessible
- [ ] Test with small amount first (1 token)
- [ ] Monitor first 10 real transactions closely

### Post-Deployment

- [ ] Verify funding history file creation
- [ ] Check database updates (receivedFunding flags)
- [ ] Monitor transaction success rate
- [ ] Review logs for errors or warnings
- [ ] Test rate limiting in production
- [ ] Verify notifications (toast messages)
- [ ] Document any issues or edge cases

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Issue: "Transaction underpriced"
**Cause**: Gas price too low for current network conditions
**Solution**:
```typescript
// Add gas price buffer in treasury service
const gasPrice = await this.publicClient.getGasPrice();
const bufferedGasPrice = gasPrice * 120n / 100n; // 20% buffer

// Use in transaction
const { request } = await this.publicClient.simulateContract({
  // ... other params
  gasPrice: bufferedGasPrice
});
```

#### Issue: "Nonce too low"
**Cause**: Concurrent transactions or pending transactions
**Solution**: Already implemented via `blockTag: 'pending'`

#### Issue: "Insufficient treasury balance"
**Cause**: Treasury wallet needs refilling
**Solution**:
```bash
# Check balances
curl http://localhost:3000/api/treasury/status

# Fund treasury wallet
# Transfer tokens and ETH to treasury address
```

#### Issue: "Address already funded"
**Cause**: Duplicate funding attempt
**Solution**: Working as intended - deduplication system

#### Issue: "Rate limit exceeded"
**Cause**: Too many requests from same address
**Solution**: Wait 24 hours or adjust rate limit settings

#### Issue: "Wallet not found"
**Cause**: Privy embedded wallet not ready yet
**Solution**: Already handled via retry logic in `useOnboarding`

### Debug Commands

```typescript
// Check funding history
import fs from 'fs';
const history = JSON.parse(
  fs.readFileSync('.funding-history.json', 'utf8')
);
console.log(history);

// Check pending transactions
// (Add to treasury service)
getPendingTransactions(): string[] {
  return Array.from(pendingTransactions);
}

// Check treasury balances
const treasury = getTreasuryService();
const balances = await treasury.getTreasuryBalances();
console.log(balances);

// Check rate limit status
const rateLimitCheck = checkWelcomeRateLimit('0x...');
console.log(rateLimitCheck);
```

---

## Customization Guide

### Adapting for Different Tokens

#### 1. Multi-Token Support
```typescript
// config/tokens.ts
export const supportedTokens = {
  usdc: {
    address: '0x...' as Address,
    decimals: 6,
    symbol: 'USDC',
    fundingAmount: '100'
  },
  dai: {
    address: '0x...' as Address,
    decimals: 18,
    symbol: 'DAI',
    fundingAmount: '100'
  }
};

// Treasury service method
async sendTokenBonus(
  recipientAddress: Address,
  tokenConfig: typeof supportedTokens.usdc,
  amount: string
) {
  const requiredAmount = BigInt(
    parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
  );

  // Rest of implementation...
}
```

#### 2. Dynamic Funding Amounts
```typescript
// Base funding on referral tier
const referralTiers = {
  bronze: { tokenAmount: '50', ethAmount: '0.001' },
  silver: { tokenAmount: '100', ethAmount: '0.002' },
  gold: { tokenAmount: '200', ethAmount: '0.005' }
};

// In API route
const referral = await getReferralByCode(referralCode);
const tier = referralTiers[referral.tier];
await treasury.sendCompleteWelcomePackage(
  recipient,
  tier.tokenAmount,
  tier.ethAmount
);
```

#### 3. Chain-Specific Configuration
```typescript
// Support multiple chains
const chainConfigs = {
  arbitrum: {
    rpc: 'https://arb-mainnet.g.alchemy.com/v2/...',
    explorer: 'https://arbiscan.io',
    tokens: { /* ... */ }
  },
  polygon: {
    rpc: 'https://polygon-mainnet.g.alchemy.com/v2/...',
    explorer: 'https://polygonscan.com',
    tokens: { /* ... */ }
  }
};

// Treasury service per chain
class MultiChainTreasuryService {
  private services: Map<number, TreasuryService>;

  constructor(chains: ChainConfig[]) {
    this.services = new Map();
    chains.forEach(chain => {
      this.services.set(chain.id, new TreasuryService(chain));
    });
  }

  async sendOnChain(
    chainId: number,
    recipient: Address,
    amount: string
  ) {
    const service = this.services.get(chainId);
    if (!service) throw new Error(`Chain ${chainId} not supported`);
    return await service.sendWelcomeBonus(recipient, amount);
  }
}
```

---

## Migration from Existing System

### If You Have Existing Users

```typescript
// Migration script: migrate-existing-users.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingUsers() {
  console.log('Starting user migration...');

  // Get all accounts without receivedFunding flag
  const accounts = await prisma.account.findMany({
    where: {
      receivedFunding: null // or false, depending on default
    }
  });

  console.log(`Found ${accounts.length} accounts to migrate`);

  for (const account of accounts) {
    try {
      // Check if this wallet was funded in old system
      const wasFunded = await checkOldSystemFunding(account.appWallet);

      if (wasFunded) {
        await prisma.account.update({
          where: { id: account.id },
          data: { receivedFunding: true }
        });
        console.log(`✅ Marked ${account.appWallet} as funded`);
      }
    } catch (error) {
      console.error(`❌ Error migrating ${account.appWallet}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run with: bun run migrate-existing-users.ts
migrateExistingUsers();
```

---

## Performance Optimization

### Concurrent Operations

Already implemented via `Promise.allSettled`:
```typescript
const [tokenResult, ethResult] = await Promise.allSettled([
  this.sendWelcomeBonus(recipientAddress, tokenAmount),
  this.sendGasFunds(recipientAddress, ethAmount)
]);
```

**Benefits**:
- 2x faster than sequential operations
- Partial success handling (token sent even if ETH fails)
- Better user experience (faster funding)

### Batch Processing

For high-volume scenarios:
```typescript
// Process multiple fundings in batch
async function batchFundUsers(
  recipients: Address[],
  amount: string
) {
  const batchSize = 10;
  const batches = chunk(recipients, batchSize);

  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(recipient =>
        treasury.sendWelcomeBonus(recipient, amount)
      )
    );

    // Delay between batches to prevent rate limiting
    await delay(1000);
  }
}
```

### Caching

```typescript
// Cache treasury balances (refresh every 30s)
let cachedBalances: { token: bigint; eth: bigint } | null = null;
let cacheExpiry = 0;

async function getCachedBalances() {
  const now = Date.now();

  if (cachedBalances && now < cacheExpiry) {
    return cachedBalances;
  }

  const balances = await treasury.getTreasuryBalances();
  cachedBalances = {
    token: balances.token.raw,
    eth: balances.eth.raw
  };
  cacheExpiry = now + 30_000; // 30 seconds

  return cachedBalances;
}
```

---

## Cost Analysis

### Gas Costs per Funding

**Arbitrum L2** (example):
- ERC20 Transfer: ~100k gas × 0.1 gwei = 0.00001 ETH (~$0.02)
- ETH Transfer: ~21k gas × 0.1 gwei = 0.000002 ETH (~$0.004)
- **Total per user**: ~$0.024

**Ethereum Mainnet** (reference):
- ERC20 Transfer: ~100k gas × 30 gwei = 0.003 ETH (~$7.50)
- ETH Transfer: ~21k gas × 30 gwei = 0.00063 ETH (~$1.58)
- **Total per user**: ~$9.08

### Budget Planning

For 1000 users:
- **Arbitrum**: $24
- **Polygon**: ~$20
- **Ethereum**: $9,080

**Recommendation**: Use L2 (Arbitrum, Polygon, Base) for cost efficiency

---

## Conclusion

This implementation plan provides a complete, production-ready system for distributing ERC20 tokens to new users via treasury service. The architecture ensures:

✅ **Security**: Multi-layer deduplication, rate limiting, persistent history
✅ **Reliability**: Retry logic, nonce management, concurrent operations
✅ **Scalability**: Singleton pattern, efficient caching, batch processing
✅ **Monitoring**: Comprehensive metrics, alerting, admin dashboard
✅ **User Experience**: Fast funding, clear status, error recovery

### Next Steps

1. **Review and customize** configuration for your token
2. **Deploy to testnet** and test thoroughly
3. **Set up monitoring** and alerting
4. **Fund treasury wallet** with limited amounts initially
5. **Test with real users** in controlled rollout
6. **Monitor and optimize** based on production metrics

### Support and References

- [Patrimo Treasury Source](../src/services/treasury.ts)
- [Viem Documentation](https://viem.sh)
- [Privy Documentation](https://docs.privy.io)
- [Arbitrum Documentation](https://docs.arbitrum.io)

---

**Last Updated**: 2025-08-26
**Version**: 1.0.0
**Author**: Patrimo Team
