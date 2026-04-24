<template>
  <div>
    <div class="panel-title">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#6366f1" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      商店
    </div>

    <!-- 信用点余额 -->
    <div class="mb-4 flex items-center gap-2 text-xs" style="color: #64748b;">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2 2"/></svg>
      <span>信用点：<span class="font-bold" style="color: #fbbf24;">{{ data.主角.$信用点数.toLocaleString() }}</span></span>
      <span class="ml-4">赛事等级：<span class="font-bold" style="color: #818cf8;">{{ data.主角._赛事等级 }}</span></span>
    </div>

    <!-- Tab 切换 -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="cursor-pointer rounded-md border px-4 py-1.5 text-xs font-semibold transition-all"
        :class="activeTab === tab.id ? 'border-[rgba(99,130,255,0.5)] text-[#818cf8]' : 'border-[rgba(99,130,255,0.15)] text-[#64748b]'"
        :style="activeTab === tab.id ? 'background: rgba(99,102,241,0.15);' : 'background: #1a2236;'"
        @click="activeTab = tab.id"
      >{{ tab.label }}</button>
    </div>

    <!-- 筛选 -->
    <div v-if="filterOptions.length > 1" class="mb-3 flex flex-wrap gap-1.5">
      <button
        v-for="opt in filterOptions"
        :key="opt"
        class="cursor-pointer rounded px-2.5 py-1 text-[10px] font-semibold transition-all"
        :class="activeFilter === opt ? 'bg-[rgba(99,102,241,0.2)] text-[#818cf8]' : 'text-[#475569]'"
        :style="activeFilter === opt ? '' : 'background: transparent;'"
        @click="activeFilter = opt"
      >{{ opt }}</button>
    </div>

    <!-- 商品列表 -->
    <div class="space-y-2">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="card flex items-center gap-3"
        :class="{ 'opacity-50': !isItemUnlocked(item) }"
      >
        <!-- 图标 -->
        <div class="shop-icon">
          <svg v-if="item.category === 'enhance'" viewBox="0 0 24 24" class="h-5 w-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          <svg v-else-if="item.category === 'skin'" viewBox="0 0 24 24" class="h-5 w-5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
          <svg v-else viewBox="0 0 24 24" class="h-5 w-5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
        </div>
        <!-- 信息 -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-xs font-semibold" style="color: #e2e8f0;">{{ item.name }}</span>
            <span v-if="item.priceTier" class="shrink-0 text-[10px]" :style="{ color: priceTierColor(item.priceTier) }">{{ item.priceTier }}</span>
            <span v-if="item.quality" class="shrink-0 text-[10px]" :style="{ color: qualityColor(item.quality) }">{{ item.quality }}</span>
          </div>
          <div class="mt-0.5 truncate text-[11px]" style="color: #64748b;">{{ item.type }} · {{ item.description }}</div>
        </div>
        <!-- 价格和购买 -->
        <div class="shrink-0 text-right">
          <div class="text-xs font-bold" style="color: #fbbf24;">{{ item.price.toLocaleString() }}</div>
          <button
            v-if="!isItemUnlocked(item)"
            class="btn-locked mt-1 text-[10px]"
            disabled
          >{{ item.unlockTier }}+</button>
          <button
            v-else-if="isOwned(item)"
            class="btn-owned mt-1 text-[10px]"
            disabled
          >已拥有</button>
          <button
            v-else-if="data.主角.$信用点数 < item.price"
            class="btn-locked mt-1 text-[10px]"
            disabled
          >不足</button>
          <button
            v-else
            class="btn-buy mt-1 text-[10px]"
            @click="buyItem(item)"
          >购买</button>
        </div>
      </div>
      <div v-if="!filteredItems.length" class="empty-hint">暂无商品</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { ENHANCE_ITEMS, SKIN_ITEMS, SKILL_ITEMS, isUnlocked, type ShopItem, type Tier, type PriceTier } from './shopData';

const props = defineProps<{ data: Schema }>();

const tabs = [
  { id: 'enhance', label: '强化物品' },
  { id: 'skin', label: '外形改件' },
  { id: 'skill', label: '技能改件' },
];

