<template>
  <div>
    <div class="panel-title">机库</div>
    <div class="grid grid-cols-2 gap-3">
      <div v-for="(mech, name) in data.机娘库" :key="name" class="card">
        <div class="mb-2.5 flex items-center gap-3">
          <div class="mech-avatar">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#fff" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          </div>
          <div class="flex-1">
            <div class="text-base font-bold">{{ name }}</div>
            <div class="text-xs" style="color: #64748b;">
              {{ mech._赛车型号 }} · {{ mech._赛车类型 }}
              <span class="badge-green ml-1">{{ mech.状态 }}</span>
            </div>
          </div>
        </div>
        <div v-for="dim in dimensions" :key="dim.key" class="mb-1 flex items-center gap-2">
          <span class="w-9 text-right text-[11px] font-semibold tracking-wider" style="color: #64748b;">{{ dim.label }}</span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.05);">
            <div class="h-full rounded-full" :class="'bar-' + dim.barClass" :style="{ width: mech._五维[dim.key] + '%' }"></div>
          </div>
          <span class="w-7 text-right text-xs font-bold">{{ mech._五维[dim.key] }}</span>
        </div>
        <div class="mt-2 text-[11px]" style="color: #64748b;">
          <div>天赋：{{ mech._天赋维度.join('、') || '未知' }}</div>
          <div v-if="mech.共鸣._已激活">共鸣：<span style="color: #06b6d4;">{{ mech.共鸣._技能名 }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { dimensions } from './shared';

defineProps<{ data: Schema }>();
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.panel-title::before { content: ''; width: 4px; height: 20px; background: #6366f1; border-radius: 2px; }
.card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.card:hover { border-color: rgba(99,130,255,0.5); background: #212d47; }
.mech-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #06b6d4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.badge-green { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.15); color: #10b981; }
.bar-acc { background: linear-gradient(90deg, #ef4444, #f97316); }
.bar-spd { background: linear-gradient(90deg, #f59e0b, #eab308); }
.bar-hdl { background: linear-gradient(90deg, #06b6d4, #0ea5e9); }
.bar-dft { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.bar-end { background: linear-gradient(90deg, #10b981, #34d399); }
</style>
