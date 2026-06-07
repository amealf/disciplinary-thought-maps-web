import fs from "node:fs/promises";
import path from "node:path";

const blockedContentRules = [
  {
    label: "搜索请求残留",
    pattern: /\b(system1_search_query|search_query|image_query|response_length)\b/,
  },
  {
    label: "浏览器风控报错",
    pattern: /Unusual activity has been detected|Try again later/i,
  },
  {
    label: "工具调用 JSON 残留",
    pattern: /^\s*\{[\s\S]*"(system1_search_query|search_query|image_query|response_length)"[\s\S]*\}\s*$/m,
  },
];

function byteLength(text) {
  return Buffer.byteLength(String(text ?? ""), "utf8");
}

function isDuplicateCopyName(filePath) {
  return /\(\d+\)\.md$/i.test(path.basename(filePath));
}

function isDraftMarkdown(filePath) {
  return /\.draft\.md$/i.test(path.basename(filePath));
}

export function findMarkdownWriteIssues(markdown, options = {}) {
  const issues = [];
  const content = String(markdown ?? "");
  const targetPath = options.targetPath ? path.resolve(options.targetPath) : "";

  if (targetPath && !targetPath.toLowerCase().endsWith(".md")) {
    issues.push("目标路径必须是 Markdown 文件");
  }

  if (targetPath && isDuplicateCopyName(targetPath)) {
    issues.push("目标文件名像重复副本");
  }

  if (!content.trim()) {
    issues.push("正文为空");
  }

  for (const rule of blockedContentRules) {
    if (rule.pattern.test(content)) {
      issues.push(rule.label);
    }
  }

  return [...new Set(issues)];
}

export function shouldIgnoreMarkdownFile(filePath) {
  return isDraftMarkdown(filePath);
}

export async function appendMarkdownWriteFailure(reportPath, entry) {
  const resolvedReportPath = path.resolve(reportPath);
  let existing = [];

  try {
    existing = JSON.parse(await fs.readFile(resolvedReportPath, "utf8"));
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  existing.push({
    time: new Date().toISOString(),
    ...entry,
  });

  await fs.mkdir(path.dirname(resolvedReportPath), { recursive: true });
  await fs.writeFile(resolvedReportPath, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
}

export async function writeMarkdownArticleWithGuard(targetPath, markdown, options = {}) {
  const finalPath = path.resolve(targetPath);
  const finalDir = path.dirname(finalPath);
  const finalName = path.basename(finalPath);
  const draftPath = path.join(finalDir, finalName.replace(/\.md$/i, ".draft.md"));
  const reportPath = options.reportPath ? path.resolve(options.reportPath) : null;

  const initialIssues = findMarkdownWriteIssues(markdown, { targetPath: finalPath });
  if (initialIssues.length) {
    if (reportPath) {
      await appendMarkdownWriteFailure(reportPath, {
        targetPath: finalPath,
        draftPath,
        issues: initialIssues,
        phase: "preflight",
        bytes: byteLength(markdown),
      });
    }
    throw new Error(`Markdown 写入被拦截：${initialIssues.join("、")}`);
  }

  try {
    await fs.access(finalPath);
    const issues = ["目标文件已存在"];
    if (reportPath) {
      await appendMarkdownWriteFailure(reportPath, {
        targetPath: finalPath,
        draftPath,
        issues,
        phase: "preflight",
        bytes: byteLength(markdown),
      });
    }
    throw new Error(`Markdown 写入被拦截：${issues.join("、")}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  try {
    await fs.access(draftPath);
    const issues = ["草稿文件已存在"];
    if (reportPath) {
      await appendMarkdownWriteFailure(reportPath, {
        targetPath: finalPath,
        draftPath,
        issues,
        phase: "preflight",
        bytes: byteLength(markdown),
      });
    }
    throw new Error(`Markdown 写入被拦截：${issues.join("、")}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  await fs.mkdir(finalDir, { recursive: true });
  await fs.writeFile(draftPath, markdown, "utf8");

  const draftMarkdown = await fs.readFile(draftPath, "utf8");
  const draftIssues = findMarkdownWriteIssues(draftMarkdown, { targetPath: finalPath });
  if (draftIssues.length) {
    if (reportPath) {
      await appendMarkdownWriteFailure(reportPath, {
        targetPath: finalPath,
        draftPath,
        issues: draftIssues,
        phase: "draft-check",
        bytes: byteLength(draftMarkdown),
      });
    }
    throw new Error(`Markdown 草稿未通过校验：${draftIssues.join("、")}`);
  }

  await fs.rename(draftPath, finalPath);

  return {
    path: finalPath,
    draftPath,
    bytes: byteLength(markdown),
  };
}
