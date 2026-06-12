export type StrategyResourceId = 'silver' | 'grain' | 'arms' | 'horses' | 'manpower' | 'intel' | 'medicine';

export type StrategyResourceLedger = Record<StrategyResourceId, number>;

export type StrategySide = 'player' | 'ally' | 'enemy' | 'neutral';

export type StrategyTerrain = 'plain' | 'city' | 'mountain' | 'river' | 'forest' | 'desert' | 'coast' | 'pass';

export type StrategyOrderKind =
  | 'march'
  | 'defend'
  | 'siege'
  | 'assault'
  | 'raid_supply'
  | 'escort'
  | 'recruit'
  | 'fortify'
  | 'gather_intel'
  | 'suppress_unrest'
  | 'negotiate';

export type StrategyForce = {
  forceId: string;
  name: string;
  side: StrategySide;
  factionId: string;
  locationId: string;
  commanderNpcId?: string;
  troopCount: number;
  troopQuality: number;
  infantry: number;
  cavalry: number;
  archers: number;
  engineers: number;
  scouts: number;
  martialExperts: number;
  morale: number;
  supplies: number;
  fatigue: number;
  wounded: number;
  cohesion: number;
  siegePower: number;
  mobility: number;
  tags?: string[];
};

export type StrategyLocation = {
  locationId: string;
  name: string;
  regionId: string;
  controllerFactionId: string;
  terrain: StrategyTerrain;
  fortification: number;
  garrison: number;
  grainStock: number;
  publicOrder: number;
  supplyLimit: number;
  routeIds: string[];
  tags?: string[];
};

export type StrategyRoute = {
  routeId: string;
  fromLocationId: string;
  toLocationId: string;
  distanceLi: number;
  terrain: StrategyTerrain;
  risk: number;
  supplyCostMultiplier: number;
  blocked: boolean;
};

export type StrategyFront = {
  frontId: string;
  name: string;
  locationIds: string[];
  pressure: number;
  momentum: number;
};

export type StrategyCampaignSetup = {
  campaignId?: string;
  name: string;
  regionId: string;
  turn?: number;
  resources?: Partial<StrategyResourceLedger>;
  forces: StrategyForce[];
  locations: StrategyLocation[];
  routes: StrategyRoute[];
  fronts?: StrategyFront[];
};

export type StrategyCampaignState = {
  campaignId: string;
  name: string;
  regionId: string;
  turn: number;
  resources: StrategyResourceLedger;
  forces: Record<string, StrategyForce>;
  locations: Record<string, StrategyLocation>;
  routes: Record<string, StrategyRoute>;
  fronts: Record<string, StrategyFront>;
  pendingOrders: StrategyOrder[];
  eventLog: StrategyEventRecord[];
  finished: boolean;
};

export type StrategyOrder = {
  orderId?: string;
  kind: StrategyOrderKind;
  forceId?: string;
  sourceLocationId?: string;
  targetLocationId?: string;
  targetForceId?: string;
  resourceBudget?: Partial<StrategyResourceLedger>;
  note?: string;
};

export type StrategyEventRecord = {
  eventId: string;
  turn: number;
  type: string;
  summary: string;
  relatedForceIds?: string[];
  relatedLocationIds?: string[];
  resourceDelta?: Partial<StrategyResourceLedger>;
};

export type StrategyOrderResult = {
  ok: boolean;
  orderId: string;
  summary: string;
  resourceDelta: Partial<StrategyResourceLedger>;
  changedForceIds: string[];
  changedLocationIds: string[];
};

export type StrategyTurnResult = {
  campaignId: string;
  turn: number;
  orderResults: StrategyOrderResult[];
  summary: string;
  resources: StrategyResourceLedger;
};

export type StrategySaveState = {
  activeCampaignId: string | null;
  resources: StrategyResourceLedger;
  campaigns: Record<string, StrategyCampaignState>;
  lastResolvedAt: string | null;
};
