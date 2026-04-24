<template>
  <div class="tab-pre-battle">
    <!-- 赛事信息 -->
    <div class="race-info-card" v-if="store.data.当前比赛._赛事名称">
      <div class="race-banner">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
        </svg>
        <span class="race-name">{{ store.data.当前比赛._赛事名称 }}</span>
      </div>
      <div class="race-details">
        <div class="race-detail-item">
          <span class="detail-label">类型</span>
          <span class="detail-value">{{ store.data.当前比赛._赛事类型 || '——' }}</span>
        </div>
        <div class="race-detail-item">
          <span class="detail-label">级别</span>
          <span class="detail-value tier">{{ store.data.当前比赛._赛事级别 || '——' }}</span>
        </div>
        <div class="race-detail-item">
          <span class="detail-label">圈数</span>
          <span class="detail-value">{{ store.data.当前比赛.总圈数 }}</span>
        </div>
      </div>
    </div>
    <div v-else class="no-race">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#cbd5e1" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
      </svg>
      <span>尚未选定赛事</span>
    </div>

    <!-- 信用点余额 -->
    <div class="credits-bar">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v2M12 16v2" stroke-linecap="round" />
      </svg>
      <span class="credits-label">可用资金</span>
      <span class="credits-value">{{ store.data.主角.$信用点数.toLocaleString() }} CR</span>
    </div>

    <!-- 搭档机娘快览 -->
    <div class="partner-preview" v-if="store.partnerMechName && store.partnerMech">
      <div class="partner-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>搭档机娘</span>
      </div>
      <div class="partner-mini">
        <span class="partner-name">{{ store.partnerMechName }}</span>
        <span class="partner-model">{{ store.partnerMech._赛车型号 }}</span>
        <span class="partner-status" :class="store.partnerMech.状态 === '正常' ? 'ok' : 'warn'">
          {{ store.partnerMech.状态 }}
        </span>
      </div>
      <div class="partner-resonance">
        <span class="res-label">共鸣</span>
        <div class="res-bar-track">
          <div class="res-bar-fill" :style="{ width: (store.partnerMech.共鸣.当前共鸣值 / store.partnerMech.共鸣._共鸣上限 * 100) + '%' }"></div>
        </div>
        <span class="res-val">{{ store.partnerMech.共鸣.当前共鸣值 }}/{{ store.partnerMech.共鸣._共鸣上限 }}</span>
      </div>
    </div>
    <div v-else class="no-partner">
      <span>未指定搭档机娘</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore } from '../store';
const store = useStatusStore();
</script>

<style scoped>
.tab-pre-battle {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

/* 赛事信息 */
.race-info-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.race-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
  border-bottom: 2px solid #f59e0b;
}

.race-name {
  font-size: 15px;
  font-weight: 800;
  color: #92400e;
  letter-spacing: 0.5px;
  font-family: 'Rajdhani', system-ui;
}

.race-details {
  display: flex;
  gap: 0;
  padding: 0;
}

.race-detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  border-right: 1px solid #f1f5f9;
}

.race-detail-item:last-child {
  border-right: none;
}

.detail-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 15px;
  font-weight: 800;
  color: #374151;
  font-family: 'Rajdhani', monospace;
}

.detail-value.tier {
  color: #6366f1;
}

.no-race {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  color: #cbd5e1;
  font-size: 13px;
}

/* 信用点 */
.credits-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  margin-bottom: 12px;
}

.credits-label {
  font-size: 12px;
  color: #92400e;
  flex: 1;
}

.credits-value {
  font-size: 18px;
  font-weight: 900;
  color: #f59e0b;
  font-family: 'Rajdhani', monospace;
}

/* 搭档快览 */
.partner-preview {
  background: #fafbfe;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 12px;
}

.partner-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
}

.partner-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.partner-name {
  font-size: 14px;
  font-weight: 800;
  color: #1e1b4b;
}

.partner-model {
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Rajdhani', monospace;
  flex: 1;
}

.partner-status {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
}

.partner-status.ok {
  background: #ecfdf5;
  color: #059669;
}

.partner-status.warn {
  background: #fef3c7;
  color: #d97706;
}

.partner-resonance {
  display: flex;
  align-items: center;
  gap: 6px;
}

.res-label {
  font-size: 10px;
  color: #94a3b8;
  width: 28px;
}

.res-bar-track {
  flex: 1;
  height: 5px;
  background: #e8ecf1;
  border-radius: 3px;
  overflow: hidden;
}

.res-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 3px;
  transition: width 0.4s;
}

.res-val {
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
  font-family: 'Rajdhani', monospace;
  min-width: 45px;
  text-align: right;
}

.no-partner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #cbd5e1;
  font-size: 12px;
}
</style>
