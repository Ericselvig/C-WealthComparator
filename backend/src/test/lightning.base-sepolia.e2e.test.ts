import { Lightning } from '@inco/js/lite';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { describe } from 'vitest';
import { loadDotEnv } from '../repo.ts';
import { runE2ETest } from './lightning-test';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

describe('Lightning Base Sepolia E2E', { timeout: 100_000 }, async () => {
  loadDotEnv();
  loadDotEnv('secrets.env');

  const zap = Lightning.latest('testnet', baseSepolia.id);

  runE2ETest(
    [1, 5, 10], // Test with two different wealth amounts
    zap,
    {
      senderPrivKey: getEnv('SENDER_PRIVATE_KEY') as `0x${string}`,
      chain: baseSepolia,
      hostChainRpcUrl: getEnv('BASE_SEPOLIA_RPC_URL'),
    },
    [
      { privateKey: getEnv('SENDER_PRIVATE_KEY') as `0x${string}` },
      { privateKey: getEnv('USER_2_PRIVATE_KEY') as `0x${string}` },
      { privateKey: getEnv('USER_3_PRIVATE_KEY') as `0x${string}` },
    ],
  );
});
