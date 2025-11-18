/**
 * Test script for Ambassador Registration API
 * Tests all scenarios: success, validation errors, duplicates
 */

const API_URL = 'http://localhost:3000/api/ambassadors/register';

// Test data
const validAmbassador = {
  nfcId: 'TEST001',
  walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb0',
  ensName: 'frutero.eth',
  displayName: 'El Frutero',
  favoriteFruit: '🍎',
};

const invalidNfcId = {
  ...validAmbassador,
  nfcId: 'ab', // Too short
};

const invalidWallet = {
  ...validAmbassador,
  walletAddress: 'not-a-wallet',
};

const invalidFruit = {
  ...validAmbassador,
  favoriteFruit: '🍕', // Not in FRUIT_OPTIONS
};

async function testAPI(testName: string, data: any) {
  console.log(`\n🧪 ${testName}`);
  console.log('📤 Request:', JSON.stringify(data, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(`📥 Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Test passed');
    } else {
      console.log('⚠️  Expected error received');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Ambassador Registration API Tests\n');
  console.log('⚠️  Make sure dev server is running on http://localhost:3000\n');

  // Test 1: Successful registration
  await testAPI('Test 1: Valid registration', validAmbassador);

  // Test 2: Duplicate NFC ID
  await testAPI('Test 2: Duplicate NFC ID', validAmbassador);

  // Test 3: Duplicate wallet address
  await testAPI('Test 3: Duplicate wallet address', {
    ...validAmbassador,
    nfcId: 'TEST002',
  });

  // Test 4: Invalid NFC ID (too short)
  await testAPI('Test 4: Invalid NFC ID', invalidNfcId);

  // Test 5: Invalid wallet address
  await testAPI('Test 5: Invalid wallet address', invalidWallet);

  // Test 6: Invalid fruit
  await testAPI('Test 6: Invalid fruit', invalidFruit);

  // Test 7: Missing required field
  await testAPI('Test 7: Missing displayName', {
    nfcId: 'TEST003',
    walletAddress: '0x1234567890123456789012345678901234567890',
    favoriteFruit: '🍊',
  });

  console.log('\n✨ Tests completed!\n');
}

runTests();
