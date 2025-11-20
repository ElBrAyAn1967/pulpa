# Error Handling & Monitoring Documentation

## Overview

The Pulpa NFC Distribution system implements comprehensive error handling and monitoring to ensure reliability, debuggability, and operational visibility.

---

## Architecture

### 1. **Error Types** (`lib/errors/types.ts`)

Typed error system with user-friendly messages:

```typescript
import { InsufficientBalanceError, TransactionFailedError } from '@/lib/errors/types';

// Throw typed error
throw new InsufficientBalanceError({
  currentBalance: '0.001 ETH',
  minterAddress: '0x...',
});
```

#### Error Categories:

- **Blockchain Errors**: Transaction failures, insufficient balance, network issues
- **Database Errors**: Connection failures, query errors
- **Security Errors**: Rate limiting, blacklisted addresses
- **Validation Errors**: Invalid input, missing fields
- **Configuration Errors**: Missing environment variables

---

### 2. **Logging System** (`lib/logging/logger.ts`)

Structured JSON logging with performance metrics:

```typescript
import { logger, LogCategory } from '@/lib/logging/logger';

// Basic logging
logger.info(LogCategory.DISTRIBUTION, 'Distribution started', {
  nfcId: 'NFC001',
  recipientAddress: '0x...',
});

// Error logging
logger.error(
  LogCategory.BLOCKCHAIN,
  'Transaction failed',
  error,
  { transactionHash: '0x...' }
);

// Performance logging
await logger.measurePerformance(
  'Blockchain minting',
  async () => await mintTokens(),
  { nfcId }
);

// Specialized logging
logger.logDistribution('Distribution completed', {
  nfcId: 'NFC001',
  ambassadorAddress: '0x...',
  recipientAddress: '0x...',
  transactionHash: '0x...',
  status: 'success',
});
```

#### Log Categories:

- `DISTRIBUTION`: Token distribution events
- `BLOCKCHAIN`: Blockchain transactions
- `DATABASE`: Database operations
- `SECURITY`: Security events (rate limits, blacklist)
- `API`: API requests/responses
- `SYSTEM`: System-level events
- `PERFORMANCE`: Performance metrics

---

### 3. **Monitoring & Alerts** (`lib/monitoring/alerts.ts`)

Automated monitoring with configurable alerts:

```typescript
import { monitoring } from '@/lib/monitoring/alerts';

// Alert on low balance
await monitoring.alertLowBalance('0.005 ETH', minterAddress);

// Alert on failed transaction
await monitoring.alertFailedTransaction(
  transactionHash,
  'Insufficient gas',
  { nfcId, recipientAddress }
);

// Alert on high error rate
await monitoring.alertHighErrorRate(15, 'last minute');

// Get system health
const health = monitoring.getHealthStatus();
// { status: 'healthy' | 'degraded' | 'critical', checks: {...}, alerts: [...] }
```

#### Alert Types:

1. **Low Balance**: Minter wallet below threshold (0.01 ETH)
2. **Failed Transaction**: Blockchain transaction failure
3. **High Error Rate**: >10 errors per minute
4. **Rate Limit Abuse**: Multiple rate limit violations
5. **Database Error**: Connection or query failures
6. **System Error**: Critical system failures

#### Alert Cooldowns:

- Low Balance: 1 hour
- Failed Transaction: 5 minutes
- High Error Rate: 10 minutes
- Rate Limit Abuse: 30 minutes
- Database Error: 5 minutes
- System Error: 5 minutes

---

### 4. **API Error Middleware** (`lib/middleware/errorHandler.ts`)

Consistent error responses across all APIs:

```typescript
import { withErrorHandling, handleApiError } from '@/lib/middleware/errorHandler';

// Wrap API route
export const POST = withErrorHandling(async (request) => {
  // Your logic here
  return createSuccessResponse(data);
});

// Manual error handling
try {
  // risky operation
} catch (error) {
  return handleApiError(error, { nfcId, recipientAddress });
}
```

