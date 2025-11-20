# Quick Start Guide

Get the Pulpa NFC Distribution system running in 5 minutes.

## Prerequisites

- **Bun** >= 1.0 installed ([Install Bun](https://bun.sh))
- **PostgreSQL** database (or use Neon/Supabase free tier)
- **Optimism** wallet with MINTER role on $PULPA token
- **Node.js** 20+ (if not using Bun)

---

## 1. Clone & Install

```bash
git clone <repository-url>
cd pulpa
bun install
```

---

## 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in required values
nano .env
```

**Required variables to update:**

```env
# Your treasury wallet private key (MUST have MINTER role!)
TREASURY_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# Token contract address (update if different)
NEXT_PUBLIC_TOKEN_ADDRESS=0x029263aA1BE88127f1794780D9eEF453221C2f30

# Database connection (get from Neon/Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

---

## 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

---

## 4. Verify Configuration

```bash
# Check all environment variables
bun run scripts/check-env.ts

# Should see all ✅ checkmarks
```

---

## 5. Start Development Server

```bash
bun run dev
```

Application will be available at: **http://localhost:3000**

---

## 6. Test the Flow

### Register an Ambassador

1. Visit: `http://localhost:3000/nfc/TEST001/register`
2. Click "Connect Wallet"
3. Connect wallet that has MINTER role
4. Complete registration form
5. Click "Register as Ambassador"

### Test Distribution

1. Visit: `http://localhost:3000/nfc/TEST001/distribute`
2. Enter recipient wallet address
3. Click "Distribute $PULPA"
4. Confirm transactions in wallet
5. See success screen with transaction hashes

### View Admin Dashboard

1. Visit: `http://localhost:3000/admin`
2. See global statistics
3. View ambassador leaderboard
4. Check distribution charts

---

## Common Issues

### "TREASURY_PRIVATE_KEY not found"

**Solution:** Make sure you've copied `.env.example` to `.env` and filled in your private key.

```bash
cp .env.example .env
nano .env
```

---

### "Database connection failed"

**Solution:** Verify your `DATABASE_URL` is correct and database is accessible.

```bash
# Test connection
npx prisma db pull
```

---

### "Wallet does not have MINTER role"

**Solution:** You need to grant MINTER role to your treasury wallet on the token contract.

1. Go to Optimistic Etherscan
2. Find your token contract
3. Call `grantRole(MINTER_ROLE, treasuryAddress)`
4. Or use the contract owner wallet to grant role

---

### Build fails with TypeScript errors

**Solution:** Ensure you're using Node 20+ and all dependencies are installed.

```bash
# Check versions
node --version  # Should be 20+
bun --version   # Should be 1.0+

# Reinstall dependencies
rm -rf node_modules
rm bun.lockb
bun install
```

---

## Next Steps

- **Read Documentation:** Check [docs/ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration
- **Production Deployment:** See [docs/PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for deployment guides
- **Test Security Features:** Try rate limiting and blacklist functionality
- **Customize:** Update distribution amounts, rate limits, and UI branding

---

## Production Checklist

Before deploying to production:

- [ ] Treasury wallet has MINTER role
- [ ] Treasury wallet funded with ETH for gas
- [ ] Private RPC endpoint configured (Alchemy/Infura)
- [ ] New `AUTH_SECRET` generated for production
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry)
- [ ] Rate limiting tested
- [ ] All secrets stored in vault (not in code)
- [ ] `.env` added to `.gitignore`

---

## Development Scripts

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Check environment variables
bun run scripts/check-env.ts

# Run database migrations
npx prisma migrate dev

# Open database GUI
npx prisma studio

# Generate Prisma client
npx prisma generate

# Format code
bun run format

# Lint code
bun run lint
```

---

## Project Structure

```
pulpa/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── ambassador/        # Ambassador pages
│   └── mint/              # Token minting pages
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── contracts/         # Token ABI and config
│   ├── security/          # Rate limiting, blacklist
│   ├── services/          # Treasury service
│   └── db/               # Prisma client
├── prisma/               # Database schema
├── public/               # Static assets
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

---

## Support

- **Issues:** Create issue on GitHub
- **Documentation:** Check `docs/` folder
- **Optimism Docs:** https://docs.optimism.io
- **Prisma Docs:** https://www.prisma.io/docs

---

## License

[Your License Here]
