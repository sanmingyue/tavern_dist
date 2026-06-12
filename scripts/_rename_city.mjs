// 全局替换 XX → 澜景
import fs from 'fs';
import path from 'path';

const BASE = 'src/角色卡/XX市/世界书/地图';

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.yaml')) {
      // 替换文件内容
      let content = fs.readFileSync(fullPath, 'utf-8');
      const original = content;
      content = content.replaceAll('XX市', '澜景市');
      content = content.replaceAll('XX大学', '澜景大学');
      content = content.replaceAll('XX东站', '澜景东站');
      content = content.replaceAll('XX城站', '澜景城站');
      content = content.replaceAll('XX渔港', '澜景渔港');
      content = content.replaceAll('XX港', '澜景港');
      content = content.replaceAll('XX理工大学', '澜景理工大学');
      content = content.replaceAll('XX绕城高速', '澜景绕城高速');
      content = content.replaceAll('沪XX高速', '沪澜高速');
      content = content.replaceAll('XX金高速', '澜金高速');
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
      }

      // 重命名包含XX的文件
      if (entry.name.includes('XX')) {
        const newName = entry.name.replaceAll('XX', '澜景');
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`重命名: ${entry.name} → ${newName}`);
      }
    }
  }
}

walkDir(BASE);

// 也替换城市树状图
const mdPath = 'src/角色卡/XX市/城市树状图.md';
if (fs.existsSync(mdPath)) {
  let md = fs.readFileSync(mdPath, 'utf-8');
  md = md.replaceAll('XX市', '澜景市');
  md = md.replaceAll('XX大学', '澜景大学');
  md = md.replaceAll('XX东站', '澜景东站');
  md = md.replaceAll('XX城站', '澜景城站');
  md = md.replaceAll('XX渔港', '澜景渔港');
  md = md.replaceAll('XX港', '澜景港');
  md = md.replaceAll('XX理工大学', '澜景理工大学');
  md = md.replaceAll('XX绕城高速', '澜景绕城高速');
  md = md.replaceAll('沪XX高速', '沪澜高速');
  md = md.replaceAll('XX金高速', '澜金高速');
  // 通用XX替换（文件名中的）
  md = md.replaceAll('XX一中', '澜景一中');
  md = md.replaceAll('XX附中', '澜景附中');
  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log('城市树状图已替换');
}

// 替换变量相关文件
const varDir = 'src/角色卡/XX市/世界书/变量';
if (fs.existsSync(varDir)) {
  const files = fs.readdirSync(varDir);
  for (const f of files) {
    const fp = path.join(varDir, f);
    if (fs.statSync(fp).isFile()) {
      let c = fs.readFileSync(fp, 'utf-8');
      c = c.replaceAll('XX市', '澜景市');
      fs.writeFileSync(fp, c, 'utf-8');
    }
  }
}

// 替换第一条消息
const msgPath = 'src/角色卡/XX市/第一条消息/0.txt';
if (fs.existsSync(msgPath)) {
  let msg = fs.readFileSync(msgPath, 'utf-8');
  msg = msg.replaceAll('XX市', '澜景市');
  fs.writeFileSync(msgPath, msg, 'utf-8');
}

console.log('全局替换完成');
