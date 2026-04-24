
<template>
  <div class="mech-mobile-root relative font-sans text-slate-200" :style="rootStyle">
    <!-- 剧情视图 -->
    <div v-if="ui.currentView === 'story'" class="absolute inset-0 flex flex-col" style="background: #060a13;">
      <div class="flex h-11 shrink-0 items-center px-4" style="background: #0c1120; border-bottom: 1px solid rgba(99,130,255,0.15);">
        <span class="text-xs font-bold tracking-widest" style="color: #64748b;">MECH GIRL</span>
        <span class="ml-auto rounded px-2 py-0.5 text-[10px] font-bold" :class="stateClasses">{{ data.世界._当前状态 }}</span>
      </div>
      <div class="m-story-body flex-1 overflow-y-auto px-4 py-5">
        <div class="text-sm leading-[1.9]" v-html="storyHtml"></div>
      </div>
      <!-- 自定义输入框 -->
      <MobileChatInput />
    </div>

    <!-- 操作视图 -->
    <div v-else class="absolute inset-0 flex flex-col" style="background: #060a13;">
      <!-- 顶栏 -->
      <div class="flex h-11 shrink-0 items-center gap-3 px-3.5" style="background: #0c1120; border-bottom: 1px solid rgba(99,130,255,0.15);">
        <span class="text-xs font-extrabold tracking-widest" style="color: #818cf8;">MG</span>
        <div class="flex items-center gap-1 text-xs">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 opacity-60" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2 2"/></svg>
          <span class="font-bold" style="color: #fbbf24;">{{ data.主角.$信用点数.toLocaleString() }}</span>
        </div>
        <div class="flex items-center gap-1 text-xs">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 opacity-60" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
          <span class="font-bold" style="color: #06b6d4;">{{ data.主角.$强化点数 }}</span>
        </div>
        <span class="ml-auto rounded px-2 py-0.5 text-[10px] font-bold" :class="stateClasses">{{ data.世界._当前状态 }}</span>
      </div>

      <!-- 内容区 -->
      <div class="m-content flex-1 overflow-y-auto px-3.5 pt-4" style="padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));">
        <!-- 总览 Tab -->
        <template v-if="ui.activeTab === 'home'">
          <div class="m-panel-title">总览</div>
          <div class="mb-3 grid grid-cols-3 gap-2">
            <div class="m-ov-card"><div class="text-xl font-extrabold" style="color: #fbbf24;">{{ data.主角.$信用点数.toLocaleString() }}</div><div class="mt-0.5 text-[10px]" style="color: #64748b;">信用</div></div>
            <div class="m-ov-card"><div class="text-xl font-extrabold" style="color: #06b6d4;">{{ data.主角.$强化点数 }}</div><div class="mt-0.5 text-[10px]" style="color: #64748b;">强化</div></div>
            <div class="m-ov-card"><div class="text-xl font-extrabold" style="color: #818cf8;">{{ data.主角._赛事等级 }}</div><div class="mt-0.5 text-[10px]" style="color: #64748b;">赛事</div></div>
          </div>
          <!-- 机娘卡片 -->
          <div v-if="firstMechName" class="m-card">
            <div class="mb-2 text-xs font-bold">当前搭档</div>
            <div class="flex items-center gap-2.5">
              <div class="m-avatar"><svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#fff" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg></div>
              <div class="flex-1">
                <div class="text-sm font-semibold">{{ firstMechName }}</div>
                <div class="text-[11px]" style="color: #64748b;">{{ firstMech?._赛车型号 }}</div>
              </div>
              <span class="m-badge-green">{{ firstMech?.状态 }}</span>
            </div>
          </div>
          <!-- 五维 -->
          <div v-if="firstMech" class="m-card">
            <div class="mb-2 text-xs font-bold">五维数据</div>
            <div v-for="dim in dimensions" :key="dim.key" class="mb-1 flex items-center gap-1.5">
              <span class="w-7 text-right text-[10px] font-semibold" style="color: #64748b;">{{ dim.label }}</span>
              <div class="h-[5px] flex-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.05);">
                <div class="h-full rounded-full" :class="'bar-' + dim.barClass" :style="{ width: Math.min(firstMech._五维[dim.key], 100) + '%' }"></div>
              </div>
              <span class="w-8 text-right text-[11px] font-bold">{{ formatValue(firstMech._五维[dim.key]) }}</span>
            </div>
            <div class="mt-1.5 text-[10px]" style="color: #64748b;">
              天赋：{{ firstMech._天赋维度.join('、') || '未知' }}
              <span v-if="firstMech.共鸣._已激活"> · 共鸣：<span style="color: #06b6d4;">{{ firstMech.共鸣._技能名 }}</span></span>
            </div>
          </div>
        </template>

        <!-- 商店 Tab -->
        <template v-else-if="ui.activeTab === 'shop'">
          <div class="m-panel-title">商店</div>
          <div class="mb-3 flex gap-1.5">
            <button v-for="tab in shopTabs" :key="tab"
              class="rounded-md border px-3 py-1 text-[11px] font-semibold"
              :class="shopTab === tab ? 'border-[rgba(99,130,255,0.5)] text-[#818cf8]' : 'border-[rgba(99,130,255,0.15)] text-[#64748b]'"
              :style="shopTab === tab ? 'background: rgba(99,102,241,0.15);' : 'background: #1a2236;'"
              @click="shopTab = tab"
            >{{ tab }}</button>
          </div>
          <div class="space-y-1.5">
            <div v-for="item in filteredShopItems" :key="item.id" class="m-card flex items-center gap-2.5" :class="{ 'opacity-50': !isShopItemUnlocked(item) }">
              <div class="m-shop-icon">
                <svg viewBox="0 0 24 24" class="h-4 w-4">
                  <polyline v-if="item.category === 'enhance'" points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polygon v-else points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs font-semibold">{{ item.name }}</div>
                <div class="truncate text-[10px]" style="color: #64748b;">{{ item.description }}</div>
              </div>
              <div class="shrink-0 text-right">
                <div class="text-[11px] font-bold" style="color: #fbbf24;">{{ item.price.toLocaleString() }}</div>
                <button v-if="!isShopItemUnlocked(item)" class="m-btn-locked" disabled>{{ item.unlockTier }}+</button>
                <button v-else-if="data.主角.$信用点数 < item.price" class="m-btn-locked" disabled>不足</button>
                <button v-else class="m-btn-buy" @click="buyShopItem(item)">购买</button>
              </div>
            </div>
            <div v-if="!filteredShopItems.length" class="py-6 text-center text-xs" style="color: #64748b;">暂无商品</div>
          </div>
        </template>

        <!-- 赛事 Tab -->
        <template v-else-if="ui.activeTab === 'race'">
          <div class="m-panel-title">赛事</div>
          <!-- 赛前准备：开始比赛按钮 -->
          <div v-if="data.世界._当前状态 === '赛前准备'" class="text-center">
            <div class="mb-2 text-xs" style="color: #64748b;">{{ data.当前比赛._赛事级别 }} {{ data.当前比赛._赛事类型 }}</div>
            <button class="m-btn-race-start" @click="onStartRace">
              <svg viewBox="0 0 24 24" class="mr-1.5 h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              开始比赛
            </button>
          </div>
          <!-- 比赛中 -->
          <div v-else-if="data.世界._当前状态 === '比赛中'" class="text-center text-xs" style="color: #64748b;">比赛进行中，切换到比赛Tab查看</div>
          <!-- 日常：报名 -->
          <template v-else>
            <div class="mb-3 flex flex-wrap gap-1.5">
              <button v-for="t in allTiers" :key="t" class="m-tier-btn" :class="{ active: enrollTier === t, locked: !isTierOpen(t) }" :disabled="!isTierOpen(t)" @click="enrollTier = t">{{ t }}</button>
            </div>
            <div class="mb-3 flex flex-wrap gap-1.5">
              <button v-for="rt in availableRaceTypes" :key="rt" class="m-type-btn" :class="{ active: enrollType === rt }" @click="enrollType = rt">{{ rt }}</button>
            </div>
            <div v-if="firstMechName" class="mb-3 rounded-lg p-3" style="background: #0c1120;">
              <div class="flex justify-between text-[11px]">
                <span style="color: #64748b;">点数</span>
                <span class="font-bold" :style="{ color: enrollTotal > enrollLimit.totalPoints ? '#ef4444' : '#10b981' }">{{ enrollTotal }}/{{ enrollLimit.totalPoints }}</span>
              </div>
              <div class="mt-2 space-y-2">
                <div v-for="dim in dimensions" :key="dim.key" class="flex items-center gap-2">
                  <span class="w-7 text-[10px]" style="color: #64748b;">{{ dim.label }}</span>
                  <input type="range" :min="0" :max="getEnrollMax(dim.key)" v-model.number="enrollStats[dim.key]" class="m-slider flex-1" />
                  <span class="w-6 text-right text-[11px] font-bold">{{ enrollStats[dim.key] }}</span>
                </div>
              </div>
            </div>
            <button class="m-btn-enroll w-full" :disabled="!canEnroll" @click="doEnroll">确认报名（{{ enrollFee.toLocaleString() }} CR）</button>
          </template>
        </template>

        <!-- 强化 Tab -->
        <template v-else-if="ui.activeTab === 'enhance'">
          <div class="m-panel-title">强化 · {{ firstMechName || '未选择' }}</div>
          <div v-if="firstMech" class="space-y-2">
            <div v-for="dim in dimensions" :key="dim.key" class="m-card">
              <div class="flex items-center gap-3">
                <div class="text-center">
                  <div class="text-[10px]" style="color: #64748b;">{{ dim.label }}</div>
                  <div class="text-lg font-extrabold" :style="{ color: dim.color }">{{ formatValue(firstMech._五维[dim.key]) }}</div>
                </div>
                <div class="h-1.5 flex-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.05);">
                  <div class="h-full rounded-full" :class="'bar-' + dim.barClass" :style="{ width: Math.min(firstMech._五维[dim.key], 100) + '%' }"></div>
                </div>
                <span v-if="firstMech._天赋维度.includes(dim.key)" class="m-badge-gold">天赋</span>
                <span v-else class="m-badge-blue">普通</span>
              </div>
              <div class="mt-1.5 flex items-center justify-between text-[10px]" style="color: #475569;">
                <span>成功率：{{ getPreviewRate(dim.key) }}</span>
                <button v-if="firstMech._五维[dim.key] >= 100.9" class="m-btn-locked" disabled>已满</button>
                <button v-else class="m-btn-buy" @click="openEnhance(dim.key)">强化</button>
              </div>
            </div>
          </div>
          <div v-else class="py-6 text-center text-xs" style="color: #64748b;">未找到机娘</div>
        </template>

        <!-- 比赛 Tab -->
        <template v-else-if="ui.activeTab === 'live'">
          <div class="m-panel-title">比赛实况</div>
          <template v-if="data.当前比赛._赛事名称">
            <div class="mb-3 flex items-center justify-between">
              <div><div class="text-[10px]" style="color: #64748b;">排名</div><div class="text-4xl font-black" style="color: #fbbf24;">P{{ data.当前比赛.当前排名 }}</div></div>
              <div class="text-center"><div class="text-[10px]" style="color: #64748b;">{{ data.当前比赛._赛事名称 }}</div><div class="mt-0.5 text-[13px] font-bold">{{ data.当前比赛._赛事级别 }} {{ data.当前比赛._赛事类型 }}</div></div>
              <div class="text-right"><div class="text-[13px]">圈 <span class="font-bold" style="font-size: 16px;">{{ data.当前比赛.当前圈数 }}</span>/{{ data.当前比赛.总圈数 }}</div></div>
            </div>
            <!-- 共鸣值 -->
            <div v-if="partnerMech" class="mb-3 rounded-lg p-3" style="background: #1a2236; border: 1px solid rgba(6,182,212,0.2);">
              <div class="flex items-center justify-between text-[11px]">
                <span style="color: #06b6d4;">共鸣值</span>
                <span class="font-bold" style="color: #06b6d4;">{{ partnerMech.共鸣.当前共鸣值 }}/{{ partnerMech.共鸣._共鸣上限 }}</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full" style="background: rgba(6,182,212,0.1);">
                <div class="h-full rounded-full" style="background: linear-gradient(90deg, #06b6d4, #22d3ee);" :style="{ width: (partnerMech.共鸣.当前共鸣值 / partnerMech.共鸣._共鸣上限 * 100) + '%' }"></div>
              </div>
            </div>
            <!-- 对手 -->
            <div v-for="(opp, oppName) in data.当前比赛.对手" :key="oppName" class="m-opp-row">
              <div class="m-opp-rank" :class="getRankClass(opp.当前排名)">{{ opp.当前排名 }}</div>
              <div class="flex-1"><div class="text-xs font-semibold">{{ opp.车手名 }}</div><div class="text-[10px]" style="color: #64748b;">{{ opp.机娘名 }}</div></div>
            </div>
            <!-- 结束比赛 -->
            <button v-if="data.世界._当前状态 === '比赛中'" class="m-btn-end mt-3 w-full" @click="doEndRace">结束比赛（结算）</button>
          </template>
          <div v-else class="py-6 text-center text-xs" style="color: #64748b;">当前没有进行中的比赛</div>
        </template>
      </div>

      <!-- 底部 Tab 栏 -->
      <div class="m-tabbar">
        <div v-for="tab in tabs" :key="tab.id" class="m-tab" :class="{ active: ui.activeTab === tab.id }" @click="ui.setTab(tab.id)">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <svg viewBox="0 0 24 24" class="h-[22px] w-[22px]" v-html="tab.icon"></svg>
          <span>{{ tab.label }}</span>
        </div>
      </div>
    </div>

    <!-- 视图切换 FAB -->
    <button
      class="absolute z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all hover:scale-110"
      style="bottom: 72px; right: 16px; border: 2px solid rgba(99,130,255,0.5); background: rgba(17,24,39,0.95); backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(99,102,241,0.3);"
      @click="ui.toggleView()"
    >
      <svg v-if="ui.currentView === 'story'" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round">
        <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDataStore, useUIStore } from './store';
