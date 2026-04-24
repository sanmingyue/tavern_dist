<template>
  <div>
    <div class="panel-title">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#6366f1" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      强化 · {{ firstMechName || '未选择' }}
    </div>

    <div v-if="firstMech" class="mb-4 flex items-center gap-4 text-xs" style="color: #64748b;">
      <span>天赋：{{ firstMech._天赋维度.join('、') || '未知' }}</span>
      <span>信用点：<span class="font-bold" style="color: #fbbf24;">{{ data.主角.$信用点数.toLocaleString() }}</span></span>
    </div>

    <!-- 维度列表 -->
    <div v-if="firstMech" class="space-y-3">
      <div v-for="dim in dimensions" :key="dim.key" class="card">
        <div class="flex items-center gap-4">
          <!-- 维度数值 -->
          <div class="w-14 text-center">
            <div class="text-[11px]" style="color: #64748b;">{{ dim.label }}</div>
            <div class="text-xl font-extrabold" :style="{ color: dim.color }">
              {{ formatValue(firstMech._五维[dim.key]) }}
            </div>
          </div>
          <!-- 进度条 -->
          <div class="h-1.5 flex-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.05);">
            <div class="h-full rounded-full transition-all duration-300" :class="'bar-' + dim.barClass" :style="{ width: Math.min(firstMech._五维[dim.key], 100) + '%' }"></div>
          </div>
          <!-- 天赋标签 -->
          <span v-if="isTalent(dim.key)" class="badge-gold">天赋</span>
          <span v-else class="badge-blue">普通</span>
          <!-- 强化按钮 -->
          <button
            v-if="firstMech._五维[dim.key] >= 100.9"
            class="btn-disabled text-xs"
            disabled
          >已满</button>
          <button
            v-else
            class="text-xs"
            :class="isTalent(dim.key) ? 'btn-gold' : 'btn-secondary'"
            @click="openEnhanceDialog(dim.key)"
          >强化</button>
        </div>
        <!-- 成功率预览 -->
        <div class="mt-2 text-[10px]" style="color: #475569;">
          成功率：{{ getPreviewRate(dim.key) }} | 消耗：{{ getPreviewCost(dim.key) }} 信用点
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">未找到机娘</div>

    <!-- 强化确认弹窗 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
      <div class="dialog-box">
        <div class="mb-3 text-base font-bold">强化确认</div>
        <div class="mb-2 text-xs" style="color: #94a3b8;">
          维度：<span class="font-bold" style="color: #e2e8f0;">{{ dialogDim }}</span>
          <span v-if="dialogIsTalent" class="badge-gold ml-2">天赋</span>
          <span v-else class="badge-blue ml-2">普通</span>
        </div>
        <div class="mb-2 text-xs" style="color: #94a3b8;">
          当前值：<span class="font-bold" style="color: #e2e8f0;">{{ formatValue(dialogCurrentValue) }}</span>
        </div>

        <!-- 选择强化物品 -->
        <div class="mb-3">
          <div class="mb-1 text-[11px] font-semibold" style="color: #64748b;">选择强化物品</div>
          <div class="space-y-1">
            <label
              v-for="opt in availableItems"
              :key="opt.id"
              class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all"
              :class="selectedItemId === opt.id ? 'border border-[rgba(99,130,255,0.5)] bg-[rgba(99,102,241,0.15)]' : 'border border-transparent bg-[#1a2236]'"
            >
              <input v-model="selectedItemId" type="radio" :value="opt.id" class="hidden" />
              <span class="font-semibold" style="color: #e2e8f0;">{{ opt.name }}</span>
              <span style="color: #64748b;">x{{ opt.count }}</span>
              <span class="ml-auto" :style="{ color: qualityColor(opt.quality) }">{{ opt.quality }}</span>
            </label>
          </div>
          <div v-if="!availableItems.length" class="mt-2 text-xs" style="color: #ef4444;">
            没有对应维度的强化物品，请先在商城购买
          </div>
        </div>

        <!-- 成功率和消耗 -->
        <div v-if="selectedItemId" class="mb-4 rounded-lg p-3" style="background: #0c1120;">
          <div class="flex justify-between text-xs">
            <span style="color: #64748b;">成功率</span>
            <span class="font-bold" :style="{ color: dialogRate > 0.5 ? '#10b981' : dialogRate > 0.2 ? '#f59e0b' : '#ef4444' }">
              {{ (dialogRate * 100).toFixed(1) }}%
            </span>
          </div>
          <div class="mt-1 flex justify-between text-xs">
            <span style="color: #64748b;">信用点消耗</span>
            <span class="font-bold" style="color: #fbbf24;">{{ dialogCost.toLocaleString() }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button class="btn-secondary flex-1 text-xs" @click="showDialog = false">取消</button>
          <button
            class="btn-gold flex-1 text-xs"
            :disabled="!selectedItemId || !availableItems.length"
            @click="doEnhance"
          >确认强化</button>
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <div v-if="showResult" class="dialog-overlay" @click.self="showResult = false">
      <div class="dialog-box text-center">
        <svg v-if="resultSuccess" viewBox="0 0 24 24" class="mx-auto mb-3 h-12 w-12" fill="none" stroke="#10b981" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" class="mx-auto mb-3 h-12 w-12" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <div class="mb-2 text-lg font-bold" :style="{ color: resultSuccess ? '#10b981' : '#ef4444' }">
          {{ resultSuccess ? '强化成功' : '强化失败' }}
        </div>
        <div class="mb-1 text-xs" style="color: #94a3b8;">
          {{ resultDim }}：{{ formatValue(resultOld) }} → {{ formatValue(resultNew) }}
        </div>
        <div class="mb-4 text-xs" style="color: #64748b;">
          消耗 {{ resultCost.toLocaleString() }} 信用点
        </div>
        <button class="btn-secondary w-full text-xs" @click="showResult = false">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { dimensions } from './shared';
import { performEnhance, calculateSuccessRate, calculateCreditCost } from './enhance';
import { ENHANCE_ITEMS, findItemById } from './shopData';
import type { Quality } from './shopData';
import { narrateEnhanceResult } from '../aiInteraction';

const props = defineProps<{
  data: Schema;
  firstMechName: string | null;
  firstMech: Schema['机娘库'][string] | null;
}>();

// 弹窗状态
const showDialog = ref(false);
const showResult = ref(false);
const dialogDim = ref<string>('');
const dialogCurrentValue = ref(0);
const dialogIsTalent = ref(false);
const selectedItemId = ref<string>('');

// 结果状态
const resultSuccess = ref(false);
const resultDim = ref('');
const resultOld = ref(0);
const resultNew = ref(0);
const resultCost = ref(0);

type Dim = '加速度' | '极速' | '操控' | '漂移' | '耐久';

function isTalent(dim: Dim): boolean {
  return props.firstMech?._天赋维度.includes(dim) ?? false;
}

function formatValue(v: number): string {
  return v >= 100 ? v.toFixed(1) : String(Math.floor(v));
}

function getTotalStats(): number {
  if (!props.firstMech) return 0;
  return Object.values(props.firstMech._五维).reduce((s, v) => s + v, 0);
}

function getPreviewRate(dim: Dim): string {
  if (!props.firstMech) return '-';
  const rate = calculateSuccessRate(props.firstMech._五维[dim], isTalent(dim), getTotalStats(), '基础级');
  return (rate * 100).toFixed(1) + '%';
}

function getPreviewCost(dim: Dim): string {
  if (!props.firstMech) return '-';
  return calculateCreditCost(props.firstMech._五维[dim], isTalent(dim)).toLocaleString();
}

// 可用的强化物品（对应维度）
const availableItems = computed(() => {
  if (!dialogDim.value) return [];
  const dimItems = ENHANCE_ITEMS.filter(i => i.dimension === dialogDim.value);
  return dimItems
    .map(i => ({
      id: i.id,
      name: i.name,
      quality: i.quality!,
      count: props.data.主角.$改件仓库.强化物品[i.id] ?? 0,
    }))
    .filter(i => i.count > 0);
});

const dialogRate = computed(() => {
  if (!props.firstMech || !selectedItemId.value) return 0;
  const item = findItemById(selectedItemId.value);
  const quality = (item?.quality ?? '基础级') as Quality;
  return calculateSuccessRate(dialogCurrentValue.value, dialogIsTalent.value, getTotalStats(), quality);
});

const dialogCost = computed(() => {
  return calculateCreditCost(dialogCurrentValue.value, dialogIsTalent.value);
});

function qualityColor(q: string): string {
  if (q === '极品级') return '#f59e0b';
  if (q === '精密级') return '#818cf8';
  return '#64748b';
}

function openEnhanceDialog(dim: Dim) {
  if (!props.firstMech) return;
  dialogDim.value = dim;
  dialogCurrentValue.value = props.firstMech._五维[dim];
  dialogIsTalent.value = isTalent(dim);
  selectedItemId.value = '';
  showDialog.value = true;
}

async function doEnhance() {
  if (!props.firstMechName || !selectedItemId.value) return;
  const item = findItemById(selectedItemId.value);
  const quality = (item?.quality ?? '基础级') as Quality;

  const result = performEnhance(
    props.data,
    props.firstMechName,
    dialogDim.value as Dim,
    selectedItemId.value,
    quality,
  );

  if ('error' in result) {
    toastr.error(result.error, '强化失败');
    return;
  }

  showDialog.value = false;
  resultSuccess.value = result.success;
  resultDim.value = result.dimension;
  resultOld.value = result.oldValue;
  resultNew.value = result.newValue;
  resultCost.value = result.creditCost;
  showResult.value = true;

  // 请求 AI 描写强化过程
  try {
    await narrateEnhanceResult(
      props.firstMechName,
      result.dimension,
      result.success,
      result.oldValue,
      result.newValue,
    );
  } catch (e) {
    console.error('[强化] AI叙事请求失败:', e);
  }
}
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.card:hover { border-color: rgba(99,130,255,0.5); background: #212d47; }
.badge-gold { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(245,158,11,0.15); color: #f59e0b; }
.badge-blue { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(99,102,241,0.15); color: #818cf8; }
.btn-gold { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; transition: all 0.2s; }
.btn-gold:hover { filter: brightness(1.1); }
.btn-gold:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; font-weight: 600; cursor: pointer; background: #1a2236; color: #94a3b8; transition: all 0.2s; }
.btn-secondary:hover { border-color: rgba(99,130,255,0.5); color: #e2e8f0; }
.btn-disabled { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: 1px solid rgba(99,130,255,0.1); border-radius: 6px; font-weight: 600; background: #111827; color: #475569; cursor: not-allowed; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 40px 0; }
.bar-acc { background: linear-gradient(90deg, #ef4444, #f97316); }
.bar-spd { background: linear-gradient(90deg, #f59e0b, #eab308); }
.bar-hdl { background: linear-gradient(90deg, #06b6d4, #0ea5e9); }
.bar-dft { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.bar-end { background: linear-gradient(90deg, #10b981, #34d399); }

.dialog-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.dialog-box {
  background: #111827; border: 1px solid rgba(99,130,255,0.3); border-radius: 16px;
  padding: 24px; width: 360px; max-width: 90vw; color: #e2e8f0;
}
</style>
