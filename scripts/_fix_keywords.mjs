import fs from 'fs';

const filePath = 'src/角色卡/XX市/index.yaml';
let content = fs.readFileSync(filePath, 'utf-8');

// 统计修改前
const count1 = (content.match(/关键词:/g) || []).length;
const count2 = (content.match(/可选关键词:/g) || []).length;
console.log(`修改前: 关键词出现 ${count1} 次, 可选关键词出现 ${count2} 次`);

// 1. 先替换 可选关键词 -> 次要关键字（必须先替换长的，避免被短的覆盖）
content = content.replace(/可选关键词:/g, '次要关键字:');

// 2. 再替换 关键词 -> 关键字
content = content.replace(/关键词:/g, '关键字:');

// 3. 将 flow style 数组 [a,b,c] 转为 block style 列表
//    匹配模式: "关键字: [xxx]" 或 "次要关键字: [xxx]"
//    需要保持正确的缩进
content = content.replace(/^(\s*)(关键字|次要关键字): \[([^\]]*)\]$/gm, (match, indent, key, values) => {
  const items = values.split(',').map(s => s.trim());
  if (items.length === 0 || (items.length === 1 && items[0] === '')) {
    return `${indent}${key}:\n${indent}  - ""`;
  }
  const lines = items.map(item => `${indent}  - ${item}`);
  return `${indent}${key}:\n${lines.join('\n')}`;
});

// 统计修改后
const count3 = (content.match(/关键字:/g) || []).length;
const count4 = (content.match(/次要关键字:/g) || []).length;
const flowCount = (content.match(/关键字: \[/g) || []).length;
console.log(`修改后: 关键字出现 ${count3} 次, 次要关键字出现 ${count4} 次`);
console.log(`剩余flow数组: ${flowCount}`);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('替换完成!');

// 打印几行样本检查
const lines = content.split('\n');
for (let i = 110; i < 150; i++) {
  console.log(`${i+1} | ${lines[i]}`);
}
