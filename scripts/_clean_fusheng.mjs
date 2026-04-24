/**
 * 浮生预设清理脚本
 * 1. 清理变量初始化中的废弃变量
 * 2. 从所有条目文件中删除小人 addvar 引用，只保留规则内容
 * 3. 清理 COT/输出格式中的废弃变量引用
 * 4. 清理 YAML 中的废弃变量引用
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE = 'src/浮生';
const ITEMS_DIR = join(BASE, '条目');

// === 1. 清理条目文件中的小人 addvar 引用 ===
const itemFiles = readdirSync(ITEMS_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.yaml'));

for (const file of itemFiles) {
  const path = join(ITEMS_DIR, file);
  let content = readFileSync(path, 'utf-8');
  const original = content;

  // 删除 {{addvar::extra_cot_roles::...}}{{trim}} 块（小人角色描述）
  // 这些块通常是多行的，以 {{addvar::extra_cot_roles:: 开头，以 }}{{trim}} 结尾
  content = content.replace(/\{\{addvar::extra_cot_roles::[\s\S]*?\}\}\{\{trim\}\}\s*/g, '');

  // 删除 {{addvar::pre_check_roles::...}}{{trim}} 块（预检角色描述）
  content = content.replace(/\{\{addvar::pre_check_roles::[\s\S]*?\}\}\{\{trim\}\}\s*/g, '');

  // 删除 {{getvar::extra_cot_roles}} 引用
  content = content.replace(/\{\{getvar::extra_cot_roles\}\}/g, '');

  // 删除 {{getvar::pre_check_roles}} 引用
  content = content.replace(/\{\{getvar::pre_check_roles\}\}/g, '');

  // 删除 {{getvar::recap_reminder}} 引用
  content = content.replace(/\{\{getvar::recap_reminder\}\}/g, '');

  // 删除 {{getvar::recap_format}} 引用
  content = content.replace(/\{\{getvar::recap_format\}\}/g, '');

  // 删除 {{getvar::choice_format}} 引用
  content = content.replace(/\{\{getvar::choice_format\}\}/g, '');

  // 删除 {{getvar::theater_format}} 引用
  content = content.replace(/\{\{getvar::theater_format\}\}/g, '');

  // 删除 {{getvar::parallel_world_timeline}} 引用
  content = content.replace(/\{\{getvar::parallel_world_timeline\}\}/g, '');

  // 删除 {{getvar::diy}} 引用
  content = content.replace(/\{\{getvar::diy\}\}/g, '');

  // 删除 {{getvar::extra_format_adapt}} 引用
  content = content.replace(/\{\{getvar::extra_format_adapt\}\}/g, '');

  // 清理多余的空行（连续3个以上空行变成2个）
  content = content.replace(/\n{3,}/g, '\n\n');

  // 清理末尾空白
  content = content.trimEnd() + '\n';

  if (content !== original) {
    writeFileSync(path, content, 'utf-8');
    console.log(`✅ 修改: ${file}`);
  }
}

// === 2. 清理 YAML 中的变量初始化 ===
const yamlPath = join(BASE, '浮生.yaml');
let yaml = readFileSync(yamlPath, 'utf-8');
const originalYaml = yaml;

// 清理变量初始化条目中的废弃变量
// 删除: recap_format, choice_format, recap_reminder, theater_format, parallel_world_timeline, diy, extra_cot_roles
yaml = yaml.replace(/\{\{setvar::recap_format::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::choice_format::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::recap_reminder::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::theater_format::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::parallel_world_timeline::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::diy::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::extra_cot_roles::\}\}/g, '');
yaml = yaml.replace(/\{\{setvar::extra_format_adapt::\}\}/g, '');

// 清理 YAML 内联内容中的废弃变量引用
yaml = yaml.replace(/\{\{getvar::recap_reminder\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::recap_format\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::choice_format\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::theater_format\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::parallel_world_timeline\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::diy\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::extra_cot_roles\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::extra_format_adapt\}\}/g, '');
yaml = yaml.replace(/\{\{getvar::pre_check_roles\}\}/g, '');

if (yaml !== originalYaml) {
  writeFileSync(yamlPath, yaml, 'utf-8');
  console.log('✅ 修改: 浮生.yaml（变量清理）');
}

console.log('\n🎉 清理完成！');
