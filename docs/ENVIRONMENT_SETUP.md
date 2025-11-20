# Environment Setup Guide

## 🚀 Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in required variables** (see sections below)

3. **Run database migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start development server:**
   ```bash
   bun run dev
   ```

---

## 📋 Required Environment Variables

### 1. Blockchain Configuration

#### `TREASURY_PRIVATE_KEY` (CRITICAL - Server-side only)

**Purpose:** Private key for the treasury wallet that has MINTER role on the $PULPA token contract.

**Security Requirements:**
- ⚠️ **NEVER** commit this to git
- ⚠️ **NEVER** expose in frontend code
- ⚠️ **NEVER** share publicly
- ✅ Store in secure vault (Vercel/Railway secrets)
- ✅ Use a dedicated treasury wallet (not your main wallet)
- ✅ Fund with limited amounts (e.g., enough for 1000-5000 distributions)
- ✅ Rotate periodically (recommended: every 3-6 months)

**How to get:**
```bash
# Create a new wallet (recommended for treasury)
# Use MetaMask or any Ethereum wallet
# Export private key and store securely
```

**Format:**
```env
TREASURY_PRIVATE_KEY=0x1234567890abcdef... (64 hex characters)
```

---

#### `NEXT_PUBLIC_TOKEN_ADDRESS`

**Purpose:** $PULPA token contract address on Optimism.

**How to get:**
- Deploy your ERC20 token contract to Optimism
- Or use existing $PULPA token address
- Verify on Optimistic Etherscan: https://optimistic.etherscan.io

**Format:**
```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

---

#### `NEXT_PUBLIC_CHAIN_ID`

**Purpose:** Blockchain network ID.

**Value:**
- Optimism Mainnet: `10`
- Optimism Sepolia (testnet): `11155420`

**Format:**
```env
NEXT_PUBLIC_CHAIN_ID=10
```

---

#### `NEXT_PUBLIC_OPTIMISM_RPC_URL` & `OPTIMISM_RPC_URL`

**Purpose:** RPC endpoint for connecting to Optimism blockchain.

**Options:**
1. **Public RPC (Free, rate-limited):**
   - `https://mainnet.optimism.io`
   - Good for development and testing

2. **Private RPC (Recommended for production):**
   - Alchemy: https://www.alchemy.com
   - Infura: https://www.infura.io
   - QuickNode: https://www.quicknode.com

**Setup with Alchemy:**
```bash
1. Sign up at https://www.alchemy.com
2. Create new app → Select "Optimism"
3. Copy HTTP URL: https://opt-mainnet.g.alchemy.com/v2/YOUR-API-KEY
```

**Format:**
```env
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR-API-KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR-API-KEY
```

---

### 2. Database Configuration

#### `DATABASE_URL`

**Purpose:** PostgreSQL connection string for storing distribution data.

**Recommended Providers:**

1. **Neon (Recommended - Serverless Postgres):**
   - Sign up: https://neon.tech
   - Create project → Copy connection string
   - ✅ Free tier available
   - ✅ Serverless (scales to zero)
   - ✅ Connection pooling built-in

2. **Supabase:**
   - Sign up: https://supabase.com
   - Settings → Database → Connection string
   - ✅ Free tier available
   - ✅ Built-in UI for data management

3. **Railway:**
   - Sign up: https://railway.app
   - New Project → PostgreSQL
   - ✅ Simple setup
   - ✅ Good for hobbyist projects

4. **Vercel Postgres:**
   - Vercel Dashboard → Storage → Postgres
   - ✅ Integrated with Vercel deployments
   - ✅ Optimized for serverless

**Format:**
```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**Security:**
- ✅ Always use SSL (`sslmode=require`)
- ✅ Use connection pooling in production
- ✅ Restrict IP access if possible
- ✅ Enable read replicas for analytics

---

### 3. Authentication & Security

#### `AUTH_SECRET`

**Purpose:** Secret key for encrypting session tokens.

**How to generate:**
```bash
openssl rand -base64 32
```

**Security:**
- ✅ Generate unique secret for each environment (dev, staging, prod)
- ✅ Rotate periodically (recommended: every 6 months)
- ⚠️ Never commit to git

**Format:**
```env
AUTH_SECRET=your-generated-32-character-secret
```

---

#### `AUTH_URL`

**Purpose:** Base URL for authentication callbacks.

**Values:**
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

**Format:**
```env
AUTH_URL=http://localhost:3000
```

---

### 4. Web3 Infrastructure

#### `NEXT_PUBLIC_DYNAMIC_API_KEY`

**Purpose:** API key for Dynamic.xyz wallet connection UI.

**How to get:**
1. Sign up: https://www.dynamic.xyz
2. Create project → Get API key
3. Configure supported chains (Optimism)

**Format:**
```env
NEXT_PUBLIC_DYNAMIC_API_KEY=your-dynamic-api-key
```

---

#### `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**Purpose:** Project ID for WalletConnect (optional, for RainbowKit).

