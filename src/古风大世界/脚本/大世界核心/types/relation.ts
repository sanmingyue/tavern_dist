export type NpcRelationAdjustPayload = {
  npcId: string;
  familiarity?: number;
  affection?: number;
  trust?: number;
  fear?: number;
  hostility?: number;
  loyalty?: number;
  flags?: Record<string, boolean>;
  reason?: string;
};

export type FactionRelationAdjustPayload = {
  factionId: string;
  reputation?: number;
  hostility?: number;
  flags?: Record<string, boolean>;
  reason?: string;
};

export type WorldReputationAdjustPayload = {
  reputationId: string;
  amount: number;
  reason?: string;
};

export type RelationChangeRecord = {
  changeId: string;
  at: string;
  targetType: 'npc' | 'faction' | 'world';
  targetId: string;
  summary: string;
};

