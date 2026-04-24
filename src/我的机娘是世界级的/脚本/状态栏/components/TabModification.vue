<template>
  <div class="tab-mod">
    <!-- 有目标机娘 -->
    <template v-if="targetName && targetMech">
      <!-- 标题 -->
      <div class="mod-header">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <path d="M8 2v20M16 2v20M2 8h20M2 16h20" stroke-width="1" opacity="0.4" />
        </svg>
        <span>{{ targetName }} - 改装面板</span>
        <span v-if="!store.canModify" class="readonly-badge">只读</span>
      </div>

      <!-- 三个槽位 -->
      <div class="slots-section">
        <div class="section-label">装备槽位</div>
        <div class="slots-list">
          <div
            v-for="(slotKey, index) in slotKeys"
            :key="slotKey"
            class="slot-card"
            :class="{
              empty: !targetMech.改装插槽[slotKey],
              active: activeSlot === slotKey,
              clickable: store.canModify,
            }"
            @click="onSlotClick(slotKey)"
          >
            <div class="slot-index">{{ index + 1 }}</div>

            <template v-if="targetMech.改装插槽[slotKey]">
              <div class="slot-info">
                <div class="slot-top">
                  <span class="slot-grade" :class="'grade-' + targetMech.改装插槽[slotKey]!.等级">
                    {{ targetMech.改装插槽[slotKey]!.等级 }}级
                  </span>
                  <span class="slot-name">{{ targetMech.改装插槽[slotKey]!.名称 || '未命名芯片' }}</span>
                </div>
                <div class="slot-effects">
                  <span class="effect-plus">
                    <svg viewBox="0 0 16 16" width="10" height="10">
                      <path d="M8 3v10M3 8h10" stroke="#10b981" stroke-width="2" stroke-linecap="round" fill="none" />
                    </svg>
                    {{ targetMech.改装插槽[slotKey]!.增益维度 }} +{{ targetMech.改装插槽[slotKey]!.增益值 }}
                  </span>
                  <span v-if="targetMech.改装插槽[slotKey]!.代价值 > 0" class="effect-minus">
                    <svg viewBox="0 0 16 16" width="10" height="10">
                      <path d="M3 8h10" stroke="#ef4444" stroke-width="2" stroke-linecap="round" fill="none" />
                    </svg>
                    {{ targetMech.改装插槽[slotKey]!.代价维度 }} -{{ targetMech.改装插槽[slotKey]!.代价值 }}
                  </span>
                </div>
              </div>
              <!-- 拆卸按钮 -->
              <button v-if="store.canModify" class="uninstall-btn" title="拆卸" @click.stop="handleUninstall(slotKey)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </template>

            <template v-else>
              <div class="slot-empty">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#d1d5db" stroke-width="1.5">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round" />
                </svg>
                <span>{{ store.canModify ? '点击选择改件安装' : '空槽位' }}</span>
              </div>
            </template>

            <!-- 选中指示器 -->
            <div v-if="activeSlot === slotKey && store.canModify" class="slot-active-indicator">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M8 2l6 12H2z" fill="#6366f1" />
              </svg>
            </div>
          </div>

          <!-- 展开的仓库列表（在选中的槽位下方） -->
          <Transition name="slide">
            <div
              v-if="activeSlot && store.canModify"
              :key="activeSlot"
              class="inline-warehouse"
            >
              <div class="iw-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
                <span>选择改件安装到 槽位{{ activeSlot.replace('槽位', '') }}</span>
                <button class="iw-close" @click.stop="activeSlot = null">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div v-if="store.warehouse.length === 0" class="iw-empty">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#e2e8f0" stroke-width="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="3" />
                  <path d="M8 12h8" stroke-linecap="round" />
                </svg>
                <span>仓库中没有改件</span>
              </div>

              <div v-else class="iw-list">
                <div
                  v-for="(mod, idx) in store.warehouse"
                  :key="idx"
                  class="iw-item"
                  @click.stop="handleInstall(idx)"
                >
                  <div class="iw-item-grade" :class="'grade-' + mod.等级">{{ mod.等级 }}</div>
                  <div class="iw-item-info">
                    <div class="iw-item-name">{{ mod.名称 || '未命名' }}</div>
                    <div class="iw-item-effect">
                      <span class="effect-plus-sm">{{ mod.增益维度 }}+{{ mod.增益值 }}</span>
                      <span v-if="mod.代价值 > 0" class="effect-minus-sm">{{ mod.代价维度 }}-{{ mod.代价值 }}</span>
                    </div>
                  </div>
                  <div class="iw-item-action">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 最终五维对比面板 -->
      <div class="final-stats-section">
        <div class="section-label">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
            <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" opacity="0.3" />
          </svg>
          最终五维
          <span class="stats-hint">基础 + 改装加成</span>
        </div>
        <div class="stats-grid">
          <div
            v-for="dim in DIMENSIONS"
            :key="dim"
            class="stat-row"
            :class="{
              'stat-up': finalStats[dim].diff > 0,
              'stat-down': finalStats[dim].diff < 0,
            }"
          >
            <span class="stat-dim">
              <span class="stat-abbr">{{ DIM_ABBR[dim] }}</span>
              {{ dim }}
            </span>
            <span class="stat-values">
              <span class="stat-base">{{ finalStats[dim].base }}</span>
              <svg v-if="finalStats[dim].diff !== 0" viewBox="0 0 16 16" width="12" height="12" class="stat-arrow">
                <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>
              <span v-if="finalStats[dim].diff === 0" class="stat-eq">=</span>
              <span class="stat-final" :class="{ 'val-up': finalStats[dim].diff > 0, 'val-down': finalStats[dim].diff < 0 }">
                {{ finalStats[dim].final }}
              </span>
              <span v-if="finalStats[dim].diff !== 0" class="stat-diff" :class="{ 'diff-up': finalStats[dim].diff > 0, 'diff-down': finalStats[dim].diff < 0 }">
                {{ finalStats[dim].diff > 0 ? '+' : '' }}{{ finalStats[dim].diff }}
              </span>
            </span>
            <!-- 进度条 -->
            <div class="stat-bar-track">
              <div class="stat-bar-base" :style="{ width: finalStats[dim].base + '%' }"></div>
              <div
                v-if="finalStats[dim].diff > 0"
                class="stat-bar-gain"
                :style="{ left: finalStats[dim].base + '%', width: finalStats[dim].diff + '%' }"
              ></div>
              <div
                v-if="finalStats[dim].diff < 0"
                class="stat-bar-loss"
                :style="{ left: finalStats[dim].final + '%', width: Math.abs(finalStats[dim].diff) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 赛事改件限制提示 -->
      <div class="mod-notice">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <span>
          当前赛事级别 {{ store.data.当前比赛._赛事级别 || store.data.主角._赛事等级 }}，
          改件等级须符合赛事规定
        </span>
      </div>
    </template>

    <!-- 没有目标机娘 -->
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#cbd5e1" stroke-width="1.5">
        <rect x="2" y="2" width="20" height="20" rx="3" />
        <path d="M12 8v8M8 12h8" stroke-linecap="round" />
      </svg>
      <span v-if="store.gameState === '日常'">请先在「机娘库」中选择一位机娘</span>
      <span v-else>未指定搭档机娘，无法查看改装</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore, DIMENSIONS, DIM_ABBR, computeFinalStats, type FinalStats } from '../store';

