import { MinimalForwarder } from "../typechain-types";
import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";

const DomainName = "MinimalForwarder";
const DomainVersion = "0.0.1";
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

const signTypedDateWithEthSig = async (privateKeyStr: string, from: string, data: any) => {
  const privateKey = Buffer.from(privateKeyStr.replace(/^0x/, ""), "hex");
  return signTypedData({
    privateKey,
    data,
    version: SignTypedDataVersion.V4,
  });
};

export const signMetaTxRequest = async (privateKey: string, forwarder: MinimalForwarder, input: any) => {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedDateWithEthSig(privateKey, input.from, toSign);
  console.log(`Signature: ${signature}`);
  return { signature, request };
};
