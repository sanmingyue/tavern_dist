// ─── 调试模式 (全局) ───
export const DEBUG_MODE = false;

// ─── 常量 ───
export const STORAGE_KEY = 'workshop-fab-pos';
export const PANEL_SIZE_KEY = 'workshop-panel-size';
export const AUTH_TOKEN_KEY = 'workshop-auth-token';
export const EDGE_GAP = 12;
export const FAB_SIZE = 44;
export const DRAG_THRESHOLD = 3;
export const DEFAULT_PANEL_W = 1060;
export const DEFAULT_PANEL_H = 795; // 4:3 = 1060 * 3/4
export const MIN_PANEL_W = 860;     // 确保 6 个类型 tab 全部可见
export const MIN_PANEL_H = 645;     // 4:3 = 860 * 3/4

// ─── API 地址 ───
export const API_BASE = 'https://sanmingyue.zeabur.app';

// ─── 作品类型 ───
export const WORK_TYPES = [
  { key: 'regex', label: '美化正则' },
  { key: 'persona', label: '人设/OC' },
  { key: 'character', label: '角色卡' },
  { key: 'card_addon', label: '角色卡二创' },
  { key: 'worldbook', label: '共享世界书' },
  { key: 'collection', label: '作者合集' },
] as const;

export type WorkType = (typeof WORK_TYPES)[number]['key'];

/** 角色卡二创的子类型 */
export type AddonSubtype = 'worldbook' | 'regex' | 'persona';

export const ADDON_SUBTYPES = [
  { key: 'worldbook' as AddonSubtype, label: '世界书' },
  { key: 'regex' as AddonSubtype, label: '正则' },
  { key: 'persona' as AddonSubtype, label: '人设/OC' },
] as const;

/** 需要通过文件上传资源的类型（非纯文本内容） */
export const FILE_UPLOAD_TYPES: readonly string[] = ['regex', 'worldbook', 'character'];

/** 根据 file_type 字段解析 addon_subtype */
export function parseAddonSubtype(fileType: string): AddonSubtype | null {
  const match = fileType.match(/^(?:json|png):(.+)$/);
  if (match && ['worldbook', 'regex', 'persona'].includes(match[1])) {
    return match[1] as AddonSubtype;
  }
  return null;
}

/** 编码 addon_subtype 到 file_type 字段 */
export function encodeFileTypeWithSubtype(baseFileType: string, addonSubtype: string): string {
  return `${baseFileType}:${addonSubtype}`;
}

export function getTypeLabel(type: string): string {
  return WORK_TYPES.find(t => t.key === type)?.label ?? type;
}

// ─── 接口类型 ───
export interface WorkAuthor {
  username: string;
  display_name: string;
  avatar: string;
  discord_id?: string;
}

export interface WorkItem {
  id: number;
  title: string;
  description: string;
  type: WorkType;
  tags: string[];
  char_name?: string;
  cover_url: string | null;
  card_link: string;
  file_type: string;
  author: WorkAuthor;
  download_count: number;
  like_count: number;
  favorite_count?: number;
  comment_count?: number;
  liked?: boolean;
  favorited?: boolean;
  created_at: string;
}

export interface WorkDetail extends WorkItem {
  content: string;
  status: string;
  visibility?: string;
  hidden_reason?: string;
  author_delete_reason?: string;
  reject_reason: string;
  pending_update?: boolean;
  pending_version_no?: number | null;
  updated_at: string;
  children?: CollectionChild[]; // 仅 collection 类型有效
}

/** 合集内单个子作品 */
export interface CollectionChild {
  id: number;
  title: string;
  type: WorkType;
  description: string;
  tags: string[];
  char_name?: string;
  cover_url: string | null;
  card_link: string;
  file_type: string;
  content: string;
  like_count: number;
  favorite_count?: number;
  comment_count?: number;
  liked?: boolean;
  favorited?: boolean;
  download_count: number;
  author: WorkAuthor;
}

export interface DownloadResult {
  id: number;
  title: string;
  char_name?: string;
  type: string;
  content: string;
  file_url?: string;
  file_type: string;
  card_link: string;
  author_name: string;
}

export interface MyWork {
  id: number;
  title: string;
  description: string;
  type: WorkType;
  tags: string[];
  char_name?: string;
  cover_url: string | null;
  card_link: string;
  file_type: string;
  status: string;
  visibility?: string;
  hidden_reason?: string;
  author_delete_reason?: string;
  reject_reason: string;
  pending_update?: boolean;
  pending_version_id?: number | null;
  pending_version_no?: number | null;
  download_count: number;
  like_count: number;
  favorite_count?: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkComment {
  id: number;
  work_id: number;
  content: string;
  status: string;
  hidden_reason?: string;
  hidden_by_role?: string;
  author: {
    id: number;
    username: string;
    display_name: string;
    avatar: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MyDownload {
  id: number;
  work_id: number;
  title: string;
  char_name?: string;
  description: string;
  type: WorkType;
  tags: string[];
  cover_url: string | null;
  card_link: string;
  file_type: string;
  status: string;
  visibility: string;
  download_count: number;
  like_count: number;
  favorite_count?: number;
  comment_count?: number;
  fingerprint_token?: string;
  downloaded_at: string;
  author: Partial<WorkAuthor>;
}

export interface MyFavorite {
  id: number;
  work_id: number;
  title: string;
  char_name?: string;
  description: string;
  type: WorkType;
  tags: string[];
  cover_url: string | null;
  card_link: string;
  file_type: string;
  status: string;
  visibility: string;
  download_count: number;
  like_count: number;
  favorite_count?: number;
  comment_count?: number;
  favorited_at: string;
  author: Partial<WorkAuthor>;
}

export interface UserInfo {
  id: number;
  discord_id: string;
  username: string;
  display_name: string;
  avatar: string;
  role: string;
  is_admin: boolean;
  created_at: string;
}

export interface WorkListResponse {
  works: WorkItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── 面板尺寸持久化 ───
const hostWindow = window.parent;

export function readPanelSize(): { w: number; h: number } {
  try {
    const raw = hostWindow.localStorage.getItem(PANEL_SIZE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const w = Math.max(MIN_PANEL_W, saved.w || DEFAULT_PANEL_W);
      return { w, h: Math.round(w * 3 / 4) }; // 强制 4:3
    }
  } catch { /* ignore */ }
  return { w: DEFAULT_PANEL_W, h: DEFAULT_PANEL_H };
}

export function savePanelSize(size: { w: number; h: number }): void {
  try {
    hostWindow.localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(size));
  } catch { /* ignore */ }
}

// ─── Token 管理 ───
export function getAuthToken(): string | null {
  try {
    return hostWindow.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch { return null; }
}

export function setAuthToken(token: string): void {
  try {
    hostWindow.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch { /* ignore */ }
}

export function clearAuthToken(): void {
  try {
    hostWindow.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch { /* ignore */ }
}
