import { handler } from "./relay";
import { readFileSync } from "fs";
const { RELAYER_API_KEY: apiKey, RELAYER_API_SECRET: apiSecret } = process.env;
const payload = readFileSync("scripts_out/redeem.json", "utf8");

handler({ apiKey, apiSecret, request: { body: JSON.parse(payload) } })
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
