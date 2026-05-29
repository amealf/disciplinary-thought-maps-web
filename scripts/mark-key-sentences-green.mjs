import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const siteRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.resolve(siteRoot, "..");
const siteDataPath = path.join(siteRoot, "data", "site-data.json");
const greenStyle = "color: #50946e;";
const greenOpen = `<span style="${greenStyle}">`;
const greenClose = "</span>";

const strongCues = [
  "意义在于",
  "核心在于",
  "关键在于",
  "贡献在于",
  "重要性",
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
  "不再只是",
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

const weakExampleCues = [
  "例如",
  "比如",
  "举例",
  "参考链接",
  "http",
  "www.",
  "出生于",
  "卒于",
  "出版于",
  "发表于",
];

function parseArgs(args) {
  const options = {
    write: false,
    limit: null,
    maxMarks: 1,
    subject: "",
    sample: 8,
  };

  for (const arg of args) {
    if (arg === "--write") {
      options.write = true;
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.slice("--limit=".length)) || null;
    } else if (arg.startsWith("--max=")) {
      options.maxMarks = Math.min(3, Math.max(1, Number(arg.slice("--max=".length)) || 1));
    } else if (arg.startsWith("--subject=")) {
      options.subject = arg.slice("--subject=".length).trim();
    } else if (arg.startsWith("--sample=")) {
      options.sample = Math.max(0, Number(arg.slice("--sample=".length)) || 0);
    }
  }

  return options;
}

