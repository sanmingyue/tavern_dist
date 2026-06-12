// 自动生成index.yaml的地图条目注册部分
// 扫描所有yaml文件，根据层级和类型自动设置关键词（主要关键词+与任意）
import fs from 'fs';
import path from 'path';

const BASE = 'src/角色卡/XX市/世界书/地图';
const OUTPUT = 'src/角色卡/XX市/_地图条目注册.yaml';
const INDEX_FILE = 'src/角色卡/XX市/index.yaml';

// 层级对应顺序: 第一层=1, 第二层=2, 第三层=3, 第四层=4, 第五层=5
function getOrder(layerInfo) {
  const { depth } = layerInfo;
  if (depth === 1) return 1; // 第一层
  if (depth === 2) return 2; // 第二层（区概览）
  if (depth === 3) {
    // 区分第三层（街道概览）和第四层（建筑）
    const fileName = layerInfo.parts[2];
    if (fileName.includes('概览') || fileName.includes('街道概览')) return 3;
    return 4; // 第四层
  }
  return 5; // 第五层
}

// 提取建筑名（从yaml标签或文件名）
function extractName(content, fileName) {
  const m = content.match(/^<(.+?)>/);
  if (m) return m[1];
  return fileName.replace('.yaml', '');
}

// 提取类型
function extractType(content) {
  const m = content.match(/类型:\s*(.+)/);
  return m ? m[1].trim() : '';
}

// 从路径获取层级信息
function getLayerInfo(relPath) {
  const parts = relPath.split(path.sep).filter(Boolean);
  // parts[0] = 区名或顶级文件
  // parts[1] = 街道名或区域概览
  // parts[2] = 建筑文件或子目录
  // parts[3] = 第五层文件
  return { parts, depth: parts.length };
}

// 生成关键词
function generateKeywords(name, type, layerInfo) {
  const { parts, depth } = layerInfo;

  // 第一层：蓝灯
  if (depth === 1) {
    return { strategy: '蓝灯', primary: '', secondary: '' };
  }

  // 第二层（区域概览）：绿灯，区名触发
  if (depth === 2 && parts[1] === '区域概览.yaml') {
    const district = parts[0].replace('区', '');
    return { strategy: '绿灯', primary: parts[0], secondary: district };
  }

  // 第三层（街道概览）：绿灯，街道名触发
  if (depth === 3 && (parts[2].includes('概览') || parts[2].includes('街道概览'))) {
    const street = parts[1].replace('街道', '').replace('片区', '');
    return { strategy: '绿灯', primary: parts[1], secondary: street };
  }

  // 第四层（建筑）：绿灯，街道名+建筑名/类型
  if (depth === 3) {
    const street = parts[1];
    const streetShort = street.replace('街道', '').replace('片区', '');

    // 构建与任意关键词：建筑名+类型关键词
    const secondaryParts = [name];
    if (type) {
      // 提取类型中的通用词
      const typeWords = type.match(/(便利店|药房|药店|银行|超市|菜场|农贸|学校|中学|小学|幼儿园|医院|公园|派出所|消防站|加油站|停车场|快递|公交站|地铁站|奶茶|面馆|早餐|理发|水果|书店|咖啡|茶馆|KTV|网咖|网吧|健身|电影院|影城|酒店|民宿|餐厅|烧烤|夜市|小吃|商场|市场|广场|寺|庙|塔|桥|码头|渔港|景区|步道|湿地|动物园|游乐|滑雪|温泉|汤泉)/g);
      if (typeWords) secondaryParts.push(...typeWords);
    }

    return {
      strategy: '绿灯',
      primary: streetShort + ',' + street,
      secondary: [...new Set(secondaryParts)].join(',')
    };
  }

  // 第五层（子目录文件）：绿灯，建筑名触发
  if (depth >= 4) {
    const building = parts[2];
    return {
      strategy: '绿灯',
      primary: building,
      secondary: name
    };
  }

  return { strategy: '绿灯', primary: name, secondary: '' };
}

// 遍历所有文件
function walkDir(dir, basePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];

  // 先处理文件，再处理目录
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(basePath, entry.name);

    if (entry.isFile() && entry.name.endsWith('.yaml')) {
      results.push({ fullPath, relPath, name: entry.name });
    }
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, relPath));
    }
  }

  return results;
}

const files = walkDir(BASE);

// 按文件夹分组
const folders = new Map(); // folderPath -> [entries]

