/**
 * 从 Plum blossom 预设移植新条目到浮生
 * 并全局去除破折号，改为正常叙事
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE = 'src/浮生/条目';
const PLUM = JSON.parse(readFileSync('我的预设/潮汐Plum blossom.json', 'utf-8'));

// 按 identifier 建立条目索引
const promptMap = {};
for (const p of PLUM.prompts) {
  promptMap[p.identifier] = p;
}

// ========== 第一部分：移植新条目 ==========
// 从 Plum blossom 提取 content，去掉小人名称，保留规则

const NEW_ENTRIES = [
  // 世界观
  { id: '11', filename: '🌕_高中生世界观（校园青涩·禁止成人化）.yaml' },
  { id: '12', filename: '🌕_男女平等（平等世界观·互相尊重）.yaml' },
  // 规则
  { id: '13', filename: '🐚_反提示词污染（低频token·场景驱动）.txt' },
  { id: '17', filename: '🐚_缄默法则（防角色乱告密·控制信息泄露）.txt' },
  { id: '20', filename: '🐚_中国人特质（角色行为文化驱动）.txt' },
  // 对话
  { id: '60', filename: '💬_元对话（停止剧情·与角色OOC对话）.txt' },
  // 防护
  { id: '72', filename: '🛡️_防八股2（套路表达替换）.txt' },
  { id: '73', filename: '🛡️_防发情.txt' },
  { id: '84', filename: '🛡️_去霸总化（高中生思维·防控制狂）.txt' },
  // NSFW
  { id: '88', filename: '🔞_性行为去隐喻化（禁止权力叙事·防人格修改）.txt' },
  { id: '96', filename: '🔞_前戏（身体准备好了才进·必开）.txt' },
  { id: '97', filename: '🔞_事后温存（温存是性爱的尾声·必开）.txt' },
  { id: '98', filename: '🔞_凝视平衡（双机位·两个人都要写）.txt' },
  { id: '99', filename: '🔞_浪漫向NSFW（温柔性爱·服务意识）.txt' },
  { id: '100', filename: '🔞_粗犷向NSFW（凝视感·力度·脏话有感情）.txt' },
  { id: '101', filename: '🔞_枕边话与情话（dirty_talk·pillow_talk）.txt' },
  { id: '102', filename: '🔞_NSFW联想增强（背德感·氛围·不只凿洞）.txt' },
  { id: '103', filename: '🔞_外貌感知（角色外观驱动描写·不照搬人设卡）.txt' },
  { id: '104', filename: '🔞_安全与卫生（戴套·事后清洁）.txt' },
  { id: '105', filename: '🔞_男娘与扶她适配（特殊性别场景）.txt' },
  { id: '106', filename: '🔞_身份逻辑（权力关系影响亲密·防AI默认模板）.txt' },
  // 功能
  { id: '110', filename: '⚙️_节奏控制（剧情节奏判断）.txt' },
];

let created = 0;
for (const entry of NEW_ENTRIES) {
  const prompt = promptMap[entry.id];
  if (!prompt) {
    console.error(`❌ 找不到 identifier=${entry.id}`);
    continue;
  }

  const filepath = join(BASE, entry.filename);
  const content = prompt.content;

  writeFileSync(filepath, content, 'utf-8');
  console.log(`✅ 新建 ${entry.filename}`);
  created++;
}

console.log(`\n新建条目完成：${created} 个\n`);

// ========== 第二部分：更新已有条目 ==========
// 用 Plum blossom 的精简版本替换旧版本

const UPDATES = {
  // 活人台词 - 新增去翻译腔 + revision_rules
  '🐚_活人台词（去旁白散文·口语化对白）.txt': promptMap['14']?.content,
  // 防恶意 - 精简版
  '🐚_防恶意（禁止AI恶意操控角色）.txt': promptMap['15']?.content,
  // 角色防全知 - 精简版
  '🐚_角色防全知（角色不知道没见过的事）.txt': promptMap['16']?.content,
  // 抗升华 - 精简版
  '🐚_抗升华（禁止强行拔高·保持平实）.txt': promptMap['18']?.content,
  // 防神化 - 改用 revision_rules
  '🛡️_防神化.txt': promptMap['70']?.content,
  // 防八股 - 新增禁破折号规则 + revision_rules
  '🛡️_防八股.txt': promptMap['71']?.content,
  // 防比喻 - 改用 revision_rules
  '🛡️_防比喻（禁止滥用比喻·可常驻）.txt': promptMap['74']?.content,
  // 防绝望 - 改用 revision_rules
  '🛡️_防绝望（禁止永恒绝望·防戏剧化无效再开）.txt': promptMap['75']?.content,
  // 防极端 - 改用 revision_rules
  '🛡️_防极端（禁止极端行为·防戏剧化无效再开）.txt': promptMap['76']?.content,
  // 防过度戏剧化 - 改用 revision_rules
  '🛡️_防过度戏剧化（禁止为戏剧性牺牲人设）.txt': promptMap['77']?.content,
  // 禁机器人 - 改用 revision_rules
  '🛡️_禁机器人（禁止AI口吻·没问题别开）.txt': promptMap['78']?.content,
  // 防扭曲动作 - 改用 revision_rules
  '🛡️_防扭曲动作（强化骨架潮汐·动作合理性）.txt': promptMap['79']?.content,
  // 防情绪扁平 - 改用 revision_rules
  '🛡️_防情绪扁平（强化调色潮汐·情感层次）.txt': promptMap['80']?.content,
  // 防原地打转 - 改用 revision_rules
  '🛡️_防原地打转（强化织线潮汐·推进情节）.txt': promptMap['81']?.content,
  // 防OOC - 改用 revision_rules
  '🛡️_防OOC（强化心音潮汐·人设一致性）.txt': promptMap['82']?.content,
  // 防潮汐出现 - 改用 revision_rules
  '🛡️_防潮汐出现（禁止预设人格泄露·没问题别开）.txt': promptMap['83']?.content,
  // 防节奏失控 - 改用 revision_rules
  '🛡️_防节奏失控（控制叙事节奏·防跳跃）.txt': promptMap['126']?.content,
  // NSFW指导 - 改用 revision_rules + 新增日常对话
  '🔞_NSFW指导（性爱场景写作总纲·必开）.txt': promptMap['87']?.content,
  // 性爱流程控制 - 改用 revision_rules + 新增暧昧和温存
  '🔞_性爱流程控制（前戏→正戏→余韵·必开）.txt': promptMap['89']?.content,
  // 词汇直接化 - 改用 revision_rules
  '🔞_词汇直接化（去委婉·用身体词汇·必开）.txt': promptMap['90']?.content,
  // 色情度强化 - 改用 revision_rules
  '🔞_色情度强化（增加描写密度·选开）.txt': promptMap['91']?.content,
  // AV导演 - 改用 revision_rules，精简
  '🔞_AV导演（NSFW核心小人·场景总控）.txt': promptMap['92']?.content,
  // 编舞潮汐 - 改用 revision_rules，精简
  '🔞_编舞潮汐（体位与动作设计）.txt': promptMap['93']?.content,
  // 色色世界观 - 改用 revision_rules
  '🔞_色色世界观（全员好色·会导致OOC·慎开）.txt': promptMap['94']?.content,
  // 一根鸡巴 - 改用 revision_rules
  '🔞_一根鸡巴（多人性爱时开·防分身）.txt': promptMap['95']?.content,
  // 超强防抢话 - 改用 revision_rules
  '💬_超强防抢话（极端防抢·可叠加）.txt': promptMap['59']?.content,
};

let updated = 0;
for (const [filename, content] of Object.entries(UPDATES)) {
  if (!content) {
    console.warn(`⚠️ ${filename} 的源内容为空，跳过`);
    continue;
  }
  const filepath = join(BASE, filename);
  writeFileSync(filepath, content, 'utf-8');
  console.log(`🔄 更新 ${filename}`);
  updated++;
}

console.log(`\n更新条目完成：${updated} 个\n`);

// ========== 第三部分：全局去除破折号 ==========
// 将所有条目中的破折号（——）替换为正常叙事
// 规则：
// 1. "不是A——而是B" 类型 → "不是A，而是B"  或直接改为 "B"
// 2. 解释性破折号 "XXX——YYY" → "XXX。YYY" 或 "XXX，YYY"
// 3. 但保留HTML/CSS中的破折号（不处理正则replaceString等）

const files = readdirSync(BASE);
let dashFixed = 0;

for (const file of files) {
  if (!file.endsWith('.txt') && !file.endsWith('.yaml')) continue;

  const filepath = join(BASE, file);
  let content = readFileSync(filepath, 'utf-8');
  const original = content;

  // 替换所有破折号
  // 常见模式：
  // "XXX——YYY" → "XXX。YYY" （句中解释）
  // 但如果破折号前后是紧密的短语，用逗号更好
  content = content.replaceAll('——', '，');

  if (content !== original) {
    writeFileSync(filepath, content, 'utf-8');
    const count = (original.match(/——/g) || []).length;
    console.log(`✏️ ${file}: 替换 ${count} 处破折号`);
    dashFixed++;
  }
}

console.log(`\n去破折号完成：${dashFixed} 个文件被修改\n`);
console.log('全部任务完成！');
