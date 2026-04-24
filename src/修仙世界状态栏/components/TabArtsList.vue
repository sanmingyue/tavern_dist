<template>
  <div class="arts-list">
    <!-- 空状态 -->
    <div v-if="store.learnedArts.length === 0" class="arts-empty">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--accent-gold)" stroke-width="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
      </svg>
      <p class="empty-text">尚未学会任何百艺</p>
      <p class="empty-sub">完成相应任务后可解锁百艺</p>
    </div>

    <!-- 百艺卡片列表 -->
    <div v-else class="arts-grid">
      <button
        v-for="art in store.learnedArts"
        :key="art.key"
        class="art-card"
        :style="{ '--art-color': art.color }"
        @click="store.openArtsPage(art.key)"
      >
        <div class="art-icon">
          <component :is="artIcon(art.icon)" />
        </div>
        <div class="art-info">
          <span class="art-name">{{ art.name }}</span>
          <span class="art-realm">{{ getArtRealm(art) }}</span>
        </div>
        <div class="art-arrow">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { useStatusStore, type ArtConfig } from '../store';

// 简单 SVG 图标组件
const IconFlask = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M9 3h6M9 3v6l-5 8a2 2 0 0 0 1.6 3H18.4a2 2 0 0 0 1.6-3l-5-8V3' }),
  h('path', { d: 'M7 15h10' }),
]);

const IconHammer = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9' }),
  h('path', { d: 'M17.64 15L22 10.64' }),
  h('path', { d: 'M20.91 11.7a1.65 1.65 0 0 0-.15-2.04l-4.26-4.26a1.65 1.65 0 0 0-2.04-.15' }),
]);

const IconHexagon = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M12 2l8.5 4.9v9.2L12 22l-8.5-4.9V6.9L12 2z' }),
]);

const IconScroll = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2h4' }),
  h('path', { d: 'M19 17V5a2 2 0 0 0-2-2H4' }),
]);

const IconPaw = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('circle', { cx: 11, cy: 4, r: 2 }),
  h('circle', { cx: 18, cy: 8, r: 2 }),
  h('circle', { cx: 4, cy: 8, r: 2 }),
  h('path', { d: 'M12 13c-3.5 0-6.5 2.5-6.5 6 0 2 1 3.5 3 4.5h7c2-1 3-2.5 3-4.5 0-3.5-3-6-6.5-6z' }),
]);

const IconHeart = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }),
]);

const IconRobot = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('rect', { x: 3, y: 11, width: 18, height: 10, rx: 2 }),
  h('circle', { cx: 8.5, cy: 16, r: 1.5, fill: 'currentColor' }),
  h('circle', { cx: 15.5, cy: 16, r: 1.5, fill: 'currentColor' }),
  h('path', { d: 'M12 11V8' }),
  h('path', { d: 'M8 8l4-5 4 5' }),
]);

const IconLeaf = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M6.5 21C3 17.5 3 12.5 6.5 9c0 0 4 1 7 4 3-3 7-4 7-4 3.5 3.5 3.5 8.5 0 12-1 1-2 2-3.5 2.5' }),
  h('path', { d: 'M11.5 11a4 4 0 0 1 0-4' }),
  h('line', { x1: 10, y1: 10, x2: 9, y2: 9 }),
]);

const IconSword = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M14.5 17.5L3 6V3h3l11.5 11.5' }),
  h('path', { d: 'M13 19l6-6' }),
  h('path', { d: 'M16 16l4 4' }),
  h('path', { d: 'M19 21l2-2' }),
]);

const IconFish = () => h('svg', { viewBox: '0 0 24 24', width: 28, height: 28, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' }, [
  h('path', { d: 'M6.5 12c0 0 2-5 7.5-5s7.5 5 7.5 5-2 5-7.5 5S6.5 12 6.5 12z' }),
  h('path', { d: 'M6.5 12L2 8v8l4.5-4z' }),
  h('circle', { cx: 17, cy: 12, r: 1, fill: 'currentColor' }),
]);

const iconMap: Record<string, () => VNode> = {
  flask: IconFlask,
  hammer: IconHammer,
  hexagon: IconHexagon,
  scroll: IconScroll,
  paw: IconPaw,
  heart: IconHeart,
  robot: IconRobot,
  leaf: IconLeaf,
  sword: IconSword,
  fish: IconFish,
};

type VNode = ReturnType<typeof h>;

function artIcon(icon: string) {
  return iconMap[icon] ?? IconFlask;
}

const store = useStatusStore();

function getArtRealm(art: ArtConfig): string {
  if (!art.境界字段) return '';
  const realm = store.data[art.境界字段 as keyof typeof store.data] as string;
  return realm || '入门';
}
</script>

<style scoped>
.arts-list {
  padding: 12px;
  min-height: 100%;
}

.arts-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 8px;
  opacity: 0.8;
}

.empty-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  margin: 4px 0 0;
}

.empty-sub {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  margin: 0;
}

.arts-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.art-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--card-border, #e8ecf1);
  border-radius: 10px;
  background: var(--content-bg, #fff);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  border-left: 3px solid var(--art-color, #8b5cf6);
}

.art-card:hover {
  background: var(--tab-hover-bg, #faf5ff);
  border-color: var(--art-color, #8b5cf6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.art-card:active {
  transform: scale(0.98);
}

.art-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--art-color, #8b5cf6) 12%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--art-color, #8b5cf6);
  flex-shrink: 0;
}

.art-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.art-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.art-realm {
  font-size: 11px;
  color: var(--text-muted, #64748b);
}

.art-arrow {
  color: var(--text-muted, #cbd5e1);
  flex-shrink: 0;
}

.art-card:hover .art-arrow {
  color: var(--art-color, #8b5cf6);
}
</style>
