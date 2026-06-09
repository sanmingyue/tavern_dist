import type { NaiGeneratedImage } from './nai';

const DB_NAME = 'nai-image-script-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
export const DEFAULT_IMAGE_TTL_DAYS = 7;

export type NaiCachedImageMeta = {
  id: string;
  mimeType: string;
  filename: string;
  seed: number;
  createdAt: string;
  expiresAt: string;
};

export type NaiCachedImageRecord = NaiCachedImageMeta & {
  blob: Blob;
};

export type SaveCachedImageResult = 'shared' | 'downloaded' | 'cancelled';

let dbPromise: Promise<IDBDatabase> | null = null;

function openCacheDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('expiresAt', 'expiresAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开图片缓存失败。'));
  });

  return dbPromise;
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, transaction: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return openCacheDb().then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let request: IDBRequest<T> | void;

        transaction.oncomplete = () => resolve(request ? request.result : undefined);
        transaction.onerror = () => reject(transaction.error ?? new Error('访问图片缓存失败。'));
        transaction.onabort = () => reject(transaction.error ?? new Error('图片缓存操作已中止。'));

        request = run(store, transaction);
      }),
  );
}

export async function putCachedImage(
  image: NaiGeneratedImage,
  filename: string,
  ttlDays = DEFAULT_IMAGE_TTL_DAYS,
): Promise<NaiCachedImageMeta> {
  const createdAtDate = new Date();
  const expiresAtDate = new Date(createdAtDate.getTime() + ttlDays * 24 * 60 * 60 * 1000);
  const meta: NaiCachedImageMeta = {
    id: makeCacheId(),
    mimeType: image.mimeType,
    filename,
    seed: image.seed,
    createdAt: createdAtDate.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
  };
  const record: NaiCachedImageRecord = {
    ...meta,
    blob: new Blob([image.bytes], { type: image.mimeType }),
  };

  await withStore('readwrite', store => store.put(record));
  return meta;
}

export async function getCachedImage(id: string): Promise<NaiCachedImageRecord | null> {
  const record = (await withStore('readonly', store => store.get(id))) as NaiCachedImageRecord | undefined;
  if (!record) return null;
  if (Date.parse(record.expiresAt) <= Date.now()) {
    await deleteCachedImage(id);
    return null;
  }
  return record;
}

export async function deleteCachedImage(id: string): Promise<void> {
  await withStore('readwrite', store => store.delete(id));
}

export async function clearAllCachedImages(): Promise<void> {
  await withStore('readwrite', store => store.clear());
}

export async function countCachedImages(): Promise<number> {
  return ((await withStore('readonly', store => store.count())) as number | undefined) ?? 0;
}

export async function deleteExpiredCachedImages(now = new Date()): Promise<number> {
  const expiredIds: string[] = [];
  const cutoff = now.toISOString();

  await withStore('readonly', store => {
    const index = store.index('expiresAt');
    const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      expiredIds.push(String(cursor.primaryKey));
      cursor.continue();
    };
    return request as unknown as IDBRequest<undefined>;
  });

  await Promise.all(expiredIds.map(id => deleteCachedImage(id)));
  return expiredIds.length;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('图片转 data URL 失败。'));
    reader.readAsDataURL(blob);
  });
}

export async function saveCachedImage(record: NaiCachedImageRecord): Promise<SaveCachedImageResult> {
  const file = new File([record.blob], record.filename, { type: record.mimeType });
  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const shareData = { files: [file], title: 'NAI 图片' } as ShareData;

  if (navigatorWithShare.share && (!navigatorWithShare.canShare || navigatorWithShare.canShare(shareData))) {
    try {
      await navigatorWithShare.share(shareData);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }

  const url = URL.createObjectURL(record.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = record.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

function makeCacheId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
