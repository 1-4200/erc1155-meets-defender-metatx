import { readFileSync } from "fs";
import { ethers } from "hardhat";
import { Contract } from "ethers";

export const getInstance = async (name: String): Promise<Contract> => {
  // @ts-ignore
  const address = JSON.parse(readFileSync("deploy.json"))[name];
  if (!address) throw new Error(`Contract ${name} not found in deploy.json`);
  // @ts-ignore
  const contract = await ethers.getContractFactory(name);
  return contract.attach(address);
};
