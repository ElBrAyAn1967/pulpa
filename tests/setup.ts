/**
 * Test setup file
 * Runs before all tests
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables for tests
if (!process.env.TREASURY_PRIVATE_KEY) {
  process.env.TREASURY_PRIVATE_KEY = '0x' + '1'.repeat(64);
}
if (!process.env.NEXT_PUBLIC_TOKEN_ADDRESS) {
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS = '0x029263aA1BE88127f1794780D9eEF453221C2f30';
}
if (!process.env.NEXT_PUBLIC_CHAIN_ID) {
  process.env.NEXT_PUBLIC_CHAIN_ID = '10';
}
if (!process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL) {
  process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL = 'https://mainnet.optimism.io';
}
if (!process.env.OPTIMISM_RPC_URL) {
  process.env.OPTIMISM_RPC_URL = 'https://mainnet.optimism.io';
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test?sslmode=require';
}
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = 'test-secret-key-for-testing-purposes-only';
}
if (!process.env.AUTH_URL) {
  process.env.AUTH_URL = 'http://localhost:3000';
}
