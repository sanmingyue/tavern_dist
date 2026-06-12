import { DEFAULT_LOCATION_ID, getLocationById, getLocationName } from '../data/locations';
import type { ActionResult } from '../types/actions';
import type { GameSave } from '../types/schema';
import { advanceGameTime } from './tick';

type RouteResult = {
  minutes: number;
  path: string[];
};

function findRoute(fromId: string, targetId: string): RouteResult | null {
  if (fromId === targetId) return { minutes: 0, path: [fromId] };
  const start = getLocationById(fromId);
  const target = getLocationById(targetId);
  if (!target) return null;
  if (!start) return { minutes: 0, path: [targetId] };

  const queue: RouteResult[] = [{ minutes: 0, path: [fromId] }];
  const visited = new Set([fromId]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentId = current.path[current.path.length - 1];
    const node = getLocationById(currentId);
    for (const link of node?.links ?? []) {
      if (visited.has(link.targetId)) continue;
      const next = { minutes: current.minutes + link.minutes, path: [...current.path, link.targetId] };
      if (link.targetId === targetId) return next;
      visited.add(link.targetId);
      queue.push(next);
    }
  }
  return { minutes: 15, path: [fromId, targetId] };
}

export function changeLocation(save: GameSave, targetId: string): ActionResult<{ minutes: number; path: string[] }> {
  const fromId = save.user.currentLocationId || DEFAULT_LOCATION_ID;
  const route = findRoute(fromId, targetId);
  if (!route) {
    return {
      ok: false,
      tone: 'red',
      message: `未知地点：${targetId}`,
      save,
    };
  }

  if (route.minutes > 0) {
    advanceGameTime(save, route.minutes, `移动到${getLocationName(targetId)}`);
  }
  save.user.currentLocationId = targetId;
  if (!save.world.discoveredLocations.includes(targetId)) {
    save.world.discoveredLocations.push(targetId);
  }

  return {
    ok: true,
    tone: 'green',
    message: `已移动到${getLocationName(targetId)}`,
    save,
    shouldAskAI: true,
    data: route,
  };
}
