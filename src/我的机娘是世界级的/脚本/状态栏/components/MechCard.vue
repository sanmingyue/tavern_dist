<template>
  <div class="mech-card">
    <!-- 顶部：机娘名 + 车型 -->
    <div class="mech-header">
      <div class="mech-name-row">
        <span class="mech-name">{{ name }}</span>
        <span class="mech-status" :class="statusClass">{{ mech.状态 }}</span>
      </div>
      <div class="mech-meta">
        <span class="mech-car-model">{{ mech._赛车型号 || '未知型号' }}</span>
        <span v-if="mech._赛车类型" class="mech-car-type">{{ mech._赛车类型 }}</span>
      </div>
    </div>

    <!-- 五维雷达图 -->
    <div class="radar-section">
      <svg :viewBox="`0 0 ${svgSize} ${svgSize}`" class="radar-svg">
        <!-- 背景环 -->
        <polygon
          v-for="level in [1, 0.75, 0.5, 0.25]"
          :key="level"
          :points="getPolygonPoints(level)"
          class="radar-bg"
          :style="{ opacity: 0.08 + level * 0.08 }"
        />
        <!-- 轴线 -->
        <line
          v-for="(_, i) in DIMENSIONS"
          :key="'axis' + i"
          :x1="center"
          :y1="center"
          :x2="getPoint(i, 1).x"
          :y2="getPoint(i, 1).y"
          class="radar-axis"
        />
        <!-- 基础数据区域 (半透明底色) -->
        <polygon v-if="hasModDiff" :points="baseDataPoints" class="radar-data-base" />
        <!-- 最终数据区域 (实色) -->
        <polygon :points="finalDataPoints" class="radar-data" />
        <polygon :points="finalDataPoints" class="radar-data-stroke" />
        <!-- 最终数据点 -->
        <circle
          v-for="(dim, i) in DIMENSIONS"
          :key="'dot' + i"
          :cx="getPoint(i, stats[dim].final / 100).x"
          :cy="getPoint(i, stats[dim].final / 100).y"
          r="4"
          class="radar-dot"
        />
        <!-- 标签 -->
        <text
          v-for="(dim, i) in DIMENSIONS"
          :key="'label' + i"
          :x="getLabelPos(i).x"
          :y="getLabelPos(i).y"
          class="radar-label"
          text-anchor="middle"
          dominant-baseline="middle"
        >{{ dim }}</text>
        <!-- 数值 (有改装加成时显示最终值+差值) -->
        <text
          v-for="(dim, i) in DIMENSIONS"
          :key="'val' + i"
          :x="getLabelPos(i).x"
          :y="getLabelPos(i).y + 13"
          class="radar-value"
          text-anchor="middle"
          dominant-baseline="middle"
        >{{ stats[dim].final }}</text>
        <!-- 差值标记 -->
        <text
          v-for="(dim, i) in DIMENSIONS"
          :key="'diff' + i"
          v-show="stats[dim].diff !== 0"
          :x="getLabelPos(i).x"
          :y="getLabelPos(i).y + 24"
          :class="stats[dim].diff > 0 ? 'radar-diff-up' : 'radar-diff-down'"
          text-anchor="middle"
          dominant-baseline="middle"
        >{{ stats[dim].diff > 0 ? '+' : '' }}{{ stats[dim].diff }}</text>
      </svg>
    </div>

    <!-- 共鸣技能 -->
    <div class="resonance-section">
      <div class="resonance-header">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="resonance-name">{{ mech.共鸣._技能名 }}</span>
        <span class="resonance-badge" :class="{ active: mech.共鸣._已激活 }">
          {{ mech.共鸣._已激活 ? '已激活' : '未激活' }}
        </span>
      </div>
      <div class="resonance-bar-track">
        <div
          class="resonance-bar-fill"
          :style="{ width: (mech.共鸣.当前共鸣值 / mech.共鸣._共鸣上限 * 100) + '%' }"
        ></div>
      </div>
      <div class="resonance-values">
        <span class="resonance-current">{{ mech.共鸣.当前共鸣值 }}</span>
        <span class="resonance-sep">/</span>
        <span class="resonance-max">{{ mech.共鸣._共鸣上限 }}</span>
      </div>
    </div>

    <!-- 改装插槽 -->
    <div class="mod-section">
      <div class="mod-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <path d="M8 2v20M16 2v20M2 8h20M2 16h20" stroke-width="1" opacity="0.4" />
        </svg>
        <span>改装芯片</span>
      </div>
      <div class="mod-slots">
        <div
          v-for="slot in ['槽位1', '槽位2', '槽位3']"
          :key="slot"
          class="mod-slot"
          :class="{ empty: !mech.改装插槽[slot as keyof typeof mech.改装插槽] }"
        >
          <template v-if="mech.改装插槽[slot as keyof typeof mech.改装插槽]">
            <span class="mod-grade" :class="'grade-' + mech.改装插槽[slot as keyof typeof mech.改装插槽]!.等级">
              {{ mech.改装插槽[slot as keyof typeof mech.改装插槽]!.等级 }}
            </span>
            <span class="mod-name">{{ mech.改装插槽[slot as keyof typeof mech.改装插槽]!.名称 || '未命名' }}</span>
            <span class="mod-effect">
              +{{ mech.改装插槽[slot as keyof typeof mech.改装插槽]!.增益值 }} {{ mech.改装插槽[slot as keyof typeof mech.改装插槽]!.增益维度 }}
            </span>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#cbd5e1" stroke-width="1.5">
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
            <span class="mod-empty-text">空槽位</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DIMENSIONS, computeFinalStats, type DimensionKey, type FinalStats } from '../store';

