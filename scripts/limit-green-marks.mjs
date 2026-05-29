import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.resolve(siteRoot, "..");
const siteDataPath = path.join(siteRoot, "data", "site-data.json");
const greenSpanPattern = /<span\s+style=(["'])color:\s*#50946e;\1>([\s\S]*?)<\/span>/gi;
const cliShouldWrite = globalThis.process?.argv?.includes("--write") ?? false;
const maxMarks = 3;

const strongCues = [
  "意义在于",
  "核心在于",
  "关键在于",
  "贡献在于",
  "学习价值在于",
  "可以概括为",
  "可以理解为",
  "适合作为",
  "应当位于",
  "真正关心",
  "真正改变",
  "标志着",
  "奠定了",
  "形成了",
  "改变了",
  "揭示了",
  "说明了",
  "显示了",
  "提供了",
  "成为",
  "由此",
  "因此",
  "正是在",
  "从整个学科地图看",
  "在学科地图中",
  "在伦理学史中",
  "在政治哲学史中",
  "在文学理论史中",
  "在社会学史中",
  "在治疗史中",
];

const mediumCues = [
  "核心",
  "关键",
  "中心",
  "位置",
  "影响",
  "贡献",
  "转折",
  "问题意识",
  "理论机制",
  "基本结构",
  "基本问题",
  "方法",
  "框架",
  "传统",
  "路径",
  "证据",
  "模型",
  "治疗",
];

function stripInlineMarkup(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\[[^\]]+\]\(([^)]+)\)/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function charLength(value) {
  return Array.from(value).length;
}

function paragraphIndexAt(content, index) {
  return content.slice(0, index).split(/\r?\n\s*\r?\n/).length - 1;
}

function paragraphCount(content) {
  return content.split(/\r?\n\s*\r?\n/).filter((item) => item.trim()).length;
}

function scoreSpan(content, span) {
  const plain = stripInlineMarkup(span.inner);
  const length = charLength(plain);
  const currentParagraphIndex = paragraphIndexAt(content, span.start);
  const count = Math.max(1, paragraphCount(content));
  let score = 0;

  if (length >= 42 && length <= 180) score += 24;
  else if (length >= 28 && length <= 240) score += 14;
  else if (length > 240) score -= 18;

  for (const cue of strongCues) {
    if (plain.includes(cue)) score += 28;
  }
  for (const cue of mediumCues) {
    if (plain.includes(cue)) score += 10;
  }

  if (currentParagraphIndex === 0) score += 10;
  if (currentParagraphIndex >= count - 2) score += 34;
  else if (currentParagraphIndex >= count - 4) score += 18;

  return score;
}

function collectGreenSpans(content) {
  const spans = [];
  let match = null;
  greenSpanPattern.lastIndex = 0;
  while ((match = greenSpanPattern.exec(content))) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      full: match[0],
      inner: match[2],
    });
  }
  return spans;
}

function limitContent(content) {
  const spans = collectGreenSpans(content);
  if (spans.length <= maxMarks) {
    return {
      content,
      changed: false,
      before: spans.length,
      after: spans.length,
      kept: spans.map((span) => stripInlineMarkup(span.inner)),
    };
  }

  const keep = new Set(
    spans
      .map((span, index) => ({ ...span, index, score: scoreSpan(content, span) }))
      .sort((left, right) => right.score - left.score || left.start - right.start)
      .slice(0, maxMarks)
      .map((span) => span.index),
  );

  let nextContent = "";
  let cursor = 0;
  spans.forEach((span, index) => {
    nextContent += content.slice(cursor, span.start);
    nextContent += keep.has(index) ? span.full : span.inner;
    cursor = span.end;
  });
  nextContent += content.slice(cursor);

  return {
    content: nextContent,
    changed: true,
    before: spans.length,
    after: collectGreenSpans(nextContent).length,
    kept: spans.filter((span, index) => keep.has(index)).map((span) => stripInlineMarkup(span.inner)),
  };
}

function getArticlePath(article) {
  return path.join(sourceRoot, article.path.split("/").join(path.sep));
}

export async function run(options = {}) {
  const shouldWrite = options.write ?? cliShouldWrite;
  const siteData = JSON.parse(await fs.readFile(siteDataPath, "utf8"));
  const summary = {
    mode: shouldWrite ? "write" : "dry-run",
    changedArticles: 0,
    trimmedMarks: 0,
    samples: [],
  };

  for (const article of Object.values(siteData.articlesById ?? {})) {
    const articlePath = getArticlePath(article);
    const content = await fs.readFile(articlePath, "utf8");
    const result = limitContent(content);
    if (!result.changed) continue;

    summary.changedArticles += 1;
    summary.trimmedMarks += result.before - result.after;
    summary.samples.push({
      path: article.path,
      before: result.before,
      after: result.after,
      kept: result.kept,
    });

    if (shouldWrite) {
      await fs.writeFile(articlePath, result.content, "utf8");
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

function isCli() {
  const argv = globalThis.process?.argv;
  if (!argv?.[1]) return false;
  return path.resolve(argv[1]) === fileURLToPath(import.meta.url);
}

if (isCli()) {
  run().catch((error) => {
    console.error(error);
    if (globalThis.process) {
      globalThis.process.exitCode = 1;
    }
  });
}
