import { Schema, parse境界, get突破类型 } from './schema';
import {
  getAllStorageItems, filterByCategory, removeItemByName, removeItemFromCategory,
  getExistingCategories, getCategoryRecord, addItemToCategory,
  type StorageItem, type EquipSlot, type StorageCategory,
  STORAGE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_FIELD_MAP,
} from './storageUtils';

// Re-export storageUtils 供其他组件使用
export {
  getAllStorageItems, filterByCategory, removeItemByName, removeItemFromCategory,
  getExistingCategories, getCategoryRecord, addItemToCategory,
  type StorageItem, type EquipSlot, type StorageCategory,
  STORAGE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_FIELD_MAP,
} from './storageUtils';

// ─── 常量 ───
const FAB_STORAGE_KEY = 'xiuxian-statusbar-fab';
const EDGE_GAP = 12;
const FAB_SIZE = 52;

// ─── FAB 位置持久化 ───
function readFabPosition(): { x: number; y: number } | null {
  try {
    const raw = window.parent.localStorage.getItem(FAB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
  } catch { /* ignore */ }
  return null;
}

function saveFabPosition(pos: { x: number; y: number }) {
  try {
    window.parent.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(pos));
  } catch { /* ignore */ }
}

function clampFabPosition(x: number, y: number): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  const vh = window.parent.innerHeight;
  const isMobileNow = vw <= 500;
  const snapOff = FAB_SIZE * 0.45;
  return {
    // 手机模式允许吸附到边缘（负 x 值），PC 模式正常钳位
    x: isMobileNow
      ? _.clamp(x, -snapOff, vw - FAB_SIZE + snapOff)
      : _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

function defaultFabPosition(): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  const vh = window.parent.innerHeight;
  return { x: vw - FAB_SIZE - 20, y: vh - FAB_SIZE - 80 };
}

// ─── 功法库工具函数 ───
// 功法库格式: "功法名|品级|已修层数/总层数;功法名2|品级2|已修层数2/总层数2;..."
interface GongfaEntry {
  name: string;
  grade: string;
  current: number;
  total: number;
}

function parseGongfaLibrary(raw: string): GongfaEntry[] {
  if (!raw) return [];
  return raw.split(';').filter(Boolean).map(entry => {
    const parts = entry.split('|');
    const name = parts[0] || '';
    const grade = parts[1] || '';
    const progress = parts[2] || '0/0';
    const [cur, tot] = progress.split('/').map(Number);
    return { name, grade, current: cur || 0, total: tot || 0 };
  });
}

function serializeGongfaLibrary(entries: GongfaEntry[]): string {
  return entries.map(e => `${e.name}|${e.grade}|${e.current}/${e.total}`).join(';');
}

// ─── 计算境界显示 ───
function compute境界显示(data: Schema): { 大境界: string; 小境界: string; full: string } {
  const { 大境界, 小境界 } = parse境界(data.当前境界);
  return { 大境界, 小境界, full: data.当前境界 || '凡人' };
}

// ─── 计算寿元百分比 ───
function compute寿元百分比(data: Schema): number {
  if (!data.当前寿元) return 0;
  return Math.round((data._剩余寿元 / data.当前寿元) * 100);
}

// ─── 计算灵石总量(折算为下品) ───
function compute灵石总量(data: Schema): number {
  return data.下品灵石 +
    data.中品灵石 * 1000 +
    data.上品灵石 * 1000000 +
    data.极品灵石 * 1000000000;
}

// ─── 计算钓鱼成功率 ───
function compute钓鱼成功率(data: Schema): string {
  if (!data._钓鱼_钓鱼次数) return '0%';
  return Math.round((data.$钓鱼_成功次数 / data._钓鱼_钓鱼次数) * 100) + '%';
}

// ─── TAB 配置 ───
export type XiuxianTab = '基础' | '境界' | '百艺' | '物品' | '关系' | '地图';
export const TABS: XiuxianTab[] = ['基础', '境界', '百艺', '物品', '关系', '地图'];

