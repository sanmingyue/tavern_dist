import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const primary = resolve(root, 'src/8bit的幻想/8bit世界书/13_世界书导出/8bit的幻想_v1.0测试世界书.json');
const native = resolve(root, 'src/8bit的幻想/8bit世界书/13_世界书导出/8bit的幻想_v1.0测试世界书_SillyTavern原生导入.json');

const bundle = spawnSync(process.execPath, ['tavern_sync.mjs', 'bundle', '8bit_v1_worldbook'], {
  cwd: root,
  stdio: 'inherit',
});

if (bundle.status !== 0) {
  process.exit(bundle.status ?? 1);
}

copyFileSync(primary, native);

const zeroKeys = new Set(['sticky', 'cooldown', 'delay']);
const falseKeys = new Set(['caseSensitive', 'matchWholeWords', 'useGroupScoring']);

function clean(value) {
  if (Array.isArray(value)) return value.map(item => clean(item));
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (value[key] === null) {
        if (zeroKeys.has(key)) value[key] = 0;
        else if (falseKeys.has(key)) value[key] = false;
        else delete value[key];
      } else {
        value[key] = clean(value[key]);
      }
    }
    if (Array.isArray(value.key) && value.key.length === 0) {
      value.key = ['[8bit:context:v1_0]'];
    }
  }
  return value;
}

for (const file of [primary, native]) {
  const data = clean(JSON.parse(readFileSync(file, 'utf8')));
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.info(`[8bit_worldbook] cleaned ${file}`);
}
