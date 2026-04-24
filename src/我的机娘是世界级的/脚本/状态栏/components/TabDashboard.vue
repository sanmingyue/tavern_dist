<template>
  <div class="tab-dashboard">
    <!-- 信息条 -->
    <div class="info-strip">
      <div class="info-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#06b6d4" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" stroke-linecap="round" />
        </svg>
        <span>{{ store.data.世界.当前时间 || '——' }}</span>
      </div>
      <div class="info-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{{ store.data.世界.当前地点 || '——' }}</span>
      </div>
      <div class="info-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M3 15h4l3-9 4 18 3-9h4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ store.data.世界.天气 }}</span>
      </div>
    </div>

    <!-- 核心数据卡片 -->
    <div class="stats-row">
      <!-- 信用点 -->
      <div class="stat-card credits">
        <div class="stat-card-header">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M14.5 9a3.5 3.5 0 00-5 0c-.7.7-1 1.5-.8 2.5.3 1.5 2.3 2 3.8 2.5 1 .3 2 .8 2 1.5 0 1-1.3 1.5-2.5 1.5-1.5 0-2.5-.5-3-1.5" stroke-linecap="round" />
            <path d="M12 6v2M12 16v2" stroke-linecap="round" />
          </svg>
          <span>信用点</span>
        </div>
        <div class="stat-big-number">{{ store.data.主角.$信用点数.toLocaleString() }}</div>
        <div class="stat-unit">CR</div>
      </div>

      <!-- 赛事等级 -->
      <div class="stat-card tier">
        <div class="stat-card-header">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="2">
            <polygon points="12,2 15,8.5 22,9.3 17,14 18.2,21 12,17.5 5.8,21 7,14 2,9.3 9,8.5" />
          </svg>
          <span>等级</span>
        </div>
        <div class="stat-big-number tier-value">{{ store.data.主角._赛事等级 }}</div>
        <div class="stat-unit">TIER</div>
      </div>

      <!-- 赛季积分 -->
      <div class="stat-card points">
        <div class="stat-card-header">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2">
            <path d="M12 20V10M18 20V4M6 20v-4" stroke-linecap="round" />
          </svg>
          <span>积分</span>
        </div>
        <div class="stat-big-number">{{ store.data.主角.赛季积分 }}</div>
        <div class="stat-unit">PTS</div>
      </div>
    </div>

    <!-- 车队 -->
    <div class="team-bar">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94a3b8" stroke-width="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" />
      </svg>
      <span class="team-label">车队</span>
      <span class="team-name">{{ store.data.主角.车队 }}</span>
    </div>

    <!-- 机娘快览 -->
    <div class="mech-preview" v-if="store.mechCount > 0">
      <div class="mech-preview-header">
        <span class="section-label">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6366f1" stroke-width="2">
            <rect x="2" y="12" width="20" height="6" rx="2" />
            <path d="M5 12l2-5h10l2 5" stroke-linecap="round" />
            <circle cx="7" cy="18" r="1.5" fill="none" />
            <circle cx="17" cy="18" r="1.5" fill="none" />
          </svg>
          机娘概览
        </span>
        <span class="mech-count-badge">{{ store.mechCount }} 台</span>
      </div>
      <div class="mech-mini-list">
        <div
          v-for="name in store.mechNames"
          :key="name"
          class="mech-mini-item"
        >
          <span class="mech-mini-name">{{ name }}</span>
          <span class="mech-mini-model">{{ store.data.机娘库[name]._赛车型号 }}</span>
          <span class="mech-mini-status" :class="store.data.机娘库[name].状态 === '正常' ? 'ok' : 'warn'">
            {{ store.data.机娘库[name].状态 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore } from '../store';
const store = useStatusStore();
</script>

<style scoped>
.tab-dashboard {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

/* 信息条 */
.info-strip {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

/* 核心数据卡片 */
.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-card {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e8ecf1;
  background: #fff;
  text-align: center;
  /* 赛车风格微斜切 */
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-big-number {
  font-size: 24px;
  font-weight: 900;
  color: #1e1b4b;
  font-family: 'Rajdhani', monospace, system-ui;
  line-height: 1;
}

.stat-big-number.tier-value {
  color: #6366f1;
}

.stat-unit {
  font-size: 9px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 2px;
}

/* 车队 */
.team-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 12px;
}

.team-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.team-name {
  font-size: 13px;
  font-weight: 700;
  color: #0c4a6e;
  flex: 1;
}

/* 机娘快览 */
.mech-preview {
  background: #fafbfe;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 10px 12px;
}

.mech-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

.mech-count-badge {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 1px 8px;
  border-radius: 4px;
}

.mech-mini-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mech-mini-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
}

.mech-mini-name {
  font-size: 12px;
  font-weight: 700;
  color: #1e1b4b;
  min-width: 60px;
}

.mech-mini-model {
  font-size: 10px;
  color: #94a3b8;
  flex: 1;
  font-family: 'Rajdhani', monospace;
}

.mech-mini-status {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
}

.mech-mini-status.ok {
  background: #ecfdf5;
  color: #059669;
}

.mech-mini-status.warn {
  background: #fef3c7;
  color: #d97706;
}

/* 手机适配 */
@media (max-width: 480px) {
  .stats-row {
    gap: 6px;
  }

  .stat-big-number {
    font-size: 20px;
  }

  .info-strip {
    gap: 8px;
  }
}
</style>
