import { klona } from 'klona';
import { getCapturedContentMessageIds, getHiddenFloorsFromChat, type HiddenFloor } from '../core/floorVisibility';
import type { DreamtalkData } from '../core/dreamtalk';
import type { NsfwCharacterMemory, NsfwDreamtalkData, NsfwDynamicProfile } from '../core/nsfwIsolation';
import type { PlotFateState } from '../core/plotFate';
import type { EmotionAccumulationState } from '../core/emotionAccumulation';
import type { EcosystemState } from '../core/ecosystem';
import { parseSummaryOutput, buildMemorySectionText, type ParsedSummary } from '../core/summary';
import { extractContentFromMessage } from '../utils/messageParser';

// ========== 数据类型定义 ==========

export interface UserPersona {
  id: string;
  name: string;
  rawInput: string;
  analyzedProfile: string;
  lastAnalyzedAt: string;
}

export interface CapturedContent {
  messageId: number;
  content: string;
  capturedAt: string;
  swipeCount: number;
}

export interface CharacterMemory {
  characterName: string;
  aliases: string[];
  attitude: 'like' | 'dislike' | 'neutral';
  coreMemories: string[];    // 核心记忆（永久，累积，无上限）
  recentMemories: string[];  // 近期记忆（本轮新生成的，每次总结替换）
  keywords: string[];
  /** AI 原始编号顺序（展示用，非持久），如 [{text:"...", isCore:true}, ...] */
  orderedNewMemories?: Array<{ text: string; isCore: boolean }>;
}

export interface TimelineEvent {
  time: string;
  event: string;
  details: string;
  actions: string;
}

export interface CharacterEntry {
  name: string;
  aliases: string[];
  identity: string;
  relationship: string;
  status: string;
}

export interface DynamicProfile {
  characterName: string;
  dynamicContent: string;
  lastUpdatedAt: string;
  basedOnSummaryVersion: number;
}

export interface GrandSummary {
  version: number;
  generatedAt: string;
  upToMessageId?: number;
  coveredMessageIds?: number[];
  characterMemories: CharacterMemory[];
  timeline: TimelineEvent[];
  characterTable: CharacterEntry[];
  rawText: string;
}

export interface UserInputRecord {
  messageId: number;
  userInput: string;
  aiResponse: string;
  rolledResponses: string[];
}

// ========== 存储拆分：聊天变量（每个聊天独立） ==========

export interface ChatData {
  chatId: string;
  capturedContents: CapturedContent[];
  userInputRecords: UserInputRecord[];
  summaries: GrandSummary[];
  summaryHistory: GrandSummary[];
  dynamicProfiles: DynamicProfile[];
  dreamtalk: DreamtalkData | null;
  dreamtalkHistory: DreamtalkData[];
  dreamtalkUndoHistory: DreamtalkData[];
  lastSummaryAtMessageId: number;
  // NSFW隔离层
  nsfwMemories: NsfwCharacterMemory[];
  nsfwDreamtalk: NsfwDreamtalkData | null;
  nsfwDynamicProfiles: NsfwDynamicProfile[];
  // 倒果为因
  plotFate: PlotFateState | null;
  // 情绪积累
  emotionState: EmotionAccumulationState | null;
  // 后台行动推演
  ecosystemState: EcosystemState | null;
  ecosystemManualChars: string;  // 手动指定推演角色，逗号分隔（跟随聊天保存）
  ecosystemCollapsed: boolean;   // 后台推演面板是否收起
  // 剧情日期格式记忆（首次总结时从AI输出中提取，后续总结传给AI参考）
  storyDateFormat: string;
  // 已忽略角色（用户手动删除的路人NPC，后续总结不再生成）
  ignoredCharacters: string[];
  // 忽略角色的数据备份（恢复时还原，避免角色消失）
  _ignoredBackup: Array<{
    name: string;
    memories: CharacterMemory[];
    profile: DynamicProfile | null;
  }>;
  // 是否已迁移为增量存储（false=旧格式全量快照，true=增量delta）
  _summaryDeltaFormat: boolean;
}

// ========== 存储拆分：脚本变量（全局共享） ==========

export interface ScriptSettings {
  personas: UserPersona[];
  activePersonaId: string;
  settings: {
    personaEnabled: boolean;
    dynamicProfileEnabled: boolean;
    captureEnabled: boolean;
    memoryActivationEnabled: boolean;
    dreamtalkEnabled: boolean;
    summaryInjectionEnabled: boolean;
    plotFateEnabled: boolean;
    emotionEnabled: boolean;
    emotionInterval: number;
    summaryInterval: number;
    preserveRecentFloors: number;
    memoryMinPerChar: number;
    memoryMaxPerChar: number;
    recentMemoryVersions: number;
    // 后台行动推演
    ecosystemEnabled: boolean;
    ecosystemInterval: number;
    // 大总结引导弹窗
    summaryGuidanceEnabled: boolean;
    // 梦呓
    preferredPlayStyle: string;  // ''=自动判定, '不抢话'|'抢话'|'混合'
    // 界面
    fontSize: number;
    // 自定义API
    apiMode: string;
    customApiUrl: string;
    customApiKey: string;
    customApiModel: string;
  };
}

// ========== Zod Schema ==========

const ChatDataSchema = z
  .object({
    chatId: z.string().prefault(''),
    capturedContents: z.array(z.any()).prefault([]),
    userInputRecords: z.array(z.any()).prefault([]),
    summaries: z.array(z.any()).prefault([]),
    summaryHistory: z.array(z.any()).prefault([]),
    dynamicProfiles: z.array(z.any()).prefault([]),
    dreamtalk: z.any().prefault(null),
    dreamtalkHistory: z.array(z.any()).prefault([]),
    dreamtalkUndoHistory: z.array(z.any()).prefault([]),
    lastSummaryAtMessageId: z.coerce.number().prefault(-1),
    // NSFW隔离层
    nsfwMemories: z.array(z.any()).prefault([]),
    nsfwDreamtalk: z.any().prefault(null),
    nsfwDynamicProfiles: z.array(z.any()).prefault([]),
    // 倒果为因
    plotFate: z.any().prefault(null),
    // 情绪积累
    emotionState: z.any().prefault(null),
    // 后台行动推演
    ecosystemState: z.any().prefault(null),
    ecosystemManualChars: z.string().prefault(''),
    ecosystemCollapsed: z.boolean().prefault(false),
    // 剧情日期格式
    storyDateFormat: z.string().prefault(''),
    // 已忽略角色
    ignoredCharacters: z.array(z.string()).prefault([]),
    // 忽略角色数据备份
    _ignoredBackup: z.array(z.object({
      name: z.string(),
      memories: z.array(z.any()),
      profile: z.any().nullable(),
    })).prefault([]),
    // 增量存储标记
    _summaryDeltaFormat: z.boolean().prefault(false),
  })
  .prefault({});

