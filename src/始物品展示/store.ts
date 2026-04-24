import type { ItemData } from './schema';
import { ROOM_INFO } from './items';

const FAB_STORAGE_KEY = 'hajime-items-fab-pos';
const EDGE_GAP = 12;
const FAB_SIZE = 48;

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
    x: _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

function defaultFabPosition(): { x: number; y: number } {
  const vw = window.parent.innerWidth;
  return { x: vw - FAB_SIZE - 20, y: 120 };
}

export const useItemStore = defineStore('hajime-items', () => {
  // UI 状态
  const isOpen = ref(false);
  const activeTab = ref<'scene' | 'inventory'>('scene');
  const viewingItem = ref<ItemData | null>(null);

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

  // 从 MVU 变量中读取的数据
  const currentRoom = ref('第一层·起始之间');
  const sceneItems = ref<ItemData[]>([]);
  const playerItems = ref<ItemData[]>([]);

  // 加载变量数据
  function loadData() {
    try {
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: -1 });
      const statData = _.get(mvuData, 'stat_data');
      if (!statData) return;

      const room = _.get(statData, '当前房间', '第一层·起始之间');
      const scene: ItemData[] = _.get(statData, '场景物品', []);
      const player: ItemData[] = _.get(statData, '主角.持有物品', []);

      currentRoom.value = room;
      sceneItems.value = scene;
      playerItems.value = player;
    } catch {
      // 没有数据时保持默认
    }
  }

  // 初始加载
  loadData();

  // 监听 MVU 变量更新事件
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
    loadData();
  });

  // 定时轮询兜底
  useIntervalFn(() => {
    loadData();
  }, 3000);

  // 计算属性
  const roomInfo = computed(() => ROOM_INFO[currentRoom.value] ?? {
    name: currentRoom.value,
    color: '#7eb8c9',
  });

  const totalSceneItems = computed(() => sceneItems.value.length);
  const totalPlayerItems = computed(() => playerItems.value.length);
  const totalItems = computed(() => totalSceneItems.value + totalPlayerItems.value);

  const currentItems = computed(() =>
    activeTab.value === 'scene' ? sceneItems.value : playerItems.value,
  );

  return {
    isOpen,
    activeTab,
    viewingItem,
    fabPosition,
    updateFabPosition,
    currentRoom,
    sceneItems,
    playerItems,
    roomInfo,
    totalSceneItems,
    totalPlayerItems,
    totalItems,
    currentItems,
    loadData,
  };
});
