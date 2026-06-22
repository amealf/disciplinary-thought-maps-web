import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findMarkdownWriteIssues, shouldIgnoreMarkdownFile } from "./lib/markdown-write-guard.mjs";
import { loadNotionArticles } from "./sources/notion.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const defaultContentRoot = path.resolve(siteRoot, "..", "content");
const sourceRoot = path.resolve(process.env.CONTENT_ROOT || defaultContentRoot);
const outputDir = path.resolve(process.env.OUTPUT_ROOT || path.join(siteRoot, "data"));
const outputPath = path.join(outputDir, "site-data.json");
const articlesOutputDir = path.join(outputDir, "articles");
const legacyHomeMapPath = path.resolve(process.env.HOME_MAP_PATH || path.join(sourceRoot, "首页学科目录.md"));
const splitHomeMapPaths = [
  path.join(sourceRoot, "首页学科目录-CN.md"),
  path.join(sourceRoot, "首页学科目录-EN.md"),
].map((filePath) => path.resolve(filePath));
const contentRootLabel = process.env.CONTENT_ROOT_LABEL || "github-content";
const ignoredDirs = new Set(["site", ".git", "node_modules", ".obsidian", "__pycache__"]);

const collator = new Intl.Collator("zh-Hans-CN", {
  numeric: true,
  sensitivity: "base",
});

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function pathId(kind, relativePath) {
  const hash = createHash("sha1")
    .update(`${kind}:${toPosixPath(relativePath)}`)
    .digest("hex")
    .slice(0, 16);
  return `${kind}-${hash}`;
}

function parseOrdinal(name) {
  const match = name.match(/^(\d+(?:[_\.]\d+)*)(?:\s+|$)/);
  if (!match) return null;
  return match[1].split(/[_\.]/).map((part) => Number(part));
}

function compareOrdinal(a, b) {
  const left = parseOrdinal(a.name);
  const right = parseOrdinal(b.name);
  if (left && right) {
    const max = Math.max(left.length, right.length);
    for (let index = 0; index < max; index += 1) {
      const diff = (left[index] ?? 0) - (right[index] ?? 0);
      if (diff !== 0) return diff;
    }
  }
  if (left && !right) return -1;
  if (!left && right) return 1;
  return collator.compare(a.name, b.name);
}

