import { prisma } from '../lib/db/prisma';

async function main() {
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if tables exist
    const ambassadorCount = await prisma.ambassador.count();
    console.log(`📊 Ambassadors table: ${ambassadorCount} records`);

    const distributionCount = await prisma.distribution.count();
    console.log(`📊 Distributions table: ${distributionCount} records`);

    console.log('\n✨ Database schema is ready!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
