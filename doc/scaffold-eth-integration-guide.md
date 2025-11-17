# Scaffold-ETH 2 Integration Guide for $PULPA Distribution

## Overview

This guide explains how to integrate the $PULPA token contract with the Scaffold-ETH 2 frontend, leveraging the framework's built-in hooks, components, and automatic contract importing system.

---

## Contract Integration Flow

### 1. Contract Deployment & Artifacts

**Existing Setup:**
- Contract: `packages/hardhat/contracts/PulpaToken.sol`
- Deployment artifact: `packages/hardhat/deployments/optimism/PulpaToken.json`
- Contract address: `0x029263aA1BE88127f1794780D9eEF453221C2f30`
- Network: Optimism Mainnet (Chain ID: 10)

**How Scaffold-ETH 2 Works:**
1. Contracts deployed via Hardhat are saved to `packages/hardhat/deployments/[network]/[ContractName].json`
2. These JSON files contain:
   - Contract ABI
   - Deployed address
   - Deployment transaction details
   - Constructor arguments
3. Scaffold-ETH 2 automatically imports these artifacts into the frontend
4. TypeScript types are generated for type-safe contract interactions

**PulpaToken Contract Structure:**
```solidity
contract PulpaToken is ERC20, ERC20Burnable, AccessControl, ERC20Permit {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE);
  function burn(address to, uint256 amount) public onlyRole(MINTER_ROLE);
}
```

---

## Frontend Integration Patterns

### 2. Reading from the Contract

**Use Case**: Display ambassador's $PULPA balance

```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export function AmbassadorBalance() {
  const { address } = useAccount();

  const { data: balance } = useScaffoldReadContract({
    contractName: "PulpaToken",
    functionName: "balanceOf",
    args: [address],
    chainId: 10, // Optimism Mainnet
  });

  return (
    <div>
      Balance: {balance ? formatEther(balance) : "0"} $PULPA
    </div>
  );
}
```

**Features:**
- Automatically loads contract ABI and address
- Real-time updates on new blocks
- Type-safe function names and arguments
- Built-in error handling

---

### 3. Writing to the Contract (Client-Side)

**Use Case**: Ambassador wants to burn their tokens (user-initiated)

```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

export function BurnTokensButton() {
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "PulpaToken",
    chainId: 10,
  });

  const handleBurn = async () => {
    try {
      await writeContractAsync({
        functionName: "burn",
        args: [address, parseEther("1")],
      });

      notification.success("Tokens burned successfully!");
    } catch (error) {
      notification.error("Failed to burn tokens");
    }
  };

  return (
    <button onClick={handleBurn} disabled={isMining}>
      {isMining ? "Burning..." : "Burn 1 $PULPA"}
    </button>
  );
}
```

**Important Note:**
- Client-side writes require the **user's wallet** to have the MINTER_ROLE
- For the distribution system, minting happens **server-side** using the treasury wallet
- Client-side `useScaffoldWriteContract` is NOT suitable for the distribution flow

---

### 4. Server-Side Contract Interaction (Treasury Service)

**Use Case**: Backend mints tokens during distribution

The distribution system requires **server-side minting** because:
1. The MINTER wallet private key must be kept secure (never exposed to frontend)
2. Users don't have MINTER_ROLE (only the treasury wallet does)
3. We need to mint to multiple addresses atomically

**Server-Side Setup with Viem:**

