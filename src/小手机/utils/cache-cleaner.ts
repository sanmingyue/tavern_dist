import { closeLocalDB, getLocalDB, LocalDB } from './local-db';

const STORAGE_KEYS = [
  'mini-phone-app-registry',
  'mini-phone-ui-state',
  'mini-phone-api-config',
  'mini-phone-wallpaper',
  'mini-phone-data',
  'mini-phone-vector-memory-enabled',
  'mini-phone-secondhand-state',
  'mini-phone-bilibili-followed-authors',
  'mini-phone-bilibili-state',
  'mini-phone-tiktok-followed-creators',
  'mini-phone-live-followed-streamers',
  'mini-phone-forum-followed-authors',
  'mini-phone-forum-posts',
  'mini-phone-shop-state',
  'yubing-phone-cache',
  'yubing-phone-fab-pos',
  'yubing-phone-avatars',
  'yubing-phone-theme',
  'yubing-phone-music',
];

const STORAGE_PREFIXES = [
  'mini-phone-',
  'yubing-phone-',
];

const CACHE_PREFIXES = [
  'mini-phone-',
  'yubing-phone-',
  'xiaoshouji-',
];

export interface ClearMiniPhoneCacheResult {
  localStorageKeys: number;
  cacheStorageEntries: number;
  indexedDBCleared: boolean;
}

function getStorageTargets(): Storage[] {
  const targets: Storage[] = [];

  try {
    targets.push(window.localStorage);
  } catch {
    /* ignore */
  }

  try {
    const parentStorage = window.parent?.localStorage;
    if (parentStorage && !targets.includes(parentStorage)) {
      targets.push(parentStorage);
    }
  } catch {
    /* ignore */
  }

  return targets;
}

function shouldRemoveStorageKey(key: string): boolean {
  return STORAGE_KEYS.includes(key) || STORAGE_PREFIXES.some(prefix => key.startsWith(prefix));
}

function clearLocalStorage(): number {
  let removed = 0;

  for (const storage of getStorageTargets()) {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => !!key && shouldRemoveStorageKey(key));

    for (const key of keys) {
      storage.removeItem(key);
      removed += 1;
    }
  }

  return removed;
}

async function clearCacheStorage(): Promise<number> {
  if (!('caches' in globalThis)) {
    return 0;
  }

  try {
    const names = await caches.keys();
    const ownedNames = names.filter(name => CACHE_PREFIXES.some(prefix => name.startsWith(prefix)));
    await Promise.all(ownedNames.map(name => caches.delete(name)));
    return ownedNames.length;
  } catch (e) {
    console.warn('[小手机] 清除 CacheStorage 失败:', e);
    return 0;
  }
}

async function clearIndexedDB(): Promise<boolean> {
  const chatId = SillyTavern.getCurrentChatId() || 'default';

  try {
    const db = await getLocalDB();
    await db.clearAll();
  } catch (e) {
    console.warn('[小手机] 清空 IndexedDB 表失败，继续尝试删除数据库:', e);
  }

  closeLocalDB();

  try {
    await LocalDB.deleteDatabase(chatId);
    return true;
  } catch (e) {
    console.warn('[小手机] 删除 IndexedDB 数据库失败:', e);
    return false;
  }
}

export async function clearMiniPhoneCache(): Promise<ClearMiniPhoneCacheResult> {
  const localStorageKeys = clearLocalStorage();
  const cacheStorageEntries = await clearCacheStorage();
  const indexedDBCleared = await clearIndexedDB();

  return {
    localStorageKeys,
    cacheStorageEntries,
    indexedDBCleared,
  };
}
