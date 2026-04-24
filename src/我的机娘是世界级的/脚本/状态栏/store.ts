import { Schema } from '../../schema';

// ─── 常量 ───
const FAB_STORAGE_KEY = 'mech-girl-statusbar-fab';
const AVATAR_STORAGE_KEY = 'mech-girl-driver-avatar';
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

// ─── 头像持久化 ───
function readAvatar(): string | null {
  try {
    return window.parent.localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch { return null; }
}

function saveAvatar(data: string | null) {
  try {
    if (data) {
      window.parent.localStorage.setItem(AVATAR_STORAGE_KEY, data);
    } else {
      window.parent.localStorage.removeItem(AVATAR_STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

// ─── 五维维度类型 ───
export type DimensionKey = '加速度' | '极速' | '操控' | '漂移' | '耐久';
export const DIMENSIONS: DimensionKey[] = ['加速度', '极速', '操控', '漂移', '耐久'];
export const DIM_ABBR: Record<DimensionKey, string> = {
  加速度: 'ACC',
  极速: 'SPD',
  操控: 'HDL',
  漂移: 'DFT',
  耐久: 'END',
};

// ─── 最终五维计算 ───
export type FinalStats = Record<DimensionKey, { base: number; final: number; diff: number }>;

/**
 * 计算机娘装备改装件后的最终五维
 * base: 原始值, final: 加成后的值(clamp 0~100), diff: 差值
 */
export function computeFinalStats(mech: {
  五维: Record<DimensionKey, number>;
  改装插槽: {
    槽位1: { 增益维度: string; 增益值: number; 代价维度: string; 代价值: number } | null;
    槽位2: { 增益维度: string; 增益值: number; 代价维度: string; 代价值: number } | null;
    槽位3: { 增益维度: string; 增益值: number; 代价维度: string; 代价值: number } | null;
  };
}): FinalStats {
  // 从基础五维开始
  const result: FinalStats = {} as FinalStats;
  for (const dim of DIMENSIONS) {
    result[dim] = { base: mech.五维[dim], final: mech.五维[dim], diff: 0 };
  }

  // 遍历三个槽位，累计增益和代价
  for (const slotKey of ['槽位1', '槽位2', '槽位3'] as const) {
    const mod = mech.改装插槽[slotKey];
    if (!mod) continue;

    // 增益
    if (mod.增益维度 && DIMENSIONS.includes(mod.增益维度 as DimensionKey)) {
      result[mod.增益维度 as DimensionKey].final += mod.增益值;
    }
    // 代价
    if (mod.代价值 > 0 && mod.代价维度 && DIMENSIONS.includes(mod.代价维度 as DimensionKey)) {
      result[mod.代价维度 as DimensionKey].final -= mod.代价值;
    }
  }

  // clamp 到 0~100 并计算 diff
  for (const dim of DIMENSIONS) {
    result[dim].final = _.clamp(result[dim].final, 0, 100);
    result[dim].diff = result[dim].final - result[dim].base;
  }

  return result;
}

// ─── 状态类型 ───
export type GameState = '日常' | '赛前准备' | '比赛中';

// ─── TAB 配置 ───
export const STATE_TABS: Record<GameState, string[]> = {
  '日常': ['仪表盘', '机娘库', '改装', '车手'],
  '赛前准备': ['备战', '搭档机娘', '改装'],
  '比赛中': ['赛况', '搭档', '对手'],
};

// ─── Store ───
export const useStatusStore = defineStore('mech-status', () => {
  // MVU 数据
  const data = ref<z.output<typeof Schema>>(Schema.parse({}));

  // UI 状态
  const isOpen = ref(false);
  const activeTab = ref(0);
  const currentMechIndex = ref(0);

  // FAB 位置
  const fabPosition = ref(clampFabPosition(
    ...((() => {
      const saved = readFabPosition();
      const pos = saved ?? defaultFabPosition();
      return [pos.x, pos.y] as [number, number];
    })()),
  ));

  // 头像
  const avatarData = ref<string | null>(readAvatar());

  // ─── 计算属性 ───
  const gameState = computed<GameState>(() => data.value.世界.当前状态);
  const tabs = computed(() => STATE_TABS[gameState.value]);

  const mechNames = computed(() => Object.keys(data.value.机娘库));
  const currentMechName = computed(() => mechNames.value[currentMechIndex.value] ?? null);
  const currentMech = computed(() => {
    const name = currentMechName.value;
    return name ? data.value.机娘库[name] : null;
  });
  const mechCount = computed(() => mechNames.value.length);

  const partnerMechName = computed(() => data.value.当前比赛.搭档机娘);
  const partnerMech = computed(() => {
    const name = partnerMechName.value;
    return name ? data.value.机娘库[name] ?? null : null;
  });

  // ─── 改件仓库 ───
  const warehouse = computed(() => data.value.主角.改件仓库);

  // 当前状态是否允许改装操作
  const canModify = computed(() => gameState.value === '日常' || gameState.value === '赛前准备');

  // 获取指定机娘名（日常用 currentMechName，赛前/比赛用 partnerMechName）
  const modTargetName = computed(() => {
    if (gameState.value === '日常') return currentMechName.value;
    return partnerMechName.value;
  });
  const modTargetMech = computed(() => {
    const name = modTargetName.value;
    return name ? data.value.机娘库[name] ?? null : null;
  });

  // ─── 方法 ───
  function loadData() {
    try {
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: -1 });
      const statData = _.get(mvuData, 'stat_data');
      if (statData) {
        data.value = Schema.parse(statData);
      }
    } catch (e) {
      console.warn('[状态栏] 读取 MVU 数据失败:', e);
    }
  }

  // 保存数据到最新楼层 MVU 变量
  async function saveData() {
    try {
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: -1 });
      const updated = _.cloneDeep(mvuData);
      _.set(updated, 'stat_data', klona(data.value));
      await Mvu.replaceMvuData(updated, { type: 'message', message_id: -1 });
    } catch (e) {
      console.error('[状态栏] 保存 MVU 数据失败:', e);
    }
  }

  // 安装改装件：仓库 → 槽位
  async function installMod(warehouseIndex: number, slotKey: '槽位1' | '槽位2' | '槽位3') {
    const mech = modTargetMech.value;
    if (!mech || !canModify.value) return;

    const mod = data.value.主角.改件仓库[warehouseIndex];
    if (!mod) return;

    // 如果槽位已有改装件，先拆回仓库
    const existing = mech.改装插槽[slotKey];
    if (existing) {
      data.value.主角.改件仓库.push(existing);
    }

    // 安装新件
    mech.改装插槽[slotKey] = mod;
    data.value.主角.改件仓库.splice(warehouseIndex, 1);

    await saveData();
    toastr.success(`已安装「${mod.名称}」到${slotKey}`, modTargetName.value ?? '');
  }

  // 拆卸改装件：槽位 → 仓库
  async function uninstallMod(slotKey: '槽位1' | '槽位2' | '槽位3') {
    const mech = modTargetMech.value;
    if (!mech || !canModify.value) return;

    const mod = mech.改装插槽[slotKey];
    if (!mod) return;

    data.value.主角.改件仓库.push(mod);
    mech.改装插槽[slotKey] = null;

    await saveData();
    toastr.info(`已拆卸「${mod.名称}」`, modTargetName.value ?? '');
  }

  function updateFabPosition(x: number, y: number) {
    const clamped = clampFabPosition(x, y);
    fabPosition.value = clamped;
    saveFabPosition(clamped);
  }

  function setActiveTab(index: number) {
    activeTab.value = index;
  }

  function prevMech() {
    if (currentMechIndex.value > 0) {
      currentMechIndex.value--;
    }
  }

  function nextMech() {
    if (currentMechIndex.value < mechNames.value.length - 1) {
      currentMechIndex.value++;
    }
  }

  function setAvatar(base64: string | null) {
    avatarData.value = base64;
    saveAvatar(base64);
  }

  // 切换状态时重置 tab
  watch(gameState, () => {
    activeTab.value = 0;
  });

  // 初始加载
  loadData();

  // 监听 MVU 变量更新事件
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
    loadData();
  });

  // 5s 轮询兜底
  useIntervalFn(() => {
    loadData();
  }, 5000);

  return {
    data,
    isOpen,
    activeTab,
    currentMechIndex,
    fabPosition,
    avatarData,
    gameState,
    tabs,
    mechNames,
    currentMechName,
    currentMech,
    mechCount,
    partnerMechName,
    partnerMech,
    warehouse,
    canModify,
    modTargetName,
    modTargetMech,
    loadData,
    saveData,
    updateFabPosition,
    setActiveTab,
    prevMech,
    nextMech,
    setAvatar,
    installMod,
    uninstallMod,
  };
});
