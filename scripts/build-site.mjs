import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const outputRoot = path.resolve(process.env.SITE_OUTPUT_ROOT || path.join(siteRoot, "dist"));

async function copyIfExists(source, destination) {
  try {
    const stats = await fs.stat(source);
    if (stats.isDirectory()) {
      await fs.cp(source, destination, { recursive: true, force: true });
      return;
    }
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await fs.mkdir(outputRoot, { recursive: true });
await copyIfExists(path.join(siteRoot, "index.html"), path.join(outputRoot, "index.html"));
await copyIfExists(path.join(siteRoot, "src"), path.join(outputRoot, "src"));
await copyIfExists(path.join(siteRoot, "public"), outputRoot);

process.env.OUTPUT_ROOT = process.env.OUTPUT_ROOT || path.join(outputRoot, "data");
await import("./generate-data.mjs");
