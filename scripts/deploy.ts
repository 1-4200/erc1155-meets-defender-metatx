const { DefenderRelayProvider, DefenderRelaySigner } = require("defender-relay-client/lib/ethers");
const { ethers } = require("hardhat");
const { writeFileSync } = require("fs");

const defaultBaseURI = "https://example.com/api/item/";
const defaultContractName = "MyERC1155MetaTx";
const defaultSymbol = "MCT";
async function main() {
  require("dotenv").config();
  const credentials = {
    apiKey: process.env.RELAYER_API_KEY,
    apiSecret: process.env.RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });
  const network = await provider.getNetwork();

  const Forwarder = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = await Forwarder.connect(relaySigner).deploy();
  await forwarder.deployed();

  const ERC1155MetaTx = await ethers.getContractFactory("ERC1155MetaTx");
  const erc1155MetaTx = await ERC1155MetaTx.connect(relaySigner).deploy(
    forwarder.address,
    defaultBaseURI,
    defaultContractName,
    defaultSymbol,
  );
  await erc1155MetaTx.deployed();

  writeFileSync(
    `deploy.json`,
    JSON.stringify(
      {
        MinimalForwarder: forwarder.address,
        ERC1155MetaTx: erc1155MetaTx.address,
      },
      null,
      2,
    ),
  );

  console.log(
    `Deploy following contracts to ${network.name}\nMinimalForwarder: ${forwarder.address}\nERC1155MetaTx: ${erc1155MetaTx.address}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
