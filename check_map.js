 nconst fs = require('fs');
const c = fs.readFileSync('src/修仙世界状态栏/components/mapData.ts', 'utf-8');

function getChars(name) {
  const re = new RegExp("名称:\\s*'" + name + "'[\\s\\S]*?角色列表:\\s*\\[([^\\]]*)\\]");
  const m = c.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}

const pairs = [
  ['天脊中枢', ['天剑圣地', '玉清道宫', '万法宗', '万象城']],
  ['星辰山脉', ['玄天宗', '太虚宗', '天机阁', '灵霄宗', '天机城', '星落镇']],
  ['丹霞灵原', ['丹宗', '百草庐', '百草集', '常春城']],
  ['天启城域', ['天启城', '墨家机关城', '洛水城', '合欢宗', '流金城', '天命神教']],
  ['北境寒域', ['凛霜剑门', '青云宗', '天仙门', '临渊城', '青云城', '天仙镇']],
  ['西域草原', ['苍澜国', '万兽山庄', '百兽城', '苍澜城']],
  ['万剑山脉', ['剑宗', '剑鸣城', '红尘酒家']],
  ['东南暗域', ['噬心殿', '归稚宗', '玄渊城']],
  ['南境水乡', ['蝶化宗', '并蒂宫', '莲华镇']],
  ['灵山净土', ['小雷音寺', '琉璃城']],
  ['绿洲带', ['万宝楼', '清泉镇']],
  ['东溟海', ['东海龙宫', '碧波城', '三仙岛']],
  ['南离海', ['南海龙宫', '珊瑚宫', '火狱群岛']],
  ['北冥海', ['魅花宫', '龙墓', '幽灵船港']],
  ['西极海', ['风暴之眼', '破败海墟']],
];

pairs.forEach(([parent, children]) => {
  const pChars = new Set(getChars(parent));
  const cChars = new Set();
  children.forEach(ch => getChars(ch).forEach(x => cChars.add(x)));

  const inChildNotParent = [...cChars].filter(x => !pChars.has(x));
  const inParentNotChild = [...pChars].filter(x => !cChars.has(x));

  if (inChildNotParent.length) console.log(parent + ' 三层有二层无: ' + JSON.stringify(inChildNotParent));
  if (inParentNotChild.length) console.log(parent + ' 二层有三层无: ' + JSON.stringify(inParentNotChild));
});

// 检查重复角色（同一角色出现在多个三层标记中）
const allLayer3Chars = {};
const layer3Names = pairs.flatMap(([, children]) => children);
layer3Names.forEach(name => {
  const chars = getChars(name);
  chars.forEach(ch => {
    if (!allLayer3Chars[ch]) allLayer3Chars[ch] = [];
    allLayer3Chars[ch].push(name);
  });
});

const duplicates = Object.entries(allLayer3Chars).filter(([, locs]) => locs.length > 1);
if (duplicates.length) {
  console.log('\n⚠️ 重复出现在多个三层标记中的角色:');
  duplicates.forEach(([name, locs]) => console.log('  ' + name + ': ' + locs.join(', ')));
}
