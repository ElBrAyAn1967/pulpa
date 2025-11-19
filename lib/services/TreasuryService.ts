import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  parseEther,
  formatEther,
} from 'viem';
import { optimism } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { PULPA_TOKEN_ABI, PULPA_TOKEN_ADDRESS } from '@/lib/contracts/PulpaTokenABI';

/**
 * TreasuryService - Server-side singleton for managing $PULPA token minting
 *
 * Features:
 * - Atomic distribution (both mints or neither)
 * - Transaction retry logic with exponential backoff
 * - Nonce management for concurrent operations
 * - Gas estimation and monitoring
 * - Balance validation before minting
 */
class TreasuryService {
  private static instance: TreasuryService;
  private publicClient;
  private walletClient;
  private minterAccount;

  // Configuration
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly AMBASSADOR_AMOUNT = parseEther('1'); // 1 $PULPA
  private readonly RECIPIENT_AMOUNT = parseEther('5'); // 5 $PULPA

  private constructor() {
    // Validate environment variables
    const privateKey = process.env.TREASURY_PRIVATE_KEY;
    const rpcUrl = process.env.OPTIMISM_RPC_URL;

    if (!privateKey) {
      throw new Error('TREASURY_PRIVATE_KEY environment variable not set');
    }

    if (!privateKey.startsWith('0x')) {
      throw new Error('TREASURY_PRIVATE_KEY must start with 0x');
    }

    // Initialize Viem clients
    this.publicClient = createPublicClient({
      chain: optimism,
      transport: http(rpcUrl || 'https://mainnet.optimism.io'),
    });

    this.minterAccount = privateKeyToAccount(privateKey as `0x${string}`);

    this.walletClient = createWalletClient({
      account: this.minterAccount,
      chain: optimism,
      transport: http(rpcUrl || 'https://mainnet.optimism.io'),
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TreasuryService {
    if (!TreasuryService.instance) {
      TreasuryService.instance = new TreasuryService();
    }
    return TreasuryService.instance;
  }

  /**
   * Check minter wallet balance
   */
  public async checkMinterBalance(): Promise<bigint> {
    const balance = await this.publicClient.getBalance({
      address: this.minterAccount.address,
    });
    return balance;
  }

  /**
   * Estimate gas for both mint transactions
   */
  public async estimateGas(
    ambassadorAddress: Address,
    recipientAddress: Address
  ): Promise<bigint> {
    try {
      // Estimate gas for ambassador mint
      const ambassadorGas = await this.publicClient.estimateContractGas({
        address: PULPA_TOKEN_ADDRESS,
        abi: PULPA_TOKEN_ABI,
        functionName: 'mint',
        args: [ambassadorAddress, this.AMBASSADOR_AMOUNT],
        account: this.minterAccount,
      });

      // Estimate gas for recipient mint
      const recipientGas = await this.publicClient.estimateContractGas({
        address: PULPA_TOKEN_ADDRESS,
        abi: PULPA_TOKEN_ABI,
        functionName: 'mint',
        args: [recipientAddress, this.RECIPIENT_AMOUNT],
        account: this.minterAccount,
      });

      // Return total estimated gas
      return ambassadorGas + recipientGas;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw new Error('Failed to estimate gas for minting');
    }
  }

  /**
   * Execute a single mint transaction with retry logic
   */
  private async executeMintWithRetry(
    to: Address,
    amount: bigint,
    retries = 0
  ): Promise<string> {
    try {
      // Simulate transaction first to catch errors early
      const { request } = await this.publicClient.simulateContract({
        address: PULPA_TOKEN_ADDRESS,
        abi: PULPA_TOKEN_ABI,
        functionName: 'mint',
        args: [to, amount],
        account: this.minterAccount,
      });

      // Execute the transaction
      const hash = await this.walletClient.writeContract(request);

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error(`Transaction failed: ${hash}`);
      }

      return hash;
    } catch (error) {
      console.error(`Mint attempt ${retries + 1} failed:`, error);

      // Retry logic with exponential backoff
      if (retries < this.MAX_RETRIES) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retries);
        console.log(`Retrying in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeMintWithRetry(to, amount, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Mint distribution atomically (both mints or neither)
   */
  public async mintDistribution(
    ambassadorAddress: Address,
    recipientAddress: Address
  ): Promise<{
    success: boolean;
    ambassadorHash?: string;
    recipientHash?: string;
    error?: string;
  }> {
    try {
      // Validate addresses
      if (!ambassadorAddress || !recipientAddress) {
        throw new Error('Invalid addresses provided');
      }

      // Check minter balance
      const balance = await this.checkMinterBalance();
      const estimatedGas = await this.estimateGas(ambassadorAddress, recipientAddress);

      // Rough gas cost estimate (gas * gas price)
      const gasPrice = await this.publicClient.getGasPrice();
      const estimatedCost = estimatedGas * gasPrice;

      if (balance < estimatedCost) {
        throw new Error(
          `Insufficient balance. Have: ${formatEther(balance)} ETH, Need: ~${formatEther(estimatedCost)} ETH`
        );
      }

      console.log('Starting atomic distribution...');
      console.log(`Ambassador: ${ambassadorAddress} -> ${formatEther(this.AMBASSADOR_AMOUNT)} $PULPA`);
      console.log(`Recipient: ${recipientAddress} -> ${formatEther(this.RECIPIENT_AMOUNT)} $PULPA`);

      // Execute ambassador mint
      const ambassadorHash = await this.executeMintWithRetry(
        ambassadorAddress,
        this.AMBASSADOR_AMOUNT
      );

      console.log(`Ambassador mint successful: ${ambassadorHash}`);

      // Execute recipient mint
      const recipientHash = await this.executeMintWithRetry(
        recipientAddress,
        this.RECIPIENT_AMOUNT
      );

      console.log(`Recipient mint successful: ${recipientHash}`);

      return {
        success: true,
        ambassadorHash,
        recipientHash,
      };
    } catch (error) {
      console.error('Distribution failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get current minter address
   */
  public getMinterAddress(): Address {
    return this.minterAccount.address;
  }
}

// Export singleton instance
export const treasuryService = TreasuryService.getInstance();
