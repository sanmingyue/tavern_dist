import type { GameAction } from '../types/actions';
import type { GameSave } from '../types/schema';

const STATE_INJECT_ID = 'gufeng-world-authoritative-state';

type FormulaResource = {
  id: string;
  title: string;
  path: string;
  tags: string[];
};

const FORMULA_RESOURCES: FormulaResource[] = [
  { id: 'GF-13', title: '武功体系与战力边界公式书', path: '公式书/13_武功体系与战力边界公式书.md', tags: ['combat', 'martial'] },
  { id: 'GF-14', title: '江湖运行公式书', path: '公式书/14_江湖运行公式书.md', tags: ['jianghu', 'sect', 'reputation', 'side'] },
  { id: 'GF-15', title: '朝堂军政公式书', path: '公式书/15_朝堂军政公式书.md', tags: ['court', 'military', 'reputation'] },
  { id: 'GF-19', title: '天下榜单与风华录公式书', path: '公式书/19_天下榜单与风华录公式书.md', tags: ['ranking', 'beauty', 'master', 'npc'] },
  { id: 'GF-20', title: '主线关系网与明暗制衡公式书', path: '公式书/20_主线关系网与明暗制衡公式书.md', tags: ['mainline', 'hiddenline', 'court', 'npc'] },
  { id: 'GF-22', title: '主线证据链公式书', path: '公式书/22_主线证据链公式书.md', tags: ['mainline', 'evidence'] },
  { id: 'GF-23', title: '暗线归一公式书', path: '公式书/23_暗线归一公式书.md', tags: ['hiddenline', 'evidence'] },
  { id: 'GF-24', title: '地方支线结构公式书', path: '公式书/24_地方支线结构公式书.md', tags: ['side', 'event'] },
  { id: 'GF-26', title: '角色索引总册公式书', path: '公式书/26_角色索引总册公式书.md', tags: ['npc'] },
  { id: 'GF-33', title: '红尘酒家公式书', path: '公式书/33_红尘酒家公式书.md', tags: ['rumor', 'event', 'jianghu'] },
  { id: 'GF-34', title: '主线不强牵运行公式书', path: '公式书/34_主线不强牵运行公式书.md', tags: ['mainline'] },
  { id: 'GF-35', title: '暗线碎片归一运行公式书', path: '公式书/35_暗线碎片归一运行公式书.md', tags: ['hiddenline'] },
  { id: 'GF-36', title: '支线覆盖与长线游历公式书', path: '公式书/36_支线覆盖与长线游历公式书.md', tags: ['side', 'event'] },
  { id: 'GF-38', title: '人物索引一致性公式书', path: '公式书/38_人物索引一致性公式书.md', tags: ['npc'] },
  { id: 'GF-43', title: '天下武评百人核心索引公式书', path: '公式书/43_天下武评百人核心索引公式书.md', tags: ['ranking', 'master', 'combat'] },
  { id: 'GF-44', title: '天下风华录三十席核心索引公式书', path: '公式书/44_天下风华录三十席核心索引公式书.md', tags: ['ranking', 'beauty', 'npc'] },
  { id: 'GF-45', title: '大世界运行公式书', path: '公式书/45_大世界运行公式书.md', tags: ['time', 'travel', 'world'] },
  { id: 'GF-46', title: '行动与后果公式书', path: '公式书/46_行动与后果公式书.md', tags: ['consequence', 'reputation'] },
  { id: 'GF-47', title: '战斗结算公式书', path: '公式书/47_战斗结算公式书.md', tags: ['combat'] },
  { id: 'GF-48', title: '经营与养成细则公式书', path: '公式书/48_经营与养成细则公式书.md', tags: ['business', 'growth', 'intimacy'] },
  { id: 'GF-49', title: '礼俗生活公式书', path: '公式书/49_礼俗生活公式书.md', tags: ['custom', 'life', 'jiangnan', 'intimacy'] },
  { id: 'GF-50', title: '地方美人与地方高手名册结构公式书', path: '公式书/50_地方美人与地方高手名册结构公式书.md', tags: ['beauty', 'master', 'npc', 'intimacy'] },
  { id: 'GF-51', title: '物价与资源公式书', path: '公式书/51_物价与资源公式书.md', tags: ['price', 'resource'] },
  { id: 'GF-DX-23', title: '江南开局专卷公式书', path: '公式书/大夏/23_江南开局专卷公式书.md', tags: ['jiangnan', 'opening'] },
  { id: 'GF-39', title: '正式主线区域推进公式书', path: '公式书/39_正式主线区域推进公式书.md', tags: ['mainline'] },
  { id: 'GF-40', title: '正式暗线区域拼图公式书', path: '公式书/40_正式暗线区域拼图公式书.md', tags: ['hiddenline'] },
  { id: 'GF-41', title: '正式支线区域事件公式书', path: '公式书/41_正式支线区域事件公式书.md', tags: ['side'] },
  { id: 'GF-DX-21', title: '神京朝局专卷公式书', path: '公式书/大夏/21_神京朝局专卷公式书.md', tags: ['court', 'capital'] },
  { id: 'GF-DX-22', title: '宫禁与宗室公式书', path: '公式书/大夏/22_宫禁与宗室公式书.md', tags: ['court', 'palace', 'hiddenline'] },
  { id: 'GF-52', title: '大夏地方人物名册公式书', path: '公式书/52_大夏地方人物名册公式书.md', tags: ['npc', 'daxia'] },
  { id: 'GF-53', title: '周边诸国地方人物名册公式书', path: '公式书/53_周边诸国地方人物名册公式书.md', tags: ['npc', 'foreign'] },
];

