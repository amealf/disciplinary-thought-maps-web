const NOTION_API_BASE = "https://api.notion.com/v1";
const DEFAULT_NOTION_VERSION = "2026-03-11";

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function safePathSegment(value) {
  return compact(value).replace(/[\\/]/g, " ").trim();
}

function richTextToMarkdown(items = []) {
  return items
    .map((item) => {
      let text = item?.plain_text ?? item?.text?.content ?? "";
      if (!text) return "";
      const annotations = item.annotations ?? {};
      if (annotations.code) text = `\`${text}\``;
      if (annotations.bold) text = `**${text}**`;
      if (annotations.italic) text = `*${text}*`;
      if (annotations.strikethrough) text = `~~${text}~~`;
      const href = item.href ?? item.text?.link?.url;
      return href ? `[${text}](${href})` : text;
    })
    .join("");
}

function getProperty(properties, names) {
  for (const name of names) {
    if (properties?.[name]) return properties[name];
  }
  return null;
}

function propertyText(property) {
  if (!property) return "";
  if (property.type === "title") return richTextToMarkdown(property.title);
  if (property.type === "rich_text") return richTextToMarkdown(property.rich_text);
  if (property.type === "select") return property.select?.name ?? "";
  if (property.type === "status") return property.status?.name ?? "";
  if (property.type === "multi_select") return property.multi_select?.map((item) => item.name).join(", ") ?? "";
  if (property.type === "url") return property.url ?? "";
  if (property.type === "number") return property.number == null ? "" : String(property.number);
  if (property.type === "checkbox") return property.checkbox ? "true" : "false";
  return "";
}

function pageTitle(page) {
  const titleProperty =
    getProperty(page.properties, ["Name", "Title", "标题", "名称"]) ??
    Object.values(page.properties ?? {}).find((property) => property.type === "title");
  return compact(propertyText(titleProperty)) || "Untitled Notion Page";
}

function splitPath(value) {
  return compact(value)
    .split(/[/>｜|]+|\s+\/\s+/)
    .map(safePathSegment)
    .filter(Boolean);
}

function getPageMeta(page, env) {
  const title = pageTitle(page);
  const subject =
    compact(propertyText(getProperty(page.properties, ["Discipline", "Subject", "学科", "主题"]))) ||
    compact(env.NOTION_DEFAULT_SUBJECT) ||
    "Notion";
  const pathText = propertyText(getProperty(page.properties, ["Path", "Folder", "目录", "路径"]));
  const folderParts = splitPath(pathText);
  const status = propertyText(getProperty(page.properties, ["Status", "状态"]));
  const visibility = propertyText(getProperty(page.properties, ["Visibility", "可见性", "发布"]));

  return {
    title,
    subjectTitle: subject,
    folderParts,
    status,
    visibility,
    sourceId: page.id,
    sourceUrl: page.url ?? "",
    updatedAt: page.last_edited_time ?? page.created_time ?? "",
  };
}

function shouldIncludePage(meta, env) {
  const allowedStatuses = compact(env.NOTION_INCLUDE_STATUSES);
  if (allowedStatuses) {
    const allowed = new Set(allowedStatuses.split(",").map(compact).filter(Boolean));
    if (!allowed.has(meta.status)) return false;
  }

  const allowedVisibility = compact(env.NOTION_INCLUDE_VISIBILITY);
  if (allowedVisibility) {
    const allowed = new Set(allowedVisibility.split(",").map(compact).filter(Boolean));
    if (!allowed.has(meta.visibility)) return false;
  }

  return true;
}

function notionFileUrl(file) {
  if (!file) return "";
  if (file.type === "external") return file.external?.url ?? "";
  if (file.type === "file") return file.file?.url ?? "";
  return "";
}

function blockMarkdownLine(block, childMarkdown, indent = "") {
  const type = block.type;
  const value = block[type] ?? {};
  const text = richTextToMarkdown(value.rich_text ?? value.caption ?? []);

  if (type === "paragraph") return text ? `${indent}${text}${childMarkdown}` : childMarkdown.trimStart();
  if (type === "heading_1") return `# ${text}${childMarkdown}`;
  if (type === "heading_2") return `## ${text}${childMarkdown}`;
  if (type === "heading_3") return `### ${text}${childMarkdown}`;
  if (type === "quote") return text ? `> ${text}${childMarkdown}` : childMarkdown.trimStart();
  if (type === "bulleted_list_item") return `${indent}- ${text}${childMarkdown}`;
  if (type === "numbered_list_item") return `${indent}1. ${text}${childMarkdown}`;
  if (type === "to_do") return `${indent}- [${value.checked ? "x" : " "}] ${text}${childMarkdown}`;
  if (type === "toggle") return `${indent}<details><summary>${text}</summary>\n${childMarkdown.trim()}\n</details>`;
  if (type === "code") return `\`\`\`${value.language ?? ""}\n${richTextToMarkdown(value.rich_text)}\n\`\`\``;
  if (type === "divider") return "---";
  if (type === "child_page") return `## ${value.title ?? "Child page"}`;
  if (type === "image" || type === "file" || type === "pdf" || type === "video" || type === "audio") {
    const url = notionFileUrl(value);
    return url ? `[${type}](${url})` : "";
  }
  if (type === "bookmark" || type === "embed" || type === "link_preview") {
    return value.url ? `[${value.url}](${value.url})` : "";
  }
  return text || childMarkdown.trim();
}

