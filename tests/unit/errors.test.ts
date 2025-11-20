/**
 * Unit tests for error handling system
 */

import { describe, it, expect } from 'vitest';
import {
  PulpaError,
  ErrorCode,
  ErrorSeverity,
  InsufficientBalanceError,
  TransactionFailedError,
  NetworkError,
  RateLimitError,
  BlacklistedAddressError,
  RecipientAlreadyReceivedError,
  NFCNotRegisteredError,
  ValidationError,
  toPulpaError,
} from '@/lib/errors/types';

describe('Error Types', () => {
  describe('PulpaError', () => {
    it('should create a PulpaError with all properties', () => {
      const error = new PulpaError(
        ErrorCode.UNKNOWN_ERROR,
        'Technical message',
        'User message',
        ErrorSeverity.HIGH,
        { key: 'value' },
        true
      );

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.message).toBe('Technical message');
      expect(error.userMessage).toBe('User message');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toEqual({ key: 'value' });
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    it('should serialize to JSON correctly', () => {
      const error = new PulpaError(
        ErrorCode.INVALID_INPUT,
        'Test error',
        'User error',
        ErrorSeverity.LOW,
        { test: true }
      );

      const json = error.toJSON();

      expect(json.name).toBe('PulpaError');
      expect(json.code).toBe(ErrorCode.INVALID_INPUT);
      expect(json.message).toBe('Test error');
      expect(json.userMessage).toBe('User error');
      expect(json.severity).toBe(ErrorSeverity.LOW);
      expect(json.context).toEqual({ test: true });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('InsufficientBalanceError', () => {
    it('should create error with correct properties', () => {
      const error = new InsufficientBalanceError({
        currentBalance: '0.001 ETH',
        minterAddress: '0x123',
      });

      expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.userMessage).toContain('suficientes fondos');
      expect(error.context.currentBalance).toBe('0.001 ETH');
      expect(error.context.minterAddress).toBe('0x123');
    });
  });

  describe('TransactionFailedError', () => {
    it('should create error with transaction details', () => {
      const error = new TransactionFailedError('Gas too high', {
        transactionHash: '0xabc',
        gasUsed: '100000',
      });

      expect(error.code).toBe(ErrorCode.TRANSACTION_FAILED);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.message).toContain('Gas too high');
      expect(error.context.transactionHash).toBe('0xabc');
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('RPC connection failed');

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.userMessage).toContain('conexión de red');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry time', () => {
      const error = new RateLimitError(300, { nfcId: 'NFC001' });

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.retryAfter).toBe(300);
      expect(error.context.nfcId).toBe('NFC001');
      expect(error.userMessage).toContain('límite de distribuciones');
    });
  });

  describe('BlacklistedAddressError', () => {
    it('should create blacklist error with reason', () => {
      const error = new BlacklistedAddressError('0x123', 'Suspicious activity');

      expect(error.code).toBe(ErrorCode.BLACKLISTED_ADDRESS);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context.blacklistedAddress).toBe('0x123');
      expect(error.context.reason).toBe('Suspicious activity');
      expect(error.userMessage).toContain('bloqueada');
    });
  });

  describe('RecipientAlreadyReceivedError', () => {
    it('should create duplicate distribution error', () => {
      const error = new RecipientAlreadyReceivedError('0x456');

      expect(error.code).toBe(ErrorCode.RECIPIENT_ALREADY_RECEIVED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.recipientAddress).toBe('0x456');
      expect(error.userMessage).toContain('ya ha recibido');
    });
  });

  describe('NFCNotRegisteredError', () => {
    it('should create NFC not found error', () => {
      const error = new NFCNotRegisteredError('NFC999');

      expect(error.code).toBe(ErrorCode.NFC_NOT_REGISTERED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.nfcId).toBe('NFC999');
      expect(error.userMessage).toContain('no está registrado');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid email format');

      expect(error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.userMessage).toBe('Invalid email format');
    });
  });

  describe('toPulpaError', () => {
    it('should return PulpaError as-is', () => {
      const originalError = new ValidationError('Test');
      const result = toPulpaError(originalError);

      expect(result).toBe(originalError);
    });

    it('should convert Error to PulpaError', () => {
      const originalError = new Error('Standard error');
      const result = toPulpaError(originalError);

      expect(result).toBeInstanceOf(PulpaError);
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Standard error');
      expect(result.context.originalError).toBe('Standard error');
    });

    it('should convert unknown error to PulpaError', () => {
      const result = toPulpaError('String error');

      expect(result).toBeInstanceOf(PulpaError);
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.context.originalError).toBe('String error');
    });

    it('should merge provided context', () => {
      const result = toPulpaError(new Error('Test'), { nfcId: 'NFC001' });

      expect(result.context.nfcId).toBe('NFC001');
    });
  });
});
