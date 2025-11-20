# Production Deployment Guide

## 🎯 Pre-Deployment Checklist

### 1. Smart Contract Preparation

- [ ] $PULPA token deployed to Optimism Mainnet
- [ ] Treasury wallet created (dedicated, separate from main wallet)
- [ ] Treasury wallet granted MINTER role on token contract
- [ ] Treasury wallet funded with ETH for gas (recommend: 0.05 ETH)
- [ ] Token contract verified on Optimistic Etherscan
- [ ] Test minting from treasury wallet (verify MINTER role works)

### 2. Infrastructure Setup

- [ ] PostgreSQL database provisioned (Neon/Supabase/Railway)
- [ ] Database connection tested
- [ ] Database backups configured
- [ ] Private RPC endpoint obtained (Alchemy/Infura)
- [ ] RPC rate limits reviewed and configured
- [ ] CDN/hosting platform selected (Vercel/Railway/Cloudflare)

### 3. Security Configuration

- [ ] All secrets stored in secure vault (NOT in code)
- [ ] `.env` file in `.gitignore`
- [ ] `TREASURY_PRIVATE_KEY` never committed to git
- [ ] `AUTH_SECRET` generated with cryptographically secure method
- [ ] Rate limiting configured (5 per NFC per hour)
- [ ] Blacklist functionality tested
- [ ] Error monitoring configured (Sentry/LogRocket)

### 4. Testing

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end distribution flow tested
- [ ] Rate limiting tested
- [ ] Blacklist functionality tested
- [ ] Mobile wallet connection tested
- [ ] NFC scanning tested on physical devices

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- ✅ Zero-config Next.js deployment
- ✅ Automatic SSL certificates
- ✅ Edge network (global CDN)
- ✅ Preview deployments for PRs
- ✅ Built-in analytics
- ✅ Generous free tier

**Cons:**
- ❌ Serverless functions (10-second timeout on Hobby plan)
- ❌ Cold starts possible

---

#### Step 1: Prepare Repository

```bash
# Ensure .env is NOT committed
git status

# Should NOT see .env file
# If you see it: git rm --cached .env && git commit
```

---

#### Step 2: Deploy to Vercel

1. **Connect GitHub:**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

2. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `bun run build` (or use default)
   - Output Directory: `.next` (default)

3. **Add Environment Variables:**

   Click "Environment Variables" → Add each variable:

   ```env
   # Blockchain (CRITICAL)
   TREASURY_PRIVATE_KEY=0x... (mark as "Sensitive")
   NEXT_PUBLIC_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=10
   NEXT_PUBLIC_OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/...
   OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/...

   # Database
   DATABASE_URL=postgresql://... (mark as "Sensitive")

   # Auth
   AUTH_SECRET=... (mark as "Sensitive", generate new for prod)
   AUTH_URL=https://your-deployment-url.vercel.app

   # Web3 Infrastructure
   NEXT_PUBLIC_DYNAMIC_API_KEY=...
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

   # Optional
   GOOGLE_GEMINI_API_KEY=... (mark as "Sensitive")
   NEXT_PUBLIC_DISTRIBUTION_AMOUNT=10000000000000000000
   RATE_LIMIT_NFC_PER_HOUR=5
   RATE_LIMIT_RECIPIENT_TOTAL=1
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get deployment URL: `https://your-project.vercel.app`

---

#### Step 3: Post-Deployment Configuration

1. **Update AUTH_URL:**
   - Settings → Environment Variables
   - Update `AUTH_URL` to your actual deployment URL
   - Redeploy

2. **Configure Custom Domain (Optional):**
   - Settings → Domains
   - Add your domain: `pulpa.yourdomain.com`
   - Update DNS records as instructed
   - Wait for SSL certificate (automatic)

3. **Run Database Migrations:**
   ```bash
   # Connect to production database
   DATABASE_URL="your-production-db-url" npx prisma migrate deploy
   ```

