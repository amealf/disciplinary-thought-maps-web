const DATA_URL = "./data/site-data.json";
const app = document.querySelector("#app");
const DEFAULT_MAP_SCALE = 0.84 * 0.84 * 0.84 * 0.84 * 0.84 * 1.15 * 1.18 * 1.18 * 1.18 * 1.18 * 0.9 * 1.18 * 1.08;
const TABLET_MAP_SCALE = 0.82;
const MOBILE_MAP_SCALE = 0.66;
const HOME_RANDOM_TITLE_COUNT = 24;
const MIND_PRIMARY_MAX_CHARS = 30;
const THEME_STORAGE_KEY = "discipline-map-theme";
const LANGUAGE_STORAGE_KEY = "discipline-map-language";
const DEFAULT_THEME = { palette: "color", tone: "dark" };
const DEFAULT_LANGUAGE = "cn";
const ENTRY_SORTER = new Intl.Collator("zh-CN-u-co-pinyin", {
  ignorePunctuation: true,
  numeric: true,
  sensitivity: "base",
});

const UI_TEXT = {
  cn: {
    article: "文章",
    articles: "篇文章",
    articleNotExist: "请求的文章不存在。",
    articleNotFound: "文章不存在",
    availableGroups: "可用分组",
    availableSubjects: "可用科目",
    backTo: "返回",
    backToAllSubjects: "返回全部科目",
    branches: "个分支",
    close: "关闭",
    collapseBranches: "折叠分支",
    contentRepository: "内容仓库",
    darkTheme: "深色主题",
    directoryMap: "目录地图",
    directoryMapAria: "目录地图",
    directoryTopic: "目录主题",
    documentHomeTitle: "深入研究一切 - Seeking",
    entriesIntro: "Markdown 目录主题与学科地图。",
    existingSubjects: "现存科目",
    randomSubject: "随机学科",
    expandable: "可展开",
    expanded: "已展开",
    expandAll: "展开所有分支",
    fitScreen: "适应屏幕",
    folders: "个文件夹",
    fullIndex: "完整索引",
    headingLevel: "标题级别",
    home: "首页",
    homeHeroTitle: "深入研究一切",
    inspiration: "灵感",
    languageAria: "语言",
    lightTheme: "浅色主题",
    mapControls: "地图控制",
    mapPerspective: "地图视角",
    markdownIntro: "Markdown 目录主题与学科地图。",
    noMatchesInSubject: "当前科目中没有匹配结果",
    noMatchingResults: "没有匹配结果",
    notFound: "未找到",
    openSearch: "打开搜索",
    overview: "概览",
    paletteColorLabel: "彩色风格，点击切换为单色风格",
    palettePlainLabel: "单色风格，点击切换为彩色风格",
    read: "阅读",
    refreshInspiration: "刷新灵感",
    reset: "恢复",
    resetMapSize: "恢复地图大小",
    results: "个结果",
    revealNode: "定位节点",
    search: "探索",
    searchHeading: "探索",
    searchPlaceholder: "探索学科、概念、人物...",
    searchSubjects: "探索科目",
    searchThisSubject: "探索当前科目...",
    selectArticle: "选择一个文章节点后在这里阅读",
    switchTone: "切换深浅主题",
    themeAria: "主题",
    thisGroup: "这个分组",
    thisSubject: "这个科目",
    topicCount: "个主题",
    topics: "个主题",
    typeArticle: "文章",
    typeGroup: "分组",
    typeLevel1: "一级",
    typeLevel2: "二级",
    typeResult: "结果",
    typeSubject: "科目",
    unavailable: "不可用",
    websiteRepository: "网站仓库",
    zoomIn: "放大",
    zoomOut: "缩小",
  },
  en: {
    article: "Article",
    articles: "articles",
    articleNotExist: "The requested article does not exist.",
    articleNotFound: "Article not found",
    availableGroups: "Available groups",
    availableSubjects: "Available subjects",
    backTo: "Back to",
    backToAllSubjects: "Back to All Subjects",
    branches: "branches",
    close: "Close",
    collapseBranches: "Collapse branches",
    contentRepository: "Content Repository",
    darkTheme: "Dark theme",
    directoryMap: "Directory Map",
    directoryMapAria: "Directory map",
    directoryTopic: "Directory topic",
    documentHomeTitle: "Deep Research Everything - Seeking",
    entriesIntro: "Markdown directory topics and subject maps.",
    existingSubjects: "Existing Subjects",
    randomSubject: "Random Subject",
    expandable: "Expandable",
    expanded: "Expanded",
    expandAll: "Expand all branches",
    fitScreen: "FixScreen",
    folders: "folders",
    fullIndex: "Full Index",
    headingLevel: "Heading level",
    home: "Home",
    homeHeroTitle: "Deep research everything",
    inspiration: "Inspiration",
    languageAria: "Language",
    lightTheme: "Light theme",
    mapControls: "Map controls",
    mapPerspective: "Map perspective",
    markdownIntro: "Markdown directory topics and subject maps.",
    noMatchesInSubject: "No matches in this subject",
    noMatchingResults: "No matching results",
    notFound: "Not found",
    openSearch: "Open search",
    overview: "Overview",
    paletteColorLabel: "Colorful style; click to use plain color style",
    palettePlainLabel: "Plain color style; click to use colorful style",
    read: "Read",
    refreshInspiration: "Refresh Inspiration",
    reset: "Reset",
    resetMapSize: "Reset map size",
    results: "results",
    revealNode: "Reveal Node",
    search: "Explore",
    searchHeading: "Explore",
    searchPlaceholder: "Explore subjects, concepts, people...",
    searchSubjects: "Explore subjects",
    searchThisSubject: "Explore this subject...",
    selectArticle: "Select an article node to read it here",
    switchTone: "Switch light or dark",
    themeAria: "Theme",
    thisGroup: "This group",
    thisSubject: "This subject",
    topicCount: "topics",
    topics: "topics",
    typeArticle: "Article",
    typeGroup: "Group",
    typeLevel1: "Level 1",
    typeLevel2: "Level 2",
    typeResult: "Result",
    typeSubject: "Subject",
    unavailable: "Unavailable",
    websiteRepository: "Website Repository",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
  },
};

const state = {
  data: null,
  route: { name: "home", params: new URLSearchParams() },
  expanded: new Set(),
  activeNodeId: null,
  selectedArticleId: null,
  shouldCenterActiveNode: false, // 专门负责面包屑/外部跳转回地图时的镜头自动高光对焦
  shouldSnapCenterActiveNode: false,
  subjectQuery: "",
  subjectSearchOpen: false,
  mapTransform: { x: 0, y: 0, scale: getDefaultMapScale() },
  mapFitActive: false,
  mapFitResetTransform: null,
  mobileReaderOpen: true,
  positions: new Map(),
  currentSubjectId: null,
  graphSubjectId: null,
  graphAssignedColors: null,
  graphStartColor: null,
  graphStep: null,
  previousGraphVisibleIds: new Set(),
  subjectRootOffsets: new Map(),
  mindNodeBoxCache: new Map(),
  articleContentById: new Map(),
  articleContentLoading: new Set(),
  homeSearchIndex: -1,
  homeAnimation: null,
  theme: loadThemePreference(),
  language: loadLanguagePreference(),
};

applyTheme();

function getDefaultMapScale() {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
  if (viewportWidth <= 620) return MOBILE_MAP_SCALE;
  if (viewportWidth <= 980) return TABLET_MAP_SCALE;
  return DEFAULT_MAP_SCALE;
}

const typeLabels = {
  subject: "Subject",
  group: "Group",
  level1: "Level 1",
  level2: "Level 2",
  article: "Article",
};

const nodeColors = {
  subject: "#202124",
  level1: "#2f6fe4",
  level2: "#0c8f7b",
  article: "#ef6f5e",
};

const DISCIPLINE_CARD_COLORS = [
  "#dc75a1",
  "#d681a2",
  "#d985f2",
  "#6ee7f2",
  "#9fa1ff",
  "#ef5fe7",
  "#c9ef6a",
  "#7f9dff",
  "#d66b9a",
  "#b689ff",
  "#2be2b8",
  "#8bd3c7"
];

function getMorandiHsl(colorIndex) {
  // 12种完全对齐用户喜好的高级莫兰迪定制色相参数 (H, S, L) —— 整体亮度物理调高 10%
  const morandiConfig = [
    { h: 0, s: 40, l: 64 },    // 优雅红豆沙 (hsl(0, 40%, 64%))
    { h: 30, s: 65, l: 60 },   // 温暖泥土橘
    { h: 60, s: 48, l: 53 },   // 芥末黄 ( 调暗 5% )
    { h: 90, s: 35, l: 56 },   // 橄榄绿
    { h: 120, s: 30, l: 55 },  // 水墨绿
    { h: 150, s: 30, l: 55 },  // 青绿
    { h: 180, s: 42, l: 58 },  // 青瓷
    { h: 210, s: 57, l: 60 },  // 雾霾蓝
    { h: 240, s: 45, l: 62 },  // 靛蓝
    { h: 270, s: 33, l: 66 },  // 莫兰迪紫粉
    { h: 300, s: 36, l: 66 },  // 木槿紫
    { h: 330, s: 38, l: 65 }   // 莫兰迪冷粉
  ];
  return morandiConfig[colorIndex % morandiConfig.length];
}

function getExploreColorSpecs(colorIndex) {
  const hue = (colorIndex * 30) % 360;
  let s = 95;
  let l = 70;
  if (hue === 300) {
    s = 44;
    l = 60; // 调亮10% (原50%)
  } else if (hue === 150) {
    s = 44;
    l = 48; // 调亮10% (原38%)
  } else if (hue === 120) {
    s = 42;
    l = 46; // 调亮10% (原36%)
  } else if (hue === 180) {
    s = 42;
    l = 58;
  } else if (hue === 60) {
    s = 75;
    l = 40; // 调暗 5% (原 45%)
  } else if (hue === 90) {
    s = 70;
    l = 60; // 调暗 5% (原 65%)
  }
  return { hue, s, l };
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadThemePreference() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "{}");
    return {
      palette: saved.palette === "plain" ? "plain" : DEFAULT_THEME.palette,
      tone: saved.tone === "light" ? "light" : DEFAULT_THEME.tone,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

function saveThemePreference() {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state.theme));
  } catch {
    // Local storage may be unavailable in restricted browser modes.
  }
}

function loadLanguagePreference() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function saveLanguagePreference() {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  } catch {
    // Local storage may be unavailable in restricted browser modes.
  }
}

function t(key) {
  return UI_TEXT[state.language]?.[key] ?? UI_TEXT.cn[key] ?? key;
}

function formatCount(count, nounKey) {
  return state.language === "cn" ? `${count}${t(nounKey)}` : `${count} ${t(nounKey)}`;
}

function applyTheme() {
  document.body.dataset.palette = state.theme.palette;
  document.body.dataset.tone = state.theme.tone;
  document.body.dataset.language = state.language;
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
}

