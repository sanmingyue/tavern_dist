import fs from 'fs';

const filePath = 'src/角色卡/XX市/index.yaml';
let content = fs.readFileSync(filePath, 'utf-8');

// ===== 通用词汇映射表：从建筑名中提取口语化关键字 =====
const categoryKeywords = {
  '便利店': ['便利店', '小卖部', '买东西'],
  '药房': ['药房', '药店', '买药'],
  '水果店': ['水果店', '水果', '买水果'],
  '面馆': ['面馆', '吃面', '面条'],
  '银行网点': ['银行', '取钱', 'ATM'],
  '银行': ['银行', '取钱'],
  '公交站': ['公交站', '公交', '等车', '坐公交'],
  '地铁站': ['地铁站', '地铁', '坐地铁'],
  '停车场': ['停车场', '停车', '车位'],
  '加油站': ['加油站', '加油'],
  '早餐店': ['早餐店', '早餐', '吃早餐', '早饭'],
  '早餐摊': ['早餐', '早饭', '吃早餐'],
  '奶茶店': ['奶茶店', '奶茶', '喝奶茶'],
  '奶茶': ['奶茶', '喝奶茶'],
  '咖啡': ['咖啡', '喝咖啡', '咖啡店'],
  '茶馆': ['茶馆', '喝茶', '茶'],
  '理发店': ['理发店', '理发', '剪头发', '剪发'],
  '快递': ['快递', '取快递', '寄快递'],
  '超市': ['超市', '买东西'],
  '菜场': ['菜场', '菜市场', '买菜'],
  '小吃': ['小吃', '小吃街', '吃东西'],
  '夜市': ['夜市', '逛夜市', '小吃'],
  '烧烤': ['烧烤', '撸串', '吃烧烤'],
  '餐厅': ['餐厅', '吃饭', '饭店'],
  '幼儿园': ['幼儿园'],
  '小学': ['小学'],
  '中学': ['中学', '学校'],
  '医院': ['医院', '看病'],
  '派出所': ['派出所', '警察', '报警'],
  '公园': ['公园', '逛公园'],
  '洗衣店': ['洗衣店', '洗衣服'],
  '烟酒店': ['烟酒', '烟酒店'],
  '五金店': ['五金', '五金店'],
  '眼镜店': ['眼镜', '配眼镜'],
  '花店': ['花店', '买花'],
  '书店': ['书店', '买书'],
  '网咖': ['网咖', '网吧', '上网'],
  '健身': ['健身', '健身房', '锻炼'],
  '电影院': ['电影院', '看电影'],
  '影城': ['电影院', '看电影', '影城'],
  '汤泉': ['泡澡', '泡温泉', '温泉', '汤泉'],
  '温泉': ['温泉', '泡温泉', '泡澡'],
  '游乐': ['游乐园', '游乐场', '玩'],
  '滑雪': ['滑雪', '雪场'],
  '动物园': ['动物园', '看动物'],
  '景区': ['景区', '景点', '旅游'],
  '民宿': ['民宿', '住宿'],
  '酒店': ['酒店', '住宿', '住酒店'],
  '棋牌室': ['棋牌室', '打牌', '打麻将'],
  '宠物': ['宠物', '宠物店'],
  '市场': ['市场', '逛市场'],
};

// ===== 街道名缩写映射 =====
function getStreetAliases(streetName) {
  // "中山路街道" -> ["中山路", "中山路街道"]
  // "北山街道" -> ["北山", "北山街道"]
  // "大学城片区" -> ["大学城", "大学城片区"]
  // "镜澜湖景区" -> ["镜澜湖", "镜澜湖景区"]
  const aliases = [streetName];

  if (streetName.endsWith('街道')) {
    const base = streetName.replace(/街道$/, '');
    aliases.push(base);
    // 如果是 XX路街道，也添加 XX路
    if (base.endsWith('路')) {
      aliases.push(base);
    }
  } else if (streetName.endsWith('片区')) {
    aliases.push(streetName.replace(/片区$/, ''));
  } else if (streetName.endsWith('景区')) {
    aliases.push(streetName.replace(/景区$/, ''));
  }

  return [...new Set(aliases)];
}

