<template>
  <div class="step-page">
    <div class="step-header">
      <div class="step-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#8b5cf6" stroke-width="1.8">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h2 class="step-title">选择你的搭档</h2>
      <p class="step-desc">点击查看详情，选择一位机娘开始你们的故事</p>
    </div>

    <!-- 机娘卡片列表 -->
    <div class="mech-grid">
      <div
        v-for="(girl, i) in presets"
        :key="girl.name"
        class="mech-card"
        :class="{ selected: store.selectedPresetIndex === i, expanded: expandedIndex === i }"
        @click="toggleExpand(i)"
      >
        <div class="card-top">
          <div class="card-name-row">
            <span class="card-name">{{ girl.name }}</span>
            <span class="card-model">{{ girl.carModel }}</span>
          </div>
          <div class="card-stats-mini">
            <span v-for="dim in dimensions" :key="dim" class="mini-stat">
              <span class="mini-label">{{ dimLabels[dim] }}</span>
              <span class="mini-val" :class="getStatClass(girl.stats[dim])">{{ girl.stats[dim] }}</span>
            </span>
          </div>
        </div>

        <!-- 展开详情 -->
        <transition name="expand">
          <div v-if="expandedIndex === i" class="card-detail">
            <div class="detail-section">
              <div class="detail-row">
                <span class="detail-label">发动机</span>
                <span class="detail-value">{{ girl.carType }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">身高</span>
                <span class="detail-value">{{ girl.height }}</span>
              </div>
            </div>

            <div class="detail-intro">{{ girl.intro }}</div>

            <!-- 五维条 -->
            <div class="detail-stats">
              <div v-for="dim in dimensions" :key="dim" class="stat-row">
                <span class="stat-name">{{ dim }}</span>
                <div class="stat-track">
                  <div class="stat-fill" :style="{ width: girl.stats[dim] + '%' }" :class="getStatClass(girl.stats[dim])"></div>
                </div>
                <span class="stat-num" :class="getStatClass(girl.stats[dim])">{{ girl.stats[dim] }}</span>
              </div>
              <div class="stat-total">
                五维总和: <strong>{{ getTotalStats(girl.stats) }}</strong>
              </div>
            </div>

            <!-- 技能 -->
            <div class="detail-skill">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div>
                <span class="skill-name">{{ girl.skill.name }}</span>
                <span class="skill-desc">{{ girl.skill.desc }}</span>
              </div>
            </div>

            <!-- 性格 -->
            <div class="detail-personality">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42" stroke-linecap="round" />
              </svg>
              <span>{{ girl.personality }}</span>
            </div>

            <!-- 选择按钮 -->
            <button
              class="select-btn"
              :class="{ active: store.selectedPresetIndex === i }"
              @click.stop="selectMech(i)"
            >
              {{ store.selectedPresetIndex === i ? '✓ 已选择' : '选择她' }}
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <button class="nav-btn secondary" @click="store.prevStep()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        返回
      </button>
      <button class="nav-btn primary" :disabled="!store.isPresetSelected" @click="store.nextStep()">
        下一步：开场白
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCreationStore, PRESET_MECH_GIRLS, type FiveDimensions } from '../store';

const store = useCreationStore();
const presets = PRESET_MECH_GIRLS;
const dimensions: (keyof FiveDimensions)[] = ['加速度', '极速', '操控', '漂移', '耐久'];
const dimLabels: Record<keyof FiveDimensions, string> = {
  加速度: 'ACC',
  极速: 'SPD',
  操控: 'HDL',
  漂移: 'DFT',
  耐久: 'END',
};

const expandedIndex = ref<number | null>(null);

function toggleExpand(i: number) {
  expandedIndex.value = expandedIndex.value === i ? null : i;
}

function selectMech(i: number) {
  store.selectedPresetIndex = store.selectedPresetIndex === i ? null : i;
}

function getStatClass(value: number): string {
  if (value >= 90) return 'stat-top';
  if (value >= 75) return 'stat-high';
  if (value >= 60) return 'stat-mid';
  if (value >= 45) return 'stat-low';
  return 'stat-weak';
}

function getTotalStats(s: FiveDimensions): number {
  return s.加速度 + s.极速 + s.操控 + s.漂移 + s.耐久;
}
</script>

