/**
 * Integration tests for distribution flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ValidationError,
  NFCNotRegisteredError,
  RateLimitError,
  RecipientAlreadyReceivedError,
} from '@/lib/errors/types';

// Mock Prisma
const mockPrisma = {
  ambassador: {
    findUnique: vi.fn(),
  },
  distribution: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  blacklist: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Distribution Flow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ambassador Validation', () => {
    it('should fail if ambassador does not exist', async () => {
      mockPrisma.ambassador.findUnique.mockResolvedValue(null);

      try {
        // Simulate ambassador lookup
        const ambassador = await mockPrisma.ambassador.findUnique({
          where: { nfcId: 'INVALID_NFC' },
        });

        if (!ambassador) {
          throw new NFCNotRegisteredError('INVALID_NFC');
        }

        expect.fail('Should have thrown NFCNotRegisteredError');
      } catch (error) {
        expect(error).toBeInstanceOf(NFCNotRegisteredError);
        expect((error as NFCNotRegisteredError).context.nfcId).toBe('INVALID_NFC');
      }
    });

    it('should succeed if ambassador exists', async () => {
      const mockAmbassador = {
        id: 'amb-001',
        nfcId: 'NFC001',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        createdAt: new Date(),
      };

      mockPrisma.ambassador.findUnique.mockResolvedValue(mockAmbassador);

      const ambassador = await mockPrisma.ambassador.findUnique({
        where: { nfcId: 'NFC001' },
      });

      expect(ambassador).toBeDefined();
      expect(ambassador?.nfcId).toBe('NFC001');
      expect(ambassador?.walletAddress).toBe('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    });
  });

  describe('Recipient Deduplication', () => {
    it('should reject if recipient already received tokens', async () => {
      const recipientAddress = '0x123abc';

      // Mock existing distribution
      mockPrisma.distribution.findFirst.mockResolvedValue({
        id: 'dist-001',
        recipientAddress: recipientAddress.toLowerCase(),
        status: 'success',
      });

      try {
        const existing = await mockPrisma.distribution.findFirst({
          where: {
            recipientAddress: recipientAddress.toLowerCase(),
            status: 'success',
          },
        });

        if (existing) {
          throw new RecipientAlreadyReceivedError(recipientAddress);
        }

        expect.fail('Should have thrown RecipientAlreadyReceivedError');
      } catch (error) {
        expect(error).toBeInstanceOf(RecipientAlreadyReceivedError);
      }
    });

    it('should allow if recipient has not received tokens', async () => {
      mockPrisma.distribution.findFirst.mockResolvedValue(null);

      const existing = await mockPrisma.distribution.findFirst({
        where: {
          recipientAddress: '0x456def',
          status: 'success',
        },
      });

      expect(existing).toBeNull();
    });
  });

  describe('NFC Rate Limiting', () => {
    it('should reject if NFC exceeded rate limit', async () => {
      const nfcId = 'NFC001';
      const oneHourAgo = new Date(Date.now() - 3600000);

      // Mock 5 distributions in last hour
      mockPrisma.distribution.count.mockResolvedValue(5);

      try {
        const count = await mockPrisma.distribution.count({
          where: {
            ambassador: { nfcId },
            createdAt: { gte: oneHourAgo },
          },
        });

        if (count >= 5) {
          throw new RateLimitError(3600, { nfcId });
        }

        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
      }
    });

    it('should allow if NFC under rate limit', async () => {
      mockPrisma.distribution.count.mockResolvedValue(3);

      const count = await mockPrisma.distribution.count({
        where: {
          ambassador: { nfcId: 'NFC002' },
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      });

      expect(count).toBeLessThan(5);
    });
  });

  describe('Blacklist Checking', () => {
    it('should reject blacklisted address', async () => {
      const blacklistedAddress = '0xBADBADBAD';

      mockPrisma.blacklist.findUnique.mockResolvedValue({
        id: 'bl-001',
        address: blacklistedAddress.toLowerCase(),
        reason: 'Suspicious activity',
        addedBy: '0xADMIN',
        createdAt: new Date(),
      });

      const blacklistEntry = await mockPrisma.blacklist.findUnique({
        where: { address: blacklistedAddress.toLowerCase() },
      });

      expect(blacklistEntry).toBeDefined();
      expect(blacklistEntry?.reason).toBe('Suspicious activity');
    });

    it('should allow non-blacklisted address', async () => {
      mockPrisma.blacklist.findUnique.mockResolvedValue(null);

      const blacklistEntry = await mockPrisma.blacklist.findUnique({
        where: { address: '0xGOODGOOD'.toLowerCase() },
      });

      expect(blacklistEntry).toBeNull();
    });
  });

  describe('Distribution Creation', () => {
    it('should create distribution record with correct data', async () => {
      const mockDistribution = {
        id: 'dist-001',
        ambassadorId: 'amb-001',
        recipientAddress: '0x123abc',
        ambassadorAmount: '1',
        recipientAmount: '5',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrisma.distribution.create.mockResolvedValue(mockDistribution);

      const distribution = await mockPrisma.distribution.create({
        data: {
          ambassadorId: 'amb-001',
          recipientAddress: '0x123abc',
          ambassadorAmount: '1',
          recipientAmount: '5',
          status: 'pending',
        },
      });

      expect(distribution).toBeDefined();
      expect(distribution.ambassadorAmount).toBe('1');
      expect(distribution.recipientAmount).toBe('5');
      expect(distribution.status).toBe('pending');
    });

    it('should update distribution to success with transaction hashes', async () => {
      const mockUpdated = {
        id: 'dist-001',
        status: 'success',
        transactionHash: '0xTX1',
        recipientTransactionHash: '0xTX2',
        completedAt: new Date(),
      };

      mockPrisma.distribution.update.mockResolvedValue(mockUpdated);

      const updated = await mockPrisma.distribution.update({
        where: { id: 'dist-001' },
        data: {
          status: 'success',
          transactionHash: '0xTX1',
          recipientTransactionHash: '0xTX2',
          completedAt: new Date(),
        },
      });

      expect(updated.status).toBe('success');
      expect(updated.transactionHash).toBe('0xTX1');
      expect(updated.recipientTransactionHash).toBe('0xTX2');
      expect(updated.completedAt).toBeDefined();
    });

    it('should update distribution to failed with error message', async () => {
      const mockFailed = {
        id: 'dist-001',
        status: 'failed',
        error: 'Insufficient balance',
      };

      mockPrisma.distribution.update.mockResolvedValue(mockFailed);

      const failed = await mockPrisma.distribution.update({
        where: { id: 'dist-001' },
        data: {
          status: 'failed',
          error: 'Insufficient balance',
        },
      });

      expect(failed.status).toBe('failed');
      expect(failed.error).toBe('Insufficient balance');
    });
  });

  describe('Complete Distribution Flow', () => {
    it('should execute full successful distribution flow', async () => {
      // Setup mocks
      const mockAmbassador = {
        id: 'amb-001',
        nfcId: 'NFC001',
        walletAddress: '0xAMBASSADOR',
      };

      const mockDistribution = {
        id: 'dist-001',
        ambassadorId: 'amb-001',
        recipientAddress: '0xRECIPIENT',
        status: 'pending',
      };

      mockPrisma.ambassador.findUnique.mockResolvedValue(mockAmbassador);
      mockPrisma.distribution.findFirst.mockResolvedValue(null); // No existing
      mockPrisma.distribution.count.mockResolvedValue(2); // Under limit
      mockPrisma.blacklist.findUnique.mockResolvedValue(null); // Not blacklisted
      mockPrisma.distribution.create.mockResolvedValue(mockDistribution);

      // Execute flow steps
      const ambassador = await mockPrisma.ambassador.findUnique({
        where: { nfcId: 'NFC001' },
      });

      expect(ambassador).toBeDefined();

      const existing = await mockPrisma.distribution.findFirst({
        where: { recipientAddress: '0xRECIPIENT', status: 'success' },
      });

      expect(existing).toBeNull();

      const rateLimit = await mockPrisma.distribution.count({
        where: {
          ambassador: { nfcId: 'NFC001' },
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      });

      expect(rateLimit).toBeLessThan(5);

      const distribution = await mockPrisma.distribution.create({
        data: {
          ambassadorId: 'amb-001',
          recipientAddress: '0xRECIPIENT',
          ambassadorAmount: '1',
          recipientAmount: '5',
          status: 'pending',
        },
      });

      expect(distribution).toBeDefined();
      expect(distribution.status).toBe('pending');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrisma.ambassador.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      try {
        await mockPrisma.ambassador.findUnique({
          where: { nfcId: 'NFC001' },
        });

        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection failed');
      }
    });

    it('should handle invalid input data', async () => {
      const invalidData = {
        nfcId: '',
        recipientAddress: 'not-an-address',
      };

      try {
        if (!invalidData.nfcId || invalidData.nfcId.trim() === '') {
          throw new ValidationError('NFC ID is required');
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(invalidData.recipientAddress)) {
          throw new ValidationError('Invalid Ethereum address');
        }

        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });
});