function cleanName(name) {
  const withoutExt = name.replace(/\.md$/i, "");
  return withoutExt
    .replace(/^\d+(?:[_\.]\d+)*(?:\s+|$)/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getChineseTitlePrefix(value) {
  const text = String(value ?? "").trim();
  if (!/[\u3400-\u9fff]/.test(text)) return "";
  return text
    .replace(/[（(][\s\S]*$/, "")
    .replace(/[A-Za-z][\s\S]*$/, "")
    .replace(/[：:;；\-–—（(]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getHomeTitleAliasVariants(value) {
  const title = getChineseTitlePrefix(cleanName(String(value ?? "")));
  const variants = [];
  const disciplinePrefixes = ["社会学"];

  for (const prefix of disciplinePrefixes) {
    if (title.startsWith(prefix) && title.length > prefix.length) {
      variants.push(title.slice(prefix.length));
    }
  }

  return variants;
}

function getTitleMatchKeys(value) {
  const variants = [
    String(value ?? ""),
    cleanName(String(value ?? "")),
    getChineseTitlePrefix(cleanName(String(value ?? ""))),
    ...getHomeTitleAliasVariants(value),
  ];

  return new Set(variants.map(normalizeHomeTitle).filter(Boolean));
}

async function findMatchingDirectory(parentDir, title) {
  const targetKeys = getTitleMatchKeys(title);
  const entries = (await safeReadDir(parentDir)).filter(isContentDirectory);
  const candidates = [];

  for (const entry of entries) {
    const entryKeys = getTitleMatchKeys(entry.name);
    for (const key of targetKeys) {
      if (entryKeys.has(key)) {
        candidates.push(path.join(parentDir, entry.name));
        break;
      }
    }
  }

  if (!candidates.length) return "";

  const ranked = [];
  for (const candidate of candidates) {
    ranked.push({
      path: candidate,
      hasContent: await directoryHasMarkdownFile(candidate),
      nameLength: path.basename(candidate).length,
    });
  }

  ranked.sort((left, right) => (
    Number(right.hasContent) - Number(left.hasContent) ||
    left.nameLength - right.nameLength ||
    collator.compare(path.basename(left.path), path.basename(right.path))
  ));

  return ranked[0].path;
}

async function resolveHomeItemDirectory(item, { createMissing = false } = {}) {
  const created = [];
  let current = sourceRoot;

  for (const part of item.pathParts) {
    const exactPath = path.join(current, part);
    const matchedPath = await findMatchingDirectory(current, part);
    if (matchedPath) {
      current = matchedPath;
      continue;
    }

    if (await isDirectoryPath(exactPath)) {
      current = exactPath;
      continue;
    }

    if (createMissing) {
      await fs.mkdir(exactPath, { recursive: true });
      created.push(path.relative(sourceRoot, exactPath));
    }
    current = exactPath;
  }

  return { absoluteDir: current, created };
}

function getFirstHeading(content) {
  const match = content.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : "";
}

function makeExcerpt(content) {
  return content
    .replace(/^#+\s+.+$/gm, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

async function safeReadDir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function isDirectoryPath(dir) {
  try {
    return (await fs.stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

async function isFilePath(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function isContentDirectory(entry) {
  return entry.isDirectory() && !ignoredDirs.has(entry.name) && !entry.name.startsWith(".");
}

async function directoryHasMarkdownFile(dir) {
  const entries = await safeReadDir(dir);

  for (const entry of entries) {
    const childPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md") && !shouldIgnoreMarkdownFile(childPath)) {
      return true;
    }
  }

  for (const entry of entries.filter(isContentDirectory)) {
    if (await directoryHasMarkdownFile(path.join(dir, entry.name))) return true;
  }

  return false;
}

async function collectMarkdownFiles(dir) {
  const entries = (await safeReadDir(dir)).sort(compareOrdinal);
  const folders = entries.filter(isContentDirectory);
  const files = entries.filter((entry) => {
    const childPath = path.join(dir, entry.name);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".md") && !shouldIgnoreMarkdownFile(childPath);
  });
  const nested = [];

  for (const folder of folders) {
    const childPath = path.join(dir, folder.name);
    nested.push(...(await collectMarkdownFiles(childPath)));
  }

  return [
    ...files.map((file) => path.join(dir, file.name)),
    ...nested,
  ];
}

async function addDirectoryNode(context, absoluteDir, parentId, subjectId, depth) {
  const relativePath = path.relative(sourceRoot, absoluteDir);
  const nodeId = pathId("node", relativePath);
  const rawName = path.basename(absoluteDir);
  const node = {
    id: nodeId,
    type: depth === 1 ? "level1" : "level2",
    subjectId,
    parentId,
    title: cleanName(rawName) || rawName,
    rawTitle: rawName,
    path: toPosixPath(relativePath),
    depth,
    childrenIds: [],
    articleId: null,
    sourceType: "github",
  };

  context.nodesById[nodeId] = node;
  context.nodesById[parentId].childrenIds.push(nodeId);
  context.searchEntries.push({
    id: nodeId,
    type: node.type,
    subjectId,
    nodeId,
    articleId: null,
    title: node.title,
    pathText: context.makePathText(nodeId),
    excerpt: "",
    sourceType: "github",
  });

  const entries = (await safeReadDir(absoluteDir)).sort(compareOrdinal);
  const folders = entries.filter(isContentDirectory);
  const files = entries.filter((entry) => {
    const childPath = path.join(absoluteDir, entry.name);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".md") && !shouldIgnoreMarkdownFile(childPath);
  });

  for (const folder of folders) {
    await addDirectoryNode(context, path.join(absoluteDir, folder.name), nodeId, subjectId, depth + 1);
  }

  for (const file of files) {
    await addArticleNode(context, path.join(absoluteDir, file.name), nodeId, subjectId, depth + 1);
  }

  node.disabled = node.childrenIds.length === 0;
  sortChildrenByContent(context.nodesById, nodeId);
}

async function addArticleNode(context, absoluteFile, parentId, subjectId, depth) {
  const relativePath = path.relative(sourceRoot, absoluteFile);
  const nodeId = pathId("article", relativePath);
  const content = await fs.readFile(absoluteFile, "utf8");
  const writeIssues = findMarkdownWriteIssues(content, { targetPath: absoluteFile });
  if (writeIssues.length) {
    context.skippedInvalidArticles.push({
      path: toPosixPath(relativePath),
      issues: writeIssues,
      sourceType: "github",
    });
    return;
  }
  const rawName = path.basename(absoluteFile);
  const fileTitle = cleanName(rawName) || rawName.replace(/\.md$/i, "");
  const heading = getFirstHeading(content);
  const title = heading || fileTitle;

  context.nodesById[nodeId] = {
    id: nodeId,
    type: "article",
    subjectId,
    parentId,
    title,
    shortTitle: fileTitle,
    rawTitle: rawName,
    path: toPosixPath(relativePath),
    depth,
    childrenIds: [],
    articleId: nodeId,
    sourceType: "github",
  };
  context.nodesById[parentId].childrenIds.push(nodeId);

  const pathText = context.makePathText(nodeId);
  const excerpt = makeExcerpt(content);
  const articlePayload = {
    id: nodeId,
    subjectId,
    nodeId,
    title,
    shortTitle: fileTitle,
    heading,
    path: toPosixPath(relativePath),
    pathText,
    content,
    excerpt,
    sourceType: "github",
  };
  context.articlePayloads.push(articlePayload);
  context.articlesById[nodeId] = {
    ...articlePayload,
    content: undefined,
    contentPath: `data/articles/${nodeId}.json`,
  };
  context.searchEntries.push({
    id: nodeId,
    type: "article",
    subjectId,
    nodeId,
    articleId: nodeId,
    title,
    pathText,
    excerpt,
    sourceType: "github",
  });
}

function nodeHasContent(nodesById, nodeId) {
  const node = nodesById[nodeId];
  if (!node) return false;
  if (node.type === "article") return true;
  return node.childrenIds.some((childId) => nodeHasContent(nodesById, childId));
}

function sortChildrenByContent(nodesById, nodeId) {
  const node = nodesById[nodeId];
  if (!node?.childrenIds?.length) return;

  node.childrenIds = node.childrenIds
    .map((childId, index) => ({
      childId,
      index,
      hasContent: nodeHasContent(nodesById, childId),
    }))
    .sort((left, right) => (
      Number(right.hasContent) - Number(left.hasContent) ||
      left.index - right.index
    ))
    .map((item) => item.childId);
}

function findChildNodeByTitle(nodesById, parentId, title) {
  const parent = nodesById[parentId];
  if (!parent) return null;
  const normalizedTitle = normalizeHomeTitle(title);
  const childId = parent.childrenIds.find((id) => {
    const child = nodesById[id];
    return child && child.type !== "article" && normalizeHomeTitle(child.title) === normalizedTitle;
  });
  return childId ? nodesById[childId] : null;
}

function findSubjectByTitle(result, title) {
  const normalizedTitle = normalizeHomeTitle(title);
  return result.subjects.find((subject) => normalizeHomeTitle(subject.title) === normalizedTitle) ?? null;
}

function createSubject(result, subjectId, title, rawTitle, relativePath, homeKey = null, sourceType = "markdown") {
  if (result.nodesById[subjectId]) {
    return result.subjects.find((subject) => subject.id === subjectId) ?? null;
  }

  const displayPathParts = getDisplayPathParts(homeKey, relativePath, title);
  result.nodesById[subjectId] = {
    id: subjectId,
    type: "subject",
    subjectId,
    parentId: null,
    title,
    rawTitle,
    path: toPosixPath(relativePath),
    depth: 0,
    childrenIds: [],
    articleId: null,
    sourceType,
    displayPathParts,
  };

  const subject = {
    id: subjectId,
    title,
    path: toPosixPath(relativePath),
    homeKey,
    rootNodeId: subjectId,
    articleCount: 0,
    groupCount: 0,
    topLevelCount: 0,
    sourceType,
  };

  result.subjects.push(subject);
  result.searchEntries.push({
    id: subjectId,
    type: "subject",
    subjectId,
    nodeId: subjectId,
    articleId: null,
    title,
    pathText: displayPathParts.join(" / "),
    excerpt: "0 篇文章",
    sourceType,
  });

  return subject;
}

function getOrCreateDirectoryNode(result, parentId, subjectId, title, relativePath, depth, sourceType) {
  const existing = findChildNodeByTitle(result.nodesById, parentId, title);
  if (existing) return existing;

  const nodeId = pathId("node", `${sourceType}:${relativePath}`);
  const node = {
    id: nodeId,
    type: depth === 1 ? "level1" : "level2",
    subjectId,
    parentId,
    title,
    rawTitle: title,
    path: toPosixPath(relativePath),
    depth,
    childrenIds: [],
    articleId: null,
    sourceType,
  };

  result.nodesById[nodeId] = node;
  result.nodesById[parentId].childrenIds.push(nodeId);
  result.searchEntries.push({
    id: nodeId,
    type: node.type,
    subjectId,
    nodeId,
    articleId: null,
    title: node.title,
    pathText: makePathText(result.nodesById, nodeId),
    excerpt: "",
    sourceType,
  });

  return node;
}

function addExternalArticle(result, article) {
  const writeIssues = findMarkdownWriteIssues(article.content, { targetPath: article.rawName || `${article.title}.md` });
  if (writeIssues.length) {
    result.skippedInvalidArticles.push({
      path: article.relativePath || article.rawName || article.title,
      issues: writeIssues,
      sourceType: article.sourceType || "external",
    });
    return;
  }

  const sourceType = article.sourceType || "external";
  const subjectTitle = cleanName(article.subjectTitle || sourceType);
  let subject = findSubjectByTitle(result, subjectTitle);

  if (!subject) {
    const subjectPath = `${sourceType}/${subjectTitle}`;
    const subjectId = pathId("subject", `${sourceType}:${subjectTitle}`);
    subject = createSubject(result, subjectId, subjectTitle, subjectTitle, subjectPath, null, sourceType);
  }

  let parentId = subject.id;
  let depth = 1;
  const folderParts = article.folderParts ?? [];

  for (const folder of folderParts) {
    const title = cleanName(folder) || folder;
    const relativePath = `${subject.path}/${folderParts.slice(0, depth).join("/")}`;
    const node = getOrCreateDirectoryNode(result, parentId, subject.id, title, relativePath, depth, sourceType);
    parentId = node.id;
    depth += 1;
  }

  const relativePath = article.relativePath || `${sourceType}/${subjectTitle}/${article.rawName}`;
  const nodeId = pathId("article", `${sourceType}:${relativePath}:${article.sourceId ?? ""}`);
  const fileTitle = cleanName(article.rawName || article.title) || article.title;
  const heading = getFirstHeading(article.content);
  const title = heading || fileTitle;
  const pathText = makePathText(result.nodesById, parentId);
  const fullPathText = pathText ? `${pathText} / ${title}` : title;
  const excerpt = makeExcerpt(article.content);

  result.nodesById[nodeId] = {
    id: nodeId,
    type: "article",
    subjectId: subject.id,
    parentId,
    title,
    shortTitle: fileTitle,
    rawTitle: article.rawName || `${article.title}.md`,
    path: toPosixPath(relativePath),
    depth,
    childrenIds: [],
    articleId: nodeId,
    sourceType,
    sourceId: article.sourceId ?? null,
    sourceUrl: article.sourceUrl ?? "",
  };
  result.nodesById[parentId].childrenIds.push(nodeId);

  const articlePayload = {
    id: nodeId,
    subjectId: subject.id,
    nodeId,
    title,
    shortTitle: fileTitle,
    heading,
    path: toPosixPath(relativePath),
    pathText: fullPathText,
    content: article.content,
    excerpt,
    sourceType,
    sourceId: article.sourceId ?? null,
    sourceUrl: article.sourceUrl ?? "",
    updatedAt: article.updatedAt ?? "",
  };

  result.articlePayloads.push(articlePayload);
  result.articlesById[nodeId] = {
    ...articlePayload,
    content: undefined,
    contentPath: `data/articles/${nodeId}.json`,
  };
  result.searchEntries.push({
    id: nodeId,
    type: "article",
    subjectId: subject.id,
    nodeId,
    articleId: nodeId,
    title,
    pathText: fullPathText,
    excerpt,
    sourceType,
  });
}

function recalculateSubjectStats(result) {
  for (const subject of result.subjects) {
    subject.articleCount = Object.values(result.articlesById).filter(
      (article) => article.subjectId === subject.id,
    ).length;
    subject.groupCount = Object.values(result.nodesById).filter(
      (node) => node.subjectId === subject.id && node.type !== "subject" && node.type !== "article",
    ).length;
    subject.topLevelCount = result.nodesById[subject.id]?.childrenIds.length ?? 0;
  }

  for (const entry of result.searchEntries) {
    if (entry.type !== "subject") continue;
    const subject = result.subjects.find((item) => item.id === entry.subjectId);
    if (subject) entry.excerpt = `${subject.articleCount} 篇文章`;
  }
}

function makePathText(nodesById, nodeId) {
  const parts = [];
  let cursor = nodesById[nodeId];
  while (cursor) {
    if (!cursor.parentId && Array.isArray(cursor.displayPathParts) && cursor.displayPathParts.length) {
      parts.unshift(...cursor.displayPathParts);
    } else {
      parts.unshift(cursor.title);
    }
    cursor = cursor.parentId ? nodesById[cursor.parentId] : null;
  }
  return parts.join(" / ");
}

function getDisplayPathParts(homeKey, relativePath, title) {
  const rawParts = String(homeKey || toPosixPath(relativePath) || title || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const parts = rawParts.length > 1 ? rawParts.slice(1) : rawParts;
  return parts.length ? parts : [title].filter(Boolean);
}

function normalizeHomeTitle(value) {
  return String(value ?? "")
    .toLocaleLowerCase("zh-CN")
    .replace(/[、，,]/g, " ")
    .replace(/[()（）]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHomeMapText(content) {
  const lines = String(content ?? "").replace(/\r\n/g, "\n").split("\n");
  const items = [];
  let sawHomeMapTitle = false;

  for (const rawLine of lines) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (!withoutComment.trim() || withoutComment.trimStart().startsWith("#")) continue;

    const indent = withoutComment.match(/^\s*/)?.[0] ?? "";
    const indentLevel = Math.floor(indent.replace(/\t/g, "  ").length / 2);
    const value = withoutComment
      .trim()
      .replace(/^[-*]\s+/, "")
      .replace(/^(一级|二级)\s*[:：]\s*/, "")
      .trim();

    if (!value) continue;
    items.push({
      level: Math.min(6, Math.max(1, indentLevel + 1)),
      title: value,
    });
  }

  if (!items.length) {
    for (const rawLine of lines) {
      const match = rawLine.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (!match) continue;

      const title = match[2].trim();
      if (!sawHomeMapTitle && match[1].length === 1 && title === "首页学科目录") {
        sawHomeMapTitle = true;
        continue;
      }

      items.push({
        level: match[1].length,
        title,
      });
    }
  }

  return items;
}

async function readHomeMapItems() {
  const paths = await getHomeMapPaths();
  const items = [];

  for (const filePath of paths) {
    try {
      items.push(...parseHomeMapText(await fs.readFile(filePath, "utf8")));
    } catch {
      // ignore missing optional map files
    }
  }

  return items;
}

async function getHomeMapPaths() {
  if (process.env.HOME_MAP_PATH) return [legacyHomeMapPath];

  const existingSplitPaths = [];
  for (const filePath of splitHomeMapPaths) {
    if (await isFilePath(filePath)) existingSplitPaths.push(filePath);
  }

  return existingSplitPaths.length ? existingSplitPaths : [legacyHomeMapPath];
}

function buildHomeItems(items) {
  const nodes = [];
  const stack = [];
  const nodesByKey = new Map();

  for (const item of items) {
    const parent = item.level > 1 ? stack[item.level - 2] : null;
    const key = parent ? `${parent.key}/${item.title}` : item.title;
    const pathParts = parent ? [...parent.pathParts, item.title] : [item.title];
    const node = {
      ...item,
      key,
      parentKey: parent?.key ?? null,
      pathParts,
    };

    const normalizedKey = normalizeHomeTitle(key);
    if (nodesByKey.has(normalizedKey)) {
      stack[item.level - 1] = nodesByKey.get(normalizedKey);
      stack.length = item.level;
      continue;
    }

    nodes.push(node);
    nodesByKey.set(normalizedKey, node);
    stack[item.level - 1] = node;
    stack.length = item.level;
  }

  return nodes;
}

const sociologyHomeOnlyTopicTitles = new Set(
  ["理论传统", "代表学者", "经典文本", "当代议题"].map(normalizeHomeTitle),
);

function shouldCreateHomeMapDirectory(item) {
  const pathKeys = item.pathParts.map(normalizeHomeTitle);
  return !(pathKeys.includes(normalizeHomeTitle("社会学")) && sociologyHomeOnlyTopicTitles.has(normalizeHomeTitle(item.title)));
}

async function ensureHomeMapDirectories(items) {
  const created = [];
  const seen = new Set();

  for (const item of buildHomeItems(items)) {
    if (!shouldCreateHomeMapDirectory(item)) continue;
    const result = await resolveHomeItemDirectory(item, { createMissing: true });
    for (const relativePath of result.created) {
      if (seen.has(relativePath)) continue;
      seen.add(relativePath);
      created.push(relativePath);
    }
  }

  return created;
}

const hiddenHomeGroupTitles = new Set(["en"]);

function isHiddenHomeGroupTitle(title) {
  return hiddenHomeGroupTitles.has(normalizeHomeTitle(title));
}

function buildHomeDisplayItems(items) {
  return buildHomeItems(items)
    .filter((item) => !(item.level === 1 && isHiddenHomeGroupTitle(item.title)))
    .map((item) => {
      const hiddenRootCount = item.pathParts.length && isHiddenHomeGroupTitle(item.pathParts[0]) ? 1 : 0;
      return {
        level: Math.max(1, item.level - hiddenRootCount),
        title: item.title,
        homeKey: item.key,
      };
    });
}

async function buildHomeMap(subjects, items = null) {
  const subjectByTitle = new Map(
    subjects.map((subject) => [normalizeHomeTitle(subject.title), subject]),
  );
  const subjectByHomeKey = new Map(
    subjects
      .filter((subject) => subject.homeKey)
      .map((subject) => [subject.homeKey, subject]),
  );

  let homeItems = items ?? await readHomeMapItems();

  if (!homeItems.length) {
    homeItems = subjects.map((subject) => ({ level: 1, title: subject.title }));
  }

  const displayItems = buildHomeDisplayItems(homeItems);
  const nodes = [];
  const stack = [];
  const sourcePaths = (await getHomeMapPaths()).map((filePath) => path.relative(sourceRoot, filePath));

  for (const item of displayItems) {
    const parent = item.level > 1 ? stack[item.level - 2] : null;
    const key = parent ? `${parent.key}/${item.title}` : item.title;
    const subject =
      subjectByHomeKey.get(item.homeKey) ??
      subjectByHomeKey.get(key) ??
      subjectByTitle.get(normalizeHomeTitle(item.title)) ??
      null;
    const node = {
      id: pathId("home", key),
      title: item.title,
      level: item.level,
      parentId: parent?.id ?? null,
      subjectId: subject?.id ?? null,
      key,
    };

    nodes.push(node);
    stack[item.level - 1] = node;
    stack.length = item.level;
  }

  const linkedSubjectIds = new Set(nodes.map((node) => node.subjectId).filter(Boolean));
  for (const subject of subjects) {
    if (linkedSubjectIds.has(subject.id)) continue;
    nodes.push({
      id: pathId("home", `source/${subject.id}`),
      title: subject.title,
      level: 1,
      parentId: null,
      subjectId: subject.id,
      key: `source/${subject.id}`,
    });
  }

  return {
    sourcePath: sourcePaths.join(", "),
    sourcePaths,
    nodes: nodes.map(({ key, ...node }) => node),
    links: nodes
      .filter((node) => node.parentId)
      .map((node) => ({ sourceId: node.parentId, targetId: node.id })),
  };
}

async function build() {
  const rawHomeItems = await readHomeMapItems();
  const createdHomeDirs = await ensureHomeMapDirectories(rawHomeItems);
  const rootEntries = (await safeReadDir(sourceRoot)).sort(compareOrdinal);
  const rootDirs = rootEntries.filter((entry) => isContentDirectory(entry));
  const rootDirByTitle = new Map(
    rootDirs.map((entry) => [normalizeHomeTitle(entry.name), entry]),
  );
  const homeItems = buildHomeItems(rawHomeItems);
  const homeParentKeys = new Set(homeItems.map((item) => item.parentKey).filter(Boolean));
  const subjectCandidates = [];
  const usedSubjectPaths = new Set();

  if (homeItems.length) {
    for (const item of homeItems) {
      if (homeParentKeys.has(item.key)) continue;

      let absoluteSubject = (await resolveHomeItemDirectory(item)).absoluteDir;
      if (!(await isDirectoryPath(absoluteSubject))) {
        const fallbackDir = rootDirByTitle.get(normalizeHomeTitle(item.title));
        absoluteSubject = fallbackDir ? path.join(sourceRoot, fallbackDir.name) : "";
      }
      if (!absoluteSubject) continue;

      const relativeSubject = path.relative(sourceRoot, absoluteSubject);
      const normalizedPath = toPosixPath(relativeSubject);
      if (usedSubjectPaths.has(normalizedPath)) continue;
      usedSubjectPaths.add(normalizedPath);
      subjectCandidates.push({
        absoluteSubject,
        title: item.title,
        rawTitle: path.basename(absoluteSubject),
        homeKey: item.key,
      });
    }
  } else {
    for (const entry of rootDirs) {
      const absoluteSubject = path.join(sourceRoot, entry.name);
      subjectCandidates.push({
        absoluteSubject,
        title: entry.name,
        rawTitle: entry.name,
        homeKey: null,
      });
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    contentRootLabel,
    sources: [
      {
        type: "github",
        label: contentRootLabel,
      },
    ],
    subjects: [],
    nodesById: {},
    articlesById: {},
    searchEntries: [],
    articlePayloads: [],
    skippedInvalidArticles: [],
  };

  for (const subjectCandidate of subjectCandidates) {
    const absoluteSubject = subjectCandidate.absoluteSubject;
    const markdownFiles = await collectMarkdownFiles(absoluteSubject);
    if (markdownFiles.length === 0) continue;

    const subjectRelativePath = path.relative(sourceRoot, absoluteSubject);
    const subjectId = pathId("subject", subjectRelativePath);
    createSubject(
      result,
      subjectId,
      subjectCandidate.title,
      subjectCandidate.rawTitle,
      subjectRelativePath,
      subjectCandidate.homeKey,
      "github",
    );

    const context = {
      nodesById: result.nodesById,
      articlesById: result.articlesById,
      searchEntries: result.searchEntries,
      articlePayloads: result.articlePayloads,
      skippedInvalidArticles: result.skippedInvalidArticles,
      makePathText: (nodeId) => makePathText(result.nodesById, nodeId),
    };

    const entries = (await safeReadDir(absoluteSubject)).sort(compareOrdinal);
    const folders = entries.filter(isContentDirectory);
    const files = entries.filter((entry) => {
      const childPath = path.join(absoluteSubject, entry.name);
      return entry.isFile() && entry.name.toLowerCase().endsWith(".md") && !shouldIgnoreMarkdownFile(childPath);
    });

    for (const folder of folders) {
      await addDirectoryNode(context, path.join(absoluteSubject, folder.name), subjectId, subjectId, 1);
    }
    for (const file of files) {
      await addArticleNode(context, path.join(absoluteSubject, file.name), subjectId, subjectId, 1);
    }
    sortChildrenByContent(result.nodesById, subjectId);

  }

  const notionArticles = await loadNotionArticles();
  if (notionArticles.length) {
    result.sources.push({
      type: "notion",
      label: process.env.NOTION_SOURCE_LABEL || "notion",
    });
    for (const article of notionArticles) {
      addExternalArticle(result, article);
    }
  }

  recalculateSubjectStats(result);
  result.homeMap = await buildHomeMap(result.subjects, rawHomeItems);

  const articlePayloads = result.articlePayloads;
  delete result.articlePayloads;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(articlesOutputDir, { recursive: true });
  for (const article of articlePayloads) {
    await fs.writeFile(
      path.join(articlesOutputDir, `${article.id}.json`),
      `${JSON.stringify(article)}\n`,
      "utf8",
    );
  }
  await fs.writeFile(outputPath, `${JSON.stringify(result)}\n`, "utf8");
  console.log(`Generated ${outputPath}`);
  console.log(`Subjects: ${result.subjects.length}`);
  console.log(`Articles: ${Object.keys(result.articlesById).length}`);
  if (createdHomeDirs.length) {
    console.log(`Created home map directories: ${createdHomeDirs.length}`);
  }
  if (result.skippedInvalidArticles.length) {
    console.log(`Skipped invalid articles: ${result.skippedInvalidArticles.length}`);
  }
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
