import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Lock, ArrowRight } from 'lucide-react';
import { Lightning } from '@inco/js/lite';
import { supportedChains } from '@inco/js';
import { parseEther, getAddress } from 'viem';
import { wealthComparatorAbi } from '../abi/wealthComparator';

// Contract address
const WEALTH_COMPARATOR_ADDRESS = getAddress("0xD14aF1D97F3Ef61eD18b2D7dF38B98a557E3885a");

export default function WealthManager() {
  const { address } = useAccount();
  const [wealth, setWealth] = useState('');
  const [addresses, setAddresses] = useState('');
  const [richestUser, setRichestUser] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Listen for RichestUserUpdated event
  useEffect(() => {
    if (!WEALTH_COMPARATOR_ADDRESS) {
      setStatus('Error: Contract address not configured');
      return;
    }

    const unwatch = publicClient.watchEvent({
      address: WEALTH_COMPARATOR_ADDRESS,
      event: {
        type: 'event',
        name: 'RichestUserUpdated',
        inputs: [
          { type: 'address', name: 'user', indexed: true },
          { type: 'uint256', name: 'requestId', indexed: true }
        ]
      },
      onLogs: (logs) => {
        const richest = logs[0].args.user;
        const requestId = logs[0].args.requestId;
        // Only update if this is the event for our current request
        if (currentRequestId && BigInt(requestId) === currentRequestId) {
          setRichestUser(richest);
          setIsComparing(false);
          setStatus(`Comparison complete! Request ID: ${requestId}`);
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [publicClient, currentRequestId]);

  const handleSubmitWealth = async () => {
    if (!address) {
      setStatus('Please connect your wallet first');
      return;
    }

    if (!wealth || Number(wealth) <= 0) {
      setStatus('Please enter a valid amount');
      return;
    }

    if (!walletClient) {
      setStatus('Wallet client not available. Please try reconnecting your wallet.');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Encrypting wealth...');

      // Initialize INCO Lightning
      const chainId = supportedChains.baseSepolia;
      const zap = Lightning.latest('testnet', chainId);

      // Convert the amount to wei and encrypt it
      const weiAmount = parseEther(wealth);
      const encryptedWealth = await zap.encrypt(weiAmount, {
        accountAddress: address,
        dappAddress: WEALTH_COMPARATOR_ADDRESS,
      });

      if (!encryptedWealth) {
        throw new Error('Failed to encrypt wealth value');
      }

      setStatus('Submitting encrypted wealth...');

      const tx = await walletClient.writeContract({
        address: WEALTH_COMPARATOR_ADDRESS,
        abi: wealthComparatorAbi,
        functionName: 'submitWealth',
        args: [encryptedWealth],
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });
      
      setStatus('Wealth submitted successfully!');
      setWealth('');
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error: ' + (error.message || 'Failed to submit wealth'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareWealth = async () => {
    if (!addresses.trim()) {
      setStatus('Please enter addresses to compare');
      return;
    }

    try {
      setIsLoading(true);
      setIsComparing(true);
      setStatus('Comparing wealth...');
      
      const addressList = addresses.split(',').map(addr => addr.trim());

      // First simulate to get the requestId
      const simulateResult = await publicClient.simulateContract({
        address: WEALTH_COMPARATOR_ADDRESS,
        abi: wealthComparatorAbi,
        functionName: 'compareWealth',
        args: [addressList],
      });

      const requestId = BigInt(simulateResult.result);
      setCurrentRequestId(requestId);
      setStatus(`Request ID: ${requestId}. Waiting for comparison...`);

      // Now send the actual transaction
      const tx = await walletClient.writeContract({
        address: WEALTH_COMPARATOR_ADDRESS,
        abi: wealthComparatorAbi,
        functionName: 'compareWealth',
        args: [addressList],
      });

      await publicClient.waitForTransactionReceipt({ hash: tx });
      
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error comparing wealth: ' + (error.message || 'Unknown error'));
      setIsComparing(false);
      setCurrentRequestId(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Submit Your Wealth</h2>
        <div className="flex gap-2">
          <input
            type="number"
            value={wealth}
            onChange={(e) => setWealth(e.target.value)}
            placeholder="Enter wealth amount in ETH"
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmitWealth}
            disabled={isLoading || !wealth}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Compare Wealth</h2>
        <div className="space-y-4">
          <textarea
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="Enter addresses to compare (comma-separated)"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleCompareWealth}
            disabled={isLoading || !addresses.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white" />
            ) : (
              <>
                Compare <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {isComparing && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
            <span className="text-blue-400">Comparing wealth...</span>
          </div>
        </div>
      )}

      {richestUser && !isComparing && (
        <div className="mt-4 p-4 bg-gray-700 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
          <p className="text-gray-300 break-all">
            Richest user: {richestUser}
          </p>
        </div>
      )}

      {status && (
        <div className={`mt-4 p-4 rounded ${
          status.toLowerCase().includes('error')
            ? 'bg-red-900/20 border border-red-500 text-red-400'
            : 'bg-gray-700 text-gray-300'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}