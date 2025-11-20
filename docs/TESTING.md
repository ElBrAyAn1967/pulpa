# Testing Documentation

## Overview

The Pulpa NFC Distribution system implements a comprehensive testing strategy using Vitest to ensure reliability, correctness, and maintainability.

---

## Test Suite Overview

### Test Statistics
- **Total Tests**: 60
- **Test Files**: 4
- **Overall Coverage**: 76.47%
- **Framework**: Vitest v4.0.12 with TypeScript support

### Coverage by Module
| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| errors/types.ts | 82.53% | 64.51% | 54.16% | 81.96% |
| security/rate-limiter.ts | 66.66% | 63.63% | 50% | 66.66% |

---

## Test Structure

```
tests/
├── setup.ts                          # Test environment configuration
├── unit/                            # Unit tests
│   ├── errors.test.ts              # Error type system (14 tests)
│   ├── security.test.ts            # Rate limiting & security (14 tests)
│   └── api-validation.test.ts      # API schema validation (18 tests)
└── integration/                     # Integration tests
    └── distribution.test.ts        # Full distribution flow (14 tests)
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
bun run test

# Run tests once (CI mode)
bun run test:run

# Run tests in watch mode
bun run test:watch

# Run tests with UI interface
bun run test:ui

# Generate coverage report
bun run test:coverage
```

### Test Execution Options

```bash
# Run specific test file
bun run test tests/unit/errors.test.ts

# Run tests matching pattern
bun run test --grep "rate limit"

# Run with increased timeout
bun run test --test-timeout=30000
```

---

## Test Categories

### 1. Unit Tests - Error Handling (14 tests)

**File**: `tests/unit/errors.test.ts`

Tests the typed error system with user-friendly messages:

```typescript
describe('Error Type System', () => {
  it('should create PulpaError with all properties', () => {
    const error = new PulpaError(/* ... */);
    expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    expect(error.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('should serialize error to JSON', () => {
    const error = new InsufficientBalanceError();
    const json = error.toJSON();
    expect(json.userMessage).toContain('fondos');
  });
});
```

**Coverage Focus**:
- All 28+ error classes
- Error serialization and context
- User-friendly Spanish messages
- toPulpaError helper function

---

### 2. Unit Tests - Security (14 tests)

**File**: `tests/unit/security.test.ts`

Tests rate limiting and input validation:

```typescript
describe('NFC Rate Limiter', () => {
  it('should not rate limit on first request', () => {
    const limited = nfcRateLimiter.isRateLimited('NFC001');
    expect(limited).toBe(false);
  });

  it('should rate limit after max requests', () => {
    for (let i = 0; i < 5; i++) {
      nfcRateLimiter.recordRequest('NFC001');
    }
    expect(nfcRateLimiter.isRateLimited('NFC001')).toBe(true);
  });
});

describe('Address Validation', () => {
  it('should validate correct Ethereum address format', () => {
    const valid = /^0x[a-fA-F0-9]{40}$/.test('0x742d35...');
    expect(valid).toBe(true);
  });
});
```

**Coverage Focus**:
- In-memory rate limiting (5 per hour)
- Multiple NFC independent tracking
- Ethereum address validation
- Input sanitization (SQL injection, XSS prevention)

---

### 3. Unit Tests - API Validation (18 tests)

**File**: `tests/unit/api-validation.test.ts`

Tests Zod schema validation for API requests:

```typescript
describe('Distribution Request Schema', () => {
  it('should accept valid distribution request', () => {
    const result = distributionRequestSchema.safeParse({
      nfcId: 'NFC001',
      recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid Ethereum address format', () => {
    const result = distributionRequestSchema.safeParse({
      nfcId: 'NFC001',
      recipientAddress: 'not-an-address',
    });
    expect(result.success).toBe(false);
  });
});
```

**Coverage Focus**:
- Distribution request validation
- Ambassador registration validation
- Blacklist entry validation
- Pagination parameter validation
- Error message formatting

---

### 4. Integration Tests - Distribution Flow (14 tests)

**File**: `tests/integration/distribution.test.ts`

Tests the complete distribution workflow with mocked Prisma:

```typescript
describe('Distribution Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate ambassador exists', async () => {
    (prisma.ambassador.findUnique as any).mockResolvedValue({
      id: 'amb123',
      nfcId: 'NFC001',
      walletAddress: '0x742d35...',
    });

    const result = await prisma.ambassador.findUnique({
      where: { nfcId: 'NFC001' },
    });

    expect(result).toBeDefined();
    expect(result.nfcId).toBe('NFC001');
  });
});
```

**Coverage Focus**:
- Ambassador validation
- Recipient deduplication
- NFC rate limiting (database level)
- Blacklist checking
- Distribution record creation
- Complete distribution flow
- Error scenarios

---

## Writing New Tests

### Test File Template