// ─── 百艺配置 ───
export type ArtKey = '炼丹' | '炼器' | '阵法' | '符箓' | '驭兽' | '医术' | '傀儡术' | '种植采药' | '剑心' | '钓鱼';
export interface ArtConfig {
  key: ArtKey;
  name: string;
  境界字段: string;
  熟练度字段: string;
  经验值字段: string;
  工具字段: string;
  库存字段: string;
  /** 是否始终在百艺列表中显示（不需要学会） */
  alwaysShow?: boolean;
  icon: string;
  color: string;
}

export const ARTS: ArtConfig[] = [
  {
    key: '炼丹',
    name: '炼丹',
    境界字段: '丹道境界',
    熟练度字段: '$炼丹_熟练度',
    经验值字段: '$炼丹_经验值',
    工具字段: '装备_丹炉',
    库存字段: '储物戒',
    icon: 'flask',
    color: '#ef4444',
  },
  {
    key: '炼器',
    name: '炼器',
    境界字段: '炼器境界',
    熟练度字段: '$炼器_熟练度',
    经验值字段: '$炼器_经验值',
    工具字段: '装备_锻造台',
    库存字段: '储物戒',
    icon: 'hammer',
    color: '#f97316',
  },
  {
    key: '阵法',
    name: '阵法',
    境界字段: '阵法境界',
    熟练度字段: '$阵法_熟练度',
    经验值字段: '$阵法_经验值',
    工具字段: '装备_阵盘',
    库存字段: '$阵盘_存放阵法',
    icon: 'hexagon',
    color: '#3b82f6',
  },
  {
    key: '符箓',
    name: '符箓',
    境界字段: '符箓境界',
    熟练度字段: '$符箓_熟练度',
    经验值字段: '$符箓_经验值',
    工具字段: '装备_符笔',
    库存字段: '储物戒',
    icon: 'scroll',
    color: '#8b5cf6',
  },
  {
    key: '驭兽',
    name: '驭兽',
    境界字段: '驭兽境界',
    熟练度字段: '$驭兽_熟练度',
    经验值字段: '$驭兽_经验值',
    工具字段: '装备_灵兽',
    库存字段: '$灵兽状态列表',
    icon: 'paw',
    color: '#10b981',
  },
  {
    key: '医术',
    name: '医术',
    境界字段: '医术境界',
    熟练度字段: '$医术_熟练度',
    经验值字段: '$医术_经验值',
    工具字段: '装备_药箱',
    库存字段: '$药箱_工具',
    icon: 'heart',
    color: '#ec4899',
  },
  {
    key: '傀儡术',
    name: '傀儡',
    境界字段: '傀儡术境界',
    熟练度字段: '$傀儡术_熟练度',
    经验值字段: '$傀儡术_经验值',
    工具字段: '装备_傀儡',
    库存字段: '$傀儡状态列表',
    icon: 'robot',
    color: '#6b7280',
  },
  {
    key: '种植采药',
    name: '种植',
    境界字段: '种植采药境界',
    熟练度字段: '$种植采药_熟练度',
    经验值字段: '$种植采药_经验值',
    工具字段: '装备_一寸地',
    库存字段: '$一寸地_种植列表',
    icon: 'leaf',
    color: '#22c55e',
  },
  {
    key: '剑心',
    name: '剑心',
    境界字段: '剑心境界',
    熟练度字段: '',
    经验值字段: '',
    工具字段: '',
    库存字段: '',
    icon: 'sword',
    color: '#64748b',
  },
  {
    key: '钓鱼',
    name: '钓鱼',
    境界字段: '',
    熟练度字段: '',
    经验值字段: '',
    工具字段: '装备_鱼竿',
    库存字段: '',
    icon: 'fish',
    color: '#0ea5e9',
    alwaysShow: true,
  },
];

// ─── 百艺页面路由配置 ───
export type ArtPageComponent =
  | 'ArtAlchemy'    // 炼丹
  | 'ArtForging'   // 炼器
  | 'ArtFormation' // 阵法
  | 'ArtTalisman'  // 符箓
  | 'ArtBeast'     // 驭兽
  | 'ArtMedical'   // 医术
  | 'ArtPuppet'    // 傀儡术
  | 'ArtHerb'      // 种植采药
  | 'ArtSword'     // 剑心
  | 'ArtFishing';  // 钓鱼

