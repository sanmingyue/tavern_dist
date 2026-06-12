import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { BusinessSettlePayload } from '../types/actions';
import type {
  EconomyBusinessSetup,
  EconomyBusinessType,
  EconomyResourceChangePayload,
  EconomyResourceDelta,
  EconomyResourceId,
  EconomyResourceLedger,
  EconomyResourcePatch,
  EconomySettleAllPayload,
  EconomySettlementReport,
  EconomyStaffAssignmentInput,
  EconomyTransferToStrategyPayload,
} from '../types/economy';
import type { BusinessState, GameSave } from '../types/schema';
import { advanceWorldTime } from './time';

export const ECONOMY_RESOURCE_IDS: EconomyResourceId[] = [
  'silver',
  'grain',
  'arms',
  'horses',
  'manpower',
  'intel',
  'medicine',
];

export const EMPTY_ECONOMY_RESOURCES: EconomyResourceLedger = {
  silver: 0,
  grain: 0,
  arms: 0,
  horses: 0,
  manpower: 0,
  intel: 0,
  medicine: 0,
};

const DEFAULT_BUSINESS_YIELD: Record<EconomyBusinessType, EconomyResourcePatch> = {
  merchant_house: { silver: 80, intel: 2 },
  manor: { grain: 140, manpower: 20, silver: 15 },
  escort_agency: { silver: 50, intel: 5, manpower: 8 },
  restaurant: { silver: 45, intel: 3, grain: 5 },
  intelligence_post: { intel: 20, silver: 5 },
  pharmacy: { medicine: 35, silver: 20 },
  horse_ranch: { horses: 8, grain: 15, manpower: 5 },
  workshop: { arms: 25, silver: 20 },
  warehouse: { grain: 30, silver: 15 },
  dock: { silver: 60, grain: 20, intel: 3 },
  market_stall: { silver: 25 },
  custom: { silver: 10 },
};

const DEFAULT_BUSINESS_UPKEEP: Record<EconomyBusinessType, EconomyResourcePatch> = {
  merchant_house: { silver: 10 },
  manor: { silver: 5, manpower: 5 },
  escort_agency: { grain: 10, arms: 2 },
  restaurant: { grain: 12, silver: 4 },
  intelligence_post: { silver: 18 },
  pharmacy: { silver: 8, grain: 4 },
  horse_ranch: { grain: 28, manpower: 4 },
  workshop: { silver: 12, grain: 6 },
  warehouse: { silver: 5 },
  dock: { silver: 14, manpower: 4 },
  market_stall: { silver: 3 },
  custom: {},
};

export function upsertEconomyBusiness(save: GameSave, setup: EconomyBusinessSetup): string {
  const businessId = setup.businessId ?? createId('business');
  const existing = save.economy.businesses[businessId];
  const businessType = normalizeBusinessType(setup.businessType ?? existing?.businessType);
  const business: BusinessState = {
    businessId,
    name: setup.name || existing?.name || businessId,
    businessType,
    locationId: setup.locationId || existing?.locationId || save.player.location.currentLocationId,
    assetId: setup.assetId ?? existing?.assetId ?? null,
    level: Math.max(1, Math.floor(setup.level ?? existing?.level ?? 1)),
    staffNpcIds: existing?.staffNpcIds ?? [],
    lastSettledAt: existing?.lastSettledAt ?? null,
    baseYield: sanitizeResourcePatch(setup.baseYield ?? existing?.baseYield ?? DEFAULT_BUSINESS_YIELD[businessType]),
    upkeep: sanitizeResourcePatch(setup.upkeep ?? existing?.upkeep ?? DEFAULT_BUSINESS_UPKEEP[businessType]),
    riskLevel: clamp(setup.riskLevel ?? existing?.riskLevel ?? 0, 0, 100),
    security: clamp(setup.security ?? existing?.security ?? 50, 0, 100),
    prosperity: clamp(setup.prosperity ?? existing?.prosperity ?? 50, 0, 100),
    tags: setup.tags ?? existing?.tags ?? [],
    state: { ...(existing?.state ?? {}), ...(setup.state ?? {}) },
    stateFlags: { ...(existing?.stateFlags ?? {}), ...(setup.stateFlags ?? {}) },
  };

  save.economy.businesses[businessId] = business;
  if (business.assetId) {
    save.economy.assets[business.assetId] = {
      assetId: business.assetId,
      assetType: business.businessType,
      unlocked: true,
      level: Math.max(1, business.level),
      state: {
        businessId,
        locationId: business.locationId,
        name: business.name,
      },
    };
  }

  pushSaveLog(save, 'ECONOMY_BUSINESS_UPSERT', `产业已登记：${business.name}`, true, [businessId]);
  return `产业已登记：${business.name}`;
}

