export type CombatSide = 'player' | 'ally' | 'enemy' | 'neutral';

export type BattleOutcome = 'ongoing' | 'victory' | 'defeat' | 'escape' | 'interrupt' | 'draw';

export type BattleObjectiveKind = 'defeat_all' | 'survive_ticks' | 'escape' | 'protect' | 'interrupt' | 'custom';

export type BattleCommandKind = 'basic_attack' | 'defend' | 'guard' | 'wait' | 'skill' | 'item' | 'escape';

export type BattleEffectKind =
  | 'damage'
  | 'heal'
  | 'shield'
  | 'status'
  | 'gauge_pull'
  | 'gauge_pushback'
  | 'guard'
  | 'escape';

export type BattleStatusKind = 'buff' | 'debuff' | 'control' | 'dot' | 'shield' | 'gauge' | 'guard' | 'stance';

export type BattleUnitRole =
  | 'duelist'
  | 'guard'
  | 'soldier'
  | 'commander'
  | 'assassin'
  | 'healer'
  | 'support'
  | 'archer';

export type BattleObjective = {
  kind: BattleObjectiveKind;
  targetUnitIds?: string[];
  surviveTicks?: number;
  description?: string;
};

export type StrengthLockOptions = {
  enabled: boolean;
  minimumLockPower: number;
  lockBand: number;
  allowAssassinationBypass: boolean;
};

export type BattleSetup = {
  battleId?: string;
  locationId?: string;
  environmentId?: string;
  difficultyId?: string;
  objective: BattleObjective;
  playerUnits: BattleUnitSnapshot[];
  enemyUnits: BattleUnitSnapshot[];
  allyUnits?: BattleUnitSnapshot[];
  neutralUnits?: BattleUnitSnapshot[];
  eventFlags?: string[];
  specialRuleIds?: string[];
  strengthLock?: Partial<StrengthLockOptions>;
};

export type BattleUnitSnapshot = {
  unitId: string;
  displayName: string;
  side: CombatSide;
  factionId?: string;
  role?: BattleUnitRole;
  roleTags?: string[];
  powerTier: number;
  lockPower?: number;
  canExertStrengthLock?: boolean;
  maxHealth: number;
  maxInnerPower: number;
  attack: number;
  defense: number;
  speed: number;
  awareness: number;
  technique: number;
  morale: number;
  armor?: number;
  weaponCondition?: number;
  actionGaugeMax?: number;
  methodIds?: string[];
  itemIds?: string[];
  longTermStateIds?: string[];
};

export type BattleStatusInstance = {
  statusId: string;
  sourceUnitId: string;
  kind: BattleStatusKind;
  stacks: number;
  durationTicks: number;
  potency: number;
  tags?: string[];
};

export type BattleUnitState = {
  snapshot: BattleUnitSnapshot;
  currentHealth: number;
  currentInnerPower: number;
  actionGauge: number;
  actionGaugeMax: number;
  alive: boolean;
  canAct: boolean;
  escaped: boolean;
  statuses: BattleStatusInstance[];
  cooldowns: Record<string, number>;
  lockedTargetUnitIds: string[];
  guardingUnitId?: string;
};

export type ReadyQueueEntry = {
  unitId: string;
  overflow: number;
  speed: number;
  awareness: number;
  tick: number;
};

export type BattleEventRecord = {
  eventId: string;
  tick: number;
  type: string;
  actorUnitId?: string;
  targetUnitIds?: string[];
  summary: string;
  payload?: Record<string, unknown>;
};

export type BattleState = {
  battleId: string;
  locationId: string;
  environmentId: string;
  difficultyId: string;
  objective: BattleObjective;
  strengthLock: StrengthLockOptions;
  units: BattleUnitState[];
  readyQueue: ReadyQueueEntry[];
  tick: number;
  outcome: BattleOutcome;
  result: BattleResult | null;
  eventLog: BattleEventRecord[];
};

export type BattleCommand = {
  actorUnitId: string;
  kind: BattleCommandKind;
  sourceId?: string;
  targetUnitIds?: string[];
  effects?: BattleEffect[];
  innerPowerCost?: number;
  actionGaugeCost?: number;
  cooldownTicks?: number;
};

export type BattleEffect = {
  kind: BattleEffectKind;
  target: 'self' | 'selected' | 'all_allies' | 'all_enemies';
  amount?: number;
  ratio?: number;
  status?: Omit<BattleStatusInstance, 'sourceUnitId'>;
  summary?: string;
};

export type CommandValidationResult = {
  ok: boolean;
  reasonId?: string;
  message: string;
  legalTargetUnitIds?: string[];
};

export type BattleTickResult = {
  tick: number;
  deltaTime: number;
  readiedUnitIds: string[];
};

export type BattleCommandResolution = {
  ok: boolean;
  validation: CommandValidationResult;
  state: BattleState;
  result?: BattleResult;
  message: string;
};

export type UnitBattleResult = {
  unitId: string;
  lifeStateChangeId: 'alive' | 'minor_injury' | 'severe_injury' | 'unconscious' | 'dead' | 'escaped';
  healthDelta: number;
  innerPowerDelta: number;
  appliedStatusIds: string[];
  removedStatusIds: string[];
};

export type RewardRequest = {
  sourceUnitId: string;
  defeatedUnitIds: string[];
  rewardTableId: string;
  reasonId: string;
  difficultyId: string;
};

export type RelationshipSuggestion = {
  sourceUnitId: string;
  targetUnitId: string;
  relationChangeId: string;
  magnitude: number;
  reasonId: string;
};

export type WorldEventSuggestion = {
  eventId: string;
  actorUnitIds: string[];
  targetUnitIds: string[];
  locationId: string;
  reasonId: string;
};

export type BattleResult = {
  battleId: string;
  outcome: BattleOutcome;
  escaped: boolean;
  interrupted: boolean;
  unitResults: UnitBattleResult[];
  rewardRequests: RewardRequest[];
  relationshipSuggestions: RelationshipSuggestion[];
  worldEventSuggestions: WorldEventSuggestion[];
  eventLog: BattleEventRecord[];
  summary: string;
};

export type BattleAutoAdvanceOptions = {
  maxSteps?: number;
  tickDeltaTime?: number;
};