import { cleanMessageText, textToStoryHtml } from '../utils';

// ---- 安全高度适配（浏览器全屏，非手机全屏） ----
const hostWindow = window.parent;
const safeHeight = ref(hostWindow.innerHeight);

function updateSafeHeight() {
  const vv = (hostWindow as any).visualViewport;
  safeHeight.value = vv ? vv.height : hostWindow.innerHeight;
}

onMounted(() => {
  hostWindow.addEventListener('resize', updateSafeHeight);
  updateSafeHeight();
  const vv = (hostWindow as any).visualViewport;
  if (vv) vv.addEventListener('resize', updateSafeHeight);
});

onUnmounted(() => {
  hostWindow.removeEventListener('resize', updateSafeHeight);
  const vv = (hostWindow as any).visualViewport;
  if (vv) vv.removeEventListener('resize', updateSafeHeight);
});

const rootStyle = computed(() => ({
  width: '100%',
  height: safeHeight.value + 'px',
  maxWidth: '430px',
  margin: '0 auto',
  position: 'relative' as const,
}));
import { ENHANCE_ITEMS, SKIN_ITEMS, SKILL_ITEMS, isUnlocked, type ShopItem, type Tier } from '../PC版/panels/shopData';
import { calculateSuccessRate, calculateCreditCost, performEnhance } from '../PC版/panels/enhance';
import { TIER_LIMITS, ENROLL_FEE, AVAILABLE_RACE_TYPES, isTierUnlocked, getStatMax, performEnroll, startRace, endRace } from '../PC版/panels/enrollLogic';
import { settleRace } from '../PC版/panels/raceSettle';
import { sendUserMessage, narrateEnhanceResult, sendEnrollNormal, sendRaceStart, sendRaceEnd } from '../PC版/aiInteraction';
import type { Quality } from '../PC版/panels/shopData';
import MobileChatInput from './MobileChatInput.vue';