for (const file of files) {
  const content = fs.readFileSync(file.fullPath, 'utf-8');
  const layerInfo = getLayerInfo(file.relPath);
  const name = extractName(content, file.name);
  const type = extractType(content);
  const keywords = generateKeywords(name, type, layerInfo);

  // 确定所属文件夹
  const parts = file.relPath.split(path.sep);
  let folderKey;
  if (parts.length <= 2) {
    folderKey = parts.length === 1 ? '地图' : parts[0]; // 区名
  } else {
    folderKey = parts[0] + '/' + parts[1]; // 区名/街道名
  }

  if (!folders.has(folderKey)) folders.set(folderKey, []);

  // 文件路径（去掉.yaml后缀，相对于世界书目录）
  const filePath = '世界书/地图/' + file.relPath.replace(/\\/g, '/').replace('.yaml', '');

  folders.get(folderKey).push({
    name,
    filePath,
    keywords,
    layerInfo,
  });
}

// 生成YAML输出
let yaml = `  # ═══════════════════════════════════════\n`;
yaml += `  # 地图条目 - 自动生成\n`;
yaml += `  # ═══════════════════════════════════════\n\n`;

// 先输出顶级文件夹（第一层蓝灯）
const topLevel = folders.get('地图') || [];
if (topLevel.length > 0) {
  yaml += `  - 文件夹: 地图\n`;
  yaml += `    条目:\n`;
  for (const entry of topLevel) {
    yaml += `      - 名称: ${entry.name}\n`;
    yaml += `        启用: true\n`;
    yaml += `        激活策略:\n`;
    yaml += `          类型: 蓝灯\n`;
    yaml += `        插入位置:\n`;
    yaml += `          类型: 角色定义之前\n`;
    yaml += `          顺序: 14700\n`;
    yaml += `        文件: ${entry.filePath}\n\n`;
  }
}

// 按区输出
const districts = ['映湖区', '青澜区', '望江区', '栖霞区', '听涛区', '云谷区'];

for (const district of districts) {
  yaml += `      # ─── ${district} ───\n`;

  // 区概览
  const districtEntries = folders.get(district) || [];
  for (const entry of districtEntries) {
    yaml += `      - 名称: ${entry.name}\n`;
    yaml += `        启用: true\n`;
    yaml += `        激活策略:\n`;
    yaml += `          类型: 绿灯\n`;
    yaml += `          关键词: [${entry.keywords.primary}]\n`;
    if (entry.keywords.secondary) {
      yaml += `          可选关键词: [${entry.keywords.secondary}]\n`;
    }
    yaml += `        插入位置:\n`;
    yaml += `          类型: 角色定义之前\n`;
    yaml += `          顺序: 14600\n`;
    yaml += `        文件: ${entry.filePath}\n\n`;
  }

  // 各街道
  for (const [folderKey, entries] of folders) {
    if (!folderKey.startsWith(district + '/')) continue;
    const streetName = folderKey.split('/')[1];

    yaml += `      # ${streetName}\n`;
    for (const entry of entries) {
      const kw = entry.keywords;
      yaml += `      - 名称: ${entry.name}\n`;
      yaml += `        启用: true\n`;
      yaml += `        激活策略:\n`;
      yaml += `          类型: 绿灯\n`;
      yaml += `          关键词: [${kw.primary}]\n`;
      if (kw.secondary) {
        yaml += `          可选关键词: [${kw.secondary}]\n`;
      }
      yaml += `        插入位置:\n`;
      yaml += `          类型: 角色定义之前\n`;
      yaml += `          顺序: ${entry.layerInfo.depth <= 3 ? '14500' : '14400'}\n`;
      yaml += `        文件: ${entry.filePath}\n\n`;
    }
  }
}

fs.writeFileSync(OUTPUT, yaml, 'utf-8');

// 读取index.yaml，在条目列表末尾（变量结束分隔符之后）插入地图条目
const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
const insertMarker = '      - 名称: ===变量结束===\n        <<: *分隔符\n';
const insertPos = indexContent.indexOf(insertMarker);
if (insertPos !== -1) {
  const afterMarker = insertPos + insertMarker.length;
  // 检查是否已有地图条目
  if (indexContent.includes('# 地图条目 - 自动生成')) {
    // 替换已有的地图条目部分
    const mapStart = indexContent.indexOf('  # ═══════════════════════════════════════');
    if (mapStart !== -1) {
      const beforeMap = indexContent.substring(0, mapStart);
      // 找到扩展字段之前的位置
      const extStart = indexContent.indexOf('\n扩展字段:');
      const afterMap = extStart !== -1 ? indexContent.substring(extStart) : '';
      const newContent = beforeMap + yaml + afterMap;
      fs.writeFileSync(INDEX_FILE, newContent, 'utf-8');
      console.log('已替换index.yaml中的地图条目');
    }
  } else {
    // 首次插入
    const before = indexContent.substring(0, afterMarker);
    const after = indexContent.substring(afterMarker);
    const newContent = before + '\n' + yaml + after;
    fs.writeFileSync(INDEX_FILE, newContent, 'utf-8');
    console.log('已写入index.yaml');
  }
} else {
  console.log('未找到插入点，请手动将_地图条目注册.yaml内容复制到index.yaml');
}

console.log(`生成了 ${files.length} 个条目的注册配置`);
