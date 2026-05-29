import fs from 'node:fs';
import path from 'node:path';

const root = 'D:\\学科地图\\文学理论';
const reportPath = 'D:\\学科地图\\literary-theory-title-fix-report.json';
const write = process.argv.includes('--write');
const utf8 = 'utf8';

const forbidden = /如何|怎样|为什么|把|了|一门|一种|不是[\s\S]{0,8}而是|写成|让[\s\S]{0,12}/;
const genericTitleWords = /重要声音|批评路径|理论机制|核心文本|核心贡献|重要文本|理论贡献|学术贡献|方法贡献|一种|一门|如何|怎样|为什么|把|写成|让/;

const weightedTerms = [
  '摹仿', '模仿论', '卡塔西斯', '情节', '行动', '修辞', '崇高', '寓教于乐', '三一律',
  '诗言志', '兴观群怨', '主文而谲谏', '神思', '文心', '滋味', '文气', '建安文学', '文体论',
  '神授灵感', '解释权威', '知识根据', '判断理由', '诗歌权威', '诵诗传统',
  '修辞教育', '经典阅读', '公共表达', '雄辩训练', '风格训练', '人格教育',
  '经院诗学', '寓意解释', '四重释义', '俗语诗学', '文艺复兴诗学', '民族语言',
  '趣味判断', '崇高美学', '想象力', '天才', '有机形式', '象征', '现实主义', '典型',
  '陌生化', '文学性', '形式主义', '新批评', '细读', '张力', '含混', '反讽',
  '意识形态', '总体性', '物化', '阶级意识', '政治无意识', '文化工业', '机械复制',
  '复调', '对话主义', '时空体', '狂欢化', '梦的工作', '无意识', '俄狄浦斯情结',
  '原型批评', '象征秩序', '镜像阶段', '欲望结构', '行动元', '功能序列', '神话素',
  '叙事时间', '聚焦', '叙述层次', '符号学', '结构语义学', '文本性', '互文性',
  '作者之死', '可写文本', '延异', '踪迹', '解构', '话语', '知识考古', '规训权力',
  '拟像', '后现代状况', '视域融合', '诠释循环', '效果历史', '期待视野', '未定点',
  '具体化', '解释共同体', '读者反应', '接受美学', '文化唯物主义', '情感结构',
  '文化资本', '文学制度', '经典形成', '自下而上的历史', '道德经济', '阶级形成',
  '女性书写', '阁楼疯女人', '性别表演', '酷儿时间', '交叉性', '差异政治', '情感政治',
  '东方主义', '殖民话语', '对位阅读', '世俗批评', '底层者', '混杂性', '拟态',
  '民族叙事', '离散', '世界文学', '远读', '星球性', '翻译政治',
  '生态批评', '环境人文学', '人类世', '表层阅读', '症候阅读', '后批评', '新形式主义',
  '物质转向', '行动者网络', '媒介考古', '数字人文学', '机器阅读', '情感转向',
  '创伤记忆', '文化记忆', '档案政治', '残障研究', '常态人', '作者身份',
  '文学革命', '人的文学', '革命文学', '大众语', '延安文艺', '现实主义论争',
  '朦胧诗', '寻根文学', '主体性论争', '新时期文学', '现代性反思',
];

const weakTerms = new Set([
  '理论', '批评', '声音', '研究', '路径', '机制', '贡献', '核心', '重要',
]);