function renderToneThemeIcon(isLight) {
  if (isLight) {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2" />
        <path d="M12 19.3v2.2" />
        <path d="m4.9 4.9 1.6 1.6" />
        <path d="m17.5 17.5 1.6 1.6" />
        <path d="M2.5 12h2.2" />
        <path d="M19.3 12h2.2" />
        <path d="m4.9 19.1 1.6-1.6" />
        <path d="m17.5 6.5 1.6-1.6" />
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.2 14.7A7.6 7.6 0 0 1 9.3 3.8 8.5 8.5 0 1 0 20.2 14.7Z" />
    </svg>
  `;
}

function renderThemeControls() {
  const isPlain = state.theme.palette === "plain";
  const isLight = state.theme.tone === "light";
  const paletteLabel = isPlain ? t("palettePlainLabel") : t("paletteColorLabel");
  return `
    <div class="theme-actions" aria-label="${escapeHtml(t("themeAria"))}">
      <div class="language-toggle" role="group" aria-label="${escapeHtml(t("languageAria"))}">
        <button class="language-option ${state.language === "cn" ? "active" : ""}" type="button" data-action="set-language" data-language="cn" aria-pressed="${state.language === "cn"}">CN</button>
        <button class="language-option ${state.language === "en" ? "active" : ""}" type="button" data-action="set-language" data-language="en" aria-pressed="${state.language === "en"}">EN</button>
      </div>
      <button class="theme-toggle theme-toggle-icon" type="button" data-action="toggle-palette" aria-pressed="${isPlain}" title="${paletteLabel}" aria-label="${paletteLabel}">
        <span class="theme-swatch theme-swatch-palette" aria-hidden="true"></span>
      </button>
      <button class="theme-toggle theme-toggle-icon" type="button" data-action="toggle-tone" aria-pressed="${isLight}" title="${escapeHtml(t("switchTone"))}" aria-label="${escapeHtml(isLight ? t("lightTheme") : t("darkTheme"))}">
        <span class="theme-tone-icon" data-theme-tone-icon aria-hidden="true">${renderToneThemeIcon(isLight)}</span>
      </button>
    </div>
  `;
}

function updateThemeControls() {
  applyTheme();
  const isPlain = state.theme.palette === "plain";
  const isLight = state.theme.tone === "light";
  app.querySelectorAll("[data-action='toggle-palette']").forEach((button) => {
    const paletteLabel = isPlain ? t("palettePlainLabel") : t("paletteColorLabel");
    button.setAttribute("aria-pressed", String(isPlain));
    button.setAttribute("aria-label", paletteLabel);
    button.setAttribute("title", paletteLabel);
  });
  app.querySelectorAll("[data-action='toggle-tone']").forEach((button) => {
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", isLight ? t("lightTheme") : t("darkTheme"));
    button.setAttribute("title", t("switchTone"));
  });
  app.querySelectorAll("[data-theme-tone-icon]").forEach((icon) => {
    icon.innerHTML = renderToneThemeIcon(isLight);
  });
}

function bindThemeControls() {
  app.querySelectorAll("[data-action='toggle-palette']").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme.palette = state.theme.palette === "color" ? "plain" : "color";
      saveThemePreference();
      updateThemeControls();
    });
  });
  app.querySelectorAll("[data-action='toggle-tone']").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme.tone = state.theme.tone === "dark" ? "light" : "dark";
      saveThemePreference();
      updateThemeControls();
    });
  });
  app.querySelectorAll("[data-action='set-language']").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLanguage = button.getAttribute("data-language") === "en" ? "en" : "cn";
      if (state.language === nextLanguage) return;
      state.language = nextLanguage;
      saveLanguagePreference();
      state.subjectQuery = "";
      state.subjectSearchOpen = false;
      state.homeSearchIndex = -1;
      state.selectedArticleId = null;
      state.mindNodeBoxCache.clear();
      state.graphSubjectId = null;
      state.graphAssignedColors = null;
      state.previousGraphVisibleIds = new Set();
      render();
    });
  });
}

function normalizeText(value) {
  return String(value ?? "")
    .toLocaleLowerCase("zh-CN")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value, maxLength) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function cleanDisplayText(value) {
  return String(value ?? "")
    .replace(/<\/?(strong|em|b|i)>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasChineseText(value) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(cleanDisplayText(value));
}

function hasLatinText(value) {
  return /[A-Za-z]/.test(cleanDisplayText(value));
}

function isEnglishOnlyText(value) {
  const text = cleanDisplayText(value);
  return Boolean(text) && hasLatinText(text) && !hasChineseText(text);
}

function getEnglishDisplayText(value) {
  const text = cleanDisplayText(value);
  return isEnglishOnlyText(text) ? text : "";
}

function getLocalizedTitleText(value) {
  if (state.language === "en") return getEnglishDisplayText(value);
  return cleanDisplayText(value);
}

function getLocalizedPathText(value) {
  const text = cleanDisplayText(value);
  if (!text) return "";
  if (state.language === "en" && !isEnglishOnlyText(text)) return "";
  return text.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean).join(" —— ");
}

function getTitleLanguage(value) {
  const text = cleanDisplayText(value);
  if (hasChineseText(text)) return "cn";
  if (hasLatinText(text)) return "en";
  return null;
}

function matchesCurrentLanguageTitle(value) {
  return matchesCurrentLanguageItem(value);
}

function matchesCurrentLanguageItem(title, pathText = "") {
  const combined = cleanDisplayText([title, pathText].filter(Boolean).join(" "));
  if (!combined) return false;
  if (state.language === "en") return isEnglishOnlyText(combined);
  return hasChineseText(combined) || isEnglishOnlyText(combined);
}

function isConceptArticleNode(node) {
  if (!node || node.type !== "article") return false;
  const parent = node.parentId ? getNode(node.parentId) : null;
  return /重要概念 Key Concepts/.test(parent?.title || "");
}

function getConceptEnglishTitle(node) {
  const title = cleanDisplayText(node?.title || "");
  const shortTitle = cleanDisplayText(node?.shortTitle || "");
  if (!title || !shortTitle.startsWith(`${title} `)) return "";
  const rest = shortTitle.slice(title.length).trim();
  if (!rest || hasChineseText(rest) || !hasLatinText(rest)) return "";
  return rest;
}

function matchesCurrentLanguageTopic(topic) {
  if (!topic) return false;
  const pathText = getHomeTopicPath(topic.id).map((item) => item.title).join(" / ");
  return matchesCurrentLanguageItem(topic.title, pathText);
}

function getMindNodeDisplayTitle(node) {
  if (!node) return "";
  if (isConceptArticleNode(node)) {
    const primary = getLocalizedTitleText(node.title);
    const secondary = getConceptEnglishTitle(node);
    if (state.language === "en") return secondary || getEnglishDisplayText(node.shortTitle);
    return [primary, secondary].filter(Boolean).join(" ");
  }
  const rawTitle = node.type === "article" ? node.title || node.shortTitle : node.title;
  return getLocalizedTitleText(rawTitle);
}

function getVisibleChildIds(node) {
  if (!node?.childrenIds) return [];
  return node.childrenIds.filter((childId) => {
    const child = getNode(childId);
    if (!child) return false;
    return matchesCurrentLanguageItem(child.title || child.shortTitle, child.path);
  });
}

function getTypeLabel(type) {
  const keyByType = {
    subject: "typeSubject",
    group: "typeGroup",
    level1: "typeLevel1",
    level2: "typeLevel2",
    article: "typeArticle",
  };
  return t(keyByType[type] || "typeResult");
}

function getArticlePageContent(article) {
  const rawMarkdown = String(article?.content ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimStart();
  const title = cleanDisplayText(article?.title ?? t("articleNotFound"));
  const firstContentLine = rawMarkdown.split("\n").find((line) => line.trim());
  const markdown = firstContentLine && !/^#\s+.+$/.test(firstContentLine.trim())
    ? `# ${title}\n\n${rawMarkdown}`
    : rawMarkdown;

  return {
    title,
    markdown: markdown || (article ? `# ${title}` : ""),
  };
}

function getArticleTopbarNodes(article) {
  const node = getNode(article?.nodeId || article?.id);
  if (node) {
    return getNodePath(node.id);
  }

  return cleanDisplayText(article?.pathText ?? "")
    .split(/\s*\/\s*/)
    .slice(0, -1)
    .map((title, index) => ({
      id: `path-${index}`,
      title,
      type: index === 0 ? "subject" : "level",
      subjectId: article?.subjectId,
      href: null,
    }))
    .filter((item) => item.title);
}

function getArticleTopbarNodeHref(node) {
  if (!node?.subjectId) return "";
  if (node.type === "subject") return `#/subject/${encodeURIComponent(node.subjectId)}`;
  return `#/subject/${encodeURIComponent(node.subjectId)}?node=${encodeURIComponent(node.id)}`;
}

function getArticleTopbarTitle(nodes, article) {
  const title = nodes
    .map((node) => getLocalizedTitleText(node.title))
    .filter(Boolean)
    .join(" - ");
  return title || getLocalizedTitleText(article?.title) || t("articleNotFound");
}

function renderArticleTopbarPath(nodes) {
  if (!nodes.length) return `<span class="obsidian-topbar-title">${escapeHtml(t("articleNotFound"))}</span>`;
  return `
    <nav class="obsidian-topbar-path" aria-label="${escapeHtml(t("article"))}">
      ${nodes.map((node, index) => {
    const label = getLocalizedTitleText(node.title);
    if (!label) return "";
    const href = node.href ?? getArticleTopbarNodeHref(node);
    const content = `<span>${escapeHtml(label)}</span>`;
    const item = href
      ? `<a class="obsidian-topbar-node" href="${escapeHtml(href)}" title="${escapeHtml(label)}">${content}</a>`
      : `<span class="obsidian-topbar-node" title="${escapeHtml(label)}">${content}</span>`;
    return `${index ? `<span class="obsidian-topbar-separator" aria-hidden="true">-</span>` : ""}${item}`;
  }).join("")}
    </nav>
  `;
}

function pathForResult(result) {
  const target = result.articleId || result.nodeId || result.subjectId;
  if (result.type === "group") return `#/group/${encodeURIComponent(result.groupId)}`;
  if (result.type === "subject") return `#/subject/${result.subjectId}`;
  if (result.type === "article" && result.articleId) return `#/article/${encodeURIComponent(result.articleId)}`;
  return `#/subject/${result.subjectId}?node=${encodeURIComponent(target)}`;
}

function articleNodeHref(node) {
  if (node?.articleId) return `#/article/${encodeURIComponent(node.articleId)}`;
  return `#/subject/${node.subjectId}?node=${encodeURIComponent(node.id)}`;
}

function makeMarkedText(text, query) {
  const safe = escapeHtml(cleanDisplayText(text));
  const term = String(query ?? "").trim();
  if (!term) return safe;
  const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(pattern, "gi"), (match) => `<mark>${match}</mark>`);
}

function parseRoute() {
  const raw = window.location.hash.slice(1) || "/";
  const [pathname, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "subject" && parts[1]) {
    return { name: "subject", subjectId: decodeURIComponent(parts[1]), params };
  }
  if (parts[0] === "article" && parts[1]) {
    return { name: "article", articleId: decodeURIComponent(parts[1]), params };
  }
  if (parts[0] === "group" && parts[1]) {
    return { name: "group", groupId: decodeURIComponent(parts[1]), params };
  }
  if (parts[0] === "search") {
    return { name: "search", params };
  }
  if (parts[0] === "disciplines") {
    return { name: "disciplines", params };
  }
  if (parts[0] === "entries") {
    return { name: "disciplines", params };
  }
  if (parts[0] === "missing") {
    return { name: "missing", params };
  }
  return { name: "home", params };
}

function setRoute() {
  const previousRoute = state.route;
  state.route = parseRoute();
  if (state.route.name === "subject") {
    const subject = getSubject(state.route.subjectId);
    if (subject) {
      const nodeId = state.route.params.get("node");
      const shouldResetSubject =
        previousRoute.name !== "subject" ||
        previousRoute.subjectId !== state.route.subjectId ||
        (!nodeId && previousRoute.params?.get("node"));

      if (shouldResetSubject) {
        state.expanded = new Set([subject.rootNodeId]);
        state.activeNodeId = subject.rootNodeId;
        state.selectedArticleId = null;
        state.subjectQuery = "";
        state.subjectSearchOpen = false;
        state.mapTransform = { x: 0, y: 0, scale: getDefaultMapScale() };
        state.mapFitActive = false;
        state.mapFitResetTransform = null;
        state.currentSubjectId = subject.id;
        state.graphSubjectId = null;
        state.previousGraphVisibleIds = new Set();
      }

      if (nodeId) {
        revealNode(nodeId);
        state.shouldCenterActiveNode = true;
        state.shouldSnapCenterActiveNode = true;
      }
    }
  } else {
    state.graphSubjectId = null;
    state.previousGraphVisibleIds = new Set();
    state.subjectSearchOpen = false;
  }
  render();
}

async function loadData() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Data loading failed: ${response.status}`);
  state.data = await response.json();
  window.addEventListener("hashchange", setRoute);
  setRoute();
}

function getSubject(subjectId) {
  return state.data?.subjects.find((subject) => subject.id === subjectId) ?? null;
}

function getNode(nodeId) {
  return state.data?.nodesById[nodeId] ?? null;
}

function getArticle(articleId) {
  return state.data?.articlesById[articleId] ?? null;
}

function getArticleWithContent(article) {
  if (!article) return null;
  const loaded = state.articleContentById.get(article.id);
  return loaded ? { ...article, ...loaded } : article;
}

function loadArticleContent(article) {
  if (
    !article ||
    article.content ||
    !article.contentPath ||
    state.articleContentById.has(article.id) ||
    state.articleContentLoading.has(article.id)
  ) return;
  state.articleContentLoading.add(article.id);
  fetch(article.contentPath)
    .then((response) => {
      if (!response.ok) throw new Error(`Article loading failed: ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      state.articleContentById.set(article.id, payload);
      state.articleContentLoading.delete(article.id);
      render();
    })
    .catch(() => {
      state.articleContentLoading.delete(article.id);
    });
}

function getHomeTopics() {
  const nodes = state.data?.homeMap?.nodes ?? [];
  if (nodes.length) return nodes;
  return state.data.subjects.map((subject) => ({
    id: subject.id,
    title: subject.title,
    level: 1,
    parentId: null,
    subjectId: subject.id,
  }));
}

function getHomeTopic(topicId) {
  return getHomeTopics().find((topic) => topic.id === topicId) ?? null;
}

function getHomeTopicBySubjectId(subjectId) {
  if (!subjectId) return null;
  return getHomeTopics().find((topic) => topic.subjectId === subjectId) ?? null;
}

function getHomeChildren(topicId) {
  return getHomeTopics().filter((topic) => topic.parentId === topicId);
}

function getHomeTopicTargetHref(topic) {
  if (!topic) return "";
  if (topic.href) return topic.href;
  if (getHomeChildren(topic.id).length) return `#/group/${encodeURIComponent(topic.id)}`;
  if (topic.subjectId) return `#/subject/${topic.subjectId}`;
  return "";
}

function getHomeParent(topicId) {
  const topic = getHomeTopic(topicId);
  return topic?.parentId ? getHomeTopic(topic.parentId) : null;
}

function getHomeTopicPath(topicId) {
  const path = [];
  let cursor = getHomeTopic(topicId);
  while (cursor) {
    path.unshift(cursor);
    cursor = getHomeParent(cursor.id);
  }
  return path;
}

function getHomeTopicHref(topic) {
  const targetHref = getHomeTopicTargetHref(topic);
  if (targetHref) return targetHref;
  return `#/missing?q=${encodeURIComponent(topic.title)}`;
}

function getRandomSubjectHref() {
  const topics = getHomeTopics()
    .filter((topic) => matchesCurrentLanguageTopic(topic))
    .map((topic) => getHomeTopicTargetHref(topic))
    .filter(Boolean);
  if (topics.length) return topics[Math.floor(Math.random() * topics.length)];

  const subjects = (state.data?.subjects ?? [])
    .filter((subject) => matchesCurrentLanguageItem(subject.title, subject.path))
    .map((subject) => `#/subject/${subject.id}`);
  if (subjects.length) return subjects[Math.floor(Math.random() * subjects.length)];

  return "#/disciplines";
}

function getSubjectParentHomeTopic(subjectId) {
  const topic = getHomeTopicBySubjectId(subjectId);
  return topic?.parentId ? getHomeTopic(topic.parentId) : null;
}

function renderToolbarBackLink(topic) {
  if (!topic) return "";
  const label = `${t("backTo")} ${getLocalizedTitleText(topic.title) || t("thisGroup")}`;
  return `
    <a class="back-link icon-only" href="${escapeHtml(getHomeTopicHref(topic))}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
      <svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </a>
  `;
}

function renderToolbarBackToSubjectsLink() {
  return `
    <a class="back-link icon-only" href="#/disciplines" title="${escapeHtml(t("backToAllSubjects"))}" aria-label="${escapeHtml(t("backToAllSubjects"))}">
      <svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </a>
  `;
}

function renderToolbarHomeLink(href = "#/") {
  return `
    <a class="back-link icon-only" href="${escapeHtml(href)}" title="${escapeHtml(t("home"))}" aria-label="${escapeHtml(t("home"))}">
      <svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5.5 10.5V21h13V10.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    </a>
  `;
}

function getDirectoryNodeId(groupId, topicId) {
  return `directory-${groupId}-${topicId}`;
}

function buildDirectoryMapSubject(groupId) {
  const group = getHomeTopic(groupId);
  if (!group) return null;

  const subjectId = `directory-${groupId}`;
  const rootId = `directory-root-${groupId}`;
  const rootTitle = group.title;
  const createdIds = new Set();

  state.data.nodesById[rootId] = {
    id: rootId,
    type: "subject",
    subjectId,
    parentId: null,
    title: rootTitle,
    rawTitle: rootTitle,
    path: rootTitle,
    depth: 0,
    childrenIds: [],
    articleId: null,
    href: "#/disciplines",
  };
  createdIds.add(rootId);

  function addTopicNode(topic, parentId, depth, includeDescendants) {
    const nodeId = getDirectoryNodeId(groupId, topic.id);
    const children = includeDescendants ? getHomeChildren(topic.id) : [];
    const targetHref = getHomeTopicTargetHref(topic);
    state.data.nodesById[nodeId] = {
      id: nodeId,
      type: depth === 1 ? "level1" : "level2",
      subjectId,
      parentId,
      title: topic.title,
      rawTitle: topic.title,
      path: getHomeTopicPath(topic.id).map((item) => item.title).join("/"),
      depth,
      childrenIds: [],
      articleId: null,
      href: targetHref,
      disabled: !targetHref,
    };
    state.data.nodesById[parentId].childrenIds.push(nodeId);
    createdIds.add(nodeId);

    for (const child of children) {
      addTopicNode(child, nodeId, depth + 1, true);
    }

    return nodeId;
  }

  for (const child of getHomeChildren(group.id)) {
    addTopicNode(child, rootId, 1, true);
  }

  return {
    id: subjectId,
    title: group.title,
    path: group.title,
    rootNodeId: rootId,
    directoryNodeIds: [...createdIds],
    activeNodeId: rootId,
  };
}

