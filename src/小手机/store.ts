import { parsePhoneMessages, extractContacts, getConversation, formatUserReply } from './parser';
import type { PhoneMessage } from './parser';

const CACHE_KEY = 'yubing-phone-cache';
const FAB_STORAGE_KEY = 'yubing-phone-fab-pos';
const AVATAR_STORAGE_KEY = 'yubing-phone-avatars';
const THEME_STORAGE_KEY = 'yubing-phone-theme';
const EDGE_GAP = 12;
const FAB_SIZE = 52;
const DEFAULT_AVATAR = 'https://i.postimg.cc/7LXQ8P16/Comfy-UI-temp-pivbm-00011.webp';

/* ─── 通讯录联系人结构 ─── */

export interface Contact {
  name: string;
  /** 用于显示头像的首字符 */
  avatarChar: string;
  /** 添加时间 */
  addedAt: number;
}

/* ─── 主题类型 ─── */
export type ThemeMode = 'light' | 'dark';

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

function writeCache(key: string, value: any): void {
  try {
    window.parent.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/* ─── FAB 位置 ─── */

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

/* ─── 本地缓存数据结构 ─── */

interface PhoneCacheData {
  contacts: Contact[];
  chatRecords: Record<string, PhoneMessage[]>;
  lastSyncedMessageId: number;
}

/* ─── 头像工具 ─── */

function readAvatars(): Record<string, string> {
  return readCache<Record<string, string>>(AVATAR_STORAGE_KEY, {});
}

function writeAvatars(avatars: Record<string, string>): void {
  writeCache(AVATAR_STORAGE_KEY, avatars);
}

/** 将图片文件转换为 base64 data URL */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Pinia Store ─── */

export const usePhoneStore = defineStore('yubing-phone', () => {
  /* 通讯录联系人列表 */
  const contacts = ref<Contact[]>([]);

  /* 所有聊天记录，按联系人名索引 */
  const chatRecords = ref<Record<string, PhoneMessage[]>>({});

  /* 当前用户名 */
  const userName = ref('{{user}}');

  /* 当前选中的联系人 */
  const activeContact = ref<string | null>(null);

  /* 是否打开手机面板 */
  const isOpen = ref(false);

  /* 是否显示添加好友弹窗 */
  const showAddContact = ref(false);

  /* 未读消息计数（按联系人） */
  const unreadCounts = ref<Record<string, number>>({});

  /* 上次同步的最大楼层号 */
  const lastSyncedMessageId = ref(-1);

  /* 头像数据（name -> base64 dataURL） */
  const avatars = ref<Record<string, string>>(readAvatars());

  /* 主题模式 */
  const theme = ref<ThemeMode>(readCache<ThemeMode>(THEME_STORAGE_KEY, 'dark'));

  /* FAB 位置 */
  const fabPosition = ref(clampFabPosition(
    ...((() => {
      const saved = readCache<{ x: number; y: number } | null>(FAB_STORAGE_KEY, null);
      const pos = saved ?? defaultFabPosition();
      return [pos.x, pos.y] as [number, number];
    })()),
  ));

  /* ─── 计算属性 ─── */

  const totalUnread = computed(() =>
    Object.values(unreadCounts.value).reduce((sum, n) => sum + n, 0),
  );

  const resolvedUserName = computed(() => {
    try {
      return substitudeMacros(userName.value);
    } catch {
      return userName.value;
    }
  });

  /** 联系人名称列表（便于模板使用） */
  const contactNames = computed(() => contacts.value.map(c => c.name));

  const currentConversation = computed(() => {
    if (!activeContact.value) return [];
    return chatRecords.value[activeContact.value] || [];
  });

  /* 每个联系人的最新消息预览 */
  const contactPreviews = computed(() => {
    const previews: Record<string, { content: string }> = {};
    for (const contact of contacts.value) {
      const messages = chatRecords.value[contact.name] || [];
      const lastMsg = _.last(messages);
      if (lastMsg) {
        previews[contact.name] = { content: lastMsg.content };
      } else {
        previews[contact.name] = { content: '' };
      }
    }
    return previews;
  });

  const isDark = computed(() => theme.value === 'dark');

  /* ─── 方法 ─── */

  function updateFabPosition(x: number, y: number) {
    const clamped = clampFabPosition(x, y);
    fabPosition.value = clamped;
    writeCache(FAB_STORAGE_KEY, clamped);
  }

  function selectContact(name: string) {
    activeContact.value = name;
    unreadCounts.value[name] = 0;
  }

  function goBack() {
    activeContact.value = null;
  }

  /* ─── 主题切换 ─── */

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    writeCache(THEME_STORAGE_KEY, theme.value);
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode;
    writeCache(THEME_STORAGE_KEY, mode);
  }

  /* ─── 头像管理 ─── */

  function getAvatar(name: string): string {
    return avatars.value[name] || DEFAULT_AVATAR;
  }

  async function setAvatar(name: string, file: File): Promise<void> {
    try {
      // 压缩头像：限制在 128x128，减少 localStorage 占用
      const dataUrl = await fileToBase64(file);
      const compressed = await compressAvatar(dataUrl, 128);
      avatars.value[name] = compressed;
      writeAvatars(avatars.value);
      toastr.success(`已设置 ${name} 的头像`, '小手机', { timeOut: 1500 });
    } catch (e) {
      console.warn('[小手机] 设置头像失败:', e);
      toastr.error('头像设置失败', '小手机');
    }
  }

  function removeAvatar(name: string): void {
    delete avatars.value[name];
    writeAvatars(avatars.value);
  }

  /** 设置用户自己的头像 */
  async function setUserAvatar(file: File): Promise<void> {
    await setAvatar('__user__', file);
  }

  function getUserAvatar(): string {
    return avatars.value['__user__'] || DEFAULT_AVATAR;
  }

  /* ─── 通讯录管理 ─── */

  /**
   * 添加联系人到通讯录
   */
  async function addContact(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (trimmed === resolvedUserName.value) return false;

    /* 检查是否已存在 */
    if (contacts.value.some(c => c.name === trimmed)) {
      toastr.warning(`${trimmed} 已在通讯录中`, '小手机');
      return false;
    }

    const newContact: Contact = {
      name: trimmed,
      avatarChar: trimmed.charAt(0),
      addedAt: Date.now(),
    };

    contacts.value.push(newContact);
    chatRecords.value[trimmed] = chatRecords.value[trimmed] || [];

    toastr.success(`已添加 ${trimmed}`, '小手机', { timeOut: 1500 });
    console.info('[小手机] 添加联系人:', trimmed);
    saveToCacheStorage();
    return true;
  }

  /**
   * 从通讯录删除联系人
   */
  async function removeContact(name: string): Promise<void> {
    const idx = contacts.value.findIndex(c => c.name === name);
    if (idx === -1) return;

    contacts.value.splice(idx, 1);
    delete chatRecords.value[name];
    delete unreadCounts.value[name];

    if (activeContact.value === name) {
      activeContact.value = null;
    }

    /* 同时删除头像 */
    removeAvatar(name);

    toastr.info(`已删除 ${name}`, '小手机', { timeOut: 1500 });
    saveToCacheStorage();
  }

  /**
   * 自动将消息中发现的新联系人加入通讯录
   */
  function autoAddContacts(newNames: string[]) {
    let hasNew = false;
    for (const name of newNames) {
      if (name === resolvedUserName.value) continue;
      if (contacts.value.some(c => c.name === name)) continue;

      contacts.value.push({
        name,
        avatarChar: name.charAt(0),
        addedAt: Date.now(),
      });
      chatRecords.value[name] = chatRecords.value[name] || [];
      hasNew = true;
      console.info('[小手机] 自动添加联系人:', name);
    }
    return hasNew;
  }

  /* ─── 消息扫描 ─── */

  /**
   * 全量扫描所有聊天楼层
   */
  function scanAllMessages() {
    try {
      const lastId = getLastMessageId();
      const messages = getChatMessages(`0-${lastId}`, { role: 'all' });
      const allParsed: PhoneMessage[] = [];

      for (const msg of messages) {
        const parsed = parsePhoneMessages(msg.message, msg.message_id, msg.role);
        allParsed.push(...parsed);
      }

      /* 提取联系人并自动添加 */
      const foundNames = extractContacts(allParsed, resolvedUserName.value);
      autoAddContacts(foundNames);

      /* 按联系人分组聊天记录 */
      const newRecords: Record<string, PhoneMessage[]> = {};
      for (const contact of contacts.value) {
        newRecords[contact.name] = getConversation(allParsed, contact.name, resolvedUserName.value);
      }
      chatRecords.value = newRecords;

      lastSyncedMessageId.value = lastId;
      saveToCacheStorage();
    } catch (e) {
      console.warn('[小手机] 扫描消息失败:', e);
    }
  }

  /**
   * 增量扫描新消息
   */
  function scanNewMessages() {
    try {
      const lastId = getLastMessageId();
      if (lastId <= lastSyncedMessageId.value) return;

      const startId = lastSyncedMessageId.value + 1;
      const messages = getChatMessages(`${startId}-${lastId}`, { role: 'all' });
      let hasNew = false;

      /* 收集所有已有消息的 messageId 集合，用于去重 */
      const existingMessageIds = new Set<number>();
      for (const msgs of Object.values(chatRecords.value)) {
        for (const m of msgs) {
          existingMessageIds.add(m.messageId);
        }
      }

      for (const msg of messages) {
        /* 跳过已经处理过的楼层（防止热重载时重复追加） */
        if (existingMessageIds.has(msg.message_id)) continue;

        const parsed = parsePhoneMessages(msg.message, msg.message_id, msg.role);
        if (parsed.length === 0) continue;

        hasNew = true;

        /* 自动添加新联系人 */
        const newNames = extractContacts(parsed, resolvedUserName.value);
        autoAddContacts(newNames);

        /* 分发消息到对应联系人的聊天记录 */
        for (const entry of parsed) {
          const contactName = entry.from === resolvedUserName.value
            ? findRecipient(parsed, entry)
            : entry.from;

          if (!contactName) continue;

          if (!chatRecords.value[contactName]) {
            chatRecords.value[contactName] = [];
          }
          chatRecords.value[contactName].push(entry);

          /* 未读计数 */
          if (entry.from !== resolvedUserName.value && activeContact.value !== contactName) {
            unreadCounts.value[contactName] = (unreadCounts.value[contactName] || 0) + 1;
          }
        }
      }

      if (hasNew) {
        saveToCacheStorage();
      }

      lastSyncedMessageId.value = lastId;
    } catch (e) {
      console.warn('[小手机] 增量扫描失败:', e);
    }
  }

  /**
   * 对于用户自己发的消息，判断接收者是谁
   * 简单策略：取同一 iphone 块中的非用户发送者
   */
  function findRecipient(blockMessages: PhoneMessage[], selfMsg: PhoneMessage): string | null {
    const others = blockMessages.filter(m => m.from !== resolvedUserName.value);
    if (others.length > 0) return others[0].from;

    /* 如果整个块都是用户发的，找当前打开的联系人 */
    if (activeContact.value) return activeContact.value;

    /* 退而找通讯录里最后一个联系人 */
    const last = _.last(contacts.value);
    return last?.name ?? null;
  }

  /* ─── 用户回复 ─── */

  function sendReply(content: string) {
    if (!content.trim()) return;

    const formatted = formatUserReply(resolvedUserName.value, content.trim());

    const $textarea = $('#send_textarea', window.parent.document);
    if ($textarea.length > 0) {
      const currentVal = ($textarea.val() as string) || '';
      const separator = currentVal.trim() ? '\n' : '';
      $textarea.val(currentVal + separator + formatted);
      $textarea.trigger('input');
      toastr.success('已添加到输入框', '小手机', { timeOut: 1500 });
    } else {
      console.warn('[小手机] 未找到酒馆输入框');
      toastr.error('未找到输入框', '小手机');
    }
  }

  /* ─── 本地缓存 ─── */

  function saveToCacheStorage() {
    const data: PhoneCacheData = {
      contacts: contacts.value,
      chatRecords: chatRecords.value,
      lastSyncedMessageId: lastSyncedMessageId.value,
    };
    writeCache(CACHE_KEY, data);
  }

  function loadFromCacheStorage(): boolean {
    const data = readCache<PhoneCacheData | null>(CACHE_KEY, null);
    if (data && data.contacts && Array.isArray(data.contacts)) {
      contacts.value = data.contacts;
      chatRecords.value = data.chatRecords || {};
      lastSyncedMessageId.value = data.lastSyncedMessageId ?? -1;
      console.info('[小手机] 从浏览器缓存加载了数据');
      return true;
    }
    return false;
  }

  /* ─── 初始化 ─── */

  async function initialize() {
    loadFromCacheStorage();

    /* 判断是否需要全量扫描：
     * 1. 从未同步过（lastSyncedMessageId < 0）
     * 2. 缓存中联系人存在但所有聊天记录都为空（可能是之前扫描失败）
     */
    const hasAnyChatRecords = Object.values(chatRecords.value).some(msgs => msgs.length > 0);
    const needsFullScan = lastSyncedMessageId.value < 0
      || (contacts.value.length > 0 && !hasAnyChatRecords);

    if (needsFullScan) {
      scanAllMessages();
    } else {
      scanNewMessages();
    }
  }

  return {
    contacts,
    contactNames,
    chatRecords,
    userName,
    activeContact,
    isOpen,
    showAddContact,
    unreadCounts,
    totalUnread,
    currentConversation,
    resolvedUserName,
    contactPreviews,
    fabPosition,
    avatars,
    theme,
    isDark,
    updateFabPosition,
    selectContact,
    goBack,
    toggleTheme,
    setTheme,
    getAvatar,
    setAvatar,
    removeAvatar,
    setUserAvatar,
    getUserAvatar,
    addContact,
    removeContact,
    sendReply,
    scanAllMessages,
    scanNewMessages,
    initialize,
  };
});

/* ─── 图片压缩工具 ─── */

function compressAvatar(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
