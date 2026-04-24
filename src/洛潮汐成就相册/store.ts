import { CHAPTERS, ACHIEVEMENT_MAP, TOTAL_ACHIEVEMENTS } from './achievements';

const FAB_STORAGE_KEY = 'luo-chaoxi-album-fab-pos';
const EDGE_GAP = 12;
const FAB_SIZE = 56;

function readFabPosition(): { x: number; y: number } | null {
  try {
    const raw = window.parent.localStorage.getItem(FAB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveFabPosition(pos: { x: number; y: number }) {
  try {
    window.parent.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

function clampFabPosition(x: number, y: number): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  const vh = window.parent.innerHeight;
  return {
    x: Math.min(Math.max(EDGE_GAP, x), Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: Math.min(Math.max(EDGE_GAP, y), Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

function defaultFabPosition(): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  const vh = window.parent.innerHeight;
  return { x: vw - FAB_SIZE - 20, y: vh - FAB_SIZE - 20 };
}

export const useAchievementStore = defineStore('achievement-album', () => {
  // 已解锁的成就ID集合
  const unlockedIds = ref<Set<string>>(new Set());

  // 当前选中的篇章
  const activeChapter = ref(CHAPTERS[0].prefix);

  // 是否展开相册
  const isOpen = ref(false);

  // 查看大图的成就ID
  const viewingId = ref<string | null>(null);

  // 悬浮按钮位置
  const fabPosition = ref(clampFabPosition(
    ...((() => {
      const saved = readFabPosition();
      const pos = saved ?? defaultFabPosition();
      return [pos.x, pos.y] as [number, number];
    })()),
  ));

  function updateFabPosition(x: number, y: number) {
    const clamped = clampFabPosition(x, y);
    fabPosition.value = clamped;
    saveFabPosition(clamped);
  }

  // 从 MVU 变量中读取成就数据
  function loadAchievements() {
    try {
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: -1 });
      const achievements: Record<string, any> = _.get(mvuData, 'stat_data.成就', {});
      const newSet = new Set(Object.keys(achievements));
      // 只在数据有变化时更新，避免不必要的响应式触发
      if (newSet.size !== unlockedIds.value.size || ![...newSet].every(id => unlockedIds.value.has(id))) {
        unlockedIds.value = newSet;
      }
    } catch {
      // 没有数据时保持空集合
      if (unlockedIds.value.size > 0) {
        unlockedIds.value = new Set();
      }
    }
  }

  // 初始加载
  loadAchievements();

  // 监听 MVU 变量更新事件，实时同步成就
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
    loadAchievements();
  });

  // 定时轮询作为兜底（每5秒），防止事件丢失
  useIntervalFn(() => {
    loadAchievements();
  }, 5000);

  // 计算属性
  const totalUnlocked = computed(() => unlockedIds.value.size);

  const progressPercent = computed(() =>
    TOTAL_ACHIEVEMENTS > 0 ? (totalUnlocked.value / TOTAL_ACHIEVEMENTS) * 100 : 0,
  );

  // 各篇章解锁数
  const chapterProgress = computed(() => {
    const result: Record<string, { unlocked: number; total: number }> = {};
    for (const chapter of CHAPTERS) {
      const entries = ACHIEVEMENT_MAP[chapter.prefix] || [];
      const unlocked = entries.filter(e => unlockedIds.value.has(e.id)).length;
      result[chapter.prefix] = { unlocked, total: entries.length };
    }
    return result;
  });

  // 判断是否解锁
  function isUnlocked(id: string): boolean {
    return unlockedIds.value.has(id);
  }

  return {
    unlockedIds,
    activeChapter,
    isOpen,
    viewingId,
    fabPosition,
    totalUnlocked,
    progressPercent,
    chapterProgress,
    isUnlocked,
    loadAchievements,
    updateFabPosition,
  };
});
