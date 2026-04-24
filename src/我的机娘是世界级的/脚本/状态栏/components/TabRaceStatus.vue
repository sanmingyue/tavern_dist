<template>
  <div class="tab-race">
    <!-- 赛事横幅 -->
    <div class="race-banner">
      <div class="banner-left">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2">
          <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
        </svg>
        <div>
          <div class="race-name">{{ store.data.当前比赛._赛事名称 || 'RACE' }}</div>
          <div class="race-type">{{ store.data.当前比赛._赛事类型 || '' }} · {{ store.data.当前比赛._赛事级别 || '' }}</div>
        </div>
      </div>
      <div class="race-track-status" v-if="store.data.当前比赛.赛道状态">
        {{ store.data.当前比赛.赛道状态 }}
      </div>
    </div>

    <!-- 核心赛况：排名 + 圈数 -->
    <div class="race-core">
      <div class="rank-display">
        <span class="rank-label">RANK</span>
        <span class="rank-number">{{ store.data.当前比赛.当前排名 || '--' }}</span>
      </div>
      <div class="lap-display">
        <span class="lap-label">LAP</span>
        <div class="lap-progress">
          <div class="lap-bar-track">
            <div
              class="lap-bar-fill"
              :style="{ width: lapPercent + '%' }"
            ></div>
          </div>
          <span class="lap-text">{{ store.data.当前比赛.当前圈数 }} / {{ store.data.当前比赛.总圈数 }}</span>
        </div>
      </div>
    </div>

    <!-- 搭档机娘迷你状态 -->
    <div class="partner-mini-bar" v-if="store.partnerMechName && store.partnerMech">
      <div class="mini-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="mini-name">{{ store.partnerMechName }}</span>
        <span class="mini-status" :class="store.partnerMech.状态 === '正常' ? 'ok' : 'warn'">
          {{ store.partnerMech.状态 }}
        </span>
      </div>
      <div class="mini-bars">
        <div class="mini-bar-row">
          <span class="bar-label">共鸣</span>
          <div class="bar-track">
            <div class="bar-fill resonance" :style="{ width: resonancePercent + '%' }"></div>
          </div>
          <span class="bar-val">{{ store.partnerMech.共鸣.当前共鸣值 }}</span>
        </div>
        <div class="mini-bar-row">
          <span class="bar-label">耐久</span>
          <div class="bar-track">
            <div class="bar-fill endurance" :style="{ width: store.partnerMech.五维.耐久 + '%' }"></div>
          </div>
          <span class="bar-val">{{ store.partnerMech.五维.耐久 }}</span>
        </div>
      </div>
      <div class="skill-status">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ store.partnerMech.共鸣._技能名 }}</span>
        <span class="skill-badge" :class="{ ready: store.partnerMech.共鸣._已激活 }">
          {{ store.partnerMech.共鸣._已激活 ? 'READY' : 'LOCKED' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStatusStore } from '../store';

const store = useStatusStore();

const lapPercent = computed(() => {
  const total = store.data.当前比赛.总圈数;
  if (total <= 0) return 0;
  return Math.min((store.data.当前比赛.当前圈数 / total) * 100, 100);
});

const resonancePercent = computed(() => {
  if (!store.partnerMech) return 0;
  const max = store.partnerMech.共鸣._共鸣上限;
  if (max <= 0) return 0;
  return (store.partnerMech.共鸣.当前共鸣值 / max) * 100;
});
</script>

<style scoped>
.tab-race {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

/* 赛事横幅 */
.race-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #fef2f2, #fff1f2);
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 12px;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.race-name {
  font-size: 15px;
  font-weight: 900;
  color: #991b1b;
  letter-spacing: 0.5px;
  font-family: 'Rajdhani', system-ui;
}

.race-type {
  font-size: 10px;
  color: #dc2626;
  font-weight: 500;
}

.race-track-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
}

/* 核心赛况 */
.race-core {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.rank-display {
  width: 90px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  text-align: center;
  flex-shrink: 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
}

.rank-label {
  font-size: 9px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 2px;
}

.rank-number {
  font-size: 36px;
  font-weight: 900;
  color: #ef4444;
  font-family: 'Rajdhani', monospace;
  line-height: 1;
}

.lap-display {
  flex: 1;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
}

.lap-label {
  font-size: 9px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 2px;
  display: block;
  margin-bottom: 6px;
}

.lap-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lap-bar-track {
  height: 8px;
  background: #e8ecf1;
  border-radius: 4px;
  overflow: hidden;
}

.lap-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.lap-text {
  font-size: 18px;
  font-weight: 900;
  color: #1e1b4b;
  font-family: 'Rajdhani', monospace;
}

/* 搭档迷你条 */
.partner-mini-bar {
  background: #fafbfe;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 10px 12px;
}

.mini-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.mini-name {
  font-size: 13px;
  font-weight: 800;
  color: #1e1b4b;
  flex: 1;
}

.mini-status {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
}

.mini-status.ok { background: #ecfdf5; color: #059669; }
.mini-status.warn { background: #fef3c7; color: #d97706; }

.mini-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.mini-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar-label {
  font-size: 10px;
  color: #94a3b8;
  width: 28px;
  font-weight: 600;
}

.bar-track {
  flex: 1;
  height: 5px;
  background: #e8ecf1;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}

.bar-fill.resonance {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.bar-fill.endurance {
  background: linear-gradient(90deg, #6ee7b7, #10b981);
}

.bar-val {
  font-size: 11px;
  font-weight: 700;
  color: #374151;
  font-family: 'Rajdhani', monospace;
  width: 28px;
  text-align: right;
}

/* 技能状态 */
.skill-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #92400e;
}

.skill-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 3px;
  background: #f1f5f9;
  color: #94a3b8;
  letter-spacing: 0.5px;
  margin-left: auto;
}

.skill-badge.ready {
  background: #fef3c7;
  color: #d97706;
}
</style>
