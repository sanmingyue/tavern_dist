const VECTOR_DIMENSIONS = 256;
const MAX_KEYWORDS = 12;

function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function isCjk(char: string): boolean {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(char);
}

export function normalizeVectorText(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\u3400-\u9fff\uf900-\ufaff]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeForVector(text: string): string[] {
  const normalized = normalizeVectorText(text);
  if (!normalized) return [];

  const tokens: string[] = [];
  const cjkChars = Array.from(normalized).filter(isCjk);

  for (let i = 0; i < cjkChars.length; i += 1) {
    tokens.push(cjkChars[i]);
    if (i + 1 < cjkChars.length) tokens.push(cjkChars.slice(i, i + 2).join(''));
    if (i + 2 < cjkChars.length) tokens.push(cjkChars.slice(i, i + 3).join(''));
  }

  const latinWords = normalized.match(/[a-z0-9]+/g) ?? [];
  for (const word of latinWords) {
    tokens.push(word);
    if (word.length > 4) {
      for (let i = 0; i <= word.length - 3; i += 1) {
        tokens.push(word.slice(i, i + 3));
      }
    }
  }

  return tokens;
}

export function createLocalEmbedding(text: string): number[] {
  const vector = new Array<number>(VECTOR_DIMENSIONS).fill(0);
  const tokens = tokenizeForVector(text);
  if (tokens.length === 0) return vector;

  for (const token of tokens) {
    const hash = hashString(token);
    const index = hash % VECTOR_DIMENSIONS;
    const sign = (hash & 0x80000000) === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map(value => Number((value / magnitude).toFixed(6)));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / Math.sqrt(magA * magB);
}

export function extractVectorKeywords(text: string, limit: number = MAX_KEYWORDS): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenizeForVector(text)) {
    if (token.length < 2) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .slice(0, limit)
    .map(([token]) => token);
}

export function truncateByChars(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}…`;
}
