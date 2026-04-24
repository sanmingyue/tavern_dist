<template>
  <div>
    <div class="panel-title">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#6366f1" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      比赛
    </div>

    <!-- 无比赛 -->
    <div v-if="!data.当前比赛._赛事名称" class="empty-hint">当前没有进行中的比赛</div>

    <!-- 比赛面板 -->
    <template v-else>
      <!-- 赛事信息 -->
      <div class="mb-4 rounded-lg p-4" style="background: #0c1120; border: 1px solid rgba(99,130,255,0.1);">
        <div class="text-xs" style="color: #64748b;">{{ data.当前比赛._赛事名称 }}</div>
        <div class="mt-1 text-base font-bold">{{ data.当前比赛._赛事级别 }} {{ data.当前比赛._赛事类型 }}</div>
        <div class="mt-1 text-xs" style="color: #64748b;">搭档：{{ data.当前比赛._搭档机娘 }}</div>
      </div>

      <!-- 圈数进度 -->
      <div class="mb-4">
        <div class="flex justify-between text-xs">
          <span style="color: #64748b;">圈数</span>
          <span class="font-bold" style="color: #e2e8f0;">{{ data.当前比赛.当前圈数 }} / {{ data.当前比赛.总圈数 }}</span>
        </div>
        <div class="mt-1 h-2 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.05);">
          <div class="h-full rounded-full transition-all duration-500" style="background: linear-gradient(90deg, #6366f1, #818cf8);" :style="{ width: lapPercent + '%' }"></div>
        </div>
      </div>

      <!-- 排名 -->
      <div class="mb-4 flex items-center gap-4">
        <div class="text-center">
          <div class="text-[10px]" style="color: #64748b;">当前排名</div>
          <div class="text-3xl font-extrabold" :style="{ color: rankColor }">{{ data.当前比赛.当前排名 || '-' }}</div>
        </div>
        <!-- 参赛五维 -->
        <div class="flex flex-1 gap-2">
          <div v-for="dim in dims" :key="dim.key" class="flex-1 text-center">
            <div class="text-[9px]" style="color: #475569;">{{ dim.label }}</div>
            <div class="text-xs font-bold" :style="{ color: dim.color }">{{ data.当前比赛._参赛五维[dim.key] }}</div>
          </div>
        </div>
      </div>

      <!-- 共鸣值 -->
      <div v-if="partnerMech" class="mb-4 rounded-lg p-3" style="background: #1a2236; border: 1px solid rgba(6,182,212,0.2);">
        <div class="flex items-center justify-between">
          <div class="text-xs font-semibold" style="color: #06b6d4;">
            <svg viewBox="0 0 24 24" class="mr-1 inline h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
            共鸣值
          </div>
          <span class="text-sm font-bold" style="color: #06b6d4;">{{ partnerMech.共鸣.当前共鸣值 }}/{{ partnerMech.共鸣._共鸣上限 }}</span>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full" style="background: rgba(6,182,212,0.1);">
          <div class="h-full rounded-full transition-all duration-500" style="background: linear-gradient(90deg, #06b6d4, #22d3ee);" :style="{ width: resonancePercent + '%' }"></div>
        </div>
        <div v-if="partnerMech.共鸣._已激活" class="mt-2 text-[11px]" style="color: #64748b;">
          技能：{{ partnerMech.共鸣._技能名 }}
        </div>
        <!-- 释放按钮 -->
        <button
          v-if="partnerMech.共鸣.当前共鸣值 >= partnerMech.共鸣._共鸣上限"
          class="btn-resonance mt-2 w-full"
          @click="showResonanceDialog = true"
        >
          <svg viewBox="0 0 24 24" class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          释放共鸣技能
        </button>
      </div>

      <!-- 对手列表 -->
      <div v-if="Object.keys(data.当前比赛.对手).length" class="mb-4">
        <div class="section-label">对手</div>
        <div class="space-y-1.5">
          <div
            v-for="(opp, name) in data.当前比赛.对手"
            :key="name"
            class="flex items-center gap-3 rounded-lg px-3 py-2"
            style="background: #1a2236;"
          >
            <span class="w-6 text-center text-xs font-extrabold" :style="{ color: getRankColor(opp.当前排名) }">{{ opp.当前排名 }}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-xs font-semibold" style="color: #e2e8f0;">{{ opp.车手名 }} x {{ opp.机娘名 }}</div>
            </div>
            <span v-if="opp.技能已使用" class="text-[10px]" style="color: #475569;">技能已用</span>
          </div>
        </div>
      </div>

      <!-- 结束比赛按钮（调试用，正常由前端结算触发） -->
      <button
        v-if="data.世界._当前状态 === '比赛中'"
        class="btn-end-race mt-4 w-full"
        @click="showEndDialog = true"
      >结束比赛（结算）</button>
    </template>

    <!-- 共鸣技能释放确认 -->
    <div v-if="showResonanceDialog" class="dialog-overlay" @click.self="showResonanceDialog = false">
      <div class="dialog-box text-center">
        <svg viewBox="0 0 24 24" class="mx-auto mb-3 h-10 w-10" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <div class="mb-2 text-lg font-bold" style="color: #06b6d4;">共鸣技能就绪</div>
        <div class="mb-1 text-sm font-semibold">{{ partnerMech?.共鸣._技能名 }}</div>
        <div class="mb-4 text-xs" style="color: #64748b;">{{ partnerMech?.共鸣._技能描述 }}</div>
        <div class="flex gap-2">
          <button class="btn-secondary flex-1 text-xs" @click="showResonanceDialog = false">暂不释放</button>
          <button class="btn-resonance flex-1 text-xs" @click="doResonance">释放</button>
        </div>
      </div>
    </div>

    <!-- 结束比赛确认 -->
    <div v-if="showEndDialog" class="dialog-overlay" @click.self="showEndDialog = false">
      <div class="dialog-box">
        <div class="mb-3 text-base font-bold">结束比赛</div>
        <div class="mb-4 text-xs" style="color: #94a3b8;">确认结束比赛并进行结算？当前排名：第{{ data.当前比赛.当前排名 }}名</div>
        <div class="flex gap-2">
          <button class="btn-secondary flex-1 text-xs" @click="showEndDialog = false">取消</button>
          <button class="btn-end-race flex-1 text-xs" @click="doEndRace">确认结算</button>
        </div>
      </div>
    </div>

    <!-- 结算结果弹窗 -->
    <div v-if="showSettleResult" class="dialog-overlay" @click.self="showSettleResult = false">
      <div class="dialog-box text-center">
        <svg viewBox="0 0 24 24" class="mx-auto mb-3 h-10 w-10" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <div class="mb-3 text-lg font-bold" style="color: #f59e0b;">比赛结算</div>
        <div class="mb-1 text-sm font-bold">第 {{ settleData?.rank }} 名</div>
        <div class="mt-3 space-y-1 text-xs" style="color: #94a3b8;">
          <div class="flex justify-between"><span>奖金</span><span class="font-bold" style="color: #fbbf24;">+{{ settleData?.prize?.toLocaleString() }}</span></div>
          <div class="flex justify-between"><span>积分</span><span class="font-bold" style="color: #818cf8;">+{{ settleData?.points }}</span></div>
          <div v-for="item in settleData?.enhanceItems" :key="item.itemId" class="flex justify-between">
            <span>{{ item.name }}</span><span class="font-bold" style="color: #10b981;">x{{ item.count }}</span>
          </div>
        </div>
        <button class="btn-secondary mt-4 w-full text-xs" @click="showSettleResult = false">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { dimensions } from './shared';
