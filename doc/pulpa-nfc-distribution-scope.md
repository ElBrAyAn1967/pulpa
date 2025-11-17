# $PULPA NFC Distribution System - Implementation Scope

## Executive Summary

This document outlines the implementation scope for the $PULPA ERC20 token distribution system using NFC stickers. The system enables "Embajadores $PULPA" (ambassadors) to onboard new users through NFC tags, automatically distributing tokens to both ambassadors and new users.

**Token Details:**

- Token: $PULPA
- Contract Address: `0x029263aA1BE88127f1794780D9eEF453221C2f30`
- Chain: Optimism Mainnet (Chain ID: 10)
- Standard: ERC20 with AccessControl (OpenZeppelin)
- Distribution Wallet: MINTER role holder (private key-based)

**Distribution Model:**

- Ambassador receives: 1 $PULPA per onboarding
- New user receives: 5 $PULPA
- Total per distribution: 6 $PULPA

**Technology Stack:**

- Frontend/Backend: Scaffold-ETH 2 (Next.js)
- Blockchain Integration: Wagmi v2, Viem, RainbowKit
- Indexer: Envio Indexer
- Smart Contract: Existing deployed ERC20 (PulpaToken.sol)
- Wallet Integration: RainbowKit with ENS support

**Important Documentation:**
- 📘 [Scaffold-ETH 2 Integration Guide](./scaffold-eth-integration-guide.md) - Detailed guide on contract integration, hooks usage, and ENS resolution

---

## Epic 1: Ambassador Management System

### Epic Overview

Build the complete ambassador registration, profile management, and identity system.

### User Stories

- As an ambassador, I need to scan an NFC sticker for the first time and register my wallet
- As an ambassador, I want to see my profile with distribution statistics
- As an ambassador, I want my identity represented by a fruit emoji avatar

---

#### Ticket 1.1: NFC Landing Page & Routing

**Priority**: P0 (Critical Path)
**Dependencies**: None
**Estimated Effort**: 2-3 hours

**Requirements:**

- Create NFC landing page (`/nfc/[nfcId]`)
- Parse NFC ID from URL parameter
- Implement state detection:
  - New NFC (no ambassador assigned) → Registration flow
  - Registered NFC (ambassador exists) → Distribution flow
- Store NFC ID in URL state and localStorage
- Error handling for invalid/malformed NFC IDs

**Acceptance Criteria:**

- [ ] Page loads with NFC ID from URL
- [ ] State detection correctly routes to registration or distribution
- [ ] Invalid NFC IDs show user-friendly error message
- [ ] NFC ID persists across page reloads

---

#### Ticket 1.2: Ambassador Registration Form

**Priority**: P0 (Critical Path)
**Dependencies**: Ticket 1.1
**Estimated Effort**: 4-5 hours

**Requirements:**

- Create registration form component with three fields:
  1. Wallet address/ENS input (validation required)
  2. Display name input (auto-populate from ENS if available)
  3. Favorite fruit selection (emoji button grid)
- ENS resolution integration using Wagmi hooks
- Form validation:
  - Wallet address format validation
  - ENS resolution validation
  - Display name required (max 32 chars)
  - Fruit selection required
- Loading states during ENS resolution
- Responsive design for mobile NFC scanning