const authorPrefixes = [
  'Roland Barthes', 'Gerard Genette', 'Georg Lukacs', 'Theodor Adorno', 'Walter Benjamin',
  'Bertolt Brecht', 'Sigmund Freud', 'Carl Jung', 'Mikhail Bakhtin', 'Louis Althusser',
  'Jean Paul Sartre', 'Fredric Jameson', 'Terry Eagleton', 'Raymond Williams',
  'Judith Butler', 'Gayatri Chakravorty Spivak', 'Homi K Bhabha', 'Edward Said',
  'Bessel van der Kolk', 'Julia Kristeva', 'Jacques Derrida', 'Michel Foucault',
  'Paul de Man', 'Wolfgang Iser', 'Hans Robert Jauss', 'Stanley Fish', 'Roman Ingarden',
  'Wayne C Booth', 'Northrop Frye', 'Viktor Shklovsky', 'Roman Jakobson', 'Algirdas Greimas',
  'Jonathan Culler', 'Tzvetan Todorov', 'Cleanth Brooks', 'William Empson',
  'I A Richards', 'F R Leavis', 'M H Abrams', 'Elaine Showalter', 'Sandra Gilbert',
  'Susan Gubar', 'Luce Irigaray', 'Helene Cixous', 'Audre Lorde', 'Sara Ahmed',
  'Franco Moretti', 'Bruno Latour', 'N Katherine Hayles',
  'Plato', 'Aristotle', 'Horace', 'Longinus', 'Cicero', 'Quintilian', 'Cao Pi', 'Lu Ji',
  'Liu Xie', 'Zhong Rong', 'Stephen Greenblatt', 'Louis Montrose', 'Jerome McGann',
  'Mary Wollstonecraft', 'Virginia Woolf', 'Simone de Beauvoir', 'Kate Millett',
  'Sandra Gilbert and Susan Gubar', 'Sandra Gilbert', 'Susan Gubar', 'Elaine Showalter',
  'Helene Cixous', 'Luce Irigaray', 'Toril Moi', 'Laura Mulvey', 'Adrienne Rich',
  'Gayle Rubin', 'Eve Kosofsky Sedgwick', 'Kimberle Crenshaw', 'bell hooks',
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.obsidian') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(fullPath));
    if (entry.isFile() && entry.name.endsWith('.md')) out.push(fullPath);
  }
  return out;
}

function stripIndex(name) {
  return name.replace(/^\d+(?:_\d+)*\s+/, '').trim();
}

