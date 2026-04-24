<template>
  <div class="tab-opponents">
    <div class="opponents-header">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" />
      </svg>
      <span>对手列表</span>
      <span class="opponent-count">{{ opponentCount }} 人</span>
    </div>

    <div v-if="opponentCount === 0" class="empty-state">
      <span>暂无对手数据</span>
    </div>

    <div v-else class="opponents-list">
      <div
        v-for="(opponent, name) in store.data.当前比赛.对手"
        :key="name"
        class="opponent-row"
      >
        <div class="opp-rank" :class="getRankClass(opponent.当前排名)">
          {{ opponent.当前排名 || '--' }}
        </div>
        <div class="opp-info">
          <div class="opp-driver">{{ opponent.车手名 || name }}</div>
          <div class="opp-mech">{{ opponent.机娘名 }}</div>
        </div>
        <div class="opp-skill">
          <span class="opp-skill-name">{{ opponent.共鸣技能 }}</span>
          <span class="opp-skill-status" :class="{ used: opponent.技能已使用 }">
            {{ opponent.技能已使用 ? 'USED' : 'HOLD' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStatusStore } from '../store';

const store = useStatusStore();

const opponentCount = computed(() => Object.keys(store.data.当前比赛.对手).length);

function getRankClass(rank: number) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return '';
}
</script>

<style scoped>
.tab-opponents {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

.opponents-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ef4444;
}

.opponent-count {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 4px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  color: #cbd5e1;
  font-size: 13px;
}

.opponents-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.opponent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  transition: background 0.2s;
}

.opponent-row:hover {
  background: #fafbfe;
}

.opp-rank {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 14px;
  font-weight: 900;
  font-family: 'Rajdhani', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.opp-rank.rank-1 {
  background: #fef3c7;
  color: #d97706;
}

.opp-rank.rank-2 {
  background: #f1f5f9;
  color: #94a3b8;
}

.opp-rank.rank-3 {
  background: #fef2f2;
  color: #dc2626;
}

.opp-info {
  flex: 1;
  min-width: 0;
}

.opp-driver {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.opp-mech {
  font-size: 10px;
  color: #94a3b8;
}

.opp-skill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.opp-skill-name {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
}

.opp-skill-status {
  font-size: 8px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 3px;
  background: #ecfdf5;
  color: #059669;
  letter-spacing: 0.5px;
}

.opp-skill-status.used {
  background: #f1f5f9;
  color: #94a3b8;
  text-decoration: line-through;
}
</style>
