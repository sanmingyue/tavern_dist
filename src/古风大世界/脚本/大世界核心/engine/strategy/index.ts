import { createId } from '../../state/defaults';
import type {
  StrategyCampaignSetup,
  StrategyCampaignState,
  StrategyEventRecord,
  StrategyForce,
  StrategyLocation,
  StrategyOrder,
  StrategyOrderResult,
  StrategyResourceId,
  StrategyResourceLedger,
  StrategyRoute,
  StrategyTurnResult,
} from '../../types/strategy';

export const STRATEGY_RESOURCE_IDS: StrategyResourceId[] = [
  'silver',
  'grain',
  'arms',
  'horses',
  'manpower',
  'intel',
  'medicine',
];

export const EMPTY_STRATEGY_RESOURCES: StrategyResourceLedger = {
  silver: 0,
  grain: 0,
  arms: 0,
  horses: 0,
  manpower: 0,
  intel: 0,
  medicine: 0,
};

export function createStrategyCampaign(setup: StrategyCampaignSetup): StrategyCampaignState {
  const campaignId = setup.campaignId ?? createId('campaign');
  const state: StrategyCampaignState = {
    campaignId,
    name: setup.name,
    regionId: setup.regionId,
    turn: setup.turn ?? 1,
    resources: mergeResources(EMPTY_STRATEGY_RESOURCES, setup.resources ?? {}),
    forces: Object.fromEntries(setup.forces.map(force => [force.forceId, normalizeForce(force)])),
    locations: Object.fromEntries(setup.locations.map(location => [location.locationId, normalizeLocation(location)])),
    routes: Object.fromEntries(setup.routes.map(route => [route.routeId, normalizeRoute(route)])),
    fronts: Object.fromEntries((setup.fronts ?? []).map(front => [front.frontId, front])),
    pendingOrders: [],
    eventLog: [],
    finished: false,
  };
  assertCampaignReferences(state);
  addStrategyEvent(state, 'campaign_created', `战役建立：${setup.name}`);
  return state;
}

export function enqueueStrategyOrder(state: StrategyCampaignState, order: StrategyOrder): StrategyCampaignState {
  state.pendingOrders.push({ ...order, orderId: order.orderId ?? createId('order') });
  return state;
}

export function resolveStrategyTurn(state: StrategyCampaignState, maxOrders = 12): StrategyTurnResult {
  if (state.finished) {
    return {
      campaignId: state.campaignId,
      turn: state.turn,
      orderResults: [],
      summary: '战役已结束',
      resources: state.resources,
    };
  }

  const orders = state.pendingOrders.splice(0, Math.max(0, maxOrders));
  const orderResults = orders.map(order => resolveStrategyOrder(state, order));
  applyUpkeep(state);
  state.turn += 1;
  const summary = orderResults.length > 0 ? orderResults.map(result => result.summary).join('；') : '本旬无军令变动';
  addStrategyEvent(state, 'turn_resolved', summary);
  return {
    campaignId: state.campaignId,
    turn: state.turn,
    orderResults,
    summary,
    resources: state.resources,
  };
}

export function resolveStrategyOrder(state: StrategyCampaignState, order: StrategyOrder): StrategyOrderResult {
  const orderId = order.orderId ?? createId('order');
  const before = { ...state.resources };
  const changedForceIds: string[] = [];
  const changedLocationIds: string[] = [];
  let summary = '';

  if (order.kind === 'recruit') {
    summary = recruit(state, order, changedForceIds);
  } else if (order.kind === 'fortify') {
    summary = fortify(state, order, changedLocationIds);
  } else if (order.kind === 'gather_intel') {
    summary = gatherIntel(state, order, changedLocationIds);
  } else {
    const force = requireForce(state, order.forceId);
    changedForceIds.push(force.forceId);
    if (order.kind === 'march') summary = march(state, force, order, changedLocationIds);
    if (order.kind === 'defend') summary = defend(state, force, order, changedLocationIds);
    if (order.kind === 'siege') summary = siege(state, force, order, changedLocationIds);
    if (order.kind === 'assault') summary = assault(state, force, order, changedForceIds, changedLocationIds);
    if (order.kind === 'raid_supply') summary = raidSupply(state, force, order, changedForceIds, changedLocationIds);
    if (order.kind === 'escort') summary = escort(state, force, order, changedLocationIds);
    if (order.kind === 'suppress_unrest') summary = suppressUnrest(state, force, order, changedLocationIds);
    if (order.kind === 'negotiate') summary = negotiate(state, force, order, changedLocationIds);
  }

  const resourceDelta = diffResources(before, state.resources);
  addStrategyEvent(state, `order_${order.kind}`, summary, changedForceIds, changedLocationIds, resourceDelta);
  return {
    ok: true,
    orderId,
    summary,
    resourceDelta,
    changedForceIds,
    changedLocationIds,
  };
}