// ===== 从建筑名称提取口语化次要关键字 =====
function getSecondaryKeywords(name) {
  const keywords = [name]; // 完整名称始终保留

  // 遍历类别映射
  for (const [pattern, aliases] of Object.entries(categoryKeywords)) {
    if (name.includes(pattern)) {
      for (const alias of aliases) {
        if (!keywords.includes(alias)) {
          keywords.push(alias);
        }
      }
    }
  }

  // 如果名称包含路名+设施，提取设施部分
  // 例如 "保俶路便利店" -> 还要加 "便利店"
  // 这已经被上面的循环覆盖了

  return keywords;
}

// ===== 主处理逻辑 =====
// 使用 YAML 的文本模式处理，逐条目修改

// 处理主关键字（关键字:）的街道条目
// 匹配街道概览条目的关键字，添加缩写
// 例如 关键字:\n            - 中山路街道 → 关键字:\n            - 中山路街道\n            - 中山路

// 处理次要关键字的口语化
// 例如 次要关键字:\n            逻辑: ...\n            关键字:\n              - 保俶路便利店
// → 添加 "便利店" "小卖部" "买东西" 等

let modifiedCount = 0;

// 1. 处理次要关键字：给每个条目添加口语化关键字
content = content.replace(
  /^(\s*)次要关键字:\n\1  逻辑: 与任意\n\1  关键字:\n((?:\1    - .+\n?)+)/gm,
  (match, indent, itemBlock) => {
    const existingItems = [];
    const itemRegex = new RegExp(`^${indent}    - (.+)$`, 'gm');
    let m;
    while ((m = itemRegex.exec(itemBlock)) !== null) {
      existingItems.push(m[1].trim());
    }

    // 为每个现有关键字生成口语化扩展
    const allKeywords = new Set(existingItems);
    for (const item of existingItems) {
      const expanded = getSecondaryKeywords(item);
      for (const kw of expanded) {
        allKeywords.add(kw);
      }
    }

    // 如果没有新增，原样返回
    if (allKeywords.size === existingItems.length) {
      return match;
    }

    modifiedCount++;
    const newItems = [...allKeywords].map(kw => `${indent}    - ${kw}`).join('\n');
    return `${indent}次要关键字:\n${indent}  逻辑: 与任意\n${indent}  关键字:\n${newItems}\n`;
  }
);

// 2. 处理主关键字：给街道概览条目的关键字添加缩写
// 区概览的关键字只有区名，也需要缩写
content = content.replace(
  /^(\s*)关键字:\n((?:\1  - .+\n?)+)/gm,
  (match, indent, itemBlock) => {
    const existingItems = [];
    const itemRegex = new RegExp(`^${indent}  - (.+)$`, 'gm');
    let m;
    while ((m = itemRegex.exec(itemBlock)) !== null) {
      existingItems.push(m[1].trim());
    }

    const allKeywords = new Set(existingItems);

    for (const item of existingItems) {
      // 街道名缩写
      if (item.endsWith('街道') || item.endsWith('片区') || item.endsWith('景区')) {
        const aliases = getStreetAliases(item);
        for (const a of aliases) allKeywords.add(a);
      }
      // 路名缩写：如果是 "XX路街道"，关键字里可能有 "XX路"
      // 区名缩写："映湖区" -> "映湖"
      if (item.endsWith('区') && item.length > 1) {
        allKeywords.add(item.replace(/区$/, ''));
      }
    }

    if (allKeywords.size === existingItems.length) {
      return match;
    }

    const newItems = [...allKeywords].map(kw => `${indent}  - ${kw}`).join('\n');
    return `${indent}关键字:\n${newItems}\n`;
  }
);

fs.writeFileSync(filePath, content, 'utf-8');

console.log(`次要关键字扩展了 ${modifiedCount} 个条目`);

// 打印样本
const lines = content.split('\n');
for (let i = 110; i < 160; i++) {
  console.log(`${i+1} | ${lines[i]}`);
}