const store = useStatusStore();

const slotKeys = ['槽位1', '槽位2', '槽位3'] as const;
type SlotKey = (typeof slotKeys)[number];

// 目标机娘
const targetName = computed(() => store.modTargetName);
const targetMech = computed(() => store.modTargetMech);

// 当前展开的槽位
const activeSlot = ref<SlotKey | null>(null);

// 最终五维
const defaultStats: FinalStats = DIMENSIONS.reduce((acc, dim) => {
  acc[dim] = { base: 0, final: 0, diff: 0 };
  return acc;
}, {} as FinalStats);

const finalStats = computed<FinalStats>(() => {
  if (!targetMech.value) return defaultStats;
  return computeFinalStats(targetMech.value);
});

// 点击槽位：展开/收起仓库列表
function onSlotClick(slotKey: SlotKey) {
  if (!store.canModify) return;
  // 切换选中状态
  activeSlot.value = activeSlot.value === slotKey ? null : slotKey;
}

// 从仓库安装改件到当前选中的槽位
async function handleInstall(warehouseIndex: number) {
  if (!activeSlot.value) return;
  await store.installMod(warehouseIndex, activeSlot.value);
  activeSlot.value = null; // 安装后收起仓库
}

// 拆卸改件
async function handleUninstall(slotKey: SlotKey) {
  await store.uninstallMod(slotKey);
  // 如果拆卸的是当前展开的槽位，保持展开以便安装新的
}
</script>

<style scoped>
.tab-mod {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

.mod-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #6366f1;
}

.readonly-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  background: #f1f5f9;
  color: #94a3b8;
  margin-left: auto;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
}