function getRandomHomeTitleTopics(count = HOME_RANDOM_TITLE_COUNT) {
  const entries = state.data?.searchEntries ?? [];
  const unique = new Map();
  const shuffleItems = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  };

  for (const entry of entries) {
    if (entry.type !== "article") continue; // 只随机所有文档 (articles)
    const title = cleanDisplayText(entry.title);
    const key = normalizeText(title);
    if (!title || !key || unique.has(key) || !matchesCurrentLanguageItem(title, entry.pathText)) continue;

    const subject = getSubject(entry.subjectId);
    const subjectText = normalizeText(`${subject?.title ?? ""} ${subject?.path ?? ""} ${subject?.homeKey ?? ""}`);
    let categoryType = "philosophy";
    if (subjectText.includes("文学")) {
      categoryType = "literature";
    } else if (subjectText.includes("心理") || subjectText.includes("cpt")) {
      categoryType = "psychology";
    } else if (subjectText.includes("哲学") || subjectText.includes("伦理")) {
      categoryType = "philosophy";
    }

    unique.set(key, {
      id: `random-${entry.id}`,
      title,
      level: 2,
      parentId: null,
      subjectId: entry.subjectId,
      href: pathForResult(entry),
      type: entry.type,
      pathText: entry.pathText, // 保存文档所属各级文件夹名
      categoryType,
    });
  }

  const topics = [...unique.values()];
  const subjectBuckets = new Map();
  for (const topic of topics) {
    const fallbackSubject = cleanDisplayText(topic.pathText).split(/\s*\/\s*/)[0] || "unknown";
    const subjectKey = topic.subjectId || fallbackSubject;
    if (!subjectBuckets.has(subjectKey)) subjectBuckets.set(subjectKey, []);
    subjectBuckets.get(subjectKey).push(topic);
  }

  const groups = shuffleItems([...subjectBuckets.entries()].map(([key, items]) => ({
    key,
    items: shuffleItems(items),
  })));
  const selected = [];
  let lastGroupKey = "";

  while (selected.length < count && groups.some((group) => group.items.length)) {
    const activeGroups = shuffleItems(groups.filter((group) => group.items.length));
    if (activeGroups.length > 1 && activeGroups[0].key === lastGroupKey) {
      const alternateIndex = activeGroups.findIndex((group) => group.key !== lastGroupKey);
      [activeGroups[0], activeGroups[alternateIndex]] = [activeGroups[alternateIndex], activeGroups[0]];
    }

    for (const group of activeGroups) {
      const topic = group.items.shift();
      if (!topic) continue;
      selected.push(topic);
      lastGroupKey = group.key;
      if (selected.length >= count) break;
    }
  }

  return selected;
}

function findHomeTopicByQuery(query) {
  const term = normalizeText(query);
  if (!term) return null;
  return getHomeTopics().find((topic) => {
    if (!matchesCurrentLanguageTopic(topic)) return false;
    const title = normalizeText(topic.title);
    return title === term || title.includes(term) || term.includes(title);
  }) ?? null;
}

function getNodePath(nodeId) {
  const path = [];
  let cursor = getNode(nodeId);
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? getNode(cursor.parentId) : null;
  }
  return path;
}

function revealNode(nodeId) {
  const node = getNode(nodeId);
  if (!node) return;
  for (const item of getNodePath(nodeId)) {
    if (item.type !== "article") state.expanded.add(item.id);
  }
  state.activeNodeId = nodeId;
  if (node.type === "article") state.selectedArticleId = node.articleId;
}

function resetMapView() {
  state.mapTransform = { x: 0, y: 0, scale: getDefaultMapScale() };
  state.mapFitActive = false;
  state.mapFitResetTransform = null;
  if (state.route.name === "subject" && state.route.subjectId) {
    state.subjectRootOffsets.delete(state.route.subjectId);
    const subject = getSubject(state.route.subjectId);
    if (subject) {
      renderGraph(subject);
      return;
    }
  }
  applyMapTransform();
}

function searchData(query, options = {}) {
  const term = normalizeText(query);
  if (!term) return [];

  const results = [];
  for (const entry of state.data.searchEntries) {
    if (options.subjectId && entry.subjectId !== options.subjectId) continue;
    if (!matchesCurrentLanguageItem(entry.title, entry.pathText)) continue;
    const article = entry.articleId ? getArticle(entry.articleId) : null;
    const searchable = normalizeText([
      entry.title,
      entry.pathText,
      entry.excerpt,
      article?.content ?? "",
    ].join(" "));

    const title = normalizeText(entry.title);
    const pathText = normalizeText(entry.pathText);
    const contentIndex = searchable.indexOf(term);
    if (contentIndex === -1) continue;

    let score = 1;
    if (title.includes(term)) score += 12;
    if (pathText.includes(term)) score += 6;
    if (entry.type === "subject") score += 5;
    if (entry.type === "article") score += 2;

    results.push({
      ...entry,
      score,
      subjectTitle: getSubject(entry.subjectId)?.title ?? "",
      excerpt: entry.excerpt || article?.excerpt || "",
    });
  }

  return results
    .sort((left, right) => right.score - left.score || left.pathText.localeCompare(right.pathText, "zh-CN"))
    .slice(0, options.limit ?? 80);
}

function render() {
  if (!state.data) return;
  applyTheme();
  if (state.route.name !== "home") stopHomeAnimation();
  if (state.route.name === "subject") {
    renderSubjectPage(state.route.subjectId);
    return;
  }
  if (state.route.name === "article") {
    renderArticlePage(state.route.articleId);
    return;
  }
  if (state.route.name === "group") {
    renderHomeGroupPage(state.route.groupId);
    return;
  }
  if (state.route.name === "search") {
    renderSearchPage();
    return;
  }
  if (state.route.name === "disciplines") {
    renderAllDisciplinesPage();
    return;
  }
  if (state.route.name === "missing") {
    renderMissingPage();
    return;
  }
  renderHomePage();
}

function renderShell(content) {
  app.innerHTML = `
    <div class="app-shell">
      <header class="top-strip">
        <a class="brand" href="#/">
          <span class="brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; display: block;">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <span>Seeking</span>
        </a>
        <div class="top-strip-actions">
          ${renderThemeControls()}
        </div>
      </header>
      ${content}
    </div>
  `;

  bindGlobalHeader();
}

function bindGlobalHeader() {
  bindThemeControls();
}

function bindHomeActions() {
  const randomSubjectLink = app.querySelector('[data-action="random-subject"]');
  randomSubjectLink?.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.hash = getRandomSubjectHref();
  });
}

function renderHomeThemeBar(searchValue = "") {
  return `
    <header class="home-theme-bar">
      <a class="home-theme-brand" href="#/" aria-label="${escapeHtml(t("home"))}">
        <span class="home-theme-brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <span>Seeking</span>
      </a>
      ${renderThemeControls()}
    </header>
  `;
}

function renderHomePage() {
  const query = state.route.params.get("q") ?? "";
  stopHomeAnimation();
  document.title = "Seeking. Everything.";

  app.innerHTML = `
    <main class="learn-home">
      <!-- 高级背景发光圆（Glow Blobs）-->
      <div class="glow-container">
        <div class="glow-blob blob-1"></div>
        <div class="glow-blob blob-2"></div>
        <div class="glow-blob blob-3"></div>
      </div>
      ${renderHomeThemeBar(query)}
      
      <!-- 主体限宽居中容器，对齐 demo_redesign.html -->
      <div class="container">
        <section class="home-hero-section">
          <div class="home-hero-inner">
            <h1 class="home-hero-title">
              <span class="hero-title-main">Seeking.</span>
              <span class="hero-title-sub">Everything.</span>
            </h1>
            <p class="home-hero-subtitle">${state.language === "cn" ? "任何主题的" : "Gain "}<span class="subtitle-highlight">${state.language === "cn" ? "结构化知识" : "structured knowledge"}</span>${state.language === "cn" ? "" : " on any topic."}</p>
            <div class="home-hero-actions">
              <a class="home-random-subject-link" href="#/disciplines" data-action="random-subject"><span class="home-cta-label">${escapeHtml(t("randomSubject"))}</span></a>
              <a class="home-all-entries-link" href="#/disciplines"><span class="home-cta-label">${escapeHtml(t("existingSubjects"))}</span></a>
            </div>
          </div>
        </section>

        <section class="explore-panel">
          <div class="explore-header">
            <div class="explore-title-card">
              <h2 class="explore-title">${escapeHtml(t("inspiration"))}</h2>
            </div>
          </div>
          <div class="explore-tag-cloud-container">
            <div class="explore-tag-cloud" data-home-labels></div>
            <div class="explore-refresh-row">
              <button class="explore-refresh-bar-btn" data-action="refresh-home-titles" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                <span>${escapeHtml(t("refreshInspiration"))}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
      <footer class="home-footer" aria-label="Project links">
        <div class="home-footer-links">
          <a href="https://github.com/amealf/disciplinary-thought-maps-web" target="_blank" rel="noopener noreferrer">${escapeHtml(t("websiteRepository"))}</a>
          <a href="https://github.com/amealf/disciplinary-thought-maps-content" target="_blank" rel="noopener noreferrer">${escapeHtml(t("contentRepository"))}</a>
        </div>
        <div class="home-footer-credit">Designed by Yilimi</div>
      </footer>
    </main>
  `;

  bindGlobalHeader(query);
  bindHomeActions();
  state.homeAnimation = startHomeExplore();
}

function getTopicLocationText(topic, label) {
  const rawPath = cleanDisplayText(topic.pathText || "");
  if (!rawPath) return "";
  if (state.language === "en" && !matchesCurrentLanguageItem(label, rawPath)) return "";
  const parts = rawPath.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    const norm = normalizeText(rawPath) === normalizeText(label) ? "" : rawPath;
    return norm.replace(/\s*\/\s*/g, " —— ");
  }
  if (topic.type === "article") parts.pop();
  return parts.join(" —— ");
}

function startHomeExplore() {
  const tagContainer = app.querySelector("[data-home-labels]");
  const refreshButton = app.querySelector("[data-action='refresh-home-titles']");
  if (!tagContainer) return null;

  let stopped = false;

  function renderTags() {
    if (stopped) return;
    const topics = getRandomHomeTitleTopics(10);
    if (!topics.length) {
      tagContainer.innerHTML = `<div class="empty-state">${escapeHtml(t("noMatchingResults"))}</div>`;
      tagContainer.classList.remove("refreshing");
      return;
    }

    const totalColors = 12;
    const steps = [5, 7];
    const step = steps[Math.floor(Math.random() * steps.length)];
    let colorIndex = Math.floor(Math.random() * totalColors);

    const html = topics.map((topic, i) => {
      const href = topic.href || getHomeTopicHref(topic);

      const { hue, s, l } = getExploreColorSpecs(colorIndex);
      const glowColor = `hsl(${hue}, ${s}%, ${l}%)`;
      const bgGlowColor = `hsla(${hue}, ${s}%, ${l}%, 0.035)`;
      const borderGlowColor = `hsla(${hue}, ${s}%, ${l}%, 0.18)`;

      colorIndex = (colorIndex + step) % totalColors;

      const label = getLocalizedTitleText(topic.title);
      const locationText = getTopicLocationText(topic, label);
      const delay = i * 45;

      return `<a class="home-explore-tag" href="${escapeHtml(href)}" style="--tag-color:${glowColor};--tag-bg:${bgGlowColor};--tag-border:${borderGlowColor};--tag-delay:${delay}ms;--tag-hue:${hue}" data-path="${escapeHtml(locationText)}">
        <div class="tag-circle"></div>
        <div class="tag-content-wrap">
          <span class="tag-label">${escapeHtml(label)}</span>
          ${locationText ? `<span class="tag-sub-label">${escapeHtml(locationText)}</span>` : ""}
        </div>
      </a>`;
    }).join("");

    tagContainer.innerHTML = html;
    tagContainer.classList.remove("refreshing");
    void tagContainer.offsetWidth;
    tagContainer.classList.add("refreshing");
  }

  const refresh = () => {
    renderTags();
    requestAnimationFrame(() => {
      const panel = app.querySelector(".explore-panel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };
  refreshButton?.addEventListener("click", refresh);
  renderTags();

  return {
    stop() {
      stopped = true;
      refreshButton?.removeEventListener("click", refresh);
      tagContainer.innerHTML = "";
    },
  };
}

function renderHomeGroupPage(groupId) {
  const group = getHomeTopic(groupId);
  stopHomeAnimation();

  if (!group) {
    const availableGroups = getHomeTopics()
      .filter((topic) => getHomeChildren(topic.id).length)
      .filter((topic) => matchesCurrentLanguageTopic(topic))
      .map((topic) => escapeHtml(getLocalizedTitleText(topic.title)))
      .join(", ");
    app.innerHTML = `
      <main class="missing-page">
        <a class="missing-back" href="#/">← ${escapeHtml(t("home"))}</a>
        <section class="missing-card">
          <p>${escapeHtml(t("notFound"))}</p>
          <h1>${escapeHtml(groupId || t("thisGroup"))}</h1>
          <div>${escapeHtml(t("availableGroups"))}: ${availableGroups}</div>
        </section>
      </main>
    `;
    return;
  }

  if (!matchesCurrentLanguageTopic(group)) {
    app.innerHTML = `
      <div class="app-shell">
      ${renderHomeThemeBar()}
      <main class="missing-page">
        <a class="missing-back" href="#/disciplines">← ${escapeHtml(t("backToAllSubjects"))}</a>
        <section class="missing-card">
          <p>${escapeHtml(t("notFound"))}</p>
          <h1>${escapeHtml(t("thisGroup"))}</h1>
          <div>${escapeHtml(t("noMatchingResults"))}</div>
        </section>
      </main>
      </div>
    `;
    bindGlobalHeader();
    return;
  }

  if (!getHomeChildren(group.id).length) {
    window.location.hash = getHomeTopicHref(group);
    return;
  }

  const directorySubject = buildDirectoryMapSubject(group.id);
  if (!directorySubject) return;
  const parentTopic = getHomeParent(group.id);
  state.expanded = new Set(directorySubject.directoryNodeIds.filter((nodeId) => getNode(nodeId)?.childrenIds.length));
  state.activeNodeId = directorySubject.activeNodeId;
  state.selectedArticleId = null;
  state.mapTransform = { x: 0, y: 0, scale: getDefaultMapScale() };
  state.mapFitActive = false;
  state.mapFitResetTransform = null;

  app.innerHTML = `
    <div class="app-shell subject-page">
      <section class="subject-toolbar">
        <div class="subject-heading">
          ${parentTopic ? renderToolbarBackLink(parentTopic) : renderToolbarBackToSubjectsLink()}
          ${renderToolbarHomeLink("#/disciplines")}
        </div>
        <div class="subject-map-title">${escapeHtml(getLocalizedTitleText(group.title))}</div>
        <div class="toolbar-actions">
          <div class="segmented" aria-label="${escapeHtml(t("mapPerspective"))}">
            <button class="active" type="button">${escapeHtml(t("directoryMap"))}</button>
          </div>
          ${renderThemeControls()}
        </div>
      </section>
      <section class="map-layout reader-hidden">
        <div class="map-area">
          <div class="map-canvas" data-map-canvas>
            <svg class="graph-svg" data-graph role="img" aria-label="${escapeHtml(`${getLocalizedTitleText(group.title)} ${t("directoryMapAria")}`)}"></svg>
            <div class="node-layer" data-node-layer></div>
          </div>
          <div class="floating-map-controls" aria-label="${escapeHtml(t("mapControls"))}">
            <button class="map-icon-button" type="button" data-action="zoom-in" title="${escapeHtml(t("zoomIn"))}" aria-label="${escapeHtml(t("zoomIn"))}">＋</button>
            <button class="map-icon-button" type="button" data-action="zoom-out" title="${escapeHtml(t("zoomOut"))}" aria-label="${escapeHtml(t("zoomOut"))}">－</button>
            <button class="map-icon-button fit-screen-button" type="button" data-action="fit-screen" title="${escapeHtml(state.mapFitActive ? t("resetMapSize") : t("fitScreen"))}" aria-label="${escapeHtml(state.mapFitActive ? t("resetMapSize") : t("fitScreen"))}">${escapeHtml(state.mapFitActive ? t("reset") : t("fitScreen"))}</button>
          </div>
        </div>
      </section>
    </div>
  `;

  bindThemeControls();
  app.querySelectorAll("[data-action='zoom-in']").forEach((button) => {
    button.addEventListener("click", () => zoomBy(1.18));
  });
  app.querySelectorAll("[data-action='zoom-out']").forEach((button) => {
    button.addEventListener("click", () => zoomBy(0.84));
  });
  app.querySelector("[data-action='fit-screen']")?.addEventListener("click", () => fitMapToScreen(directorySubject));
  renderGraph(directorySubject);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (state.route.name === "group" && state.route.groupId === group.id) renderGraph(directorySubject);
    });
  });
  document.fonts?.ready?.then(() => {
    if (state.route.name === "group" && state.route.groupId === group.id) renderGraph(directorySubject);
  });
}

