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
const outPutFile = "redeem.json";

async function main() {
  const forwarder = (await getInstance("MinimalForwarder")) as MinimalForwarder;
  const erc1155MetaTx = await getInstance("ERC1155MetaTx");
  const {
    MNEMONIC: mnemonic,
    PRIVATE_KEY: privateKey,
    RECEIVER_ADDRESS: receiver,
    RECEIVE_TOKEN_ID: tokenId,
    RECEIVE_TOKEN_AMOUNT: amount,
  } = process.env;
  console.log("-".repeat(80));
  console.log(`RPC_URL: ${RPC_URL}`);
  console.log(`Receiver address: ${receiver}`);
  console.log(`Token ID: ${tokenId}`);
  console.log(`Token Amount: ${amount}`);
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey ?? "", provider);
  console.log(`Signing redeem as ${wallet.address}`);
  const signature = await createERC1155MetaTxSignature(
    wallet,
    erc1155MetaTx.address,
    Number(tokenId),
    Number(amount),
    ERC1155MetaTxDomainName,
    ERC1155MetaTxDomainVersion,
    chainId,
  );
  console.log(`Redeem signature: ${signature}`);
  const data = erc1155MetaTx.interface.encodeFunctionData("redeem", [
    receiver,
    tokenId,
    amount,
    ethers.utils.formatBytes32String(""),
    signature,
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
