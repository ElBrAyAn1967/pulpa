/**
 * Envio Event Handlers for $PULPA Token Distribution
 *
 * These handlers process blockchain events and update the indexed database
 * to provide analytics on token distributions and ambassador activity.
 */

import {
  PulpaToken,
  Distribution,
  Ambassador,
  Recipient,
  GlobalStats,
  RoleEvent,
  RoleEventType,
} from "generated";

// MINTER_ROLE hash (keccak256("MINTER_ROLE"))
const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

// Zero address constant for minting detection
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Handler for Transfer events
 * Filters for minting events (from == 0x0) and creates Distribution records
 */
PulpaToken.Transfer.handler(async ({ event, context }) => {
  const { from, to, value } = event.params;
  const { transactionHash, blockNumber, timestamp } = event;

  // Only process minting events (from == 0x0)
  if (from.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
    return;
  }

  // Get transaction details for gas info
  const transaction = event.transaction;
  const gasUsed = transaction?.gas_used || BigInt(0);
  const gasPrice = transaction?.gas_price || BigInt(0);

  // Create unique ID for this distribution
  const distributionId = `${transactionHash}-${event.logIndex}`;

  // Determine ambassador and recipient addresses
  // The transaction sender is the ambassador (minter)
  const ambassadorAddress = transaction?.from?.toLowerCase() || "";
  const recipientAddress = to.toLowerCase();

  // Load or create Ambassador entity
  let ambassador = await context.Ambassador.get(ambassadorAddress);
  if (!ambassador) {
    ambassador = {
      id: ambassadorAddress,
      address: transaction?.from || "",
      totalDistributions: BigInt(0),
      totalPulpaMinted: BigInt(0),
      totalPulpaReceived: BigInt(0),
      firstDistributionTimestamp: timestamp,
      lastDistributionTimestamp: timestamp,
    };
  }

  // Update ambassador statistics
  ambassador.totalDistributions += BigInt(1);
  ambassador.totalPulpaMinted += value;
  ambassador.lastDistributionTimestamp = timestamp;

  // Estimate ambassador reward (1 PULPA per distribution, 18 decimals)
  const ambassadorReward = BigInt("1000000000000000000"); // 1 * 10^18
  ambassador.totalPulpaReceived += ambassadorReward;

  await context.Ambassador.set(ambassador);

  // Load or create Recipient entity
  let recipient = await context.Recipient.get(recipientAddress);
  if (!recipient) {
    recipient = {
      id: recipientAddress,
      address: to,
      totalReceived: BigInt(0),
      distributionCount: BigInt(0),
      firstReceivedTimestamp: timestamp,
      lastReceivedTimestamp: timestamp,
    };
  }

  // Update recipient statistics
  recipient.totalReceived += value;
  recipient.distributionCount += BigInt(1);
  recipient.lastReceivedTimestamp = timestamp;

  await context.Recipient.set(recipient);

  // Create Distribution record
  const distribution: Distribution = {
    id: distributionId,
    timestamp,
    blockNumber,
    transactionHash,
    from: ZERO_ADDRESS,
    to,
    amount: value,
    gasUsed,
    gasPrice,
    ambassador_id: ambassadorAddress,
    recipient_id: recipientAddress,
  };

  await context.Distribution.set(distribution);

  // Update global statistics
  await updateGlobalStats(context, timestamp, blockNumber);
});

/**
 * Handler for RoleGranted events
 * Tracks when addresses are granted the MINTER_ROLE
 */
PulpaToken.RoleGranted.handler(async ({ event, context }) => {
  const { role, account, sender } = event.params;
  const { transactionHash, blockNumber, timestamp } = event;

  // Only track MINTER_ROLE events
  if (role.toLowerCase() !== MINTER_ROLE.toLowerCase()) {
    return;
  }

  const accountAddress = account.toLowerCase();

  // Load or create Ambassador entity
  let ambassador = await context.Ambassador.get(accountAddress);
  if (!ambassador) {
    ambassador = {
      id: accountAddress,
      address: account,
      totalDistributions: BigInt(0),
      totalPulpaMinted: BigInt(0),
      totalPulpaReceived: BigInt(0),
      firstDistributionTimestamp: null,
      lastDistributionTimestamp: null,
    };
    await context.Ambassador.set(ambassador);
  }

  // Create RoleEvent record
  const roleEventId = `${transactionHash}-${event.logIndex}`;
  const roleEvent: RoleEvent = {
    id: roleEventId,
    timestamp,
    blockNumber,
    transactionHash,
    role,
    account_id: accountAddress,
    sender,
    eventType: RoleEventType.GRANTED,
  };

  await context.RoleEvent.set(roleEvent);

  // Update global stats
  await updateGlobalStats(context, timestamp, blockNumber);
});

/**
 * Handler for RoleRevoked events
 * Tracks when addresses lose the MINTER_ROLE
 */
PulpaToken.RoleRevoked.handler(async ({ event, context }) => {
  const { role, account, sender } = event.params;
  const { transactionHash, blockNumber, timestamp } = event;

  // Only track MINTER_ROLE events
  if (role.toLowerCase() !== MINTER_ROLE.toLowerCase()) {
    return;
  }

  const accountAddress = account.toLowerCase();

  // Create RoleEvent record
  const roleEventId = `${transactionHash}-${event.logIndex}`;
  const roleEvent: RoleEvent = {
    id: roleEventId,
    timestamp,
    blockNumber,
    transactionHash,
    role,
    account_id: accountAddress,
    sender,
    eventType: RoleEventType.REVOKED,
  };

  await context.RoleEvent.set(roleEvent);
});

/**
 * Helper function to update global statistics
 */
async function updateGlobalStats(
  context: any,
  timestamp: bigint,
  blockNumber: bigint
): Promise<void> {
  const globalId = "global";

  // Load or create global stats
  let globalStats = await context.GlobalStats.get(globalId);
  if (!globalStats) {
    globalStats = {
      id: globalId,
      totalDistributions: BigInt(0),
      totalPulpaMinted: BigInt(0),
      totalAmbassadors: BigInt(0),
      totalRecipients: BigInt(0),
      lastUpdatedTimestamp: timestamp,
      lastUpdatedBlock: blockNumber,
    };
  }

  // Count all distributions
  const distributionCount = await context.Distribution.count();
  globalStats.totalDistributions = BigInt(distributionCount);

  // Sum all minted PULPA from distributions
  const distributions = await context.Distribution.getAll();
  let totalMinted = BigInt(0);
  for (const dist of distributions) {
    totalMinted += dist.amount;
  }
  globalStats.totalPulpaMinted = totalMinted;

  // Count unique ambassadors
  const ambassadorCount = await context.Ambassador.count();
  globalStats.totalAmbassadors = BigInt(ambassadorCount);

  // Count unique recipients
  const recipientCount = await context.Recipient.count();
  globalStats.totalRecipients = BigInt(recipientCount);

  // Update metadata
  globalStats.lastUpdatedTimestamp = timestamp;
  globalStats.lastUpdatedBlock = blockNumber;

  await context.GlobalStats.set(globalStats);
}
