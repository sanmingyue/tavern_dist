import fs from 'fs';

let c = fs.readFileSync('src/角色卡/XX市/index.yaml', 'utf-8');

// 第一步：把顺序4（原第五层）改为5
c = c.replaceAll('顺序: 4\n', '顺序: 5\n');

// 第二步：逐行检查顺序3，区分第三层（概览）和第四层（建筑）
const lines = c.split('\n');
const result = [];
let changed3to4 = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === '顺序: 3') {
    // 找后面的文件路径行
    const nextLine = lines[i + 1] || '';
    if (nextLine.includes('文件:')) {
      const filePath = nextLine.trim();
      if (filePath.includes('概览') || filePath.includes('景区概览')) {
        result.push(line); // 街道概览保持顺序3
      } else {
        result.push(line.replace('顺序: 3', '顺序: 4')); // 建筑改为4
        changed3to4++;
      }
    } else {
      result.push(line);
    }
  } else {
    result.push(line);
  }
}

fs.writeFileSync('src/角色卡/XX市/index.yaml', result.join('\n'), 'utf-8');
console.log(`顺序4→5: 29个, 顺序3→4: ${changed3to4}个`);

// 验证
const final = fs.readFileSync('src/角色卡/XX市/index.yaml', 'utf-8');
const counts = {};
final.split('\n').filter(l => l.includes('顺序:')).forEach(l => {
  const key = l.trim();
  counts[key] = (counts[key] || 0) + 1;
});
console.log('最终分布:');
Object.entries(counts).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}个`));
