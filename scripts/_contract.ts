import { readFileSync } from "fs";
import { ethers } from "hardhat";
import { Contract, Wallet } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const getInstance = async (name: String): Promise<Contract> => {
  // @ts-ignore
  const address = JSON.parse(readFileSync("deploy.json"))[name];
  if (!address) throw new Error(`Contract ${name} not found in deploy.json`);
  // @ts-ignore
  const contract = await ethers.getContractFactory(name);
  return contract.attach(address);
};

export const createERC1155MetaTxSignature = async (
  signer: SignerWithAddress | Wallet,
  contractAddress: string,
  tokenId: number,
  amount: number,
  domainName: string,
  domainVersion: string,
  chainId: number,
): Promise<string> => {
  const domain = {
    name: domainName,
    version: domainVersion,
    verifyingContract: contractAddress,
    chainId: chainId,
  };
  const types = {
    NFT: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
  };
  const values = { tokenId, amount };
  return await signer._signTypedData(domain, types, values);
};
