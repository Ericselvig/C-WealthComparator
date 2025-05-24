import { Lightning } from '@inco/js/lite';
import { type Hex } from 'viem';
import { anvil } from 'viem/chains';
import { describe } from 'vitest';
import { runE2ETest } from './lightning-test.ts';

describe('Lightning Local Node E2E', { timeout: 50_000 }, async () => {
  const zap = Lightning.localNode();

  // Use Anvil's default accounts
  const testAccounts = [
    { privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex },
    { privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as Hex },
    { privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as Hex },
  ];

  const testWealths = [1, 10, 5];

  runE2ETest(
    testWealths,
    zap,
    {
      chain: anvil,
      senderPrivKey: zap.deployment.senderPrivateKey,
      hostChainRpcUrl: 'http://127.0.0.1:8545',
    },
    testAccounts,
  );
});
