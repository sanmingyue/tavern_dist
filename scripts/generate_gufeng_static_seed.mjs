import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const personaRoot = path.join(workspaceRoot, 'src', '古风大世界', '人设', '人物档案');
const formulaRoot = path.join(workspaceRoot, 'src', '古风大世界', '公式书');
const seedRoot = path.join(workspaceRoot, 'src', '古风大世界', '脚本', '大世界核心', 'data', 'staticSeed');

const characterOutput = path.join(seedRoot, 'characters.generated.ts');
const templateOutput = path.join(seedRoot, 'templates.generated.ts');

const locationKeywordMap = [
  ['七秀', 'qixiu_fang'],
  ['藏剑', 'cangjian_shanzhuang'],
  ['钱塘', 'jiangnan_qiantang'],
  ['西子湖', 'jiangnan_xizihu'],
  ['江南', 'jiangnan_qiantang'],
  ['扬州', 'daxia_jianghuai'],
  ['金陵', 'daxia_jianghuai'],
  ['江淮', 'daxia_jianghuai'],
  ['运河', 'daxia_jianghuai'],
  ['东都', 'daxia_dongdu'],
  ['天策', 'daxia_dongdu'],
  ['河洛', 'daxia_dongdu'],
  ['华山', 'daxia_huashan'],
  ['纯阳', 'daxia_huashan'],
  ['少林', 'daxia_songyue'],
  ['嵩岳', 'daxia_songyue'],
  ['万花', 'daxia_wanhua_valley'],
  ['长歌', 'daxia_changge_academy'],
  ['唐门', 'tangmen_baopu'],
  ['蜀中', 'daxia_shuzhong'],
  ['五毒', 'wudu_shanlin'],
  ['西南', 'daxia_xinan'],
  ['神剑宫', 'dali_shenjian_gong'],
  ['苍山', 'dali_shenjian_gong'],
  ['洱都', 'dali_erdu'],
  ['大理', 'dali_erdu'],
  ['段氏', 'dali_erdu'],
  ['苍云', 'cangyun_bao'],
  ['北境', 'daxia_beijing'],
  ['瀚北', 'hanbei_jinting'],
  ['金帐', 'hanbei_jinting'],
  ['马市', 'hanbei_jinting'],
  ['明教', 'mingjiao_huoci'],
  ['火祠', 'mingjiao_huoci'],
  ['楼兰', 'loulan_city'],
  ['流沙', 'loulan_city'],
  ['河西', 'daxia_hexi'],
  ['玉门', 'daxia_hexi'],
  ['岭南', 'daxia_lingnan'],
  ['番禺', 'daxia_lingnan'],
  ['合浦', 'daxia_lingnan'],
  ['市舶司', 'daxia_lingnan'],
  ['香舶会', 'daxia_lingnan'],
  ['海道军', 'daxia_lingnan'],
  ['南海', 'nanhai_ports'],
  ['离珠', 'nanhai_ports'],
  ['真陀', 'nanhai_ports'],
  ['槟罗', 'nanhai_ports'],
  ['占云', 'nanhai_ports'],
  ['蓬莱', 'penglai_island'],
  ['东海', 'daxia_donghai'],
  ['翁洲', 'daxia_donghai'],
  ['海东', 'haidong_ports'],
  ['辰罗', 'haidong_ports'],
  ['玄济', 'haidong_ports'],
  ['星门', 'haidong_ports'],
  ['雪岭', 'xueling_yaoshan'],
  ['北天药宗', 'xueling_yaoshan'],
  ['药宗', 'xueling_yaoshan'],
  ['恶人谷', 'erengu'],
  ['浩气盟', 'haoqimeng'],
  ['霸刀', 'daxia_badao'],
  ['衍天', 'daxia_yantian'],
  ['万灵', 'wanling_shanzhuang'],
  ['神京', 'daxia_shenjing'],
  ['京畿', 'daxia_shenjing'],
  ['天牢', 'daxia_shenjing'],
  ['皇城', 'daxia_shenjing'],
  ['宫城', 'daxia_shenjing'],
  ['宫门', 'daxia_shenjing'],
  ['御史台', 'daxia_shenjing'],
  ['太府寺', 'daxia_shenjing'],
  ['大理寺', 'daxia_shenjing'],
  ['宗室', 'daxia_shenjing'],
  ['曲江', 'daxia_shenjing'],
  ['书肆', 'daxia_shenjing'],
  ['河朔', 'daxia_badao'],
  ['青峡', 'xueling_yaoshan'],
  ['君山', 'haoqimeng'],
  ['郡学', 'daxia_dongdu'],
  ['红尘酒家', 'hongchen_jiujia_qiantang'],
  ['分号', 'hongchen_jiujia_qiantang'],
  ['乌泉', 'loulan_city'],
  ['药泉', 'xueling_yaoshan'],
];