<style scoped>
.step-page {
  padding-bottom: 16px;
}

.step-header {
  text-align: center;
  margin-bottom: 20px;
}

.step-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: #f5f3ff;
  border-radius: 14px;
  margin-bottom: 8px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 4px;
}

.step-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* 机娘卡片网格 */
.mech-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mech-card {
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.mech-card:hover {
  border-color: #c7d2fe;
}

.mech-card.selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.mech-card.expanded {
  border-color: #a5b4fc;
}

.card-top {
  padding: 14px 16px;
}

.card-name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.card-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e1b4b;
}

.card-model {
  font-size: 12px;
  color: #94a3b8;
}

/* 迷你五维 */
.card-stats-mini {
  display: flex;
  gap: 6px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex: 1;
}

.mini-label {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
}

.mini-val {
  font-size: 13px;
  font-weight: 700;
}

.mini-val.stat-top { color: #dc2626; }
.mini-val.stat-high { color: #ea580c; }
.mini-val.stat-mid { color: #6366f1; }
.mini-val.stat-low { color: #64748b; }
.mini-val.stat-weak { color: #cbd5e1; }

/* 展开详情 */
.card-detail {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
}

.detail-section {
  display: flex;
  gap: 16px;
  margin: 12px 0;
}

.detail-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.detail-label {
  font-size: 11px;
  color: #94a3b8;
}

.detail-value {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.detail-intro {
  font-size: 13px;
  color: #4a4563;
  line-height: 1.7;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #f8f7ff;
  border-radius: 8px;
}

/* 详情五维条 */
.detail-stats {
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stat-name {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  width: 36px;
  flex-shrink: 0;
}

.stat-track {
  flex: 1;
  height: 5px;
  background: #e8ecf1;
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.stat-fill.stat-top { background: linear-gradient(90deg, #fca5a5, #dc2626); }
.stat-fill.stat-high { background: linear-gradient(90deg, #fed7aa, #ea580c); }
.stat-fill.stat-mid { background: linear-gradient(90deg, #a5b4fc, #6366f1); }
.stat-fill.stat-low { background: linear-gradient(90deg, #cbd5e1, #64748b); }
.stat-fill.stat-weak { background: linear-gradient(90deg, #e2e8f0, #94a3b8); }

.stat-num {
  font-size: 12px;
  font-weight: 700;
  width: 24px;
  text-align: right;
}

.stat-num.stat-top { color: #dc2626; }
.stat-num.stat-high { color: #ea580c; }
.stat-num.stat-mid { color: #6366f1; }
.stat-num.stat-low { color: #64748b; }
.stat-num.stat-weak { color: #94a3b8; }

.stat-total {
  text-align: right;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.stat-total strong {
  color: #6366f1;
  font-size: 13px;
}

/* 技能 */
.detail-skill {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 10px;
  margin-bottom: 8px;
}

.detail-skill svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.skill-name {
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
  display: block;
}

.skill-desc {
  font-size: 11px;
  color: #78716c;
  line-height: 1.5;
  display: block;
  margin-top: 2px;
}

/* 性格 */
.detail-personality {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  background: #eef2ff;
  border-radius: 8px;
  margin-bottom: 12px;
}

.detail-personality span {
  font-size: 11px;
  color: #4338ca;
  line-height: 1.4;
}

/* 选择按钮 */
.select-btn {
  width: 100%;
  padding: 10px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.25s ease;
}

.select-btn:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.select-btn.active {
  border-color: #6366f1;
  background: #6366f1;
  color: #fff;
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 600px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* 底部导航 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.nav-btn.primary:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.nav-btn.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
}

.nav-btn.secondary:hover {
  background: #e2e8f0;
}

/* 手机适配 */
@media (max-width: 480px) {
  .card-top {
    padding: 12px 12px;
  }

  .card-name {
    font-size: 14px;
  }

  .card-stats-mini {
    gap: 4px;
  }

  .mini-label {
    font-size: 8px;
  }

  .mini-val {
    font-size: 12px;
  }

  .card-detail {
    padding: 0 12px 12px;
  }

  .detail-section {
    flex-direction: column;
    gap: 4px;
  }

  .nav-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>
