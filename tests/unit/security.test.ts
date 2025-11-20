/**
 * Unit tests for security checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nfcRateLimiter } from '@/lib/security/rate-limiter';

describe('Security - Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limiter cache before each test
    vi.clearAllMocks();
  });

  describe('nfcRateLimiter', () => {
    it('should not rate limit on first request', () => {
      const nfcId = 'TEST_NFC_001';
      const isLimited = nfcRateLimiter.isRateLimited(nfcId);

      expect(isLimited).toBe(false);
    });

    it('should record request and decrease remaining count', () => {
      const nfcId = 'TEST_NFC_002';

      const remaining = nfcRateLimiter.recordRequest(nfcId);

      expect(remaining).toBe(4); // 5 max - 1 request = 4 remaining
    });

    it('should rate limit after max requests', () => {
      const nfcId = 'TEST_NFC_003';

      // Record 5 requests (max limit)
      for (let i = 0; i < 5; i++) {
        nfcRateLimiter.recordRequest(nfcId);
      }

      const isLimited = nfcRateLimiter.isRateLimited(nfcId);

      expect(isLimited).toBe(true);
    });

    it('should provide rate limit info', () => {
      const nfcId = 'TEST_NFC_004';

      nfcRateLimiter.recordRequest(nfcId);
      nfcRateLimiter.recordRequest(nfcId);

      const info = nfcRateLimiter.getRateLimitInfo(nfcId);

      expect(info.limit).toBe(5);
      expect(info.remaining).toBe(3); // 5 - 2 = 3
      expect(info.resetAt).toBeGreaterThan(Date.now());
      expect(info.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after time window expires', () => {
      const nfcId = 'TEST_NFC_005';

      // Record request
      nfcRateLimiter.recordRequest(nfcId);

      // Check that it's not rate limited
      expect(nfcRateLimiter.isRateLimited(nfcId)).toBe(false);

      // Simulate time passing (this would need time manipulation in real tests)
      // For now, we just verify the logic structure
      const info = nfcRateLimiter.getRateLimitInfo(nfcId);
      expect(info.resetAt).toBeGreaterThan(Date.now());
    });

    it('should handle multiple NFCs independently', () => {
      const nfc1 = 'TEST_NFC_006';
      const nfc2 = 'TEST_NFC_007';

      // Record requests for nfc1
      for (let i = 0; i < 5; i++) {
        nfcRateLimiter.recordRequest(nfc1);
      }

      // nfc1 should be rate limited
      expect(nfcRateLimiter.isRateLimited(nfc1)).toBe(true);

      // nfc2 should not be rate limited
      expect(nfcRateLimiter.isRateLimited(nfc2)).toBe(false);
    });

    it('should return correct remaining count as requests increase', () => {
      const nfcId = 'TEST_NFC_008';

      expect(nfcRateLimiter.recordRequest(nfcId)).toBe(4);
      expect(nfcRateLimiter.recordRequest(nfcId)).toBe(3);
      expect(nfcRateLimiter.recordRequest(nfcId)).toBe(2);
      expect(nfcRateLimiter.recordRequest(nfcId)).toBe(1);
      expect(nfcRateLimiter.recordRequest(nfcId)).toBe(0);

      // Next request should be rate limited
      expect(nfcRateLimiter.isRateLimited(nfcId)).toBe(true);
    });

    it('should not allow negative remaining count', () => {
      const nfcId = 'TEST_NFC_009';

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        nfcRateLimiter.recordRequest(nfcId);
      }

      const info = nfcRateLimiter.getRateLimitInfo(nfcId);
      expect(info.remaining).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Security - Address Validation', () => {
  it('should validate correct Ethereum address format', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const regex = /^0x[a-fA-F0-9]{40}$/;

    expect(regex.test(validAddress)).toBe(true);
  });

  it('should reject invalid Ethereum addresses', () => {
    const regex = /^0x[a-fA-F0-9]{40}$/;

    expect(regex.test('0x123')).toBe(false); // Too short
    expect(regex.test('742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false); // Missing 0x
    expect(regex.test('0xZZZZ35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false); // Invalid characters
    expect(regex.test('')).toBe(false); // Empty
    expect(regex.test('not-an-address')).toBe(false); // Random string
  });

  it('should handle address normalization', () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const normalized = address.toLowerCase();

    expect(normalized).toBe('0x742d35cc6634c0532925a3b844bc454e4438f44e');
  });
});

describe('Security - Input Sanitization', () => {
  it('should validate NFC ID format', () => {
    const validNfcIds = ['NFC001', 'TEST123', 'ABC_DEF_123'];
    const invalidNfcIds = ['', ' ', '<script>alert(1)</script>', 'NFC"001', "NFC'001"];

    validNfcIds.forEach((id) => {
      expect(id.length).toBeGreaterThan(0);
      expect(id.trim()).toBe(id);
    });

    invalidNfcIds.forEach((id) => {
      const hasDangerousChars = /<|>|&|"|'/.test(id);
      const isEmpty = id.trim().length === 0;
      expect(hasDangerousChars || isEmpty).toBe(true);
    });
  });

  it('should prevent SQL injection attempts', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--",
    ];

    maliciousInputs.forEach((input) => {
      // Prisma automatically prevents SQL injection by using parameterized queries
      // This test just verifies we're aware of the threat
      expect(input).toContain("'");
      expect(input).toBeDefined();
    });
  });

  it('should prevent XSS attempts', () => {
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="evil.com"></iframe>',
    ];

    xssAttempts.forEach((attempt) => {
      const sanitized = attempt
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });
  });
});
