import { config } from "hardhat";

// Name the following function whatever you want
export const privateKey = () => {
  const accounts = config.networks.hardhat.accounts;
  const index = 0; // first wallet, increment for next wallets
  if ("mnemonic" in accounts) {
    const wallet = ethers.Wallet.fromMnemonic(accounts.mnemonic, accounts.path + `/${index}`);
    return {
      key: wallet.privateKey,
      address: wallet.address,
    };
  }
};
