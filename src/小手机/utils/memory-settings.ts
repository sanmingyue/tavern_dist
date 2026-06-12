const VECTOR_MEMORY_SETTINGS_KEY = 'mini-phone-vector-memory-enabled';

export function isVectorMemoryEnabled(): boolean {
  try {
    return window.parent.localStorage.getItem(VECTOR_MEMORY_SETTINGS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setVectorMemoryEnabled(enabled: boolean): void {
  try {
    window.parent.localStorage.setItem(VECTOR_MEMORY_SETTINGS_KEY, enabled ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}
