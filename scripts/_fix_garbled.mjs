// Fix garbled characters in 修仙世界重置版 files
// The corruption pattern: each Chinese character's last byte was replaced with EF BF BD 3F (�?)
// Strategy: For each corrupted file, read the old file, build a mapping of context -> correct char,
// then replace each �? with the correct character.

import fs from 'fs';
import path from 'path';

const GARBLED = '\ufffd?'; // The replacement pattern in the corrupted files

// Map: new file path -> old file name (in 修仙世界/世界书/)
const fileMap = {
  'src/修仙世界重置版/世界书/地图/南疆巫地/蛇姬·青鸢.yaml': '蛇姬·青鸢',
  'src/修仙世界重置版/世界书/地图/南疆巫地/万毒神教/夜幽.yaml': '夜幽',
  'src/修仙世界重置版/世界书/地图/南疆巫地/万毒神教/夜烬.yaml': '夜烬',
  'src/修仙世界重置版/世界书/地图/南疆巫地/巫神教/大巫祝.yaml': '大巫祝',
  'src/修仙世界重置版/世界书/地图/南疆巫地/巫神教/巫灵.yaml': '巫灵',
  'src/修仙世界重置版/世界书/地图/南疆巫地/巫神教/阿蛮.yaml': '阿蛮',
  'src/修仙世界重置版/世界书/地图/南疆巫地/极乐宫/小蛮.yaml': '小蛮',
  'src/修仙世界重置版/世界书/地图/南疆巫地/玲珑绣阁/云纤纤.yaml': '云纤纤',
  'src/修仙世界重置版/世界书/地图/南疆巫地/玲珑绣阁/林微月.yaml': '林微月',
  'src/修仙世界重置版/世界书/地图/南疆巫地/玲珑绣阁/秋水寒.yaml': '秋水寒',
  'src/修仙世界重置版/世界书/地图/南疆巫地/生命之森/木叶.yaml': '木叶',
  'src/修仙世界重置版/世界书/地图/南疆巫地/蛊魔宗/蛊婆.yaml': '蛊婆',
};

function fixFile(newPath, oldName) {
  const oldPath = `修仙世界/世界书/${oldName}.yaml`;

  const corrupted = fs.readFileSync(newPath, 'utf8');
  const reference = fs.readFileSync(oldPath, 'utf8');

  if (!corrupted.includes('\ufffd')) {
    console.log(`SKIP (no garbled chars): ${newPath}`);
    return;
  }

  // Build a set of all Chinese characters from the reference file
  // For each occurrence of �? in the corrupted file, look at surrounding context
  // and find the matching character from the reference

  // Strategy: For each garbled position, take N chars before it, find same prefix in reference,
  // and extract the character that should be there.

  let fixed = '';
  let i = 0;
  let fixCount = 0;

  while (i < corrupted.length) {
    if (corrupted[i] === '\ufffd' && i + 1 < corrupted.length && corrupted[i + 1] === '?') {
      // Found a garbled char. Try to recover it using context matching.
      // Take up to 10 chars before the garbled position as context
      const contextLen = Math.min(10, fixed.length);
      const beforeContext = fixed.slice(-contextLen);

      // Search for this context in the reference file
      let replacement = null;

      if (beforeContext.length > 0) {
        // Try progressively shorter context until we find a match
        for (let cl = contextLen; cl >= 2; cl--) {
          const ctx = beforeContext.slice(-cl);
          const refIdx = reference.indexOf(ctx);
          if (refIdx !== -1) {
            const charAfter = reference[refIdx + cl];
            if (charAfter && charAfter.charCodeAt(0) > 127) {
              replacement = charAfter;
              break;
            }
          }
        }
      }

      if (replacement) {
        fixed += replacement;
        fixCount++;
      } else {
        // Can't recover - keep the garbled chars
        fixed += '\ufffd?';
        console.log(`  WARNING: Could not recover char at position ${i}, context: "${beforeContext}"`);
      }

      i += 2; // Skip both the replacement char and the ?
    } else {
      fixed += corrupted[i];
      i++;
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(newPath, fixed, 'utf8');
    console.log(`FIXED: ${newPath} (${fixCount} chars recovered)`);
  }

  // Verify no garbled chars remain
  const verify = fs.readFileSync(newPath, 'utf8');
  const remaining = (verify.match(/\ufffd/g) || []).length;
  if (remaining > 0) {
    console.log(`  WARNING: ${remaining} garbled chars still remain!`);
  }
}

for (const [newPath, oldName] of Object.entries(fileMap)) {
  try {
    fixFile(newPath, oldName);
  } catch (e) {
    console.error(`ERROR processing ${newPath}: ${e.message}`);
  }
}
