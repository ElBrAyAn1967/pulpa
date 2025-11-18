import { isAddress } from 'viem';

const testAddresses = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  '0x1234567890123456789012345678901234567890',
  'not-a-wallet',
];

testAddresses.forEach(addr => {
  console.log(`${addr}: ${isAddress(addr)}`);
});
