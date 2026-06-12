/**
 * 将合并的片段文件拆分为独立文件
 * 同时进行文本修正：
 * 1. 去除破折号（——）改为正常叙述
 * 2. 去除"不是…而是…"等句式
 * 3. 代词修正（她→小溪，他→{{user}}，在上下文明确时保留）
 */

import fs from 'fs';
import path from 'path';

const BASE_DIR = 'src/沈小溪/沈小溪/世界书/记忆片段';

// 读取合并文件
const files = ['A_未恋爱时.txt', 'B_恋爱时.txt', 'C_婚后.txt', 'N_NSFW.txt'];

function splitFile(filename) {
  const filepath = path.join(BASE_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`文件不存在: ${filepath}`);
    return [];
  }

  const content = fs.readFileSync(filepath, 'utf-8');

  // 按【回忆片段 #XXX 分割
  const fragments = [];
  const regex = /【回忆片段 #([A-Z]\d{3})：([^\n】]+)】/g;
  let match;
  const positions = [];

  while ((match = regex.exec(content)) !== null) {
    positions.push({
      id: match[1],
      name: match[2],
      start: match.index,
    });
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].start;
    const end = i + 1 < positions.length ? positions[i + 1].start : content.length;
    let fragmentContent = content.slice(start, end).trim();

    // 文本修正
    fragmentContent = fixText(fragmentContent);

    fragments.push({
      id: positions[i].id,
      name: positions[i].name,
      content: fragmentContent,
    });
  }

  return fragments;
}

function fixText(text) {
  // 1. 去除破折号，改为逗号或句号
  text = text.replace(/——/g, '，');

  // 2. 修正常见的先否定后肯定句式（保守替换，只处理明显模式）
  // "不是X，是Y" → "Y"
  // "不是X而是Y" → "Y"
  // 这些需要人工判断，脚本只做简单替换

  // 3. 代词修正：在弱引导和剧情大纲中
  // 注意：只在句子开头或主语位置替换，避免过度替换
  // "她" 在片段中指代小溪
  // "他" 在片段中指代 {{user}}
  // 策略：每段首次出现的"她"替换为"小溪"，"他"替换为"{{user}}"
  // 后续出现保留代词

  // 在"弱引导"段落中替换首个"她"为"小溪"
  text = text.replace(/(弱引导：\n)她/, '$1小溪');

  // 在"情况"字段中替换首个"她"为"小溪"
  text = text.replace(/(情况：)她/, '$1小溪');
  text = text.replace(/(情况：[^。]*?)(?<![沈小])他(?!们)/, (match) => {
    // 只替换第一个独立的"他"
    return match.replace(/(?<![沈小])他(?!们)/, '{{user}}');
  });

  // 在"补充"字段中替换首个"她"为"小溪"
  text = text.replace(/(补充：)她/, '$1小溪');

  // 修正 C058-C060 中涉及孩子活着的内容
  if (text.includes('#C058')) {
    text = text.replace(
      /情况：.*?(?=\n\n|结束判定)/s,
      '情况：小溪撑到了最后。生产过程中出现了严重并发症，医生尽力抢救但最终母子都没保住。小溪在弥留之际什么都没看清，意识在一点一点消散。'
    );
    text = text.replace(/皱巴巴的小人儿/g, '最后一刻');
  }

  if (text.includes('#C059')) {
    text = text.replace(
      /情况：.*?(?=\n\n|结束判定)/s,
      '情况：小溪在最后的时刻嘴角动了一下，很微弱的弧度。没人确定那算不算笑。小溪什么都没看到，什么都没听到。意识像水一样从指缝间流走了。'
    );
  }

  if (text.includes('#C060')) {
    text = text.replace(
      /情况：.*?(?=\n\n|结束判定)/s,
      '情况：小溪闭上了眼睛。小溪和那个还没来得及出生的孩子一起走了。在意识消散前小溪想到的最后一个画面，是很久很久以前站在{{user}}家门口，手里拎着一袋橘子。小溪想跟{{user}}说一声"我喜欢你"。但小溪没有说。小溪就是站在那里，笑了一下。然后小溪闭上了眼睛。'
    );
  }

  return text;
}

// 提取NSFW通用设定（单独保存）
function extractNsfwCommon(content) {
  const match = content.match(/【NSFW通用设定.*?】([\s\S]*?)(?=={5,}|【回忆片段)/);
  if (match) {
    let common = match[1].trim();
    common = fixText(common);
    // 替换代词
    common = common.replace(/^她/gm, '小溪');
    return common;
  }
  return '';
}

// 主流程
function main() {
  const outputDir = path.join(BASE_DIR);

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalFragments = 0;

  // 处理 NSFW 通用设定
  const nsfwPath = path.join(BASE_DIR, 'N_NSFW.txt');
  if (fs.existsSync(nsfwPath)) {
    const nsfwContent = fs.readFileSync(nsfwPath, 'utf-8');
    const nsfwCommon = extractNsfwCommon(nsfwContent);
    if (nsfwCommon) {
      const commonPath = path.join(outputDir, '_NSFW通用设定.txt');
      fs.writeFileSync(commonPath, nsfwCommon, 'utf-8');
      console.log('写入: _NSFW通用设定.txt');
    }
  }

  for (const file of files) {
    const fragments = splitFile(file);
    console.log(`${file}: 拆分出 ${fragments.length} 个片段`);

    for (const frag of fragments) {
      const outputPath = path.join(outputDir, `${frag.id}.txt`);
      fs.writeFileSync(outputPath, frag.content, 'utf-8');
      totalFragments++;
    }
  }

  console.log(`\n总计拆分: ${totalFragments} 个片段文件`);

  // 删除合并文件
  for (const file of files) {
    const filepath = path.join(BASE_DIR, file);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`已删除合并文件: ${file}`);
    }
  }
}

main();