export function removeEconomyBusiness(save: GameSave, businessId: string): string {
  const business = save.economy.businesses[businessId];
  if (!business) throw new Error(`产业不存在：${businessId}`);
  for (const assignmentId of Object.keys(save.economy.assignments)) {
    if (save.economy.assignments[assignmentId].businessId === businessId) {
      delete save.economy.assignments[assignmentId];
    }
  }
  delete save.economy.businesses[businessId];
  delete save.economy.pendingIncome[businessId];
  pushSaveLog(save, 'ECONOMY_BUSINESS_REMOVE', `产业已移除：${business.name || businessId}`, true, [businessId]);
  return `产业已移除：${business.name || businessId}`;
}

export function assignEconomyStaff(save: GameSave, input: EconomyStaffAssignmentInput): string {
  const business = requireBusiness(save, input.businessId);
  const duplicate = Object.values(save.economy.assignments).find(
    assignment => assignment.businessId === input.businessId && assignment.npcId === input.npcId,
  );
  const assignmentId = input.assignmentId ?? duplicate?.assignmentId ?? createId('assignment');
  save.economy.assignments[assignmentId] = {
    assignmentId,
    businessId: input.businessId,
    npcId: input.npcId,
    role: input.role,
    assignedAt: input.assignedAt ?? nowIso(),
    efficiencyBonus: clamp(input.efficiencyBonus ?? defaultRoleEfficiency(input.role), -50, 100),
    riskModifier: clamp(input.riskModifier ?? defaultRoleRiskModifier(input.role), -50, 50),
    upkeep: sanitizeResourcePatch(input.upkeep ?? defaultRoleUpkeep(input.role)),
    tags: input.tags ?? [],
  };
  business.staffNpcIds = unique([...business.staffNpcIds, input.npcId]);
  save.economy.businesses[business.businessId] = business;
  pushSaveLog(save, 'ECONOMY_STAFF_ASSIGN', `${input.npcId}已派驻${business.name || business.businessId}`, true, [
    business.businessId,
    input.npcId,
  ]);
  return `${input.npcId}已派驻${business.name || business.businessId}`;
}

export function unassignEconomyStaff(save: GameSave, assignmentId: string): string {
  const assignment = save.economy.assignments[assignmentId];
  if (!assignment) throw new Error(`派驻记录不存在：${assignmentId}`);
  delete save.economy.assignments[assignmentId];
  const business = save.economy.businesses[assignment.businessId];
  if (business) {
    const stillAssignedNpcIds = new Set(
      Object.values(save.economy.assignments)
        .filter(item => item.businessId === assignment.businessId)
        .map(item => item.npcId),
    );
    business.staffNpcIds = business.staffNpcIds.filter(npcId => stillAssignedNpcIds.has(npcId));
    save.economy.businesses[business.businessId] = business;
  }
  pushSaveLog(save, 'ECONOMY_STAFF_UNASSIGN', `${assignment.npcId}已撤出产业`, true, [
    assignment.businessId,
    assignment.npcId,
  ]);
  return `${assignment.npcId}已撤出产业`;
}

export function settleBusiness(save: GameSave, payload: BusinessSettlePayload): string {
  const report = settleEconomyBusiness(save, payload);
  advanceWorldTime(save, 30 * report.cycles, payload.note ?? '产业结算');
  pushSaveLog(save, 'BUSINESS_SETTLE', report.summary, true, [report.businessId, ...report.staffNpcIds]);
  return report.summary;
}

export function settleEconomyBusiness(save: GameSave, payload: BusinessSettlePayload): EconomySettlementReport {
  const business = requireBusiness(save, payload.businessId);
  const report = createBusinessSettlementReport(save, business, payload);
  applySettlementReport(save, report);
  business.lastSettledAt = report.at;
  business.riskLevel = clamp(business.riskLevel + report.riskDelta, 0, 100);
  save.economy.businesses[business.businessId] = business;
  save.economy.lastSettledAt = report.at;
  return report;
}