const dataStore = useDataStore();
const ui = useUIStore();
const data = computed(() => dataStore.data);

const dimensions = [
  { key: '加速度' as const, label: 'ACC', color: '#ef4444', barClass: 'acc' },
  { key: '极速' as const, label: 'SPD', color: '#f59e0b', barClass: 'spd' },
  { key: '操控' as const, label: 'HDL', color: '#06b6d4', barClass: 'hdl' },
  { key: '漂移' as const, label: 'DFT', color: '#8b5cf6', barClass: 'dft' },
  { key: '耐久' as const, label: 'END', color: '#10b981', barClass: 'end' },
];

type Dim = '加速度' | '极速' | '操控' | '漂移' | '耐久';

const storyHtml = computed(() => {
  try {
    const msgs = getChatMessages(getCurrentMessageId());
    if (msgs.length > 0) {
      const cleaned = cleanMessageText(msgs[0].message);
      if (cleaned) return textToStoryHtml(cleaned);
    }
  } catch { /* ignore */ }
  return '<p style="color: #64748b;">等待剧情加载...</p>';
});

const firstMechName = computed(() => Object.keys(data.value.机娘库)[0] ?? null);
const firstMech = computed(() => firstMechName.value ? data.value.机娘库[firstMechName.value] : null);
const partnerMech = computed(() => {
  const name = data.value.当前比赛._搭档机娘;
  return name ? data.value.机娘库[name] ?? null : null;
});

