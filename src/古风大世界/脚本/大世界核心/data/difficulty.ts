import type { DifficultyId } from '../types/schema';

export type DifficultyDefinition = {
  id: DifficultyId;
  name: string;
  payload: Record<string, never>;
};

export const DEFAULT_DIFFICULTY_ID: DifficultyId = 'normal';

export const DIFFICULTY_DEFINITIONS: readonly DifficultyDefinition[] = [
  { id: 'story', name: '剧情模式', payload: {} },
  { id: 'normal', name: '普通模式', payload: {} },
  { id: 'realistic', name: '真实模式', payload: {} },
  { id: 'stray', name: '野狗模式', payload: {} },
] as const;

export function getDifficultyDefinition(difficultyId: DifficultyId): DifficultyDefinition {
  const found = DIFFICULTY_DEFINITIONS.find(definition => definition.id === difficultyId);
  if (!found) {
    throw new Error(`未知难度：${difficultyId}`);
  }
  return found;
}

export function getDefaultDifficultyDefinition(): DifficultyDefinition {
  return getDifficultyDefinition(DEFAULT_DIFFICULTY_ID);
}
