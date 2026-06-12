import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(toolDir, '..');
const repoRoot = path.resolve(outputDir, '..', '..');

const sourceMarkdownPath = path.join(
  repoRoot,
  '澜景市项目',
  'CHUANDI SHIJIESHU',
  '澜景市世界书编写稿_WB001-WB302.md',
);
const sourceJsonPath = path.join(repoRoot, '澜景市项目', '澜景市0604.json');
const sourcePersonaDir = path.join(repoRoot, '澜景市人设');
const extraPersonaFiles = [path.join(repoRoot, '玥明人设.txt')];
const sourceAddressDir = path.join(repoRoot, '地址');

const mojibakePattern = /[ÃÂâæéåäçèœžŸ™€]/;
const unreadableTextPattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/;
const invalidPathChars = /[<>:"/\\|?*\u0000-\u001f]/g;
const auditSectionPatterns = [
  /^\s*#{0,6}\s*第[三3]部分\s*[：:]\s*备注.*$/im,
  /^\s*第[三3]部分\s*[：:]\s*备注.*$/im,
  /^\s*=+\s*审核备注.*$/im,
  /^\s*=+\s*备注.*$/im,
];
const minorSexualLinePattern =
  /罩杯|私处|性器|性爱|做爱|下体|阴蒂|阴道|阳具|勃起|射精|乳头|揉胸|舌吻|裸体|裸露|无毛发|裙底|性癖|CNC|奴隶/i;

function repairMojibake(value) {
  if (typeof value === 'string') {
    if (!mojibakePattern.test(value)) return value;
    return Buffer.from(value, 'latin1').toString('utf8');
  }
  if (Array.isArray(value)) return value.map(repairMojibake);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repairMojibake(item)]),
    );
  }
  return value;
}

function splitKeys(raw) {
  if (!raw) return [];
  return raw
    .replace(/^`|`$/g, '')
    .split(/[，,]/)
    .map(key => key.trim())
    .filter(key => key && key !== '空');
}

function parseNumber(raw, fallback) {
  const match = String(raw ?? '').match(/-?\d+/);
  return match ? Number(match[0]) : fallback;
}

function safeFileName(raw, fallback) {
  const base = String(raw || fallback)
    .replace(invalidPathChars, '_')
    .replace(/\s+/g, '_')
    .replace(/\.+$/g, '')
    .slice(0, 72);
  return base || fallback;
}

