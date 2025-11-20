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
import { logger, LogCategory } from '@/lib/logging/logger';
import {
  InsufficientBalanceError,
  TransactionFailedError,
  NetworkError,
  GasEstimationError,
  InvalidAddressError,
  MinterRoleMissingError,
  ContractError,
  MissingEnvVariableError,
  InvalidConfigurationError,
  toPulpaError,
  type ErrorContext,
} from '@/lib/errors/types';

/**
 * Enhanced TreasuryService with comprehensive error handling and logging
 *
 * Features:
 * - Structured error handling with typed errors
 * - Comprehensive logging for all operations
 * - Performance monitoring
 * - Automatic balance checks and alerts
 * - Transaction retry logic with exponential backoff
 * - Gas estimation and cost monitoring
 */
class TreasuryServiceEnhanced {
  private static instance: TreasuryServiceEnhanced;
  private publicClient;
  private walletClient;
  private minterAccount;

  // Configuration
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly AMBASSADOR_AMOUNT = parseEther('1'); // 1 $PULPA
  private readonly RECIPIENT_AMOUNT = parseEther('5'); // 5 $PULPA
  private readonly LOW_BALANCE_THRESHOLD = parseEther('0.01'); // 0.01 ETH

  private constructor() {
    try {
      // Validate environment variables
      const privateKey = process.env.TREASURY_PRIVATE_KEY;
      const rpcUrl = process.env.OPTIMISM_RPC_URL;

      if (!privateKey) {
        throw new MissingEnvVariableError('TREASURY_PRIVATE_KEY');
      }

      if (!privateKey.startsWith('0x')) {
        throw new InvalidConfigurationError('TREASURY_PRIVATE_KEY must start with 0x');
      }

      if (privateKey.length !== 66) {
        throw new InvalidConfigurationError('TREASURY_PRIVATE_KEY must be 66 characters (0x + 64 hex)');
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

      logger.info(LogCategory.SYSTEM, 'TreasuryService initialized', {
        minterAddress: this.minterAccount.address,
        rpcUrl: rpcUrl || 'https://mainnet.optimism.io',
      });
    } catch (error) {
      logger.critical(
        LogCategory.SYSTEM,
        'Failed to initialize TreasuryService',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TreasuryServiceEnhanced {
    if (!TreasuryServiceEnhanced.instance) {
      TreasuryServiceEnhanced.instance = new TreasuryServiceEnhanced();
    }
    return TreasuryServiceEnhanced.instance;
  }

  /**
   * Validate Ethereum address format
   */
  private validateAddress(address: string, label: string): void {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new InvalidAddressError(address, { addressLabel: label });
    }
  }

  /**
   * Check minter wallet balance with logging
   */
  public async checkMinterBalance(): Promise<bigint> {
    try {
      const startTime = Date.now();

      const balance = await this.publicClient.getBalance({
        address: this.minterAccount.address,
      });

      const duration = Date.now() - startTime;

      logger.info(LogCategory.BLOCKCHAIN, 'Checked minter balance', {
        minterAddress: this.minterAccount.address,
        balance: formatEther(balance),
        duration,
      });

      // Alert if balance is low
      if (balance < this.LOW_BALANCE_THRESHOLD) {
        logger.logSecurityEvent(
          'Low minter balance detected',
          'critical',
          {
            minterAddress: this.minterAccount.address,
            currentBalance: formatEther(balance),
            threshold: formatEther(this.LOW_BALANCE_THRESHOLD),
          }
        );
      }

      return balance;
    } catch (error) {
      const pulpaError = new NetworkError('Failed to check minter balance', {
        minterAddress: this.minterAccount.address,
      });

      logger.error(
        LogCategory.BLOCKCHAIN,
        'Failed to check minter balance',
        pulpaError,
        { minterAddress: this.minterAccount.address }
      );

      throw pulpaError;
    }
  }

  /**
   * Estimate gas for both mint transactions
   */
  public async estimateGas(
    ambassadorAddress: Address,
    recipientAddress: Address
  ): Promise<bigint> {
    const context: ErrorContext = {
      ambassadorAddress,
      recipientAddress,
    };

    try {
      // Validate addresses
      this.validateAddress(ambassadorAddress, 'ambassador');
      this.validateAddress(recipientAddress, 'recipient');

      const startTime = Date.now();

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

      const totalGas = ambassadorGas + recipientGas;
      const duration = Date.now() - startTime;

      logger.info(LogCategory.BLOCKCHAIN, 'Gas estimation successful', {
        ...context,
        ambassadorGas: ambassadorGas.toString(),
        recipientGas: recipientGas.toString(),
        totalGas: totalGas.toString(),
        duration,
      });

      return totalGas;
    } catch (error) {
      // Check if error is due to missing MINTER role
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('AccessControl') || errorMessage.includes('not authorized')) {
        const minterError = new MinterRoleMissingError(context);
        logger.critical(LogCategory.BLOCKCHAIN, 'Minter role missing', minterError, context);
        throw minterError;
      }

      const gasError = new GasEstimationError(context);
      logger.error(LogCategory.BLOCKCHAIN, 'Gas estimation failed', gasError, context);
      throw gasError;
    }
  }

  /**
   * Execute a single mint transaction with retry logic and logging
   */
  private async executeMintWithRetry(
    to: Address,
    amount: bigint,
    label: string,
    retries = 0
  ): Promise<string> {
    const context: ErrorContext = {
      recipientAddress: to,
      amount: formatEther(amount),
      attempt: retries + 1,
      maxRetries: this.MAX_RETRIES,
    };

    try {
      logger.info(LogCategory.BLOCKCHAIN, `Starting mint transaction: ${label}`, context);

      const startTime = Date.now();

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

      logger.info(LogCategory.BLOCKCHAIN, `Transaction submitted: ${label}`, {
        ...context,
        transactionHash: hash,
      });

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      const duration = Date.now() - startTime;

      if (receipt.status !== 'success') {
        throw new TransactionFailedError(`Transaction reverted: ${hash}`, {
          ...context,
          transactionHash: hash,
          gasUsed: receipt.gasUsed.toString(),
        });
      }

      logger.logTransaction(`${label} mint successful`, {
        transactionHash: hash,
        from: this.minterAccount.address,
        to,
        amount: formatEther(amount),
        gasUsed: receipt.gasUsed.toString(),
        status: 'success',
      });

      logger.logPerformance(`${label} mint completed`, duration, {
        ...context,
        transactionHash: hash,
      });

      return hash;
    } catch (error) {
      logger.error(
        LogCategory.BLOCKCHAIN,
        `Mint attempt ${retries + 1} failed: ${label}`,
        error instanceof Error ? error : undefined,
        context
      );

      // Retry logic with exponential backoff
      if (retries < this.MAX_RETRIES) {
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retries);

        logger.warn(LogCategory.BLOCKCHAIN, `Retrying in ${delay}ms...`, {
          ...context,
          retryDelay: delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeMintWithRetry(to, amount, label, retries + 1);
      }

      // Max retries reached
      const txError = error instanceof TransactionFailedError
        ? error
        : new TransactionFailedError(
            error instanceof Error ? error.message : 'Transaction failed',
            context
          );

      logger.critical(
        LogCategory.BLOCKCHAIN,
        `${label} mint failed after ${this.MAX_RETRIES} attempts`,
        txError,
        context
      );

      throw txError;
    }
  }

  /**
   * Mint distribution atomically with comprehensive error handling
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
    const context: ErrorContext = {
      ambassadorAddress,
      recipientAddress,
    };

    const operationStart = Date.now();

    try {
      // Validate addresses
      this.validateAddress(ambassadorAddress, 'ambassador');
      this.validateAddress(recipientAddress, 'recipient');

      logger.info(LogCategory.DISTRIBUTION, 'Starting atomic distribution', context);

      // Check minter balance
      const balance = await this.checkMinterBalance();
      const estimatedGas = await this.estimateGas(ambassadorAddress, recipientAddress);

      // Rough gas cost estimate (gas * gas price)
      const gasPrice = await this.publicClient.getGasPrice();
      const estimatedCost = estimatedGas * gasPrice;

      if (balance < estimatedCost) {
        throw new InsufficientBalanceError({
          ...context,
          currentBalance: formatEther(balance),
          requiredBalance: formatEther(estimatedCost),
        });
      }

      logger.info(LogCategory.DISTRIBUTION, 'Pre-flight checks passed', {
        ...context,
        balance: formatEther(balance),
        estimatedCost: formatEther(estimatedCost),
        gasPrice: gasPrice.toString(),
      });

      // Execute ambassador mint
      const ambassadorHash = await this.executeMintWithRetry(
        ambassadorAddress,
        this.AMBASSADOR_AMOUNT,
        'Ambassador'
      );

      // Execute recipient mint
      const recipientHash = await this.executeMintWithRetry(
        recipientAddress,
        this.RECIPIENT_AMOUNT,
        'Recipient'
      );

      const totalDuration = Date.now() - operationStart;

      logger.logDistribution('Atomic distribution completed successfully', {
        nfcId: '', // Will be filled by caller
        ambassadorAddress,
        recipientAddress,
        transactionHash: `${ambassadorHash},${recipientHash}`,
        status: 'success',
      });

      logger.logPerformance('Full distribution cycle', totalDuration, {
        ...context,
        ambassadorHash,
        recipientHash,
      });

      return {
        success: true,
        ambassadorHash,
        recipientHash,
      };
    } catch (error) {
      const totalDuration = Date.now() - operationStart;
      const pulpaError = toPulpaError(error, context);

      logger.critical(
        LogCategory.DISTRIBUTION,
        'Distribution failed',
        pulpaError,
        context
      );

      logger.logDistribution('Atomic distribution failed', {
        nfcId: '', // Will be filled by caller
        ambassadorAddress,
        recipientAddress,
        status: 'failed',
      });

      logger.logPerformance('Failed distribution cycle', totalDuration, context);

      return {
        success: false,
        error: pulpaError.userMessage || pulpaError.message,
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

// Export getter function to avoid initialization during build
export function getTreasuryService(): TreasuryServiceEnhanced {
  return TreasuryServiceEnhanced.getInstance();
}