```typescript
// packages/nextjs/services/treasury.ts
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism } from "viem/chains";
import { parseEther } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";

const PULPA_ADDRESS = "0x029263aA1BE88127f1794780D9eEF453221C2f30";
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY!;

// Get ABI from Scaffold-ETH 2 generated contracts
const pulpaAbi = deployedContracts[10].PulpaToken.abi;

export class TreasuryService {
  private walletClient;
  private publicClient;
  private account;

  constructor() {
    this.account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);

    this.publicClient = createPublicClient({
      chain: optimism,
      transport: http(process.env.OPTIMISM_RPC_URL),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: optimism,
      transport: http(process.env.OPTIMISM_RPC_URL),
    });
  }

  async mintDistribution(
    ambassadorAddress: `0x${string}`,
    recipientAddress: `0x${string}`
  ) {
    try {
      // Mint 1 $PULPA to ambassador
      const ambassadorHash = await this.walletClient.writeContract({
        address: PULPA_ADDRESS,
        abi: pulpaAbi,
        functionName: "mint",
        args: [ambassadorAddress, parseEther("1")],
      });

      // Mint 5 $PULPA to recipient
      const recipientHash = await this.walletClient.writeContract({
        address: PULPA_ADDRESS,
        abi: pulpaAbi,
        functionName: "mint",
        args: [recipientAddress, parseEther("5")],
      });

      // Wait for confirmations
      await this.publicClient.waitForTransactionReceipt({
        hash: ambassadorHash
      });
      await this.publicClient.waitForTransactionReceipt({
        hash: recipientHash
      });

      return {
        success: true,
        ambassadorHash,
        recipientHash,
      };
    } catch (error) {
      console.error("Mint failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
let treasuryInstance: TreasuryService | null = null;

export function getTreasuryService(): TreasuryService {
  if (!treasuryInstance) {
    treasuryInstance = new TreasuryService();
  }
  return treasuryInstance;
}
```

**Why Server-Side?**
- ✅ Private key stays on server (never exposed)
- ✅ Users don't need MINTER_ROLE
- ✅ Atomic operations (both mints succeed or fail together)
- ✅ Rate limiting and validation on server
- ✅ Transaction retry logic
- ✅ Nonce management

---

### 5. ENS Integration

**Use Case**: Resolve ENS names in registration form

```typescript
import { useEnsName, useEnsAvatar } from "wagmi";
import { normalize } from "viem/ens";

export function AmbassadorRegistrationForm() {
  const [walletInput, setWalletInput] = useState("");
  const [isEns, setIsEns] = useState(false);

  // Resolve ENS to address
  const { data: ensAddress } = useEnsAddress({
    name: isEns ? normalize(walletInput) : undefined,
    chainId: 1, // ENS is on Ethereum mainnet
  });

  // Resolve address to ENS name (reverse resolution)
  const { data: ensName } = useEnsName({
    address: ensAddress,
    chainId: 1,
  });

  // Get ENS avatar
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
  });

  useEffect(() => {
    // Auto-detect if input looks like ENS
    setIsEns(walletInput.endsWith(".eth"));
  }, [walletInput]);

  return (
    <div>
      <input
        value={walletInput}
        onChange={(e) => setWalletInput(e.target.value)}
        placeholder="0x... or name.eth"
      />

      {ensName && (
        <div>
          Resolved: {ensName}
          {ensAvatar && <img src={ensAvatar} alt="ENS Avatar" />}
        </div>
      )}
    </div>
  );
}
```

**ENS Best Practices:**
- Always resolve ENS on **Ethereum mainnet** (chainId: 1)
- Use `normalize()` to handle special characters
- Cache ENS resolution results
- Provide loading states during resolution

---

### 6. Scaffold-ETH 2 UI Components

**Built-in Components for Address Display:**

```typescript
import { Address, Balance } from "~~/components/scaffold-eth";

export function AmbassadorProfile({ address }) {
  return (
    <div>
      {/* Auto-resolves ENS, shows blockie avatar, copy button */}
      <Address address={address} />

      {/* Shows $PULPA balance with formatting */}
      <Balance address={address} />
    </div>
  );
}
```

**Address Component Features:**
- ✅ Automatic ENS resolution and display
- ✅ ENS avatar integration
- ✅ Blockie avatar fallback
- ✅ Copy address to clipboard
- ✅ Link to block explorer
- ✅ Responsive design

**Balance Component Features:**
- ✅ Display ETH balance
- ✅ Display ERC20 token balance
- ✅ Automatic formatting
- ✅ Real-time updates

---

### 7. Event Listening (Envio Integration)

**Use Case**: Track minting events for analytics

**Option A: Scaffold-ETH 2 Event Hooks**

