import { ethers } from "hardhat";
import { MinimalForwarder } from "../typechain-types";
import { chainIds } from "../hardhat.config";
import { createERC1155MetaTxSignature, getInstance } from "./_contract";
import { archiveAndWriteFileSync } from "./_file";
import { signMetaTxRequest } from "./_metatx";

const RPC_URL = `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`;
const chainId = chainIds["polygon-mumbai"];
const ERC1155MetaTxDomainName = "ERC1155MetaTx";
const ERC1155MetaTxDomainVersion = "1.0.0";
const outPutFile = "transfer.json";

async function main() {
  const forwarder = (await getInstance("MinimalForwarder")) as MinimalForwarder;
  const erc1155MetaTx = await getInstance("ERC1155MetaTx");
  const {
    MNEMONIC: mnemonic,
    PRIVATE_KEY: privateKey,
    FROM_ADDRESS: from,
    TO_ADDRESS: to,
    TRANSFER_TOKEN_ID: tokenId,
    TRANSFER_TOKEN_AMOUNT: amount,
  } = process.env;
  console.log("-".repeat(80));
  console.log(`RPC_URL: ${RPC_URL}`);
  console.log(`From address: ${from}`);
  console.log(`To address: ${to}`);
  console.log(`Token ID: ${tokenId}`);
  console.log(`Token Amount: ${amount}`);
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey ?? "", provider);
  console.log(`Signing transfer as ${wallet.address}`);
  if (wallet.address !== from) {
    throw new Error("The wallet address is not the same as the from address");
  }
  const data = erc1155MetaTx.interface.encodeFunctionData("safeTransferFrom", [
    from,
    to,
    tokenId,
    amount,
    ethers.utils.formatBytes32String(""),
  ]);
  console.log(`Data: ${data}`);
  const request = await signMetaTxRequest(privateKey ?? "", forwarder, {
    to: erc1155MetaTx.address,
    from: wallet.address,
    data,
  });
  const json = JSON.stringify(request, null, 2);
  archiveAndWriteFileSync(json, outPutFile);
  console.log(`Signature: `, request.signature);
  console.log(`Request: `, request.request);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