export function settleAllEconomyBusinesses(save: GameSave, payload: EconomySettleAllPayload = {}): string {
  const businesses = Object.values(save.economy.businesses).filter(business => {
    if (payload.locationId && business.locationId !== payload.locationId) return false;
    if (payload.businessType && business.businessType !== payload.businessType) return false;
    return true;
  });
  if (businesses.length === 0) throw new Error('没有可结算产业');

  const reports = businesses.map(business =>
    settleEconomyBusiness(save, {
      businessId: business.businessId,
      cycles: payload.cycles,
      now: payload.now,
      note: payload.note,
      applyRisk: payload.applyRisk,
    }),
  );
  const summary = `产业批量结算完成：${reports.length}处，${summarizeResourceDelta(sumReportNet(reports))}`;
  advanceWorldTime(save, 60 * Math.max(1, Math.floor(payload.cycles ?? 1)), payload.note ?? '产业批量结算');
  pushSaveLog(
    save,
    'ECONOMY_SETTLE_ALL',
    summary,
    true,
    reports.map(report => report.businessId),
  );
  return summary;
}

export function addEconomyResourcePatch(save: GameSave, payload: EconomyResourceChangePayload): string {
  const gain = toLedger(payload.resources);
  addEconomyResources(save.economy.resources, gain);
  const summary = `经营资源已入账：${summarizeResources(gain)}${payload.reason ? `，${payload.reason}` : ''}`;
  pushSaveLog(save, 'ECONOMY_RESOURCE_ADD', summary, true, [payload.sourceId ?? ''].filter(Boolean));
  return summary;
}

export function transferEconomyResourcesToStrategy(save: GameSave, payload: EconomyTransferToStrategyPayload): string {
  const resources = sanitizeResourcePatch(payload.resources);
  if (!canAffordEconomy(save.economy.resources, resources)) {
    throw new Error(`经营资源不足：${formatResourcePatch(resources)}`);
  }
  spendEconomyResources(save.economy.resources, resources);
  for (const id of ECONOMY_RESOURCE_IDS) {
    save.strategy.resources[id] = Math.max(0, save.strategy.resources[id] + (resources[id] ?? 0));
  }
  const summary = `经营资源已转入战略：${formatResourcePatch(resources)}${payload.note ? `，${payload.note}` : ''}`;
  pushSaveLog(save, 'ECONOMY_TRANSFER_TO_STRATEGY', summary, true);
  return summary;
}

export function mergeEconomyResources(
  base: EconomyResourceLedger,
  patch: EconomyResourcePatch,
): EconomyResourceLedger {
  return ECONOMY_RESOURCE_IDS.reduce((ledger, id) => {
    ledger[id] = Math.max(0, Math.floor((base[id] ?? 0) + (patch[id] ?? 0)));
    return ledger;
  }, { ...EMPTY_ECONOMY_RESOURCES });
}

export function canAffordEconomy(resources: EconomyResourceLedger, cost: EconomyResourcePatch): boolean {
  return ECONOMY_RESOURCE_IDS.every(id => (resources[id] ?? 0) >= (cost[id] ?? 0));
}

export function spendEconomyResources(resources: EconomyResourceLedger, cost: EconomyResourcePatch): void {
  if (!canAffordEconomy(resources, cost)) {
    throw new Error(`经营资源不足：${formatResourcePatch(cost)}`);
  }
  for (const id of ECONOMY_RESOURCE_IDS) {
    resources[id] = Math.max(0, resources[id] - (cost[id] ?? 0));
  }
}

export function addEconomyResources(resources: EconomyResourceLedger, gain: EconomyResourcePatch): void {
  for (const id of ECONOMY_RESOURCE_IDS) {
    resources[id] = Math.max(0, resources[id] + (gain[id] ?? 0));
  }
}