const ScriptSettingsSchema = z
  .object({
    personas: z.array(z.object({
      id: z.string().prefault(''),
      name: z.string().prefault(''),
      rawInput: z.string().prefault(''),
      analyzedProfile: z.string().prefault(''),
      lastAnalyzedAt: z.string().prefault(''),
    })).prefault([]),
    activePersonaId: z.string().prefault(''),
    settings: z
      .object({
        personaEnabled: z.boolean().prefault(true),
        dynamicProfileEnabled: z.boolean().prefault(true),
        captureEnabled: z.boolean().prefault(true),
        memoryActivationEnabled: z.boolean().prefault(true),
        dreamtalkEnabled: z.boolean().prefault(true),
        summaryInjectionEnabled: z.boolean().prefault(true),
        plotFateEnabled: z.boolean().prefault(true),
        emotionEnabled: z.boolean().prefault(true),
        emotionInterval: z.coerce.number().prefault(6),
        summaryInterval: z.coerce.number().prefault(10),
        preserveRecentFloors: z.coerce.number().prefault(4),
        memoryMinPerChar: z.coerce.number().prefault(4),
        memoryMaxPerChar: z.coerce.number().prefault(8),
        recentMemoryVersions: z.coerce.number().prefault(3),
        // 后台行动推演
        ecosystemEnabled: z.boolean().prefault(false),
        ecosystemInterval: z.coerce.number().prefault(3),
        // 大总结引导弹窗
        summaryGuidanceEnabled: z.boolean().prefault(true),
        // 梦呓
        preferredPlayStyle: z.string().prefault(''),
        // 界面
        fontSize: z.coerce.number().prefault(1),
        // 自定义API
        apiMode: z.string().prefault('default'),
        customApiUrl: z.string().prefault(''),
        customApiKey: z.string().prefault(''),
        customApiModel: z.string().prefault(''),
      })
      .prefault({}),
  })
  .prefault({});

// ========== Store ==========

/**
 * 旧格式迁移：旧版直接存储扁平 ChatData 对象（无 chatId 字段），
 * 返回 ChatData 对象供调用方以当前 chatId 为 key 存入 Record。
 */
function migrateOldFormatToChatData(oldData: Record<string, unknown>): ChatData {
  console.info('[智脑] 检测到旧格式聊天数据，正在迁移...');
  return ChatDataSchema.parse(oldData);
}

const CHAT_DATA_KEY = 'mqzn_chat_data';
const SETTINGS_KEY = 'mqzn_settings';
/** 跨版本恢复用的稳定ID，不依赖 getScriptId() */
const STABLE_ID = 'mqzn-script-data';
/** localStorage key for global settings */
const SETTINGS_LOCAL_KEY = 'mqzn_global_settings';

function loadSettingsFromLocal(): any | null {
  try {
    // 优先访问父页面（SillyTavern）的 localStorage；同域直接可用，跨域时抛 SecurityError
    const storage = (window.parent || window).localStorage;
    const raw = storage.getItem(SETTINGS_LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('[智脑] 加载全局设置 (localStorage) 失败:', e); }
  return null;
}

function saveSettingsToLocal(data: any): void {
  try {
    const storage = (window.parent || window).localStorage;
    storage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(data));
  } catch (e) { console.warn('[智脑] 保存全局设置 (localStorage) 失败:', e); }
}

function tryReadData(currentScriptId: string): { chatData: any; settings: any; migrated: boolean } {
  const primaryChat = getVariables({ type: 'chat' });
  const primaryScript = getVariables({ type: 'script', script_id: currentScriptId }) ?? {};

  // settings 加载优先级：localStorage > script变量 > 空
  let settings: any = null;
  const localSettings = loadSettingsFromLocal();
  if (localSettings) {
    settings = localSettings;
    console.info('[智脑] 从 localStorage 加载全局设置');
  } else if (primaryScript && Object.keys(primaryScript).length > 0) {
    settings = primaryScript;
  }

  if (!settings) {
    settings = {};
  }

  const hasChat = primaryChat && Object.keys(primaryChat).length > 0;
  const hasScriptSettings = settings && Object.keys(settings).length > 0;

  if (hasChat) {
    console.info(`[智脑] 从主存储加载聊天数据 (${Object.keys(primaryChat).length} 个聊天)`);
    return { chatData: primaryChat, settings, migrated: !hasScriptSettings };
  }

  // ⭐ type:'chat' 为空 → 优先尝试跨版本备份（STABLE_ID）
  // 修复 m3 遗留问题：之前当 hasScriptSettings=true 时直接返回 {}，跳过备份导致数据丢失
  const stable = getVariables({ type: 'script', script_id: STABLE_ID }) ?? {};
  if (stable[CHAT_DATA_KEY]) {
    console.info('[智脑] 主存储为空，从跨版本备份恢复聊天数据');
    const restoredChatData = stable[CHAT_DATA_KEY];
    const chatCount = typeof restoredChatData === 'object' ? Object.keys(restoredChatData).length : 0;
    console.info(`[智脑] 备份恢复完成 (${chatCount} 个聊天)`);
    return {
      chatData: restoredChatData,
      settings: hasScriptSettings ? settings : (stable[SETTINGS_KEY] ?? {}),
      migrated: true,
    };
  }

  if (hasScriptSettings) {
    console.info('[智脑] 主存储和备份均为空，使用空聊天数据');
    return { chatData: {}, settings, migrated: false };
  }

  // 兜底：即使用旧格式（有 personas 无 CHAT_DATA_KEY）也尝试恢复
  if (stable.personas && stable.personas.length > 0) {
    console.info('[智脑] 从旧格式跨版本备份恢复数据...');
    return {
      chatData: stable[CHAT_DATA_KEY] ?? {},
      settings: stable[SETTINGS_KEY] ?? stable,
      migrated: true,
    };
  }

  return { chatData: {}, settings: {}, migrated: false };
}