**How to get:**
1. Sign up: https://cloud.walletconnect.com
2. Create project → Copy Project ID

**Format:**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

---

## 🎯 Optional Configuration

### Google Gemini API (AI Features)

**Purpose:** Enable AI-powered features (optional).

**How to get:**
1. Google AI Studio: https://makersuite.google.com/app/apikey
2. Create API key

**Format:**
```env
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

---

### Distribution Limits

**Purpose:** Configure rate limiting and security.

**Format:**
```env
# Token amount per distribution (18 decimals)
NEXT_PUBLIC_DISTRIBUTION_AMOUNT=10000000000000000000

# Max distributions per NFC per hour
RATE_LIMIT_NFC_PER_HOUR=5

# Max distributions per recipient (permanent)
RATE_LIMIT_RECIPIENT_TOTAL=1
```

---

## 🔒 Production Deployment

### Vercel Deployment

1. **Push code to GitHub**

2. **Import project to Vercel:**
   - Go to: https://vercel.com/new
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Add environment variables:**
   - Settings → Environment Variables
   - Add all variables from `.env.example`
   - Mark `TREASURY_PRIVATE_KEY` as "Sensitive"

4. **Deploy:**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

---

### Railway Deployment

1. **Create new project:**
   - Go to: https://railway.app
   - New Project → Deploy from GitHub

2. **Add PostgreSQL:**
   - Add Database → PostgreSQL
   - Copy `DATABASE_URL` to variables

3. **Add environment variables:**
   - Variables tab → Add all from `.env.example`

4. **Deploy:**
   ```bash
   railway up
   ```

---

## 🛡️ Security Checklist

### Before Production:

- [ ] Treasury wallet has MINTER role on token contract
- [ ] Treasury wallet funded with limited amounts
- [ ] `TREASURY_PRIVATE_KEY` stored in secure vault (not in code)
- [ ] Database uses SSL connection (`sslmode=require`)
- [ ] `AUTH_SECRET` generated with cryptographically secure method
- [ ] All secrets marked as "Sensitive" in deployment platform
- [ ] `.env` file in `.gitignore` (verify: `git status` should NOT show `.env`)
- [ ] Private RPC endpoint configured (not public RPC)
- [ ] Rate limiting configured and tested
- [ ] Blacklist functionality tested
- [ ] Error monitoring configured (Sentry)

---

## 🧪 Testing Configuration

### Verify Environment Setup:

```bash
# 1. Check all required variables
bun run scripts/check-env.ts

# 2. Test database connection
npx prisma db pull

# 3. Test blockchain connection
bun run scripts/test-rpc.ts

# 4. Run development server
bun run dev
```

### Test Distribution Flow:

1. Start server: `bun run dev`
2. Register NFC: Visit `/nfc/TEST123/register`
3. Connect wallet with MINTER role
4. Register as ambassador
5. Test distribution: Visit `/nfc/TEST123/distribute`
6. Verify in database: Check Prisma Studio (`npx prisma studio`)

---

## 🐛 Troubleshooting

### Error: "TREASURY_PRIVATE_KEY not found"

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify variable is set
grep TREASURY_PRIVATE_KEY .env
```

---

### Error: "Database connection failed"

**Solution:**
```bash
# Test connection
npx prisma db pull

# Check SSL mode
# Ensure DATABASE_URL includes: ?sslmode=require
```

---

### Error: "RPC request failed"

**Solution:**
- Check RPC URL is correct
- Verify API key is valid
- Check rate limits on RPC provider
- Try public RPC: `https://mainnet.optimism.io`

---

### Error: "Wallet has insufficient MINTER role"

**Solution:**
1. Verify treasury wallet address:
   ```bash
   bun run scripts/check-wallet.ts
   ```

2. Grant MINTER role on token contract:
   ```solidity
   // On Optimistic Etherscan
   // Call: grantRole(MINTER_ROLE, treasuryAddress)
   ```

---

## 📚 Additional Resources

- **Optimism Docs:** https://docs.optimism.io
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Dynamic.xyz Docs:** https://docs.dynamic.xyz
- **Alchemy Docs:** https://docs.alchemy.com

---

## 🆘 Need Help?

- Create issue: https://github.com/yourrepo/issues
- Check documentation: `docs/` folder
- Review error logs: Check Vercel/Railway logs
