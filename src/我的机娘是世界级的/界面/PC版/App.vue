<template>
  <div class="relative font-sans text-slate-200" style="width: 100%; aspect-ratio: 16/9; min-height: 400px;">
    <!-- 剧情视图 -->
    <div
      v-if="ui.currentView === 'story'"
      class="absolute inset-0 flex flex-col"
      style="background: #060a13;"
    >
      <div
        class="flex h-10 shrink-0 items-center px-6"
        style="background: #0c1120; border-bottom: 1px solid rgba(99,130,255,0.15);"
      >
        <span class="text-xs font-bold tracking-widest" style="color: #64748b;">MECH GIRL RACING</span>
        <span class="ml-auto rounded px-2.5 py-0.5 text-xs font-bold" :class="stateClasses">{{ data.世界._当前状态 }}</span>
      </div>
      <div class="custom-scrollbar flex flex-1 justify-center overflow-y-auto px-20 py-10">
        <div class="story-content w-full max-w-[720px] text-sm leading-8" v-html="storyHtml"></div>
      </div>
      <!-- 自定义输入框 -->
      <ChatInput />
    </div>

    <!-- 操作视图 -->
    <div v-else class="absolute inset-0 flex flex-col" style="background: #060a13;">
      <!-- 顶栏 -->
      <div
        class="flex h-12 shrink-0 items-center gap-5 px-5"
        style="background: linear-gradient(90deg, #0c1120, #111827); border-bottom: 1px solid rgba(99,130,255,0.15);"
      >
        <span class="text-sm font-extrabold tracking-[3px]" style="color: #818cf8;">MECH GIRL</span>
        <div class="h-5 w-px" style="background: rgba(99,130,255,0.15);"></div>
        <div class="flex items-center gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" class="h-4 w-4 opacity-60" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2 2"/></svg>
          <span class="font-bold" style="color: #fbbf24;">{{ data.主角.$信用点数.toLocaleString() }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" class="h-4 w-4 opacity-60" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
          <span class="font-bold" style="color: #06b6d4;">{{ data.主角.$强化点数 }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" class="h-4 w-4 opacity-60" fill="none" stroke="#818cf8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span class="font-bold" style="color: #818cf8;">{{ data.主角._赛事等级 }}</span>
        </div>
        <span class="ml-auto rounded px-3 py-0.5 text-xs font-bold tracking-wider" :class="stateClasses">{{ data.世界._当前状态 }}</span>
      </div>

      <!-- 主布局 -->
      <div class="flex flex-1 overflow-hidden">
        <!-- 侧栏 -->
        <div
          class="flex w-[68px] shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-2"
          style="background: #0c1120; border-right: 1px solid rgba(99,130,255,0.15);"
        >
          <template v-for="item in navItems" :key="item.id">
            <div v-if="item.sep" class="my-1.5 h-px w-8" style="background: rgba(99,130,255,0.15);"></div>
            <div
              v-else
              class="nav-item"
              :class="{ active: ui.activePanel === item.id }"
              @click="ui.setPanel(item.id)"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <svg viewBox="0 0 24 24" class="h-5 w-5" v-html="item.icon"></svg>
              <span class="text-[10px]">{{ item.label }}</span>
            </div>
          </template>
        </div>

        <!-- 面板区 -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-6" style="background: #111827;">
          <PanelOverview v-if="ui.activePanel === 'overview'" :data="data" :first-mech-name="firstMechName" :first-mech="firstMech" @navigate="ui.setPanel" />
          <PanelGarage v-else-if="ui.activePanel === 'garage'" :data="data" />
          <PanelShop v-else-if="ui.activePanel === 'shop'" :data="data" />
          <PanelMod v-else-if="ui.activePanel === 'mod'" :first-mech-name="firstMechName" :first-mech="firstMech" />
          <PanelEnroll v-else-if="ui.activePanel === 'enroll'" />
          <PanelAdjust v-else-if="ui.activePanel === 'adjust'" :data="data" :partner-mech="partnerMech" />
          <PanelEnhance v-else-if="ui.activePanel === 'enhance'" :data="data" :first-mech-name="firstMechName" :first-mech="firstMech" />
          <PanelRepair v-else-if="ui.activePanel === 'repair'" :data="data" />
          <PanelRace v-else-if="ui.activePanel === 'race'" :data="data" :partner-mech="partnerMech" />
          <div v-else>
            <div class="panel-title">{{ currentNavLabel }}</div>
            <div class="empty-hint">功能开发中...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视图切换按钮 -->
    <button
      class="absolute right-6 bottom-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full transition-all hover:scale-110"
      style="border: 2px solid rgba(99,130,255,0.5); background: rgba(17,24,39,0.95); backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(99,102,241,0.3);"
      @click="ui.toggleView()"
    >
      <svg v-if="ui.currentView === 'story'" viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round">
        <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useDataStore, useUIStore } from './store';
import { cleanMessageText, textToStoryHtml } from '../utils';
import ChatInput from './components/ChatInput.vue';
import PanelOverview from './panels/PanelOverview.vue';
import PanelGarage from './panels/PanelGarage.vue';
import PanelShop from './panels/PanelShop.vue';
import PanelMod from './panels/PanelMod.vue';
import PanelEnroll from './panels/PanelEnroll.vue';
import PanelAdjust from './panels/PanelAdjust.vue';
import PanelEnhance from './panels/PanelEnhance.vue';
import PanelRepair from './panels/PanelRepair.vue';
import PanelRace from './panels/PanelRace.vue';

const dataStore = useDataStore();
const ui = useUIStore();
const data = computed(() => dataStore.data);

// 剧情文本：使用 textToStoryHtml 而非 formatAsDisplayedMessage，避免酒馆正则（如 /.+/s）将文本替换为代码块
const storyHtml = computed(() => {
  try {
    const msgs = getChatMessages(getCurrentMessageId());
    if (msgs.length > 0) {
      const cleaned = cleanMessageText(msgs[0].message);
      if (cleaned) {
        return textToStoryHtml(cleaned);
      }
    }
  } catch {
    // ignore
  }
  return '<p style="color: #64748b;">等待剧情加载...</p>';
});

const firstMechName = computed(() => Object.keys(data.value.机娘库)[0] ?? null);
const firstMech = computed(() => firstMechName.value ? data.value.机娘库[firstMechName.value] : null);
const partnerMech = computed(() => {
  const name = data.value.当前比赛._搭档机娘;
  return name ? data.value.机娘库[name] ?? null : null;
});

const stateClasses = computed(() => {
  const s = data.value.世界._当前状态;
  if (s === '日常') return 'bg-emerald-500/15 text-emerald-400';
  if (s === '赛前准备') return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
});

const navItems = [
  { id: 'overview', label: '总览', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { id: 'garage', label: '机库', icon: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-5H9L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>' },
  { id: 'shop', label: '商店', icon: '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>' },
  { id: 'mod', label: '改装', icon: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>' },
  { sep: true, id: 'sep1', label: '', icon: '' },
  { id: 'enroll', label: '赛事', icon: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>' },
  { id: 'adjust', label: '配置', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>' },
  { id: 'enhance', label: '强化', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
  { id: 'repair', label: '维修', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { sep: true, id: 'sep2', label: '', icon: '' },
  { id: 'race', label: '比赛', icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
];

const currentNavLabel = computed(() => navItems.find((n: { id: string }) => n.id === ui.activePanel)?.label ?? '');
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,130,255,0.5); border-radius: 2px; }

.story-content :deep(p) { margin-bottom: 16px; }

.nav-item {
  width: 52px; height: 52px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  border-radius: 8px; cursor: pointer; transition: all 0.2s; color: #64748b; position: relative;
}
.nav-item svg { stroke: currentColor; fill: none; stroke-width: 1.5; }
.nav-item:hover { background: #1a2236; color: #94a3b8; }
.nav-item.active {
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05));
  color: #818cf8; border: 1px solid rgba(99,130,255,0.5);
}
.nav-item.active::before {
  content: ''; position: absolute; left: 0; top: 10px; bottom: 10px;
  width: 3px; background: #6366f1; border-radius: 0 2px 2px 0;
}

.panel-title {
  font-size: 20px; font-weight: 700; margin-bottom: 20px;
  display: flex; align-items: center; gap: 10px;
}
.panel-title::before {
  content: ''; width: 4px; height: 20px; background: #6366f1; border-radius: 2px;
}

.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 40px 0; }
</style>
