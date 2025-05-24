// import { Address } from "@inco/js";
// import { Chain, createPublicClient, createWalletClient, Hex } from 'viem';
// import { privateKeyToAccount } from 'viem/accounts';
//
// export type ContractDeploymentConfig = {
//     senderPrivateKey: Hex;
//     chain: Chain;
// }
//
//
// // Deploys the AddTwo.sol contract on the host chain.
// async function deployContract({}: ContractDeploymentConfig): Promise<Address> {
//     console.log();
//     console.log(`Deploying AddTwo.sol contract ...`);
//     const account = privateKeyToAccount(cfg.senderPrivKey);
//     const walletClient = createWalletClient({
//         chain: cfg.chain,
//         transport: http(cfg.hostChainRpcUrl),
//     });
//
//     const byteCode = addTwoBuild.bytecode.object as Hex;
//     const txHash = await walletClient.deployContract({
//         account,
//         abi: addTwoAbi,
//         bytecode: byteCode,
//     });
//
//     const publicClient = createPublicClient({
//         chain: cfg.chain,
//         transport: http(cfg.hostChainRpcUrl),
//     });
//     const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
//
//     const contractAddress = receipt.contractAddress;
//     if (!contractAddress) {
//         throw new Error('Contract address not found in the transaction receipt');
//     }
//     console.log(`Deployed AddTwo.sol contract at ${contractAddress}`);
//     return parseAddress(contractAddress);
// }