const factionIdMap = new Map([
  ['旧相府', 'old_chancellor_house'],
  ['门下省', 'menxia_old_officials'],
  ['神京宗室', 'shenjing_imperial_clan'],
  ['神京禁军', 'shenjing_guard'],
  ['凌雪阁', 'lingxue'],
  ['天策府', 'tiance'],
  ['苍云', 'cangyun'],
  ['七秀', 'qixiu'],
  ['藏剑山庄', 'cangjian'],
  ['纯阳', 'chunyang'],
  ['少林', 'shaolin'],
  ['万花', 'wanhua'],
  ['唐门', 'tangmen'],
  ['五毒', 'wudu'],
  ['明教', 'mingjiao'],
  ['丐帮', 'gaibang'],
  ['长歌', 'changge'],
  ['霸刀山庄', 'badao'],
  ['蓬莱', 'penglai'],
  ['衍天宗', 'yantian'],
  ['北天药宗', 'yaozong'],
  ['刀宗', 'daozong'],
  ['万灵山庄', 'wanling'],
  ['段氏', 'duanshi'],
  ['大理段氏', 'duanshi'],
  ['浩气盟', 'haoqimeng'],
  ['恶人谷', 'erengu'],
  ['红尘酒家', 'hongchen_jiujia'],
  ['瀚北汗庭', 'hanbei_khanate'],
  ['楼兰', 'loulan'],
  ['海东辰罗', 'haidong_chenluo'],
  ['南海离珠国', 'nanhai_lizhu'],
  ['南海', 'nanhai'],
]);

const knownJx3Factions = new Set([
  '七秀',
  '藏剑山庄',
  '纯阳',
  '少林',
  '万花',
  '唐门',
  '五毒',
  '明教',
  '丐帮',
  '天策府',
  '苍云',
  '长歌',
  '霸刀山庄',
  '蓬莱',
  '凌雪阁',
  '衍天宗',
  '北天药宗',
  '刀宗',
  '万灵山庄',
  '段氏',
  '浩气盟',
  '恶人谷',
]);

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function writeGenerated(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('00_')) return [fullPath];
    return [];
  });
}

function clean(value) {
  return value.replace(/\r/g, '').replace(/[。；;]\s*$/u, '').trim();
}

function parseKeyValueMarkdown(content) {
  const fields = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    const match = line.match(/^([^：:]{1,20})[：:]\s*(.+?)\s*$/u);
    if (!match) continue;
    fields[clean(match[1])] = clean(match[2]);
  }
  return fields;
}

function parseBeautyIndex() {
  const filePath = path.join(formulaRoot, '44_天下风华录三十席核心索引公式书.md');
  const content = readUtf8(filePath);
  const map = new Map();
  let volume = '';
  for (const line of content.split('\n')) {
    if (line.includes('惊鸿卷十席')) volume = '惊鸿卷';
    if (line.includes('照水卷十席')) volume = '照水卷';
    if (line.includes('闻香卷十席')) volume = '闻香卷';
    if (!line.startsWith('|') || line.includes('---') || line.includes('姓名或称谓')) continue;
    const cells = line
      .slice(1, -1)
      .split('|')
      .map(cell => clean(cell));
    if (cells.length < 10) continue;
    const [, direction, name, ageText, regionText, publicIdentity, factionName, reason, offerText, situation] = cells;
    map.set(name, { volume, direction, ageText, regionText, publicIdentity, factionName, reason, offerText, situation });
  }
  return map;
}