export function mergeResources(
  base: StrategyResourceLedger,
  patch: Partial<StrategyResourceLedger>,
): StrategyResourceLedger {
  return STRATEGY_RESOURCE_IDS.reduce((ledger, id) => {
    ledger[id] = Math.max(0, Math.floor((base[id] ?? 0) + (patch[id] ?? 0)));
    return ledger;
  }, { ...EMPTY_STRATEGY_RESOURCES });
}

export function canAfford(resources: StrategyResourceLedger, cost: Partial<StrategyResourceLedger>): boolean {
  return STRATEGY_RESOURCE_IDS.every(id => (resources[id] ?? 0) >= (cost[id] ?? 0));
}

export function spendResources(resources: StrategyResourceLedger, cost: Partial<StrategyResourceLedger>): void {
  if (!canAfford(resources, cost)) {
    throw new Error(`战略资源不足：${formatResourceCost(cost)}`);
  }
  for (const id of STRATEGY_RESOURCE_IDS) {
    resources[id] = Math.max(0, resources[id] - (cost[id] ?? 0));
  }
}

export function addResources(resources: StrategyResourceLedger, gain: Partial<StrategyResourceLedger>): void {
  for (const id of STRATEGY_RESOURCE_IDS) {
    resources[id] = Math.max(0, resources[id] + (gain[id] ?? 0));
  }
}

function recruit(state: StrategyCampaignState, order: StrategyOrder, changedForceIds: string[]): string {
  const location = requireLocation(state, order.sourceLocationId ?? order.targetLocationId);
  const budget = normalizeBudget(order.resourceBudget, { silver: 80, grain: 60, arms: 35, manpower: 120 });
  spendResources(state.resources, budget);
  const forceId = order.forceId ?? createId('force');
  const recruits = Math.max(60, Math.floor((budget.manpower ?? 0) * 0.8));
  state.forces[forceId] = normalizeForce({
    forceId,
    name: order.note || `${location.name}新募义勇`,
    side: 'player',
    factionId: location.controllerFactionId,
    locationId: location.locationId,
    troopCount: recruits,
    troopQuality: 35,
    infantry: recruits,
    cavalry: Math.floor((budget.horses ?? 0) * 0.6),
    archers: Math.floor((budget.arms ?? 0) * 0.4),
    engineers: 0,
    scouts: 5,
    martialExperts: 0,
    morale: 45,
    supplies: budget.grain ?? 0,
    fatigue: 0,
    wounded: 0,
    cohesion: 35,
    siegePower: 0,
    mobility: 35,
  });
  changedForceIds.push(forceId);
  return `${location.name}募得${recruits}人`;
}

function fortify(state: StrategyCampaignState, order: StrategyOrder, changedLocationIds: string[]): string {
  const location = requireLocation(state, order.targetLocationId ?? order.sourceLocationId);
  const budget = normalizeBudget(order.resourceBudget, { silver: 60, grain: 20, arms: 30, manpower: 60 });
  spendResources(state.resources, budget);
  const gain = Math.max(1, Math.floor(((budget.silver ?? 0) + (budget.arms ?? 0) + (budget.manpower ?? 0)) / 80));
  location.fortification = clamp(location.fortification + gain, 0, 100);
  location.publicOrder = clamp(location.publicOrder - 2, 0, 100);
  changedLocationIds.push(location.locationId);
  return `${location.name}加固城防，城防提升${gain}`;
}

function gatherIntel(state: StrategyCampaignState, order: StrategyOrder, changedLocationIds: string[]): string {
  const location = requireLocation(state, order.targetLocationId ?? order.sourceLocationId);
  const budget = normalizeBudget(order.resourceBudget, { silver: 20 });
  spendResources(state.resources, budget);
  const gain = Math.max(5, Math.floor((budget.silver ?? 0) / 2) + location.publicOrder / 10);
  addResources(state.resources, { intel: gain });
  changedLocationIds.push(location.locationId);
  return `${location.name}收得情报${Math.floor(gain)}点`;
}