function createBusinessSettlementReport(
  save: GameSave,
  business: BusinessState,
  payload: BusinessSettlePayload,
): EconomySettlementReport {
  const cycles = Math.max(1, Math.floor(payload.cycles ?? 1));
  const assignments = getBusinessAssignments(save, business.businessId);
  const efficiencyBonus = assignments.reduce((sum, assignment) => sum + assignment.efficiencyBonus, 0);
  const riskModifier = assignments.reduce((sum, assignment) => sum + assignment.riskModifier, 0);
  const upkeepPatch = assignments.reduce<EconomyResourcePatch>(
    (total, assignment) => addPatch(total, assignment.upkeep),
    { ...business.upkeep },
  );
  const productionMultiplier =
    Math.max(1, business.level) *
    cycles *
    (0.75 + business.prosperity / 100) *
    Math.max(0.25, 1 - business.riskLevel / 160) *
    (1 + efficiencyBonus / 100 + assignments.length * 0.03);
  const produced = scaleResources(toLedger(business.baseYield), productionMultiplier);
  const upkeep = scaleResources(toLedger(upkeepPatch), cycles);
  const resourcesBefore = { ...save.economy.resources };
  const resourcesAfterProduction = mergeEconomyResources(save.economy.resources, produced);
  const canPayUpkeep = canAffordEconomy(resourcesAfterProduction, upkeep);
  const net = diffResources(resourcesBefore, canPayUpkeep ? subtractResources(resourcesAfterProduction, upkeep) : resourcesAfterProduction);
  const riskEvent = payload.applyRisk === false ? '' : buildRiskEvent(business, riskModifier, canPayUpkeep);
  const riskDelta = payload.applyRisk === false ? 0 : calculateRiskDelta(business, riskModifier, canPayUpkeep);

  return {
    reportId: createId('economy_report'),
    at: payload.now ?? nowIso(),
    businessId: business.businessId,
    businessName: business.name || business.businessId,
    cycles,
    produced,
    upkeep,
    net,
    riskDelta,
    riskEvent,
    staffNpcIds: assignments.map(assignment => assignment.npcId),
    summary: buildSettlementSummary(business, produced, upkeep, net, riskEvent),
  };
}

function applySettlementReport(save: GameSave, report: EconomySettlementReport): void {
  addEconomyResources(save.economy.resources, report.produced);
  if (canAffordEconomy(save.economy.resources, report.upkeep)) {
    spendEconomyResources(save.economy.resources, report.upkeep);
  }
  if (report.net.silver > 0) {
    save.economy.pendingIncome[report.businessId] = (save.economy.pendingIncome[report.businessId] ?? 0) + report.net.silver;
  }
  save.economy.recentReports.unshift(report);
  save.economy.recentReports = save.economy.recentReports.slice(0, 30);
}

function requireBusiness(save: GameSave, businessId: string): BusinessState {
  const business = save.economy.businesses[businessId];
  if (!business) throw new Error(`产业不存在：${businessId}`);
  return business;
}

function getBusinessAssignments(save: GameSave, businessId: string) {
  return Object.values(save.economy.assignments).filter(assignment => assignment.businessId === businessId);
}

function calculateRiskDelta(business: BusinessState, staffRiskModifier: number, canPayUpkeep: boolean): number {
  const riskPressure = business.riskLevel + staffRiskModifier + (canPayUpkeep ? 0 : 12) - business.security * 0.25;
  if (riskPressure >= 70) return 6;
  if (riskPressure >= 45) return 3;
  if (riskPressure <= 10) return -2;
  return 0;
}

function buildRiskEvent(business: BusinessState, staffRiskModifier: number, canPayUpkeep: boolean): string {
  if (!canPayUpkeep) return '维护不足，产业风险上升';
  const pressure = business.riskLevel + staffRiskModifier - business.security * 0.25;
  if (pressure >= 70) return '地方觊觎渐重，产业风险明显上升';
  if (pressure >= 45) return '账面风声偏紧，产业风险小幅上升';
  if (pressure <= 10) return '经营平稳，风险略降';
  return '';
}

function buildSettlementSummary(
  business: BusinessState,
  produced: EconomyResourceLedger,
  upkeep: EconomyResourceLedger,
  net: EconomyResourceDelta,
  riskEvent: string,
): string {
  return [
    `${business.name || business.businessId}结算完成`,
    `产出：${summarizeResources(produced)}`,
    `维护：${summarizeResources(upkeep)}`,
    `净变动：${summarizeResourceDelta(net)}`,
    riskEvent,
  ]
    .filter(Boolean)
    .join('；');
}

function defaultRoleEfficiency(role: string): number {
  if (role === 'manager') return 12;
  if (role === 'accountant') return 8;
  if (role === 'artisan') return 10;
  if (role === 'broker') return 10;
  if (role === 'scout') return 6;
  if (role === 'healer') return 6;
  if (role === 'stable_master') return 10;
  if (role === 'host') return 8;
  if (role === 'trainer') return 8;
  if (role === 'guard') return 4;
  return 0;
}

