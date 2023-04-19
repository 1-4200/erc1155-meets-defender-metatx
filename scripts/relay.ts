import { MinimalForwarder } from "../typechain-types";
import { ethers } from "hardhat";
const { DefenderRelayProvider, DefenderRelaySigner } = require("defender-relay-client/lib/ethers");
const ForwarderAbi = require("../artifacts_forge/MinimalForwarder.sol/MinimalForwarder.json").abi;
const ForwarderAddress = require("../deploy.json").MinimalForwarder;

const relay = async (forwarder: MinimalForwarder, request: any, signature: string) => {
  // Validate request on the forwarder contract
  const valid = await forwarder.verify(request, signature);
  if (!valid) throw new Error(`Invalid request`);

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(request.gas) + 50000).toString();
  return await forwarder.execute(request, signature, { gasLimit });
};

export const handler = async (event: any) => {
  // Parse webhook payload
  if (!event.request || !event.request.body) throw new Error(`Missing payload`);
  const { request, signature } = event.request.body;
  console.log(`Relaying`, request);

  // Initialize Relayer provider and signer, and forwarder contract
  const credentials = { ...event };
  const provider = new DefenderRelayProvider(credentials);
  const signer = new DefenderRelaySigner(credentials, provider, { speed: "fast" });
  const forwarder = new ethers.Contract(ForwarderAddress, ForwarderAbi, signer) as MinimalForwarder;

  // Relay transaction!
  const tx = await relay(forwarder, request, signature);
  console.log(`Sent meta-tx: ${tx.hash}`);
  return { txHash: tx.hash };
};
