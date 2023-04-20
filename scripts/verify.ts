import { getInstance } from "./_contract";
import { ethers } from "hardhat";
import { readFileSync } from "fs";

const requestFilePath = "scripts_out/redeem.json";

async function main() {
  const forwarder = await getInstance("MinimalForwarder");
  console.log(`Testing request ${requestFilePath} on forwarder at ${forwarder.address}...`);
  const { request, signature } = JSON.parse(readFileSync(requestFilePath, "utf8"));

  try {
    const valid = await forwarder.verify(request, signature);
    console.log(`Signature ${signature} for request is${!valid ? " not " : " "}valid`);
  } catch (err) {
    console.error(`Could not validate signature for request: ${err}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