#### Error Response Format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-19T..."
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "userMessage": "Has excedido el límite de distribuciones...",
    "timestamp": "2025-01-19T..."
  },
  "context": { ... } // Only in development
}
```

---

## Error Code Reference

### Blockchain Errors (502/503 status)

| Code | Description | User Message | HTTP Status |
|------|-------------|-------------|-------------|
| `INSUFFICIENT_BALANCE` | Minter wallet low on ETH | "El sistema no tiene suficientes fondos..." | 503 |
| `TRANSACTION_FAILED` | Blockchain transaction failed | "La transacción blockchain falló..." | 503 |
| `NETWORK_ERROR` | RPC connection failure | "Error de conexión de red..." | 502 |
| `GAS_ESTIMATION_FAILED` | Cannot estimate gas | "No se pudo estimar el costo..." | 503 |
| `MINTER_ROLE_MISSING` | Wallet lacks MINTER role | "El sistema no tiene los permisos necesarios..." | 403 |
| `CONTRACT_ERROR` | Smart contract error | "Error al interactuar con el contrato..." | 502 |

### Database Errors (500 status)

| Code | Description | User Message | HTTP Status |
|------|-------------|-------------|-------------|
| `DATABASE_CONNECTION_FAILED` | Cannot connect to database | "Error de conexión a la base de datos..." | 500 |
| `DATABASE_QUERY_FAILED` | Query execution failed | "Error al consultar la base de datos..." | 500 |
| `RECORD_NOT_FOUND` | Record doesn't exist | "No se encontró el registro solicitado." | 404 |

### Security Errors (403/429 status)

| Code | Description | User Message | HTTP Status |
|------|-------------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | "Has excedido el límite de distribuciones..." | 429 |
| `BLACKLISTED_ADDRESS` | Address is blocked | "Esta dirección ha sido bloqueada..." | 403 |
| `RECIPIENT_ALREADY_RECEIVED` | Duplicate distribution | "Esta dirección ya ha recibido tokens..." | 409 |
| `NFC_NOT_REGISTERED` | NFC not in system | "Este NFC no está registrado..." | 404 |
| `UNAUTHORIZED` | Permission denied | "No tienes permiso para realizar esta acción." | 401 |

### Validation Errors (400 status)

| Code | Description | User Message | HTTP Status |
|------|-------------|-------------|-------------|
| `INVALID_ADDRESS` | Invalid Ethereum address | "La dirección de wallet no es válida..." | 400 |
| `INVALID_INPUT` | Invalid input data | (Contextual message) | 400 |
| `MISSING_REQUIRED_FIELD` | Required field missing | "El campo X es requerido." | 400 |

### Configuration Errors (500 status)

| Code | Description | User Message | HTTP Status |
|------|-------------|-------------|-------------|
| `MISSING_ENV_VARIABLE` | Environment variable missing | "Error de configuración del sistema..." | 500 |
| `INVALID_CONFIGURATION` | Configuration invalid | "Error de configuración del sistema..." | 500 |

---

## Integration Guide

### Step 1: Use Typed Errors

```typescript
import { InvalidAddressError, TransactionFailedError } from '@/lib/errors/types';

// Validate address
if (!isValidAddress(address)) {
  throw new InvalidAddressError(address, { nfcId });
}

// Handle transaction failure
if (receipt.status !== 'success') {
  throw new TransactionFailedError('Transaction reverted', {
    transactionHash: hash,
    gasUsed: receipt.gasUsed.toString(),
  });
}
```

### Step 2: Add Logging

```typescript
import { logger, LogCategory } from '@/lib/logging/logger';

// Log operations
logger.info(LogCategory.DISTRIBUTION, 'Starting distribution', {
  nfcId,
  recipientAddress,
});

// Log errors
logger.error(
  LogCategory.BLOCKCHAIN,
  'Transaction failed',
  error,
  { transactionHash }
);

// Measure performance
const result = await logger.measurePerformance(
  'Mint tokens',
  async () => await mintTokens(),
  { nfcId }
);
```

### Step 3: Wrap API Routes

```typescript
import { withErrorHandling, createSuccessResponse } from '@/lib/middleware/errorHandler';

export const POST = withErrorHandling(async (request) => {
  // Your logic here

  // Return success
  return createSuccessResponse({ distributionId, transactionHash });
});
```

---

## Monitoring Integration

### Sentry Integration

Add to `lib/logging/logger.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