/* ─── 槽位 ─── */
.slots-section {
  margin-bottom: 14px;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-card {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  align-items: center;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  position: relative;
}

.slot-card.clickable {
  cursor: pointer;
}

.slot-card.clickable:hover {
  border-color: #c7d2fe;
  background: #fafaff;
}

.slot-card.empty {
  border-style: dashed;
  opacity: 0.7;
}

.slot-card.empty.clickable:hover {
  opacity: 1;
  border-color: #6366f1;
  background: #f5f3ff;
}

.slot-card.active {
  border-color: #6366f1;
  background: #f5f3ff;
  border-style: solid;
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.slot-active-indicator {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
  z-index: 1;
}

.slot-index {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #6366f1;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Rajdhani', monospace;
}

.slot-info {
  flex: 1;
  min-width: 0;
}

.slot-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.slot-grade {
  font-size: 12px;
  font-weight: 900;
  font-family: 'Rajdhani', monospace;
  padding: 1px 6px;
  border-radius: 3px;
}

.grade-S { color: #f59e0b; background: #fef3c7; }
.grade-A { color: #ef4444; background: #fef2f2; }
.grade-B { color: #8b5cf6; background: #f5f3ff; }
.grade-C { color: #06b6d4; background: #ecfeff; }
.grade-D { color: #10b981; background: #ecfdf5; }
.grade-E { color: #94a3b8; background: #f8fafc; }

.slot-name {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-effects {
  display: flex;
  gap: 12px;
}

.effect-plus {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
}

.effect-minus {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
}

.slot-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d1d5db;
  font-size: 12px;
}

/* 拆卸按钮 */
.uninstall-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.uninstall-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

/* ─── 内联仓库 ─── */
.inline-warehouse {
  background: #f8f9ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 10px;
  margin-top: -4px;
  overflow: hidden;
}

.iw-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #4338ca;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e0e7ff;
}

.iw-close {
  margin-left: auto;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.iw-close:hover {
  background: #e0e7ff;
  color: #4338ca;
}

.iw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px;
  color: #cbd5e1;
  font-size: 12px;
}

.iw-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.iw-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.iw-item:hover {
  background: #eef2ff;
  border-color: #6366f1;
}

.iw-item:active {
  transform: scale(0.98);
}

.iw-item-grade {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 900;
  font-family: 'Rajdhani', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.iw-item-info {
  flex: 1;
  min-width: 0;
}

.iw-item-name {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iw-item-effect {
  display: flex;
  gap: 8px;
  font-size: 10px;
}

.effect-plus-sm {
  color: #10b981;
  font-weight: 600;
}

.effect-minus-sm {
  color: #ef4444;
  font-weight: 600;
}

.iw-item-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity 0.15s;
}

.iw-item:hover .iw-item-action {
  opacity: 1;
}

/* 展开动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
  max-height: 300px;
  opacity: 1;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

/* ─── 提示 ─── */
.mod-notice {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  margin-bottom: 14px;
}

.mod-notice span {
  font-size: 11px;
  color: #92400e;
  line-height: 1.5;
}

.mod-notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ─── 最终五维 ─── */
.final-stats-section {
  margin-bottom: 14px;
  background: #fafaff;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 12px;
}

.stats-hint {
  font-weight: 400;
  font-size: 10px;
  color: #94a3b8;
  margin-left: auto;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  grid-template-rows: auto auto;
  gap: 2px 10px;
  align-items: center;
}

.stat-dim {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  grid-row: 1 / 3;
}

.stat-abbr {
  font-size: 9px;
  font-weight: 800;
  font-family: 'Rajdhani', monospace;
  color: #6366f1;
  background: #eef2ff;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.stat-values {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Rajdhani', monospace;
}

.stat-base {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.stat-arrow {
  color: #94a3b8;
  flex-shrink: 0;
}

.stat-eq {
  font-size: 11px;
  color: #cbd5e1;
}

.stat-final {
  font-size: 15px;
  font-weight: 800;
  color: #374151;
}

.stat-final.val-up {
  color: #059669;
}

.stat-final.val-down {
  color: #dc2626;
}

.stat-diff {
  font-size: 11px;
  font-weight: 700;
  padding: 0 4px;
  border-radius: 3px;
}

.diff-up {
  color: #059669;
  background: #ecfdf5;
}

.diff-down {
  color: #dc2626;
  background: #fef2f2;
}

/* 进度条 */
.stat-bar-track {
  grid-column: 2;
  height: 4px;
  background: #e8ecf1;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.stat-bar-base {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #6366f1;
  border-radius: 2px;
  opacity: 0.35;
  transition: width 0.3s ease;
}

.stat-bar-gain {
  position: absolute;
  top: 0;
  height: 100%;
  background: #10b981;
  border-radius: 0 2px 2px 0;
  transition: all 0.3s ease;
}

.stat-bar-loss {
  position: absolute;
  top: 0;
  height: 100%;
  background: #ef4444;
  opacity: 0.5;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.stat-row.stat-up .stat-bar-base {
  opacity: 0.25;
}

.stat-row.stat-down .stat-bar-base {
  opacity: 0.25;
}

/* ─── 空状态 ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: #cbd5e1;
  font-size: 13px;
}
</style>