function detectLocationId(...texts) {
  const joined = texts.filter(Boolean).join('，');
  for (const [keyword, locationId] of locationKeywordMap) {
    if (joined.includes(keyword)) return locationId;
  }
  return 'unknown';
}

function detectLocationIds(text) {
  return unique(locationKeywordMap.filter(([keyword]) => text.includes(keyword)).map(([, locationId]) => locationId));
}

function detectRegionIds(locationIds) {
  const regionByLocationId = new Map([
    ['daxia', 'world'],
    ['daxia_shenjing', 'daxia_jingji'],
    ['daxia_yantian', 'daxia_jingji'],
    ['daxia_dongdu', 'daxia_heluoguan'],
    ['daxia_songyue', 'daxia_heluoguan'],
    ['jiangnan_qiantang', 'daxia_jiangnan'],
    ['jiangnan_xizihu', 'daxia_jiangnan'],
    ['qixiu_fang', 'daxia_jiangnan'],
    ['cangjian_shanzhuang', 'daxia_jiangnan'],
    ['hongchen_jiujia_qiantang', 'daxia_jiangnan'],
    ['daxia_jianghuai', 'daxia_jianghuai'],
    ['daxia_changge_academy', 'daxia_jianghuai'],
    ['daxia_huashan', 'daxia_guanzhong'],
    ['daxia_wanhua_valley', 'daxia_guanzhong'],
    ['daxia_shuzhong', 'daxia_shuzhong'],
    ['tangmen_baopu', 'daxia_shuzhong'],
    ['daxia_xinan', 'daxia_xinan'],
    ['wudu_shanlin', 'daxia_xinan'],
    ['dali_erdu', 'dali'],
    ['dali_shenjian_gong', 'dali'],
    ['daxia_beijing', 'daxia_beijing'],
    ['cangyun_bao', 'daxia_beijing'],
    ['hanbei_jinting', 'hanbei'],
    ['daxia_hexi', 'daxia_hexi'],
    ['loulan_city', 'loulan'],
    ['mingjiao_huoci', 'loulan'],
    ['daxia_lingnan', 'daxia_lingnan'],
    ['wanling_shanzhuang', 'daxia_lingnan'],
    ['nanhai_ports', 'nanhai'],
    ['daxia_donghai', 'daxia_donghai'],
    ['penglai_island', 'daxia_donghai'],
    ['haidong_ports', 'haidong'],
    ['xueling_yaoshan', 'xueling'],
    ['erengu', 'kunlun'],
    ['haoqimeng', 'nanpingshan'],
    ['daxia_badao', 'daxia_beidi'],
  ]);
  return unique(
    locationIds.map(locationId => {
      return regionByLocationId.get(locationId) ?? 'world';
    }),
  );
}

function detectFactionId(factionName) {
  if (!factionName) return '';
  for (const [name, factionId] of factionIdMap) {
    if (factionName.includes(name)) return factionId;
  }
  const first = factionName.split(/[、，,]/u)[0]?.trim() ?? '';
  return first ? `faction_${first.replace(/[^\p{Script=Han}A-Za-z0-9_{}]/gu, '')}` : '';
}

function detectCategory(fields, sourcePath) {
  const formula = fields['涉及公式书'] ?? '';
  const factionName = fields['所属势力'] ?? '';
  if (sourcePath.includes('00_核心家族与神京') || formula.includes('正式主线')) return 'mainline';
  if (formula.includes('正式暗线')) return 'hiddenline';
  if (fields['风华录位置']) return 'beauty';
  if (knownJx3Factions.has(factionName) || [...knownJx3Factions].some(name => factionName.includes(name))) return 'sect';
  if (fields['武评位置']) return 'master';
  if (factionName.includes('商') || fields['明面身份']?.includes('掌柜')) return 'merchant';
  if (factionName.includes('宗室') || factionName.includes('禁军') || fields['明面身份']?.includes('官')) return 'court';
  return 'common';
}

