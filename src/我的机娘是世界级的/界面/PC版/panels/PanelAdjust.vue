<template>
  <div>
    <div class="panel-title">参赛配置</div>
    <div v-if="data.当前比赛._搭档机娘 && partnerMech">
      <div class="mb-4 text-xs" style="color: #64748b;">
        {{ data.当前比赛._赛事级别 }} · 搭档：{{ data.当前比赛._搭档机娘 }}
      </div>
      <div v-for="dim in dimensions" :key="dim.key" class="mb-1 flex items-center gap-2">
        <span class="w-9 text-right text-[11px] font-semibold tracking-wider" style="color: #64748b;">{{ dim.label }}</span>
        <div class="h-1.5 flex-1 overflow-hidden rounded-full" style="background: rgba(255,255,255,0.05);">
          <div class="h-full rounded-full" :class="'bar-' + dim.barClass" :style="{ width: data.当前比赛._参赛五维[dim.key] + '%' }"></div>
        </div>
        <span class="w-7 text-right text-xs font-bold">{{ data.当前比赛._参赛五维[dim.key] }}</span>
      </div>
    </div>
    <div v-else class="empty-hint">未报名赛事</div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { dimensions } from './shared';

defineProps<{
  data: Schema;
  partnerMech: Schema['机娘库'][string] | null;
}>();
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.panel-title::before { content: ''; width: 4px; height: 20px; background: #6366f1; border-radius: 2px; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 40px 0; }
.bar-acc { background: linear-gradient(90deg, #ef4444, #f97316); }
.bar-spd { background: linear-gradient(90deg, #f59e0b, #eab308); }
.bar-hdl { background: linear-gradient(90deg, #06b6d4, #0ea5e9); }
.bar-dft { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.bar-end { background: linear-gradient(90deg, #10b981, #34d399); }
</style>
