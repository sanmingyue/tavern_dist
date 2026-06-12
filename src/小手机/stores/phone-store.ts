import { defineStore } from 'pinia';
import { z } from 'zod';
import { PhoneSchema } from '../schema';
import { getAppFormalName } from '../utils/app-names';
import { formatActionSummary } from '../utils/content-capture';

type PhoneData = z.infer<typeof PhoneSchema>;

const PHONE_DATA_STORAGE_PREFIX = 'mini-phone-data';

/* ─── 浏览器缓存工具 ─── */
function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = window.parent.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeCache(key: string, value: unknown): void {
  try {
    window.parent.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function getPhoneDataCacheKey(): string {
  const chatId = SillyTavern.getCurrentChatId() || 'default';
  return `${PHONE_DATA_STORAGE_PREFIX}-${chatId}`;
}

const UI_STATE_KEY = 'mini-phone-ui-state';
const WALLPAPER_STORAGE_KEY = 'mini-phone-wallpaper';
const AVATAR_STORAGE_KEY = 'yubing-phone-avatars';
const USER_AVATAR_KEY = '__user__';

function readAvatars(): Record<string, string> {
  return readCache<Record<string, string>>(AVATAR_STORAGE_KEY, {});
}

function writeAvatars(avatars: Record<string, string>): void {
  writeCache(AVATAR_STORAGE_KEY, avatars);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/* ─── FAB 位置 ─── */
const FAB_SIZE = 52;
const EDGE_GAP = 12;

function clampFabPosition(x: number, y: number): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  const vh = window.parent.innerHeight;
  return {
    x: _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

function defaultFabPosition(): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  const vh = window.parent.innerHeight;
  return { x: vw - FAB_SIZE - 20, y: vh - FAB_SIZE - 80 };
}

/* ─── UI状态 ─── */
interface UIState {
  fabPosition: { x: number; y: number };
  theme: 'light' | 'dark';
  isOpen: boolean;
  activeApp: string | null;
}

function readUIState(): UIState {
  return readCache<UIState>(UI_STATE_KEY, {
    fabPosition: defaultFabPosition(),
    theme: 'dark',
    isOpen: false,
    activeApp: null,
  });
}

function writeUIState(state: UIState): void {
  writeCache(UI_STATE_KEY, state);
}

function createDefaultPhoneData(): PhoneData {
  return PhoneSchema.parse({
    device: {
      id: `phone_${Date.now()}`,
      name: '小手机',
      owner: SillyTavern.name1 || '用户',
    },
    contacts: {},
    conversations: {},
    apps: {},
  });
}

function createDefaultUIState(): UIState {
  return {
    fabPosition: defaultFabPosition(),
    theme: 'dark',
    isOpen: true,
    activeApp: null,
  };
}

/* ─── Phone Store ─── */
export const usePhoneStore = defineStore('mini-phone', () => {
  /* 核心数据 */
  const phoneData = ref<PhoneData>(createDefaultPhoneData());

  /* UI 状态 */
  const uiState = ref<UIState>(readUIState());
  const wallpaperImage = ref<string | null>(readCache<string | null>(WALLPAPER_STORAGE_KEY, null));
  const avatars = ref<Record<string, string>>(readAvatars());

  /* 当前打开的联系人（消息APP用） */
  const activeContact = ref<string | null>(null);


  /* 导航历史栈 */
  const navStack = ref<string[]>([]);

  /* 首页当前页码（跨APP切换持久化） */
  const homeCurrentPage = ref(0);

  watch(phoneData, () => {
    saveToLocalCache();
  }, { deep: true });

  /* ─── 计算属性 ─── */

  const fabPosition = computed(() => uiState.value.fabPosition);
  const theme = computed(() => uiState.value.theme);
  const isDark = computed(() => uiState.value.theme === 'dark');
  const isOpen = computed(() => uiState.value.isOpen);
  const activeApp = computed(() => uiState.value.activeApp);

  const totalUnread = computed(() => {
    let total = 0;
    for (const conv of Object.values(phoneData.value.conversations)) {
      total += conv.unread;
    }
    return total;
  });

  /* ─── 方法 ─── */

  function updateFabPosition(x: number, y: number): void {
    const clamped = clampFabPosition(x, y);
    uiState.value.fabPosition = clamped;
    persistUIState();
  }

  function toggleTheme(): void {
    uiState.value.theme = uiState.value.theme === 'dark' ? 'light' : 'dark';
    persistUIState();
  }

  function openApp(appId: string): void {
    if (uiState.value.activeApp !== appId) {
      if (uiState.value.activeApp) {
        navStack.value.push(uiState.value.activeApp);
      }
      uiState.value.activeApp = appId;
      uiState.value.isOpen = true;
      persistUIState();
    }
  }

  function closeApp(): void {
    if (navStack.value.length > 0) {
      uiState.value.activeApp = navStack.value.pop() ?? null;
    } else {
      // 返回首页而不是关闭手机
      uiState.value.activeApp = null;
    }
    persistUIState();
  }

  function returnHome(): void {
    navStack.value = [];
    uiState.value.activeApp = null;
    uiState.value.isOpen = true;
    persistUIState();
  }

  function goBack(): void {
    if (navStack.value.length > 0) {
      uiState.value.activeApp = navStack.value.pop() ?? null;
    } else {
      uiState.value.activeApp = null;
    }
    persistUIState();
  }

  function openPhone(): void {
    uiState.value.isOpen = true;
    persistUIState();
  }

  function closePhone(): void {
    uiState.value.isOpen = false;
    persistUIState();
  }

  function persistUIState(): void {
    writeUIState(uiState.value);
  }

  function getAvatar(name: string | null | undefined): string {
    if (!name) return '';
    return avatars.value[name] || '';
  }

  async function setAvatar(name: string, file: File): Promise<void> {
    if (!name) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const compressed = await compressImage(dataUrl, 160, 0.78);
      avatars.value = { ...avatars.value, [name]: compressed };
      writeAvatars(avatars.value);
      toastr.success('头像已保存', '小手机', { timeOut: 1400 });
    } catch (e) {
      console.warn('[小手机] 设置头像失败:', e);
      toastr.error('头像设置失败', '小手机');
    }
  }

  function removeAvatar(name: string): void {
    const next = { ...avatars.value };
    delete next[name];
    avatars.value = next;
    writeAvatars(next);
  }

  function getUserAvatar(): string {
    return getAvatar(USER_AVATAR_KEY);
  }

  async function setUserAvatar(file: File): Promise<void> {
    await setAvatar(USER_AVATAR_KEY, file);
  }

  async function setWallpaper(file: File): Promise<void> {
    try {
      const dataUrl = await fileToDataUrl(file);
      wallpaperImage.value = await compressImage(dataUrl, 1280, 0.82);
      writeCache(WALLPAPER_STORAGE_KEY, wallpaperImage.value);
      toastr.success('背景已保存', '小手机', { timeOut: 1400 });
    } catch (e) {
      console.warn('[小手机] 设置背景失败:', e);
      toastr.error('背景设置失败', '小手机');
    }
  }

  function clearWallpaper(): void {
    wallpaperImage.value = null;
    writeCache(WALLPAPER_STORAGE_KEY, null);
  }

  function resetLocalState(): void {
    phoneData.value = createDefaultPhoneData();
    uiState.value = createDefaultUIState();
    wallpaperImage.value = null;
    avatars.value = {};
    activeContact.value = null;
    navStack.value = [];
    homeCurrentPage.value = 0;
    pendingActions.value = [];
    pendingChatLogs.value = [];
    saveToLocalCache();
  }

  /* ─── 数据持久化 ─── */

  function loadFromLocalCache(): boolean {
    try {
      const raw = readCache<unknown | null>(getPhoneDataCacheKey(), null);
      if (!raw) {
        return false;
      }

      phoneData.value = PhoneSchema.parse(raw);
      console.info('[小手机] 从本地缓存加载手机数据');
      return true;
    } catch (e) {
      console.warn('[小手机] 从本地缓存加载失败:', e);
      return false;
    }
  }

  function saveToLocalCache(): void {
    writeCache(getPhoneDataCacheKey(), phoneData.value);
  }

  async function initialize(): Promise<void> {
    const loaded = loadFromLocalCache();
    if (!loaded) {
      console.info('[小手机] 使用默认数据初始化');
      saveToLocalCache();
    }
  }

  /* ─── 联系人操作 ─── */

  function addContact(name: string): void {
    if (!phoneData.value.contacts[name]) {
      phoneData.value.contacts[name] = {
        name,
        addedAt: Date.now(),
        tags: [],
      };
      phoneData.value.conversations[name] = {
        messages: [],
        lastUpdate: Date.now(),
        unread: 0,
      };
    }
  }

  function removeContact(name: string): void {
    delete phoneData.value.contacts[name];
    delete phoneData.value.conversations[name];
  }

  function selectContact(name: string): void {
    activeContact.value = name;
    if (phoneData.value.conversations[name]) {
      phoneData.value.conversations[name].unread = 0;
    }
  }

  /* ─── 操作记录缓冲（关闭手机时一次性写入用户楼层） ─── */
  const pendingActions = ref<Array<{ appId: string; summary: string }>>([]);

  /* ─── 聊天记录缓冲（关闭手机时拼接到正文楼层） ─── */
  const pendingChatLogs = ref<Array<{
    id?: string;
    contact: string;
    from: string;
    to?: string;
    content: string;
    timestamp: number;
  }>>([]);

  /* ─── 操作记录（只缓冲，不实时写入输入框） ─── */

  function reportAction(payload: { appId: string; appName?: string; action: string; summary: string; data?: Record<string, unknown> }): void {
    const formalName = getAppFormalName(payload.appId);

    // 优先使用详细的 summary，其次使用简短的 action
    const detail = payload.summary || payload.action;

    // 将操作加入缓冲（关闭手机时由 App.vue 的 watch 统一写入用户楼层）
    pendingActions.value.push({
      appId: payload.appId,
      summary: detail,
    });

    console.info(`[小手机] 操作记录: 在「${formalName}」${detail}`);
  }

  /** 记录一条聊天消息到缓冲（关闭手机时写入正文） */
  function logChatMessage(contact: string, from: string, content: string, id?: string, to?: string): void {
    pendingChatLogs.value.push({
      id,
      contact,
      from,
      to,
      content,
      timestamp: Date.now(),
    });
  }

  function removeLatestMatching<T>(items: T[], predicate: (item: T) => boolean): boolean {
    for (let i = items.length - 1; i >= 0; i--) {
      if (predicate(items[i])) {
        items.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function removePendingChatMessages(
    contactName: string,
    messages: Array<{ id?: string; from: string; to: string; content: string }>,
  ): void {
    for (const message of messages) {
      removeLatestMatching(pendingChatLogs.value, log => {
        if (message.id && log.id === message.id) return true;
        return log.contact === contactName
          && log.from === message.from
          && (!log.to || log.to === message.to)
          && log.content === message.content;
      });

      const owner = phoneData.value.device.owner || SillyTavern.name1 || '用户';
      if (message.from === owner && message.to === contactName) {
        const summary = `给「${contactName}」发送了消息：${message.content.slice(0, 50)}`;
        removeLatestMatching(
          pendingActions.value,
          action => action.appId === 'messages' && action.summary === summary,
        );
      }
    }
  }

  /** 清空待写入的操作缓冲 */
  function clearPendingActions(): void {
    pendingActions.value = [];
    pendingChatLogs.value = [];
  }

  /** 获取格式化的操作总结文本 */
  function getActionSummaryText(): string {
    return formatActionSummary(pendingActions.value);
  }

  /** 获取按联系人分组的聊天记录文本 */
  function getPendingChatLogsGrouped(): Record<string, Array<{ from: string; content: string }>> {
    const groups: Record<string, Array<{ from: string; content: string }>> = {};
    for (const log of pendingChatLogs.value) {
      if (!groups[log.contact]) groups[log.contact] = [];
      groups[log.contact].push({ from: log.from, content: log.content });
    }
    return groups;
  }

  /** 格式化聊天记录为文本块 */
  function formatChatLogsText(): string {
    const groups = getPendingChatLogsGrouped();
    const blocks: string[] = [];
    for (const [contact, msgs] of Object.entries(groups)) {
      const lines = msgs.map(m => `${m.from}：${m.content}`).join('\n');
      blocks.push(`【闪讯聊天记录 · ${contact}】\n${lines}`);
    }
    return blocks.join('\n\n');
  }

  /* ─── 消息操作 ─── */

  function sendMessage(to: string, content: string, from: string = phoneData.value.device.owner, shouldReport = true): void {
    if (!phoneData.value.conversations[to]) {
      phoneData.value.conversations[to] = {
        messages: [],
        lastUpdate: Date.now(),
        unread: 0,
      };
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      from,
      to,
      content,
      timestamp: Date.now(),
      type: 'text' as const,
      read: true,
    };

    phoneData.value.conversations[to].messages.push(message);
    phoneData.value.conversations[to].lastUpdate = Date.now();

    // 记录完整聊天消息到缓冲
    logChatMessage(to, from, content, message.id, to);

    if (shouldReport) {
      reportAction({
        appId: 'messages',
        action: `给${to}发送了消息：${content.slice(0, 30)}`,
        summary: `给「${to}」发送了消息：${content.slice(0, 50)}`,
      });
    }
  }

  /* ─── 消息扫描：从 IndexedDB 读取新增聊天记录并更新未读数 ─── */
  async function scanNewMessages(): Promise<void> {
    try {
      const { getLocalDB } = await import('../utils/local-db');
      const db = await getLocalDB();
      const records = await db.getAllChatRecords();

      for (const record of records) {
        const unreadCount = record.messages.filter(m => !m.read && m.from !== phoneData.value.device.owner).length;
        if (unreadCount > 0) {
          // 确保会话存在
          if (!phoneData.value.conversations[record.contactName]) {
            phoneData.value.conversations[record.contactName] = {
              messages: [],
              lastUpdate: record.lastUpdate,
              unread: 0,
            };
          }
          phoneData.value.conversations[record.contactName].unread = unreadCount;
          phoneData.value.conversations[record.contactName].lastUpdate = record.lastUpdate;
        }
      }
    } catch {
      // 静默处理
    }
  }

  return {
    phoneData,
    uiState,
    wallpaperImage,
    avatars,
    activeContact,
    navStack,
    homeCurrentPage,
    fabPosition,
    theme,
    isDark,
    isOpen,
    activeApp,
    totalUnread,
    updateFabPosition,
    toggleTheme,
    openApp,
    closeApp,
    returnHome,
    goBack,
    openPhone,
    closePhone,
    getAvatar,
    setAvatar,
    removeAvatar,
    getUserAvatar,
    setUserAvatar,
    setWallpaper,
    clearWallpaper,
    resetLocalState,
    loadFromLocalCache,
    saveToLocalCache,
    initialize,
    addContact,
    removeContact,
    selectContact,
    pendingActions,
    pendingChatLogs,
    reportAction,
    logChatMessage,
    removePendingChatMessages,
    clearPendingActions,
    getActionSummaryText,
    getPendingChatLogsGrouped,
    formatChatLogsText,
    sendMessage,
    scanNewMessages,
  };
});