const stateClasses = computed(() => {
  const s = data.value.世界._当前状态;
  if (s === '日常') return 'bg-emerald-500/15 text-emerald-400';
  if (s === '赛前准备') return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
});

function formatValue(v: number): string {
  return v >= 100 ? v.toFixed(1) : String(Math.floor(v));
}

function getRankClass(rank: number): string {
  if (rank === 1) return 'r1';
  if (rank === 2) return 'r2';
  if (rank === 3) return 'r3';
  return '';
}

// ---- 商店 ----
const shopTabs = ['强化物品', '外形改件', '技能改件'];
const shopTab = ref('强化物品');
const filteredShopItems = computed<ShopItem[]>(() => {
  if (shopTab.value === '强化物品') return ENHANCE_ITEMS;
  if (shopTab.value === '外形改件') return SKIN_ITEMS;
  return SKILL_ITEMS;
});

function isShopItemUnlocked(item: ShopItem): boolean {
  return isUnlocked(item.unlockTier, data.value.主角._赛事等级 as Tier);
}

function buyShopItem(item: ShopItem) {
  if (data.value.主角.$信用点数 < item.price) return;
  data.value.主角.$信用点数 -= item.price;
  if (item.category === 'enhance' && item.dimension) {
    const cur = data.value.主角.$改件仓库.强化物品[item.id] ?? 0;
    data.value.主角.$改件仓库.强化物品[item.id] = cur + 1;
  } else if (item.category === 'skin') {
    data.value.主角.$改件仓库.外形改件.push({ 名称: item.name, 类型: item.type as any, 描述: item.description });
  } else if (item.category === 'skill' && item.effectDirection) {
    data.value.主角.$改件仓库.技能改件.push({ 名称: item.name, 效果方向: item.effectDirection, 描述: item.description, 是否黑市: item.isBlackMarket ?? false });
  }
  toastr.success(`已购买「${item.name}」`, '购买成功');
}