export function buildAuthoritativeStateSummary(save: GameSave): string {
  const activeQuests = Object.keys(save.quests.active);
  const evidenceIds = Object.keys(save.quests.evidence);
  const activeEventIds = Object.keys(save.events.active);
  const haremMemberIds = Object.keys(save.intimacy.haremMembers);
  const eligibleHaremIds = Object.values(save.intimacy.roster)
    .filter(entry => entry.eligibleForHarem && !save.intimacy.haremMembers[entry.npcId])
    .map(entry => entry.npcId);
  const activeCgScene = save.intimacy.activeCgSceneId ? save.intimacy.cgScenes[save.intimacy.activeCgSceneId] : null;
  const activeScene = save.scene.activeSceneId ? save.scene.scenes[save.scene.activeSceneId] : null;
  const presentNpcIds = activeScene?.participantNpcIds ?? save.npcs.npcIndex.byLocationId[save.player.location.currentLocationId] ?? [];
  const recentRelations = save.relationship.recentChanges.slice(0, 5).map(change => `${change.targetType}:${change.targetId}`);
  const pendingIncome = Object.entries(save.economy.pendingIncome)
    .filter(([, value]) => value > 0)
    .map(([id, value]) => `${id}:${value}`);
  const economyResources = Object.entries(save.economy.resources)
    .filter(([, value]) => value > 0)
    .map(([id, value]) => `${id}:${value}`);
  const wanted = save.world.wanted.level > 0 ? `通缉${save.world.wanted.level}级，缘由：${save.world.wanted.reason}` : '无通缉';
  return [
    '【古风大世界权威状态】',
    `槽位：${save.meta.slotId}；阶段：${save.flow.gameStage}；难度：${save.opening.difficultyName || '未定'}`,
    `时间：${save.world.time.calendarText}；区域：${save.world.currentRegionId}；地点：${save.player.location.currentLocationId}`,
    `主角：${save.player.profile.name || '未命名'}；身份暴露：${wanted}`,
    `活跃事项：${activeQuests.length > 0 ? activeQuests.join('、') : '无'}`,
    `已知线索：${evidenceIds.length > 0 ? evidenceIds.slice(0, 20).join('、') : '无'}`,
    `活跃事件：${activeEventIds.length > 0 ? activeEventIds.slice(0, 10).join('、') : '无'}`,
    `后宫成员：${haremMemberIds.length > 0 ? haremMemberIds.join('、') : '无'}`,
    `满好感待收入：${eligibleHaremIds.length > 0 ? eligibleHaremIds.join('、') : '无'}`,
    `活动CG：${activeCgScene ? `${activeCgScene.sceneId}/${activeCgScene.npcId}` : '无'}`,
    `当前场景：${activeScene ? `${activeScene.title} / ${activeScene.category}` : '无'}`,
    `在场角色：${presentNpcIds.length > 0 ? presentNpcIds.join('、') : '无'}`,
    `上一行路：${save.world.lastTravelPlan ? save.world.lastTravelPlan.summary : '无'}`,
    `正文模式：偏好=${save.narrative.outputMode}；实际=${save.narrative.lastEffectiveOutputMode}；类别=${save.narrative.currentSceneCategory}`,
    `经营资源：${economyResources.length > 0 ? economyResources.join('、') : '无'}`,
    `待领取产业收益：${pendingIncome.length > 0 ? pendingIncome.join('、') : '无'}`,
    `近期关系变化：${recentRelations.length > 0 ? recentRelations.join('、') : '无'}`,
    `近期摘要：${save.memory.recentSummary || '暂无'}`,
    '裁决边界：时间、地点、伤病、关系、经营、战斗、通缉与证据状态以脚本存档为准；正文只负责叙述与补足细节。',
  ].join('\n');
}

export function buildFormulaScanText(save: GameSave, action?: GameAction | string): string {
  const actionText = typeof action === 'string' ? action : action?.type ?? '无';
  const ids = selectFormulaResourceIds(save, action);
  const resources = ids.map(id => FORMULA_RESOURCES.find(resource => resource.id === id)).filter(Boolean) as FormulaResource[];
  return [
    '【古风大世界索引前置】',
    `当前区域：${save.world.currentRegionId}`,
    `当前位置：${save.player.location.currentLocationId}`,
    `当前阶段：${save.flow.gameStage}`,
    `本轮行动：${actionText}`,
    '候选资料：',
    ...resources.map(resource => `- ${resource.id}｜${resource.title}｜${resource.path}`),
  ].join('\n');
}

