<template>
  <div>
    <div class="panel-title">维修站</div>
    <div v-for="(mech, name) in data.机娘库" :key="name" class="card mb-2 flex items-center gap-4">
      <div class="mech-avatar" style="width: 48px; height: 48px;">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#fff" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      </div>
      <div class="flex-1">
        <div class="font-semibold">{{ name }}</div>
        <div class="text-xs" style="color: #64748b;">{{ mech._赛车型号 }}</div>
      </div>
      <span :class="mech.状态 === '正常' ? 'badge-green' : 'badge-red'">{{ mech.状态 }}</span>
      <span v-if="mech.状态 === '正常'" class="text-xs" style="color: #64748b;">无需维修</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
defineProps<{ data: Schema }>();
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.panel-title::before { content: ''; width: 4px; height: 20px; background: #6366f1; border-radius: 2px; }
.card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.card:hover { border-color: rgba(99,130,255,0.5); background: #212d47; }
.mech-avatar { border-radius: 50%; background: linear-gradient(135deg, #6366f1, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.badge-green { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.15); color: #10b981; }
.badge-red { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(239,68,68,0.15); color: #ef4444; }
</style>