// ---- 强化 ----
function getPreviewRate(dim: Dim): string {
  if (!firstMech.value) return '-';
  const total = Object.values(firstMech.value._五维).reduce((s, v) => s + v, 0);
  const rate = calculateSuccessRate(firstMech.value._五维[dim], firstMech.value._天赋维度.includes(dim), total, '基础级');
  return (rate * 100).toFixed(1) + '%';
}

async function openEnhance(dim: Dim) {
  if (!firstMechName.value || !firstMech.value) return;
  // 简化版：直接使用仓库中最高品质的对应物品
  const dimPrefix = { 加速度: 'E-ACC', 极速: 'E-SPD', 操控: 'E-HDL', 漂移: 'E-DFT', 耐久: 'E-END' }[dim];
  let bestId = '';
  let bestQuality: Quality = '基础级';
  for (const suffix of ['-3', '-2', '-1']) {
    const id = dimPrefix + suffix;
    if ((data.value.主角.$改件仓库.强化物品[id] ?? 0) > 0) {
      bestId = id;
      bestQuality = suffix === '-3' ? '极品级' : suffix === '-2' ? '精密级' : '基础级';
      break;
    }
  }
  if (!bestId) { toastr.error('没有对应的强化物品', '强化失败'); return; }

  const result = performEnhance(data.value, firstMechName.value, dim, bestId, bestQuality);
  if ('error' in result) { toastr.error(result.error, '强化失败'); return; }

  toastr.info(result.success ? `强化成功 ${dim} ${result.oldValue} -> ${result.newValue}` : `强化失败 ${dim} 维持 ${result.oldValue}`, result.success ? '成功' : '失败');
  try { await narrateEnhanceResult(firstMechName.value, dim, result.success, result.oldValue, result.newValue); } catch { /* ignore */ }
}