**Scaffold-ETH 2 Integration:**
- Use `useEnsAddress` for ENS → address resolution
- Use `useEnsName` for address → ENS reverse resolution
- Use `useEnsAvatar` for ENS avatar display (optional)
- Use Scaffold-ETH 2's `<Address>` component for display
- See [Integration Guide](./scaffold-eth-integration-guide.md#5-ens-integration) for code examples

**ENS Best Practices:**
- Resolve ENS on Ethereum mainnet (chainId: 1)
- Use `normalize()` from viem/ens for input validation
- Cache ENS resolution results to avoid redundant calls
- Show loading state during resolution

**Fruit Options:**
🍎 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥥 🥝 🍈 🍏 🍐

**Acceptance Criteria:**

- [ ] Form renders with all three fields
- [ ] ENS resolution auto-populates display name
- [ ] ENS avatar displayed when available
- [ ] Wallet address validation works correctly
- [ ] Fruit emoji selection updates visual state
- [ ] Form submission disabled until all fields valid
- [ ] Mobile-responsive layout
- [ ] ENS resolves correctly on Ethereum mainnet

---

#### Ticket 1.3: Ambassador Database Schema

**Priority**: P0 (Critical Path)
**Dependencies**: None (can be parallel)
**Estimated Effort**: 2 hours

**Requirements:**

- Design PostgreSQL schema for ambassadors table
- Create Prisma schema definition
- Set up migrations
- Add indexes for performance

**Schema Fields:**

```typescript
model Ambassador {
  id              String    @id @default(cuid())
  nfcId           String    @unique
  walletAddress   String    @unique
  ensName         String?
  displayName     String
  favoriteFruit   String    // Emoji character
  totalDistributions Int   @default(0)
  totalPulpaMinted   String @default("0") // BigInt as string
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  distributions   Distribution[]

  @@index([nfcId])
  @@index([walletAddress])
}
```

**Acceptance Criteria:**

- [ ] Schema created and migrated
- [ ] Indexes added for query optimization
- [ ] Prisma client generated successfully
- [ ] Database constraints enforce uniqueness

---

#### Ticket 1.4: Ambassador Registration API

**Priority**: P0 (Critical Path)
**Dependencies**: Ticket 1.3
**Estimated Effort**: 3-4 hours

**Requirements:**

- Create API route: `POST /api/ambassadors/register`
- Request validation (zod schema)
- Duplicate prevention (NFC ID, wallet address)
- ENS validation and storage
- Database record creation
- Error handling and response formatting

**Request Schema:**

```typescript
{
  nfcId: string;
  walletAddress: Address;
  ensName?: string;
  displayName: string;
  favoriteFruit: string;
}
```

**Response Schema:**

```typescript
{
  success: boolean;
  ambassador?: {
    id: string;
    displayName: string;
    walletAddress: Address;
    totalDistributions: number;
  };
  error?: string;
}
```

**Acceptance Criteria:**

- [ ] API validates all input fields
- [ ] Prevents duplicate NFC ID registration
- [ ] Prevents duplicate wallet registration
- [ ] Returns appropriate error codes (400, 409, 500)
- [ ] Successfully creates ambassador record

---

#### Ticket 1.5: Ambassador Profile Component

**Priority**: P1 (Important)
**Dependencies**: Ticket 1.3
**Estimated Effort**: 3-4 hours

**Requirements:**

- Create profile display component
- Show ambassador information:
  - Fruit emoji as avatar (large display)
  - Display name
  - Wallet address (truncated with copy button)
  - Total distributions count
  - Total $PULPA minted for ambassador
  - Current $PULPA balance (real-time)
- Real-time updates when new distribution occurs
- Loading and error states

**Scaffold-ETH 2 Integration:**
- Use `<Address>` component for wallet display (auto-includes copy, ENS, explorer link)
- Use `<Balance>` component for $PULPA balance display
- Use `useScaffoldReadContract` to read balance from PulpaToken contract
- See [Integration Guide - UI Components](./scaffold-eth-integration-guide.md#6-scaffold-eth-2-ui-components) for usage

**Example Integration:**
```typescript
import { Address, Balance } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// In component:
const { data: balance } = useScaffoldReadContract({
  contractName: "PulpaToken",
  functionName: "balanceOf",
  args: [ambassadorAddress],
  chainId: 10,
});
```

**Design Requirements:**

- Clean card-based layout
- Responsive for mobile
- Fruit emoji prominently displayed
- Statistics visually clear and readable
- Explorer link for transaction history

**Acceptance Criteria:**

- [ ] Profile displays all ambassador data
- [ ] `<Address>` component shows wallet with copy/explorer
- [ ] Real-time $PULPA balance updates
- [ ] Updates when distribution count changes
- [ ] Loading states show during data fetch
- [ ] Mobile-responsive design
- [ ] ENS name displayed if available

---

## Epic 2: Token Distribution System

### Epic Overview

Implement the core token minting and distribution functionality for onboarding new users.

### User Stories

- As a new user, I want to enter my wallet address and receive $PULPA tokens
- As an ambassador, I want to see my rewards increase when I onboard someone
- As the system, I need to prevent duplicate distributions to the same address

---

#### Ticket 2.1: Distribution Database Schema

**Priority**: P0 (Critical Path)
**Dependencies**: Ticket 1.3
**Estimated Effort**: 2 hours

**Requirements:**

- Create distributions table schema
- Track all distribution events
- Link to ambassador records
- Store transaction hashes

**Schema Fields:**

```typescript
model Distribution {
  id                String    @id @default(cuid())
  ambassadorId      String
  recipientAddress  String
  ambassadorAmount  String    // "1" $PULPA
  recipientAmount   String    // "5" $PULPA
  transactionHash   String?
  status            String    @default("pending") // pending, success, failed
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  ambassador        Ambassador @relation(fields: [ambassadorId], references: [id])

  @@index([ambassadorId])
  @@index([recipientAddress])
  @@index([status])
}
```

**Acceptance Criteria:**

- [ ] Schema created and migrated
- [ ] Foreign key relationship to ambassadors
- [ ] Indexes for query performance
- [ ] Status tracking for transaction lifecycle

---

#### Ticket 2.2: Treasury Service Integration

**Priority**: P0 (Critical Path)
**Dependencies**: None (can be parallel)
**Estimated Effort**: 5-6 hours

**Requirements:**

- Create **server-side** TreasuryService class (singleton pattern)
- Integrate with $PULPA contract on Optimism using Viem
- Implement minting function:
  - Mint 1 $PULPA to ambassador
  - Mint 5 $PULPA to recipient
  - Use MINTER role wallet (private key stored server-side)
- Transaction retry logic with exponential backoff
- Nonce management for concurrent operations
- Gas estimation and transaction monitoring
- Balance checking before minting

**Scaffold-ETH 2 Integration:**
- Import PulpaToken ABI from Scaffold-ETH 2's generated contracts
- Use Viem's `createWalletClient` and `createPublicClient` for server-side interactions
- Load contract address from `deployedContracts` configuration
- See [Integration Guide - Server-Side Section](./scaffold-eth-integration-guide.md#4-server-side-contract-interaction-treasury-service) for complete implementation

**Key Methods:**

```typescript
class TreasuryService {
  async mintDistribution(
    ambassadorAddress: Address,
    recipientAddress: Address
  ): Promise<{
    success: boolean;
    ambassadorHash?: string;
    recipientHash?: string;
    error?: string;
  }>;

  async checkMinterBalance(): Promise<bigint>;

  async estimateGas(
    ambassadorAddress: Address,
    recipientAddress: Address
  ): Promise<bigint>;
}
```

**Why Server-Side?**
- ✅ MINTER private key never exposed to frontend
- ✅ Users don't need MINTER_ROLE
- ✅ Atomic operations (both mints or neither)
- ✅ Server-side validation and rate limiting
- ⚠️ Do NOT use `useScaffoldWriteContract` for minting (client-side hook)

**Configuration:**

- RPC: Optimism Mainnet via Viem transport
- Contract: `0x029263aA1BE88127f1794780D9eEF453221C2f30`
- Max Retries: 3
- Retry Delay: 1000ms (exponential)
- Environment: `TREASURY_PRIVATE_KEY`, `OPTIMISM_RPC_URL`

**Acceptance Criteria:**

- [ ] Service successfully mints tokens on Optimism
- [ ] Retry logic handles network failures
- [ ] Nonce management prevents conflicts
- [ ] Gas estimation works correctly
- [ ] Balance checks prevent insufficient funds errors
- [ ] Transaction hashes returned for both mints
- [ ] Private key only accessed server-side

---

#### Ticket 2.3: Distribution Form Component

**Priority**: P0 (Critical Path)
**Dependencies**: None (can be parallel)
**Estimated Effort**: 3-4 hours

**Requirements:**

- Create distribution form component
- Single input field: wallet address or ENS
- ENS resolution support
- "Quiero $PULPA" submit button
- Form validation:
  - Valid address format
  - ENS resolution
  - Not previously funded (check via API)
- Loading states during transaction
- Success/error notifications
- Transaction progress indicator

**Acceptance Criteria:**

- [ ] Form validates wallet address/ENS
- [ ] ENS resolution works correctly
- [ ] Button disabled during processing
- [ ] Loading states show transaction progress
- [ ] Success message shows transaction hash link
- [ ] Error messages are user-friendly

---

#### Ticket 2.4: Distribution API Endpoint

**Priority**: P0 (Critical Path)
**Dependencies**: Tickets 2.1, 2.2
**Estimated Effort**: 4-5 hours

**Requirements:**

- Create API route: `POST /api/distributions/create`
- Request validation
- Deduplication checks:
  - Check if recipient already received tokens
  - Prevent multiple distributions to same address
- Ambassador validation
- Call TreasuryService to mint tokens
- Update database records:
  - Create distribution record
  - Update ambassador statistics
- Transaction status tracking
- Error handling for blockchain failures

**Request Schema:**

```typescript
{
  nfcId: string;
  recipientAddress: Address;
}
```

**Response Schema:**

```typescript
{
  success: boolean;
  distribution?: {
    transactionHash: string;
    ambassadorAmount: string;
    recipientAmount: string;
    explorerUrl: string;
  };
  ambassador?: {
    displayName: string;
    totalDistributions: number;
    totalPulpaMinted: string;
  };
  error?: string;
}
```

**Deduplication Strategy:**

- Check distributions table for existing recipient address
- Return error if address already onboarded
- Use database transaction for atomicity

**Acceptance Criteria:**

- [ ] API validates all inputs
- [ ] Prevents duplicate distributions
- [ ] Mints correct amounts (1 + 5 $PULPA)
- [ ] Updates ambassador statistics
- [ ] Returns transaction hash and explorer link
- [ ] Handles blockchain errors gracefully

---

#### Ticket 2.5: Distribution Success View

**Priority**: P1 (Important)
**Dependencies**: Ticket 2.4
**Estimated Effort**: 3 hours

**Requirements:**

- Create success confirmation screen
- Display distribution results:
  - Success animation/illustration
  - Amount sent to user (5 $PULPA)
  - Amount earned by ambassador (1 $PULPA)
  - Transaction link to Optimism explorer
  - Updated ambassador statistics
- Share/social buttons (optional)
- "Distribute Again" CTA

**Acceptance Criteria:**

- [ ] Success screen displays all information
- [ ] Transaction link works correctly
- [ ] Ambassador stats show updated values
- [ ] Visual design is celebratory
- [ ] Mobile-responsive layout

---

## Epic 3: Data Indexing & Analytics

### Epic Overview

Set up Envio indexer to track all $PULPA distribution events and provide analytics.

### User Stories

- As an administrator, I want to see total distributions across all ambassadors
- As an ambassador, I want to see my distribution history
- As the system, I need to index all token minting events for analytics

---

#### Ticket 3.1: Envio Indexer Configuration

**Priority**: P1 (Important)
**Dependencies**: None (can be parallel)
**Estimated Effort**: 3-4 hours

**Requirements:**

- Configure Envio indexer for Optimism Mainnet
- Index $PULPA contract events:
  - Transfer events (minting)
  - AccessControl role changes (MINTER role)
- Set up event handlers
- Configure database sync

**Events to Index:**

```solidity
Transfer(address indexed from, address indexed to, uint256 value)
// from == address(0) indicates minting
```

**Acceptance Criteria:**

- [ ] Envio config file created
- [ ] Connected to Optimism Mainnet
- [ ] Transfer events indexed correctly
- [ ] Historical events synced
- [ ] Real-time event streaming works

---

#### Ticket 3.2: Distribution History Query

**Priority**: P2 (Nice to Have)
**Dependencies**: Ticket 3.1
**Estimated Effort**: 2-3 hours

**Requirements:**

- Create API endpoint: `GET /api/ambassadors/[id]/history`
- Query distribution history from database
- Include recipient addresses and amounts
- Pagination support
- Sort by date (newest first)

**Response Schema:**

```typescript
{
  distributions: Array<{
    id: string;
    recipientAddress: Address;
    amounts: {
      ambassador: string;
      recipient: string;
    };
    transactionHash: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

**Acceptance Criteria:**

- [ ] API returns paginated history
- [ ] Results sorted by date
- [ ] Includes all distribution details
- [ ] Pagination works correctly

---

#### Ticket 3.3: Analytics Dashboard (Admin)

**Priority**: P2 (Nice to Have)
**Dependencies**: Tickets 3.1, 3.2
**Estimated Effort**: 4-5 hours

**Requirements:**

- Create admin dashboard page
- Display system-wide statistics:
  - Total ambassadors registered
  - Total distributions completed
  - Total $PULPA distributed
  - Top ambassadors leaderboard
- Charts/visualizations:
  - Distributions over time
  - Ambassador activity
- Real-time updates using Envio data

**Acceptance Criteria:**

- [ ] Dashboard displays all key metrics
- [ ] Leaderboard shows top ambassadors
- [ ] Charts render correctly
- [ ] Real-time updates work
- [ ] Admin-only access control

---

## Epic 4: Security & Production Readiness

### Epic Overview

Implement security measures, monitoring, and production deployment requirements.

### User Stories

- As a system administrator, I need to monitor distribution activity
- As a security engineer, I need to prevent abuse and duplicate distributions
- As a user, I expect the system to handle errors gracefully

---

#### Ticket 4.1: Rate Limiting & Deduplication

**Priority**: P0 (Critical Path)
**Dependencies**: Ticket 2.4
**Estimated Effort**: 3 hours

**Requirements:**

- Implement rate limiting:
  - 1 distribution per recipient address (permanent)
  - 5 distributions per NFC per hour (prevent spam)
- Deduplication checks:
  - Database-level (primary)
  - In-memory cache (secondary)
- Blacklist functionality for abusive addresses
- Rate limit response headers

**Acceptance Criteria:**

- [ ] Recipients can only receive tokens once
- [ ] NFC spam prevention works
- [ ] Blacklist blocks malicious actors
- [ ] Rate limit errors are user-friendly

---

#### Ticket 4.2: Environment Configuration

**Priority**: P0 (Critical Path)
**Dependencies**: None
**Estimated Effort**: 2 hours

**Requirements:**

- Set up environment variables:
  - `TREASURY_PRIVATE_KEY` (MINTER wallet)
  - `NEXT_PUBLIC_TOKEN_ADDRESS` ($PULPA)
  - `NEXT_PUBLIC_CHAIN_ID` (10)
  - `NEXT_PUBLIC_OPTIMISM_RPC_URL`
  - `DATABASE_URL` (PostgreSQL)
- Create `.env.example` template
- Document all required variables
- Set up production secrets management (Vercel/Railway)

**Security Requirements:**

- Private key in secure vault
- Separate treasury wallet with limited funds
- No secrets in version control

**Acceptance Criteria:**

- [ ] All environment variables documented
- [ ] Example file created
- [ ] Production secrets configured
- [ ] Development environment works

---

#### Ticket 4.3: Error Handling & Monitoring

**Priority**: P1 (Important)
**Dependencies**: All Epic 2 tickets
**Estimated Effort**: 3-4 hours

**Requirements:**

- Implement comprehensive error handling:
  - Network failures
  - Blockchain errors
  - Database failures
  - Insufficient funds
- User-friendly error messages
- Logging infrastructure:
  - Error logs
  - Transaction logs
  - Distribution events
- Monitoring alerts:
  - Low minter balance
  - Failed transactions
  - High error rates

**Logging Requirements:**

- Structured JSON logs
- Include context (NFC ID, addresses)
- Transaction hashes for debugging
- Performance metrics

**Acceptance Criteria:**

- [ ] All errors handled gracefully
- [ ] Error messages are user-friendly
- [ ] Logging captures all events
- [ ] Alerts configured for critical issues

---

#### Ticket 4.4: Testing Suite

**Priority**: P1 (Important)
**Dependencies**: All previous tickets
**Estimated Effort**: 4-5 hours

**Requirements:**

- Unit tests:
  - TreasuryService methods
  - API request validation
  - Database operations
- Integration tests:
  - Registration flow
  - Distribution flow
  - Error scenarios
- E2E tests (optional):
  - Complete user journey
  - NFC scan to token receipt

**Test Coverage Goals:**

- API routes: >80%
- TreasuryService: >90%
- Database operations: >85%

**Acceptance Criteria:**

- [ ] Unit tests pass
- [ ] Integration tests cover main flows
- [ ] Test coverage meets goals
- [ ] CI/CD pipeline configured

---

## Epic 5: UX Enhancements & Polish

### Epic Overview

Improve user experience with animations, notifications, and mobile optimization.

### User Stories

- As a user, I want immediate feedback when scanning NFC
- As a user, I want to see animated confirmations when receiving tokens
- As a mobile user, I need a responsive interface

---

#### Ticket 5.1: Mobile Optimization

**Priority**: P1 (Important)
**Dependencies**: All UI tickets
**Estimated Effort**: 3-4 hours

**Requirements:**

- Responsive design for all components
- Mobile-first layout approach
- Touch-friendly interactions
- Fast page loads on mobile networks
- NFC scanning considerations:
  - Large tap targets
  - Clear instructions
  - Orientation handling

**Acceptance Criteria:**

- [ ] All pages responsive on mobile
- [ ] Touch interactions work smoothly
- [ ] Page load time <3s on 4G
- [ ] Tested on iOS and Android

---

#### Ticket 5.2: Notifications & Feedback

**Priority**: P2 (Nice to Have)
**Dependencies**: Tickets 2.4, 2.5
**Estimated Effort**: 2-3 hours

**Requirements:**

- Toast notifications for:
  - Form validation errors
  - Transaction submitted
  - Transaction confirmed
  - Distribution success
- Loading indicators:
  - Wallet validation
  - Transaction processing
  - Database operations
- Success animations
- Error state illustrations

**Acceptance Criteria:**

- [ ] Notifications appear at appropriate times
- [ ] Loading states show progress
- [ ] Success animations are celebratory
- [ ] Error messages are helpful

---

#### Ticket 5.3: Onboarding Instructions

**Priority**: P2 (Nice to Have)
**Dependencies**: None
**Estimated Effort**: 2 hours

**Requirements:**

- Create instruction cards/tooltips:
  - How to scan NFC
  - What is a wallet address
  - How to get ENS name
  - What are ambassadors
- First-time user flow
- Help/FAQ section
- Contact support link

**Acceptance Criteria:**

- [ ] Instructions clear and concise
- [ ] First-time flow guides users
- [ ] Help section accessible
- [ ] Support contact available

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ NFC Landing     │  │ Registration     │  │ Profile    │ │
│  │ Page            │→ │ Form             │→ │ Display    │ │
│  └─────────────────┘  └──────────────────┘  └────────────┘ │
│                              ↓                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Distribution    │  │ Success View     │  │ History    │ │
│  │ Form            │→ │                  │  │            │ │
│  └─────────────────┘  └──────────────────┘  └────────────┘ │
└────────────────────────────────┬────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   API Routes (Next.js)  │
                    │  ┌──────────────────┐   │
                    │  │ /api/ambassadors │   │
                    │  │ /api/distributions│  │
                    │  └──────────────────┘   │
                    └─────┬──────────────┬────┘
                          │              │
         ┌────────────────▼──┐      ┌───▼──────────────┐
         │ TreasuryService   │      │ Database         │
         │ (Viem/Wagmi)      │      │ (PostgreSQL)     │
         │                   │      │                  │
         │ - Mint tokens     │      │ - Ambassadors    │
         │ - Manage nonce    │      │ - Distributions  │
         │ - Retry logic     │      │                  │
         └────────┬──────────┘      └──────────────────┘
                  │
         ┌────────▼──────────┐
         │ Optimism Mainnet  │
         │                   │
         │ $PULPA Contract   │
         │ 0x029263...       │
         └───────────────────┘
```

### Data Flow: Distribution Event

```
1. User scans NFC → NFC ID in URL
2. Frontend loads ambassador data
3. User enters recipient address
4. Frontend calls /api/distributions/create
5. API validates input & checks duplicates
6. TreasuryService.mintDistribution():
   - Mint 1 $PULPA to ambassador
   - Mint 5 $PULPA to recipient
7. Update database:
   - Create distribution record
   - Update ambassador stats
8. Return transaction hash
9. Frontend shows success view
10. Envio indexes Transfer events
```

---

## Deployment Strategy

### Phase 1: Development Environment

1. Set up local PostgreSQL database
2. Configure Optimism Sepolia testnet
3. Deploy test $PULPA contract or use existing testnet token
4. Test with test NFC IDs (URLs)

### Phase 2: Staging Environment

1. Deploy to Vercel/Railway staging
2. Use Optimism Mainnet with real contract
3. Limited NFC testing with team members
4. Monitor transactions and errors

### Phase 3: Production Launch

1. Full deployment with production secrets
2. Fund MINTER wallet with operational ETH
3. Generate and print NFC stickers
4. Distribute to ambassadors
5. Monitor system performance

---

## Risk Assessment & Mitigations

### High Priority Risks

| Risk                          | Impact   | Mitigation                                            |
| ----------------------------- | -------- | ----------------------------------------------------- |
| MINTER wallet compromised     | Critical | Use hardware wallet, limited funds, monitoring alerts |
| Duplicate distributions       | High     | Multi-layer deduplication, database constraints       |
| Smart contract out of funds   | High     | Balance monitoring, auto-alerts at 20% threshold      |
| NFC ID collision              | Medium   | Use UUIDs, validate uniqueness at registration        |
| Network congestion (high gas) | Medium   | Gas price limits, retry with higher gas if needed     |
| Database downtime             | Medium   | Use reliable hosting, automated backups               |

### Security Measures

- Private key in secure vault (never in code)
- Rate limiting to prevent spam
- Address blacklist for known bad actors
- Transaction monitoring and alerting
- Regular security audits of API endpoints

---

## Success Metrics

### Launch Metrics (First 30 Days)

- **Ambassadors Registered**: Target 50+
- **Total Distributions**: Target 500+
- **Distribution Success Rate**: >95%
- **Average Distribution Time**: <30 seconds
- **Mobile Usage**: >80% of scans

### Ongoing Metrics

- Distributions per day
- Ambassador engagement (distributions per ambassador)
- User retention (repeat scans)
- Error rates by type
- Transaction costs (gas fees)

---

## Future Enhancements (Out of Scope)

These features are not included in the initial implementation but could be added later:

1. **Ambassador Leaderboard**: Public leaderboard with gamification
2. **Rewards Tiers**: Unlock special benefits at milestone distributions
3. **Multi-Chain Support**: Expand beyond Optimism
4. **Ambassador Dashboard**: Detailed analytics for ambassadors
5. **QR Code Alternative**: Support QR codes in addition to NFC
6. **Social Sharing**: Share distribution achievements
7. **Batch Distributions**: Allow ambassadors to onboard multiple users at once
8. **Ambassador Referral Program**: Ambassadors can recruit other ambassadors

---

## Appendix

### Environment Variables Reference

```bash
# Blockchain Configuration
TREASURY_PRIVATE_KEY=0x...                           # MINTER wallet private key
NEXT_PUBLIC_TOKEN_ADDRESS=0x029263aA1BE88127f1794780D9eEF453221C2f30
NEXT_PUBLIC_CHAIN_ID=10                              # Optimism Mainnet
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://mainnet.optimism.io

# Distribution Amounts
AMBASSADOR_AMOUNT=1000000000000000000                # 1 $PULPA (18 decimals)
RECIPIENT_AMOUNT=5000000000000000000                 # 5 $PULPA (18 decimals)

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Application
NEXTAUTH_SECRET=...                                  # Session secret
NEXTAUTH_URL=https://pulpa.frutero.xyz

# Monitoring (Optional)
SENTRY_DSN=...                                       # Error tracking
LOGFLARE_API_KEY=...                                 # Logging service
```

### Database Migration Commands

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### Development Workflow

```bash
# Install dependencies
yarn install

# Start database
docker-compose up -d postgres

# Run migrations
yarn prisma:migrate

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

### Scaffold-ETH 2 Workflow

```bash
# Deploy contracts (if needed)
yarn deploy

# Generate contract types
# (happens automatically after deploy)

# Verify contract on Optimism
yarn verify --network optimism

# Start Envio indexer
cd packages/envio
envio dev

# Access contract ABIs
# Available at: packages/nextjs/contracts/deployedContracts.ts
```

---

## Scaffold-ETH 2 Quick Reference

### Key Files and Locations

**Contract Integration:**
- Contract Source: `packages/hardhat/contracts/PulpaToken.sol`
- Deployment Artifacts: `packages/hardhat/deployments/optimism/PulpaToken.json`
- Generated Types: `packages/nextjs/contracts/deployedContracts.ts` (auto-generated)
- ABI Auto-imported: Available in all frontend hooks

**Frontend Hooks:**
- Location: `packages/nextjs/hooks/scaffold-eth/`
- Read Contract: `useScaffoldReadContract`
- Write Contract: `useScaffoldWriteContract` (client-side only)
- Events: `useScaffoldEventHistory`, `useScaffoldWatchContractEvent`
- ENS: `useEnsName`, `useEnsAddress`, `useEnsAvatar` (from wagmi)

**UI Components:**
- Location: `packages/nextjs/components/scaffold-eth/`
- Address Display: `<Address>` (ENS-aware, copy, explorer link)
- Balance Display: `<Balance>` (ETH and ERC20)
- Avatar: `<BlockieAvatar>` (generated from address)

**Server-Side Integration:**
- Treasury Service: `packages/nextjs/services/treasury.ts`
- Use Viem directly (not Scaffold-ETH 2 hooks)
- Import ABI from generated contracts
- Private key access via environment variables

### Contract Integration Flow

```
1. Contract deployed → Hardhat saves to deployments/
2. Scaffold-ETH 2 auto-imports → Types generated
3. Frontend uses hooks → Auto-loads ABI/address
4. Server uses Viem → Imports from deployedContracts
```

### Important Notes

✅ **DO:**
- Use Scaffold-ETH 2 hooks for frontend contract reads
- Use `<Address>` and `<Balance>` components for display
- Resolve ENS on Ethereum mainnet (chainId: 1)
- Import ABIs from generated `deployedContracts.ts`
- Use Viem for server-side contract interactions

❌ **DON'T:**
- Use `useScaffoldWriteContract` for minting (requires MINTER role)
- Expose TREASURY_PRIVATE_KEY to frontend
- Resolve ENS on Optimism (ENS is mainnet-only)
- Manually copy ABIs (use auto-generated imports)
- Use client-side hooks for server-side operations

---

**Document Version**: 1.1
**Last Updated**: 2025-01-14
**Next Review**: After Phase 1 completion

**Related Documentation:**
- [Scaffold-ETH 2 Integration Guide](./scaffold-eth-integration-guide.md)
- [PulpaToken Contract](../packages/hardhat/contracts/PulpaToken.sol)
- [Deployment Artifacts](../packages/hardhat/deployments/optimism/PulpaToken.json)