---

### Option 2: Railway

**Pros:**
- ✅ Persistent servers (no cold starts)
- ✅ Built-in PostgreSQL
- ✅ Simple setup
- ✅ Good for long-running processes

**Cons:**
- ❌ Smaller free tier
- ❌ Manual SSL configuration

---

#### Step 1: Create Project

1. **Sign up:** https://railway.app
2. **New Project → Deploy from GitHub**
3. **Select repository**

---

#### Step 2: Add PostgreSQL

1. **New → Database → PostgreSQL**
2. **Copy connection string:**
   - Click PostgreSQL service
   - Variables tab → Copy `DATABASE_URL`

---

#### Step 3: Configure Environment

1. **Click your Next.js service**
2. **Variables tab → Add variables:**

   ```env
   TREASURY_PRIVATE_KEY=0x...
   NEXT_PUBLIC_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=10
   NEXT_PUBLIC_OPTIMISM_RPC_URL=https://...
   OPTIMISM_RPC_URL=https://...
   DATABASE_URL=${{Postgres.DATABASE_URL}} (Railway variable reference)
   AUTH_SECRET=... (generate new)
   AUTH_URL=https://your-railway-app.railway.app
   NEXT_PUBLIC_DYNAMIC_API_KEY=...
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   NODE_ENV=production
   ```

3. **Deploy:**
   - Railway auto-deploys on git push
   - Get URL from "Settings" tab

---

#### Step 4: Run Migrations

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migration
railway run npx prisma migrate deploy
```

---

### Option 3: Self-Hosted (VPS)

**For advanced users who need full control.**

---

#### Requirements:

- Ubuntu 22.04 LTS server
- 2GB RAM minimum
- Node.js 20+ installed
- PostgreSQL 15+ installed
- Nginx for reverse proxy

---

#### Step 1: Server Setup

```bash
# SSH into server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx
```

---

#### Step 2: Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE pulpa_production;
CREATE USER pulpa_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE pulpa_production TO pulpa_user;
\q
```

---

#### Step 3: Clone Repository

```bash
# Create app directory
mkdir -p /var/www/pulpa
cd /var/www/pulpa

# Clone repo
git clone https://github.com/yourusername/pulpa.git .

# Install dependencies
bun install

# Create .env
nano .env
# (Paste production environment variables)
```

---

#### Step 4: Build Application

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build Next.js
bun run build
```

---

#### Step 5: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/pulpa

# Paste configuration:
server {
    listen 80;
    server_name pulpa.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/pulpa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

#### Step 6: Configure SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d pulpa.yourdomain.com

# Auto-renewal (already configured by certbot)
```

---

#### Step 7: Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/pulpa.service

# Paste configuration:
[Unit]
Description=Pulpa NFC Distribution
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/pulpa
Environment=NODE_ENV=production
ExecStart=/usr/bin/bun run start
Restart=on-failure

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl enable pulpa
sudo systemctl start pulpa
sudo systemctl status pulpa
```

---

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# Test homepage
curl https://your-domain.com

# Test API health
curl https://your-domain.com/api/health

# Test database connection
curl https://your-domain.com/api/admin/stats
```

---

### 2. Functional Testing

1. **Visit homepage:** `https://your-domain.com`
2. **Register NFC:** `/nfc/TEST001/register`
3. **Connect wallet** (use treasury wallet for testing)
4. **Complete registration**
5. **Test distribution:** `/nfc/TEST001/distribute`
6. **Verify transaction** on Optimistic Etherscan
7. **Check admin dashboard:** `/admin`

---

### 3. Security Testing

```bash
# Test rate limiting (should block after 5 requests)
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/distributions/create \
    -H "Content-Type: application/json" \
    -d '{"nfcId":"TEST001","recipientAddress":"0x..."}' \
    -w "\n%{http_code}\n"
done
# Should see 429 on 6th request

# Test blacklist
# 1. Add address to blacklist via admin API
# 2. Try to distribute to blacklisted address
# 3. Should receive 403 Forbidden
```