async function notionRequest(pathname, { env, method = "GET", body = null }) {
  const token = env.NOTION_TOKEN || env.NOTION_API_KEY;
  const response = await fetch(`${NOTION_API_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": env.NOTION_VERSION || DEFAULT_NOTION_VERSION,
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API ${response.status}: ${text.slice(0, 500)}`);
  }

  return response.json();
}

async function collectPaginated(fetchPage) {
  const results = [];
  let cursor = undefined;

  do {
    const page = await fetchPage(cursor);
    results.push(...(page.results ?? []));
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function queryDataSource(dataSourceId, env) {
  return collectPaginated((cursor) =>
    notionRequest(`/data_sources/${dataSourceId}/query`, {
      env,
      method: "POST",
      body: { page_size: 100, start_cursor: cursor },
    }),
  );
}

async function queryDatabase(databaseId, env) {
  return collectPaginated((cursor) =>
    notionRequest(`/databases/${databaseId}/query`, {
      env,
      method: "POST",
      body: { page_size: 100, start_cursor: cursor },
    }),
  );
}

async function retrievePage(pageId, env) {
  return notionRequest(`/pages/${pageId}`, { env });
}

async function retrieveChildren(blockId, env) {
  return collectPaginated((cursor) => {
    const params = new URLSearchParams({ page_size: "100" });
    if (cursor) params.set("start_cursor", cursor);
    return notionRequest(`/blocks/${blockId}/children?${params.toString()}`, { env });
  });
}

async function blockToMarkdown(block, env, depth = 0) {
  let childMarkdown = "";
  if (block.has_children) {
    const children = await retrieveChildren(block.id, env);
    const childLines = [];
    for (const child of children) {
      const markdown = await blockToMarkdown(child, env, depth + 1);
      if (markdown) childLines.push(markdown);
    }
    childMarkdown = childLines.length ? `\n${childLines.join("\n\n")}` : "";
  }

  return blockMarkdownLine(block, childMarkdown, "  ".repeat(Math.max(0, depth - 1))).trimEnd();
}

async function pageContentToMarkdown(page, env) {
  const blocks = await retrieveChildren(page.id, env);
  const lines = [];

  for (const block of blocks) {
    const markdown = await blockToMarkdown(block, env);
    if (markdown) lines.push(markdown);
  }

  return lines.join("\n\n").trim();
}

async function loadNotionPages(env) {
  const pages = [];

  if (env.NOTION_DATA_SOURCE_ID) {
    pages.push(...(await queryDataSource(env.NOTION_DATA_SOURCE_ID, env)));
  }

  if (env.NOTION_DATABASE_ID) {
    pages.push(...(await queryDatabase(env.NOTION_DATABASE_ID, env)));
  }

  if (env.NOTION_PAGE_IDS) {
    const pageIds = env.NOTION_PAGE_IDS.split(",").map(compact).filter(Boolean);
    for (const pageId of pageIds) {
      pages.push(await retrievePage(pageId, env));
    }
  }

  return pages;
}

export async function loadNotionArticles(env = process.env) {
  const token = env.NOTION_TOKEN || env.NOTION_API_KEY;
  if (!token) return [];
  if (!env.NOTION_DATA_SOURCE_ID && !env.NOTION_DATABASE_ID && !env.NOTION_PAGE_IDS) return [];

  const pages = await loadNotionPages(env);
  const articles = [];

  for (const page of pages) {
    const meta = getPageMeta(page, env);
    if (!shouldIncludePage(meta, env)) continue;

    const body = await pageContentToMarkdown(page, env);
    const content = `# ${meta.title}\n\n${body}`.trim();
    const pathParts = ["notion", safePathSegment(meta.subjectTitle), ...meta.folderParts, `${safePathSegment(meta.title)}.md`];

    articles.push({
      ...meta,
      sourceType: "notion",
      relativePath: pathParts.filter(Boolean).join("/"),
      rawName: `${safePathSegment(meta.title)}.md`,
      content,
    });
  }

  return articles;
}
