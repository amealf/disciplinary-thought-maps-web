import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.resolve(siteRoot, "..");
const pluginConfigPath = path.join(
  sourceRoot,
  "哲学",
  "伦理学",
  ".obsidian",
  "plugins",
  "highlightr-plugin",
  "data.json",
);
const ignoredDirs = new Set(["site", ".git", "node_modules", ".obsidian", "__pycache__"]);
const shouldWrite = process.argv.includes("--write");

function colorSlug(name) {
  const value = name.toLowerCase();
  return value === "grey" ? "gray" : value;
}

async function readHighlightrConfig() {
  const raw = await fs.readFile(pluginConfigPath, "utf8");
  return JSON.parse(raw);
}

function buildStyleMap(config) {
  const styleMap = new Map();

  for (const [name, color] of Object.entries(config.textColors ?? {})) {
    const slug = colorSlug(name);
    if (/^bold$/i.test(name)) {
      styleMap.set(`hltr-text-${slug}`, "font-weight: 700;");
    } else if (/^italic$/i.test(name)) {
      styleMap.set(`hltr-text-${slug}`, "font-style: italic;");
    } else if (/^underline$/i.test(name)) {
      styleMap.set(`hltr-text-${slug}`, "text-decoration: underline;");
    } else {
      styleMap.set(`hltr-text-${slug}`, `color: ${color};`);
    }
  }

  for (const [name, color] of Object.entries(config.highlighters ?? {})) {
    styleMap.set(`hltr-${colorSlug(name)}`, `background-color: ${color};`);
  }

  return styleMap;
}

async function collectMarkdownFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        await collectMarkdownFiles(path.join(dir, entry.name), files);
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function appendInlineStyle(attrs, inlineStyle) {
  const styleMatch = attrs.match(/\sstyle=(["'])([\s\S]*?)\1/i);
  if (!styleMatch) {
    return `${attrs} style="${inlineStyle}"`;
  }

  const existingStyle = styleMatch[2].trim();
  const nextStyle = existingStyle.endsWith(";") ? `${existingStyle} ${inlineStyle}` : `${existingStyle}; ${inlineStyle}`;
  return attrs.replace(styleMatch[0], ` style="${nextStyle}"`);
}

function convertContent(content, styleMap, stats) {
  return content.replace(/<(span|mark)\b([^>]*)>/gi, (full, tagName, attrs) => {
    const classMatch = attrs.match(/\sclass=(["'])([\s\S]*?)\1/i);
    if (!classMatch) return full;

    const classes = classMatch[2].split(/\s+/).filter(Boolean);
    const highlightrClass = classes.find((className) => styleMap.has(className));
    if (!highlightrClass) return full;

    const remainingClasses = classes.filter((className) => className !== highlightrClass);
    let nextAttrs = attrs;
    if (remainingClasses.length > 0) {
      nextAttrs = nextAttrs.replace(classMatch[0], ` class="${remainingClasses.join(" ")}"`);
    } else {
      nextAttrs = nextAttrs.replace(classMatch[0], "");
    }
    nextAttrs = appendInlineStyle(nextAttrs, styleMap.get(highlightrClass));

    stats.total += 1;
    stats.byClass.set(highlightrClass, (stats.byClass.get(highlightrClass) ?? 0) + 1);
    return `<${tagName}${nextAttrs}>`;
  });
}

async function main() {
  const config = await readHighlightrConfig();
  const styleMap = buildStyleMap(config);
  const files = await collectMarkdownFiles(sourceRoot);
  const stats = {
    filesChanged: 0,
    total: 0,
    byClass: new Map(),
  };

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const nextContent = convertContent(content, styleMap, stats);
    if (nextContent !== content) {
      stats.filesChanged += 1;
      if (shouldWrite) {
        await fs.writeFile(file, nextContent, "utf8");
      }
    }
  }

  const summary = {
    mode: shouldWrite ? "write" : "dry-run",
    filesChanged: stats.filesChanged,
    replacements: stats.total,
    byClass: Object.fromEntries([...stats.byClass.entries()].sort()),
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