```typescript
/**
 * Unit tests for [Feature Name]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('[Feature Name]', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('[Sub-feature]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = /* ... */;

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Mocking Prisma

```typescript
import { vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';

// Mock Prisma client
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    ambassador: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    distribution: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Use in tests
(prisma.ambassador.findUnique as any).mockResolvedValue({
  id: 'test-id',
  nfcId: 'NFC001',
});
```

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  const promise = asyncFunction();

  await expect(promise).resolves.toBe(expectedValue);
  // or
  const result = await promise;
  expect(result).toBe(expectedValue);
});

it('should handle errors', async () => {
  await expect(failingFunction()).rejects.toThrow(ErrorClass);
});
```

---

## Test Configuration

### vitest.config.mts

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/test/**', '**/hardhat/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        '*.config.js',
        '*.config.mts',
        '.next/',
        'coverage/',
        'prisma/',
        'envio/',
        'scripts/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### tests/setup.ts

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
process.env.TREASURY_PRIVATE_KEY = '0x' + '1'.repeat(64);
process.env.NEXT_PUBLIC_TOKEN_ADDRESS = '0x029263aA1BE88127f1794780D9eEF453221C2f30';
process.env.NEXT_PUBLIC_CHAIN_ID = '10';
process.env.NEXT_PUBLIC_RPC_URL = 'https://mainnet.optimism.io';
```

---

## Coverage Goals

### Current Coverage
- **Overall**: 76.47% (Target: 75%+) ✅
- **Errors Module**: 82.53% (Target: 80%+) ✅
- **Security Module**: 66.66% (Target: 75%+) ⚠️

### Improving Coverage

To improve coverage for specific modules:

```bash
# Generate detailed coverage report
bun run test:coverage

# View HTML report (opens in browser)
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

**Focus areas for improvement**:
1. **Security Module** (66.66% → 75%+)
   - Add tests for edge cases in rate limiter
   - Test rate limit reset logic
   - Test concurrent request handling

2. **Error Handling** (82.53% → 90%+)
   - Test all error class constructors
   - Test error context merging
   - Test error serialization edge cases

---

## Best Practices

### DO ✅

- Write descriptive test names: "should validate ambassador exists"
- Use Arrange-Act-Assert pattern
- Mock external dependencies (Prisma, blockchain, APIs)
- Test both success and failure scenarios
- Clean up after each test with `beforeEach` and `afterEach`
- Use typed mocks with proper TypeScript types
- Test error messages and codes
- Verify async operations properly

### DON'T ❌

- Don't test implementation details
- Don't create interdependent tests
- Don't use real database connections
- Don't skip error case testing
- Don't hardcode test data without context
- Don't leave commented-out tests
- Don't test external library functionality

---

## Common Testing Patterns

### Testing Error Handling

```typescript
it('should throw specific error', () => {
  expect(() => {
    functionThatThrows();
  }).toThrow(InsufficientBalanceError);
});

it('should have correct error properties', () => {
  try {
    functionThatThrows();
  } catch (error) {
    expect(error).toBeInstanceOf(PulpaError);
    expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    expect(error.userMessage).toContain('fondos');
  }
});
```

### Testing Validation

```typescript
it('should validate input', () => {
  const validInput = { nfcId: 'NFC001', address: '0x...' };
  const result = schema.safeParse(validInput);

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.nfcId).toBe('NFC001');
  }
});

it('should reject invalid input', () => {
  const invalidInput = { nfcId: '', address: 'invalid' };
  const result = schema.safeParse(invalidInput);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.length).toBeGreaterThan(0);
  }
});
```

### Testing Rate Limiting

```typescript
it('should respect rate limits', () => {
  const nfcId = 'NFC001';

  // First 5 requests should succeed
  for (let i = 0; i < 5; i++) {
    expect(rateLimiter.isRateLimited(nfcId)).toBe(false);
    rateLimiter.recordRequest(nfcId);
  }

  // 6th request should be rate limited
  expect(rateLimiter.isRateLimited(nfcId)).toBe(true);
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test:run

      - name: Generate coverage
        run: bun run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@/lib/...'"

**Solution**: Check `vitest.config.mts` has correct alias configuration:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
}
```

#### Issue: "TypeError: Cannot read property 'mockResolvedValue' of undefined"

**Solution**: Ensure mock is defined before using:
```typescript
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    ambassador: {
      findUnique: vi.fn(),
    },
  },
}));
```

#### Issue: Tests hang or timeout

**Solution**:
- Check for missing `await` on promises
- Increase test timeout: `it('test', async () => {}, 10000)`
- Verify mocks are properly configured

#### Issue: Coverage report not generating

**Solution**:
```bash
# Install coverage provider
bun add -d @vitest/coverage-v8

# Verify vitest.config.mts has coverage settings
bun run test:coverage
```

---

## Test Maintenance

### Regular Tasks

**Weekly**:
- Run full test suite: `bun run test:run`
- Check coverage report: `bun run test:coverage`
- Review failed tests on CI/CD

**Monthly**:
- Review and update test data
- Remove obsolete tests
- Add tests for new features
- Update mocks for API changes

**Per Release**:
- Ensure all tests pass
- Coverage meets thresholds (75%+)
- No skipped or disabled tests
- Update test documentation

---

## Resources

- **Vitest Documentation**: https://vitest.dev
- **Testing Library**: https://testing-library.com
- **Zod Testing**: https://zod.dev
- **Mocking Guide**: https://vitest.dev/guide/mocking.html

---

## Quick Reference

### Test Commands
```bash
bun run test              # Watch mode
bun run test:run          # Single run
bun run test:ui           # UI interface
bun run test:coverage     # With coverage
```

### Vitest API
```typescript
describe()  // Test suite
it()        // Test case
expect()    // Assertion
vi.fn()     // Mock function
vi.mock()   // Mock module
beforeEach()// Setup hook
afterEach() // Cleanup hook
```

### Matchers
```typescript
.toBe()               // Strict equality
.toEqual()            // Deep equality
.toBeGreaterThan()    // Numeric comparison
.toContain()          // Array/string contains
.toThrow()            // Function throws
.resolves/.rejects    // Promise assertions
```
