// 将第四层文件中的内联展开（店内详情/站内详情等）拆分为独立第五层yaml文件
import fs from 'fs';
import path from 'path';

const BASE = 'src/角色卡/XX市/世界书/地图';
let splitCount = 0;

// 内联展开标记列表
const DETAIL_MARKERS = [
  '店内详情:', '站内详情:', '站点详情:', '网点详情:', '中心详情:',
  '园内详情:', '校内详情:', '所内详情:', '大楼详情:', '住宿详情:',
  '影城详情:', '停车详情:', '市场详情:', '小区详情:'
];

function walkAndSplit(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndSplit(fullPath);
    } else if (entry.name.endsWith('.yaml')) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // 检查是否有内联展开
      const hasInline = DETAIL_MARKERS.some(m => content.includes(m));
      if (!hasInline) continue;

      // 提取建筑名
      const nameMatch = content.match(/^<(.+?)>/);
      if (!nameMatch) continue;
      const buildingName = nameMatch[1];

      // 找到展开内容的起始行
      let detailStart = -1;
      let detailMarker = '';
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        for (const marker of DETAIL_MARKERS) {
          if (trimmed === marker || trimmed.startsWith(marker)) {
            detailStart = i;
            detailMarker = marker.replace(':', '');
            break;
          }
        }
        if (detailStart !== -1) break;
      }

      if (detailStart === -1) continue;

      // 找到关闭标签行
      const closeTag = `</${buildingName}>`;
      let closeLineIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes(closeTag)) {
          closeLineIdx = i;
          break;
        }
      }
      if (closeLineIdx === -1) continue;

      // 提取展开内容（从detailStart到closeTag前）
      const detailLines = lines.slice(detailStart, closeLineIdx);
      const detailContent = detailLines.join('\n');

      // 生成第五层文件名和内容
      const l5FileName = detailMarker + '.yaml';
      const l5Dir = path.join(dir, buildingName.replace(/[·\s/\\:*?"<>|]/g, '_'));
      const l5Path = path.join(l5Dir, l5FileName);

      // 如果第五层目录或文件已存在，跳过
      if (fs.existsSync(l5Path)) continue;

      // 创建第五层文件
      const l5Content = `<${buildingName}${detailMarker}>\n${buildingName}·${detailMarker}:\n${detailContent}\n</${buildingName}${detailMarker}>\n`;
      fs.mkdirSync(l5Dir, { recursive: true });
      fs.writeFileSync(l5Path, l5Content, 'utf-8');

      // 从第四层文件中删除展开内容
      const newLines = [...lines.slice(0, detailStart), lines[closeLineIdx]];
      fs.writeFileSync(fullPath, newLines.join('\n'), 'utf-8');

      splitCount++;
    }
  }
}

walkAndSplit(BASE);
console.log(`拆分了 ${splitCount} 个内联展开为独立第五层文件`);

// 统计总文件数
function countYaml(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countYaml(fullPath);
    else if (entry.name.endsWith('.yaml')) count++;
  }
  return count;
}
console.log(`当前yaml文件总数: ${countYaml(BASE)}`);