function bindHomeSearch() {
  const form = app.querySelector('[data-action="home-search"]');
  const input = form?.querySelector("input");
  const panel = app.querySelector("#home-suggestions");
  if (!form || !input || !panel) return;

  const submit = () => {
    const query = input.value.trim();
    const subject = findSubjectByQuery(query);
    if (subject) {
      window.location.hash = `#/subject/${subject.id}`;
      return;
    }
    const homeTopic = findHomeTopicByQuery(query);
    if (homeTopic && getHomeChildren(homeTopic.id).length) {
      window.location.hash = `#/group/${encodeURIComponent(homeTopic.id)}`;
      return;
    }
    if (query) window.location.hash = `#/missing?q=${encodeURIComponent(query)}`;
  };

  input.addEventListener("focus", () => updateHomeSuggestions(input.value));
  input.addEventListener("input", () => {
    state.homeSearchIndex = -1;
    updateHomeSuggestions(input.value);
  });
  input.addEventListener("keydown", (event) => {
    const items = [...panel.querySelectorAll("[data-home-result]")];
    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.homeSearchIndex = Math.min(items.length - 1, state.homeSearchIndex + 1);
      updateHomeActiveSuggestion(items);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.homeSearchIndex = Math.max(0, state.homeSearchIndex - 1);
      updateHomeActiveSuggestion(items);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = items[state.homeSearchIndex];
      if (active) {
        window.location.hash = active.getAttribute("data-href");
        return;
      }
      submit();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-result]");
    if (!button) return;
    window.location.hash = button.getAttribute("data-href");
  });

  requestAnimationFrame(() => {
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  });
}

function updateHomeSuggestions(query) {
  const input = app.querySelector('[data-action="home-search"] input');
  const panel = app.querySelector("#home-suggestions");
  if (!panel || !input) return;

  const trimmed = query.trim();
  if (!trimmed) {
    input.setAttribute("aria-expanded", "false");
    panel.innerHTML = "";
    return;
  }

  const results = searchSubjects(trimmed);

  input.setAttribute("aria-expanded", results.length ? "true" : "false");
  panel.innerHTML = results.map((result, index) => `
    <button
      class="home-suggestion ${index === state.homeSearchIndex ? "active" : ""}"
      type="button"
      role="option"
      data-home-result
      data-href="${escapeHtml(pathForResult(result))}"
    >
      <span>${makeMarkedText(getLocalizedTitleText(result.title), trimmed)}</span>
      <small>${makeMarkedText(getLocalizedPathText(result.pathText) || result.pathText, trimmed)}</small>
    </button>
  `).join("");
}

function findSubjectByQuery(query) {
  const term = normalizeText(query);
  if (!term) return null;
  return state.data.subjects.find((subject) => {
    if (!matchesCurrentLanguageItem(subject.title, subject.path)) return false;
    const title = normalizeText(subject.title);
    return title === term || title.includes(term) || term.includes(title);
  }) ?? null;
}

function searchSubjects(query) {
  const term = normalizeText(query);
  if (!term) return [];
  const subjectResults = state.data.subjects
    .filter((subject) => matchesCurrentLanguageItem(subject.title, subject.path))
    .map((subject) => {
      const title = normalizeText(subject.title);
      const score = title === term ? 10 : title.includes(term) || term.includes(title) ? 5 : 0;
      return {
        id: subject.id,
        type: "subject",
        title: subject.title,
        pathText: formatCount(subject.articleCount, "articles"),
        excerpt: score ? t("typeSubject") : t("notFound"),
        subjectId: subject.id,
        nodeId: subject.rootNodeId,
        score,
      };
    })
    .filter((item) => item.score > 0);
  const groupResults = getHomeTopics()
    .filter((topic) => getHomeChildren(topic.id).length)
    .filter((topic) => matchesCurrentLanguageTopic(topic))
    .map((topic) => {
      const title = normalizeText(topic.title);
      const score = title === term ? 9 : title.includes(term) || term.includes(title) ? 4 : 0;
      return {
        id: topic.id,
        type: "group",
        groupId: topic.id,
        title: topic.title,
        pathText: formatCount(getHomeChildren(topic.id).length, "topics"),
        excerpt: score ? t("typeGroup") : t("notFound"),
        score,
      };
    })
    .filter((item) => item.score > 0);

  return [...subjectResults, ...groupResults].sort((left, right) => right.score - left.score);
}

function renderMissingPage() {
  const query = state.route.params.get("q") ?? "";
  const availableSubjects = state.data.subjects
    .filter((subject) => matchesCurrentLanguageItem(subject.title, subject.path))
    .map((subject) => escapeHtml(getLocalizedTitleText(subject.title)))
    .join(", ");
  app.innerHTML = `
    <main class="missing-page">
      <a class="missing-back" href="#/">← ${escapeHtml(t("home"))}</a>
      <section class="missing-card">
        <p>${escapeHtml(t("notFound"))}</p>
        <h1>${escapeHtml(query || t("thisSubject"))}</h1>
        <div>${escapeHtml(t("availableSubjects"))}: ${availableSubjects}</div>
      </section>
    </main>
  `;
}

function stopHomeAnimation() {
  if (!state.homeAnimation) return;
  state.homeAnimation.stop();
  state.homeAnimation = null;
}

function startHomeCanvas(options = {}) {
  const home = app.querySelector(".learn-home");
  const labelLayer = app.querySelector("[data-home-labels]");
  const refreshButton = app.querySelector("[data-action='refresh-home-titles']");
  if (!home || !labelLayer) return null;

  const isRandomHome = !options.topics;
  const palette = [
    { text: "#e5c07b", bg: "rgba(229, 192, 123, 0.15)" },
    { text: "#e06c75", bg: "rgba(224, 108, 117, 0.15)" },
    { text: "#56b6c2", bg: "rgba(86, 182, 194, 0.15)" },
    { text: "#61afef", bg: "rgba(97, 175, 239, 0.15)" },
    { text: "#c678dd", bg: "rgba(198, 120, 221, 0.15)" },
  ];
  const slots = [
    { x: 12, y: 18 }, { x: 28, y: 14 }, { x: 44, y: 14 }, { x: 56, y: 14 },
    { x: 72, y: 14 }, { x: 88, y: 18 }, { x: 10, y: 34 }, { x: 91, y: 34 },
    { x: 7, y: 52 }, { x: 93, y: 52 }, { x: 13, y: 68 }, { x: 87, y: 68 },
    { x: 18, y: 82 }, { x: 28, y: 82 }, { x: 42, y: 88 }, { x: 58, y: 88 },
    { x: 72, y: 82 }, { x: 82, y: 82 }, { x: 18, y: 20 }, { x: 82, y: 20 },
    { x: 22, y: 48 }, { x: 78, y: 48 }, { x: 35, y: 72 }, { x: 65, y: 72 },
  ];
  let stopped = false;

  function getSlot(index) {
    if (slots[index]) return slots[index];
    const angle = index * 2.399;
    return {
      x: 50 + Math.cos(angle) * 42,
      y: 52 + Math.sin(angle) * 38,
    };
  }

  function createLabel(topic, index) {
    const href = getHomeTopicHref(topic);
    const link = document.createElement("a");
    const color = palette[index % palette.length];
    const slot = getSlot(index);
    const label = getLocalizedTitleText(topic.title);
    link.href = href;
    link.className = `home-canvas-label level-${topic.level ?? 2} type-${topic.type ?? "topic"}`;
    link.textContent = label;
    link.setAttribute("aria-label", `Open ${label}`);
    link.style.left = `${slot.x}%`;
    link.style.top = `${slot.y}%`;
    link.style.setProperty("--home-label-color", color.text);
    link.style.setProperty("--home-label-bg", color.bg);
    link.style.setProperty("--home-label-delay", `${Math.min(index * 28, 420)}ms`);
    return link;
  }

  function renderTopics() {
    if (stopped) return;
    const topics = isRandomHome ? getRandomHomeTitleTopics() : options.topics;
    labelLayer.replaceChildren(...topics.map(createLabel));
    labelLayer.classList.remove("refreshing");
    void labelLayer.offsetWidth;
    labelLayer.classList.add("refreshing");
  }

  const refreshTitles = () => renderTopics();
  refreshButton?.addEventListener("click", refreshTitles);
  renderTopics();

  return {
    stop() {
      stopped = true;
      refreshButton?.removeEventListener("click", refreshTitles);
      labelLayer.replaceChildren();
    },
  };
}

function updateHomeActiveSuggestion(items) {
  items.forEach((item, index) => {
    item.classList.toggle("active", index === state.homeSearchIndex);
  });
}

function renderSearchPage() {
  const query = state.route.params.get("q") ?? "";
  const results = searchData(query, { limit: 120 });
  renderShell(`
    <main class="page">
      <section class="result-section">
        ${renderResultSection(`${t("searchHeading")} "${query}"`, results, query)}
      </section>
    </main>
  `, query);
}

function getSelectedDisciplineLevel() {
  const rawLevel = state.route.params.get("level");
  if (rawLevel === "all") return "all";
  if (!rawLevel && state.language === "en") return "all";
  const level = Number(rawLevel ?? 1);
  return Number.isInteger(level) && level >= 1 && level <= 4 ? level : 1;
}

function getAllExistingDisciplines(level = 1) {
  const topics = getHomeTopics();
  if (topics.length) {
    return topics
      .filter((topic) => level === "all" || (topic.level ?? 1) === level)
      .filter((topic) => matchesCurrentLanguageTopic(topic))
      .map((topic) => {
        const subject = topic.subjectId ? getSubject(topic.subjectId) : null;
        const children = getHomeChildren(topic.id).filter((child) => matchesCurrentLanguageTopic(child));
        const pathText = getHomeTopicPath(topic.id).map((item) => item.title).join(" / ");
        return {
          id: topic.id,
          displayTitle: getLocalizedTitleText(topic.title),
          href: getHomeTopicHref(topic),
          path: getLocalizedPathText(pathText),
          articleCount: subject?.articleCount ?? 0,
          groupCount: subject?.groupCount ?? children.length,
          detailText: children.length
            ? formatCount(children.length, "topics")
            : subject
              ? `${formatCount(subject.groupCount, "folders")} · ${formatCount(subject.articleCount, "articles")}`
              : t("directoryTopic"),
        };
      })
      .filter((topic) => topic.displayTitle);
  }

  return (state.data?.subjects ?? [])
    .filter((subject) => matchesCurrentLanguageItem(subject.title, subject.path))
    .map((subject) => ({
      ...subject,
      displayTitle: getLocalizedTitleText(subject.title),
      href: `#/subject/${subject.id}`,
      detailText: `${formatCount(subject.groupCount, "folders")} · ${formatCount(subject.articleCount, "articles")}`,
    }))
    .filter((subject) => subject.displayTitle)
    .sort((left, right) => (
      ENTRY_SORTER.compare(left.displayTitle, right.displayTitle) ||
      ENTRY_SORTER.compare(left.path, right.path)
    ));
}

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function renderHeadingLevelFilter(selectedLevel) {
  return `
    <nav class="heading-level-filter" aria-label="${escapeHtml(t("headingLevel"))}">
      ${[1, 2, 3, 4].map((level) => `
        <a
          class="entry-stat heading-level-option ${level === selectedLevel ? "active" : ""}"
          href="#/disciplines?level=${level}"
          aria-current="${level === selectedLevel ? "true" : "false"}"
        >${state.language === "cn" ? `第 ${level} 级` : `Level ${level}`}</a>
      `).join("")}
    </nav>
  `;
}

function assignRandomDisciplineColors(items) {
  function getHueFromHex(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h;
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    return (h * 60) % 360;
  }

  function getHueDistance(c1, c2) {
    const h1 = getHueFromHex(c1);
    const h2 = getHueFromHex(c2);
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 360 - diff);
  }

  const assigned = [];
  return items.map((item, index) => {
    const neighbors = [];
    if (index > 0) neighbors.push(assigned[index - 1]);
    if (index >= 3) neighbors.push(assigned[index - 3]);

    let chosenColor = "";
    for (let threshold = 50; threshold >= 0; threshold -= 5) {
      const candidates = DISCIPLINE_CARD_COLORS.filter((color) => {
        return neighbors.every((neighborColor) => {
          return getHueDistance(color, neighborColor) >= threshold;
        });
      });

      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        chosenColor = candidates[randomIndex];
        break;
      }
    }

    if (!chosenColor) {
      chosenColor = DISCIPLINE_CARD_COLORS[Math.floor(Math.random() * DISCIPLINE_CARD_COLORS.length)];
    }

    assigned.push(chosenColor);
    return { ...item, accentColor: chosenColor };
  });
}

function renderAllDisciplinesPage() {
  const selectedLevel = getSelectedDisciplineLevel();
  const allTopicCount = getAllExistingDisciplines("all").length || getAllExistingDisciplines().length;
  const disciplineItems = getAllExistingDisciplines(selectedLevel);
  const displayedDisciplines = selectedLevel === "all" ? shuffleItems(disciplineItems) : disciplineItems;
  const disciplines = assignRandomDisciplineColors(displayedDisciplines);
  app.innerHTML = `
    <div class="app-shell">
      ${renderHomeThemeBar()}
      <main class="entries-page disciplines-page">
      <section class="entries-hero">
        <p class="entries-kicker">${escapeHtml(t("fullIndex"))}</p>
        <h1>${state.language === "cn" ? "全部已有主题" : "All Existing Topics"}</h1>
        <p class="entries-intro">${escapeHtml(t("entriesIntro"))}</p>
        <div class="discipline-hero-row">
          <div class="entries-stats">
            <a class="entry-stat entry-stat-total all-topics-option ${selectedLevel === "all" ? "active" : ""}" href="#/disciplines?level=all" aria-current="${selectedLevel === "all" ? "true" : "false"}">
              <span>${state.language === "cn" ? "全部主题" : "All Topics"}</span>
              <strong>${allTopicCount}</strong>
            </a>
            ${renderHeadingLevelFilter(selectedLevel)}
          </div>
          <div class="discipline-search" data-discipline-search>
            <button class="discipline-search-toggle" type="button" data-action="discipline-search-toggle" aria-expanded="false" aria-label="${escapeHtml(t("searchSubjects"))}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-4.2-4.2"></path>
              </svg>
            </button>
            <input data-discipline-search-input type="search" placeholder="${escapeHtml(t("searchSubjects"))}..." autocomplete="off" />
          </div>
        </div>
      </section>
      <section class="discipline-board" aria-label="${state.language === "cn" ? "全部已有主题" : "All existing topics"}">
        <div class="discipline-grid">
          ${disciplines.map((discipline) => `
            <a class="discipline-card" href="${escapeHtml(discipline.href)}" data-discipline-card data-title="${escapeHtml(discipline.displayTitle)}" style="--discipline-accent: ${escapeHtml(discipline.accentColor)}">
              <strong>${escapeHtml(discipline.displayTitle)}</strong>
              <small>${escapeHtml(discipline.detailText)}</small>
            </a>
          `).join("")}
        </div>
      </section>
    </main>
    </div>
  `;
  bindGlobalHeader();
  bindDisciplineSearch();
}

