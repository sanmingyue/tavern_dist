// ─── 常量 ───
export const STORAGE_KEY = 'workshop-fab-pos';
export const PANEL_SIZE_KEY = 'workshop-panel-size';
export const AUTH_TOKEN_KEY = 'workshop-auth-token';
export const EDGE_GAP = 12;
export const FAB_SIZE = 44;
export const DRAG_THRESHOLD = 3;
export const DEFAULT_PANEL_W = 1060;
export const DEFAULT_PANEL_H = 820;
export const MIN_PANEL_W = 420;
export const MIN_PANEL_H = 320;

// ─── API 地址 ───
export const API_BASE = 'https://sanmingyue.zeabur.app';

// ─── 作品类型 ───
export const WORK_TYPES = [
  { key: 'regex', label: '美化正则' },
  { key: 'persona', label: '人设/OC' },
  { key: 'card_addon', label: '角色卡配套' },
  { key: 'worldbook', label: '共享世界书' },
  { key: 'collection', label: '作者合集' },
] as const;

export type WorkType = (typeof WORK_TYPES)[number]['key'];

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
  cover_url: string | null;
  card_link: string;
  file_type: string;
  author: WorkAuthor;
  download_count: number;
  like_count: number;
  liked?: boolean;
  created_at: string;
}

export interface WorkDetail extends WorkItem {
  content: string;
  status: string;
  reject_reason: string;
  updated_at: string;
}

export interface DownloadResult {
  id: number;
  title: string;
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
  cover_url: string | null;
  card_link: string;
  file_type: string;
  status: string;
  reject_reason: string;
  download_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
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
    if (raw) return JSON.parse(raw);
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
