export type EconomyResourceId = 'silver' | 'grain' | 'arms' | 'horses' | 'manpower' | 'intel' | 'medicine';

export type EconomyResourceLedger = Record<EconomyResourceId, number>;

export type EconomyResourceDelta = Record<EconomyResourceId, number>;

export type EconomyResourcePatch = Partial<EconomyResourceLedger>;

export type EconomyBusinessType =
  | 'merchant_house'
  | 'manor'
  | 'escort_agency'
  | 'restaurant'
  | 'intelligence_post'
  | 'pharmacy'
  | 'horse_ranch'
  | 'workshop'
  | 'warehouse'
  | 'dock'
  | 'market_stall'
  | 'custom';

export type EconomyStaffRole =
  | 'manager'
  | 'accountant'
  | 'guard'
  | 'artisan'
  | 'scout'
  | 'broker'
  | 'healer'
  | 'stable_master'
  | 'host'
  | 'trainer'
  | 'custom';

export type EconomyBusinessSetup = {
  businessId?: string;
  name: string;
  businessType: EconomyBusinessType;
  locationId: string;
  assetId?: string;
  level?: number;
  baseYield?: EconomyResourcePatch;
  upkeep?: EconomyResourcePatch;
  riskLevel?: number;
  security?: number;
  prosperity?: number;
  tags?: string[];
  state?: Record<string, unknown>;
  stateFlags?: Record<string, boolean>;
};

export type EconomyStaffAssignmentInput = {
  assignmentId?: string;
  businessId: string;
  npcId: string;
  role: EconomyStaffRole;
  efficiencyBonus?: number;
  riskModifier?: number;
  upkeep?: EconomyResourcePatch;
  tags?: string[];
  assignedAt?: string;
};

export type EconomySettleBusinessPayload = {
  businessId: string;
  cycles?: number;
  now?: string;
  note?: string;
  applyRisk?: boolean;
};

export type EconomySettleAllPayload = {
  cycles?: number;
  now?: string;
  note?: string;
  applyRisk?: boolean;
  locationId?: string;
  businessType?: EconomyBusinessType;
};

export type EconomySettlementReport = {
  reportId: string;
  at: string;
  businessId: string;
  businessName: string;
  cycles: number;
  produced: EconomyResourceLedger;
  upkeep: EconomyResourceLedger;
  net: EconomyResourceDelta;
  riskDelta: number;
  riskEvent: string;
  staffNpcIds: string[];
  summary: string;
};

export type EconomyResourceChangePayload = {
  resources: EconomyResourcePatch;
  reason?: string;
  sourceId?: string;
};

export type EconomyTransferToStrategyPayload = {
  resources: EconomyResourcePatch;
  note?: string;
};
