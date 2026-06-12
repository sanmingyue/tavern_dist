import type { GameSave } from '../types/schema';

const weatherBySeason: Record<GameSave['time']['season'], string[]> = {
  春: ['多云', '小雨', '晴', '阴', '阵雨'],
  夏: ['晴热', '雷阵雨', '多云', '台风外围', '闷热'],
  秋: ['晴', '多云', '桂花香的晴天', '小雨', '凉爽'],
  冬: ['阴冷', '晴冷', '小雪', '多云', '湿冷'],
};

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function generateWeather(season: GameSave['time']['season'], dateText: string): string {
  const pool = weatherBySeason[season];
  return pool[hashText(`${season}:${dateText}`) % pool.length];
}
