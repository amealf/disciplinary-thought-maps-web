import fs from 'node:fs';
import path from 'node:path';

const root = 'D:\\学科地图\\心理咨询\\CPTSD';
const write = process.argv.includes('--write');
const reportPath = 'D:\\学科地图\\cptsd-title-fix-report.json';

const utf8 = 'utf8';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(fullPath));
    if (entry.isFile() && entry.name.endsWith('.md')) out.push(fullPath);
  }
  return out;
}

function stripIndex(folderName) {
  return folderName.replace(/^\d+(?:_\d+)*\s+/, '').trim();
}

function chinesePart(label) {
  const cleaned = stripIndex(label);
  const match = cleaned.match(/^([\s\S]*?)(?:\s+[A-Za-z][\s\S]*)?$/);
  return (match?.[1] || cleaned).trim();
}

function englishPart(label) {
  const cleaned = stripIndex(label);
  const match = cleaned.match(/\s+([A-Za-z][\s\S]*)$/);
  return (match?.[1] || '').trim();
}

function windowsSafeTitle(title) {
  return title
    .replace(/[<>:"/\\|?*：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function likelyDescriptionPrefix(text) {
  return /治疗路径|理论贡献|案例证据|案例研究|方法介绍|证据基础|证据边界|临床建议|临床定位|阅读顺序|治疗目标|流程|概览|机制|情绪调节|羞耻|自责|关系困难|儿童发展|创伤记忆|创伤加工|解离|依恋|身体安全|高唤醒|风险管理|患者参与|照护者参与|安全情境|快速缓解|药物靶点|研究证据|辅助治疗|神经发育顺序|梦境重写|睡眠安全|长期边界|文化适配|身份研究|家庭系统|记忆与神经系统|安全、记忆|身体、记忆|远程与在线治疗/.test(text);
}

function likelyNamedEntry(text) {
  return /治疗|模型|试验|研究|手册|指南|问卷|量表|工具|疗法|训练|诊断|症状|因素|路径|流程|概览|证据|比较|评估|协议|标准|技术|治疗文本|专家共识/.test(text);
}

function trimAuthorPrefix(title) {
  let next = title;
  const chineseAuthors = [
    '诺伊纳等',
    '拉斯金德等',
    '费德等',
    '埃勒斯与克拉克',
    '库尔图瓦与福特',
    '克洛伊特等',
    '理查德 施瓦茨',
    '巴里 克拉科夫',
  ];
  for (const author of chineseAuthors) {
    if (next.startsWith(author)) {
      const candidate = next.slice(author.length).trim();
      if (likelyNamedEntry(candidate)) next = candidate;
    }
  }

  next = next.replace(/^([\u4e00-\u9fff·\s]{2,12}等)(?=[\u4e00-\u9fff])/, '');
  next = next.replace(/^(Neuner|Raskind|Feder|Cloitre)\s+et\s+al\s+/i, '');
  next = next.replace(/^Ehlers\s+and\s+Clark\s+/i, '');
  next = next.replace(/^Courtois\s+and\s+Ford\s+/i, '');
  next = next.replace(/^Richard\s+Schwartz\s+/i, '');
  next = next.replace(/^Barry\s+Krakow\s+/i, '');
  next = next.replace(/\s+(Neuner|Raskind|Feder|Cloitre)\s+et\s+al\s+(?=[A-Z])/gi, ' ');
  next = next.replace(/\s+Ehlers\s+and\s+Clark\s+(?=[A-Z])/gi, ' ');
  next = next.replace(/\s+Courtois\s+and\s+Ford\s+(?=[A-Z])/gi, ' ');
  next = next.replace(/\s+Richard\s+Schwartz\s+(?=[A-Z])/gi, ' ');
  next = next.replace(/\s+Barry\s+Krakow\s+(?=[A-Z])/gi, ' ');
  return next.replace(/\s+/g, ' ').trim();
}

function removeRedundantCptsd(title) {
  return title
    .replace(/PTSD与CPTSD/g, 'PTSD')
    .replace(/PTSD\s+and\s+Complex\s+PTSD/gi, 'PTSD')
    .replace(/for\s+PTSD\s+and\s+Complex\s+Trauma/gi, 'for PTSD')
    .replace(/PTSD与复杂创伤/g, 'PTSD')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBrokenEnglishJoin(title) {
  return title
    .replace(/(?<=[\u4e00-\u9fff])\s+and\s+(?=[A-Z])/g, ' ')
    .replace(/创伤导论书ductory Books on Trauma/g, '创伤导论书 Introductory Books on Trauma')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripColonDescription(title) {
  const colon = title.indexOf('：');
  if (colon === -1) return title;
  const prefix = title.slice(0, colon).trim();
  const suffix = title.slice(colon + 1).trim();
  if (!prefix || !suffix) return title;
  if (prefix.includes('《') || suffix.includes('《')) return title;
  if (prefix.length <= 42 && likelyNamedEntry(suffix)) return suffix;
  return title;
}

function stripParentPrefix(title, filePath) {
  if (title.includes('《')) return title;
  const parentName = path.basename(path.dirname(filePath));
  const parentCn = chinesePart(parentName);
  if (!parentCn || parentCn.length < 2) return title;
  const index = title.indexOf(parentCn);
  if (index <= 0) return title;
  const prefix = title.slice(0, index).trim();
  const suffix = title.slice(index).trim();
  if (prefix.length <= 42 && likelyNamedEntry(suffix)) return suffix;
  return title;
}

function stripLooseDescriptionPrefix(title) {
  if (title.includes('《')) return title;
  const match = title.match(/^(.{2,42})(\s+)([\u4e00-\u9fffA-Z][\s\S]*?(?:治疗|模型|试验|问卷|量表|工具|指南|手册|技术|研究|疗法|训练|标准|比较|评估|协议)[\s\S]*)$/);
  if (!match) return title;
  const prefix = match[1].trim();
  const suffix = match[3].trim();
  if (likelyDescriptionPrefix(prefix) && likelyNamedEntry(suffix)) return suffix;
  return title;
}

function normalizeTitle(title, filePath) {
  let next = title.replace(/^#\s+/, '').trim();
  if (next.includes('《')) return next;
  next = stripColonDescription(next);
  next = stripParentPrefix(next, filePath);
  next = stripLooseDescriptionPrefix(next);
  next = trimAuthorPrefix(next);
  next = next.replace(/论文(?=\s|$)/g, '');
  next = removeRedundantCptsd(next);
  next = normalizeBrokenEnglishJoin(next);
  return next.replace(/\s+/g, ' ').trim();
}

function readHeading(filePath) {
  const text = fs.readFileSync(filePath, utf8);
  const lines = text.split(/\r?\n/);
  if (!lines[0]?.startsWith('# ')) return { text, lines, heading: path.basename(filePath, '.md') };
  return { text, lines, heading: lines[0].slice(2).trim() };
}

function pathKey(filePath) {
  return path.resolve(filePath).toLocaleLowerCase();
}

function collisionTag(item) {
  const source = `${item.oldTitle} ${path.basename(item.oldPath, '.md')}`;
  const tags = [
    '案例证据',
    '案例研究',
    '证据边界',
    '治疗路径',
    '临床建议',
    '理论贡献',
    '方法介绍',
    '证据基础',
    '阅读顺序',
    '治疗目标',
    '流程',
    '概览',
    '比较',
  ];
  const exactTag = tags.find(tag => source.includes(tag));
  if (exactTag) return exactTag;
  const phraseTags = [
    '自我领导',
    '创伤整合',
    '内部合作',
    '关系困局',
    '价值行动',
    '回避松动',
    '当下觉察',
    '正念练习',
    '安全感',
    '症状证据',
    '安全练习',
    '自我安抚',
    '关系安全',
    '边界练习',
    '孤立经验',
    '文化适配',
    '任务共享',
    '梦境重写',
    '药物靶点',
    '快速缓解',
    '长期边界',
    '参数靶点',
    '神经调节',
    '安全情境',
    '发展性创伤',
    '儿童发展',
    '照护者参与',
    '患者参与',
  ];
  const phraseTag = phraseTags.find(tag => source.includes(tag));
  if (phraseTag) return phraseTag;
  if (/理查德 施瓦茨|保罗 吉尔伯特|海斯|巴里 克拉科夫/.test(source)) return '理论来源';
  return '相关条目';
}

function insertTagBeforeEnglish(title, tag, index = 0) {
  const finalTag = index > 0 ? `${tag}${index + 1}` : tag;
  if (title.includes(finalTag)) return title;
  for (let i = 1; i < title.length - 1; i += 1) {
    if (title[i] !== ' ') continue;
    const prefix = title.slice(0, i);
    const suffix = title.slice(i + 1);
    if (/[\u4e00-\u9fff]/.test(prefix) && /^[A-Z][A-Za-z]/.test(suffix)) {
      return `${prefix}${finalTag} ${suffix}`.replace(/\s+/g, ' ').trim();
    }
  }
  return `${title}${finalTag}`.replace(/\s+/g, ' ').trim();
}

function preferredPrimary(items) {
  return [...items].sort((a, b) => {
    const aSource = `${a.oldTitle} ${path.basename(a.oldPath, '.md')}`;
    const bSource = `${b.oldTitle} ${path.basename(b.oldPath, '.md')}`;
    const score = source => {
      if (source.includes('治疗路径')) return 0;
      if (source.includes('概览')) return 1;
      if (source.includes('方法介绍')) return 2;
      return 3;
    };
    return score(aSource) - score(bSource) || a.oldPath.length - b.oldPath.length;
  })[0];
}

const files = walk(root);
const rawPlans = [];

for (const filePath of files) {
  const { heading } = readHeading(filePath);
  const base = path.basename(filePath, '.md');
  const normalizedHeading = normalizeTitle(heading, filePath);
  const normalizedBase = normalizeTitle(base, filePath);
  const baseNeedsChange = normalizedBase !== base;
  let newTitle = heading;
  if (normalizedHeading !== heading) {
    newTitle = normalizedHeading;
  } else if (baseNeedsChange) {
    newTitle = normalizedBase;
  } else if (heading !== base && !(heading.includes('《') && windowsSafeTitle(heading) === base)) {
    newTitle = base;
  }
  const newBase = windowsSafeTitle(newTitle);
  if (!newBase || (newTitle === heading && newBase === base)) continue;

  rawPlans.push({
    oldPath: filePath,
    newPath: path.join(path.dirname(filePath), `${newBase}.md`),
    oldTitle: heading,
    newTitle,
  });
}

const groups = new Map();
for (const item of rawPlans) {
  const key = pathKey(item.newPath);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(item);
}

const occupied = new Map(files.map(filePath => [pathKey(filePath), filePath]));
const planned = [];
const conflicts = [];

for (const items of groups.values()) {
  const targetPath = items[0].newPath;
  const targetOwner = occupied.get(pathKey(targetPath));
  const targetOwnerItem = items.find(item => pathKey(item.oldPath) === pathKey(targetPath));
  const primary = targetOwnerItem || (!targetOwner ? preferredPrimary(items) : null);

  for (const item of items) {
    let finalTitle = item.newTitle;
    let finalPath = item.newPath;
    if (item !== primary) {
      const tag = collisionTag(item);
      let index = 0;
      do {
        finalTitle = insertTagBeforeEnglish(item.newTitle, tag, index);
        finalPath = path.join(path.dirname(item.newPath), `${windowsSafeTitle(finalTitle)}.md`);
        index += 1;
      } while (
        occupied.has(pathKey(finalPath)) &&
        pathKey(finalPath) !== pathKey(item.oldPath) &&
        index < 30
      );
    }

    let finalKey = pathKey(finalPath);
    let finalOwner = occupied.get(finalKey);
    if (finalOwner && pathKey(finalOwner) !== pathKey(item.oldPath)) {
      const tag = collisionTag(item);
      let index = 0;
      do {
        finalTitle = insertTagBeforeEnglish(item.newTitle, tag, index);
        finalPath = path.join(path.dirname(item.newPath), `${windowsSafeTitle(finalTitle)}.md`);
        finalKey = pathKey(finalPath);
        finalOwner = occupied.get(finalKey);
        index += 1;
      } while (
        finalOwner &&
        pathKey(finalOwner) !== pathKey(item.oldPath) &&
        index < 30
      );
    }
    if (finalOwner && pathKey(finalOwner) !== pathKey(item.oldPath)) {
      conflicts.push({ ...item, newPath: finalPath, newTitle: finalTitle, conflict: true, conflictsWith: finalOwner });
      continue;
    }

    occupied.delete(pathKey(item.oldPath));
    occupied.set(finalKey, item.oldPath);
    planned.push({ ...item, newPath: finalPath, newTitle: finalTitle, conflict: false, conflictsWith: '' });
  }
}

const writable = planned;

if (write) {
  for (const item of writable) {
    const read = readHeading(item.oldPath);
    if (read.lines[0]?.startsWith('# ')) {
      read.lines[0] = `# ${item.newTitle}`;
      fs.writeFileSync(item.oldPath, read.lines.join('\n'), utf8);
    }
  }

  const moves = writable
    .filter(item => pathKey(item.oldPath) !== pathKey(item.newPath))
    .map((item, index) => ({
      ...item,
      tempPath: path.join(path.dirname(item.oldPath), `.codex-title-move-${process.pid}-${index}.md`),
    }));

  for (const move of moves) {
    fs.renameSync(move.oldPath, move.tempPath);
  }

  for (const move of moves) {
    fs.renameSync(move.tempPath, move.newPath);
  }
}

const report = {
  mode: write ? 'write' : 'dry-run',
  totalFiles: files.length,
  planned: planned.length,
  writable: writable.length,
  conflicts: conflicts.length,
  samples: planned.slice(0, 40),
  conflictSamples: conflicts.slice(0, 80),
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, utf8);
console.log(JSON.stringify(report, null, 2));