const props = defineProps<{
  name: string;
  mech: {
    _赛车型号: string;
    _赛车类型: string;
    状态: string;
    五维: Record<DimensionKey, number>;
    改装插槽: {
      槽位1: { 名称: string; 等级: string; 增益维度: string; 增益值: number; 代价维度: string; 代价值: number } | null;
      槽位2: { 名称: string; 等级: string; 增益维度: string; 增益值: number; 代价维度: string; 代价值: number } | null;
      槽位3: { 名称: string; 等级: string; 增益维度: string; 增益值: number; 代价维度: string; 代价值: number } | null;
    };
    共鸣: {
      技能名: string;
      技能描述: string;
      已激活: boolean;
      当前共鸣值: number;
      共鸣上限: number;
    };
  };
  compact?: boolean;
}>();

const statusClass = computed(() => {
  if (props.mech.状态 === '正常') return 'status-ok';
  if (props.mech.状态.includes('损伤') || props.mech.状态.includes('损坏')) return 'status-warn';
  return 'status-default';
});

// 计算最终五维
const stats = computed<FinalStats>(() => computeFinalStats(props.mech));

// 是否有改装差异（用于决定是否显示基础层）
const hasModDiff = computed(() => DIMENSIONS.some(dim => stats.value[dim].diff !== 0));

// 雷达图参数
const svgSize = 220;
const center = svgSize / 2;
const radius = 78;
const labelOffset = 24;

function getPoint(index: number, scale: number) {
  const angle = (Math.PI * 2 * index) / DIMENSIONS.length - Math.PI / 2;
  return {
    x: center + radius * scale * Math.cos(angle),
    y: center + radius * scale * Math.sin(angle),
  };
}