function stripMarkdown(text) {
  return text
    .replace(/<span[^>]*>/g, '')
    .replace(/<\/span>/g, '')
    .replace(/<strong>/g, '')
    .replace(/<\/strong>/g, '')
    .replace(/<em>/g, '')
    .replace(/<\/em>/g, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHeading(line, fallback) {
  return line?.startsWith('# ') ? line.slice(2).trim() : fallback;
}

function readFile(filePath) {
  const text = fs.readFileSync(filePath, utf8);
  const lines = text.split(/\r?\n/);
  const fallback = stripIndex(path.basename(filePath, '.md'));
  return { text, lines, heading: cleanHeading(lines[0], fallback) };
}

function kindOf(filePath) {
  const rel = filePath.slice(root.length + 1);
  if (/重要学者|Key Scholars/.test(rel)) return 'scholar';
  if (/重要文本|Key Texts/.test(rel)) return 'text';
  if (/重要概念|Key Concepts/.test(rel)) return 'concept';
  return 'topic';
}

function isBadTitle(title, kind) {
  if (genericTitleWords.test(title) || forbidden.test(title)) return true;
  if (kind === 'concept' && /：/.test(title)) return true;
  if (kind === 'text' && /^《[^》]+》/.test(title) && !/：/.test(title)) return false;
  return false;
}

function windowsSafeTitle(title) {
  return title
    .replace(/[<>:"/\\|?*：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pathKey(filePath) {
  return path.resolve(filePath).toLocaleLowerCase();
}

function scoreTerm(term, text, highlighted, currentTitle) {
  let score = 0;
  const index = text.indexOf(term);
  const isWeighted = weightedTerms.includes(term);
  if (index >= 0) score += isWeighted ? Math.max(1, 80 - Math.floor(index / 120)) : Math.max(1, 32 - Math.floor(index / 180));
  if (highlighted.includes(term)) score += isWeighted || currentTitle.includes(term) ? 30 : 8;
  if (currentTitle.includes(term)) score += 10;
  if (isWeighted) score += 35;
  if (term.length <= 2 && !currentTitle.includes(term) && !highlighted.includes(term)) score -= 28;
  if (index >= 0 && /(并不等于|不等于|不是|并非|未必|不能|不要|没有)[\u4e00-\u9fff，、]{0,8}$/.test(text.slice(Math.max(0, index - 18), index))) score -= 90;
  if (term.length >= 4) score += 8;
  if (weakTerms.has(term)) score -= 60;
  if (genericTitleWords.test(term) || forbidden.test(term)) score -= 100;
  return score;
}

function addTerm(map, term, weight = 0) {
  const cleaned = term
    .replace(/《[^》]+》/g, '')
    .replace(/[（(][A-Za-z][^）)]*[）)]/g, '')
    .replace(/[，,。：:；;、]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const isWeighted = weightedTerms.includes(cleaned);
  if (/[A-Za-z]/.test(cleaned)) return;
  if (!/[\u4e00-\u9fff]/.test(cleaned)) return;
  if (cleaned.length < 2 || cleaned.length > 10) return;
  if (genericTitleWords.test(cleaned) || forbidden.test(cleaned)) return;
  if (!isWeighted && /的/.test(cleaned)) return;
  if (!isWeighted && /与|和/.test(cleaned)) return;
  if (/[\d０-９]|年|世纪|页码|公元|约生|卒于/.test(cleaned)) return;
  if (/成为|作为|有时|后来|共同|一篇|轻巧|锋利|近代|研究|出魏晋|首先|因此|这里|这个|这种|所谓|可以|需要|问题|正文|文本|并不|不等于|未必|不能|不要|没有|谁|开始|改变|放在|私人趣味|脱离|进入|来自|通过|古典诗学|文学理论史|文学理论/.test(cleaned)) return;
  if (/^[的与和及在从为对则又也并但而其这那以于]/.test(cleaned)) return;
  if (/[的与和及在从为对则又也并但而其这那以于]$/.test(cleaned) && !isWeighted) return;
  if (/^\d/.test(cleaned)) return;
  map.set(cleaned, (map.get(cleaned) || 0) + weight);
}

function extractHighlighted(text) {
  return [...text.matchAll(/<span style="color:\s*#50946e;">([\s\S]*?)<\/span>/g)]
    .map(match => stripMarkdown(match[1]))
    .join(' ');
}

function splitChineseTerms(source) {
  return source
    .replace(/《[^》]+》/g, '')
    .replace(/[（(][A-Za-z][^）)]*[）)]/g, '')
    .replace(/的批评路径|的重要声音|的理论机制|的核心问题|的学术定位|理论贡献|核心文本|重要文本|重要声音/g, '')
    .split(/[、，,；;：:\s]+|与|和/)
    .map(item => item.trim())
    .filter(Boolean);
}

function oldCoreTerms(title, kind) {
  let source = title;
  if (kind === 'text') source = title.split(/[：:]/).pop() || '';
  if (kind === 'scholar') {
    source = title
      .replace(extractEnglishTail(title), '')
      .replace(/，[^，]*重要声音[\s\S]*$/, '')
      .replace(/[，,][^，,]*理论的生命语言[\s\S]*$/, '');
  }
  return splitChineseTerms(source);
}

function extractTerms(text, currentTitle, fallbackTitle, kind) {
  const highlighted = extractHighlighted(text);
  const sampleText = `${text.slice(0, 3600)} ${highlighted}`;
  const plain = stripMarkdown(sampleText);
  const map = new Map();

  for (const term of oldCoreTerms(currentTitle, kind)) addTerm(map, term, 75);
  for (const term of oldCoreTerms(fallbackTitle, kind)) addTerm(map, term, 65);
  for (const term of weightedTerms) {
    if (plain.includes(term) || currentTitle.includes(term) || fallbackTitle.includes(term)) addTerm(map, term, 35);
  }
  for (const match of sampleText.matchAll(/<strong>([\s\S]{2,60}?)<\/strong>/g)) addTerm(map, stripMarkdown(match[1]), 20);
  for (const match of sampleText.matchAll(/「([^」]{2,20})」/g)) addTerm(map, match[1], 18);
  for (const match of sampleText.matchAll(/([\u4e00-\u9fff]{2,12})[（(][A-Za-z][^）)]{2,80}[）)]/g)) addTerm(map, match[1], 16);
  for (const match of plain.matchAll(/([\u4e00-\u9fff]{2,8}(?:理论|方法|模型|概念|问题|结构|形式|制度|政治|经验|美学|诗学|修辞|叙事|话语|阅读|批评|文化|历史|记忆|身份|主体|语言|文本|世界|场域|资本|权力|意识|想象|转向|研究|论争|文学))/g)) {
    addTerm(map, match[1], 7);
  }
  for (const match of plain.matchAll(/([\u4e00-\u9fff]{2,8}(?:教育|表达|判断|灵感|权威|根据|理由|技艺|表演|听众|公共|经典|训练|风格|人格|德性|雄辩|感受|欲望|身体|边界|差异|记忆|档案|媒介|环境|算法|网络))/g)) {
    addTerm(map, match[1], 9);
  }

  const rows = [...map.keys()]
    .map(term => ({ term, score: scoreTerm(term, plain, highlighted, currentTitle) + map.get(term) }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || b.term.length - a.term.length);

  const selected = [];
  for (const row of rows) {
    if (selected.some(term => term.includes(row.term) || row.term.includes(term))) continue;
    selected.push(row.term);
    if (selected.length >= 4) break;
  }
  return selected;
}

function phraseFromTerms(terms, fallback) {
  const usable = terms.filter(term => !weakTerms.has(term)).slice(0, 3);
  if (usable.length >= 3) return `${usable[0]}、${usable[1]}与${usable[2]}`;
  if (usable.length === 2) return `${usable[0]}与${usable[1]}`;
  if (usable.length === 1) return usable[0];
  return fallback;
}

function normalizePhrase(phrase) {
  return phrase
    .replace(/文学理论/g, '')
    .replace(/的理论机制/g, '')
    .replace(/的批评路径/g, '')
    .replace(/的重要声音/g, '')
    .replace(/核心文本/g, '')
    .replace(/理论贡献/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[、，\s]+|[、，\s]+$/g, '')
    .trim();
}

function extractEnglishTail(text) {
  const cleaned = text.replace(/[（）()《》：:,，、]/g, ' ').replace(/\s+/g, ' ').trim();
  const matches = [...cleaned.matchAll(/[A-Z][A-Za-z.'-]*(?:\s+(?:[A-Z][A-Za-z.'-]*|and|of|the|de|du|van|von|la|le|K|M|E|P|B|W|J)){0,9}/g)]
    .map(match => match[0].trim())
    .filter(value => value.split(/\s+/).length <= 9);
  return matches.at(-1) || '';
}

function scholarName(heading, base, text) {
  const fromStrong = text.match(/<strong>([A-Z][A-Za-z .'\-]+)[（(][\u4e00-\u9fff·\s]+/);
  if (fromStrong) return fromStrong[1].trim();
  const candidates = [heading, base].map(extractEnglishTail).filter(Boolean);
  return candidates.at(-1) || extractEnglishTail(text.slice(0, 400));
}

function cleanEnglishWork(title) {
  let next = title
    .replace(/^and\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  for (const prefix of authorPrefixes) {
    const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i');
    next = next.replace(re, '');
  }
  const titleStart = next.match(/\b(?:The|A|An|On|Of|To|Toward|Towards|From|Against|Between|Bodies|Gender|Sexual|Visual|Compulsory|Mapping|Renaissance|Culture|Literary|Poetics|Mythologies|Orientalism|Discipline|Difference|Speculum|Room|Second|Laugh|Madwoman|Womens|Traffic|Resisting|Epistemology|Ain.?t|Writing|Can|What|Is|Are|In|After|World|Death|Archaeology|Order|Madness|Truth|Power|Reading|Reader|Work|Text|Theory|Interpretation|Acts|Novel|Signs|Course|Elements|Morphology|S\/?Z|Pleasure)\b/);
  if (titleStart && titleStart.index > 0) {
    const before = next.slice(0, titleStart.index).trim();
    if (/^(?:[A-Z][A-Za-z.'-]*|and|of|the|de|du|van|von|la|le|bell)\s*(?:\s+(?:[A-Z][A-Za-z.'-]*|and|of|the|de|du|van|von|la|le|bell)\s*){0,8}$/.test(before)) {
      next = next.slice(titleStart.index).trim();
    }
  }
  next = next.replace(/^(?:[A-Z][A-Za-z.'-]+|de|du|van|von|and)\s+(?:[A-Z][A-Za-z.'-]+|de|du|van|von|and)\s+(?=(?:The|A|An|On|Of|To|For|In|From|Against|Toward|Narrative|Structural|Mythologies|Orientalism|Discipline|Gender|Culture|Literary|Poetics|S Z)\b)/, '');
  return next.replace(/\s+/g, ' ').trim();
}

function workParts(heading, base, text) {
  const localSource = `${heading} ${base}`;
  const bodySource = text.slice(0, 1200);
  const source = localSource || bodySource;
  const cn = (source.match(/《([^》]{1,60})》/) || [])[1] || (bodySource.match(/《([^》]{1,60})》/) || [])[1] || '';
  let en = '';
  const direct = localSource.match(/《[^》]+》\s+([A-Z][A-Za-z0-9 .,'\-&/]+?)(?:：|$|\s{2,})/);
  if (direct) en = direct[1];
  const afterBook = localSource.match(/《[^》]+》[（(]([^）)]{2,120})[）)]/);
  if (afterBook) en = afterBook[1];
  if (!en) {
    const near = localSource.match(/《[^》]+》\s*([A-Z][A-Za-z0-9 .,'\-&]+?)(?:：|$|\s{2,})/);
    if (near) en = near[1];
  }
  if (!/[A-Za-z]/.test(en)) en = '';
  return { cn, en: cleanEnglishWork(en) };
}

function conceptParts(heading, base) {
  const source = `${heading} ${base}`;
  const paren = source.match(/([\u4e00-\u9fff·、，]{1,30})[（(]([A-Za-z][^）)]{1,80})[）)]/);
  if (paren) return { cn: paren[1].replace(/[，,、\s]+$/g, '').trim(), en: paren[2].trim() };
  const split = stripIndex(base).match(/^([\u4e00-\u9fff·、，]{1,30})\s+([A-Za-z][\s\S]*)$/);
  if (split) return { cn: split[1].trim(), en: split[2].trim() };
  return { cn: stripIndex(base), en: '' };
}

function normalizeTopicTitle(base, heading) {
  let title = stripIndex(base || heading);
  title = title
    .replace(/^文学理论中的/, '')
    .replace(/\s+in Literary Theory\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return title;
}

function titleFor(filePath, data) {
  const kind = kindOf(filePath);
  const base = stripIndex(path.basename(filePath, '.md'));
  const current = data.heading;
  const terms = extractTerms(data.text, current, base, kind);

  if (kind === 'concept') {
    const { cn, en } = conceptParts(current, base);
    return en ? `${cn}（${en}）` : cn;
  }

  if (kind === 'scholar') {
    const name = scholarName(current, base, data.text);
    const fallback = phraseFromTerms(oldCoreTerms(current, kind), '理论方法与批评问题');
    const phrase = normalizePhrase(phraseFromTerms(terms, fallback));
    return `${name}：${phrase}`;
  }

  if (kind === 'text') {
    const { cn, en } = workParts(current, base, data.text);
    const fallback = phraseFromTerms(oldCoreTerms(current, kind), '');
    const phrase = normalizePhrase(phraseFromTerms(terms, fallback || '文本方法与问题结构'));
    if (cn && en) return `《${cn}》 ${en}：${phrase}`;
    if (cn) return `《${cn}》：${phrase}`;
    return `${normalizeTopicTitle(base, current)}：${phrase}`;
  }

  return normalizeTopicTitle(base, current);
}

function needsChange(filePath, oldTitle, newTitle) {
  const kind = kindOf(filePath);
  const base = stripIndex(path.basename(filePath, '.md'));
  if (isCleanScopedTitle(filePath, oldTitle)) return false;
  if (oldTitle !== newTitle) return true;
  if (windowsSafeTitle(newTitle) !== base) return true;
  return isBadTitle(oldTitle, kind);
}

function isCleanScopedTitle(filePath, oldTitle) {
  const kind = kindOf(filePath);
  if (!scopedKinds.has(kind)) return false;
  if (isBadTitle(oldTitle, kind)) return false;
  const base = stripIndex(path.basename(filePath, '.md'));
  if (windowsSafeTitle(oldTitle) !== base) return false;
  if (kind === 'text') return /^《[^》]+》(?:\s+[A-Z][A-Za-z0-9 .,'\-&/]+)?：[\u4e00-\u9fff、，／]+$/.test(oldTitle);
  if (kind === 'scholar') return /^[A-Za-z][A-Za-z .'\-]+：[\u4e00-\u9fff、，／]+$/.test(oldTitle);
  return false;
}

function insertCollisionTag(title, tag, index) {
  const suffix = index > 0 ? `${tag}${index + 1}` : tag;
  if (title.includes(suffix)) return title;
  if (title.includes('：')) {
    const [left, right] = title.split(/：(.+)/);
    return `${left}：${right}${suffix}`;
  }
  return `${title}${suffix}`;
}

function collisionTag(item) {
  const source = `${item.oldTitle} ${path.basename(item.oldPath, '.md')}`;
  for (const tag of ['案例证据', '论争', '方法', '阅读', '历史', '政治', '文本', '补充']) {
    if (source.includes(tag)) return tag;
  }
  return '补充';
}

const files = walk(root);
const scopedKinds = new Set(['text', 'scholar']);
const scopedFiles = files.filter(filePath => scopedKinds.has(kindOf(filePath)));
const rawPlans = [];

for (const filePath of scopedFiles) {
  const kind = kindOf(filePath);
  const data = readFile(filePath);
  const newTitle = titleFor(filePath, data);
  if (!newTitle || forbidden.test(newTitle)) continue;
  if (!needsChange(filePath, data.heading, newTitle)) continue;
  rawPlans.push({
    oldPath: filePath,
    oldTitle: data.heading,
    newTitle,
    newPath: path.join(path.dirname(filePath), `${windowsSafeTitle(newTitle)}.md`),
    kind,
  });
}

const occupied = new Map(files.map(filePath => [pathKey(filePath), filePath]));
const groups = new Map();
for (const item of rawPlans) {
  const key = pathKey(item.newPath);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(item);
}

const plans = [];
const conflicts = [];

for (const items of groups.values()) {
  for (const item of items) {
    let finalTitle = item.newTitle;
    let finalPath = item.newPath;
    let index = 0;
    while (occupied.has(pathKey(finalPath)) && pathKey(occupied.get(pathKey(finalPath))) !== pathKey(item.oldPath) && index < 20) {
      finalTitle = insertCollisionTag(item.newTitle, collisionTag(item), index);
      finalPath = path.join(path.dirname(item.newPath), `${windowsSafeTitle(finalTitle)}.md`);
      index += 1;
    }
    const owner = occupied.get(pathKey(finalPath));
    if (owner && pathKey(owner) !== pathKey(item.oldPath)) {
      conflicts.push({ ...item, newTitle: finalTitle, newPath: finalPath, conflictsWith: owner });
      continue;
    }
    occupied.delete(pathKey(item.oldPath));
    occupied.set(pathKey(finalPath), item.oldPath);
    plans.push({ ...item, newTitle: finalTitle, newPath: finalPath });
  }
}

if (write) {
  for (const item of plans) {
    const data = readFile(item.oldPath);
    if (data.lines[0]?.startsWith('# ')) {
      data.lines[0] = `# ${item.newTitle}`;
      fs.writeFileSync(item.oldPath, data.lines.join('\n'), utf8);
    }
  }

  const moves = plans
    .filter(item => pathKey(item.oldPath) !== pathKey(item.newPath))
    .map((item, index) => ({
      ...item,
      tempPath: path.join(path.dirname(item.oldPath), `.codex-literary-title-${process.pid}-${index}.md`),
    }));

  for (const move of moves) fs.renameSync(move.oldPath, move.tempPath);
  for (const move of moves) fs.renameSync(move.tempPath, move.newPath);
}

const counts = plans.reduce((acc, item) => {
  acc[item.kind] = (acc[item.kind] || 0) + 1;
  return acc;
}, {});

const badNewTitlePattern = /如何|怎样|为什么|把|了|一门|一种|不是[\s\S]{0,8}而是|写成|让|批评路径|重要声音|核心文本|理论贡献|学术贡献|方法贡献|谁|开始|改变|放在|公元|世纪|页码|论文「/;
const checks = {
  badNewTitles: plans.filter(item => badNewTitlePattern.test(item.newTitle)).slice(0, 100),
  overlongNewTitles: plans.filter(item => (item.newTitle.split('：').pop() || item.newTitle).length > 24).slice(0, 100),
  unscopedKinds: plans.filter(item => !scopedKinds.has(item.kind)).slice(0, 100),
};

const report = {
  mode: write ? 'write' : 'dry-run',
  totalFiles: files.length,
  scopedFiles: scopedFiles.length,
  planned: plans.length,
  conflicts: conflicts.length,
  byKind: counts,
  checks,
  samples: plans.slice(0, 80),
  conflictSamples: conflicts.slice(0, 50),
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, utf8);
console.log(JSON.stringify(report, null, 2));
