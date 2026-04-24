import fs from 'fs';
import path from 'path';

const dir = '我的预设';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const rx = data.extensions?.regex_scripts || [];
    console.log(`\n=== ${f} === (${rx.length} 条正则)`);
    for (let i = 0; i < rx.length; i++) {
      const r = rx[i];
      const status = r.disabled ? 'OFF' : 'ON';
      const find = (r.findRegex || '').substring(0, 80).replace(/\n/g, '\\n');
      console.log(`  ${i+1}. [${status}] ${r.scriptName} | find: ${find}`);
    }
  } catch (e) {
    console.log(`\n=== ${f} === 解析失败: ${e.message}`);
  }
}