```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export function DistributionHistory() {
  const { data: transferEvents } = useScaffoldEventHistory({
    contractName: "PulpaToken",
    eventName: "Transfer",
    fromBlock: 0n,
    filters: { from: "0x0000000000000000000000000000000000000000" }, // Minting events
    chainId: 10,
  });

  return (
    <div>
      {transferEvents?.map((event) => (
        <div key={event.log.transactionHash}>
          Minted {formatEther(event.args.value)} to {event.args.to}
        </div>
      ))}
    </div>
  );
}
```

**Option B: Envio Indexer (Recommended for Production)**

Envio provides:
- ✅ Faster event indexing
- ✅ GraphQL API for complex queries
- ✅ Historical data aggregation
- ✅ Real-time event streaming

```typescript
// Query Envio GraphQL endpoint
const { data } = useQuery(gql`
  query GetDistributions {
    pulpaTransfers(
      where: { from: "0x0000000000000000000000000000000000000000" }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      to
      value
      transactionHash
      blockTimestamp
    }
  }
`);
```

---

## Implementation Checklist

### Contract Setup
- [ ] Verify `PulpaToken.json` exists in `packages/hardhat/deployments/optimism/`
- [ ] Confirm contract address matches `0x029263aA1BE88127f1794780D9eEF453221C2f30`
- [ ] Ensure deployment includes correct network (Optimism, chainId: 10)
- [ ] Test contract ABI is correctly imported in frontend

### Frontend Setup
- [ ] Configure Scaffold-ETH 2 to include Optimism in target networks
- [ ] Update `scaffold.config.ts` with Optimism RPC URL
- [ ] Add Optimism to wallet connection options (RainbowKit)
- [ ] Test `useScaffoldReadContract` with PulpaToken
- [ ] Verify ENS resolution works on mainnet

### Backend Setup
- [ ] Create TreasuryService with Viem client
- [ ] Set up `TREASURY_PRIVATE_KEY` environment variable
- [ ] Configure `OPTIMISM_RPC_URL` (Alchemy/Infura)
- [ ] Test minting from server with MINTER wallet
- [ ] Implement nonce management for concurrent transactions
- [ ] Add retry logic with exponential backoff

### Envio Indexer Setup
- [ ] Initialize Envio project: `envio init`
- [ ] Configure Optimism network in `config.yaml`
- [ ] Add PulpaToken contract address and ABI
- [ ] Define Transfer event handler
- [ ] Test local indexing with historical events
- [ ] Deploy indexer to production

---

## Common Pitfalls & Solutions

### ❌ Problem: Contract not found
**Solution**: Ensure deployment JSON exists and network matches in scaffold.config.ts

### ❌ Problem: ENS resolution fails
**Solution**: ENS only works on Ethereum mainnet (chainId: 1), not Optimism

### ❌ Problem: Transaction fails with "missing role"
**Solution**: Verify MINTER wallet has MINTER_ROLE, use `hasRole()` to check

### ❌ Problem: Nonce too low error
**Solution**: Use `blockTag: 'pending'` when getting transaction count

### ❌ Problem: useScaffoldWriteContract doesn't work for minting
**Solution**: Minting must be server-side with MINTER wallet, not client-side

---

## Testing Strategy

### Frontend Tests
```typescript
// Test ENS resolution
describe("AmbassadorRegistration", () => {
  it("resolves ENS name to address", async () => {
    render(<AmbassadorRegistrationForm />);
    const input = screen.getByPlaceholder("0x... or name.eth");

    await userEvent.type(input, "vitalik.eth");
    await waitFor(() => {
      expect(screen.getByText(/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/i)).toBeInTheDocument();
    });
  });
});
```

### Backend Tests
```typescript
// Test server-side minting
describe("TreasuryService", () => {
  it("mints tokens to ambassador and recipient", async () => {
    const treasury = getTreasuryService();

    const result = await treasury.mintDistribution(
      "0x1234...", // ambassador
      "0x5678..."  // recipient
    );

    expect(result.success).toBe(true);
    expect(result.ambassadorHash).toBeDefined();
    expect(result.recipientHash).toBeDefined();
  });
});
```

---

## Reference Links

- [Scaffold-ETH 2 Documentation](https://docs.scaffoldeth.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Envio Documentation](https://docs.envio.dev/)
- [Optimism Developer Docs](https://docs.optimism.io/)

---

**Last Updated**: 2025-01-14
**Version**: 1.0