function bindDisciplineSearch() {
  const search = app.querySelector("[data-discipline-search]");
  const toggle = app.querySelector("[data-action='discipline-search-toggle']");
  const input = app.querySelector("[data-discipline-search-input]");
  const cards = [...app.querySelectorAll("[data-discipline-card]")];
  if (!search || !toggle || !input || !cards.length) return;

  const applyFilter = () => {
    const term = normalizeText(input.value);
    cards.forEach((card) => {
      const title = normalizeText(card.getAttribute("data-title"));
      card.hidden = Boolean(term) && !title.includes(term);
    });
  };

  const closeSearch = () => {
    search.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    input.value = "";
    applyFilter();
  };

  const openSearch = () => {
    search.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
  };

  toggle.addEventListener("click", () => {
    if (search.classList.contains("open")) {
      closeSearch();
      return;
    }
    openSearch();
  });

  input.addEventListener("input", applyFilter);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key !== "Enter") return;
    const firstVisible = cards.find((card) => !card.hidden);
    if (firstVisible) window.location.hash = firstVisible.getAttribute("href");
  });
}

function renderResultSection(title, results, query) {
  if (!query) return "";
  const content = results.length
    ? results.map((result) => `
      <a class="search-result" data-type="${escapeHtml(result.type)}" href="${pathForResult(result)}">
        <div class="result-title">
          <span class="type-badge">${escapeHtml(getTypeLabel(result.type))}</span>
          <span>${makeMarkedText(getLocalizedTitleText(result.title), query)}</span>
        </div>
        <div class="result-path">${makeMarkedText(getLocalizedPathText(result.pathText), query)}</div>
        <div class="result-excerpt">${makeMarkedText(truncateText(result.excerpt, 180), query)}</div>
      </a>
    `).join("")
    : `<div class="empty-state">${escapeHtml(t("noMatchingResults"))}</div>`;

  return `
    <section class="result-section">
      <div class="section-title">
        <h2>${escapeHtml(title)}</h2>
        <span class="pill">${formatCount(results.length, "results")}</span>
      </div>
      <div class="results-list">${content}</div>
    </section>
  `;
}

function renderSubjectPage(subjectId) {
  const subject = getSubject(subjectId);
  if (!subject) {
    app.innerHTML = `
      <main class="missing-page">
        <a class="missing-back" href="#/">← ${escapeHtml(t("home"))}</a>
        <section class="missing-card">
          <p>${escapeHtml(t("notFound"))}</p>
          <h1>${escapeHtml(subjectId || t("thisSubject"))}</h1>
          <div>${escapeHtml(t("noMatchingResults"))}</div>
        </section>
      </main>
    `;
    return;
  }

  if (!matchesCurrentLanguageItem(subject.title, subject.path)) {
    app.innerHTML = `
      <div class="app-shell">
      ${renderHomeThemeBar()}
      <main class="missing-page">
        <a class="missing-back" href="#/disciplines">← ${escapeHtml(t("backToAllSubjects"))}</a>
        <section class="missing-card">
          <p>${escapeHtml(t("notFound"))}</p>
          <h1>${escapeHtml(t("thisSubject"))}</h1>
          <div>${escapeHtml(t("noMatchingResults"))}</div>
        </section>
      </main>
      </div>
    `;
    bindGlobalHeader();
    return;
  }

  if (!state.expanded.has(subject.rootNodeId)) state.expanded.add(subject.rootNodeId);
  const selectedArticle = state.selectedArticleId ? getArticle(state.selectedArticleId) : null;
  const mapClass = selectedArticle ? "map-layout" : "map-layout reader-hidden";
  const searchOpen = state.subjectSearchOpen || Boolean(state.subjectQuery.trim());
  const parentTopic = getSubjectParentHomeTopic(subject.id);
  const backLink = parentTopic ? renderToolbarBackLink(parentTopic) : renderToolbarBackToSubjectsLink();

  app.innerHTML = `
    <div class="app-shell subject-page">
      <section class="subject-toolbar">
        <div class="subject-heading">
          ${backLink}
          ${renderToolbarHomeLink()}
        </div>
        <form class="subject-search ${searchOpen ? "open" : ""}" data-action="subject-search">
          <input name="q" value="${escapeHtml(state.subjectQuery)}" placeholder="${escapeHtml(t("searchThisSubject"))}" autocomplete="off" aria-label="${escapeHtml(t("searchThisSubject"))}" />
          <button class="search-submit" type="button" data-action="subject-search-toggle" title="${escapeHtml(t("search"))}" aria-label="${escapeHtml(searchOpen ? t("search") : t("openSearch"))}">⌕</button>
        </form>
        <div class="toolbar-actions">
          ${renderThemeControls()}
        </div>
      </section>
      <section class="${mapClass}">
        <div class="map-area">
          ${renderSubjectSearchResults(subject.id)}
          <div class="map-canvas" data-map-canvas>
            <svg class="graph-svg" data-graph role="img" aria-label="${escapeHtml(getLocalizedTitleText(subject.title) || t("thisSubject"))} interactive map"></svg>
            <div class="node-layer" data-node-layer></div>
          </div>
          <div class="floating-map-controls" aria-label="${escapeHtml(t("mapControls"))}">
            <button class="map-icon-button" type="button" data-action="expand-all" title="${escapeHtml(t("expandAll"))}" aria-label="${escapeHtml(t("expandAll"))}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3H3v6" />
                <path d="M15 3h6v6" />
                <path d="M3 3l7 7" />
                <path d="M21 3l-7 7" />
                <path d="M9 21H3v-6" />
                <path d="M15 21h6v-6" />
                <path d="M3 21l7-7" />
                <path d="M21 21l-7-7" />
              </svg>
            </button>
            <button class="map-icon-button" type="button" data-action="collapse" title="${escapeHtml(t("collapseBranches"))}" aria-label="${escapeHtml(t("collapseBranches"))}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 4H4v4" />
                <path d="M16 4h4v4" />
                <path d="M4 4l6 6" />
                <path d="M20 4l-6 6" />
                <path d="M8 20H4v-4" />
                <path d="M16 20h4v-4" />
                <path d="M4 20l6-6" />
                <path d="M20 20l-6-6" />
              </svg>
            </button>
            <button class="map-icon-button fit-screen-button" type="button" data-action="fit-screen" title="${escapeHtml(state.mapFitActive ? t("resetMapSize") : t("fitScreen"))}" aria-label="${escapeHtml(state.mapFitActive ? t("resetMapSize") : t("fitScreen"))}">${escapeHtml(state.mapFitActive ? t("reset") : t("fitScreen"))}</button>
            <button class="map-icon-button" type="button" data-action="zoom-in" title="${escapeHtml(t("zoomIn"))}" aria-label="${escapeHtml(t("zoomIn"))}">＋</button>
            <button class="map-icon-button" type="button" data-action="zoom-out" title="${escapeHtml(t("zoomOut"))}" aria-label="${escapeHtml(t("zoomOut"))}">－</button>
          </div>
          ${selectedArticle ? `<button class="mobile-reader-toggle" type="button" data-action="mobile-reader">${escapeHtml(t("read"))}</button>` : ""}
        </div>
        <aside class="reader-panel ${state.mobileReaderOpen ? "" : "mobile-hidden"}">
          ${renderReader(selectedArticle)}
        </aside>
      </section>
    </div>
  `;

  bindThemeControls();
  bindSubjectEvents(subject);
  renderGraph(subject);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (state.route.name === "subject" && state.route.subjectId === subject.id) renderGraph(subject);
    });
  });
  document.fonts?.ready?.then(() => {
    if (state.route.name === "subject" && state.route.subjectId === subject.id) renderGraph(subject);
  });
}

function renderBreadcrumb() {
  const target = state.activeNodeId || state.selectedArticleId;
  const nodes = target ? getNodePath(target) : [];
  if (!nodes.length) return "";
  return nodes
    .map((node) => {
      const label = getLocalizedTitleText(node.title);
      if (!label) return "";
      return `<span class="crumb" title="${escapeHtml(label)}">${escapeHtml(truncateText(label, 42))}</span>`;
    })
    .filter(Boolean)
    .join("");
}

function renderSubjectSearchResults(subjectId) {
  const query = state.subjectQuery.trim();
  if (!query) return "";
  const results = searchData(query, { subjectId, limit: 18 });
  if (!results.length) {
    return `<div class="floating-results"><div class="empty-state">${escapeHtml(t("noMatchesInSubject"))}</div></div>`;
  }
  return `
    <div class="floating-results">
      ${results.map((result) => `
        <button class="floating-result" type="button" data-node="${escapeHtml(result.nodeId)}">
          <strong>${makeMarkedText(getLocalizedTitleText(result.title), query)}</strong>
          <span>${makeMarkedText(getLocalizedPathText(result.pathText), query)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderReader(article) {
  if (!article) {
    return `<div class="reader-empty">${escapeHtml(t("selectArticle"))}</div>`;
  }
  loadArticleContent(article);
  const articleWithContent = getArticleWithContent(article);

  return `
    <div class="reader-content">
      <header class="reader-head">
        <div class="reader-actions">
          <button class="tool-button" type="button" data-action="reveal">${escapeHtml(t("revealNode"))}</button>
          <button class="tool-button" type="button" data-action="close-reader">${escapeHtml(t("close"))}</button>
        </div>
        <h2 class="reader-title">${escapeHtml(getLocalizedTitleText(article.title))}</h2>
        <div class="reader-path">${escapeHtml(getLocalizedPathText(article.pathText))}</div>
      </header>
      <article class="markdown-body">${renderMarkdown(articleWithContent?.content ?? "")}</article>
    </div>
  `;
}

function renderArticlePage(articleId) {
  const articleMeta = getArticle(articleId);
  if (articleMeta && !matchesCurrentLanguageItem(articleMeta.title, articleMeta.pathText || articleMeta.path)) {
    app.innerHTML = `
      <div class="app-shell">
      ${renderHomeThemeBar()}
      <main class="missing-page">
        <a class="missing-back" href="#/disciplines">← ${escapeHtml(t("backToAllSubjects"))}</a>
        <section class="missing-card">
          <p>${escapeHtml(t("notFound"))}</p>
          <h1>${escapeHtml(t("articleNotFound"))}</h1>
          <div>${escapeHtml(t("noMatchingResults"))}</div>
        </section>
      </main>
      </div>
    `;
    bindGlobalHeader();
    return;
  }
  loadArticleContent(articleMeta);
  const article = getArticleWithContent(articleMeta);
  const pageContent = getArticlePageContent(article);
  const topbarNodes = getArticleTopbarNodes(articleMeta);
  const topbarTitle = getArticleTopbarTitle(topbarNodes, articleMeta);
  document.title = `${topbarTitle} - Seeking`;

  app.innerHTML = `
    <main class="obsidian-page">
      <header class="obsidian-topbar">
        <a class="home-theme-brand" href="#/" aria-label="${escapeHtml(t("home"))}">
          <span class="home-theme-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </a>
        <div class="obsidian-topbar-actions">
          ${renderThemeControls()}
        </div>
      </header>
      <div class="obsidian-path-container">
        ${renderArticleTopbarPath(topbarNodes)}
      </div>
      <article class="obsidian-document obsidian-markdown">
        ${articleMeta ? renderArticleMarkdown(pageContent.markdown) : `<h1>${escapeHtml(t("articleNotFound"))}</h1><p>${escapeHtml(t("articleNotExist"))}</p>`}
      </article>
    </main>
  `;
  bindThemeControls();
}

function renderArticleMarkdown(markdown) {
  return renderMarkdown(markdown);
}

function bindSubjectEvents(subject) {
  const searchForm = app.querySelector('[data-action="subject-search"]');
  const searchInput = searchForm?.querySelector("input");
  const searchToggle = app.querySelector('[data-action="subject-search-toggle"]');
  const submitSubjectSearch = () => {
    state.subjectQuery = searchInput?.value ?? "";
    renderSubjectPage(subject.id);
  };
  const openSubjectSearch = () => {
    state.subjectSearchOpen = true;
    searchForm?.classList.add("open");
    requestAnimationFrame(() => {
      searchInput?.focus({ preventScroll: true });
      searchInput?.setSelectionRange(searchInput.value.length, searchInput.value.length);
    });
  };
  searchToggle?.addEventListener("click", () => {
    if (!state.subjectSearchOpen) {
      openSubjectSearch();
      return;
    }
    if (!searchInput?.value.trim()) {
      state.subjectSearchOpen = false;
      searchForm?.classList.remove("open");
      searchInput?.blur();
      return;
    }
    submitSubjectSearch();
  });
  searchInput?.addEventListener("input", () => {
    state.subjectSearchOpen = true;
    state.subjectQuery = searchInput.value;
    renderSubjectPage(subject.id);
  });
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitSubjectSearch();
  });
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !searchInput.value.trim()) {
      state.subjectSearchOpen = false;
      searchForm?.classList.remove("open");
      searchInput.blur();
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitSubjectSearch();
  });
  if (state.subjectSearchOpen) {
    requestAnimationFrame(() => {
      searchInput?.focus({ preventScroll: true });
      searchInput?.setSelectionRange(searchInput.value.length, searchInput.value.length);
    });
  }

  app.querySelectorAll("[data-action='zoom-in']").forEach((button) => {
    button.addEventListener("click", () => zoomBy(1.18));
  });
  app.querySelectorAll("[data-action='zoom-out']").forEach((button) => {
    button.addEventListener("click", () => zoomBy(0.84));
  });
  app.querySelector("[data-action='fit-screen']")?.addEventListener("click", () => fitMapToScreen(subject));
  app.querySelector("[data-action='expand-all']")?.addEventListener("click", () => {
    for (const node of Object.values(state.data.nodesById)) {
      if (node.subjectId === subject.id && node.type !== "article" && node.childrenIds.length) {
        state.expanded.add(node.id);
      }
    }
    state.activeNodeId = subject.rootNodeId;
    state.selectedArticleId = null;
    renderSubjectPage(subject.id);
  });
  app.querySelector("[data-action='collapse']")?.addEventListener("click", () => {
    state.expanded = new Set([subject.rootNodeId]);
    state.activeNodeId = subject.rootNodeId;
    state.selectedArticleId = null;
    renderSubjectPage(subject.id);
  });
  app.querySelector("[data-action='close-reader']")?.addEventListener("click", () => {
    state.selectedArticleId = null;
    renderSubjectPage(subject.id);
  });
  app.querySelector("[data-action='reveal']")?.addEventListener("click", () => {
    if (state.selectedArticleId) {
      revealNode(state.selectedArticleId);
      state.shouldCenterActiveNode = true;
      state.shouldSnapCenterActiveNode = true;
    }
    renderSubjectPage(subject.id);
  });
  app.querySelector("[data-action='mobile-reader']")?.addEventListener("click", () => {
    state.mobileReaderOpen = !state.mobileReaderOpen;
    renderSubjectPage(subject.id);
  });
  app.querySelectorAll(".floating-result").forEach((button) => {
    button.addEventListener("click", () => {
      const nodeId = button.getAttribute("data-node");
      if (!nodeId) return;
      state.subjectQuery = "";
      revealNode(nodeId);
      renderSubjectPage(subject.id);
    });
  });
}