private sendToMonitoring(entry: LogEntry) {
  if (this.isProduction && entry.level === LogLevel.ERROR) {
    Sentry.captureException(entry.error, {
      contexts: {
        pulpa: entry.context,
      },
      level: entry.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error',
    });
  }
}
```

### Slack Webhooks

Add to `lib/monitoring/alerts.ts`:

```typescript
private async sendSlackAlert(context: AlertContext) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 ${context.type}: ${context.message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${context.type}*\n${context.message}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Severity: ${context.severity} | Time: ${context.timestamp}`,
            },
          ],
        },
      ],
    }),
  });
}
```

---

## Testing Error Handling

### Test Script

```typescript
// scripts/test-error-handling.ts
import { getTreasuryService } from '@/lib/services/TreasuryServiceEnhanced';
import { logger, LogCategory } from '@/lib/logging/logger';

async function testErrors() {
  const treasury = getTreasuryService();

  // Test 1: Invalid address
  try {
    await treasury.mintDistribution('invalid', '0x...');
  } catch (error) {
    logger.error(LogCategory.SYSTEM, 'Test 1: Invalid address caught', error);
  }

  // Test 2: Gas estimation
  try {
    await treasury.estimateGas('0x...', '0x...');
  } catch (error) {
    logger.error(LogCategory.SYSTEM, 'Test 2: Gas estimation error', error);
  }

  // Test 3: Balance check
  try {
    await treasury.checkMinterBalance();
  } catch (error) {
    logger.error(LogCategory.SYSTEM, 'Test 3: Balance check error', error);
  }
}

testErrors();
```

### Expected Behavior

1. **Invalid Address**: Throws `InvalidAddressError`, logs with context
2. **Gas Estimation**: Throws `GasEstimationError`, logs attempt and failure
3. **Balance Check**: Returns balance or throws `NetworkError`

---

## Best Practices

### DO ✅

- Use typed errors (`InsufficientBalanceError`, not generic `Error`)
- Log all operations with context (`nfcId`, `transactionHash`, etc.)
- Measure performance for slow operations
- Return user-friendly messages in Spanish
- Include technical details in logs, not user messages
- Track errors for monitoring and alerts

### DON'T ❌

- Throw generic `Error` objects
- Expose internal errors to users
- Log without context
- Ignore errors silently
- Skip performance measurement on critical paths
- Mix technical jargon in user messages

---

## Performance Targets

| Operation | Target | Alert Threshold |
|-----------|--------|----------------|
| API Request | < 2s | > 5s |
| Database Query | < 500ms | > 2s |
| Blockchain Transaction | < 30s | > 60s |
| Security Checks | < 100ms | > 500ms |

---

## Troubleshooting

### High Error Rate Alert

**Symptoms**: Alert "High error rate detected: 15 errors in last minute"

**Investigation**:
1. Check logs: `grep "ERROR" logs/production.log`
2. Identify error patterns: Most common error code
3. Check monitoring dashboard for trends
4. Review recent deployments

**Common Causes**:
- RPC provider rate limiting
- Database connection pool exhausted
- Blockchain network congestion
- Invalid configuration

### Low Balance Alert

**Symptoms**: Alert "Minter balance critically low"

**Action**:
1. Check current balance: `bun run scripts/check-wallet.ts`
2. Fund minter wallet with ETH
3. Verify transaction confirmed
4. Alert clears automatically after balance restored

### Failed Transaction Alert

**Symptoms**: Alert "Transaction failed: Insufficient gas"

**Investigation**:
1. Check transaction on Optimistic Etherscan
2. Verify minter wallet has ETH
3. Check RPC endpoint status
4. Review gas price settings

---

## Monitoring Dashboard

### Key Metrics

1. **Error Rate**: Errors per minute
2. **Response Time**: P50, P95, P99 latency
3. **Success Rate**: Successful distributions / total attempts
4. **Minter Balance**: Current ETH balance
5. **Active Alerts**: Current active alerts
6. **Rate Limit Hits**: Rate limit violations per hour

### Health Check Endpoint

```http
GET /api/health

Response:
{
  "status": "healthy",
  "checks": {
    "database": true,
    "blockchain": true,
    "minterBalance": true
  },
  "alerts": []
}
```

---

## Support

- **Error Logs**: Check Vercel/Railway logs or local console
- **Monitoring**: Sentry dashboard (if configured)
- **Alerts**: Slack channel (if configured)
- **Documentation**: This file and inline code comments
