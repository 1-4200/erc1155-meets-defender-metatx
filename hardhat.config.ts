import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { NetworkUserConfig } from "hardhat/types";
import { accounts } from "./test-wallet";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const privateKey: string = process.env.PRIVATE_KEY ?? "";
if (!privateKey) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

const infuraApiKey: string = process.env.INFURA_API_KEY ?? "";
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

export const chainIds = {
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
  hardhat: 31337,
};

export function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = `https://${network}.infura.io/v3/${infuraApiKey}`;
  return {
    accounts: [privateKey],
    chainId: chainIds[network],
    url,
  };
}

// @ts-ignore
// @ts-ignore
const config: HardhatUserConfig = {
  gasReporter: {
    currency: "USD",
    enabled: !!process.env.REPORT_GAS,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance,
      })),
    },
    polygon: getChainConfig("polygon-mainnet"),
    mumbai: getChainConfig("polygon-mumbai"),
  },
  solidity: "0.8.18",
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
};

export default config;
