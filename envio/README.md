# $PULPA Distribution Indexer

Envio-based blockchain indexer for tracking $PULPA token distribution events on Optimism Mainnet.

## Overview

This indexer monitors the $PULPA ERC20 token contract and indexes:
- **Transfer events** (minting) - When new tokens are distributed
- **RoleGranted events** - When addresses receive MINTER_ROLE
- **RoleRevoked events** - When addresses lose MINTER_ROLE

## Contract Details

- **Network**: Optimism Mainnet (Chain ID: 10)
- **Contract Address**: `0x029263aA1BE88127f1794780D9eEF453221C2f30`
- **Token**: $PULPA (ERC20)

## Installation

1. Install dependencies:
```bash
cd envio
npm install
# or
pnpm install
# or
bun install
```

2. Generate TypeScript types from schema:
```bash
npm run codegen
```

## Usage

### Development Mode

Run the indexer in development mode with hot reload:

```bash
npm run dev
```

This will:
- Start indexing from the configured start block
- Generate types automatically
- Watch for config/schema changes
- Provide a GraphQL playground at `http://localhost:8080`

### Production Mode

Start the indexer in production:

```bash
npm run start
```

### Testing

Run tests for event handlers:

```bash
npm run test
```

## GraphQL Queries

Once the indexer is running, you can query the data at `http://localhost:8080/graphql`

### Example Queries

**Get all distributions:**
```graphql
query GetDistributions {
  distributions(orderBy: timestamp, orderDirection: desc, limit: 10) {
    id
    timestamp
    transactionHash
    from
    to
    amount
    ambassador {
      address
      totalDistributions
    }
    recipient {
      address
      totalReceived
    }
  }
}
```

**Get ambassador statistics:**
```graphql
query GetAmbassadorStats($address: String!) {
  ambassador(id: $address) {
    address
    totalDistributions
    totalPulpaMinted
    totalPulpaReceived
    firstDistributionTimestamp
    lastDistributionTimestamp
    distributions(orderBy: timestamp, orderDirection: desc) {
      timestamp
      to
      amount
      transactionHash
    }
  }
}
```

**Get global statistics:**
```graphql
query GetGlobalStats {
  globalStats(id: "global") {
    totalDistributions
    totalPulpaMinted
    totalAmbassadors
    totalRecipients
    lastUpdatedTimestamp
  }
}
```

**Get recipient history:**
```graphql
query GetRecipientHistory($address: String!) {
  recipient(id: $address) {
    address
    totalReceived
    distributionCount
    firstReceivedTimestamp
    distributions(orderBy: timestamp, orderDirection: desc) {
      timestamp
      amount
      transactionHash
      ambassador {
        address
      }
    }
  }
}
```

**Get role events:**
```graphql
query GetRoleEvents {
  roleEvents(orderBy: timestamp, orderDirection: desc) {
    id
    timestamp
    eventType
    account {
      address
      totalDistributions
    }
    sender
    transactionHash
  }
}
```

## Data Entities

### Distribution
Individual token distribution events (minting from 0x0)
- `id`: Transaction hash + log index
- `timestamp`: Block timestamp
- `from`: Always 0x0 for minting
- `to`: Recipient address
- `amount`: Tokens minted (wei)
- `ambassador`: Reference to ambassador who minted
- `recipient`: Reference to recipient entity

### Ambassador
Addresses with MINTER_ROLE who distribute tokens
- `id`: Wallet address (lowercase)
- `totalDistributions`: Number of distributions made
- `totalPulpaMinted`: Total PULPA tokens minted
- `totalPulpaReceived`: Estimated rewards received
- `distributions`: List of distributions made

### Recipient
Addresses that have received $PULPA tokens
- `id`: Wallet address (lowercase)
- `totalReceived`: Total PULPA received
- `distributionCount`: Number of times received
- `distributions`: List of distributions received

### RoleEvent
MINTER_ROLE grant/revoke events
- `eventType`: GRANTED or REVOKED
- `account`: Ambassador affected
- `sender`: Who granted/revoked the role

### GlobalStats
Aggregated statistics across all ambassadors
- `totalDistributions`: Total distributions
- `totalPulpaMinted`: Total PULPA minted
- `totalAmbassadors`: Unique ambassadors
- `totalRecipients`: Unique recipients

## Configuration

### config.yaml
Main configuration file defining:
- Networks to index (Optimism Mainnet)
- Contract addresses
- Events to track
- Field selections for additional data

### schema.graphql
GraphQL schema defining data entities and relationships

### src/EventHandlers.ts
TypeScript handlers that process events and update the database

## Environment Variables

No environment variables required - all configuration is in `config.yaml`

## Performance

Envio uses **HyperSync** technology for blazing-fast indexing:
- Indexes millions of events in minutes
- 100x faster than traditional JSON-RPC
- Real-time event streaming
- Automatic historical sync

## Integration with Main App

The indexed data can be queried from the Next.js app:

```typescript
// Example API route using Envio GraphQL endpoint
import { gql, request } from 'graphql-request';

const ENVIO_ENDPOINT = 'http://localhost:8080/graphql';

const GET_AMBASSADOR_STATS = gql`
  query GetAmbassadorStats($address: String!) {
    ambassador(id: $address) {
      totalDistributions
      totalPulpaMinted
      totalPulpaReceived
    }
  }
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address')?.toLowerCase();

  const data = await request(ENVIO_ENDPOINT, GET_AMBASSADOR_STATS, {
    address,
  });

  return Response.json(data);
}
```

## Troubleshooting

**Indexer not starting:**
- Run `npm run codegen` to regenerate types
- Check `config.yaml` syntax
- Verify contract address is correct

**Missing events:**
- Ensure `start_block` is set correctly (0 for auto-detection)
- Check network ID is 10 (Optimism)
- Verify events are emitted from the contract

**GraphQL errors:**
- Regenerate schema with `npm run codegen`
- Check entity relationships in `schema.graphql`
- Ensure handlers are updating entities correctly

## Resources

- [Envio Documentation](https://docs.envio.dev)
- [HyperSync Overview](https://docs.envio.dev/docs/HyperSync)
- [Optimism Contract Verification](https://optimistic.etherscan.io/address/0x029263aA1BE88127f1794780D9eEF453221C2f30)

## License

MIT
