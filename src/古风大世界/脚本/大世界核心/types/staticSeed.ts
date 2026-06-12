import type { FemaleRosterRegisterPayload } from './intimacy';
import type { FixedCharacterProfile } from './characters';
import type { MapLocationNode, MapRouteNode } from './map';
import type { QuestDefinition } from './quest';
import type { FactionRelationAdjustPayload, NpcRelationAdjustPayload, WorldReputationAdjustPayload } from './relation';
import type { WorldEventTemplate } from './events';

export type StaticSeedPack = {
  packId: string;
  title: string;
  version: string;
  source: string;
  locations: MapLocationNode[];
  routes: MapRouteNode[];
  fixedCharacters: FixedCharacterProfile[];
  femaleRoster: FemaleRosterRegisterPayload[];
  questDefinitions: QuestDefinition[];
  eventTemplates: WorldEventTemplate[];
  initialRelations: {
    npc: NpcRelationAdjustPayload[];
    faction: FactionRelationAdjustPayload[];
    reputation: WorldReputationAdjustPayload[];
  };
};

export type StaticSeedApplyOptions = {
  includeLocations?: boolean;
  includeRoutes?: boolean;
  includeCharacters?: boolean;
  includeFemaleRoster?: boolean;
  includeQuests?: boolean;
  includeEvents?: boolean;
  includeRelations?: boolean;
  overwriteExisting?: boolean;
};

export type StaticSeedApplyReport = {
  packId: string;
  appliedAt: string;
  locations: number;
  routes: number;
  fixedCharacters: number;
  femaleRoster: number;
  questDefinitions: number;
  eventTemplates: number;
  relations: number;
  skipped: string[];
};

