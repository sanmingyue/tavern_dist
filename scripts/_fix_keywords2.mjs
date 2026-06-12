import fs from 'fs';

const filePath = 'src/角色卡/XX市/index.yaml';
let content = fs.readFileSync(filePath, 'utf-8');

// 当前格式:
//           次要关键字:
//             - xxx
//             - yyy
// 需要改为:
//           次要关键字:
//             逻辑: 与任意
//             关键字:
//               - xxx
//               - yyy

// 匹配 "次要关键字:" 后面跟着的列表项
content = content.replace(
  /^(\s*)次要关键字:\n((?:\1  - .+\n?)+)/gm,
  (match, indent, items) => {
    // items 是 "            - xxx\n            - yyy\n" 这种格式
    // 需要每一行增加2个空格的缩进
    const reindented = items.replace(new RegExp(`^${indent}  -`, 'gm'), `${indent}    -`);
    return `${indent}次要关键字:\n${indent}  逻辑: 与任意\n${indent}  关键字:\n${reindented}`;
  }
);

fs.writeFileSync(filePath, content, 'utf-8');

// 验证
const sample = content.split('\n').slice(110, 145).join('\n');
console.log(sample);
console.log('---');
console.log('次要关键字 出现次数:', (content.match(/次要关键字:/g) || []).length);
console.log('逻辑: 与任意 出现次数:', (content.match(/逻辑: 与任意/g) || []).length);
