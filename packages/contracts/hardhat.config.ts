import "dotenv/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
import { HardhatUserConfig } from "hardhat/config";

const giwaRpcUrl =
  process.env.RPC_URL ??
  process.env.GIWA_SEPOLIA_RPC_URL ??
  "https://sepolia-rpc.giwa.io";
const deployerPrivateKey =
  process.env.PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    giwaSepolia: {
      chainId: 91342,
      url: giwaRpcUrl,
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
    },
  },
  etherscan: {
    apiKey: {
      giwaSepolia: "no-api-key-required",
    },
    customChains: [
      {
        network: "giwaSepolia",
        chainId: 91342,
        urls: {
          apiURL: "https://sepolia-explorer.giwa.io/api",
          browserURL: "https://sepolia-explorer.giwa.io",
        },
      },
    ],
  },
};

export default config;
