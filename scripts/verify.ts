import { getInstance } from "./_contract";
import { ethers } from "hardhat";
import { readFileSync } from "fs";

async function main() {
  const forwarder = await getInstance("MinimalForwarder");
  console.log(`Testing request scripts_out/redeem.json on forwarder at ${forwarder.address}...`);
  const { request, signature } = JSON.parse(readFileSync("scripts_out/redeem.json", "utf8"));

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