export const useMainStore = defineStore('main', () => {
  const currentScriptId = getScriptId();
  const currentChatId = SillyTavern.getCurrentChatId();

  // ========== 数据加载（主存储 → 跨版本备份回退） ==========
  const { chatData: rawChatData, settings: rawSettings, migrated: migratedFromOld } = tryReadData(currentScriptId);

  // 旧格式迁移：旧版直接存扁平 ChatData，新版存 Record<chatId, ChatData>
  const needsMigration = rawChatData &&
    (rawChatData.summaries !== undefined || rawChatData.capturedContents !== undefined);

  const allChatsData = ref<Record<string, ChatData>>(
    needsMigration
      ? { [currentChatId]: migrateOldFormatToChatData(rawChatData) }
      : (rawChatData ?? {}),
  );

  const scriptData = ref<ScriptSettings>(ScriptSettingsSchema.parse(rawSettings ?? {}));

  // 迁移后立即写回，并同步到跨版本备份
  if (migratedFromOld || needsMigration) {
    replaceVariables(klona(allChatsData.value), { type: 'chat' });
    saveSettingsToLocal(scriptData.value);
    replaceVariables(klona(scriptData.value), { type: 'script', script_id: currentScriptId });
    // 同步备份
    const backup = {
      [CHAT_DATA_KEY]: klona(allChatsData.value),
      [SETTINGS_KEY]: klona(scriptData.value),
    };
    replaceVariables(backup, { type: 'script', script_id: STABLE_ID });
    console.info('[智脑] 数据已写回并同步跨版本备份');
  }

  // 从 allChatsData 中提取当前聊天的数据（不存在则初始化）
  const chatData = ref<ChatData>(
    allChatsData.value[currentChatId]
      ? ChatDataSchema.parse(allChatsData.value[currentChatId])
      : ChatDataSchema.parse({}),
  );

  // ⭐ 二级安全网：当前聊天在主存储中缺失，从跨版本备份恢复
  if (!allChatsData.value[currentChatId]) {
    const stableRecovery = getVariables({ type: 'script', script_id: STABLE_ID }) ?? {};
    const backupChatData = stableRecovery[CHAT_DATA_KEY]?.[currentChatId];
    if (backupChatData) {
      console.info('[智脑] 当前聊天在主存储中缺失，从跨版本备份恢复');
      const parsed = ChatDataSchema.parse(backupChatData);
      chatData.value = parsed;
      allChatsData.value[currentChatId] = parsed;
      // 回写到主存储，下次加载时不需要再次恢复
      replaceVariables(klona(allChatsData.value), { type: 'chat' });
    }
  }

  // 首次初始化时记录当前聊天ID
  if (!chatData.value.chatId) {
    chatData.value.chatId = currentChatId;
  }

  // 梦呓 v1 → v2 迁移：检测旧格式（有 generalBehaviors 字段），自动丢弃
  if (chatData.value.dreamtalk && (chatData.value.dreamtalk as any).generalBehaviors !== undefined) {
    console.info('[智脑] 检测到梦呓 v1 旧格式，已自动迁移为 v2（下次大总结时重新分析）');
    chatData.value.dreamtalk = null;
  }

  // 梦呓 v2 补字段：旧 v2 数据不含 userInfo/personality，补默认值
  if (chatData.value.dreamtalk && !chatData.value.dreamtalk.userInfo) {
    (chatData.value.dreamtalk as any).userInfo = { basic: '', appearance: '', background: '', relationship: '' };
    (chatData.value.dreamtalk as any).personality = null;
  }

  // 梦呓 v2.1 → v2 条目格式迁移：旧格式 patterns/prevent → 新格式 entries
  if (chatData.value.dreamtalk) {
    let migrated = false;
    const dt = chatData.value.dreamtalk as any;

    // bodyContact: { patterns, prevent } → { entries }
    if (dt.bodyContact && Array.isArray(dt.bodyContact.patterns) && !dt.bodyContact.entries) {
      const prevent = dt.bodyContact.prevent || '';
      dt.bodyContact = { entries: dt.bodyContact.patterns.map((t: string) => ({ text: t, prevent })) };
      migrated = true;
    }
    // speechStyle: { patterns, prevent } → { entries }
    if (dt.speechStyle && Array.isArray(dt.speechStyle.patterns) && !dt.speechStyle.entries) {
      const prevent = dt.speechStyle.prevent || '';
      dt.speechStyle = { entries: dt.speechStyle.patterns.map((t: string) => ({ text: t, prevent })) };
      migrated = true;
    }
    // characterInteractions: { behaviors, prevent } → { entries }
    if (Array.isArray(dt.characterInteractions)) {
      for (let i = 0; i < dt.characterInteractions.length; i++) {
        const ci = dt.characterInteractions[i];
        if (Array.isArray(ci.behaviors) && !ci.entries) {
          const prevent = ci.prevent || '';
          ci.entries = ci.behaviors.map((t: string) => ({ text: t, prevent }));
          delete ci.behaviors;
          delete ci.prevent;
          migrated = true;
        }
      }
    }

    if (migrated) {
      console.info('[智脑] 梦呓 v2 旧条目格式已迁移为 v2.1 entries 格式');
    }
  }

  // ========== 运行状态（不持久化，脚本重载后重置） ==========

  const summaryInProgress = ref(false);
  const dreamtalkInProgress = ref(false);
  const _isRealChatMessage = ref(false); // MESSAGE_SENT 触发才为 true，generateRaw 分析请求不会触发

  function setSummaryInProgress(v: boolean) { summaryInProgress.value = v; }
  function setDreamtalkInProgress(v: boolean) { dreamtalkInProgress.value = v; }

  // 自动保存（防抖优化，避免阻塞事件处理器导致 UI 卡顿）
  // - 聊天数据 → type:'chat'（持久化可靠，per-chat）
  // - 全局设置 → localStorage（持久化可靠，全局共享）
  // - script 变量仅作辅助副本（刷新后丢失）
  //
  function doPersist() {
    allChatsData.value[currentChatId] = klona(chatData.value);
    replaceVariables(klona(allChatsData.value), { type: 'chat' });
    saveSettingsToLocal(scriptData.value);
    replaceVariables(klona(scriptData.value), { type: 'script', script_id: currentScriptId });
    const backup = {
      [CHAT_DATA_KEY]: klona(allChatsData.value),
      [SETTINGS_KEY]: klona(scriptData.value),
    };
    replaceVariables(backup, { type: 'script', script_id: STABLE_ID });
  }

  // ========== 便捷访问器 ==========

  const personas = computed(() => scriptData.value.personas);
  const activePersonaId = computed(() => scriptData.value.activePersonaId);
  const persona = computed(() => {
    const active = scriptData.value.personas.find(p => p.id === scriptData.value.activePersonaId);
    return active ?? { id: '', name: '', rawInput: '', analyzedProfile: '', lastAnalyzedAt: '' };
  });
  const settings = computed(() => scriptData.value.settings);
  const capturedContents = computed(() => chatData.value.capturedContents);
  const summaries = computed(() => chatData.value.summaries);
  const dynamicProfiles = computed(() => chatData.value.dynamicProfiles);
  const dreamtalk = computed(() => chatData.value.dreamtalk);
  const userInputRecords = computed(() => chatData.value.userInputRecords);
  const lastSummaryAtMessageId = computed(() => chatData.value.lastSummaryAtMessageId);
  const storyDateFormat = computed({
    get: () => chatData.value.storyDateFormat,
    set: (val: string) => { chatData.value.storyDateFormat = val; },
  });

  // ========== 用户人格相关 ==========

  function addPersona(name: string): string {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    scriptData.value.personas.push({ id, name, rawInput: '', analyzedProfile: '', lastAnalyzedAt: '' });
    if (!scriptData.value.activePersonaId) {
      scriptData.value.activePersonaId = id;
    }
    return id;
  }

  function removePersona(id: string) {
    scriptData.value.personas = scriptData.value.personas.filter(p => p.id !== id);
    if (scriptData.value.activePersonaId === id) {
      scriptData.value.activePersonaId = scriptData.value.personas[0]?.id ?? '';
    }
  }

  function setActivePersona(id: string) {
    scriptData.value.activePersonaId = id;
  }

  function updatePersonaRaw(rawInput: string) {
    const p = scriptData.value.personas.find(x => x.id === scriptData.value.activePersonaId);
    if (p) p.rawInput = rawInput;
  }

  function updatePersonaProfile(analyzedProfile: string) {
    const p = scriptData.value.personas.find(x => x.id === scriptData.value.activePersonaId);
    if (p) {
      p.analyzedProfile = analyzedProfile;
      p.lastAnalyzedAt = new Date().toISOString();
    }
  }

  function renamePersona(id: string, name: string) {
    const p = scriptData.value.personas.find(x => x.id === id);
    if (p) p.name = name;
  }

  // ========== 设置相关 ==========

  function updateSettings(partial: Partial<ScriptSettings['settings']>) {
    Object.assign(scriptData.value.settings, partial);
    // 设置变更直接落盘
    saveSettingsToLocal(scriptData.value);
  }

  // ========== 正文捕获相关 ==========

  function captureContent(messageId: number, content: string) {
    const existing = chatData.value.capturedContents.find(c => c.messageId === messageId);
    if (existing) {
      existing.content = content;
      existing.capturedAt = new Date().toISOString();
      existing.swipeCount++;
    } else {
      chatData.value.capturedContents.push({
        messageId,
        content,
        capturedAt: new Date().toISOString(),
        swipeCount: 0,
      });
    }
  }

  // 捕获第0层开场白（不会触发 MESSAGE_RECEIVED 事件）
  function captureFloorZero() {
    const existing = chatData.value.capturedContents.find(c => c.messageId === 0);
    if (existing) return;  // 已捕获过
    try {
      const aiMessages = getChatMessages(0, { role: 'assistant' });
      if (!aiMessages || aiMessages.length === 0) return;
      const content = extractContentFromMessage(aiMessages[0].message || '');
      if (content) {
        chatData.value.capturedContents.push({
          messageId: 0,
          content,
          capturedAt: new Date().toISOString(),
          swipeCount: 0,
        });
        console.info('[智脑] 已捕获开场白（第0层）');
      }
    } catch (e) {
      // getChatMessages 可能在某些环境下不可用，静默忽略
    }
  }

  // ========== 用户输入记录 ==========

  function recordUserInput(messageId: number, userInput: string, aiResponse: string) {
    const existing = chatData.value.userInputRecords.find(r => r.messageId === messageId);
    if (existing) {
      if (existing.aiResponse !== aiResponse && existing.aiResponse) {
        existing.rolledResponses.push(existing.aiResponse);
      }
      existing.aiResponse = aiResponse;
    } else {
      chatData.value.userInputRecords.push({
        messageId,
        userInput,
        aiResponse,
        rolledResponses: [],
      });
    }
  }

  // ========== 大总结相关 ==========

  /**
   * 增量存储：每条 summary 只存本轮新增内容，不再存合并后的全集。
   * 旧格式（_summaryDeltaFormat=false）首次调用时自动迁移。
   */
  function addSummary(summary: GrandSummary, upToMessageId?: number, coveredMessageIds?: number) {
    // ── 旧格式迁移：旧版每条 summary 都是全量快照，只保留最后一条作为基础 delta ──
    if (!(chatData.value as any)._summaryDeltaFormat) {
      const oldCount = chatData.value.summaries.length;
      if (oldCount > 0) {
        // 只保留最后一条（已包含所有合并信息），其余丢弃（都是重复数据）
        chatData.value.summaries = [chatData.value.summaries[oldCount - 1]];
        console.info(`[智脑] 大总结存储已迁移为增量格式 (旧版 ${oldCount} 条 → 1 条基础delta)`);
      }
      (chatData.value as any)._summaryDeltaFormat = true;
    }

    // 过滤已忽略角色
    const ignored = new Set(chatData.value.ignoredCharacters);
    summary.characterMemories = summary.characterMemories.filter(m => !ignored.has(m.characterName));
    // 过滤用户自身（AI偶尔误生成user的记忆条目）
    const userName = getUserName();
    summary.characterMemories = summary.characterMemories.filter(m => {
      const isUser = m.characterName === userName || m.characterName === '{{user}}' || m.characterName === 'user';
      if (isUser) {
        console.warn(`[智脑-addSummary] ⚠️ 已过滤user记忆条目: "${m.characterName}"`);
      }
      return !isUser;
    });

    // ⭐ 增量模式：不合并旧核心，直接存储本轮 AI 输出的 delta
    // 核心记忆的累积合并在 assembledSummary 中读取时完成
    for (const mem of summary.characterMemories) {
      mem.recentMemories = (mem.recentMemories || []).slice(0, 8);
    }

    const normalizedCoveredIds = coveredMessageIds ?? getCapturedContentMessageIds(chatData.value.capturedContents);
    summary.coveredMessageIds = normalizedCoveredIds;
    summary.upToMessageId =
      upToMessageId ?? normalizedCoveredIds[normalizedCoveredIds.length - 1] ?? chatData.value.lastSummaryAtMessageId;

    const oldLastId = chatData.value.lastSummaryAtMessageId;
    chatData.value.summaries.push(summary);
    chatData.value.lastSummaryAtMessageId = Math.max(
      oldLastId,
      summary.upToMessageId ?? 0,
    );
    console.info(
      `[智脑-addSummary] v${summary.version} (delta) ` +
      `upToMessageId=${summary.upToMessageId} ` +
      `chars=${summary.characterMemories.length}`,
    );

    // 立即持久化
    allChatsData.value[currentChatId] = klona(chatData.value);
    replaceVariables(klona(allChatsData.value), { type: 'chat' });
    // 同步备份
    const backup = {
      [CHAT_DATA_KEY]: klona(allChatsData.value),
      [SETTINGS_KEY]: klona(scriptData.value),
    };
    replaceVariables(backup, { type: 'script', script_id: STABLE_ID });
  }

  /** 获取最新的原始 delta（写操作用） */
  function getLatestDelta(): GrandSummary | undefined {
    return chatData.value.summaries[chatData.value.summaries.length - 1];
  }

  /** 组装增量 delta 为完整大总结视图 */
  const assembledSummary = computed<GrandSummary | undefined>(() => {
    const deltas = chatData.value.summaries;
    if (deltas.length === 0) return undefined;

    // 旧格式（尚未迁移）：直接返回最后一条
    if (!(chatData.value as any)._summaryDeltaFormat) {
      return deltas[deltas.length - 1];
    }

    const last = deltas[deltas.length - 1];

    // ═══ 组装叙事文本 (Section 1)：拼接所有 delta 的 Section 1 ═══
    const sections1: string[] = [];
    for (const d of deltas) {
      const parts = d.rawText.split(/---SECTION---/i);
      const s1 = (parts[0] || '').trim();
      if (s1) sections1.push(s1);
    }

    // ═══ 组装角色记忆 (Section 2)：累积合并所有 delta 的记忆 ═══
    // 手动编辑过的角色：跳过旧 delta 合并，直接使用最新 delta 的数据
    const manuallyEdited = new Set<string>();
    for (const mem of last.characterMemories) {
      if ((mem as any)._manuallyEdited) manuallyEdited.add(mem.characterName);
    }

    const memMap = new Map<string, CharacterMemory>();
    for (const d of deltas) {
      for (const mem of d.characterMemories) {
        // 手动编辑过的角色：只在最新 delta 中处理一次，跳过旧 delta
        if (manuallyEdited.has(mem.characterName) && d !== last) continue;
        const existing = memMap.get(mem.characterName);
        if (existing && !manuallyEdited.has(mem.characterName)) {
          // 核心去重追加，近期替换
          const newCores = (mem.coreMemories || []).filter(c => !existing.coreMemories.includes(c));
          existing.coreMemories = [...existing.coreMemories, ...newCores];
          existing.recentMemories = mem.recentMemories;
          if (mem.keywords?.length) existing.keywords = mem.keywords;
          if (mem.aliases?.length) existing.aliases = mem.aliases;
          if (mem.attitude) existing.attitude = mem.attitude;
        } else {
          memMap.set(mem.characterName, {
            ...mem,
            coreMemories: [...mem.coreMemories],
            recentMemories: [...mem.recentMemories],
          });
        }
      }
    }
    const allCharMems = [...memMap.values()];
    const section2 = buildMemorySectionText(allCharMems);

    // ═══ NSFW (Section 3)：只用最后一条 delta 的 ═══
    const lastParts = last.rawText.split(/---SECTION---/i);
    const section3 = (lastParts[2] || '').trim() || '[NSFW记录]\n无NSFW内容';

    // ═══ 时间线：拼接所有 delta ═══
    const allTimeline = deltas.flatMap(d => d.timeline);

    // ═══ 角色表格：取最后一条 ═══
    const charTable = last.characterTable.length > 0
      ? last.characterTable
      : allCharMems.map(m => ({ name: m.characterName, aliases: m.aliases, identity: '', relationship: '', status: '' }));

    const fullRawText = [
      sections1.join('\n\n') || '[剧情摘要]',
      '---SECTION---',
      section2 || '[角色记忆]',
      '---SECTION---',
      section3,
    ].join('\n');

    return {
      version: last.version,
      generatedAt: last.generatedAt,
      upToMessageId: last.upToMessageId,
      coveredMessageIds: last.coveredMessageIds,
      rawText: fullRawText,
      characterMemories: allCharMems,
      timeline: allTimeline,
      characterTable: charTable,
    };
  });

  /** 获取最新的完整大总结视图（读操作用，自动组装 delta） */
  function getLatestSummary(): GrandSummary | undefined {
    return assembledSummary.value;
  }

  function getCoveredFloorsDisplay(): string {
    const summary = getLatestSummary();
    if (!summary?.coveredMessageIds?.length) return '';
    const ids = [...summary.coveredMessageIds].sort((a, b) => a - b);
    return ` (#${ids[0]}${ids.length > 1 ? `-#${ids[ids.length - 1]}` : ''}, ${ids.length}层)`;
  }

  function rollbackSummary(force = false, saveToHistory = true): GrandSummary | undefined {
    if (!force && chatData.value.summaries.length <= 1) {
      console.info('[智脑] 无法撤回，至少保留一条总结');
      return undefined;
    }
    const removed = chatData.value.summaries.pop();
    if (removed && saveToHistory) {
      chatData.value.summaryHistory.push(removed);
      if (chatData.value.summaryHistory.length > 3) {
        chatData.value.summaryHistory.shift();
      }
    }
    const previousSummary = getLatestSummary();
    chatData.value.lastSummaryAtMessageId = previousSummary?.upToMessageId ?? 0;

    if (removed) {
      chatData.value.dynamicProfiles = chatData.value.dynamicProfiles.filter(
        profile => profile.basedOnSummaryVersion !== removed.version,
      );
      console.info(`[智脑] 已回退大总结 v${removed.version}`);
    }

    return removed;
  }

  function restoreLastSummary(): GrandSummary | undefined {
    if (chatData.value.summaryHistory.length === 0) {
      console.info('[智脑] 没有可恢复的大总结');
      return undefined;
    }
    const restored = chatData.value.summaryHistory.pop()!;
    chatData.value.summaries.push(restored);
    chatData.value.lastSummaryAtMessageId = Math.max(
      chatData.value.lastSummaryAtMessageId,
      restored.upToMessageId ?? 0,
    );
    console.info(`[智脑] 已恢复大总结 v${restored.version}`);
    return restored;
  }

  function getHiddenFloors(): HiddenFloor[] {
    return getHiddenFloorsFromChat();
  }

  function updateSummaryRawText(version: number, newRawText: string): boolean {
    const idx = chatData.value.summaries.findIndex(s => s.version === version);
    if (idx === -1 || !newRawText.trim()) return false;
    const summary = chatData.value.summaries[idx];

    try {
      const parsed: ParsedSummary = parseSummaryOutput(newRawText, version);

      // 校验：如果解析后角色记忆为空但原本有数据，保留旧角色记忆（用户可能只编辑了剧情摘要）
      const memsEmpty = parsed.characterMemories.length === 0 && summary.characterMemories.length > 0;
      if (memsEmpty) {
        console.warn('[智脑] 角色记忆解析为空，保留旧角色记忆（可能只编辑了剧情摘要部分）');
      }

      summary.rawText = newRawText;
      summary.timeline = parsed.timeline;
      if (!memsEmpty) {
        // 过滤掉已忽略角色
        const ignored = new Set(chatData.value.ignoredCharacters);
        summary.characterMemories = parsed.characterMemories.filter(m => !ignored.has(m.characterName));
        summary.characterTable = parsed.characterTable;
      }

      // 同步 nsfwMemories
      if (parsed.nsfwMemories && parsed.nsfwMemories.length > 0) {
        for (const mem of parsed.nsfwMemories) {
          const existing = chatData.value.nsfwMemories.find(
            m => m.characterName === mem.characterName,
          );
          if (existing) {
            Object.assign(existing, mem);
          } else {
            chatData.value.nsfwMemories.push(mem);
          }
        }
      }

      console.info(`[智脑] 大总结delta v${version} 手动编辑后已重新解析并同步`);
      // 强制替换 summary 对象引用触发 Vue 响应式
      chatData.value.summaries[idx] = { ...summary };
      // 强制持久化
      allChatsData.value[currentChatId] = klona(chatData.value);
      replaceVariables(klona(allChatsData.value), { type: 'chat' });
      return true;
    } catch (error) {
      console.error('[智脑] 重新解析失败，保留原结构', error);
      return false;
    }
  }

  // ========== 动态人设相关 ==========

  function updateDynamicProfile(profile: DynamicProfile) {
    // 拦截污染数据：内容为角色记忆格式的拒绝写入
    if (/^(别名[:：]|态度[:：]|关键词[:：]|- \[)/m.test(profile.dynamicContent?.trim() || '')) {
      console.warn(`[智脑] 拒绝写入污染的动态人设: ${profile.characterName}（内容为角色记忆格式）`);
      return;
    }
    const existing = chatData.value.dynamicProfiles.find(
      p => p.characterName === profile.characterName,
    );
    if (existing) {
      const oldVersion = existing.basedOnSummaryVersion;
      Object.assign(existing, profile);
      existing.basedOnSummaryVersion = oldVersion; // 保留首次创建的版本号，回滚时不误删
    } else {
      chatData.value.dynamicProfiles.push(profile);
    }
  }

  // ========== 记忆库相关 ==========

  /**
   * 融合记忆：运行时遍历所有版本，输出完整的融合列表
   * - 旧版本核心去重后前置（保持首次出现顺序）
   * - 最近 N 个版本的所有记忆按 AI 原始输出顺序追加
   * - 近期窗口中与旧核心重复的条目保留排序但降为 [近期]
   * @param characterName 角色名
   * @param recentVersions 最近几个版本的近期记忆（默认用 settings 中的值）
   */
  function getFusedMemories(characterName: string, recentVersions?: number): Array<{ text: string; isCore: boolean }> {
    const versions = recentVersions ?? scriptData.value.settings.recentMemoryVersions ?? 1;
    const summaries = chatData.value.summaries;
    const recentStart = Math.max(0, summaries.length - Math.max(1, versions));

    // 查找角色时归一化名称匹配（Qingyue (清月) ↔ Qingyue）
    const normName = characterName.replace(/\s*\(.+?\)$/g, '');
    function findMem(summary: any) {
      return summary.characterMemories.find((m: any) => {
        const mn = (m.characterName || '').replace(/\s*\(.+?\)$/g, '');
        return mn === normName;
      });
    }

    // ⭐ 手动编辑过的角色：只用最新版本的 orderedNewMemories，完全跳过所有旧版本
    const latestMem = findMem(summaries[summaries.length - 1]);
    if (latestMem && (latestMem as any)._manuallyEdited === true) {
      const ordered = (latestMem as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
      return (ordered || []).map(item => ({ text: item.text, isCore: item.isCore }));
    }

    // 1. 收集旧窗口的核心（去重，保持首次出现顺序）
    const oldCores: string[] = [];
    const oldCoreSet = new Set<string>();
    for (let i = 0; i < recentStart; i++) {
      const mem = findMem(summaries[i]);
      if (!mem) continue;
      const ordered = (mem as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
      if (!ordered) continue;
      for (const item of ordered) {
        if (item.isCore && !oldCoreSet.has(item.text)) {
          oldCoreSet.add(item.text);
          oldCores.push(item.text);
        }
      }
    }

    // 2. 输出：旧核心前置 + 近期窗口各版本按 AI 原序追加
    const result: Array<{ text: string; isCore: boolean }> = oldCores.map(t => ({ text: t, isCore: true }));

    for (let i = recentStart; i < summaries.length; i++) {
      const mem = findMem(summaries[i]);
      if (!mem) continue;
      const ordered = (mem as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
      if (!ordered) continue;
      for (const item of ordered) {
        result.push({
          text: item.text,
          isCore: item.isCore && !oldCoreSet.has(item.text),
        });
      }
    }

    return result;
  }

  function getCharacterMemoryArchive(characterName: string): Array<{
    version: number;
    generatedAt: string;
    memories: Array<{ text: string; isCore: boolean }>;
  }> {
    const normName = characterName.replace(/\s*\(.+?\)$/g, '');
    return JSON.parse(JSON.stringify(chatData.value.summaries.map(summary => {
      const mem = summary.characterMemories.find(m => {
        const mn = (m.characterName || '').replace(/\s*\(.+?\)$/g, '');
        return mn === normName;
      });
      const ordered = (mem as any)?.orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
      return {
        version: summary.version,
        generatedAt: summary.generatedAt,
        memories: ordered || [],
      };
    }))); // 保持旧→新顺序（v1 在上，v2 在下）
  }

  function getCharacterMemories(characterName: string): CharacterMemory & { memories: string[]; _orderedItems?: { text: string; isCore: boolean }[] } | undefined {
    const latest = getLatestSummary();
    if (!latest) return undefined;
    const mem = latest.characterMemories.find(m => m.characterName === characterName);
    if (mem) {
      // ⭐ 手动编辑过的角色：直接使用 orderedNewMemories，跳过融合避免旧数据复活
      if ((mem as any)._manuallyEdited) {
        const ordered = (mem as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
        if (ordered && ordered.length > 0) {
          (mem as any)._orderedItems = ordered;
          (mem as any).memories = ordered.map(m => `[${m.isCore ? '核心' : '近期'}]${m.text}`);
          return mem as any;
        }
      }
      // 运行时融合：旧核心 → 最近N版近期
      const fused = getFusedMemories(characterName);
      if (fused.length > 0) {
        (mem as any)._orderedItems = fused;
        (mem as any).memories = fused.map(m => `[${m.isCore ? '核心' : '近期'}]${m.text}`);
      } else {
        // 兜底：核心在前、近期在后
        const items: { text: string; isCore: boolean }[] = [
          ...(mem.coreMemories || []).map(t => ({ text: t, isCore: true })),
          ...(mem.recentMemories || []).map(t => ({ text: t, isCore: false })),
        ];
        (mem as any)._orderedItems = items;
        (mem as any).memories = items.map(m => `[${m.isCore ? '核心' : '近期'}]${m.text}`);
      }
    }
    return mem as any;
  }

  function getAllCharacterNames(): string[] {
    const latest = getLatestSummary();
    if (!latest) return [];
    return latest.characterMemories.map(m => m.characterName);
  }

  // ========== 角色忽略管理 ==========

  function ignoreCharacter(name: string) {
    if (!chatData.value.ignoredCharacters.includes(name)) {
      chatData.value.ignoredCharacters.push(name);
    }
    // 备份角色数据（从组装视图备份完整信息），恢复时还原
    const assembled = getLatestSummary();
    const memBackup = assembled
      ? assembled.characterMemories.filter(m => m.characterName === name)
      : [];
    const profileBackup = chatData.value.dynamicProfiles.find(p => p.characterName === name) || null;
    chatData.value._ignoredBackup.push({
      name,
      memories: JSON.parse(JSON.stringify(memBackup)),
      profile: profileBackup ? JSON.parse(JSON.stringify(profileBackup)) : null,
    });
    // 从最新 delta 中移除（下次组装时该角色不会再出现）
    const latestDelta = getLatestDelta();
    if (latestDelta) {
      latestDelta.characterMemories = latestDelta.characterMemories.filter(m => m.characterName !== name);
    }
    // 清空对应的动态人设
    chatData.value.dynamicProfiles = chatData.value.dynamicProfiles.filter(p => p.characterName !== name);
    console.info(`[智脑] 已忽略角色: ${name}（数据已备份）`);
  }

  function unignoreCharacter(name: string) {
    chatData.value.ignoredCharacters = chatData.value.ignoredCharacters.filter(n => n !== name);
    // 还原备份的角色数据
    const backup = chatData.value._ignoredBackup.find(b => b.name === name);
    if (backup) {
      const latestDelta = getLatestDelta();
      if (latestDelta && backup.memories.length > 0) {
        // 还原时放在末尾
        latestDelta.characterMemories.push(...backup.memories);
      }
      if (backup.profile) {
        chatData.value.dynamicProfiles.push(backup.profile);
      }
      // 清理备份
      chatData.value._ignoredBackup = chatData.value._ignoredBackup.filter(b => b.name !== name);
      console.info(`[智脑] 已取消忽略角色: ${name}（数据已还原）`);
    } else {
      console.info(`[智脑] 已取消忽略角色: ${name}（无备份数据，需下次总结时重新生成）`);
    }
  }

  // ========== 梦呓相关 ==========

  function updateDreamtalk(data: DreamtalkData) {
    if (chatData.value.dreamtalk) {
      chatData.value.dreamtalkHistory.push(JSON.parse(JSON.stringify(chatData.value.dreamtalk)));
      if (chatData.value.dreamtalkHistory.length > 5) {
        chatData.value.dreamtalkHistory.shift();
      }
    }
    chatData.value.dreamtalk = data;
    doPersist(); // 立即落盘
  }

  function rollbackDreamtalk(): DreamtalkData | null {
    if (!chatData.value.dreamtalk || chatData.value.dreamtalkHistory.length === 0) {
      console.info('[智脑] 没有可撤回的梦呓');
      return null;
    }
    chatData.value.dreamtalkUndoHistory.push(JSON.parse(JSON.stringify(chatData.value.dreamtalk)));
    if (chatData.value.dreamtalkUndoHistory.length > 5) {
      chatData.value.dreamtalkUndoHistory.shift();
    }
    const restored = chatData.value.dreamtalkHistory.pop()!;
    chatData.value.dreamtalk = restored;
    console.info('[智脑] 梦呓已撤回');
    return restored;
  }

  function restoreDreamtalk(): DreamtalkData | null {
    if (!chatData.value.dreamtalk || chatData.value.dreamtalkUndoHistory.length === 0) {
      console.info('[智脑] 没有可恢复的梦呓');
      return null;
    }
    chatData.value.dreamtalkHistory.push(JSON.parse(JSON.stringify(chatData.value.dreamtalk)));
    if (chatData.value.dreamtalkHistory.length > 5) {
      chatData.value.dreamtalkHistory.shift();
    }
    const restored = chatData.value.dreamtalkUndoHistory.pop()!;
    chatData.value.dreamtalk = restored;
    console.info('[智脑] 梦呓已恢复');
    return restored;
  }

  function getDreamtalkCharacterNames(): string[] {
    if (!chatData.value.dreamtalk) return [];
    return chatData.value.dreamtalk.characterInteractions.map(i => i.characterName);
  }

  // ========== NSFW隔离层相关 ==========

  const nsfwMemories = computed(() => chatData.value.nsfwMemories);
  const nsfwDreamtalk = computed(() => chatData.value.nsfwDreamtalk);
  const nsfwDynamicProfiles = computed(() => chatData.value.nsfwDynamicProfiles);

  function updateNsfwMemories(memories: NsfwCharacterMemory[]) {
    for (const mem of memories) {
      const existing = chatData.value.nsfwMemories.find(m => m.characterName === mem.characterName);
      if (existing) {
        Object.assign(existing, mem);
      } else {
        chatData.value.nsfwMemories.push(mem);
      }
    }
  }

  function updateNsfwDreamtalk(data: NsfwDreamtalkData) {
    chatData.value.nsfwDreamtalk = data;
    doPersist();
  }

  function updateNsfwDynamicProfile(profile: NsfwDynamicProfile) {
    const existing = chatData.value.nsfwDynamicProfiles.find(p => p.characterName === profile.characterName);
    if (existing) {
      Object.assign(existing, profile);
    } else {
      chatData.value.nsfwDynamicProfiles.push(profile);
    }
  }

  // ========== 倒果为因相关 ==========

  const plotFate = computed(() => chatData.value.plotFate);

  function updatePlotFate(state: PlotFateState) {
    chatData.value.plotFate = state;
    doPersist();
  }

  // ========== 情绪积累相关 ==========

  const emotionState = computed(() => chatData.value.emotionState);

  function updateEmotionState(state: EmotionAccumulationState) {
    chatData.value.emotionState = state;
    doPersist();
  }

  // ========== 后台行动推演相关 ==========

  const ecosystemState = computed(() => chatData.value.ecosystemState);

  const ecosystemManualChars = computed(() => chatData.value.ecosystemManualChars);

  function updateEcosystemState(state: EcosystemState) {
    chatData.value.ecosystemState = state;
    doPersist();
  }

  const ecosystemCollapsed = computed(() => chatData.value.ecosystemCollapsed);

  function toggleEcosystemCollapsed() {
    chatData.value.ecosystemCollapsed = !chatData.value.ecosystemCollapsed;
    doPersist();
  }

  function updateEcosystemManualChars(val: string) {
    chatData.value.ecosystemManualChars = val;
    doPersist();
  }

  /**
   * 获取当前用户名
   * 优先智脑自定义角色名 → SillyTavern.name1 → '{{user}}'
   */
  function getUserName(): string {
    const personaName = scriptData.value.personas
      .find(p => p.id === scriptData.value.activePersonaId)?.name;
    if (personaName) return personaName;
    return (typeof SillyTavern !== 'undefined' ? SillyTavern.name1 : '') || '{{user}}';
  }

  // ========== 大总结引导弹窗 ==========

  const showSummaryGuidance = ref(false);
  const summaryPendingFloors = ref(0);
  const lastSubmittedGuidance = ref('');
  let summaryGuidanceResolve: ((guidance: string | null) => void) | null = null;

  function requestSummaryGuidance(pendingFloors: number, initialGuidance?: string): Promise<string | null> {
    // settings 是 computed ref，setup 内必须用 .value 取真实值
    if ((settings.value as any)?.summaryGuidanceEnabled === false) {
      return Promise.resolve('');
    }
    // initialGuidance 传入 → 预填（重新总结）；未传入 → 清空（新总结）
    lastSubmittedGuidance.value = initialGuidance ?? '';
    summaryPendingFloors.value = pendingFloors;
    showSummaryGuidance.value = true;
    return new Promise(resolve => {
      summaryGuidanceResolve = resolve;
    });
  }

  function resolveSummaryGuidance(guidance: string) {
    showSummaryGuidance.value = false;
    lastSubmittedGuidance.value = guidance;
    summaryGuidanceResolve?.(guidance);
    summaryGuidanceResolve = null;
  }

  function skipSummaryGuidance() {
    showSummaryGuidance.value = false;
    lastSubmittedGuidance.value = '';
    summaryGuidanceResolve?.('');
    summaryGuidanceResolve = null;
  }

  function cancelSummaryGuidance() {
    showSummaryGuidance.value = false;
    // 取消时不清理 guidance，下次弹窗还能看到
    summaryGuidanceResolve?.(null);
    summaryGuidanceResolve = null;
  }

  // ========== 读取历史楼层 ==========

  async function loadHistoryFloors(): Promise<number> {
    const lastId = getLastMessageId();
    if (lastId < 0) {
      console.info('[智脑] 当前没有聊天楼层');
      return 0;
    }

    const aiMessages = getChatMessages(`0-${lastId}`, { role: 'assistant' });
    const userMessages = getChatMessages(`0-${lastId}`, { role: 'user' });

    // O(1) 索引：避免循环内 O(n) 查找
    const capturedIds = new Set(chatData.value.capturedContents.map(c => c.messageId));
    const recordIds = new Set(chatData.value.userInputRecords.map(r => r.messageId));
    const userMsgMap = new Map<number, typeof userMessages[0]>();
    for (const u of userMessages) userMsgMap.set(u.message_id, u);

    // 先收集到临时数组，循环结束后一次性 push，避免每次 push 触发同步存储写入
    const newContents: CapturedContent[] = [];
    const newRecords: UserInputRecord[] = [];

    for (const msg of aiMessages) {
      if (capturedIds.has(msg.message_id)) continue;

      const extractedContent = extractContentFromMessage(msg.message);
      if (!extractedContent) continue;

      newContents.push({
        messageId: msg.message_id,
        content: extractedContent,
        capturedAt: new Date().toISOString(),
        swipeCount: 0,
      });

      // 查找对应的用户输入（AI楼层的前一楼通常是用户输入）
      const userMsg = userMsgMap.get(msg.message_id - 1);
      if (userMsg && !recordIds.has(msg.message_id)) {
        newRecords.push({
          messageId: msg.message_id,
          userInput: userMsg.message,
          aiResponse: extractedContent,
          rolledResponses: [],
        });
        recordIds.add(msg.message_id); // 防止同一条被重复添加
      }
    }

    // 一次性批量写入（只触发一次响应式更新 + 一次存储写入）
    if (newContents.length > 0) {
      chatData.value.capturedContents.push(...newContents);
    }
    if (newRecords.length > 0) {
      chatData.value.userInputRecords.push(...newRecords);
    }

    console.info(`[智脑] 读取历史楼层完成，共补录 ${newContents.length} 条`);
    return newContents.length;
  }

  // ========== 数据管理 ==========

  function exportAllData(): string {
    return JSON.stringify({ scriptData: klona(scriptData.value), chatData: klona(chatData.value) }, null, 2);
  }

  function importAllData(jsonStr: string) {
    // 1. JSON 解析
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[智脑] JSON 解析失败，文件可能已损坏:', e);
      throw new Error('文件格式错误：不是有效的 JSON，请检查文件是否完整');
    }

    // 2. 数据结构检查
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('数据格式错误：JSON 根节点不是对象');
    }
    if (!parsed.scriptData && !parsed.chatData) {
      throw new Error('数据格式错误：缺少 scriptData 和 chatData 字段，不是智脑导出的数据');
    }

    // 3. Zod 校验（safeParse 返回详细错误，不直接抛异常）
    const errors: string[] = [];

    if (parsed.scriptData) {
      const result = ScriptSettingsSchema.safeParse(parsed.scriptData);
      if (result.success) {
        scriptData.value = result.data;
      } else {
        const msgs = result.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`);
        console.error('[智脑] scriptData 校验失败:', result.error.issues);
        errors.push('设置数据', ...msgs);
      }
    }

    if (parsed.chatData) {
      const result = ChatDataSchema.safeParse(parsed.chatData);
      if (result.success) {
        chatData.value = result.data;
        if (!chatData.value.chatId) {
          chatData.value.chatId = currentChatId;
        }
        console.info(`[智脑] 数据导入成功 (总结: ${chatData.value.summaries.length}, 梦呓: ${chatData.value.dreamtalk ? '有' : '无'}, 捕获: ${chatData.value.capturedContents.length})`);
        return;
      } else {
        const msgs = result.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`);
        console.error('[智脑] chatData 校验失败:', result.error.issues);
        errors.push('聊天数据', ...msgs);
      }
    }

    if (errors.length > 0) {
      throw new Error(`数据校验失败，可能是版本不兼容：\n${errors.join('\n')}`);
    }

    console.info('[智脑] 数据导入成功');
  }

  function clearChatData() {
    chatData.value = ChatDataSchema.parse({});
    console.info('[智脑] 聊天数据已清空');
  }

  function clearAllData() {
    scriptData.value = ScriptSettingsSchema.parse({});
    chatData.value = ChatDataSchema.parse({});
    console.info('[智脑] 所有数据已清空');
  }

  // ========== Claude 模型检测 ==========

  function getCurrentModel(): string {
    try {
      return SillyTavern.getChatCompletionModel();
    } catch {
      return '';
    }
  }

  function isClaudeModel(): boolean {
    const model = getCurrentModel();
    return /claude/i.test(model);
  }

  return {
    // 原始数据
    scriptData,
    chatData,
    // 便捷访问器
    personas,
    activePersonaId,
    persona,
    settings,
    capturedContents,
    summaries,
    dynamicProfiles,
    dreamtalk,
    userInputRecords,
    lastSummaryAtMessageId,
    storyDateFormat,
    // 用户人格
    addPersona,
    removePersona,
    setActivePersona,
    updatePersonaRaw,
    updatePersonaProfile,
    renamePersona,
    // 设置
    updateSettings,
    // 正文捕获
    captureContent,
    captureFloorZero,
    recordUserInput,
    // 大总结
    addSummary,
    getLatestSummary,
    getLatestDelta,
    getCoveredFloorsDisplay,
    rollbackSummary,
    // 强制持久化（用于直接编辑角色库/梦呓数据后）
    forcePersist() {
      doPersist();
    },
    restoreLastSummary,
    updateSummaryRawText,
    getHiddenFloors,
    // 动态人设
    updateDynamicProfile,
    // 记忆库
    getFusedMemories,
    getCharacterMemoryArchive,
    getCharacterMemories,
    getAllCharacterNames,
    // 角色忽略管理
    ignoreCharacter,
    unignoreCharacter,
    // 梦呓
    updateDreamtalk,
    rollbackDreamtalk,
    restoreDreamtalk,
    getDreamtalkCharacterNames,
    // NSFW隔离层
    nsfwMemories,
    nsfwDreamtalk,
    nsfwDynamicProfiles,
    updateNsfwMemories,
    updateNsfwDreamtalk,
    updateNsfwDynamicProfile,
    // 倒果为因
    plotFate,
    updatePlotFate,
    // 情绪积累
    emotionState,
    updateEmotionState,
    // 后台行动推演
    ecosystemState,
    updateEcosystemState,
    ecosystemManualChars,
    updateEcosystemManualChars,
    ecosystemCollapsed,
    toggleEcosystemCollapsed,
    getUserName,
    // 大总结引导弹窗
    showSummaryGuidance,
    summaryPendingFloors,
    requestSummaryGuidance,
    resolveSummaryGuidance,
    skipSummaryGuidance,
    cancelSummaryGuidance,
    // 数据管理
    exportAllData,
    importAllData,
    clearChatData,
    clearAllData,
    // 历史楼层
    loadHistoryFloors,
    // 模型检测
    getCurrentModel,
    isClaudeModel,
    // 运行状态
    summaryInProgress,
    dreamtalkInProgress,
    _isRealChatMessage, // MESSAGE_SENT 触发为 true，仅正常聊天注入梦呓
    setSummaryInProgress,
    setDreamtalkInProgress,
  };
});