function getVisibleNodeIds(rootId) {
  const visible = [];
  function visit(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    visible.push(nodeId);
    if (!state.expanded.has(nodeId)) return;
    for (const childId of getVisibleChildIds(node)) visit(childId);
  }
  visit(rootId);
  return visible;
}

const mindMapColors = [
  "#67c5a9",
  "#cf7892",
  "#bd6b87",
  "#c684d4",
  "#6ecfd0",
  "#8f8bd2",
  "#d45bc8",
  "#b7d97b",
  "#6f83d5",
  "#bd6a98",
  "#9c79c9",
  "#d0c965",
  "#9fc875",
  "#9b98dc",
];

function cleanMapTitle(value) {
  return cleanDisplayText(value)
    .replace(/^\d+(?:[_\.]\d+)*(?:\s+|$)/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitMapTitle(value) {
  const title = cleanMapTitle(value);
  const match = title.match(/^(.+?)\s+([A-Za-z][\s\S]*)$/);
  if (!match) return { primary: title, secondary: "" };
  return { primary: match[1].trim(), secondary: match[2].trim() };
}

function getMindPrimaryMaxLength(node) {
  return MIND_PRIMARY_MAX_CHARS;
}

function getMindTextLines(value, maxLength) {
  const text = String(value ?? "").trim();
  if (!text) return [""];
  const lines = [];
  for (let index = 0; index < text.length; index += maxLength) {
    lines.push(text.slice(index, index + maxLength));
  }
  return lines;
}

function countMindPrimaryLines(value, maxLength) {
  return getMindTextLines(value, maxLength).length;
}

function getTextVisualUnits(value) {
  const text = String(value ?? "");
  let units = 0;
  for (const char of text) {
    if (/\s/.test(char)) {
      units += 0.35;
    } else if (/[\u3400-\u9fff\uf900-\ufaff]/.test(char)) {
      units += 1.05;
    } else if (/[A-Za-z0-9]/.test(char)) {
      units += 0.62;
    } else {
      units += 0.52;
    }
  }
  return units;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function estimateTextWidth(lines, fontSize, horizontalPadding) {
  const maxUnits = Math.max(...lines.map(getTextVisualUnits), 1);
  return Math.ceil(maxUnits * fontSize + horizontalPadding);
}

function renderMindPrimaryText(value, maxLength = 14) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return escapeHtml(text);
  return getMindTextLines(text, maxLength)
    .map((line) => `<span class="mind-primary-line">${escapeHtml(line)}</span>`)
    .join("");
}

function splitArticleMapTitle(value) {
  const title = cleanMapTitle(value);
  const separatorIndex = Math.max(title.lastIndexOf("："), title.lastIndexOf(":"));
  const baseTitle = separatorIndex >= 0 ? title.slice(0, separatorIndex).trim() : title;
  const note = separatorIndex >= 0 ? title.slice(separatorIndex + 1).trim() : "";
  const bracketMatch = baseTitle.match(/^(.+?)(?:\s*[（(]\s*([A-Za-z][^）)]*)\s*[）)])$/);
  if (bracketMatch) {
    return {
      primary: bracketMatch[1].trim(),
      english: bracketMatch[2].trim(),
      note,
    };
  }

  const compactBase = baseTitle.replace(/\s+/g, " ").trim();
  for (let index = 0; index < compactBase.length; index += 1) {
    if (compactBase[index] !== " ") continue;
    const primary = compactBase.slice(0, index).trim();
    const english = compactBase.slice(index + 1).trim();
    if (!/[\u3400-\u9fff\uf900-\ufaff]/.test(primary)) continue;
    if (!/^[A-Za-z]/.test(english)) continue;
    if (/[\u3400-\u9fff\uf900-\ufaff]/.test(english)) continue;
    if (!/[A-Za-z]{2,}/.test(english)) continue;
    return { primary, english, note };
  }

  return { primary: baseTitle, english: "", note };
}

function getArticleMindTitle(value) {
  const title = splitArticleMapTitle(value);
  return {
    ...title,
    primary: title.note ? `${title.primary}：${title.note}` : title.primary,
    note: "",
  };
}

function calculateMindNodeBox(node) {
  if (node.type === "subject") {
    const titleText = getMindNodeDisplayTitle(node);
    const textWidth = estimateTextWidth([titleText], 36, 56);
    return {
      width: clampNumber(textWidth + 44, 250, 600),
      height: 88,
    };
  }
  if (node.type === "level1" || node.type === "level2") {
    const title = splitMapTitle(getMindNodeDisplayTitle(node));
    const maxLength = getMindPrimaryMaxLength(node);
    const primaryLines = getMindTextLines(title.primary, maxLength);
    const secondaryLines = title.secondary ? getMindTextLines(title.secondary, node.type === "level1" ? 52 : 38) : [];
    const primaryFontSize = node.type === "level1" ? 20 : 17;
    const secondaryFontSize = node.type === "level1" ? 12 : 10.5;
    const labelWidth = Math.max(
      estimateTextWidth(primaryLines, primaryFontSize, 34),
      secondaryLines.length ? estimateTextWidth(secondaryLines, secondaryFontSize, 34) : 0,
    );
    const baseHeight = 20 + primaryLines.length * (node.type === "level1" ? 24 : 20) + secondaryLines.length * (node.type === "level1" ? 16 : 13);
    return {
      width: clampNumber(labelWidth + 44, node.type === "level1" ? 220 : 180, node.type === "level1" ? 560 : 430),
      height: Math.max(node.type === "level1" ? 72 : 56, baseHeight),
    };
  }
  const title = getArticleMindTitle(getMindNodeDisplayTitle(node));
  const primaryLines = getMindTextLines(title.primary, MIND_PRIMARY_MAX_CHARS);
  const englishLines = title.english ? getMindTextLines(title.english, 44) : [];
  const noteLines = title.note ? getMindTextLines(title.note, MIND_PRIMARY_MAX_CHARS) : [];
  const articleLineGaps = Math.max(0, primaryLines.length + englishLines.length + noteLines.length - 1) * 2;
  const labelWidth = Math.max(
    estimateTextWidth(primaryLines, 16, 34),
    englishLines.length ? estimateTextWidth(englishLines, 14, 34) : 0,
    noteLines.length ? estimateTextWidth(noteLines, 13, 34) : 0,
  );
  return {
    width: clampNumber(labelWidth + 38, 220, 560),
    height: Math.max(48, 12 + primaryLines.length * 18 + englishLines.length * 16 + noteLines.length * 15 + articleLineGaps),
  };
}

function getMindNodeBox(node) {
  if (!node) return { width: 0, height: 0 };
  const cacheKey = `${state.language}:${node.id || `${node.type}:${node.title}:${node.shortTitle}`}`;
  const cached = state.mindNodeBoxCache.get(cacheKey);
  if (cached) return cached;
  const box = calculateMindNodeBox(node);
  state.mindNodeBoxCache.set(cacheKey, box);
  return box;
}

function getAllNodeIdsInTree(rootId) {
  const allIds = [];
  function visit(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    allIds.push(nodeId);
    for (const childId of node.childrenIds) {
      visit(childId);
    }
  }
  visit(rootId);
  return allIds;
}

function getMindNodeColor(node, assignedColors) {
  if (node.disabled) return "#6d7480";
  if (node.type === "subject") return "#bfd76a";
  return assignedColors?.get(node.id) || "hsl(0, 95%, 70%)";
}

function getSubjectRootOffset(subjectId) {
  return state.subjectRootOffsets.get(subjectId) ?? { x: 0, y: 0 };
}

function layoutGraph(subject) {
  const visibleIds = getVisibleNodeIds(subject.rootNodeId);
  const visible = new Set(visibleIds);
  const positions = new Map();
  const subtreeHeights = new Map();
  const rootNode = getNode(subject.rootNodeId);
  const rootBox = rootNode ? getMindNodeBox(rootNode) : { width: 0, height: 0 };
  const rowGap = 24;
  const rootRowGap = 11;
  const columnGap = 440;
  const rootX = 190;
  const firstColumnDotX = rootX + rootBox.width / 2 + 64;
  const top = 44;
  const margin = { right: 220, bottom: 120 };
  const rootOffset = { x: 0, y: 0 };

  function getSiblingGap(node) {
    return node?.type === "subject" ? rootRowGap : rowGap;
  }

  function measure(nodeId) {
    const node = getNode(nodeId);
    if (!node || !visible.has(nodeId)) return 0;

    const box = getMindNodeBox(node);
    const children = state.expanded.has(nodeId)
      ? node.childrenIds.filter((childId) => visible.has(childId))
      : [];
    const siblingGap = getSiblingGap(node);
    const childrenHeight = children.reduce((sum, childId, index) => {
      return sum + measure(childId) + (index > 0 ? siblingGap : 0);
    }, 0);
    const height = Math.max(box.height, childrenHeight);
    subtreeHeights.set(nodeId, height);
    return height;
  }

  function placeBranch(nodeId, branchTop, parentRightX) {
    const node = getNode(nodeId);
    if (!node || !visible.has(nodeId) || nodeId === subject.rootNodeId) return;

    const box = getMindNodeBox(node);
    const subtreeHeight = subtreeHeights.get(nodeId) || box.height;
    const depth = Math.max(1, node.depth || 1);
    const dotCenterOffset = node.type === "subject" ? 0 : 15;

    // 一级目录距离主核心 64px 间距，其它目录级别距离父卡片右边缘固定为 180px 黄金对称留白，完美对齐图二
    const isParentRoot = (node.parentId === subject.rootNodeId);
    const gap = isParentRoot ? 64 : 180;
    const x = parentRightX + gap + box.width / 2 - dotCenterOffset;
    const y = branchTop + subtreeHeight / 2;

    positions.set(nodeId, {
      x,
      y,
      width: box.width,
      height: box.height,
      depth,
    });

    if (!state.expanded.has(nodeId)) return;

    const children = node.childrenIds.filter((childId) => visible.has(childId));
    if (!children.length) return;

    const siblingGap = getSiblingGap(node);
    const childrenHeight = children.reduce((sum, childId, index) => {
      return sum + (subtreeHeights.get(childId) || 0) + (index > 0 ? siblingGap : 0);
    }, 0);
    let childTop = branchTop + (subtreeHeight - childrenHeight) / 2;

    const currentRightX = x + box.width / 2;

    for (const childId of children) {
      const childHeight = subtreeHeights.get(childId) || getMindNodeBox(getNode(childId)).height;
      placeBranch(childId, childTop, currentRightX);
      childTop += childHeight + siblingGap;
    }
  }

  measure(subject.rootNodeId);

  if (rootNode && visible.has(subject.rootNodeId)) {
    const rootChildren = rootNode.childrenIds.filter((childId) => visible.has(childId));
    const rootChildrenBaseHeight = rootChildren.reduce((sum, childId, index) => {
      const childNode = getNode(childId);
      return sum + (childNode ? getMindNodeBox(childNode).height : 0) + (index > 0 ? rootRowGap : 0);
    }, 0);
    const rootY = top + Math.max(rootBox.height, rootChildrenBaseHeight) / 2;
    positions.set(subject.rootNodeId, {
      x: rootX + rootOffset.x,
      y: rootY + rootOffset.y,
      width: rootBox.width,
      height: rootBox.height,
      depth: 0,
    });

    if (state.expanded.has(subject.rootNodeId)) {
      let childTop = top;
      const rootRightX = rootX + rootOffset.x + rootBox.width / 2;

      for (const childId of rootChildren) {
        const childHeight = subtreeHeights.get(childId) || getMindNodeBox(getNode(childId)).height;
        placeBranch(childId, childTop, rootRightX);
        childTop += childHeight + rootRowGap;
      }
    }
  }

  const maxDepth = [...positions.values()].reduce((max, position) => Math.max(max, position.depth), 0);
  const maxX = [...positions.values()].reduce((max, position) => {
    return Math.max(max, position.x + position.width / 2);
  }, 0);
  const maxY = [...positions.values()].reduce((max, position) => {
    return Math.max(max, position.y + position.height / 2);
  }, 0);
  const graphSize = {
    width: Math.max(100, maxX + margin.right),
    height: Math.max(100, maxY + margin.bottom),
  };

  state.positions = positions;
  return { visible: visibleIds, positions, graphSize };
}

let isRenderPending = false;
let renderSubjectPending = null;
let renderFrameId = null;
let isGraphResizeListenerBound = false;

function renderGraph(subject) {
  renderSubjectPending = subject;
  if (isRenderPending) return;
  isRenderPending = true;
  renderFrameId = window.requestAnimationFrame(() => {
    isRenderPending = false;
    renderFrameId = null;
    if (renderSubjectPending) {
      const currentRoute = state.route;
      const isStillInSubject = (currentRoute.name === "subject" && currentRoute.subjectId === renderSubjectPending.id);
      const isStillInGroup = (currentRoute.name === "group" && `directory-${currentRoute.groupId}` === renderSubjectPending.id);
      if (isStillInSubject || isStillInGroup) {
        doRenderGraph(renderSubjectPending);
      }
    }
  });
}

function doRenderGraph(subject) {
  const svg = app.querySelector("[data-graph]");
  const nodeLayer = app.querySelector("[data-node-layer]");
  const canvas = app.querySelector("[data-map-canvas]");
  if (!svg || !nodeLayer || !canvas) return;
  const previousPositions = state.positions;
  if (state.graphSubjectId !== subject.id) {
    state.graphSubjectId = subject.id;
    state.previousGraphVisibleIds = new Set();

    const assignedColors = new Map();

    // 高级兄弟节点防撞色递归分配算法，完美解决局部撞色
    function colorNodeBranch(nodeId, parentColorIndex = null) {
      const node = getNode(nodeId);
      if (!node) return;

      // 1. 各级标题（目录文件夹节点）的独立防撞色颜色池
      const folderChildren = node.childrenIds.filter((childId) => {
        const child = getNode(childId);
        return child && child.type !== "subject" && child.type !== "article";
      });

      if (folderChildren.length > 0) {
        const availableColors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

        // 避开直接父节点的颜色
        if (parentColorIndex !== null) {
          const parentIdx = availableColors.indexOf(parentColorIndex);
          if (parentIdx !== -1) {
            availableColors.splice(parentIdx, 1);
          }
        }

        // 彻底打乱洗牌
        for (let i = availableColors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
        }

        // 依次给这批文件夹子分支分配互不重复的颜色
        folderChildren.forEach((childId, idx) => {
          const colorIndex = availableColors[idx % availableColors.length];
          const { hue, s, l } = getExploreColorSpecs(colorIndex);
          assignedColors.set(childId, `hsl(${hue}, ${s}%, ${l}%)`);

          // 递归为下层子树上色，并传入自身颜色作为参考
          colorNodeBranch(childId, colorIndex);
        });
      }

      // 2. 文本（文章节点）的独立颜色池，采用可以重复、且同样使用随机洗牌算法的 12 种原始彩色
      const articleChildren = node.childrenIds.filter((childId) => {
        const child = getNode(childId);
        return child && child.type === "article";
      });

      if (articleChildren.length > 0) {
        const articleColors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

        // 独立打乱洗牌，让文章也获得完美的随机彩色手感
        for (let i = articleColors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [articleColors[i], articleColors[j]] = [articleColors[j], articleColors[i]];
        }

        articleChildren.forEach((childId, idx) => {
          const colorIndex = articleColors[idx % articleColors.length];
          const { hue, s, l } = getExploreColorSpecs(colorIndex);
          assignedColors.set(childId, `hsl(${hue}, ${s}%, ${l}%)`);
        });
      }
    }

    colorNodeBranch(subject.rootNodeId);
    state.graphAssignedColors = assignedColors;
  }
  const shouldSnapCenterBeforeLayout = state.shouldSnapCenterActiveNode;
  const { visible, positions, graphSize } = layoutGraph(subject);
  let nextMapScrollTop = null;
  if (state.shouldCenterActiveNode && state.activeNodeId) {
    const shouldSnapCenter = state.shouldSnapCenterActiveNode;
    state.shouldCenterActiveNode = false;
    state.shouldSnapCenterActiveNode = false;
    const nodeId = state.activeNodeId;
    const node = getNode(nodeId);
    const pos = positions.get(nodeId);
    const mapArea = app.querySelector(".map-area");
    if (node && pos && mapArea) {
      const areaWidth = mapArea.clientWidth;
      const areaHeight = mapArea.clientHeight;
      const isArticleNode = (node.type === "article");
      const parentNode = node.parentId ? getNode(node.parentId) : null;
      const parentPosition = parentNode ? positions.get(parentNode.id) : null;
      const horizontalPosition = isArticleNode && parentPosition ? parentPosition : pos;
      const isRootChild = node.parentId === subject.rootNodeId;
      const focusX = isArticleNode ? Math.max(180, areaWidth * 0.21) : (!isRootChild ? areaWidth / 3.0 : areaWidth / 2.7);
      const focusY = areaHeight / 2;

      const currentScale = state.mapTransform.scale;
      const targetScale = clampNumber(currentScale, 0.85, 1.0);

      let x = Math.round(focusX - horizontalPosition.x * targetScale);
      let y = Math.round(focusY - pos.y * targetScale);

      const isLevel2 = (parentNode && parentNode.parentId === subject.rootNodeId);
      const branchRootId = (node.type === "article" || isLevel2) ? node.parentId : nodeId;
      const subtreeBounds = getSubtreeYBounds(branchRootId, positions);
      if (subtreeBounds) {
        const topPadding = 90;
        const subtreeHeight = (subtreeBounds.maxY - subtreeBounds.minY) * targetScale;
        const currentTop = y + subtreeBounds.minY * targetScale;
        if (subtreeHeight <= areaHeight - topPadding * 2 && currentTop < topPadding) {
          y = Math.round(topPadding - subtreeBounds.minY * targetScale);
        }
      }

      const leftPadding = 40;
      const currentLeft = x + (horizontalPosition.x - horizontalPosition.width / 2) * targetScale;
      if (currentLeft < leftPadding) {
        x = Math.round(leftPadding - (horizontalPosition.x - horizontalPosition.width / 2) * targetScale);
      }

      if (y < 0) {
        nextMapScrollTop = Math.round(-y);
        y = 0;
      }

      state.mapTransform = { x, y, scale: targetScale };
      applyMapTransform({ snap: shouldSnapCenter });
    }
  }
  const previousVisible = state.previousGraphVisibleIds;
  const activePath = new Set((state.activeNodeId ? getNodePath(state.activeNodeId) : []).map((node) => node.id));
  const shouldAnimateMovingNodes = Math.abs(visible.size - previousVisible.size) <= 28 && !shouldSnapCenterBeforeLayout;

  const assignedColors = state.graphAssignedColors || new Map();

  const edgeModels = [];
  const nodes = [];
  let hasMovingNodes = false;
  visible.forEach((nodeId, index) => {
    const node = getNode(nodeId);
    const position = positions.get(nodeId);
    if (!node || !position) return;
    const color = getMindNodeColor(node, assignedColors);
    if (node.parentId && positions.has(node.parentId)) {
      const parent = getNode(node.parentId);
      const isActive = activePath.has(node.id) && activePath.has(node.parentId);
      const isEntering = !previousVisible.has(node.id);
      edgeModels.push({
        color,
        isActive,
        isEntering,
        isRootEdge: parent?.type === "subject",
        nodeId: node.id,
        parentId: node.parentId,
      });
    }

    const box = getMindNodeBox(node);
    const hasChildren = getVisibleChildIds(node).length > 0;
    const isActiveNode = activePath.has(node.id);
    const isEntering = !previousVisible.has(node.id);
    const previousPosition = previousPositions.get(nodeId);
    const moveDeltaX = previousPosition && !isEntering && shouldAnimateMovingNodes
      ? Math.round(previousPosition.x - position.x)
      : 0;
    const moveDeltaY = previousPosition && !isEntering && shouldAnimateMovingNodes
      ? Math.round(previousPosition.y - position.y)
      : 0;
    const isMoving = Boolean(moveDeltaX || moveDeltaY);
    if (isMoving) hasMovingNodes = true;
    const meta = getNodeMeta(node);
    const nodeDelay = 0;
    const isArticle = node.type === "article";
    const isDisabled = Boolean(node.disabled);
    const isLink = Boolean(node.href) && !isDisabled;
    const tagName = isArticle || isLink ? "a" : "button";
    const displayTitle = getMindNodeDisplayTitle(node);
    const title = isArticle ? getArticleMindTitle(displayTitle) : splitMapTitle(displayTitle);
    const primaryMaxLength = getMindPrimaryMaxLength(node);
    const labelContent = isArticle
      ? `<span class="mind-article-title">
          <span class="mind-article-primary">${renderMindPrimaryText(title.primary, MIND_PRIMARY_MAX_CHARS)}</span>
          ${title.english ? `<span class="mind-article-english">${escapeHtml(title.english)}</span>` : ""}
          ${title.note ? `<span class="mind-article-note">${escapeHtml(title.note)}</span>` : ""}
        </span>`
      : `<span class="mind-primary">${renderMindPrimaryText(title.primary, primaryMaxLength)}</span>
          ${title.secondary ? `<span class="mind-secondary">${escapeHtml(title.secondary)}</span>` : ""}`;
    const dot = node.type === "subject" ? "" : `<span class="mind-dot" aria-hidden="true"></span>`;
    const actionAttributes = isArticle
      ? `href="${escapeHtml(articleNodeHref(node))}" target="_blank" rel="noopener noreferrer"`
      : isLink
        ? `href="${escapeHtml(node.href)}"`
        : `type="button"${isDisabled ? " disabled aria-disabled=\"true\"" : ""}`;

    nodes.push(`
      <${tagName}
        class="mind-node node-${node.type} ${hasChildren ? "has-children" : ""} ${isActiveNode ? "active" : ""} ${isEntering ? "entering" : ""} ${isMoving ? "moving" : ""} ${isDisabled ? "disabled" : ""}"
        ${actionAttributes}
        data-node="${escapeHtml(node.id)}"
        data-depth="${node.depth || 0}"
        title="${escapeHtml(displayTitle)}"
        aria-label="${escapeHtml(`${displayTitle}, ${meta}`)}"
        style="left:${position.x - box.width / 2}px; top:${position.y - box.height / 2}px; width:${box.width}px; height:${box.height}px; --node-color:${color}; --node-delay:${nodeDelay}s; --from-x:${moveDeltaX}px; --from-y:${moveDeltaY}px;"
      >
        ${dot}
        <span class="mind-label">
          ${labelContent}
        </span>
      </${tagName}>
    `);
  });

  svg.setAttribute("width", String(graphSize.width));
  svg.setAttribute("height", String(graphSize.height));
  svg.setAttribute("viewBox", `0 0 ${graphSize.width} ${graphSize.height}`);
  const scrollReserveY = nextMapScrollTop ? nextMapScrollTop / Math.max(state.mapTransform.scale, 0.1) : 0;
  canvas.style.width = `${graphSize.width}px`;
  canvas.style.height = `${graphSize.height + scrollReserveY}px`;
  nodeLayer.style.width = `${graphSize.width}px`;
  nodeLayer.style.height = `${graphSize.height}px`;
  nodeLayer.innerHTML = nodes.join("");
  // 在 DOM 重构与测量期间直接操作 DOM，无需冗余的 canvas 过渡重置

  const getEdgeAnchor = (nodeId, side) => {
    const position = positions.get(nodeId);
    if (!position) return { x: 0, y: 0 };
    if (side === "out") {
      return { x: position.x + position.width / 2, y: position.y };
    }
    const node = getNode(nodeId);
    const dotCenterOffset = node?.type === "subject" ? 0 : 15;
    return { x: position.x - position.width / 2 + dotCenterOffset, y: position.y };
  };

  const makeCurvedEdgePath = (start, end) => {
    const distance = Math.abs(end.x - start.x);
    const direction = end.x >= start.x ? 1 : -1;
    const curve = Math.min(130, distance * 0.42);
    return `M ${start.x} ${start.y} C ${start.x + direction * curve} ${start.y}, ${end.x - direction * curve} ${end.y}, ${end.x} ${end.y}`;
  };

  const renderEdgePath = (edge, path, color = edge.color, options = {}) => {
    const classes = [
      "mind-edge",
      edge.isRootEdge ? "root-edge" : "",
      edge.isActive ? "active" : "",
      edge.isEntering ? "entering" : "",
    ].filter(Boolean).join(" ");
    const basePath = `<path class="${classes}" pathLength="1" style="--edge-delay:0s; --edge-color:${color}" d="${path}" />`;
    const flowPath = options.rootFlow
      ? `<path class="mind-edge root-edge root-flow-overlay" pathLength="1" style="--edge-color:${color}" d="${path}" />`
      : "";
    return `${basePath}${flowPath}`;
  };

  const subjectEdges = [];
  const elbowGroups = new Map();
  for (const edge of edgeModels) {
    const parent = getNode(edge.parentId);
    if (parent?.type === "subject") {
      subjectEdges.push(edge);
      continue;
    }
    if (!elbowGroups.has(edge.parentId)) elbowGroups.set(edge.parentId, []);
    elbowGroups.get(edge.parentId).push(edge);
  }

  const curvedEdges = subjectEdges.map((edge) => {
    const start = getEdgeAnchor(edge.parentId, "out");
    const end = getEdgeAnchor(edge.nodeId, "in");
    const edgePath = makeCurvedEdgePath(start, end);
    return renderEdgePath(edge, edgePath, edge.color, {
      rootFlow: edge.isActive && !edge.isEntering,
    });
  });

  const elbowEdges = [];
  for (const [parentId, groupEdges] of elbowGroups) {
    const start = getEdgeAnchor(parentId, "out");
    const childModels = groupEdges
      .map((edge) => ({ edge, end: getEdgeAnchor(edge.nodeId, "in") }))
      .sort((left, right) => left.end.y - right.end.y);
    if (!childModels.length) continue;

    const minEndX = Math.min(...childModels.map((item) => item.end.x));
    const trunkX = Math.max(start.x + 24, minEndX - 80);
    const minY = Math.min(start.y, ...childModels.map((item) => item.end.y));
    const maxY = Math.max(start.y, ...childModels.map((item) => item.end.y));
    const parentNode = getNode(parentId);
    const parentColor = parentNode ? getMindNodeColor(parentNode, assignedColors) : childModels[0].edge.color;
    const trunkEdge = {
      ...childModels[0].edge,
      isActive: childModels.some((item) => item.edge.isActive),
      isEntering: childModels.some((item) => item.edge.isEntering),
    };
    elbowEdges.push(renderEdgePath(trunkEdge, `M ${start.x} ${start.y} L ${trunkX} ${start.y} M ${trunkX} ${minY} L ${trunkX} ${maxY}`, parentColor));

    for (const { edge, end } of childModels) {
      elbowEdges.push(renderEdgePath(edge, `M ${trunkX} ${end.y} L ${end.x} ${end.y}`));
    }
  }
  svg.innerHTML = `<g data-viewport>${curvedEdges.join("")}${elbowEdges.join("")}</g>`;

  if (hasMovingNodes) {
    window.setTimeout(() => {
      nodeLayer.querySelectorAll(".mind-node.moving").forEach(clearMovingMindNodeState);
    }, 650);
  }

  // 测量和连线计算完毕，接下来触发 map 变换与事件绑定
  state.previousGraphVisibleIds = new Set(visible);
  applyMapTransform();
  if (nextMapScrollTop !== null) {
    const mapArea = app.querySelector(".map-area");
    mapArea?.scrollTo({ top: nextMapScrollTop, left: mapArea.scrollLeft, behavior: "auto" });
  }
  bindGraphEvents(subject);
}

function getNodeBox(node) {
  const lineCount = getNodeTextLines(node).length;
  if (node.type === "subject") return { width: 420, height: Math.max(150, lineCount * 58 + 42) };
  if (node.type === "level1") return { width: 470, height: Math.max(170, lineCount * 34 + 42) };
  if (node.type === "level2") return { width: 500, height: Math.max(188, lineCount * 31 + 46) };
  return { width: 520, height: Math.max(188, lineCount * 31 + 46) };
}

function getNodeTone(node) {
  if (node.type === "subject") {
    return { fill: "#1c1d22", stroke: "#a0a4b0", stripe: "#e8e8ed", hover: "rgba(255, 255, 255, 0.08)", darkText: false };
  }
  if (node.type === "level1") {
    return { fill: "#111214", stroke: "#f4f4f5", stripe: "#f4f4f5", hover: "rgba(255, 255, 255, 0.24)", darkText: false };
  }
  if (node.type === "level2") {
    return { fill: "#202226", stroke: "#727985", stripe: "#d1d5db", hover: "rgba(255, 255, 255, 0.21)", darkText: false };
  }
  return { fill: "#111214", stroke: "#f4f4f5", stripe: "#f4f4f5", hover: "rgba(255, 255, 255, 0.2)", darkText: false };
}

function getNodeMeta(node) {
  if (node.disabled) return t("unavailable");
  if (node.type === "subject") return `${t("overview")} · ${formatCount(getVisibleChildIds(node).length, "branches")}`;
  if (node.type === "article") return t("article");
  return state.expanded.has(node.id) ? t("expanded") : t("expandable");
}

function getNodeTextRules(node) {
  if (node.type === "subject") return { maxChars: 26, maxLines: 2 };
  if (node.type === "level1") return { maxChars: 26, maxLines: 6 };
  if (node.type === "level2") return { maxChars: 28, maxLines: 7 };
  return { maxChars: 29, maxLines: 7 };
}

function getNodeLabel(node) {
  return getMindNodeDisplayTitle(node);
}

function getNodeTextLines(node) {
  const textRules = getNodeTextRules(node);
  return makeNodeTextLines(getNodeLabel(node), textRules.maxChars, textRules.maxLines);
}

function splitMixedLanguageSegments(text, maxChars) {
  const compact = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!/[\u3400-\u9fff\uf900-\ufaff]/.test(compact) || !/[A-Za-z]/.test(compact)) return [compact];

  const words = compact.split(" ");
  if (words.length <= 1) return [compact];

  const segments = [];
  let pending = [];

  const isLatinWord = (word) => /[A-Za-z]/.test(word) && !/[\u3400-\u9fff\uf900-\ufaff]/.test(word);
  const pushPending = () => {
    const value = pending.join(" ").trim();
    if (value) segments.push(value);
    pending = [];
  };

  let index = 0;
  while (index < words.length) {
    if (!isLatinWord(words[index])) {
      pending.push(words[index]);
      index += 1;
      continue;
    }

    const phrase = [];
    while (index < words.length && isLatinWord(words[index])) {
      phrase.push(words[index]);
      index += 1;
    }

    if (phrase.length > 1) {
      pushPending();
      segments.push(phrase.join(" "));
      continue;
    }

    pending.push(...phrase);
  }

  pushPending();
  return segments.length > 1 ? segments : [compact];
}