function getPolygonPoints(scale: number) {
  return DIMENSIONS.map((_, i) => {
    const p = getPoint(i, scale);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function getLabelPos(index: number) {
  const angle = (Math.PI * 2 * index) / DIMENSIONS.length - Math.PI / 2;
  return {
    x: center + (radius + labelOffset) * Math.cos(angle),
    y: center + (radius + labelOffset) * Math.sin(angle),
  };
}

// 基础五维多边形
const baseDataPoints = computed(() => {
  return DIMENSIONS.map((dim, i) => {
    const p = getPoint(i, stats.value[dim].base / 100);
    return `${p.x},${p.y}`;
  }).join(' ');
});

// 最终五维多边形（含改装加成）
const finalDataPoints = computed(() => {
  return DIMENSIONS.map((dim, i) => {
    const p = getPoint(i, stats.value[dim].final / 100);
    return `${p.x},${p.y}`;
  }).join(' ');
});
</script>

<style scoped>
.mech-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 14px;
  /* 赛车风格斜切角 */
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
}

/* 顶部 */
.mech-header {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 2px solid #6366f1;
}

.mech-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.mech-name {
  font-size: 18px;
  font-weight: 800;
  color: #1e1b4b;
  letter-spacing: 1px;
  font-family: 'Rajdhani', system-ui, sans-serif;
}

.mech-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-ok {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-warn {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fcd34d;
}

.status-default {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.mech-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mech-car-model {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  font-family: 'Rajdhani', monospace, system-ui;
}

.mech-car-type {
  font-size: 10px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 3px;
}

/* 雷达图 */
.radar-section {
  display: flex;
  justify-content: center;
  margin: 6px 0;
}

.radar-svg {
  width: 220px;
  height: 220px;
}

.radar-bg {
  fill: #e8ecf1;
  stroke: #d1d5db;
  stroke-width: 0.5;
}

.radar-axis {
  stroke: #d1d5db;
  stroke-width: 0.5;
}

.radar-data-base {
  fill: rgba(99, 102, 241, 0.06);
  stroke: #c7d2fe;
  stroke-width: 1;
  stroke-dasharray: 3 2;
}

.radar-data {
  fill: rgba(99, 102, 241, 0.12);
}

.radar-data-stroke {
  fill: none;
  stroke: #6366f1;
  stroke-width: 2;
}

.radar-dot {
  fill: #6366f1;
  stroke: #fff;
  stroke-width: 2;
}

.radar-label {
  font-size: 10px;
  font-weight: 700;
  fill: #374151;
}

.radar-value {
  font-size: 10px;
  font-weight: 700;
  fill: #6366f1;
  font-family: 'Rajdhani', monospace;
}

.radar-diff-up {
  font-size: 9px;
  font-weight: 700;
  fill: #059669;
  font-family: 'Rajdhani', monospace;
}

.radar-diff-down {
  font-size: 9px;
  font-weight: 700;
  fill: #dc2626;
  font-family: 'Rajdhani', monospace;
}

/* 共鸣技能 */
.resonance-section {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.resonance-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.resonance-name {
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
  flex: 1;
}

.resonance-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  background: #f1f5f9;
  color: #94a3b8;
}

.resonance-badge.active {
  background: #fef3c7;
  color: #d97706;
}

.resonance-bar-track {
  height: 5px;
  background: #e8ecf1;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.resonance-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.resonance-values {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.resonance-current {
  font-size: 16px;
  font-weight: 800;
  color: #f59e0b;
  font-family: 'Rajdhani', monospace;
}

.resonance-sep {
  font-size: 12px;
  color: #d1d5db;
}

.resonance-max {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Rajdhani', monospace;
}

/* 改装插槽 */
.mod-section {
  margin-top: 2px;
}

.mod-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mod-slots {
  display: flex;
  gap: 6px;
}

.mod-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: #fafbfe;
  border: 1px solid #e8ecf1;
  border-radius: 6px;
  min-height: 52px;
  justify-content: center;
}

.mod-slot.empty {
  border-style: dashed;
  opacity: 0.6;
}

.mod-grade {
  font-size: 14px;
  font-weight: 900;
  font-family: 'Rajdhani', monospace;
  line-height: 1;
}

.grade-S { color: #f59e0b; }
.grade-A { color: #ef4444; }
.grade-B { color: #8b5cf6; }
.grade-C { color: #06b6d4; }
.grade-D { color: #10b981; }
.grade-E { color: #94a3b8; }

.mod-name {
  font-size: 10px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  line-height: 1.2;
  word-break: break-all;
}

.mod-effect {
  font-size: 9px;
  color: #10b981;
  font-weight: 600;
}

.mod-empty-text {
  font-size: 9px;
  color: #cbd5e1;
}

/* 手机适配 */
@media (max-width: 480px) {
  .mech-card {
    padding: 12px;
  }

  .radar-svg {
    width: 190px;
    height: 190px;
  }

  .mech-name {
    font-size: 16px;
  }
}
</style>
