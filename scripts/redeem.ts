import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";
import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { Wallet } from "ethers";
import { MinimalForwarder } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { chainIds } from "../hardhat.config";
import { getInstance } from "./_contract";

const RPC_URL = `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`;
const chainId = chainIds["polygon-mumbai"];
const DomainName = "MinimalForwarder";
const DomainVersion = "0.0.1";
const ERC1155MetaTxDomainName = "ERC1155MetaTx";
const ERC1155MetaTxDomainVersion = "1.0.0";

const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

const buildRequest = async (forwarder: MinimalForwarder, input: any) => {
  const nonce = await forwarder.getNonce(input.from).then(nonce => nonce.toString());
  console.log(`Nonce: ${nonce}`);
  return { value: 0, gas: 1e6, nonce, ...input };
};

const buildTypedData = async (forwarder: MinimalForwarder, request: any) => {
  const chainId = await forwarder.provider.getNetwork().then(n => n.chainId);
  console.log(`ChainId: ${chainId}`);
  const typeData = getMetaTxTypeData(chainId, forwarder.address);
  console.log(`TypeData: ${JSON.stringify(typeData)}`);
  return { ...typeData, message: request };
};

const getMetaTxTypeData = (chainId: Number, verifyingContract: string) => {
  return {
    types: {
      EIP712Domain,
      ForwardRequest,
    },
    domain: {
      name: DomainName,
      version: DomainVersion,
      chainId,
      verifyingContract,
    },
    primaryType: "ForwardRequest",
  };
};

// TODO: Need to check if this is correct
const signTypedDateWithEthSig = async (privateKeyStr: string, from: string, data: any) => {
  const privateKey = Buffer.from(privateKeyStr.replace(/^0x/, ""), "hex");
  return signTypedData({
    privateKey,
    data,
    version: SignTypedDataVersion.V4,
  });
};

const signMetaTxRequest = async (privateKey: string, forwarder: MinimalForwarder, input: any) => {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedDateWithEthSig(privateKey, input.from, toSign);
  console.log(`Signature: ${signature}`);
  return { signature, request };
};

const createERC1155MetaTxSignature = async (
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

  writeFileSync("scripts_out/redeem.json", JSON.stringify(request, null, 2));
  console.log(`Signature: `, request.signature);
  console.log(`Request: `, request.request);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