function wrapNodeText(text, maxChars, maxLines) {
  const compact = String(text ?? "").replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return [compact];
  const isLatinText = /[A-Za-z]/.test(compact) && !/[\u3400-\u9fff\uf900-\ufaff]/.test(compact);
  const words = compact.split(" ");

  if (isLatinText && words.length > 1) {
    const lines = [];
    let pendingWords = words;
    while (pendingWords.length && lines.length < maxLines) {
      const pendingText = pendingWords.join(" ");
      if (pendingText.length <= maxChars) {
        lines.push(pendingText);
        pendingWords = [];
        break;
      }

      const remainingSlots = maxLines - lines.length;
      const neededSlots = Math.min(remainingSlots, Math.max(2, Math.ceil(pendingText.length / maxChars)));
      const targetLength = Math.ceil(pendingText.length / neededSlots);
      let cutIndex = 1;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let index = 1; index < pendingWords.length; index += 1) {
        const candidate = pendingWords.slice(0, index).join(" ");
        if (candidate.length > maxChars) break;
        const rest = pendingWords.slice(index).join(" ");
        const score = Math.abs(candidate.length - targetLength)
          + (rest.length > maxChars * (neededSlots - 1) ? 100 : 0);
        if (score <= bestScore) {
          bestScore = score;
          cutIndex = index;
        }
      }

      lines.push(pendingWords.slice(0, cutIndex).join(" "));
      pendingWords = pendingWords.slice(cutIndex);
    }

    if (pendingWords.length && lines.length) {
      lines[lines.length - 1] = `${lines[lines.length - 1].replace(/…$/, "")}…`;
    }
    return lines;
  }

  const lines = [];
  let cursor = compact;
  while (cursor.length && lines.length < maxLines) {
    if (cursor.length <= maxChars) {
      lines.push(cursor);
      cursor = "";
      break;
    }

    const slice = cursor.slice(0, maxChars);
    const spaceIndex = slice.lastIndexOf(" ");
    const cut = spaceIndex > maxChars * 0.45 ? spaceIndex : maxChars;
    lines.push(cursor.slice(0, cut).trim());
    cursor = cursor.slice(cut).trim();
  }

  if (cursor.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/…$/, "")}…`;
  }
  return lines;
}

function makeNodeTextLines(text, maxChars, maxLines = 2) {
  const compact = String(text ?? "").replace(/\s+/g, " ").trim();
  const segments = splitMixedLanguageSegments(compact, maxChars);
  if (segments.length === 1) return wrapNodeText(segments[0], maxChars, maxLines);

  const lines = [];
  for (const segment of segments) {
    if (lines.length >= maxLines) break;
    const remaining = maxLines - lines.length;
    lines.push(...wrapNodeText(segment, maxChars, remaining));
  }

  if (lines.length > maxLines) return lines.slice(0, maxLines);
  return lines;
}

function applyMapTransform(options = {}) {
  const canvas = app.querySelector("[data-map-canvas]");
  if (!canvas) return;
  const { x, y, scale } = state.mapTransform;
  if (options.snap) {
    const previousTransition = canvas.style.transition;
    canvas.style.transition = "none";
    canvas.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    canvas.getBoundingClientRect();
    requestAnimationFrame(() => {
      canvas.style.transition = previousTransition;
    });
    return;
  }
  canvas.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

function getVisibleMapBounds() {
  const entries = [...state.positions.entries()];
  if (!entries.length) return null;
  return entries.reduce(
    (bounds, [nodeId, position]) => {
      const node = getNode(nodeId);
      const box = node ? getMindNodeBox(node) : position;
      const minX = position.x - box.width / 2;
      const maxX = position.x + box.width / 2;
      const minY = position.y - box.height / 2;
      const maxY = position.y + box.height / 2;
      return {
        minX: Math.min(bounds.minX, minX),
        maxX: Math.max(bounds.maxX, maxX),
        minY: Math.min(bounds.minY, minY),
        maxY: Math.max(bounds.maxY, maxY),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

function getSubtreeYBounds(nodeId, positions) {
  let minY = Infinity;
  let maxY = -Infinity;

  function visit(id) {
    const pos = positions.get(id);
    if (!pos) return;

    minY = Math.min(minY, pos.y - pos.height / 2);
    maxY = Math.max(maxY, pos.y + pos.height / 2);

    const node = getNode(id);
    if (node && state.expanded.has(id)) {
      for (const childId of node.childrenIds) {
        visit(childId);
      }
    }
  }

  visit(nodeId);
  return minY === Infinity ? null : { minY, maxY };
}

function updateFitScreenButton() {
  const button = app.querySelector("[data-action='fit-screen']");
  if (!button) return;
  button.textContent = state.mapFitActive ? t("reset") : t("fitScreen");
  button.setAttribute("title", state.mapFitActive ? t("resetMapSize") : t("fitScreen"));
  button.setAttribute("aria-label", state.mapFitActive ? t("resetMapSize") : t("fitScreen"));
}

function fitMapToScreen(subject) {
  if (!state.positions.size && subject) layoutGraph(subject);
  const mapArea = app.querySelector(".map-area");
  const bounds = getVisibleMapBounds();
  if (!mapArea || !bounds) return;

  if (state.mapFitActive) {
    if (state.mapFitResetTransform) state.mapTransform = { ...state.mapFitResetTransform };
    state.mapFitActive = false;
    state.mapFitResetTransform = null;
    applyMapTransform();
    updateFitScreenButton();
    return;
  }

  const rootPosition = state.positions.get(subject.rootNodeId);
  const rootElement = app.querySelector(`.mind-node[data-node="${CSS.escape(subject.rootNodeId)}"]`);
  if (!rootPosition || !rootElement) return;

  const padding = 42;
  const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
  const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
  const mapRect = mapArea.getBoundingClientRect();
  const viewWidth = Math.max(1, Math.min(mapArea.clientWidth, window.innerWidth - mapRect.left));
  const viewHeight = Math.max(1, Math.min(mapArea.clientHeight, window.innerHeight - mapRect.top));
  const rootRect = rootElement.getBoundingClientRect();
  const rootCenter = {
    x: rootRect.left + rootRect.width / 2 - mapRect.left + mapArea.scrollLeft,
    y: rootRect.top + rootRect.height / 2 - mapRect.top + mapArea.scrollTop,
  };
  const scale = clampNumber(Math.min(
    Math.max(1, viewWidth - padding * 2) / boundsWidth,
    Math.max(1, viewHeight - padding * 2) / boundsHeight,
  ), 0.28, 1.35);
  const fitMinX = padding - bounds.minX * scale;
  const fitMaxX = viewWidth - padding - bounds.maxX * scale;
  const fitMinY = padding - bounds.minY * scale;
  const fitMaxY = viewHeight - padding - bounds.maxY * scale;
  const anchoredX = rootCenter.x - rootPosition.x * scale;
  const anchoredY = rootCenter.y - rootPosition.y * scale;
  const x = Math.round(clampNumber(anchoredX, Math.min(fitMinX, fitMaxX), Math.max(fitMinX, fitMaxX)));
  const y = Math.round(clampNumber(anchoredY, Math.min(fitMinY, fitMaxY), Math.max(fitMinY, fitMaxY)));

  state.mapFitResetTransform = { ...state.mapTransform };
  state.mapFitActive = true;
  state.mapTransform = { x, y, scale };
  applyMapTransform();
  updateFitScreenButton();
  mapArea.scrollTo({ left: 0, top: 0, behavior: "auto" });
}

function zoomBy(factor) {
  state.mapTransform.scale = Math.max(0.35, Math.min(2.5, state.mapTransform.scale * factor));
  state.mapFitActive = false;
  state.mapFitResetTransform = null;
  applyMapTransform();
  updateFitScreenButton();
}

function openArticleNodeInNewTab(node) {
  window.open(articleNodeHref(node), "_blank", "noopener,noreferrer");
}

function clearMovingMindNodeState(element) {
  element.classList.remove("moving");
  element.style.removeProperty("--from-x");
  element.style.removeProperty("--from-y");
}

function bindGraphEvents(subject) {
  const nodeLayer = app.querySelector("[data-node-layer]");
  const activateNode = (nodeId) => {
    const node = getNode(nodeId);
    if (!node) return;
    if (node.type === "article") {
      openArticleNodeInNewTab(node);
      return;
    }
    state.activeNodeId = nodeId;
    const parentNode = node.parentId ? getNode(node.parentId) : null;
    const isLevel1 = (node.parentId === subject.rootNodeId);
    const isLevel2 = (parentNode && parentNode.parentId === subject.rootNodeId);

    // 如果是点击可展开节点，触发聚焦与纯粹的淡入淡出交互
    if (node.type !== "subject") {
      let willExpand = false;
      if (state.expanded.has(nodeId) && node.type !== "subject") {
        state.expanded.delete(nodeId);
        willExpand = false;
      } else {
        state.expanded.add(nodeId);
        willExpand = true;

        // 独占自动折叠
        if (isLevel1) {
          const rootNode = getNode(subject.rootNodeId);
          if (rootNode) {
            for (const childId of rootNode.childrenIds) {
              if (childId !== nodeId) {
                state.expanded.delete(childId);
              }
            }
          }
        } else if (isLevel2 && parentNode) {
          for (const childId of parentNode.childrenIds) {
            if (childId !== nodeId) {
              state.expanded.delete(childId);
            }
          }
        }
      }

      if (willExpand) {
        state.shouldCenterActiveNode = true;
      } else if (isLevel1 || isLevel2) {
        state.shouldCenterActiveNode = true;
      }

      state.mapFitActive = false;
      state.mapFitResetTransform = null;

      renderGraph(subject);
      updateFitScreenButton();
    } else {
      // 非一级或二级节点（如根节点），保持同步更新，无需延迟
      let willExpand = false;
      if (state.expanded.has(nodeId) && node.type !== "subject") {
        state.expanded.delete(nodeId);
      } else {
        state.expanded.add(nodeId);
      }
      renderGraph(subject);
    }
  };

  if (nodeLayer) {
    nodeLayer.onclick = (event) => {
      const element = event.target.closest(".mind-node");
      if (!element || !nodeLayer.contains(element)) return;
      const nodeId = element.getAttribute("data-node");
      const node = getNode(nodeId);
      if (node?.type === "article" || node?.href || node?.disabled) return;
      event.stopPropagation();
      event.preventDefault();
      activateNode(nodeId);
    };

    nodeLayer.onanimationend = (event) => {
      const element = event.target.closest?.(".mind-node.moving");
      if (element && nodeLayer.contains(element)) {
        clearMovingMindNodeState(element);
      }
    };
  }

  if (!isGraphResizeListenerBound) {
    window.addEventListener("resize", applyMapTransform);
    isGraphResizeListenerBound = true;
  }
}

function renderMarkdown(markdown) {
  const lines = String(markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listOpen = false;
  let codeOpen = false;
  let codeLines = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (codeOpen) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        codeOpen = false;
      } else {
        flushParagraph();
        closeList();
        codeOpen = true;
      }
      continue;
    }

    if (codeOpen) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = trimmed.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInline(listItem[1])}</li>`);
      continue;
    }

    if (/^\[\d+\]\s+/.test(trimmed)) {
      flushParagraph();
      closeList();
      html.push(`<p class="reference-entry">${renderInline(trimmed)}</p>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${renderInline(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();
  if (codeOpen) html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return html.join("");
}

const inlineStyleProperties = new Set(["color", "background-color", "font-weight", "font-style", "text-decoration"]);

function isAllowedInlineStyleValue(property, value) {
  const normalized = value.trim();
  if (!normalized || /[<>"']|&(?:lt|gt|quot|#0?39);/i.test(normalized)) return false;
  if (property === "color" || property === "background-color") {
    return (
      /^#[0-9a-f]{3,8}$/i.test(normalized) ||
      /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*(?:0|1|0?\.\d+|[\d.]+%))?\s*\)$/i.test(normalized) ||
      /^hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*(?:0|1|0?\.\d+|[\d.]+%))?\s*\)$/i.test(normalized) ||
      /^var\(--[a-z0-9-]+\)$/i.test(normalized) ||
      /^(transparent|currentcolor|inherit)$/i.test(normalized)
    );
  }
  if (property === "font-weight") return /^(normal|bold|bolder|lighter|[1-9]00)$/i.test(normalized);
  if (property === "font-style") return /^(normal|italic|oblique)$/i.test(normalized);
  if (property === "text-decoration") return /^(none|underline|line-through)$/i.test(normalized);
  return false;
}

function normalizeInlineStyle(rawStyle) {
  const declarations = [];
  for (const part of rawStyle.split(";")) {
    const declaration = part.trim();
    if (!declaration) continue;
    const match = declaration.match(/^([a-z-]+)\s*:\s*(.+)$/i);
    if (!match) continue;
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    if (!inlineStyleProperties.has(property)) continue;
    if (!isAllowedInlineStyleValue(property, value)) continue;
    declarations.push(`${property}: ${value};`);
  }
  return declarations.join(" ");
}

function renderInline(text) {
  let value = escapeHtml(text);
  value = value.replace(
    /&lt;span\s+class=(?:&quot;|&#039;)(hltr-text-(?:blue|green|purple|red|yellow|orange|pink|cyan|gray))(?:&quot;|&#039;)&gt;([\s\S]*?)&lt;\/span&gt;/g,
    '<span class="$1">$2</span>',
  );
  value = value.replace(
    /&lt;(span|mark)\s+style=(?:&quot;|&#039;)((?:(?!&quot;|&#039;).)*)(?:&quot;|&#039;)&gt;([\s\S]*?)&lt;\/\1&gt;/g,
    (match, tagName, rawStyle, content) => {
      const style = normalizeInlineStyle(rawStyle);
      return style ? `<${tagName} style="${escapeHtml(style)}">${content}</${tagName}>` : match;
    },
  );
  value = value.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/g, "<strong>$1</strong>");
  value = value.replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/g, "<em>$1</em>");
  value = value.replace(/&lt;br\s*\/?&gt;/g, "<br>");
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  value = value.replace(/(^|[\s>])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>');
  return value;
}

loadData().catch((error) => {
  app.innerHTML = `<div class="empty-state">Site data has not been generated: ${escapeHtml(error.message)}</div>`;
});
