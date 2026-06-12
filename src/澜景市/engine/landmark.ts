import type { ActionResult } from '../types/actions';
import type { GameSave, LandmarkChange } from '../types/schema';

export function changeLandmark(save: GameSave, locationId: string, change: LandmarkChange): ActionResult {
  save.world.landmarks[locationId] = { ...change, locationId };
  return { ok: true, tone: 'green', message: `地标已变化：${locationId}`, save };
}

export function ageLandmark(save: GameSave, locationId: string, years: number): ActionResult {
  const previous = save.world.landmarks[locationId];
  save.world.landmarks[locationId] = {
    id: `landmark_age_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    locationId,
    time: save.time.current,
    changedAt: save.time.current,
    type: '老化',
    description: previous
      ? `${previous.description}；又经过了${years}年，痕迹更明显。`
      : `经过了${years}年，地点自然老化。`,
    permanent: true,
  };
  return { ok: true, tone: 'yellow', message: `地标老化：${locationId}`, save };
}