function countGreenMarks(content) {
  return (content.match(/<span\s+style=(["'])color:\s*#50946e;\1>/gi) || []).length;
}

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

function getBodyEnd(content) {
  const match = content.match(/\n##+\s*(?:Footnotes|References?|Reference|参考|参考链接|注释|Notes)\b/i);
  return match ? match.index : content.length;
}

function getParagraphs(body) {
  const paragraphs = [];
  let start = 0;
  const separator = /\r?\n\s*\r?\n/g;
  let match = null;

  while ((match = separator.exec(body))) {
    paragraphs.push({
      raw: body.slice(start, match.index),
      start,
    });
    start = match.index + match[0].length;
  }

  if (start < body.length) {
    paragraphs.push({
      raw: body.slice(start),
      start,
    });
  }

  return paragraphs.filter((paragraph) => paragraph.raw.trim());
}

function shouldSkipParagraph(paragraph) {
  const trimmed = paragraph.trim();
  return (
    trimmed.startsWith("```") ||
    trimmed.startsWith("|") ||
    /^\[\d+\]/.test(trimmed) ||
    /^https?:\/\//i.test(trimmed) ||
    /^参考链接/.test(trimmed) ||
    /^参考文献/.test(trimmed)
  );
}

function removeLeadingHeadingLines(paragraph) {
  let raw = paragraph.raw;
  let start = paragraph.start;

  while (/^#{1,6}\s/.test(raw)) {
    const lineEnd = raw.search(/\r?\n/);
    if (lineEnd === -1) return { raw: "", start };
    const lineBreak = raw.slice(lineEnd).match(/^\r?\n/)?.[0] ?? "";
    const removeLength = lineEnd + lineBreak.length;
    raw = raw.slice(removeLength);
    start += removeLength;
  }

  return { raw, start };
}

function scoreSentence(plain, paragraphIndex, paragraphCount) {
  const length = charLength(plain);
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
  for (const cue of weakExampleCues) {
    if (plain.includes(cue)) score -= 18;
  }

  if (paragraphIndex === 0) score += 10;
  if (paragraphIndex >= paragraphCount - 1) score += 34;
  else if (paragraphIndex >= paragraphCount - 3) score += 24;
  else if (paragraphIndex >= paragraphCount - 5) score += 12;

  if (/[？?]$/.test(plain)) score -= 20;
  if (/^\s*(但是|可是|不过|与此同时)/.test(plain)) score -= 8;
  if ((plain.match(/，/g) || []).length >= 8) score -= 8;

  return score;
}

function getCandidateSentences(content) {
  const bodyEnd = getBodyEnd(content);
  const body = content.slice(0, bodyEnd);
  const paragraphBlocks = getParagraphs(body)
    .map(removeLeadingHeadingLines)
    .filter((paragraph) => paragraph.raw.trim())
    .filter((paragraph) => !shouldSkipParagraph(paragraph.raw))
    .filter((paragraph) => !paragraph.raw.includes("```"));
  const candidates = [];
  const sentencePattern = /[^。！？!?]+[。！？!?](?:\s*(?:\[\d+\]))*/g;

  paragraphBlocks.forEach((paragraph, paragraphIndex) => {
    let match = null;
    while ((match = sentencePattern.exec(paragraph.raw))) {
      const raw = match[0];
      if (/<span\b/i.test(raw) || /<\/span>/i.test(raw) || /style\s*=/i.test(raw)) continue;
      if (/<pre\b|<code\b/i.test(raw)) continue;

      const plain = stripInlineMarkup(raw);
      const length = charLength(plain);
      if (length < 24 || length > 320) continue;
      if (/^#+\s/.test(plain)) continue;
      if (/^参考/.test(plain)) continue;

      candidates.push({
        raw,
        plain,
        start: paragraph.start + match.index,
        end: paragraph.start + match.index + raw.length,
        paragraphIndex,
        score: scoreSentence(plain, paragraphIndex, paragraphBlocks.length),
      });
    }
  });

  return candidates.sort((left, right) => right.score - left.score || left.start - right.start);
}

function targetMarkCount(content, candidateCount, maxMarks) {
  const plainLength = charLength(stripInlineMarkup(content.slice(0, getBodyEnd(content))));
  if (candidateCount < 2 || plainLength < 1200) return 1;
  return Math.min(maxMarks, 2);
}

function wrapSentence(raw) {
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  let core = raw.slice(leading.length, raw.length - trailing.length);
  const citation = core.match(/((?:\s*\[\d+\])+)\s*$/)?.[1] ?? "";
  if (citation) core = core.slice(0, core.length - citation.length);
  return `${leading}${greenOpen}${core}${greenClose}${citation}${trailing}`;
}

function chooseCandidates(content, maxMarks) {
  const candidates = getCandidateSentences(content);
  const target = targetMarkCount(content, candidates.length, maxMarks);
  const selected = [];
  const usedParagraphs = new Set();

  for (const candidate of candidates) {
    if (usedParagraphs.has(candidate.paragraphIndex)) continue;
    selected.push(candidate);
    usedParagraphs.add(candidate.paragraphIndex);
    if (selected.length >= target) break;
  }

  return selected.sort((left, right) => right.start - left.start);
}

function applyMarks(content, selected) {
  let nextContent = content;
  for (const sentence of selected) {
    nextContent = `${nextContent.slice(0, sentence.start)}${wrapSentence(sentence.raw)}${nextContent.slice(sentence.end)}`;
  }
  return nextContent;
}

function getArticlePath(article) {
  return path.join(sourceRoot, article.path.split("/").join(path.sep));
}

export async function run(options = {}) {
  const finalOptions = {
    write: false,
    limit: null,
    maxMarks: 1,
    subject: "",
    sample: 8,
    ...options,
  };
  const siteData = JSON.parse(await fs.readFile(siteDataPath, "utf8"));
  const subjectsById = new Map((siteData.subjects ?? []).map((subject) => [subject.id, subject.title]));
  let articles = Object.values(siteData.articlesById ?? {}).sort((left, right) => left.path.localeCompare(right.path, "zh-Hans-CN"));

  if (finalOptions.subject) {
    articles = articles.filter((article) => subjectsById.get(article.subjectId) === finalOptions.subject);
  }
  if (finalOptions.limit) {
    articles = articles.slice(0, finalOptions.limit);
  }

  const summary = {
    mode: finalOptions.write ? "write" : "dry-run",
    totalArticles: articles.length,
    changedArticles: 0,
    skippedExistingGreen: 0,
    missingCandidates: 0,
    missingFiles: 0,
    insertedMarks: 0,
    bySubject: {},
    samples: [],
    missingCandidatePaths: [],
  };

  for (const article of articles) {
    const subject = subjectsById.get(article.subjectId) ?? article.subjectId;
    summary.bySubject[subject] ??= {
      total: 0,
      changedArticles: 0,
      skippedExistingGreen: 0,
      missingCandidates: 0,
      insertedMarks: 0,
    };
    summary.bySubject[subject].total += 1;

    const articlePath = getArticlePath(article);
    let content = "";
    try {
      content = await fs.readFile(articlePath, "utf8");
    } catch {
      summary.missingFiles += 1;
      continue;
    }

    if (countGreenMarks(content) > 0) {
      summary.skippedExistingGreen += 1;
      summary.bySubject[subject].skippedExistingGreen += 1;
      continue;
    }

    const selected = chooseCandidates(content, finalOptions.maxMarks);
    if (!selected.length) {
      summary.missingCandidates += 1;
      summary.bySubject[subject].missingCandidates += 1;
      if (summary.missingCandidatePaths.length < 40) summary.missingCandidatePaths.push(article.path);
      continue;
    }

    const nextContent = applyMarks(content, selected);
    if (nextContent !== content) {
      summary.changedArticles += 1;
      summary.insertedMarks += selected.length;
      summary.bySubject[subject].changedArticles += 1;
      summary.bySubject[subject].insertedMarks += selected.length;
      if (summary.samples.length < finalOptions.sample) {
        summary.samples.push({
          path: article.path,
          selected: selected
            .slice()
            .sort((left, right) => left.start - right.start)
            .map((sentence) => sentence.plain),
        });
      }
      if (finalOptions.write) {
        await fs.writeFile(articlePath, nextContent, "utf8");
      }
    }
  }

  return summary;
}

function isCli() {
  const argv = globalThis.process?.argv;
  if (!argv?.[1]) return false;
  return path.resolve(argv[1]) === scriptPath || pathToFileURL(path.resolve(argv[1])).href === import.meta.url;
}

if (isCli()) {
  const options = parseArgs(globalThis.process.argv.slice(2));
  run(options)
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((error) => {
      console.error(error);
      globalThis.process.exitCode = 1;
    });
}