export const ARTS_PAGE_MAP: Record<ArtKey, ArtPageComponent> = {
  '炼丹': 'ArtAlchemy',
  '炼器': 'ArtForging',
  '阵法': 'ArtFormation',
  '符箓': 'ArtTalisman',
  '驭兽': 'ArtBeast',
  '医术': 'ArtMedical',
  '傀儡术': 'ArtPuppet',
  '种植采药': 'ArtHerb',
  '剑心': 'ArtSword',
  '钓鱼': 'ArtFishing',
};

export const ARTS_MAP = Object.fromEntries(ARTS.map(a => [a.key, a])) as Record<ArtKey, ArtConfig>;

// ─── Store ───
export const useStatusStore = defineStore('xiuxian-status', () => {
  // MVU 数据
  const data = ref<Schema>(Schema.parse({}));

  // 记录当前楼层号，用于 saveData
  let currentMessageId: number = -1;

  // UI 状态
  const isOpen = ref(false);

  // 主题：浅色/深色
  const theme = ref<'light' | 'dark'>(
    (window.parent.localStorage.getItem('xiuxian-theme') as 'light' | 'dark') || 'dark'
  );

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    window.parent.localStorage.setItem('xiuxian-theme', theme.value);
  }
  const activeTab = ref(0);

  // 百艺子页面
  const artsPage = ref<ArtKey | null>(null);

  // FAB 位置
  const fabPosition = ref(clampFabPosition(
    ...((() => {
      const saved = readFabPosition();
      const pos = saved ?? defaultFabPosition();
      return [pos.x, pos.y] as [number, number];
    })()),
  ));

  // ─── 计算属性 ───
  const tabs = computed(() => TABS);
  const currentTab = computed(() => TABS[activeTab.value]);

  // 境界显示（使用parse境界拆分）
  const 境界信息 = computed(() => compute境界显示(data.value));
  const 境界显示 = computed(() => 境界信息.value.full);
  const 大境界 = computed(() => 境界信息.value.大境界);
  const 小境界 = computed(() => 境界信息.value.小境界);

  // 突破类型
  const 突破类型 = computed(() => get突破类型(data.value.当前境界));

  // 寿元相关
  const 寿元百分比 = computed(() => compute寿元百分比(data.value));
  const 寿元状态颜色 = computed(() => {
    const pct = 寿元百分比.value;
    if (pct >= 80) return '#10b981'; // 绿色
    if (pct >= 50) return '#f59e0b'; // 黄色
    if (pct >= 20) return '#f97316'; // 橙色
    return '#ef4444'; // 红色
  });

  // 灵石
  const 灵石总量 = computed(() => compute灵石总量(data.value));

  // 钓鱼
  const 钓鱼成功率 = computed(() => compute钓鱼成功率(data.value));

  // 当前修炼状态颜色
  const 修炼状态颜色 = computed(() => {
    const state = data.value._修炼状态;
    if (state === '修炼中') return '#10b981';
    if (state === '突破中') return '#8b5cf6';
    if (state === '渡劫中') return '#ef4444';
    if (state === '引气入体') return '#3b82f6';
    return '#94a3b8';
  });

  // 道途颜色
  const 道途颜色 = computed(() => {
    const dao = data.value.道途;
    if (dao === '正道') return '#3b82f6';
    if (dao === '邪道') return '#ef4444';
    if (dao === '魔道') return '#7c3aed';
    if (dao === '中立') return '#6b7280';
    if (dao === '混乱中立') return '#f59e0b';
    return '#94a3b8';
  });

  // ─── 方法 ───
  function loadData() {
    try {
      // 获取最新楼层号
      const latestId = getLastMessageId();
      if (latestId >= 0) {
        currentMessageId = latestId;
      } else {
        console.warn('[修仙状态栏] getLastMessageId() 返回', latestId, '，跳过加载');
        return;
      }

      const mvuData = Mvu.getMvuData({ type: 'message', message_id: currentMessageId });
      const statData = _.get(mvuData, 'stat_data');
      if (statData) {
        data.value = Schema.parse(statData);
      } else {
        console.warn('[修仙状态栏] 楼层', currentMessageId, '没有 stat_data');
      }
    } catch (e) {
      console.warn('[修仙状态栏] 读取 MVU 数据失败:', e);
    }
  }

  // 保存数据到最新楼层 MVU 变量（使用具体 message_id）
  async function saveData() {
    try {
      // 确保用具体的 message_id
      const latestId = getLastMessageId();
      if (latestId >= 0) currentMessageId = latestId;
      const targetId = currentMessageId >= 0 ? currentMessageId : getLastMessageId();

      const mvuData = Mvu.getMvuData({ type: 'message', message_id: targetId });
      const updated = _.cloneDeep(mvuData);
      _.set(updated, 'stat_data', klona(data.value));
      await Mvu.replaceMvuData(updated, { type: 'message', message_id: targetId });
    } catch (e) {
      console.error('[修仙状态栏] 保存 MVU 数据失败:', e);
    }
  }

  // ─── 储物戒通用操作 ───

  /** 获取储物戒所有物品（结构化） */
  function getStorageItems(): StorageItem[] {
    return getAllStorageItems(data.value);
  }

  /** 按分类获取储物戒物品 */
  function getItemsByCategory(...categories: string[]): StorageItem[] {
    return filterByCategory(getStorageItems(), ...categories);
  }

  /** 从储物戒扣除物品（自动查找分类，精确匹配名称） */
  async function removeFromStorage(itemName: string, count: number = 1): Promise<boolean> {
    const result = removeItemByName(data.value, itemName, count);
    if (result.removed) {
      await saveData();
      return true;
    }
    return false;
  }

  /** 从指定分类扣除物品 */
  async function removeFromCategory(category: StorageCategory, itemName: string, count: number = 1): Promise<boolean> {
    const removed = removeItemFromCategory(data.value, category, itemName, count);
    if (removed) {
      await saveData();
      return true;
    }
    return false;
  }

  /** 批量扣除物品，返回成功扣除数量 */
  async function removeMultipleFromStorage(items: Array<{ name: string; count?: number }>): Promise<number> {
    let removedCount = 0;

    for (const item of items) {
      const result = removeItemByName(data.value, item.name, item.count ?? 1);
      if (result.removed) {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await saveData();
    }

    return removedCount;
  }

  /** 获取储物戒中有物品的分类列表 */
  function getStorageCategoryList(): StorageCategory[] {
    return getExistingCategories(data.value);
  }

  function updateFabPosition(x: number, y: number) {
    const clamped = clampFabPosition(x, y);
    fabPosition.value = clamped;
    saveFabPosition(clamped);
  }

  function setActiveTab(index: number) {
    activeTab.value = index;
    artsPage.value = null; // 切换TAB时重置百艺子页面
  }

  async function openArtsPage(art: ArtKey) {
    artsPage.value = art;
    // 剑心无对应变量规则，不设 _当前百艺
    // 其余百艺（包括钓鱼）统一通过 _当前百艺 触发 EJS 加载对应变量规则
    if (art !== '剑心') {
      data.value._当前百艺 = art;
    }
    await saveData();
  }

  async function closeArtsPage() {
    artsPage.value = null;
    data.value._当前百艺 = ''; // 重置当前百艺，回归基础变量规则
    await saveData();
  }

  // ─── 功法库操作 ───

  /** 获取功法库列表 */
  function getGongfaList(): GongfaEntry[] {
    return parseGongfaLibrary(data.value.$功法库);
  }

  /** 保存当前主修功法到功法库 */
  async function saveGongfaToLibrary() {
    const { 主修功法, 功法品级, 功法已修层数, 功法总层数 } = data.value;
    if (!主修功法) {
      toastr.warning('当前没有主修功法', '功法库');
      return;
    }
    const lib = getGongfaList();
    const existing = lib.findIndex(e => e.name === 主修功法);
    const entry: GongfaEntry = {
      name: 主修功法,
      grade: 功法品级,
      current: 功法已修层数,
      total: 功法总层数,
    };
    if (existing >= 0) {
      lib[existing] = entry;
    } else {
      lib.push(entry);
    }
    data.value.$功法库 = serializeGongfaLibrary(lib);
    await saveData();
    toastr.success(`已保存「${主修功法}」到功法库`, '功法库');
  }

  /** 从功法库装备功法为主修 */
  async function equipGongfaFromLibrary(gongfa: GongfaEntry) {
    // 先保存当前主修功法到功法库（如果有）
    if (data.value.主修功法) {
      const lib = getGongfaList();
      const existing = lib.findIndex(e => e.name === data.value.主修功法);
      const currentEntry: GongfaEntry = {
        name: data.value.主修功法,
        grade: data.value.功法品级,
        current: data.value.功法已修层数,
        total: data.value.功法总层数,
      };
      if (existing >= 0) {
        lib[existing] = currentEntry;
      } else {
        lib.push(currentEntry);
      }
      data.value.$功法库 = serializeGongfaLibrary(lib);
    }

    // 装备新功法
    data.value.主修功法 = gongfa.name;
    data.value.功法品级 = gongfa.grade;
    data.value.功法已修层数 = gongfa.current;
    data.value.功法总层数 = gongfa.total;

    await saveData();
    toastr.success(`已装备「${gongfa.name}」`, '功法库');
  }

  /** 从功法库删除功法 */
  async function removeGongfaFromLibrary(name: string) {
    const lib = getGongfaList().filter(e => e.name !== name);
    data.value.$功法库 = serializeGongfaLibrary(lib);
    await saveData();
    toastr.info(`已从功法库移除「${name}」`, '功法库');
  }

  // ─── 术法操作 ───

  /** 删除术法 */
  async function removeSkill(name: string) {
    const skills = data.value.习得术法;
    if (typeof skills === 'object' && name in skills) {
      delete skills[name];
      await saveData();
      toastr.info(`已遗忘术法「${name}」`, '术法');
    }
  }

  // ─── 发送剧情内容到酒馆 ───
  interface SendContentOptions {
    action: string;
    materials?: string;
    methods?: string;
    tool?: string;
    duration?: string;
    result?: string;
    extra?: string;
  }

  function sendArtContent(options: SendContentOptions): string {
    const { action, materials, methods, tool, duration, result, extra } = options;
    let content = '';
    content += action;
    if (tool) { content += `，以${tool}为引`; }
    if (materials) { content += `，取${materials}`; }
    if (methods) { content += `，施以${methods}`; }
    if (duration) { content += `，历经${duration}`; }
    if (result) { content += `。${result}`; }
    if (extra && extra.trim()) {
      if (result) { content += `。${extra.trim()}`; } else { content += `。${extra.trim()}`; }
    }
    if (result) { content += '。'; }
    return content;
  }

  // ─── 装备操作 ───
  async function equipItem(slot: EquipSlot, itemName: string) {
    const d = data.value as Record<string, unknown>;
    const 未装备Key = `未装备_${slot}`;
    const 装备Key = `_装备_${slot}`;

    const 未装备列表 = (d[未装备Key] as string) ?? '';
    const items = 未装备列表 ? 未装备列表.split('、') : [];

    const idx = items.findIndex(item => item.trim() === itemName);
    if (idx === -1) return;

    const 当前装备 = (d[装备Key] as string) ?? '';
    if (当前装备) {
      d[未装备Key] = 未装备列表 ? `${未装备列表}、${当前装备}` : 当前装备;
    }

    d[装备Key] = itemName;
    items.splice(idx, 1);
    d[未装备Key] = items.join('、');

    await saveData();
    toastr.success(`已装备「${itemName}」`, slot);
  }

  async function unequipItem(slot: EquipSlot) {
    const d = data.value as Record<string, unknown>;
    const 装备Key = `_装备_${slot}`;
    const 未装备Key = `未装备_${slot}`;

    const 当前装备 = (d[装备Key] as string) ?? '';
    if (!当前装备) return;

    const 未装备列表 = (d[未装备Key] as string) ?? '';
    d[未装备Key] = 未装备列表 ? `${未装备列表}、${当前装备}` : 当前装备;
    d[装备Key] = '';

    await saveData();
    toastr.info(`已卸下「${当前装备}」`, slot);
  }


  // 获取已学会的百艺列表（alwaysShow 的百艺始终显示，如钓鱼）
  const learnedArts = computed(() =>
    ARTS.filter(art => {
      if (art.alwaysShow) return true;
      if (!art.境界字段) return false;
      const realm = data.value[art.境界字段 as keyof Schema] as string;
      return realm && realm !== '';
    })
  );

  // ─── 生命周期 ───

  // 防抖 loadData，避免短时间内多次触发导致性能问题
  const debouncedLoadData = _.debounce(() => {
    console.info('[修仙状态栏] 防抖刷新数据');
    loadData();
  }, 800);

  waitGlobalInitialized('Mvu').then(() => {
    // 初始化加载：带重试，确保聊天记录已就绪
    const tryInitialLoad = (retries = 0) => {
      const latestId = getLastMessageId();
      if (latestId < 0 && retries < 10) {
        console.info('[修仙状态栏] 聊天记录尚未加载，500ms 后重试 (', retries + 1, '/10)');
        setTimeout(() => tryInitialLoad(retries + 1), 500);
        return;
      }
      loadData();
    };
    tryInitialLoad();

    // 打开面板时也加载一次（与 CE 脚本行为对齐，防御初始化失败）
    watch(isOpen, (open) => {
      if (open) {
        console.info('[修仙状态栏] 面板打开，重新加载数据');
        loadData();
      }
    });

    // ─── 监听酒馆消息事件 —— 确保 AI 回复/变量更新后及时刷新状态栏 ───
    // MESSAGE_RECEIVED: AI 回复完成后触发，此时 MVU 可能还在处理变量，延迟刷新
    eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      console.info('[修仙状态栏] 收到 MESSAGE_RECEIVED 事件');
      debouncedLoadData();
    });

    // GENERATION_ENDED: AI 生成结束，MVU 变量更新应已完成
    eventOn(tavern_events.GENERATION_ENDED, () => {
      console.info('[修仙状态栏] 收到 GENERATION_ENDED 事件');
      debouncedLoadData();
    });

    // MESSAGE_UPDATED: 消息被编辑/更新时刷新
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      debouncedLoadData();
    });

    // MESSAGE_SWIPED: 用户滑动消息时刷新
    eventOn(tavern_events.MESSAGE_SWIPED, () => {
      debouncedLoadData();
    });

    // ─── 监听 MVU 变量初始化事件 —— 新楼层产生时自动继承上一楼变量 ───
    eventOn(Mvu.events.VARIABLE_INITIALIZED, (variables) => {
      const statData = _.get(variables, 'stat_data');

      // 检测是否为空初始化（关键字段全为空/默认值）
      const isEmptyInit = !statData ||
        (!statData.当前境界 && !statData.灵根 && !statData.当前年纪);

      if (!isEmptyInit) return; // 已有数据，不需要继承

      // 获取最新楼层号
      const latestId = getLastMessageId();
      if (latestId <= 0) return; // 第0楼或无楼层，无法继承

      // 尝试从上一楼层读取变量
      try {
        const prevData = Mvu.getMvuData({ type: 'message', message_id: latestId - 1 });
        const prevStatData = _.get(prevData, 'stat_data');

        if (!prevStatData || (!prevStatData.当前境界 && !prevStatData.灵根)) return;

        // 将上一楼的 stat_data 深拷贝合并到当前楼层
        console.info('[修仙状态栏] 检测到空初始化，从楼层', latestId - 1, '继承变量到楼层', latestId);
        _.set(variables, 'stat_data', _.cloneDeep(prevStatData));
      } catch (e) {
        console.warn('[修仙状态栏] 变量继承失败:', e);
      }
    });

    // 监听 MVU 变量更新事件
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables) => {
      // ─── 寿元自动计算：剩余寿元 = 当前寿元 - 当前年纪 ───
      const 当前寿元 = _.get(variables, 'stat_data.当前寿元', 0) as number;
      const 当前年纪 = _.get(variables, 'stat_data.当前年纪', 0) as number;
      const 剩余寿元 = Math.max(0, 当前寿元 - 当前年纪);
      _.set(variables, 'stat_data._剩余寿元', 剩余寿元);

      // ─── 寿元状态计算 ───
      if (当前寿元 > 0) {
        const pct = 剩余寿元 / 当前寿元;
        if (剩余寿元 <= 0) {
          _.set(variables, 'stat_data._寿元状态', '寿终正寝');
          _.set(variables, 'stat_data._轮回状态', '轮回中');
          console.warn('[修仙状态栏] 寿元耗尽，触发轮回');
        } else if (pct <= 0.05) {
          _.set(variables, 'stat_data._寿元状态', '油尽灯枯');
        } else if (pct <= 0.15) {
          _.set(variables, 'stat_data._寿元状态', '灵力枯竭');
        } else if (pct <= 0.3) {
          _.set(variables, 'stat_data._寿元状态', '衰老初期');
        } else {
          _.set(variables, 'stat_data._寿元状态', '正常');
          _.set(variables, 'stat_data._轮回状态', '正常');
        }
      }

      // ─── 功法库同步：AI更新主修功法时自动同步到功法库 ───
      const 主修功法 = _.get(variables, 'stat_data.主修功法', '') as string;
      const 功法品级 = _.get(variables, 'stat_data.功法品级', '') as string;
      const 功法已修层数 = _.get(variables, 'stat_data.功法已修层数', 0) as number;
      const 功法总层数 = _.get(variables, 'stat_data.功法总层数', 0) as number;
      if (主修功法) {
        const rawLib = _.get(variables, 'stat_data.$功法库', '') as string;
        const lib = parseGongfaLibrary(rawLib);
        const idx = lib.findIndex(e => e.name === 主修功法);
        const entry: GongfaEntry = { name: 主修功法, grade: 功法品级, current: 功法已修层数, total: 功法总层数 };
        if (idx >= 0) {
          lib[idx] = entry;
        } else {
          lib.push(entry);
        }
        _.set(variables, 'stat_data.$功法库', serializeGongfaLibrary(lib));
      }

      // ─── 百艺学习：消费习得百艺信号 ───
      const 习得 = _.get(variables, 'stat_data.习得百艺', '') as string;
      if (习得 && 习得 !== '') {
        const 入门映射: Record<string, { field: string; value: string }> = {
          '炼丹': { field: '丹道境界', value: '炼精化气' },
          '炼器': { field: '炼器境界', value: '锻器入门' },
          '阵法': { field: '阵法境界', value: '阵道入门' },
          '符箓': { field: '符箓境界', value: '符道入门' },
          '驭兽': { field: '驭兽境界', value: '驭兽入门' },
          '医术': { field: '医术境界', value: '医道入门' },
          '傀儡术': { field: '傀儡术境界', value: '傀儡入门' },
          '种植采药': { field: '种植采药境界', value: '草药入门' },
        };
        const mapping = 入门映射[习得];
        if (mapping) {
          const current = _.get(variables, 'stat_data.' + mapping.field, '') as string;
          if (!current) {
            _.set(variables, 'stat_data.' + mapping.field, mapping.value);
            console.info('[修仙状态栏] 习得百艺:', 习得, '->', mapping.value);
            toastr.success('习得百艺·' + 习得, '恭喜');
          }
        }
        // 消费：清空习得百艺
        _.set(variables, 'stat_data.习得百艺', '');
      }

      // 延迟加载，确保 MVU 写入完成
      setTimeout(() => loadData(), 500);
    });

    // 10s 轮询兜底（主要靠事件驱动，轮询作为最后保障）
    useIntervalFn(() => {
      loadData();
    }, 10000);
  });

  return {
    data,
    isOpen,
    activeTab,
    fabPosition,
    artsPage,
    tabs,
    currentTab,
    境界显示,
    大境界,
    小境界,
    突破类型,
    寿元百分比,
    寿元状态颜色,
    灵石总量,
    钓鱼成功率,
    修炼状态颜色,
    道途颜色,
    learnedArts,
    theme,
    toggleTheme,
    loadData,
    saveData,
    updateFabPosition,
    setActiveTab,
    openArtsPage,
    closeArtsPage,
    equipItem,
    unequipItem,
    sendArtContent,
    // 储物戒操作
    getStorageItems,
    getItemsByCategory,
    removeFromStorage,
    removeFromCategory,
    removeMultipleFromStorage,
    getStorageCategoryList,
    // 功法库操作
    getGongfaList,
    saveGongfaToLibrary,
    equipGongfaFromLibrary,
    removeGongfaFromLibrary,
    // 术法操作
    removeSkill,
  };
});
