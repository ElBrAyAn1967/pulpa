/**
 * Test script for Distribution History API endpoint
 *
 * Usage: bun run scripts/test-distribution-history.ts
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testDistributionHistoryAPI() {
  console.log('🧪 Testing Distribution History API\n');

  // Test 1: Get ambassador by NFC ID first (to get ambassador ID)
  console.log('📝 Test 1: Getting ambassador ID...');
  try {
    const nfcResponse = await fetch(`${BASE_URL}/api/nfc/TEST123/status`);
    const nfcData = await nfcResponse.json();

    if (nfcData.registered && nfcData.ambassador) {
      const ambassadorId = nfcData.ambassador.id;
      console.log(`✅ Ambassador ID: ${ambassadorId}\n`);

      // Test 2: Fetch first page of history
      console.log('📝 Test 2: Fetching first page of distribution history...');
      const historyResponse = await fetch(
        `${BASE_URL}/api/ambassadors/${ambassadorId}/history?page=1&limit=5`
      );

      if (!historyResponse.ok) {
        throw new Error(`HTTP ${historyResponse.status}: ${historyResponse.statusText}`);
      }

      const historyData = await historyResponse.json();

      results.push({
        test: 'Fetch first page (limit 5)',
        passed: true,
        data: {
          distributionCount: historyData.distributions.length,
          totalRecords: historyData.pagination.total,
          page: historyData.pagination.page,
        },
      });

      console.log('✅ First page fetched successfully');
      console.log(`   - Distributions on page: ${historyData.distributions.length}`);
      console.log(`   - Total distributions: ${historyData.pagination.total}`);
      console.log(`   - Total pages: ${historyData.pagination.totalPages}`);
      console.log(`   - Has next page: ${historyData.pagination.hasNextPage}\n`);

      // Test 3: Verify sorting (newest first)
      console.log('📝 Test 3: Verifying date sorting (newest first)...');
      if (historyData.distributions.length > 1) {
        const firstDate = new Date(historyData.distributions[0].createdAt);
        const secondDate = new Date(historyData.distributions[1].createdAt);
        const sortedCorrectly = firstDate >= secondDate;

        results.push({
          test: 'Date sorting (newest first)',
          passed: sortedCorrectly,
          error: sortedCorrectly
            ? undefined
            : 'Dates are not sorted correctly',
        });

        if (sortedCorrectly) {
          console.log('✅ Dates sorted correctly (newest first)\n');
        } else {
          console.log('❌ Dates NOT sorted correctly\n');
        }
      } else {
        console.log('⚠️  Not enough distributions to test sorting\n');
      }

      // Test 4: Verify response schema
      console.log('📝 Test 4: Verifying response schema...');
      const firstDist = historyData.distributions[0];
      const hasRequiredFields =
        firstDist &&
        typeof firstDist.id === 'string' &&
        typeof firstDist.recipientAddress === 'string' &&
        firstDist.recipientAddress.startsWith('0x') &&
        typeof firstDist.amounts === 'object' &&
        typeof firstDist.amounts.ambassador === 'string' &&
        typeof firstDist.amounts.recipient === 'string' &&
        (firstDist.transactionHash === null || typeof firstDist.transactionHash === 'string') &&
        typeof firstDist.createdAt === 'string';

      results.push({
        test: 'Response schema validation',
        passed: hasRequiredFields,
        error: hasRequiredFields ? undefined : 'Missing required fields',
      });

      if (hasRequiredFields) {
        console.log('✅ Response schema is correct');
        console.log('   Sample distribution:');
        console.log(`   - ID: ${firstDist.id}`);
        console.log(`   - Recipient: ${firstDist.recipientAddress}`);
        console.log(`   - Ambassador amount: ${firstDist.amounts.ambassador} $PULPA`);
        console.log(`   - Recipient amount: ${firstDist.amounts.recipient} $PULPA`);
        console.log(`   - Status: ${firstDist.status}`);
        console.log(`   - Created: ${firstDist.createdAt}\n`);
      } else {
        console.log('❌ Response schema is invalid\n');
      }

      // Test 5: Pagination with different page
      if (historyData.pagination.hasNextPage) {
        console.log('📝 Test 5: Testing pagination (page 2)...');
        const page2Response = await fetch(
          `${BASE_URL}/api/ambassadors/${ambassadorId}/history?page=2&limit=5`
        );

        if (!page2Response.ok) {
          throw new Error(`HTTP ${page2Response.status}: ${page2Response.statusText}`);
        }

        const page2Data = await page2Response.json();

        const paginationWorks =
          page2Data.pagination.page === 2 &&
          page2Data.distributions.length > 0;

        results.push({
          test: 'Pagination (page 2)',
          passed: paginationWorks,
          error: paginationWorks ? undefined : 'Pagination not working',
        });

        if (paginationWorks) {
          console.log('✅ Pagination works correctly');
          console.log(`   - Page 2 has ${page2Data.distributions.length} distributions\n`);
        } else {
          console.log('❌ Pagination not working\n');
        }
      } else {
        console.log('⚠️  Not enough distributions to test pagination\n');
      }

      // Test 6: Invalid ambassador ID
      console.log('📝 Test 6: Testing invalid ambassador ID...');
      const invalidResponse = await fetch(
        `${BASE_URL}/api/ambassadors/invalid-id-12345/history`
      );

      const returns404 = invalidResponse.status === 404;

      results.push({
        test: 'Invalid ambassador ID (404)',
        passed: returns404,
        error: returns404 ? undefined : `Expected 404, got ${invalidResponse.status}`,
      });

      if (returns404) {
        console.log('✅ Returns 404 for invalid ambassador\n');
      } else {
        console.log(`❌ Expected 404, got ${invalidResponse.status}\n`);
      }
    } else {
      console.log('❌ Test ambassador (TEST123) not found\n');
      results.push({
        test: 'Get ambassador',
        passed: false,
        error: 'TEST123 ambassador not registered',
      });
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    results.push({
      test: 'API availability',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log('='.repeat(50) + '\n');

  if (passed === total) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  }
}

// Run tests
console.log('Starting Distribution History API tests...\n');
console.log(`Base URL: ${BASE_URL}`);
console.log('Make sure the development server is running!\n');

testDistributionHistoryAPI();
