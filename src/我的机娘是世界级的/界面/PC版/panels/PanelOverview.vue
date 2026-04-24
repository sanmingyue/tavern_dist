<template>
  <div>
    <div class="panel-title">总览</div>
    <div class="mb-5 grid grid-cols-3 gap-4">
      <div class="card text-center">
        <div class="text-3xl font-extrabold" style="color: #fbbf24;">{{ data.主角.$信用点数.toLocaleString() }}</div>
        <div class="mt-1 text-xs" style="color: #64748b;">信用点数</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold" style="color: #06b6d4;">{{ data.主角.$强化点数 }}</div>
        <div class="mt-1 text-xs" style="color: #64748b;">强化点数</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-extrabold" style="color: #818cf8;">{{ data.主角._赛事等级 }}</div>
        <div class="mt-1 text-xs" style="color: #64748b;">赛事等级</div>
      </div>
    </div>
    <div class="card mb-3" v-if="firstMechName">
      <div class="mb-2 text-xs font-bold">当前搭档</div>
      <div class="flex items-center gap-3">
        <div class="mech-avatar">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#fff" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </div>
        <div>
          <div class="font-semibold">{{ firstMechName }}</div>
          <div class="text-xs" style="color: #64748b;">{{ firstMech?._赛车型号 }}</div>
        </div>
        <span class="badge-green ml-auto">{{ firstMech?.状态 }}</span>
      </div>
    </div>
    <div class="card">
      <div class="mb-2 text-xs font-bold">快捷操作</div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-primary" @click="$emit('navigate', 'enroll')">赛事报名</button>
        <button class="btn-secondary" @click="$emit('navigate', 'shop')">商店</button>
        <button class="btn-secondary" @click="$emit('navigate', 'enhance')">强化</button>
        <button class="btn-secondary" @click="$emit('navigate', 'mod')">改装</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';

defineProps<{
  data: Schema;
  firstMechName: string | null;
  firstMech: Schema['机娘库'][string] | null;
}>();

defineEmits<{
  navigate: [panel: string];
}>();
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.panel-title::before { content: ''; width: 4px; height: 20px; background: #6366f1; border-radius: 2px; }
.card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.card:hover { border-color: rgba(99,130,255,0.5); background: #212d47; }
.mech-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.badge-green { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.15); color: #10b981; }
.btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 20px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; box-shadow: 0 2px 12px rgba(99,102,241,0.3); }
.btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 20px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: #1a2236; color: #94a3b8; }
.btn-secondary:hover { border-color: rgba(99,130,255,0.5); color: #e2e8f0; }
</style>