---

## 📊 Monitoring & Maintenance

### Set Up Error Tracking (Sentry)

1. **Create Sentry project:**
   - Sign up: https://sentry.io
   - Create project → Select "Next.js"
   - Get DSN

2. **Install Sentry:**
   ```bash
   bun add @sentry/nextjs
   ```

3. **Configure:**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

4. **Add to environment:**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

---

### Database Backups

**Neon (Automatic):**
- Backups included in paid plans
- Point-in-time recovery available

**Manual Backup:**
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250119.sql
```

---

### Log Monitoring

**Vercel:**
- Functions → View logs in real-time
- Filter by status code, search errors

**Railway:**
- Click service → Logs tab
- Export logs to external service (Datadog, Logflare)

**Self-Hosted:**
```bash
# View application logs
sudo journalctl -u pulpa -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Continuous Deployment

### Vercel (Automatic)

```bash
# Every push to main branch auto-deploys
git push origin main

# Preview deployments for PRs
git checkout -b feature/new-feature
git push origin feature/new-feature
# Creates preview URL automatically
```

---

### Railway (Automatic)

```bash
# Push to trigger deployment
git push origin main

# Railway auto-deploys
# View progress in dashboard
```

---

### Self-Hosted (Manual)

```bash
# Create deployment script
nano deploy.sh

# Paste:
#!/bin/bash
cd /var/www/pulpa
git pull origin main
bun install
npx prisma migrate deploy
bun run build
sudo systemctl restart pulpa

# Make executable
chmod +x deploy.sh

# Deploy
./deploy.sh
```

---

## 🚨 Rollback Procedures

### Vercel

1. **Go to Deployments**
2. **Find previous successful deployment**
3. **Click "..." → Promote to Production**

---

### Railway

1. **Go to Deployments**
2. **Click previous successful deployment**
3. **Click "Redeploy"**

---

### Self-Hosted

```bash
# Revert to previous commit
git log --oneline
git reset --hard <commit-hash>
./deploy.sh
```

---

## 📈 Scaling Considerations

### Database Scaling

- **Connection Pooling:** Use PgBouncer or Prisma Accelerate
- **Read Replicas:** Separate analytics queries from writes
- **Indexing:** Ensure indexes on frequently queried columns

### Application Scaling

**Vercel:**
- Scales automatically
- Consider Pro plan for higher limits

**Railway:**
- Scale vertically (more CPU/RAM)
- Add horizontal replicas (Pro plan)

**Self-Hosted:**
- Use PM2 for clustering
- Add load balancer (Nginx + multiple servers)
- Use Redis for session management

---

## 🆘 Emergency Procedures

### Treasury Wallet Compromised

1. **Immediately revoke MINTER role:**
   ```solidity
   // Call on token contract
   revokeRole(MINTER_ROLE, compromisedAddress)
   ```

2. **Create new treasury wallet**
3. **Grant MINTER role to new wallet**
4. **Update `TREASURY_PRIVATE_KEY` in secrets**
5. **Redeploy application**

---

### Database Breach

1. **Rotate all secrets immediately**
2. **Enable IP whitelisting on database**
3. **Review access logs**
4. **Restore from backup if needed**
5. **Audit all distributions for tampering**

---

### DDoS Attack

**Vercel/Railway:**
- Automatic DDoS protection included
- Contact support if needed

**Self-Hosted:**
- Enable Cloudflare (free tier includes DDoS protection)
- Configure rate limiting in Nginx
- Use fail2ban for IP blocking

---

## 📞 Support Resources

- **Vercel Support:** https://vercel.com/support
- **Railway Support:** https://railway.app/help
- **Optimism Discord:** https://discord.optimism.io
- **Project Issues:** https://github.com/yourrepo/issues
