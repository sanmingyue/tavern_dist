import type { StaticSeedPack } from '../../types/staticSeed';
import { GENERATED_CHARACTER_SEED, GENERATED_FEMALE_ROSTER_SEED } from './characters.generated';
import { GENERATED_SIDE_EVENT_TEMPLATES, GENERATED_SIDE_QUEST_TEMPLATES } from './templates.generated';
import { STATIC_WORLD_EVENTS, STATIC_WORLD_LOCATIONS, STATIC_WORLD_QUESTS, STATIC_WORLD_ROUTES } from './world';

export const CORE_STATIC_SEED_PACK: StaticSeedPack = {
  packId: 'gufeng_world_core_static_seed',
  title: '古风大世界核心静态数据',
  version: '2026-06-13.1',
  source: '公式书、人设档案与支线区域公式书批量整理',
  locations: STATIC_WORLD_LOCATIONS,
  routes: STATIC_WORLD_ROUTES,
  fixedCharacters: GENERATED_CHARACTER_SEED,
  femaleRoster: GENERATED_FEMALE_ROSTER_SEED,
  questDefinitions: [...STATIC_WORLD_QUESTS, ...GENERATED_SIDE_QUEST_TEMPLATES],
  eventTemplates: [...STATIC_WORLD_EVENTS, ...GENERATED_SIDE_EVENT_TEMPLATES],
  initialRelations: {
    npc: [
      {
        npcId: 'npc_{{user}}之父',
        familiarity: 80,
        trust: 75,
        loyalty: 80,
        flags: { family: true, initial_known: true, old_chancellor_case: true },
        reason: '开局父子关系与离京避祸事实',
      },
      {
        npcId: 'npc_旧相',
        familiarity: 70,
        trust: 70,
        loyalty: 70,
        flags: { family: true, jailed: true, old_chancellor_case: true },
        reason: '开局祖父下狱与旧相案核心关系',
      },
      {
        npcId: 'npc_惊鸿卷护行者',
        familiarity: 20,
        trust: 15,
        loyalty: 10,
        flags: { escort: true, monitor: true, lingxue_line: true, initial_visible: true },
        reason: '开局护行与凌雪暗线接触',
      },
      {
        npcId: 'npc_柳观澜',
        familiarity: 15,
        trust: 10,
        flags: { jiangnan_contact: true, old_chancellor_student: true },
        reason: '江南旧相门生可作为早期落脚线',
      },
      {
        npcId: 'npc_韩照夜',
        familiarity: 10,
        trust: 5,
        flags: { jiangnan_dark_station: true, lingxue_line: true },
        reason: '江南凌雪暗站可由护行者引出',
      },
      {
        npcId: 'npc_袁知春',
        familiarity: 5,
        trust: 5,
        flags: { hongchen_jiujia: true, rumor_network: true },
        reason: '红尘酒家作为故事、酒账与消息入口',
      },
      {
        npcId: 'npc_程砺',
        familiarity: 5,
        hostility: 20,
        flags: { pursuer: true, yushi_pressure: true },
        reason: '追索御史开局形成外部压力',
      },
      {
        npcId: 'npc_杜怀璧',
        hostility: 10,
        flags: { case_investigator: true, dali_temple_line: true },
        reason: '大理寺缉事官查旧相案旁支',
      },
    ],
    faction: [
      {
        factionId: 'old_chancellor_house',
        reputation: 30,
        flags: { origin: true, under_watch: true },
        reason: '{{user}}出身旧相府',
      },
      {
        factionId: 'menxia_old_officials',
        reputation: 15,
        flags: { old_connections: true },
        reason: '父亲与门下省旧官脉仍有暗线',
      },
      {
        factionId: 'lingxue',
        reputation: 5,
        flags: { escort_line: true, monitor_line: true },
        reason: '凌雪阁护行者与暗站进入开局可见范围',
      },
      {
        factionId: 'hongchen_jiujia',
        reputation: 0,
        flags: { rumor_network: true },
        reason: '红尘酒家为消息网络入口，初始不偏不倚',
      },
    ],
    reputation: [
      {
        reputationId: 'old_chancellor_case_heat',
        amount: 10,
        reason: '旧相案风声已起，江南与神京之间开始传递追索压力',
      },
      {
        reputationId: 'jiangnan_initial_shelter',
        amount: 5,
        reason: '江南可提供初期落脚与遮掩，但尚未公开站队',
      },
    ],
  },
};

export {
  GENERATED_CHARACTER_SEED,
  GENERATED_FEMALE_ROSTER_SEED,
  GENERATED_SIDE_EVENT_TEMPLATES,
  GENERATED_SIDE_QUEST_TEMPLATES,
  STATIC_WORLD_EVENTS,
  STATIC_WORLD_LOCATIONS,
  STATIC_WORLD_QUESTS,
  STATIC_WORLD_ROUTES,
};