function cleanControlCharacters(text) {
  return String(text).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/g, '');
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values.flat(Infinity)) {
    const text = String(value ?? '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

function arrayFromUnknown(value) {
  if (Array.isArray(value)) return value.flatMap(item => splitKeys(String(item)));
  if (typeof value === 'string') return splitKeys(value);
  return [];
}

function readTextFileAuto(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }

  const sampleSize = Math.min(buffer.length, 4096);
  let oddNuls = 0;
  let evenNuls = 0;
  for (let index = 0; index < sampleSize; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index % 2 === 0) evenNuls += 1;
    else oddNuls += 1;
  }
  if (oddNuls > sampleSize * 0.2 && evenNuls < sampleSize * 0.02) {
    return buffer.toString('utf16le');
  }

  const utf8 = buffer.toString('utf8');
  if (!utf8.includes('\uFFFD')) return utf8;
  return buffer.toString('latin1');
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function isSystemDepth(positionHint) {
  return /强约束|作者注释|D0/.test(String(positionHint || ''));
}

function insertionPositionFromHint(positionHint) {
  const hint = String(positionHint || '');
  if (isSystemDepth(hint)) {
    return { type: '指定深度', role: '系统', depth: 0 };
  }
  if (/角色定义后/.test(hint)) return { type: '角色定义之后' };
  return { type: '角色定义之前' };
}

function insertionPositionFromSource(position) {
  if (Number(position) === 1) return { type: '角色定义之后' };
  return { type: '角色定义之前' };
}

function parseMarkdownWorldbook(md) {
  const headingPattern = /^## WB-(\d{3})\s+(.+)$/gm;
  const headings = [...md.matchAll(headingPattern)];

  return headings.map((heading, index) => {
    const id = heading[1];
    const title = heading[2].trim();
    const start = heading.index;
    const end = index + 1 < headings.length ? headings[index + 1].index : md.length;
    const block = md.slice(start, end);
    const codeBlocks = [...block.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)].map(match => match[1]);
    const content = codeBlocks.join('\n\n').trim();

    const keyHint = (block.match(/key(?: 建议)?：`?([^\n`]+)`?/i) || [])[1] || '';
    const typeHint = (block.match(/类型：([^\n]+)/) || [])[1] || '';
    const configHint = (block.match(/配置建议：([^\n]+)/) || [])[1] || '';
    const positionHint = (block.match(/位置建议：([^\n]+)/) || [])[1] || '';
    const orderHint = (block.match(/顺序建议：([^\n]+)/) || [])[1] || '';

    const constant = /蓝灯|常驻/.test(configHint) || /常驻层/.test(typeHint);
    return {
      kind: 'rule',
      id: `WB${id}`,
      name: `WB-${id} ${title}`,
      fileBase: `WB${id}_${safeFileName(title, `WB${id}`)}`,
      folder: '00_规则层',
      content,
      enabled: true,
      activation: {
        type: constant ? '蓝灯' : '绿灯',
        keys: splitKeys(keyHint),
        scanDepth: 1,
      },
      insertion: insertionPositionFromHint(positionHint),
      order: parseNumber(orderHint, constant ? Number(id) : 100 + Number(id)),
      recursive: true,
      probability: 100,
      source: '澜景市世界书编写稿_WB001-WB302.md',
      skipped: !content,
    };
  });
}

function classifyCityEntry(entry) {
  const comment = String(entry.comment || '');
  const order = parseNumber(entry.order, 100);

  if (entry.constant || order <= 1) return '01_城市总纲';
  if (/区$|街道$/.test(comment) || order <= 3) return '02_行政区街道';
  if (/详情$|店内|站内|住宿|网点|内部/.test(comment) || order >= 5) return '04_设施详情';
  return '03_地点设施';
}

function cityEntryName(entry, serial) {
  const comment = String(entry.comment || `城市条目${serial}`);
  return `LJ|city|${String(serial).padStart(4, '0')}|${comment}`;
}

function normalizeCityEntry(entry, oldId, serial) {
  const folder = classifyCityEntry(entry);
  const keys = Array.isArray(entry.key) ? entry.key.map(String).filter(Boolean) : [];
  const constant = Boolean(entry.constant);
  const sourceOrder = parseNumber(entry.order, 100);
  const order = constant ? 20 + serial : sourceOrder;
  const comment = String(entry.comment || `城市地点库${serial}`);

  return {
    kind: 'city',
    oldId,
    id: `LJ${String(serial).padStart(4, '0')}`,
    name: cityEntryName(entry, serial),
    fileBase: `${String(serial).padStart(4, '0')}_${safeFileName(comment, `LJ${serial}`)}`,
    folder,
    content: String(entry.content || '').trim(),
    enabled: !entry.disable,
    activation: {
      type: constant ? '蓝灯' : '绿灯',
      keys,
      scanDepth: parseNumber(entry.scanDepth, 1),
    },
    insertion: insertionPositionFromSource(entry.position),
    order,
    recursive: true,
    probability: parseNumber(entry.probability, 100),
    source: '澜景市0604.json',
    skipped: !String(entry.content || '').trim(),
  };
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(item => {
      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) return listJsonFiles(itemPath);
      if (!item.isFile() || !/\.json$/i.test(item.name)) return [];
      return [itemPath];
    })
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

function listUniqueAddressFiles(dir) {
  const hashes = new Map();
  const files = [];
  let duplicateFiles = 0;
  for (const filePath of listJsonFiles(dir)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (hashes.has(hash)) {
      duplicateFiles += 1;
      continue;
    }
    hashes.set(hash, filePath);
    files.push(filePath);
  }
  return { files, duplicateFiles };
}

function stripParentheticalName(name) {
  return String(name || '')
    .replace(/[（(].*?[）)]/g, '')
    .trim();
}

function characterAliases(characterNames) {
  return uniqueStrings(
    characterNames.flatMap(name => {
      const stripped = stripParentheticalName(name);
      return [stripped, name];
    }),
  )
    .filter(name => name.length >= 2)
    .map(name => ({ name, pattern: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u') }));
}

function inferAddressCharacters(filePath, entry, content, knownCharacterNames) {
  const haystack = `${path.basename(filePath)}\n${entry.comment || ''}\n${content}`.replace(/\s+/g, '');
  const found = characterAliases(knownCharacterNames)
    .map(({ name, pattern }) => {
      const match = haystack.match(pattern);
      return match ? { name: stripParentheticalName(name), index: match.index ?? 0 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index)
    .map(item => item.name);
  if (found.length) return uniqueStrings(found);

  const fallback = path
    .basename(filePath, path.extname(filePath))
    .replace(/^\s*[-_]\s*/, '')
    .replace(/\s*\(\d+\)\s*$/u, '')
    .replace(/(?:的)?(?:地址|地点|住址).*$/u, '')
    .split(/[、，,&＆+＋和\s]+/u)
    .map(part => part.trim())
    .filter(part => part && !/花店|咖啡|酒吧|住宅|小区|公寓|地点|地址|住址/.test(part));
  return fallback.length ? uniqueStrings(fallback) : ['地址'];
}

function inferAddressTitle(entry, content, serial) {
  const comment = String(entry.comment || '').trim();
  if (comment) return comment;

  const tag = (content.match(/^<([^>]+)>/m) || [])[1];
  if (tag) return tag.replace(/^scene_/i, '').trim();

  const line = content
    .split('\n')
    .map(item => item.trim())
    .find(item => item && !/^<\/?[^>]+>$/.test(item));
  return (line || `地址条目${serial}`).replace(/[:：]\s*$/u, '').trim();
}

function cleanAddressTitle(rawTitle, people, content) {
  let title = String(rawTitle || '')
    .replace(/^scene_/i, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, '')
    .replace(/[:：]\s*$/u, '')
    .trim();

  for (const person of people) {
    title = title
      .replace(new RegExp(`^${person.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}的?`, 'u'), '')
      .trim();
  }

  const titleLooksFacility =
    /花店|咖啡|酒吧|餐厅|茶餐厅|便利店|加油站|医院|发廊|大学|基地|俱乐部|公园|赛车场|公司|店/.test(title);
  const hasResidenceBlock =
    /<[^>]*(?:的家|住所|住址|住宅|号房详情|户详情)[^>]*>|类型\s*[：:]\s*住宅|居住者|独居|阁楼居住空间/.test(
      content,
    );
  const titleLooksResidential =
    /住宅|住址|住所|号房|户详情|别墅$|(?:小区|花园|社区|公寓|家园|雅苑).*(?:\d|栋|室|户|号房)/.test(title);
  const isResidence =
    hasResidenceBlock || titleLooksResidential || /家\）|家\)|别墅（.*家/.test(content);

  if (isResidence) {
    title = title.replace(/^(住宅|住址|住所)/u, '').trim();
    if (titleLooksFacility && hasResidenceBlock) return `住址＋${title || rawTitle}`;
    return `住址_${title || rawTitle}`;
  }

  return title || rawTitle;
}

function inferLocationKeywords(text) {
  const keywords = [];
  for (const match of text.matchAll(/(?:位置|地址)\s*[：:]\s*([^\n]+)/gu)) {
    keywords.push(match[1]);
  }
  for (const match of text.matchAll(/类型\s*[：:]\s*([^\n,，]+)/gu)) {
    keywords.push(match[1]);
  }
  keywords.push(
    ...(text.match(
      /[\u4e00-\u9fa5A-Za-z0-9'’.-]+(?:区|街道|路|巷|小区|花园|公寓|社区|大学|酒吧|咖啡厅|茶餐厅|花店|医院|发廊|俱乐部|基地|公园|赛车场|便利店|加油站|别墅|号房|户|号|店|公司)/gu,
    ) || []),
  );
  return keywords
    .flatMap(item => String(item).split(/[·・,，、;；\s]+/u))
    .map(item => item.replace(/附近|中段|上段|下段|西侧|东侧|南段|北段|尽头|临湖侧|上$/u, '').trim())
    .filter(item => item.length >= 2 && item.length <= 24);
}

function addressKeywords(entry, people, rawTitle, cleanTitle, content) {
  const contentText = `${rawTitle}\n${cleanTitle}\n${content}`;
  const keys = uniqueStrings([
    arrayFromUnknown(entry.key),
    arrayFromUnknown(entry.keysecondary),
    people,
    rawTitle,
    cleanTitle,
    cleanTitle.replace(/^住址_/u, ''),
    (content.match(/^<([^>]+)>/m) || [])[1]?.replace(/^scene_/i, ''),
    inferLocationKeywords(contentText),
  ]);
  return keys.slice(0, 24);
}

function classifyAddressEntry(entry, rawTitle, cleanTitle, content) {
  const tag = (content.match(/^<([^>]+)>/m) || [])[1] || '';
  const titleText = `${rawTitle}\n${cleanTitle}\n${tag}`;
  if (/住址[_＋]|详情|店内|院内|内部|房详情|户详情/.test(titleText)) {
    return '04_设施详情';
  }
  if (parseNumber(entry.order, 4) === 5 && /秘密基地|私宅|私人/.test(titleText)) {
    return '04_设施详情';
  }
  return '03_地点设施';
}

function normalizeAddressEntry(entry, filePath, oldId, serial, knownCharacterNames) {
  const rawContent = cleanControlCharacters(String(entry.content || '').trim());
  const commentContent = cleanControlCharacters(String(entry.comment || '').trim());
  const content = rawContent || commentContent;
  const rawTitle = inferAddressTitle(entry, content, serial);
  const people = inferAddressCharacters(filePath, entry, content, knownCharacterNames);
  const cleanTitle = cleanAddressTitle(rawTitle, people, content);
  const folder = classifyAddressEntry(entry, rawTitle, cleanTitle, content);
  const entryName = `${people.join('_')}_${cleanTitle}`;

  return {
    kind: 'address',
    oldId,
    id: `ADDR${String(serial).padStart(3, '0')}`,
    name: entryName,
    fileBase: `A${String(serial).padStart(3, '0')}_${safeFileName(entryName, `ADDR${serial}`)}`,
    folder,
    content,
    enabled: !entry.disable,
    activation: {
      type: '绿灯',
      keys: addressKeywords(entry, people, rawTitle, cleanTitle, content),
      scanDepth: parseNumber(entry.scanDepth, 1),
    },
    insertion: insertionPositionFromSource(entry.position),
    order: folder === '04_设施详情' ? 5 : 4,
    recursive: true,
    probability: parseNumber(entry.probability, 100),
    source: path.relative(repoRoot, filePath),
    skipped: !content,
  };
}

function readAddressEntries(knownCharacterNames) {
  const { files, duplicateFiles } = listUniqueAddressFiles(sourceAddressDir);
  const entries = files.flatMap(filePath => {
    const source = JSON.parse(readTextFileAuto(filePath));
    return Object.entries(source.entries || {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([oldId, entry]) => ({ filePath, oldId, entry }));
  });
  const normalized = entries
    .map(({ filePath, oldId, entry }, index) =>
      normalizeAddressEntry(entry, filePath, oldId, index + 1, knownCharacterNames),
    )
    .filter(entry => !entry.skipped);

  return { entries: normalized, duplicateFiles };
}

function listPersonaFiles(dir) {
  const files = fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap(item => {
          const itemPath = path.join(dir, item.name);
          if (item.isDirectory()) return listPersonaFiles(itemPath);
          if (!item.isFile()) return [];
          if (!/\.(txt|md)$/i.test(item.name)) return [];
          return [itemPath];
        })
    : [];

  return uniqueStrings([...files, ...extraPersonaFiles.filter(filePath => fs.existsSync(filePath))]).sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  );
}

function stripAuditNotes(content) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const cutPoints = auditSectionPatterns
    .map(pattern => {
      const match = normalized.match(pattern);
      return match?.index ?? -1;
    })
    .filter(index => index >= 0);

  const withoutAudit = cutPoints.length ? normalized.slice(0, Math.min(...cutPoints)) : normalized;
  return withoutAudit
    .split('\n')
    .filter(line => !/^\s*```(?:yaml|text|json)?\s*$/i.test(line))
    .join('\n')
    .trim();
}

function inferPersonaName(content, filePath) {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  for (const line of lines.slice(0, 80)) {
    let match = line.match(/^#\s*(.+)$/);
    if (match && !/^说明|^格式|^地点|^注意/.test(match[1])) {
      return match[1]
        .replace(/\s*[-—_]\s*(?:大世界)?人设.*$/u, '')
        .replace(/\s*[-—_]\s*角色档案.*$/u, '')
        .replace(/\s*(?:大世界人设|人设|角色档案).*$/u, '')
        .trim();
    }

    match = line.match(/^=+\s*(.+?)\s*=+$/);
    if (match) {
      const name = match[1]
        .replace(/[·\-—_]\s*(?:角色档案|大世界人设).*$/u, '')
        .replace(/\s*(?:角色档案|大世界人设).*$/u, '')
        .trim();
      if (name && !/审核备注|备注/.test(name)) return name;
    }

    match = line.match(/^<(.+?)(?:单人设定|人设|角色档案)>$/);
    if (match) return match[1].trim();

    match = line.match(/^\s*姓名\s*[：:]\s*(.+?)\s*$/);
    if (match) return match[1].trim();
  }

  return path
    .basename(filePath, path.extname(filePath))
    .replace(/^#\s*/, '')
    .replace(/\s*[-—_]\s*(?:大世界)?人设.*$/u, '')
    .replace(/(?:人设|角色档案)$/u, '')
    .trim();
}

function isMinorPersona(content) {
  return /年龄\s*[：:]\s*(?:1[0-7]|十[一二三四五六七]|十六|十七)\s*岁/.test(content);
}

function sanitizePersonaContent(content) {
  const minor = isMinorPersona(content);
  if (!minor) return { content, removedSensitiveLines: 0 };

  let removedSensitiveLines = 0;
  const sanitized = content
    .split('\n')
    .filter(line => {
      const shouldRemove = minorSexualLinePattern.test(line);
      if (shouldRemove) removedSensitiveLines += 1;
      return !shouldRemove;
    })
    .join('\n')
    .trim();

  return { content: sanitized, removedSensitiveLines };
}

function normalizePersonaEntry(filePath, serial) {
  const raw = cleanControlCharacters(readTextFileAuto(filePath));
  const withoutAudit = stripAuditNotes(raw);
  const { content, removedSensitiveLines } = sanitizePersonaContent(withoutAudit);
  const name = inferPersonaName(content || withoutAudit || raw, filePath);
  const fileBase = `${String(serial).padStart(3, '0')}_${safeFileName(name, `角色人设${serial}`)}`;

  return {
    kind: 'persona',
    id: `CHAR${String(serial).padStart(3, '0')}`,
    name: `LJ|character|${String(serial).padStart(3, '0')}|${name}`,
    characterName: name,
    fileBase,
    folder: '05_角色人设',
    content,
    enabled: false,
    activation: {
      type: '蓝灯',
      keys: [],
      scanDepth: 1,
    },
    insertion: { type: '角色定义之前' },
    order: 99,
    recursive: true,
    probability: 100,
    source: path.relative(repoRoot, filePath),
    skipped: !content,
    removedAudit: raw.trim().length !== withoutAudit.trim().length,
    removedSensitiveLines,
  };
}

function yamlEntry(entry) {
  const lines = [
    `      - 名称: ${yamlQuote(entry.name)}`,
    `        启用: ${entry.enabled ? 'true' : 'false'}`,
    '        激活策略:',
    `          类型: ${entry.activation.type}`,
  ];

  if (entry.activation.type === '绿灯') {
    lines.push('          关键字:');
    for (const key of entry.activation.keys) {
      lines.push(`            - ${yamlQuote(key)}`);
    }
  }

  lines.push(`          扫描深度: ${entry.activation.scanDepth || 1}`);
  lines.push('        插入位置:');
  lines.push(`          类型: ${entry.insertion.type}`);
  if (entry.insertion.type === '指定深度') {
    lines.push(`          角色: ${entry.insertion.role}`);
    lines.push(`          深度: ${entry.insertion.depth}`);
  }
  lines.push(`          顺序: ${entry.order}`);
  lines.push(`        激活概率: ${entry.probability}`);
  lines.push('        递归:');
  lines.push('          不可被其他条目激活: true');
  lines.push('          不可激活其他条目: true');
  lines.push(`        文件: 世界书/${entry.folder}/${entry.fileBase}`);
  return lines.join('\n');
}

function groupedEntries(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.folder)) groups.set(entry.folder, []);
    groups.get(entry.folder).push(entry);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
}

function writeTextFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${cleanControlCharacters(content).trim()}\n`, 'utf8');
}

function cleanGeneratedProject() {
  if (!fs.existsSync(outputDir)) return;
  for (const name of ['index.yaml', 'README.md', '合并报告.md', '条目索引.md']) {
    const target = path.join(outputDir, name);
    if (fs.existsSync(target)) fs.rmSync(target, { force: true });
  }
  const worldbookDir = path.join(outputDir, '世界书');
  if (fs.existsSync(worldbookDir)) fs.rmSync(worldbookDir, { recursive: true, force: true });
}

function containsMojibake(entries) {
  return entries.some(
    entry => unreadableTextPattern.test(entry.content) || unreadableTextPattern.test(entry.name),
  );
}

function main() {
  const md = fs.readFileSync(sourceMarkdownPath, 'utf8');
  const sourceBook = repairMojibake(JSON.parse(fs.readFileSync(sourceJsonPath, 'utf8')));

  const mdEntries = parseMarkdownWorldbook(md);
  const ruleEntries = mdEntries.filter(entry => !entry.skipped);
  const skippedMdEntries = mdEntries.filter(entry => entry.skipped);

  const cityEntries = Object.entries(sourceBook.entries || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([oldId, entry], index) => normalizeCityEntry(entry, oldId, index + 1))
    .filter(entry => !entry.skipped);

  const personaEntries = listPersonaFiles(sourcePersonaDir)
    .map((filePath, index) => normalizePersonaEntry(filePath, index + 1))
    .filter(entry => !entry.skipped);
  const { entries: addressEntries, duplicateFiles: duplicateAddressFiles } = readAddressEntries(
    personaEntries.map(entry => entry.characterName),
  );

  const entries = [...ruleEntries, ...cityEntries, ...addressEntries, ...personaEntries];

  cleanGeneratedProject();

  for (const entry of entries) {
    writeTextFile(path.join(outputDir, '世界书', entry.folder, `${entry.fileBase}.txt`), entry.content);
  }

  const indexLines = [
    '# yaml-language-server: $schema=https://testingcf.jsdelivr.net/gh/StageDog/tavern_sync/dist/schema/worldbook.zh.json',
    '世界书名称: 澜景市整合世界书',
    '条目:',
  ];

  for (const [folder, folderEntries] of groupedEntries(entries)) {
    indexLines.push(`  - 文件夹: ${folder}`);
    indexLines.push('    条目:');
    for (const entry of folderEntries) {
      indexLines.push(yamlEntry(entry));
    }
  }

  writeTextFile(path.join(outputDir, 'index.yaml'), indexLines.join('\n'));

  const indexTable = [
    '# 澜景市整合世界书条目索引',
    '',
    '| 分组 | 名称 | 激活 | key | 顺序 | 文件 | 来源 |',
    '| --- | --- | --- | --- | ---: | --- | --- |',
    ...entries.map(entry => {
      const keyText = entry.activation.keys.join(', ').replace(/\|/g, '\\|');
      const enabledText = entry.enabled ? entry.activation.type : `${entry.activation.type}/禁用`;
      return `| ${entry.folder} | ${entry.name.replace(/\|/g, '\\|')} | ${enabledText} | ${keyText} | ${entry.order} | 世界书/${entry.folder}/${entry.fileBase}.txt | ${entry.source} |`;
    }),
  ];
  writeTextFile(path.join(outputDir, '条目索引.md'), indexTable.join('\n'));

  const constantCount = entries.filter(entry => entry.activation.type === '蓝灯').length;
  const triggeredCount = entries.length - constantCount;
  const disabledPersonaCount = personaEntries.filter(entry => !entry.enabled).length;
  const removedAuditCount = personaEntries.filter(entry => entry.removedAudit).length;
  const addressFacilityCount = addressEntries.filter(entry => entry.folder === '03_地点设施').length;
  const addressDetailCount = addressEntries.filter(entry => entry.folder === '04_设施详情').length;
  const folderSummary = groupedEntries(entries)
    .map(([folder, folderEntries]) => `- ${folder}: ${folderEntries.length} 条`)
    .join('\n');

  const report = [
    '# 澜景市整合世界书合并报告',
    '',
    '## 合并来源',
    '',
    `- 规则层：\`${path.relative(outputDir, sourceMarkdownPath)}\``,
    `- 城市地点库：\`${path.relative(outputDir, sourceJsonPath)}\``,
    `- 角色地址：\`${path.relative(outputDir, sourceAddressDir)}\``,
    `- 角色人设：\`${path.relative(outputDir, sourcePersonaDir)}\``,
    '',
    '## 输出结构',
    '',
    '- `index.yaml`: tavern_sync 独立世界书源码索引。',
    '- `世界书/00_规则层`: 从 WB 编写稿抽取的规则、模板和触发器。',
    '- `世界书/01_城市总纲`: 交通、自然地理、城市总览等常驻设定。',
    '- `世界书/02_行政区街道`: 区域和街道条目。',
    '- `世界书/03_地点设施`: 地点、店铺、公共设施条目。',
    '- `世界书/04_设施详情`: 店内、站内、住宿、网点等细节条目。',
    '- `世界书/05_角色人设`: 清洗审核备注后的角色人设条目。',
    '',
    '## 条目统计',
    '',
    `- 总条目数：${entries.length}`,
    `- WB 规则层条目：${ruleEntries.length}`,
    `- 城市地点库条目：${cityEntries.length}`,
    `- 角色地址条目：${addressEntries.length}`,
    `- 角色地址进入地点设施：${addressFacilityCount}`,
    `- 角色地址进入设施详情：${addressDetailCount}`,
    `- 角色人设条目：${personaEntries.length}`,
    `- 蓝灯常驻条目：${constantCount}`,
    `- 绿灯触发条目：${triggeredCount}`,
    `- 默认禁用人设条目：${disabledPersonaCount}`,
    '',
    folderSummary,
    '',
    '## 规则处理',
    '',
    '- 遵循 AGENTS.md -> CLAUDE.md 指向的项目规则，并参考 `src/八班制学院` 与 8bit 独立世界书源码结构。',
    '- 所有条目统一设置：不可被其他条目激活 + 不可激活其他条目。',
    '- `澜景市0604.json` 已修复 UTF-8 被错误读取导致的乱码后再拆分成正文文件。',
    '- `地址/*.json` 已按内容哈希去重；地址条目名统一为 `人物名_地点名`，未写关键词的条目已根据人物、地点名、位置、类型和正文补充关键词。',
    '- WB-001、WB-002 等强约束条目按 `指定深度 / 系统 / 深度0` 放置；普通大世界观放角色定义前；角色、事件和地点到达类规则放角色定义后。',
    '- 角色人设条目统一设为 `启用: false`、`激活策略: 蓝灯`、`插入位置: 角色定义之前`、`顺序: 99`。',
    `- 已移除审核/备注段的人设文件：${removedAuditCount} 个。`,
    '',
    '## 注意',
    '',
    skippedMdEntries.length
      ? `- Markdown 中有 ${skippedMdEntries.length} 个 WB 标题未抽到正文，已跳过：${skippedMdEntries.map(entry => entry.id).join('、')}`
      : '- Markdown 中所有 WB 标题均已抽取正文。',
    duplicateAddressFiles ? `- 地址来源中有 ${duplicateAddressFiles} 个完全重复 JSON 文件，已跳过去重。` : '- 地址来源未发现完全重复 JSON 文件。',
    `- 仍含疑似乱码：${containsMojibake(entries) ? '是' : '否'}`,
    '',
  ];
  writeTextFile(path.join(outputDir, '合并报告.md'), report.join('\n'));

  const readme = [
    '# 澜景市整合世界书',
    '',
    '这是由 `澜景市世界书编写稿_WB001-WB302.md` 与 `澜景市0604.json` 整合出的 tavern_sync 独立世界书源码项目。',
    '',
    '入口文件：',
    '',
    '- `index.yaml`',
    '',
    '正文文件：',
    '',
    '- `世界书/00_规则层`',
    '- `世界书/01_城市总纲`',
    '- `世界书/02_行政区街道`',
    '- `世界书/03_地点设施`',
    '- `世界书/04_设施详情`',
    '- `世界书/05_角色人设`',
    '',
    '维护辅助：',
    '',
    '- `合并报告.md`',
    '- `条目索引.md`',
    '',
  ];
  writeTextFile(path.join(outputDir, 'README.md'), readme.join('\n'));

  console.log(
    JSON.stringify(
      {
        outputDir,
        entries: entries.length,
        ruleEntries: ruleEntries.length,
        cityEntries: cityEntries.length,
        addressEntries: addressEntries.length,
        addressFacilityEntries: addressFacilityCount,
        addressDetailEntries: addressDetailCount,
        duplicateAddressFilesSkipped: duplicateAddressFiles,
        personaEntries: personaEntries.length,
        disabledPersonaEntries: disabledPersonaCount,
        removedAuditPersonaFiles: removedAuditCount,
        skippedMarkdownEntries: skippedMdEntries.map(entry => entry.id),
        mojibakeRemaining: containsMojibake(entries),
      },
      null,
      2,
    ),
  );
}

main();
