<template>
  <div class="item-grid" :class="{ 'is-mobile': isMobile }">
    <div v-if="items.length === 0" class="empty-hint">
      <div class="empty-icon-wrap">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <line x1="2" y1="9" x2="22" y2="9" />
          <line x1="12" y1="9" x2="12" y2="21" />
        </svg>
      </div>
      <span class="empty-text">{{ emptyText }}</span>
    </div>
    <div
      v-for="(item, idx) in items"
      :key="item.name + idx"
      class="item-card"
      @click="$emit('select', item)"
    >
      <div class="item-img-wrap">
        <img
          :src="getItemImage(item.name)"
          :alt="item.name"
          class="item-img"
          loading="lazy"
        />
        <!-- 交互数量角标 -->
        <div v-if="item.interactions && item.interactions.length > 0" class="item-badge">
          {{ item.interactions.length }}
        </div>
      </div>
      <div class="item-info">
        <div class="item-name">{{ item.name }}</div>
        <div class="item-keywords">{{ getItemKeywords(item.name) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ItemData } from '../schema';
import { ITEM_IMAGES, ITEM_KEYWORDS, DEFAULT_ITEM_IMAGE } from '../items';

defineProps<{
  items: ItemData[];
  isMobile?: boolean;
  emptyText?: string;
}>();

defineEmits<{
  select: [item: ItemData];
}>();

function getItemImage(name: string): string {
  return ITEM_IMAGES[name] || DEFAULT_ITEM_IMAGE;
}

function getItemKeywords(name: string): string {
  return ITEM_KEYWORDS[name] || '';
}
</script>

<style scoped>
.item-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  align-content: start;
}

.item-grid.is-mobile {
  padding: 8px;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 6px;
}

.item-grid::-webkit-scrollbar {
  width: 3px;
}

.item-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.empty-hint {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 10px;
}

.empty-icon-wrap {
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 5px;
  border-radius: 10px;
}

.item-card:hover {
  transform: scale(1.04);
  background: rgba(255, 255, 255, 0.04);
}

.item-card:active {
  transform: scale(0.98);
}

.item-img-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 20, 30, 0.6);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.is-mobile .item-img-wrap {
  width: 66px;
  height: 66px;
  border-radius: 8px;
}

.item-card:hover .item-img-wrap {
  border-color: rgba(200, 170, 110, 0.4);
  box-shadow: 0 0 12px rgba(200, 170, 110, 0.15);
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: rgba(200, 170, 110, 0.85);
  color: #1a1f2e;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.item-info {
  margin-top: 6px;
  text-align: center;
  max-width: 104px;
}

.is-mobile .item-info {
  max-width: 72px;
}

.item-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.is-mobile .item-name {
  font-size: 10px;
}

.item-card:hover .item-name {
  color: rgba(255, 255, 255, 0.95);
}

.item-keywords {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1.3;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-mobile .item-keywords {
  font-size: 8px;
}

.item-card:hover .item-keywords {
  color: rgba(255, 255, 255, 0.45);
}
</style>
