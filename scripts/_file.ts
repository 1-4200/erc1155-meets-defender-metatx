import { writeFileSync } from "fs";

const fs = require("fs");
const path = require("path");
const moment = require("moment");

export const archiveAndWriteFileSync = (
  json: string,
  outputFile: string,
  outputDir = "scripts_out",
  archiveDir = "scripts_out/archive",
) => {
  const filePath = path.join(outputDir, outputFile);
  if (fs.existsSync(filePath)) {
    // Create archive directory if it doesn't exist
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir);
    }
    // Archive existing file with timestamp in the filename
    const timestamp = moment().format("YYYY-MM-DD-HHmmss");
    const archiveFileName = `${outputFile}_${timestamp}`;
    const archiveFilePath = path.join(archiveDir, archiveFileName);
    fs.renameSync(filePath, archiveFilePath);

    console.log(`Archived ${filePath} to ${archiveFilePath}`);
  }

  writeFileSync(filePath, json);
};