function detectPowerTier(powerRankText) {
  if (!powerRankText) return 0;
  if (powerRankText.includes('接近天榜') || powerRankText.includes('天榜争议')) return 84;
  if (powerRankText.includes('天榜')) return 92;
  if (powerRankText.includes('地榜')) return 72;
  if (powerRankText.includes('人榜')) return 52;
  return 0;
}

function detectBeautyRegisterId(beautyRankText, name) {
  if (!beautyRankText) return '';
  if (beautyRankText.includes('惊鸿卷')) return `fenghua_jinghong_${name}`;
  if (beautyRankText.includes('照水卷')) return `fenghua_zhaoshui_${name}`;
  if (beautyRankText.includes('闻香卷')) return `fenghua_wenxiang_${name}`;
  return `fenghua_${name}`;
}

function parseFormulaIds(text) {
  if (!text) return [];
  return unique(
    text
      .split(/[，,、]/u)
      .map(item => clean(item))
      .filter(Boolean),
  );
}

function readFirstField(fields, keys) {
  for (const key of keys) {
    if (fields[key]) return fields[key];
  }
  return '';
}

function buildAppearanceProfile(fields, name, beauty, isJx3, locationId, factionName) {
  const explicitAppearance = readFirstField(fields, ['外貌', '外观', '基础外观', '形貌', '相貌', '容貌', '外貌特征']);
  if (explicitAppearance) return explicitAppearance;
  if (beauty) return `${beauty.volume}，${beauty.direction}：${beauty.reason}`;
  if (isJx3) return '待补（剑网3原设外貌资料）';
  return buildOriginalAppearanceDraft(fields, name, locationId, factionName);
}

function buildOriginalAppearanceDraft(fields, name, locationId, factionName) {
  const publicIdentity = fields['明面身份'] ?? '';
  const regionText = fields['所在地域'] ?? '';
  const martialDirection = fields['武学方向'] ?? '';
  const ageText = fields['年岁'] ?? '';
  const pieces = [];

  if (ageText) pieces.push(`年岁约${ageText}`);

  if (publicIdentity.includes('御史') || factionName.includes('御史')) {
    pieces.push('眉目端肃，官服整洁克制，冠带分明，常携弹章与文牍，举止有台院官的锋利');
  } else if (publicIdentity.includes('大理寺') || factionName.includes('大理寺')) {
    pieces.push('面容冷静，官署行装利落，衣色沉稳，腰间常有案牍牌符，袖口多墨痕与封泥印迹');
  } else if (publicIdentity.includes('内侍') || factionName.includes('内廷')) {
    pieces.push('宫中内侍装束，衣饰细密而不张扬，步伐轻，行止讲究宫门规矩，随身可见递信牌符');
  } else if (publicIdentity.includes('禁军') || factionName.includes('禁军')) {
    pieces.push('肩背挺直，宿卫武官装束，刀甲齐整，靴底与护腕常留宫门值守的磨痕');
  } else if (publicIdentity.includes('账房') || publicIdentity.includes('银号') || factionName.includes('商')) {
    pieces.push('衣料讲究但便于行事，袖口适合翻账验货，随身常有算盘、账袋、钥牌或印契');
  } else if (publicIdentity.includes('船') || publicIdentity.includes('水')) {
    pieces.push('水路行走打扮，衣摆便于登船涉水，肤色与手掌带风浪、缆索和日晒痕迹');
  } else if (publicIdentity.includes('译官') || publicIdentity.includes('使团') || factionName.includes('外邦')) {
    pieces.push('衣饰兼有本地礼俗与外邦纹样，发饰、腰带或披巾能看出国别，随身常有译牒、印信或礼书');
  } else if (publicIdentity.includes('王女') || publicIdentity.includes('公主') || publicIdentity.includes('郡主')) {
    pieces.push('仪态受宫廷礼法约束，贵族礼服讲究，首饰、衣纹与随侍排场皆能看出门第和国别');
  } else if (publicIdentity.includes('书吏') || publicIdentity.includes('先生') || publicIdentity.includes('门人')) {
    pieces.push('文士书吏装束，衣色清简，指间常有墨痕，随身可见书卷、笔札或藏卷封签');
  } else if (publicIdentity.includes('酒家') || publicIdentity.includes('掌柜')) {
    pieces.push('掌柜行装讲究实用，衣袖常染酒香、茶烟或柜台尘色，腰间多挂账牌、钥匙或酒筹');
  } else if (martialDirection) {
    pieces.push(`行装贴近${martialDirection}，肩背、手掌、兵器、护具与步法痕迹明显`);
  } else if (regionText || locationId !== 'unknown') {
    pieces.push(`衣着取${regionText || locationId}常见形制，发冠、鞋履、随身物与行止带当地风物痕迹`);
  }

  if (pieces.length === 0) return `${name}的外貌待补。`;
  return pieces.join('，');
}