function march(state: StrategyCampaignState, force: StrategyForce, order: StrategyOrder, changedLocationIds: string[]): string {
  const target = requireLocation(state, order.targetLocationId);
  const route = findRoute(state, force.locationId, target.locationId);
  const cost = calculateMarchCost(force, route);
  spendResources(state.resources, cost);
  force.locationId = target.locationId;
  force.fatigue = clamp(force.fatigue + route.risk + route.distanceLi / 80, 0, 100);
  force.supplies = clamp(force.supplies - (cost.grain ?? 0), 0, 100000);
  changedLocationIds.push(target.locationId);
  return `${force.name}行军至${target.name}`;
}

function defend(state: StrategyCampaignState, force: StrategyForce, order: StrategyOrder, changedLocationIds: string[]): string {
  const location = requireLocation(state, order.targetLocationId ?? force.locationId);
  const cost = normalizeBudget(order.resourceBudget, { grain: Math.ceil(force.troopCount / 80), arms: 5 });
  spendResources(state.resources, cost);
  force.locationId = location.locationId;
  force.morale = clamp(force.morale + 4, 0, 100);
  force.cohesion = clamp(force.cohesion + 5, 0, 100);
  location.garrison = Math.max(location.garrison, Math.floor(force.troopCount * 0.45));
  changedLocationIds.push(location.locationId);
  return `${force.name}驻防${location.name}`;
}

function siege(state: StrategyCampaignState, force: StrategyForce, order: StrategyOrder, changedLocationIds: string[]): string {
  const location = requireLocation(state, order.targetLocationId);
  const cost = normalizeBudget(order.resourceBudget, { grain: Math.ceil(force.troopCount / 60), arms: 10, intel: 3 });
  spendResources(state.resources, cost);
  const pressure = calculateForcePower(force) + force.siegePower + (cost.intel ?? 0) * 3;
  const reduction = Math.max(1, Math.floor(pressure / Math.max(30, location.fortification + location.garrison / 20)));
  location.fortification = clamp(location.fortification - reduction, 0, 100);
  location.grainStock = clamp(location.grainStock - reduction * 8, 0, 100000);
  force.fatigue = clamp(force.fatigue + 8, 0, 100);
  changedLocationIds.push(location.locationId);
  return `${force.name}围困${location.name}，城防削弱${reduction}`;
}

function assault(
  state: StrategyCampaignState,
  force: StrategyForce,
  order: StrategyOrder,
  changedForceIds: string[],
  changedLocationIds: string[],
): string {
  const location = requireLocation(state, order.targetLocationId);
  const cost = normalizeBudget(order.resourceBudget, { grain: Math.ceil(force.troopCount / 70), arms: 18, medicine: 8 });
  spendResources(state.resources, cost);
  const attackPower = calculateForcePower(force) + (cost.arms ?? 0) * 2 + (cost.intel ?? 0) * 3;
  const defensePower = location.garrison * 0.5 + location.fortification * 12 + location.publicOrder * 2;
  const ratio = attackPower / Math.max(1, defensePower);
  const lossRate = clamp(0.06 + (defensePower / Math.max(1, attackPower)) * 0.08, 0.04, 0.28);
  const losses = Math.floor(force.troopCount * lossRate);
  force.troopCount = Math.max(0, force.troopCount - losses);
  force.wounded += Math.floor(losses * 0.65);
  force.morale = clamp(force.morale + (ratio >= 1 ? 8 : -10), 0, 100);
  force.fatigue = clamp(force.fatigue + 16, 0, 100);
  location.garrison = Math.max(0, location.garrison - Math.floor(attackPower / 18));
  if (ratio >= 1.15 || location.garrison <= 0 || location.fortification <= 0) {
    location.controllerFactionId = force.factionId;
    location.publicOrder = clamp(location.publicOrder - 12, 0, 100);
    changedLocationIds.push(location.locationId);
    return `${force.name}攻下${location.name}，折损${losses}人`;
  }
  changedForceIds.push(force.forceId);
  changedLocationIds.push(location.locationId);
  return `${force.name}强攻${location.name}未克，折损${losses}人`;
}

