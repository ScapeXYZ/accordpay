import "server-only";

import { createPublicClient, defineChain, http, parseAbi } from "viem";

import {
  DojangVerificationService,
  type DojangContractReader,
} from "./dojang-verification-service";

export const DOJANG_SCROLL_ADDRESS =
  "0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9" as const;
export const UPBIT_KOREA_ATTESTER_ID =
  "0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034" as const;
export const TESTNET_FAUCET_ATTESTER_ID =
  "0xaa92f8c143657dde575de430aecaea6ca91f2e6072339b16932d426895d8d678" as const;
export const DOJANG_SCROLL_ABI = parseAbi([
  "function isVerified(address addr, bytes32 attesterId) external view returns (bool)",
]);

const giwaSepolia = defineChain({
  id: 91_342,
  name: "GIWA Sepolia",
  nativeCurrency: { name: "Test ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rpc.giwa.io"],
    },
  },
});

const publicClient = createPublicClient({
  chain: giwaSepolia,
  transport: http("https://sepolia-rpc.giwa.io", {
    retryCount: 1,
    timeout: 8_000,
  }),
});

const reader: DojangContractReader = {
  async isVerified(address) {
    // GIWA's Sepolia contracts document both UPBIT KOREA and TESTNET FAUCET
    // as official testnet attesters. The Playground-issued Dojang uses the
    // faucet attester, while direct issuer attestations use UPBIT KOREA.
    const [upbitKoreaVerified, playgroundVerified] = await Promise.all([
      publicClient.readContract({
        address: DOJANG_SCROLL_ADDRESS,
        abi: DOJANG_SCROLL_ABI,
        functionName: "isVerified",
        args: [address, UPBIT_KOREA_ATTESTER_ID],
      }),
      publicClient.readContract({
        address: DOJANG_SCROLL_ADDRESS,
        abi: DOJANG_SCROLL_ABI,
        functionName: "isVerified",
        args: [address, TESTNET_FAUCET_ATTESTER_ID],
      }),
    ]);

    return upbitKoreaVerified || playgroundVerified;
  },
};

export const serverDojangVerificationService = new DojangVerificationService(
  reader,
);