function buildCoreInfo(fields, name, appearanceProfile) {
  return [
    `姓名或称谓：${name}`,
    fields['年岁'] ? `年岁：${fields['年岁']}` : '',
    appearanceProfile ? `外貌：${appearanceProfile}` : '外貌：待补',
    fields['所在地域'] ? `所在地域：${fields['所在地域']}` : '',
    fields['常在地点'] ? `常在地点：${fields['常在地点']}` : '',
    fields['明面身份'] ? `明面身份：${fields['明面身份']}` : '',
    fields['所属势力'] ? `所属势力：${fields['所属势力']}` : '',
    fields['实际牵连'] ? `实际牵连：${fields['实际牵连']}` : '',
    fields['武学方向'] ? `武学方向：${fields['武学方向']}` : '',
    fields['武评位置'] ? `武评位置：${fields['武评位置']}` : '',
    fields['风华录位置'] ? `风华录位置：${fields['风华录位置']}` : '',
    fields['可提供之物'] ? `可提供之物：${fields['可提供之物']}` : '',
    fields['所惧之事'] ? `所惧之事：${fields['所惧之事']}` : '',
    fields['当前处境'] ? `当前处境：${fields['当前处境']}` : '',
    '性格：待手写',
  ]
    .filter(Boolean)
    .join('；');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferTags(fields, sourcePath, category, locationId, factionId) {
  const tags = [
    category,
    locationId !== 'unknown' ? locationId : '',
    factionId,
    fields['武评位置'] ? 'power_rank' : '',
    fields['风华录位置'] ? 'fenghua' : '',
    fields['涉及公式书']?.includes('正式主线') ? 'mainline' : '',
    fields['涉及公式书']?.includes('正式暗线') ? 'hiddenline' : '',
    sourcePath.split('/').slice(-2, -1)[0] ?? '',
  ];
  const factionName = fields['所属势力'] ?? '';
  for (const name of knownJx3Factions) {
    if (factionName.includes(name)) tags.push('jx3_source', 'sect');
  }
  return unique(tags);
}

function buildCharacters() {
  const beautyIndex = parseBeautyIndex();
  const files = listMarkdownFiles(personaRoot).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const profiles = [];
  const femaleRoster = [];

  for (const filePath of files) {
    const content = readUtf8(filePath);
    const fields = parseKeyValueMarkdown(content);
    const fileName = path.basename(filePath, '.md');
    const declaredName = fields['姓名'] || fields['称谓'] || fields['名讳'];
    const name = declaredName && declaredName !== '待定' ? declaredName : fileName;
    if (!name || name === '00_角色索引总表') continue;

    const sourcePath = path.relative(workspaceRoot, filePath).replaceAll(path.sep, '/');
    const ageText = fields['年岁'] ?? beautyIndex.get(name)?.ageText ?? '';
    const regionText = fields['所在地域'] ?? beautyIndex.get(name)?.regionText ?? '';
    const usualLocationText = fields['常在地点'] ?? '';
    const publicIdentity = fields['明面身份'] ?? beautyIndex.get(name)?.publicIdentity ?? '';
    const factionName = fields['所属势力'] ?? beautyIndex.get(name)?.factionName ?? '';
    const actualInvolvement = fields['实际牵连'] ?? '';
    const martialDirection = fields['武学方向'] ?? '';
    const powerRankText = fields['武评位置'] ?? '';
    const beautyRankText = fields['风华录位置'] ?? '';
    const offerText = fields['可提供之物'] ?? beautyIndex.get(name)?.offerText ?? '';
    const fearText = fields['所惧之事'] ?? '';
    const currentSituation = fields['当前处境'] ?? beautyIndex.get(name)?.situation ?? '';
    const locationId = detectLocationId(usualLocationText, regionText, factionName, publicIdentity);
    const factionId = detectFactionId(factionName);
    const category = detectCategory(fields, sourcePath);
    const beauty = beautyIndex.get(name);
    const isJx3 = [...knownJx3Factions].some(faction => factionName.includes(faction));
    const appearanceProfile = buildAppearanceProfile(fields, name, beauty, isJx3, locationId, factionName);

    const profile = {
      npcId: `npc_${name}`,
      name,
      aliases: unique([fileName !== name ? fileName : '', fields['名讳'] && fields['名讳'] !== '待定' ? fields['名讳'] : '']),
      category,
      factionId,
      homeLocationId: locationId,
      initialLocationId: locationId,
      currentLocationId: locationId,
      rankTitle: powerRankText || beautyRankText || '',
      powerTier: detectPowerTier(powerRankText),
      beautyRegisterId: detectBeautyRegisterId(beautyRankText, name),
      ageText,
      regionText,
      usualLocationText,
      publicIdentity,
      factionName,
      actualInvolvement,
      martialDirection,
      powerRankText,
      beautyRankText,
      offerText,
      fearText,
      currentSituation,
      appearanceProfile,
      personalityPlaceholder: '待手写',
      sourcePath,
      coreInfo: buildCoreInfo(fields, name, appearanceProfile),
      formulaResourceIds: parseFormulaIds(fields['涉及公式书']),
      tags: inferTags(fields, sourcePath, category, locationId, factionId),
    };

    profiles.push(profile);

    if (beautyRankText || beauty) {
      femaleRoster.push({
        npcId: profile.npcId,
        displayName: name,
        source: 'fixed',
        locationId,
        discovered: false,
        tags: unique(['fenghua', beauty?.volume ?? '', beauty?.direction ?? '', beautyRankText]),
        notes: [beautyRankText, appearanceProfile, offerText ? `可牵：${offerText}` : ''].filter(Boolean).join('；'),
      });
    }
  }

  return { profiles, femaleRoster };
}

function parseSectionBlocks(content) {
  const blocks = [];
  let current = null;
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    const heading = line.match(/^###\s+(\d+(?:\.\d+)*)\s+(.+)$/u);
    if (heading) {
      if (current) blocks.push(current);
      current = { code: heading[1], title: clean(heading[2]), fields: {} };
      continue;
    }
    if (!current) continue;
    const match = line.match(/^([^：:]{1,20})[：:]\s*(.+)$/u);
    if (match) current.fields[clean(match[1])] = clean(match[2]);
  }
  if (current) blocks.push(current);
  return blocks;
}

function extractNpcIds(text, names) {
  const found = [];
  for (const name of names.sort((a, b) => b.length - a.length)) {
    if (text.includes(name) && !found.some(existing => existing.includes(name) || name.includes(existing))) {
      found.push(name);
    }
  }
  return found.map(name => `npc_${name}`);
}

function buildTemplates(profiles) {
  const names = profiles.map(profile => profile.name);
  const sideFormula = readUtf8(path.join(formulaRoot, '41_正式支线区域事件公式书.md'));
  const blocks = parseSectionBlocks(sideFormula).filter(block => block.fields['表面事件']);
  const events = [];
  const quests = [];

  for (const block of blocks) {
    const locationText = block.fields['地点'] ?? '';
    const involvedText = block.fields['牵涉人物'] ?? '';
    const contentText = block.fields['可得内容'] ?? '';
    const resolutionText = block.fields['收束方向'] ?? '';
    const aftermathText = block.fields['余波'] ?? '';
    const locationIds = detectLocationIds(`${block.title}，${locationText}`);
    const relatedNpcIds = extractNpcIds(involvedText, names);
    const templateId = `event_side_${block.code.replaceAll('.', '_')}_${slugAscii(block.title)}`;
    const questId = `side_${block.code.replaceAll('.', '_')}_${slugAscii(block.title)}`;

    events.push({
      templateId,
      title: block.title,
      kind: 'quest_hook',
      weight: 5,
      locationIds,
      regionIds: detectRegionIds(locationIds),
      requiredTags: ['sidequest'],
      relatedNpcIds,
      consequenceType: 'custom',
      summary: [block.fields['表面事件'], contentText ? `可得内容：${contentText}` : '', aftermathText ? `余波：${aftermathText}` : '']
        .filter(Boolean)
        .join('；'),
    });

    quests.push({
      questId,
      title: block.title,
      kind: 'sidequest',
      startStepId: `${questId}_start`,
      relatedNpcIds,
      relatedLocationIds: locationIds,
      tags: ['sidequest', `region_${block.code.split('.')[0]}`],
      steps: [
        {
          stepId: `${questId}_start`,
          title: '接触事件',
          description: block.fields['表面事件'],
          relatedNpcIds,
          relatedLocationIds: locationIds,
          nextStepIds: [`${questId}_investigate`],
        },
        {
          stepId: `${questId}_investigate`,
          title: '查证牵连',
          description: [block.fields['地方层次'] ? `地方层次：${block.fields['地方层次']}` : '', contentText ? `可得内容：${contentText}` : '']
            .filter(Boolean)
            .join('；'),
          relatedNpcIds,
          relatedLocationIds: locationIds,
          nextStepIds: [`${questId}_settle`],
        },
        {
          stepId: `${questId}_settle`,
          title: '收束余波',
          description: [resolutionText ? `收束方向：${resolutionText}` : '', aftermathText ? `余波：${aftermathText}` : '']
            .filter(Boolean)
            .join('；'),
          relatedNpcIds,
          relatedLocationIds: locationIds,
          nextStepIds: [],
        },
      ],
    });
  }

  return { events, quests };
}

function slugAscii(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function formatTsArrayExport(imports, exports) {
  return `${imports.join('\n')}\n\n${Object.entries(exports)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)};\n`)
    .join('\n')}`;
}

const { profiles, femaleRoster } = buildCharacters();
const { events, quests } = buildTemplates(profiles);

writeGenerated(
  characterOutput,
  formatTsArrayExport(
    [
      "import type { FixedCharacterProfile } from '../../types/characters';",
      "import type { FemaleRosterRegisterPayload } from '../../types/intimacy';",
    ],
    {
      GENERATED_CHARACTER_SEED: profiles,
      GENERATED_FEMALE_ROSTER_SEED: femaleRoster,
    },
  ).replace('export const GENERATED_CHARACTER_SEED =', 'export const GENERATED_CHARACTER_SEED: FixedCharacterProfile[] =')
    .replace('export const GENERATED_FEMALE_ROSTER_SEED =', 'export const GENERATED_FEMALE_ROSTER_SEED: FemaleRosterRegisterPayload[] ='),
);

writeGenerated(
  templateOutput,
  formatTsArrayExport(
    ["import type { WorldEventTemplate } from '../../types/events';", "import type { QuestDefinition } from '../../types/quest';"],
    {
      GENERATED_SIDE_EVENT_TEMPLATES: events,
      GENERATED_SIDE_QUEST_TEMPLATES: quests,
    },
  ).replace('export const GENERATED_SIDE_EVENT_TEMPLATES =', 'export const GENERATED_SIDE_EVENT_TEMPLATES: WorldEventTemplate[] =')
    .replace('export const GENERATED_SIDE_QUEST_TEMPLATES =', 'export const GENERATED_SIDE_QUEST_TEMPLATES: QuestDefinition[] ='),
);

console.info(
  JSON.stringify(
    {
      characters: profiles.length,
      femaleRoster: femaleRoster.length,
      sideEvents: events.length,
      sideQuests: quests.length,
      characterOutput: path.relative(workspaceRoot, characterOutput),
      templateOutput: path.relative(workspaceRoot, templateOutput),
    },
    null,
    2,
  ),
);
