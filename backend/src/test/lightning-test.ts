import { incoLightningAbi } from '@inco/js/abis';
import { Lightning } from '@inco/js/lite';
import {
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  getContract,
  type Hex,
  http,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { beforeAll, describe, expect, it } from 'vitest';
import confidentialWealthComparatorBuild from '../../../contracts/out/ConfidentialWealthComparator.sol/ConfidentialWealthComparator.json';
import { confidentialWealthComparatorAbi } from '../generated/abis';

// E2EConfig contains all configuration needed to run a test against
// a specific deployment.
export interface E2EConfig {
  senderPrivKey: Hex;
  chain: Chain;
  hostChainRpcUrl: string;
}

export function runE2ETest(testWealths: number[], zap: Lightning, config: E2EConfig, accounts: { privateKey: Hex }[]) {
  const { senderPrivKey, chain, hostChainRpcUrl } = config;

  // Validate inputs
  if (testWealths.length === 0) {
    throw new Error('testWealths array cannot be empty');
  }
  if (accounts.length === 0) {
    throw new Error('accounts array cannot be empty');
  }
  if (testWealths.length !== accounts.length) {
    throw new Error(`Not enough accounts provided. Need ${testWealths.length} accounts but got ${accounts.length}`);
  }

  // Create clients
  const publicClient = createPublicClient({
    chain,
    transport: http(hostChainRpcUrl),
  });

  const account = privateKeyToAccount(senderPrivKey);
  let walletClient = createWalletClient({
    account,
    chain,
    transport: http(hostChainRpcUrl),
  });

  describe('Lightning Wealth Comparison E2E', () => {
    let contractAddress: Address;
    let requestId: bigint;
    let callbackFulfillPromise: Promise<void>;

    beforeAll(async () => {
      console.log('###############################################\n');
      console.log(`# Step 0. Deploy the ConfidentialWealthComparator contract\n`);
      console.log('###############################################\n');
      contractAddress = await deployWealthComparator(config);
      console.log(`ConfidentialWealthComparator contract deployed at ${contractAddress}\n`);
      console.log('Running this test has some prerequisites:\n');
      console.log(`- The IncoLite contract ${zap.executorAddress} must be deployed on ${chain.name}\n`);
      console.log(`- The dapp contract ${contractAddress} must be deployed on ${chain.name}\n`);
      console.log(`- The sender ${privateKeyToAccount(senderPrivKey).address} must have some ${chain.name} tokens\n`);

      // Set up IncoLite contract
      const incoLite = getContract({
        abi: incoLightningAbi,
        address: zap.executorAddress,
        client: publicClient,
      });

      if (!incoLite) {
        throw new Error(`IncoLite contract not found at address ${zap.executorAddress}`);
      }

      // Test submitting wealth for multiple users
      for (let i = 0; i < testWealths.length; i++) {
        const wealth = testWealths[i];
        if (wealth === undefined) continue;
        const weiAmount = parseEther(wealth.toString());

        // Use the provided account for this wealth submission
        const testAccount = accounts[i];
        if (!testAccount) {
          throw new Error(`No account provided for index ${i}`);
        }
        const newAccount = privateKeyToAccount(testAccount.privateKey);

        console.log(`\nSubmitting wealth for account ${newAccount.address}...\n`);

        // Encrypt the wealth
        const encryptedWealth = await zap.encrypt(weiAmount, {
          accountAddress: newAccount.address,
          dappAddress: contractAddress,
        });

        walletClient = createWalletClient({
          account: newAccount,
          chain,
          transport: http(hostChainRpcUrl),
        });

        // Submit the encrypted wealth
        const submitHash = await walletClient.writeContract({
          address: contractAddress,
          abi: confidentialWealthComparatorAbi,
          functionName: 'submitWealth',
          args: [encryptedWealth],
        });
        await publicClient.waitForTransactionReceipt({ hash: submitHash });
        console.log(`Wealth submitted successfully for ${newAccount.address}\n`);

        // Verify the wealth was submitted
        const storedWealth = (await publicClient.readContract({
          address: contractAddress,
          abi: confidentialWealthComparatorAbi,
          functionName: 'wealthOf',
          args: [newAccount.address],
        })) as Hex;
        if (!storedWealth) {
          throw new Error(`Failed to verify wealth submission for account ${newAccount.address}`);
        }
        console.log(`Verified wealth submission for ${newAccount.address}\n`);
      }

      // Test comparing wealth
      console.log('\nComparing wealth between accounts...\n');
      const addresses = accounts.map((acc) => privateKeyToAccount(acc.privateKey).address);

      const simulateResult = await publicClient.simulateContract({
        address: contractAddress,
        abi: confidentialWealthComparatorAbi,
        functionName: 'compareWealth',
        args: [addresses],
      });

      requestId = BigInt(simulateResult.result);

      console.log(`Request ID: ${requestId}\n`);

      // Set up callback fulfillment promise to watch for RichestUserUpdated event
      callbackFulfillPromise = new Promise((resolve) => {
        const contract = getContract({
          address: contractAddress,
          abi: confidentialWealthComparatorAbi,
          client: publicClient,
        });
        
        // Watch for any RichestUserUpdated event
        contract.watchEvent.RichestUserUpdated(
          {}, // No filter needed
          { 
            onLogs: (logs) => {
              console.log('Received RichestUserUpdated event:', logs);
              // Find the event that matches our requestId
              const matchingLog = logs.find(log => {
                // The requestId is the second indexed parameter
                const requestIdFromLog = BigInt(log.topics[2]);
                return requestIdFromLog === requestId;
              });
              if (matchingLog) {
                console.log(`Found matching event for requestId ${requestId}`);
                resolve();
              }
            }
          }
        );
      });

      const compareHash = await walletClient.writeContract({
        address: contractAddress,
        abi: confidentialWealthComparatorAbi,
        functionName: 'compareWealth',
        args: [addresses],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: compareHash });
      console.log(`Transaction included in block ${receipt.blockNumber}`);

    });

    it('should identify the richest user correctly', async () => {
      console.log(`\nWaiting for RichestUserUpdated event with requestId ${requestId}\n`);
      
      // Set up a more robust event listener with a timeout
      const eventPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for RichestUserUpdated event'));
        }, 60000); // 60 second timeout

        const contract = getContract({
          address: contractAddress,
          abi: confidentialWealthComparatorAbi,
          client: publicClient,
        });
        
        const unwatch = contract.watchEvent.RichestUserUpdated(
          {}, // No filter needed
          { 
            onLogs: (logs) => {
              console.log('Received RichestUserUpdated event:', logs);
              // Find the event that matches our requestId
              const matchingLog = logs.find(log => {
                // The requestId is the second indexed parameter
                const requestIdFromLog = BigInt(log.topics[2]);
                return requestIdFromLog === requestId;
              });
              if (matchingLog) {
                console.log(`Found matching event for requestId ${requestId}`);
                clearTimeout(timeout);
                unwatch();
                resolve();
              }
            }
          }
        );
      });

      await eventPromise;
      console.log('RichestUserUpdated event received\n');

      // Get the richest user using the stored requestId
      const richestUser = (await publicClient.readContract({
        address: contractAddress,
        abi: confidentialWealthComparatorAbi,
        functionName: 'getRichestUser',
        args: [requestId],
      })) as Address;

      // Find the expected richest user based on wealth values
      const maxWealthIndex = testWealths.indexOf(Math.max(...testWealths));
      const richestAccount = accounts[maxWealthIndex];
      if (!richestAccount) {
        throw new Error(`No account found for max wealth index ${maxWealthIndex}`);
      }
      const expectedRichestUser = privateKeyToAccount(richestAccount.privateKey).address;

      console.log(`\nRichest user found: ${richestUser}\n`);
      console.log(`Expected richest user: ${expectedRichestUser}\n`);

      // Verify the richest user matches our expectation
      expect(richestUser.toLowerCase()).toBe(expectedRichestUser.toLowerCase());
    }, 120_000); // Increased timeout to 120 seconds
  });
}

async function deployWealthComparator(cfg: E2EConfig): Promise<Address> {
  console.log('\nDeploying ConfidentialWealthComparator.sol contract...\n');
  const account = privateKeyToAccount(cfg.senderPrivKey);
  const walletClient = createWalletClient({
    account,
    chain: cfg.chain,
    transport: http(cfg.hostChainRpcUrl),
  });

  const publicClient = createPublicClient({
    chain: cfg.chain,
    transport: http(cfg.hostChainRpcUrl),
  });

  // Deploy the contract
  const txHash = await walletClient.deployContract({
    abi: confidentialWealthComparatorAbi,
    bytecode: confidentialWealthComparatorBuild.bytecode.object as Hex,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const contractAddress = receipt.contractAddress;
  if (!contractAddress) {
    throw new Error('Contract address not found in the transaction receipt');
  }
  console.log(`Deployed ConfidentialWealthComparator.sol contract at ${contractAddress}\n`);
  return contractAddress as Address;
}
