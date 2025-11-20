/**
 * Unit tests for API request validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the distribution request schema
const distributionRequestSchema = z.object({
  nfcId: z.string().min(1, 'NFC ID is required'),
  recipientAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

describe('API Validation', () => {
  describe('Distribution Request Schema', () => {
    it('should accept valid distribution request', () => {
      const validRequest = {
        nfcId: 'NFC001',
        recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      };

      const result = distributionRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nfcId).toBe('NFC001');
        expect(result.data.recipientAddress).toBe(
          '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        );
      }
    });

    it('should reject empty NFC ID', () => {
      const invalidRequest = {
        nfcId: '',
        recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      };

      const result = distributionRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('NFC ID is required');
      }
    });

    it('should reject missing NFC ID', () => {
      const invalidRequest = {
        recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      };

      const result = distributionRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should reject invalid Ethereum address format', () => {
      const invalidRequests = [
        { nfcId: 'NFC001', recipientAddress: '0x123' }, // Too short
        { nfcId: 'NFC001', recipientAddress: '742d35Cc6634C0532925a3b844Bc454e4438f44e' }, // Missing 0x
        { nfcId: 'NFC001', recipientAddress: '0xGGGG35Cc6634C0532925a3b844Bc454e4438f44e' }, // Invalid chars
        { nfcId: 'NFC001', recipientAddress: 'not-an-address' }, // Random string
        { nfcId: 'NFC001', recipientAddress: '' }, // Empty
      ];

      invalidRequests.forEach((request) => {
        const result = distributionRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid Ethereum address');
        }
      });
    });

    it('should reject missing recipient address', () => {
      const invalidRequest = {
        nfcId: 'NFC001',
      };

      const result = distributionRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
    });

    it('should accept valid addresses with different cases', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Mixed case
        '0x742D35CC6634C0532925A3B844BC454E4438F44E', // Uppercase
        '0x742d35cc6634c0532925a3b844bc454e4438f44e', // Lowercase
      ];

      validAddresses.forEach((address) => {
        const result = distributionRequestSchema.safeParse({
          nfcId: 'NFC001',
          recipientAddress: address,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Ambassador Registration Schema', () => {
    const ambassadorSchema = z.object({
      nfcId: z.string().min(3, 'NFC ID must be at least 3 characters'),
      walletAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
      name: z.string().min(1, 'Name is required').optional(),
      email: z.string().email('Invalid email format').optional(),
    });

    it('should accept valid ambassador registration', () => {
      const validRegistration = {
        nfcId: 'NFC001',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = ambassadorSchema.safeParse(validRegistration);

      expect(result.success).toBe(true);
    });

    it('should accept registration without optional fields', () => {
      const minimalRegistration = {
        nfcId: 'NFC001',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      };

      const result = ambassadorSchema.safeParse(minimalRegistration);

      expect(result.success).toBe(true);
    });

    it('should reject NFC ID shorter than 3 characters', () => {
      const invalidRegistration = {
        nfcId: 'AB',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      };

      const result = ambassadorSchema.safeParse(invalidRegistration);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject invalid email format', () => {
      const invalidEmails = ['not-an-email', '@example.com', 'user@', 'user@.com'];

      invalidEmails.forEach((email) => {
        const result = ambassadorSchema.safeParse({
          nfcId: 'NFC001',
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          email,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Blacklist Entry Schema', () => {
    const blacklistSchema = z.object({
      address: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
      reason: z.string().min(5, 'Reason must be at least 5 characters'),
      addedBy: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
    });

    it('should accept valid blacklist entry', () => {
      const validEntry = {
        address: '0x1234567890123456789012345678901234567890',
        reason: 'Suspicious activity detected',
        addedBy: '0xABCDEF1234567890123456789012345678901234',
      };

      const result = blacklistSchema.safeParse(validEntry);

      expect(result.success).toBe(true);
    });

    it('should reject blacklist entry with short reason', () => {
      const invalidEntry = {
        address: '0xBAD1234567890123456789012345678901234567',
        reason: 'Bad',
        addedBy: '0xADMIN1234567890123456789012345678901234',
      };

      const result = blacklistSchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters');
      }
    });

    it('should reject invalid address formats', () => {
      const invalidEntry = {
        address: 'not-an-address',
        reason: 'Valid reason here',
        addedBy: '0xADMIN1234567890123456789012345678901234',
      };

      const result = blacklistSchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
    });
  });

  describe('Query Parameters Validation', () => {
    const paginationSchema = z.object({
      page: z.preprocess(
        (val) => (val === undefined ? 1 : Number(val)),
        z.number().positive()
      ),
      limit: z.preprocess(
        (val) => (val === undefined ? 10 : Number(val)),
        z.number().positive()
      ),
    });

    it('should accept valid pagination parameters', () => {
      const valid = { page: '2', limit: '20' };
      const result = paginationSchema.safeParse(valid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should use default values when parameters are missing', () => {
      const result = paginationSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject non-numeric pagination parameters', () => {
      const invalid = { page: 'abc', limit: '20' };
      const result = paginationSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });
  });

  describe('Error Response Format', () => {
    it('should format validation errors correctly', () => {
      const invalidRequest = {
        nfcId: '',
        recipientAddress: 'invalid',
      };

      const result = distributionRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2); // Both fields invalid
        expect(result.error.issues[0]).toHaveProperty('message');
        expect(result.error.issues[0]).toHaveProperty('path');
      }
    });

    it('should include field paths in validation errors', () => {
      const invalidRequest = {
        nfcId: '',
        recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      };

      const result = distributionRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('nfcId');
      }
    });
  });
});