// ---- 报名 ----
const allTiers = ['T5', 'T4', 'T3', 'T2', 'T1', 'T0'] as const;
const enrollTier = ref<string>('T5');
const enrollType = ref<string>('场地赛');
const enrollStats = reactive({ 加速度: 0, 极速: 0, 操控: 0, 漂移: 0, 耐久: 0 });

function isTierOpen(t: string): boolean { return isTierUnlocked(t as Tier, data.value); }
const availableRaceTypes = computed(() => AVAILABLE_RACE_TYPES[enrollTier.value as keyof typeof AVAILABLE_RACE_TYPES] ?? []);
const enrollLimit = computed(() => TIER_LIMITS[enrollTier.value as keyof typeof TIER_LIMITS] ?? { totalPoints: 150, maxPerStat: 50 });
const enrollFee = computed(() => ENROLL_FEE[enrollTier.value as keyof typeof ENROLL_FEE] ?? 0);
const enrollTotal = computed(() => enrollStats.加速度 + enrollStats.极速 + enrollStats.操控 + enrollStats.漂移 + enrollStats.耐久);
const canEnroll = computed(() => firstMechName.value && enrollTotal.value <= enrollLimit.value.totalPoints && data.value.主角.$信用点数 >= enrollFee.value);

function getEnrollMax(dim: Dim): number {
  if (!firstMech.value) return 0;
  return getStatMax(firstMech.value._五维[dim], enrollLimit.value.maxPerStat);
}

// 切换机娘时初始化滑动条
watch(firstMech, mech => {
  if (!mech) return;
  for (const dim of ['加速度', '极速', '操控', '漂移', '耐久'] as const) {
    enrollStats[dim] = Math.min(Math.floor(mech._五维[dim]), enrollLimit.value.maxPerStat);
  }
}, { immediate: true });

async function doEnroll() {
  if (!firstMechName.value) return;
  const raceName = `${enrollTier.value}${enrollType.value}`;
  const result = performEnroll(data.value, enrollTier.value as Tier, enrollType.value as any, firstMechName.value, { ...enrollStats }, raceName);
  if (!result.success) { toastr.error(result.error ?? '报名失败'); return; }
  toastr.success('报名成功');
  try { await sendEnrollNormal(enrollTier.value, enrollType.value, firstMechName.value, { acc: enrollStats.加速度, spd: enrollStats.极速, hdl: enrollStats.操控, dft: enrollStats.漂移, end: enrollStats.耐久 }); } catch { /* ignore */ }
}

async function onStartRace() {
  startRace(data.value);
  toastr.success('比赛开始');
  try { await sendRaceStart(); } catch { /* ignore */ }
}

async function doEndRace() {
  const rank = data.value.当前比赛.当前排名;
  settleRace(data.value);
  endRace(data.value);
  toastr.success(`比赛结束，第${rank}名`);
  try { await sendRaceEnd(rank); } catch { /* ignore */ }
}

