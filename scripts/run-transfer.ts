import { handler } from "./_relay";
import { readFileSync, writeFileSync } from "fs";
const { RELAYER_API_KEY: apiKey, RELAYER_API_SECRET: apiSecret } = process.env;
const outputFilePath = "scripts_out/transfer.json";
const payload = readFileSync(outputFilePath, "utf8");
const json = JSON.parse(payload);

handler({ apiKey, apiSecret, request: { body: json } })
  .then(data => {
    json["txHash"] = data.txHash;
    writeFileSync(outputFilePath, JSON.stringify(json, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
