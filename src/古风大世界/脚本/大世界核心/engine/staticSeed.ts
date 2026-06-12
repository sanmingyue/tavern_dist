import { nowIso, pushSaveLog } from '../state/defaults';
import type { StaticSeedApplyOptions, StaticSeedApplyReport, StaticSeedPack } from '../types/staticSeed';
import type { GameSave } from '../types/schema';
import { upsertFixedCharacter } from './characters';
import { registerFemaleRosterEntry } from './intimacy';
import { upsertMapLocation, upsertMapRoute } from './map';
import { upsertQuestDefinition } from './quest';
import { adjustFactionRelation, adjustNpcRelation, adjustWorldReputation } from './relation';
import { upsertEventTemplate } from './events';

export function applyStaticSeedPack(
  save: GameSave,
  pack: StaticSeedPack,
  options: StaticSeedApplyOptions = {},
): StaticSeedApplyReport {
  const include = withDefaultOptions(options);
  const report: StaticSeedApplyReport = {
    packId: pack.packId,
    appliedAt: nowIso(),
    locations: 0,
    routes: 0,
    fixedCharacters: 0,
    femaleRoster: 0,
    questDefinitions: 0,
    eventTemplates: 0,
    relations: 0,
    skipped: [],
  };

  if (include.includeLocations) {
    for (const location of pack.locations) {
      if (!include.overwriteExisting && save.world.mapLocations[location.locationId]) {
        report.skipped.push(`location:${location.locationId}`);
        continue;
      }
      upsertMapLocation(save, location);
      report.locations += 1;
    }
  }

  if (include.includeRoutes) {
    for (const route of pack.routes) {
      if (!include.overwriteExisting && save.world.mapRoutes[route.routeId]) {
        report.skipped.push(`route:${route.routeId}`);
        continue;
      }
      upsertMapRoute(save, route);
      report.routes += 1;
    }
  }

  if (include.includeCharacters) {
    for (const character of pack.fixedCharacters) {
      if (!include.overwriteExisting && save.npcs.fixedNpcProfiles[character.npcId]) {
        report.skipped.push(`character:${character.npcId}`);
        continue;
      }
      upsertFixedCharacter(save, character);
      report.fixedCharacters += 1;
    }
  }

  if (include.includeFemaleRoster) {
    for (const entry of pack.femaleRoster) {
      if (!include.overwriteExisting && save.intimacy.roster[entry.npcId]) {
        report.skipped.push(`female:${entry.npcId}`);
        continue;
      }
      registerFemaleRosterEntry(save, entry);
      report.femaleRoster += 1;
    }
  }

  if (include.includeQuests) {
    for (const quest of pack.questDefinitions) {
      if (!include.overwriteExisting && save.quests.definitions[quest.questId]) {
        report.skipped.push(`quest:${quest.questId}`);
        continue;
      }
      upsertQuestDefinition(save, quest);
      report.questDefinitions += 1;
    }
  }

  if (include.includeEvents) {
    for (const template of pack.eventTemplates) {
      if (!include.overwriteExisting && save.events.templates[template.templateId]) {
        report.skipped.push(`event:${template.templateId}`);
        continue;
      }
      upsertEventTemplate(save, template);
      report.eventTemplates += 1;
    }
  }

  if (include.includeRelations) {
    for (const relation of pack.initialRelations.npc) {
      adjustNpcRelation(save, relation);
      report.relations += 1;
    }
    for (const relation of pack.initialRelations.faction) {
      adjustFactionRelation(save, relation);
      report.relations += 1;
    }
    for (const relation of pack.initialRelations.reputation) {
      adjustWorldReputation(save, relation);
      report.relations += 1;
    }
  }

  save.maintenance.migrationsApplied = [...new Set([...save.maintenance.migrationsApplied, `static_seed:${pack.packId}:${pack.version}`])];
  pushSaveLog(save, 'STATIC_SEED_APPLY', buildSeedReportSummary(report), true);
  return report;
}

export function buildSeedReportSummary(report: StaticSeedApplyReport): string {
  return [
    `静态种子已装载：${report.packId}`,
    `地点${report.locations}`,
    `路线${report.routes}`,
    `角色${report.fixedCharacters}`,
    `女性栏目${report.femaleRoster}`,
    `任务${report.questDefinitions}`,
    `事件${report.eventTemplates}`,
    `关系${report.relations}`,
    `跳过${report.skipped.length}`,
  ].join('，');
}

function withDefaultOptions(options: StaticSeedApplyOptions): Required<StaticSeedApplyOptions> {
  return {
    includeLocations: options.includeLocations ?? true,
    includeRoutes: options.includeRoutes ?? true,
    includeCharacters: options.includeCharacters ?? true,
    includeFemaleRoster: options.includeFemaleRoster ?? true,
    includeQuests: options.includeQuests ?? true,
    includeEvents: options.includeEvents ?? true,
    includeRelations: options.includeRelations ?? true,
    overwriteExisting: options.overwriteExisting ?? false,
  };
}