function raidSupply(
  state: StrategyCampaignState,
  force: StrategyForce,
  order: StrategyOrder,
  changedForceIds: string[],
  changedLocationIds: string[],
): string {
  const location = requireLocation(state, order.targetLocationId);
  const cost = normalizeBudget(order.resourceBudget, { grain: Math.ceil(force.troopCount / 120), intel: 5 });
  spendResources(state.resources, cost);
  const raidPower = force.scouts * 4 + force.cavalry * 0.8 + force.martialExperts * 12 + (cost.intel ?? 0) * 5;
  const defense = location.garrison * 0.3 + location.publicOrder;
  if (raidPower >= defense) {
    const captured = Math.min(location.grainStock, Math.floor(raidPower * 4));
    location.grainStock -= captured;
    addResources(state.resources, { grain: captured });
    location.publicOrder = clamp(location.publicOrder - 6, 0, 100);
    changedLocationIds.push(location.locationId);
    return `${force.name}劫断${location.name}粮道，夺粮${captured}`;
  }
  const losses = Math.max(3, Math.floor(force.troopCount * 0.04));
  force.troopCount = Math.max(0, force.troopCount - losses);
  force.morale = clamp(force.morale - 6, 0, 100);
  changedForceIds.push(force.forceId);
  return `${force.name}袭扰${location.name}粮道失败，折损${losses}人`;
}

function escort(state: StrategyCampaignState, force: StrategyForce, order: StrategyOrder, changedLocationIds: string[]): string {
  const target = requireLocation(state, order.targetLocationId);
  const route = findRoute(state, force.locationId, target.locationId);
  const cost = calculateMarchCost(force, route);
  spendResources(state.resources, cost);
  const safety = force.scouts + force.martialExperts * 4 + force.cohesion - route.risk * 3;
  force.locationId = target.locationId;
  force.fatigue = clamp(force.fatigue + route.distanceLi / 100, 0, 100);
  changedLocationIds.push(target.locationId);
  return safety >= 40 ? `${force.name}护送抵达${target.name}` : `${force.name}护送抵达${target.name}，沿途有失散和伏击风险`;
}

function suppressUnrest(state: StrategyCampaignState, force: StrategyForce, order: StrategyOrder, changedLocationIds: string[]): string {
  const location = requireLocation(state, order.targetLocationId ?? force.locationId);
  const cost = normalizeBudget(order.resourceBudget, { grain: 10, silver: 15 });
  spendResources(state.resources, cost);
  const pressure = force.troopCount * 0.03 + force.morale * 0.3 + (cost.silver ?? 0) * 0.5;
  location.publicOrder = clamp(location.publicOrder + Math.floor(pressure / 8), 0, 100);
  force.morale = clamp(force.morale - 2, 0, 100);
  changedLocationIds.push(location.locationId);
  return `${force.name}弹压${location.name}民乱，秩序回升`;
}

function negotiate(state: StrategyCampaignState, force: StrategyForce, order: StrategyOrder, changedLocationIds: string[]): string {
  const location = requireLocation(state, order.targetLocationId ?? force.locationId);
  const cost = normalizeBudget(order.resourceBudget, { silver: 20, intel: 4 });
  spendResources(state.resources, cost);
  const leverage = force.commanderNpcId ? 15 : 0;
  const result = (cost.silver ?? 0) * 0.4 + (cost.intel ?? 0) * 3 + leverage + location.publicOrder * 0.2;
  if (result >= 35) {
    location.publicOrder = clamp(location.publicOrder + 4, 0, 100);
    changedLocationIds.push(location.locationId);
    return `${force.name}在${location.name}谈判奏效`;
  }
  return `${force.name}在${location.name}谈判未成`;
}

function applyUpkeep(state: StrategyCampaignState): void {
  const totalTroops = Object.values(state.forces).reduce((sum, force) => sum + force.troopCount, 0);
  const grainCost = Math.ceil(totalTroops / 180);
  if (state.resources.grain >= grainCost) {
    spendResources(state.resources, { grain: grainCost });
    return;
  }
  const shortage = grainCost - state.resources.grain;
  state.resources.grain = 0;
  for (const force of Object.values(state.forces)) {
    force.morale = clamp(force.morale - shortage, 0, 100);
    force.fatigue = clamp(force.fatigue + shortage * 0.5, 0, 100);
  }
  addStrategyEvent(state, 'supply_shortage', `粮草不足，诸军士气下降${shortage}`);
}

function calculateMarchCost(force: StrategyForce, route: StrategyRoute): Partial<StrategyResourceLedger> {
  return {
    grain: Math.ceil((force.troopCount / 120) * route.supplyCostMultiplier + route.distanceLi / 80 + force.cavalry / 260),
  };
}

