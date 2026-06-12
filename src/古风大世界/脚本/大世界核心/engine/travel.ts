import { pushSaveLog, nowIso } from '../state/defaults';
import type { TravelPayload } from '../types/actions';
import type { GameSave } from '../types/schema';
import { executeTravelPlan, planTravel } from './map';
import { advanceWorldTime, estimateTravelMinutes } from './time';

export function changeLocation(save: GameSave, payload: TravelPayload): string {
  const planned = planTravel(save, {
    targetLocationId: payload.targetLocationId,
    startLocationId: save.player.location.currentLocationId,
    mode: 'walk',
    reason: payload.reason,
  });
  if (planned.routeId && !planned.blocked) {
    return executeTravelPlan(save, planned);
  }

  const previousLocationId = save.player.location.currentLocationId;
  const nextLocationId = payload.targetLocationId;
  const distanceLi = payload.distanceLi ?? 0;
  const minutes = distanceLi > 0 ? estimateTravelMinutes(distanceLi) : 15;
  const timeMessage = advanceWorldTime(save, minutes, payload.reason ?? '行路');

  save.player.location.previousLocationId = previousLocationId;
  save.player.location.currentLocationId = nextLocationId;
  if (payload.targetRegionId) {
    save.world.currentRegionId = payload.targetRegionId;
  }

  if (!save.world.discoveredLocationIds.includes(nextLocationId)) {
    save.world.discoveredLocationIds.push(nextLocationId);
  }
  if (!save.world.unlockedLocationIds.includes(nextLocationId)) {
    save.world.unlockedLocationIds.push(nextLocationId);
  }

  const at = nowIso();
  const state = save.world.locationStates[nextLocationId] ?? {
    visited: false,
    discoveredAt: at,
    lastVisitedAt: null,
    stateFlags: {},
  };
  state.visited = true;
  state.discoveredAt = state.discoveredAt ?? at;
  state.lastVisitedAt = at;
  save.world.locationStates[nextLocationId] = state;

  pushSaveLog(save, 'TRAVEL', `从${previousLocationId}前往${nextLocationId}`, true, [previousLocationId, nextLocationId]);
  return timeMessage;
}
