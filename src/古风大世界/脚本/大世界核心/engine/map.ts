import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { MapLocationNode, MapRouteNode, TravelMode, TravelPlan, TravelPlanRequest } from '../types/map';
import type { GameSave } from '../types/schema';
import { advanceWorldTime, estimateTravelMinutes } from './time';

export function upsertMapLocation(save: GameSave, node: MapLocationNode): string {
  save.world.mapLocations[node.locationId] = {
    ...node,
    countryId: node.countryId ?? '',
    parentLocationId: node.parentLocationId ?? '',
    tags: node.tags ?? [],
    formulaResourceIds: node.formulaResourceIds ?? [],
    state: node.state ?? {},
  };
  if (node.discovered && !save.world.discoveredLocationIds.includes(node.locationId)) {
    save.world.discoveredLocationIds.push(node.locationId);
  }
  if (node.unlocked && !save.world.unlockedLocationIds.includes(node.locationId)) {
    save.world.unlockedLocationIds.push(node.locationId);
  }
  pushSaveLog(save, 'MAP_LOCATION_UPSERT', `地点已登记：${node.name}`, true, [node.locationId]);
  return `地点已登记：${node.name}`;
}

export function upsertMapRoute(save: GameSave, route: MapRouteNode): string {
  requireLocationKnown(save, route.fromLocationId);
  requireLocationKnown(save, route.toLocationId);
  save.world.mapRoutes[route.routeId] = {
    ...route,
    allowedModes: route.allowedModes.length > 0 ? route.allowedModes : ['walk'],
    unlockFlagIds: route.unlockFlagIds ?? [],
    tags: route.tags ?? [],
  };
  pushSaveLog(save, 'MAP_ROUTE_UPSERT', `路线已登记：${route.fromLocationId} -> ${route.toLocationId}`, true, [
    route.routeId,
  ]);
  return `路线已登记：${route.routeId}`;
}

export function planTravel(save: GameSave, request: TravelPlanRequest): TravelPlan {
  const fromLocationId = request.startLocationId ?? save.player.location.currentLocationId;
  const targetLocationId = request.targetLocationId;
  const mode = request.mode ?? 'walk';
  const route = findBestRoute(save, fromLocationId, targetLocationId, mode);
  const directDistance = fromLocationId === targetLocationId ? 0 : 0;
  const distanceLi = route?.distanceLi ?? directDistance;
  const blocked = route ? isRouteBlocked(save, route, mode) : fromLocationId !== targetLocationId;
  const risk = route?.risk ?? 0;
  const minutes = distanceLi > 0 ? estimateTravelMinutes(distanceLi, normalizeTimeMode(mode)) : 15;
  return {
    planId: createId('travel_plan'),
    fromLocationId,
    targetLocationId,
    routeId: route?.routeId,
    mode,
    distanceLi,
    minutes,
    risk,
    blocked,
    reason: request.reason ?? '行路',
    summary: blocked
      ? `无法从${fromLocationId}前往${targetLocationId}`
      : `从${fromLocationId}前往${targetLocationId}，约${minutes}分钟`,
  };
}

export function storeTravelPlan(save: GameSave, request: TravelPlanRequest): string {
  const plan = planTravel(save, request);
  save.world.lastTravelPlan = plan;
  pushSaveLog(save, 'MAP_TRAVEL_PLAN', plan.summary, !plan.blocked, [plan.fromLocationId, plan.targetLocationId]);
  return plan.summary;
}

export function executeTravelPlan(save: GameSave, requestOrPlan?: TravelPlanRequest | TravelPlan): string {
  const plan = isTravelPlan(requestOrPlan)
    ? requestOrPlan
    : requestOrPlan
      ? planTravel(save, requestOrPlan)
      : save.world.lastTravelPlan;
  if (!plan) throw new Error('没有可执行的行路计划');
  if (plan.blocked) throw new Error(plan.summary);

  const target = save.world.mapLocations[plan.targetLocationId];
  const previousLocationId = save.player.location.currentLocationId;
  advanceWorldTime(save, plan.minutes, plan.reason || '行路');
  save.player.location.previousLocationId = previousLocationId;
  save.player.location.currentLocationId = plan.targetLocationId;
  if (target?.regionId) save.world.currentRegionId = target.regionId;
  markLocationVisited(save, plan.targetLocationId);
  save.world.lastTravelPlan = plan;
  pushSaveLog(save, 'MAP_TRAVEL_EXECUTE', plan.summary, true, [previousLocationId, plan.targetLocationId]);
  return plan.summary;
}

export function markLocationVisited(save: GameSave, locationId: string): void {
  const at = nowIso();
  if (!save.world.discoveredLocationIds.includes(locationId)) save.world.discoveredLocationIds.push(locationId);
  if (!save.world.unlockedLocationIds.includes(locationId)) save.world.unlockedLocationIds.push(locationId);
  const state = save.world.locationStates[locationId] ?? {
    visited: false,
    discoveredAt: at,
    lastVisitedAt: null,
    stateFlags: {},
  };
  state.visited = true;
  state.discoveredAt = state.discoveredAt ?? at;
  state.lastVisitedAt = at;
  save.world.locationStates[locationId] = state;
  const node = save.world.mapLocations[locationId];
  if (node) {
    node.discovered = true;
    node.unlocked = true;
    save.world.mapLocations[locationId] = node;
  }
}

export function getReachableLocations(save: GameSave, fromLocationId = save.player.location.currentLocationId): string[] {
  return Object.values(save.world.mapRoutes)
    .filter(route => !route.blocked && (route.fromLocationId === fromLocationId || route.toLocationId === fromLocationId))
    .map(route => (route.fromLocationId === fromLocationId ? route.toLocationId : route.fromLocationId));
}

function findBestRoute(save: GameSave, fromLocationId: string, toLocationId: string, mode: TravelMode): MapRouteNode | null {
  return (
    Object.values(save.world.mapRoutes)
      .filter(
        route =>
          (route.fromLocationId === fromLocationId && route.toLocationId === toLocationId) ||
          (route.fromLocationId === toLocationId && route.toLocationId === fromLocationId),
      )
      .sort((left, right) => {
        const leftBlocked = isRouteBlocked(save, left, mode) ? 1 : 0;
        const rightBlocked = isRouteBlocked(save, right, mode) ? 1 : 0;
        if (leftBlocked !== rightBlocked) return leftBlocked - rightBlocked;
        return left.distanceLi + left.risk - (right.distanceLi + right.risk);
      })[0] ?? null
  );
}

function isRouteBlocked(save: GameSave, route: MapRouteNode, mode: TravelMode): boolean {
  if (route.blocked) return true;
  if (!route.allowedModes.includes(mode)) return true;
  return (route.unlockFlagIds ?? []).some(flagId => !save.world.worldFlags[flagId]);
}

function requireLocationKnown(save: GameSave, locationId: string): void {
  if (!save.world.mapLocations[locationId] && !save.world.discoveredLocationIds.includes(locationId)) {
    throw new Error(`地点未登记：${locationId}`);
  }
}

function normalizeTimeMode(mode: TravelMode): 'walk' | 'horse' | 'boat' {
  if (mode === 'boat') return 'boat';
  if (mode === 'horse' || mode === 'carriage' || mode === 'fast') return 'horse';
  return 'walk';
}

function isTravelPlan(value: TravelPlanRequest | TravelPlan | undefined | null): value is TravelPlan {
  return Boolean(value && 'planId' in value && 'fromLocationId' in value);
}

