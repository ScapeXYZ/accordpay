import { createConfig, http } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

export const giwaSepolia = defineChain({
  id: 91342,
  name: "GIWA Sepolia",
  nativeCurrency: {
    name: "Test ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rpc.giwa.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "GIWA Sepolia Explorer",
      url: "https://sepolia-explorer.giwa.io",
    },
  },
  testnet: true,
});

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const connectors = walletConnectProjectId
  ? [walletConnect({ projectId: walletConnectProjectId })]
  : [];

export const wagmiConfig = createConfig({
  chains: [giwaSepolia],
  connectors,
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [giwaSepolia.id]: http(giwaSepolia.rpcUrls.default.http[0]),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