export function selectFormulaResourceIds(save: GameSave, action?: GameAction | string): string[] {
  const tags = new Set<string>(['world']);
  if (save.world.currentRegionId.includes('jiangnan') || save.player.location.currentLocationId.includes('jiangnan')) {
    tags.add('jiangnan');
    tags.add('opening');
  }
  if (save.world.currentRegionId.includes('shenjing') || save.player.location.currentLocationId.includes('shenjing')) {
    tags.add('court');
    tags.add('capital');
  }
  if (typeof action !== 'string' && action) {
    if (action.type === 'COMBAT_START' || action.type === 'COMBAT_RESOLVE' || action.type.startsWith('ATB_BATTLE_')) {
      tags.add('combat');
      tags.add('martial');
    }
    if (action.type === 'CONSEQUENCE_ADD') tags.add('consequence');
    if (action.type.startsWith('MAP_') || action.type === 'TRAVEL' || action.type === 'TIME_ADVANCE') tags.add('travel');
    if (action.type.startsWith('FIXED_CHARACTER_') || action.type.startsWith('CHARACTER_MEMORY_')) tags.add('npc');
    if (action.type.startsWith('RELATION_') || action.type === 'REPUTATION_ADJUST') {
      tags.add('reputation');
      tags.add('npc');
    }
    if (action.type.startsWith('SCENE_') || action.type === 'DIALOGUE_PLAN_BUILD') tags.add('npc');
    if (action.type.startsWith('QUEST_')) {
      tags.add('evidence');
      if (action.type === 'QUEST_DEFINITION_UPSERT') addQuestKindTags(tags, action.payload.kind);
      if (action.type === 'QUEST_ACCEPT') addQuestKindTags(tags, action.payload.definition?.kind);
    }
    if (action.type.startsWith('EVENT_')) {
      tags.add('event');
      tags.add('side');
    }
    if (action.type === 'BUSINESS_SETTLE' || action.type.startsWith('ECONOMY_')) {
      tags.add('business');
      tags.add('resource');
    }
    if (action.type.startsWith('STRATEGY_')) {
      tags.add('military');
      tags.add('resource');
    }
    if (action.type.startsWith('NARRATIVE_')) {
      tags.add(save.narrative.currentSceneCategory);
      tags.add('npc');
    }
    if (action.type.startsWith('INTIMACY_') || action.type.startsWith('HAREM_')) {
      tags.add('intimacy');
      tags.add('npc');
      tags.add('beauty');
      tags.add('life');
    }
    if (action.type === 'HAREM_BOUNDARY_PLACEHOLDER') {
      tags.add('consequence');
      tags.add('combat');
    }
  }
  if (typeof action === 'string') {
    if (action.includes('战') || action.includes('逃') || action.includes('杀')) tags.add('combat');
    if (action.includes('商') || action.includes('产业') || action.includes('经营')) tags.add('business');
    if (action.includes('江南') || action.includes('钱塘') || action.includes('西子湖')) tags.add('jiangnan');
    if (action.includes('主线') || action.includes('旧相案')) tags.add('mainline');
    if (action.includes('暗线') || action.includes('密诏') || action.includes('宫禁')) tags.add('hiddenline');
    if (action.includes('支线') || action.includes('地方事件')) tags.add('side');
    if (action.includes('证据') || action.includes('线索')) tags.add('evidence');
    if (action.includes('角色') || action.includes('人设') || action.includes('台词')) tags.add('npc');
    if (action.includes('美人') || action.includes('风华录')) tags.add('beauty');
    if (action.includes('高手') || action.includes('武评') || action.includes('榜')) tags.add('ranking');
    if (action.includes('朝') || action.includes('神京') || action.includes('太后') || action.includes('皇')) tags.add('court');
    if (action.includes('红尘酒家') || action.includes('茶馆') || action.includes('酒账')) tags.add('rumor');
    if (action.includes('后宫') || action.includes('好感') || action.includes('亲密') || action.includes('CG')) {
      tags.add('intimacy');
      tags.add('beauty');
      tags.add('life');
    }
  }

  const selected = FORMULA_RESOURCES.filter(resource => resource.tags.some(tag => tags.has(tag))).map(resource => resource.id);
  return Array.from(new Set(['GF-45', 'GF-46', 'GF-52', ...selected]));
}

function addQuestKindTags(tags: Set<string>, kind?: string): void {
  if (kind === 'mainline') tags.add('mainline');
  if (kind === 'hiddenline') tags.add('hiddenline');
  if (kind === 'sidequest' || kind === 'daily') tags.add('side');
  if (kind === 'relationship') tags.add('npc');
  if (kind === 'business') tags.add('business');
}

export function injectWorldContext(save: GameSave, once = true): { uninject: () => void } {
  return injectPrompts(
    [
      {
        id: STATE_INJECT_ID,
        content: buildAuthoritativeStateSummary(save),
        position: 'in_chat',
        role: 'system',
        depth: 2,
        should_scan: false,
      },
    ],
    { once },
  );
}

export function clearWorldContext(): void {
  uninjectPrompts([STATE_INJECT_ID]);
}
