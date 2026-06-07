import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeMarkdownArticleWithGuard } from "./lib/markdown-write-guard.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultContentRoot = path.resolve(scriptDir, "..", "..", "学科地图-content");
const defaultReportPath = path.join(defaultContentRoot, "生成失败清单.json");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    args[key.slice(2)] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "true";
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/guarded-write-markdown.mjs --target <article.md> --content-file <body.md> [--research-file <notes.json>] [--report <failures.json>]",
    "",
    "Notes:",
    "  --content-file is the only file written as article body.",
    "  --research-file is checked for existence only and is never merged into the article.",
  ].join("\n");
}

const args = parseArgs(process.argv.slice(2));
if (!args.target || !args["content-file"]) {
  console.error(usage());
  process.exitCode = 1;
} else {
  try {
    if (args["research-file"]) {
      await fs.access(path.resolve(args["research-file"]));
    }

    const markdown = await fs.readFile(path.resolve(args["content-file"]), "utf8");
    const result = await writeMarkdownArticleWithGuard(args.target, markdown, {
      reportPath: args.report || defaultReportPath,
    });

    console.log(JSON.stringify({
      written: result.path,
      bytes: result.bytes,
    }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
