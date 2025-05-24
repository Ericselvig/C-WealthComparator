"use client";

import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { WagmiConfig } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID;

// Wagmi config
const metadata = {
  name: "Confidential Wealth Comparator",
  description: "Compare wealth privately using INCO protocol",
  url: "https://wealth-comparator.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Initialize wagmi config
const config = createConfig({
  autoConnect: true,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
  connectors: [
    injected(),
    walletConnect({ projectId, metadata, showQrModal: false }),
  ],
});

// Initialize modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains: [baseSepolia],
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#3b82f6", // blue-500
  },
});

export function Web3Provider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  );
}