const activeTab = ref<string>('enhance');
const activeFilter = ref<string>('全部');

const itemsByTab = computed<ShopItem[]>(() => {
  if (activeTab.value === 'enhance') return ENHANCE_ITEMS;
  if (activeTab.value === 'skin') return SKIN_ITEMS;
  return SKILL_ITEMS;
});

const filterOptions = computed<string[]>(() => {
  const types = [...new Set(itemsByTab.value.map(i => i.type))];
  return ['全部', ...types];
});

// 切换 tab 时重置筛选
watch(activeTab, () => { activeFilter.value = '全部'; });

const filteredItems = computed<ShopItem[]>(() => {
  if (activeFilter.value === '全部') return itemsByTab.value;
  return itemsByTab.value.filter(i => i.type === activeFilter.value);
});

function isItemUnlocked(item: ShopItem): boolean {
  return isUnlocked(item.unlockTier, props.data.主角._赛事等级 as Tier);
}

function isOwned(item: ShopItem): boolean {
  if (item.repeatable) return false;
  // 检查仓库中是否已有
  if (item.category === 'skin') {
    return props.data.主角.$改件仓库._外形改件.some(m => m.名称 === item.name);
  }
  if (item.category === 'skill') {
    return props.data.主角.$改件仓库._技能改件.some(m => m.名称 === item.name);
  }
  return false;
}

function priceTierColor(tier?: PriceTier): string {
  if (tier === '定制') return '#f59e0b';
  if (tier === '限定') return '#a78bfa';
  if (tier === '精品') return '#06b6d4';
  return '#64748b';
}

function qualityColor(q?: string): string {
  if (q === '极品级') return '#f59e0b';
  if (q === '精密级') return '#818cf8';
  return '#64748b';
}

function buyItem(item: ShopItem) {
  if (props.data.主角.$信用点数 < item.price) {
    toastr.error('信用点不足', '购买失败');
    return;
  }

  props.data.主角.$信用点数 -= item.price;

  if (item.category === 'enhance' && item.dimension) {
    // 强化物品：数量+1
    const current = props.data.主角.$改件仓库.强化物品[item.id] ?? 0;
    props.data.主角.$改件仓库.强化物品[item.id] = current + 1;
  } else if (item.category === 'skin') {
    // 外形改件：添加到仓库
    props.data.主角.$改件仓库._外形改件.push({
      名称: item.name,
      类型: item.type as '尾翼' | '花纹' | '灯组' | '排气' | '空力套件' | '轮毂' | '赛车服' | '核心配色',
      描述: item.description,
    });
  } else if (item.category === 'skill' && item.effectDirection) {
    // 技能改件：添加到仓库
    props.data.主角.$改件仓库._技能改件.push({
      名称: item.name,
      效果方向: item.effectDirection,
      描述: item.description,
      是否黑市: item.isBlackMarket ?? false,
    });
  }

  toastr.success(`已购买「${item.name}」`, '购买成功');
}
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 12px; padding: 14px; transition: all 0.2s; }
.card:hover { border-color: rgba(99,130,255,0.5); background: #212d47; }
.shop-icon { width: 40px; height: 40px; border-radius: 8px; background: #212d47; border: 1px solid rgba(99,130,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.shop-icon svg { stroke: #818cf8; fill: none; stroke-width: 1.5; }
.btn-buy { display: inline-flex; align-items: center; justify-content: center; padding: 3px 10px; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; transition: all 0.2s; }
.btn-buy:hover { filter: brightness(1.15); }
.btn-locked { display: inline-flex; align-items: center; justify-content: center; padding: 3px 10px; border: 1px solid rgba(99,130,255,0.1); border-radius: 4px; font-weight: 600; background: #111827; color: #475569; cursor: not-allowed; }
.btn-owned { display: inline-flex; align-items: center; justify-content: center; padding: 3px 10px; border: 1px solid rgba(16,185,129,0.3); border-radius: 4px; font-weight: 600; background: rgba(16,185,129,0.1); color: #10b981; cursor: not-allowed; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 40px 0; }
</style>