function calculateForcePower(force: StrategyForce): number {
  const troopPower = force.troopCount * (force.troopQuality / 100);
  const armsPower = force.infantry * 0.35 + force.cavalry * 0.9 + force.archers * 0.45 + force.engineers * 0.5;
  const commandPower = force.martialExperts * 10 + force.scouts * 1.5;
  const morale = clamp(force.morale + force.cohesion - force.fatigue, 10, 160) / 100;
  return (troopPower + armsPower + commandPower + force.siegePower) * morale;
}

function findRoute(state: StrategyCampaignState, fromLocationId: string, toLocationId: string): StrategyRoute {
  const route = Object.values(state.routes).find(
    item =>
      !item.blocked &&
      ((item.fromLocationId === fromLocationId && item.toLocationId === toLocationId) ||
        (item.fromLocationId === toLocationId && item.toLocationId === fromLocationId)),
  );
  if (!route) throw new Error(`没有可用路线：${fromLocationId} -> ${toLocationId}`);
  return route;
}

function normalizeBudget(
  budget: Partial<StrategyResourceLedger> | undefined,
  fallback: Partial<StrategyResourceLedger>,
): Partial<StrategyResourceLedger> {
  return budget && Object.keys(budget).length > 0 ? budget : fallback;
}

function normalizeForce(force: StrategyForce): StrategyForce {
  return {
    ...force,
    troopCount: Math.max(0, Math.floor(force.troopCount)),
    troopQuality: clamp(force.troopQuality, 1, 100),
    morale: clamp(force.morale, 0, 100),
    supplies: Math.max(0, force.supplies),
    fatigue: clamp(force.fatigue, 0, 100),
    wounded: Math.max(0, force.wounded),
    cohesion: clamp(force.cohesion, 0, 100),
    tags: force.tags ?? [],
  };
}

function normalizeLocation(location: StrategyLocation): StrategyLocation {
  return {
    ...location,
    fortification: clamp(location.fortification, 0, 100),
    garrison: Math.max(0, Math.floor(location.garrison)),
    grainStock: Math.max(0, Math.floor(location.grainStock)),
    publicOrder: clamp(location.publicOrder, 0, 100),
    supplyLimit: Math.max(0, Math.floor(location.supplyLimit)),
    routeIds: location.routeIds ?? [],
    tags: location.tags ?? [],
  };
}

function normalizeRoute(route: StrategyRoute): StrategyRoute {
  return {
    ...route,
    distanceLi: Math.max(0, route.distanceLi),
    risk: clamp(route.risk, 0, 100),
    supplyCostMultiplier: Math.max(0.1, route.supplyCostMultiplier),
  };
}

function requireForce(state: StrategyCampaignState, forceId: string | undefined): StrategyForce {
  if (!forceId || !state.forces[forceId]) throw new Error(`战略部队不存在：${forceId ?? '未指定'}`);
  return state.forces[forceId];
}

function requireLocation(state: StrategyCampaignState, locationId: string | undefined): StrategyLocation {
  if (!locationId || !state.locations[locationId]) throw new Error(`战略地点不存在：${locationId ?? '未指定'}`);
  return state.locations[locationId];
}

function assertCampaignReferences(state: StrategyCampaignState): void {
  for (const force of Object.values(state.forces)) {
    requireLocation(state, force.locationId);
  }
  for (const route of Object.values(state.routes)) {
    requireLocation(state, route.fromLocationId);
    requireLocation(state, route.toLocationId);
  }
}

function diffResources(
  before: StrategyResourceLedger,
  after: StrategyResourceLedger,
): Partial<StrategyResourceLedger> {
  return STRATEGY_RESOURCE_IDS.reduce<Partial<StrategyResourceLedger>>((delta, id) => {
    const value = after[id] - before[id];
    if (value !== 0) delta[id] = value;
    return delta;
  }, {});
}

function formatResourceCost(cost: Partial<StrategyResourceLedger>): string {
  return STRATEGY_RESOURCE_IDS.filter(id => (cost[id] ?? 0) > 0)
    .map(id => `${id}:${cost[id]}`)
    .join('、');
}

function addStrategyEvent(
  state: StrategyCampaignState,
  type: string,
  summary: string,
  relatedForceIds: string[] = [],
  relatedLocationIds: string[] = [],
  resourceDelta: Partial<StrategyResourceLedger> = {},
): StrategyEventRecord {
  const record: StrategyEventRecord = {
    eventId: createId('strategy_event'),
    turn: state.turn,
    type,
    summary,
    relatedForceIds,
    relatedLocationIds,
    resourceDelta,
  };
  state.eventLog.push(record);
  return record;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
