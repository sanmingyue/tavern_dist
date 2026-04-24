import fs from 'fs';

// Manual fixes for remaining garbled characters based on context analysis
const manualFixes = {
  'src/修仙世界重置版/世界书/地图/南疆巫地/万毒神教/夜烬.yaml': [
    ['一米八�?', '一米八五'],
    ['分明带戾�?', '分明带戾气,'],
    ['不修边�?', '不修边幅,'],
    ['之体为�?', '之体为基,'],
  ],
  'src/修仙世界重置版/世界书/地图/南疆巫地/巫神教/巫灵.yaml': [
    ['不太理解�?', '不太理解恶'],
  ],
  'src/修仙世界重置版/世界书/地图/南疆巫地/巫神教/阿蛮.yaml': [
    ['"去看看它们�?', '"去看看它们"。'],
    ['管这叫"耍无赖�?', '管这叫"耍无赖"。'],
  ],
  'src/修仙世界重置版/世界书/地图/南疆巫地/极乐宫/小蛮.yaml': [
    ['炼气�?', '炼气期'],
  ],
  'src/修仙世界重置版/世界书/地图/南疆巫地/蛊魔宗/蛊婆.yaml': [
    ['渡劫�?', '渡劫期'],
  ],
};

// Process manual fixes
for (const [filePath, fixes] of Object.entries(manualFixes)) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  for (const [search, replace] of fixes) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      fixCount++;
    } else {
      console.log(`  WARNING: Pattern not found in ${filePath}: "${search}"`);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`FIXED: ${filePath} (${fixCount} manual fixes)`);
}

// For heavily corrupted files (大巫祝, 林微月, 秋水寒), use old files as reference
// with enhanced context matching - try multiple context windows and both forward/backward matching
function enhancedFixFile(newPath, oldPath) {
  let corrupted = fs.readFileSync(newPath, 'utf8');
  const reference = fs.readFileSync(oldPath, 'utf8');

  const garbledCount = (corrupted.match(/\ufffd/g) || []).length;
  if (garbledCount === 0) {
    console.log(`SKIP (no garbled chars): ${newPath}`);
    return;
  }
  console.log(`Processing ${newPath} (${garbledCount} garbled chars)...`);

  let fixed = '';
  let i = 0;
  let fixCount = 0;
  let failCount = 0;

  while (i < corrupted.length) {
    if (corrupted[i] === '\ufffd' && i + 1 < corrupted.length && corrupted[i + 1] === '?') {
      // Try context matching with both before and after context
      const beforeContext = fixed.slice(-15);
      // Get after context (skip the �?)
      let afterContext = '';
      let j = i + 2;
      while (j < corrupted.length && afterContext.length < 15) {
        if (corrupted[j] === '\ufffd') break;
        afterContext += corrupted[j];
        j++;
      }

      let replacement = null;

      // Try before+after combined context
      for (let bl = Math.min(10, beforeContext.length); bl >= 2; bl--) {
        if (replacement) break;
        const bc = beforeContext.slice(-bl);
        for (let al = Math.min(8, afterContext.length); al >= 2; al--) {
          const ac = afterContext.slice(0, al);
          // Search for bc + single_char + ac in reference
          for (let ri = 0; ri < reference.length; ri++) {
            const refBc = reference.slice(ri, ri + bl);
            if (refBc === bc && ri + bl < reference.length) {
              const refChar = reference[ri + bl];
              const refAc = reference.slice(ri + bl + 1, ri + bl + 1 + al);
              if (refAc === ac && refChar.charCodeAt(0) > 127) {
                replacement = refChar;
                break;
              }
            }
          }
          if (replacement) break;
        }
      }

      // Fallback: try before-only context (original approach)
      if (!replacement) {
        for (let cl = Math.min(10, beforeContext.length); cl >= 3; cl--) {
          const ctx = beforeContext.slice(-cl);
          const refIdx = reference.indexOf(ctx);
          if (refIdx !== -1 && refIdx + cl < reference.length) {
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
        // Context-based guessing for common patterns
        const shortBefore = beforeContext.slice(-6);
        const guesses = {
          // Common missing characters based on pattern
          '的底色': ',',
          '主色调': ':',
          '理解与思考': ':',
          '色调色盘': ':',
          '万灵之力': '量',
          '神性与人': '性',
          '十岁左右': ',',
          '数万年': ')',
          '一米八': '五',
          '教教主': ',',
          '的范围': ',',
          '超越了': '"',
          '天地本': '源',
          '走得通': ',',
          '走得好': ',',
          '的局限': '性',
          '动力之': '一',
          '仙术法': ',',
          '的问题': ':',
          '的底色': ',',
          '面刀刃': ',',
          '有生灵': ',',
          '的记忆': ',',
          '树自己': ',',
          '的阴凉': '。',
        };
        let guessed = false;
        for (const [pattern, char] of Object.entries(guesses)) {
          if (shortBefore.endsWith(pattern.slice(-6)) || beforeContext.endsWith(pattern)) {
            fixed += char;
            fixCount++;
            guessed = true;
            break;
          }
        }
        if (!guessed) {
          fixed += '\ufffd?';
          failCount++;
        }
      }
      i += 2;
    } else {
      fixed += corrupted[i];
      i++;
    }
  }

  fs.writeFileSync(newPath, fixed, 'utf8');
  console.log(`  FIXED: ${fixCount} chars, FAILED: ${failCount} chars`);

  // Verify
  const verify = fs.readFileSync(newPath, 'utf8');
  const remaining = (verify.match(/\ufffd/g) || []).length;
  if (remaining > 0) {
    console.log(`  WARNING: ${remaining} garbled chars still remain!`);
  } else {
    console.log(`  SUCCESS: All garbled chars fixed!`);
  }
}

// Process heavily corrupted files
const heavyFiles = [
  ['src/修仙世界重置版/世界书/地图/南疆巫地/巫神教/大巫祝.yaml', '修仙世界/世界书/大巫祝.yaml'],
  ['src/修仙世界重置版/世界书/地图/南疆巫地/玲珑绣阁/林微月.yaml', '修仙世界/世界书/林微月.yaml'],
  ['src/修仙世界重置版/世界书/地图/南疆巫地/玲珑绣阁/秋水寒.yaml', '修仙世界/世界书/秋水寒.yaml'],
];

for (const [newPath, oldPath] of heavyFiles) {
  try {
    enhancedFixFile(newPath, oldPath);
  } catch (e) {
    console.error(`ERROR: ${newPath}: ${e.message}`);
  }
}