const tabs = [
  { id: 'home', label: '总览', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { id: 'shop', label: '商店', icon: '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>' },
  { id: 'race', label: '赛事', icon: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>' },
  { id: 'enhance', label: '强化', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
  { id: 'live', label: '比赛', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
];
</script>

<style scoped>
.m-story-body::-webkit-scrollbar { display: none; }
.m-story-body :deep(p) { margin-bottom: 14px; }
.m-content::-webkit-scrollbar { display: none; }
.m-panel-title { font-size: 18px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.m-panel-title::before { content: ''; width: 3px; height: 16px; background: #6366f1; border-radius: 2px; }
.m-card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
.m-ov-card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 8px; padding: 12px; text-align: center; }
.m-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.m-badge-green { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(16,185,129,0.15); color: #10b981; }
.m-badge-gold { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(245,158,11,0.15); color: #f59e0b; }
.m-badge-blue { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(99,102,241,0.15); color: #818cf8; }
.m-shop-icon { width: 36px; height: 36px; border-radius: 8px; background: #212d47; border: 1px solid rgba(99,130,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.m-shop-icon svg { stroke: #818cf8; fill: none; stroke-width: 1.5; }
.m-btn-buy { display: inline-flex; padding: 3px 8px; border: none; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
.m-btn-locked { display: inline-flex; padding: 3px 8px; border: 1px solid rgba(99,130,255,0.1); border-radius: 4px; font-size: 10px; font-weight: 600; background: #111827; color: #475569; cursor: not-allowed; }
.m-btn-enroll { display: inline-flex; align-items: center; justify-content: center; padding: 10px; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
.m-btn-enroll:disabled { opacity: 0.4; cursor: not-allowed; }
.m-btn-race-start { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border: none; border-radius: 10px; font-size: 15px; font-weight: 800; cursor: pointer; background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 16px rgba(16,185,129,0.3); }
.m-btn-end { display: inline-flex; align-items: center; justify-content: center; padding: 8px; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; background: rgba(239,68,68,0.1); color: #ef4444; }
.m-tier-btn { padding: 5px 12px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; background: #1a2236; color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer; }
.m-tier-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,130,255,0.5); color: #818cf8; }
.m-tier-btn.locked { opacity: 0.4; cursor: not-allowed; }
.m-type-btn { padding: 4px 10px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; background: #1a2236; color: #94a3b8; font-size: 10px; font-weight: 600; cursor: pointer; }
.m-type-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,130,255,0.5); color: #818cf8; }
.m-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; }
.m-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #6366f1; cursor: pointer; border: 2px solid #818cf8; }
.m-opp-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(99,130,255,0.15); }
.m-opp-row:last-child { border-bottom: none; }
.m-opp-rank { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; background: #1a2236; border: 1px solid rgba(99,130,255,0.15); flex-shrink: 0; }
.m-opp-rank.r1 { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: none; }
.m-opp-rank.r2 { background: linear-gradient(135deg, #94a3b8, #64748b); color: #000; border: none; }
.m-opp-rank.r3 { background: linear-gradient(135deg, #b45309, #92400e); color: #fff; border: none; }
.m-tabbar { position: absolute; bottom: 0; left: 0; right: 0; height: calc(56px + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px); background: #0c1120; border-top: 1px solid rgba(99,130,255,0.15); display: flex; align-items: flex-start; z-index: 50; }
.m-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; height: 56px; cursor: pointer; color: #64748b; transition: color 0.2s; }
.m-tab.active { color: #818cf8; }
.m-tab svg { stroke: currentColor; fill: none; stroke-width: 1.5; }
.m-tab span { font-size: 10px; font-weight: 600; }
.bar-acc { background: linear-gradient(90deg, #ef4444, #f97316); }
.bar-spd { background: linear-gradient(90deg, #f59e0b, #eab308); }
.bar-hdl { background: linear-gradient(90deg, #06b6d4, #0ea5e9); }
.bar-dft { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.bar-end { background: linear-gradient(90deg, #10b981, #34d399); }
</style>