import { settleRace, type SettleResult, type EnhanceItemReward } from './raceSettle';
import { endRace } from './enrollLogic';
import { sendRaceEnd, sendResonanceRelease } from '../aiInteraction';

const props = defineProps<{
  data: Schema;
  partnerMech: Schema['机娘库'][string] | null;
}>();

const dims = dimensions;
const showResonanceDialog = ref(false);
const showEndDialog = ref(false);
const showSettleResult = ref(false);
const settleData = ref<{ rank: number; prize: number; points: number; enhanceItems: EnhanceItemReward[] } | null>(null);

const lapPercent = computed(() => {
  if (!props.data.当前比赛.总圈数) return 0;
  return Math.min((props.data.当前比赛.当前圈数 / props.data.当前比赛.总圈数) * 100, 100);
});

const resonancePercent = computed(() => {
  if (!props.partnerMech) return 0;
  return Math.min((props.partnerMech.共鸣.当前共鸣值 / props.partnerMech.共鸣._共鸣上限) * 100, 100);
});

const rankColor = computed(() => {
  const r = props.data.当前比赛.当前排名;
  if (r === 1) return '#f59e0b';
  if (r === 2) return '#94a3b8';
  if (r === 3) return '#cd7f32';
  return '#64748b';
});

function getRankColor(r: number): string {
  if (r === 1) return '#f59e0b';
  if (r === 2) return '#94a3b8';
  if (r === 3) return '#cd7f32';
  return '#475569';
}

async function doResonance() {
  showResonanceDialog.value = false;
  if (!props.partnerMech) return;
  try {
    await sendResonanceRelease(props.partnerMech.共鸣._技能名);
  } catch (e) {
    console.error('[共鸣] AI请求失败:', e);
  }
}

async function doEndRace() {
  showEndDialog.value = false;
  const rank = props.data.当前比赛.当前排名;

  // 先结算
  const result = settleRace(props.data);
  if (result) {
    settleData.value = { rank, prize: result.prize, points: result.points, enhanceItems: result.enhanceItems };
    showSettleResult.value = true;
  }

  // 切换状态
  endRace(props.data);

  // AI叙事
  try {
    await sendRaceEnd(rank);
  } catch (e) {
    console.error('[比赛结束] AI请求失败:', e);
  }
}
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.btn-resonance { display: inline-flex; align-items: center; justify-content: center; padding: 8px 16px; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; transition: all 0.2s; box-shadow: 0 2px 12px rgba(6,182,212,0.3); }
.btn-resonance:hover { filter: brightness(1.1); }
.btn-end-race { display: inline-flex; align-items: center; justify-content: center; padding: 8px 16px; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(239,68,68,0.1); color: #ef4444; transition: all 0.2s; }
.btn-end-race:hover { background: rgba(239,68,68,0.2); }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; font-weight: 600; cursor: pointer; background: #1a2236; color: #94a3b8; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 40px 0; }
.dialog-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.dialog-box { background: #111827; border: 1px solid rgba(99,130,255,0.3); border-radius: 16px; padding: 24px; width: 380px; max-width: 90vw; color: #e2e8f0; }
</style>