function defaultRoleRiskModifier(role: string): number {
  if (role === 'guard') return -10;
  if (role === 'scout') return -6;
  if (role === 'manager') return -4;
  if (role === 'accountant') return -3;
  if (role === 'broker') return 4;
  if (role === 'host') return 2;
  return 0;
}

function defaultRoleUpkeep(role: string): EconomyResourcePatch {
  if (role === 'guard') return { silver: 6, grain: 4, arms: 1 };
  if (role === 'scout') return { silver: 5 };
  if (role === 'healer') return { silver: 5, medicine: 1 };
  if (role === 'stable_master') return { silver: 4, grain: 3 };
  if (role === 'trainer') return { silver: 6, grain: 2 };
  return { silver: 4 };
}

function sanitizeResourcePatch(patch: EconomyResourcePatch): EconomyResourcePatch {
  return ECONOMY_RESOURCE_IDS.reduce<EconomyResourcePatch>((result, id) => {
    const value = patch[id];
    if (value !== undefined && Number.isFinite(value) && value > 0) {
      result[id] = Math.floor(value);
    }
    return result;
  }, {});
}

function toLedger(patch: EconomyResourcePatch): EconomyResourceLedger {
  return ECONOMY_RESOURCE_IDS.reduce((ledger, id) => {
    ledger[id] = Math.max(0, Math.floor(patch[id] ?? 0));
    return ledger;
  }, { ...EMPTY_ECONOMY_RESOURCES });
}

function addPatch(left: EconomyResourcePatch, right: EconomyResourcePatch): EconomyResourcePatch {
  return ECONOMY_RESOURCE_IDS.reduce<EconomyResourcePatch>((result, id) => {
    const value = (left[id] ?? 0) + (right[id] ?? 0);
    if (value > 0) result[id] = value;
    return result;
  }, {});
}

function scaleResources(resources: EconomyResourceLedger, multiplier: number): EconomyResourceLedger {
  return ECONOMY_RESOURCE_IDS.reduce((result, id) => {
    result[id] = Math.max(0, Math.floor(resources[id] * multiplier));
    return result;
  }, { ...EMPTY_ECONOMY_RESOURCES });
}

function subtractResources(left: EconomyResourceLedger, right: EconomyResourceLedger): EconomyResourceLedger {
  return ECONOMY_RESOURCE_IDS.reduce((result, id) => {
    result[id] = Math.max(0, left[id] - right[id]);
    return result;
  }, { ...EMPTY_ECONOMY_RESOURCES });
}

function diffResources(before: EconomyResourceLedger, after: EconomyResourceLedger): EconomyResourceDelta {
  return ECONOMY_RESOURCE_IDS.reduce((delta, id) => {
    delta[id] = after[id] - before[id];
    return delta;
  }, { ...EMPTY_ECONOMY_RESOURCES });
}

function sumReportNet(reports: EconomySettlementReport[]): EconomyResourceDelta {
  return reports.reduce<EconomyResourceDelta>((sum, report) => {
    for (const id of ECONOMY_RESOURCE_IDS) {
      sum[id] += report.net[id];
    }
    return sum;
  }, { ...EMPTY_ECONOMY_RESOURCES });
}

function summarizeResources(resources: EconomyResourceLedger): string {
  const text = ECONOMY_RESOURCE_IDS.filter(id => resources[id] > 0)
    .map(id => `${resourceName(id)}${resources[id]}`)
    .join('、');
  return text || '无';
}

function summarizeResourceDelta(delta: EconomyResourceDelta): string {
  const text = ECONOMY_RESOURCE_IDS.filter(id => delta[id] !== 0)
    .map(id => `${resourceName(id)}${delta[id] > 0 ? '+' : ''}${delta[id]}`)
    .join('、');
  return text || '无变化';
}

function formatResourcePatch(patch: EconomyResourcePatch): string {
  const text = ECONOMY_RESOURCE_IDS.filter(id => (patch[id] ?? 0) > 0)
    .map(id => `${resourceName(id)}${patch[id]}`)
    .join('、');
  return text || '无';
}

function resourceName(id: EconomyResourceId): string {
  const names: Record<EconomyResourceId, string> = {
    silver: '银钱',
    grain: '粮草',
    arms: '军械',
    horses: '马匹',
    manpower: '人力',
    intel: '情报',
    medicine: '药材',
  };
  return names[id];
}

function normalizeBusinessType(value: string | undefined): EconomyBusinessType {
  return value && value in DEFAULT_BUSINESS_YIELD ? (value as EconomyBusinessType) : 'custom';
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
