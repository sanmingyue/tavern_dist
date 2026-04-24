<template>
  <div class="storage-picker">
    <div class="picker-header">
      <span class="picker-title">{{ title }}</span>
      <button class="picker-close" @click="$emit('close')">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="picker-search">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="text" v-model="search" :placeholder="'搜索' + title + '...'" />
      <button v-if="search" class="search-clear" @click="search = ''">✕</button>
    </div>

    <!-- 物品列表 -->
    <div class="picker-list" v-if="filteredItems.length > 0">
      <div
        v-for="item in filteredItems" :key="item.name"
        class="picker-item"
        :class="{ selected: isSelected(item.name) }"
        @click="toggleItem(item)"
      >
        <span class="item-category" :style="{ color: getCategoryColor(item.category) }" v-html="getCategoryIcon(item.category)">
        </span>
        <span class="item-name">{{ item.name }}</span>
        <span class="item-count">×{{ item.count }}{{ item.unit }}</span>
        <span class="item-check" v-if="isSelected(item.name)">✓</span>
      </div>
    </div>
    <div class="picker-empty" v-else>
      {{ search ? '未找到匹配物品' : '储物戒中无可用物品' }}
    </div>

    <!-- 已选物品 -->
    <div class="picker-selected" v-if="selectedItems.length > 0">
      <div class="selected-label">已选材料：</div>
      <div class="selected-list">
        <span class="selected-tag" v-for="s in selectedItems" :key="s.name">
          {{ s.name }}×{{ s.count }}
          <button class="tag-remove" @click="removeSelected(s.name)">✕</button>
        </span>
      </div>
    </div>

    <!-- 确认按钮 -->
    <button class="picker-confirm" :disabled="selectedItems.length === 0" @click="confirm">
      确认选择（{{ selectedItems.length }}项）
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStatusStore, type StorageItem, CATEGORY_COLORS, CATEGORY_ICONS } from '../store';

const props = withDefaults(defineProps<{
  title?: string;
  categories: string[];
  multiple?: boolean;
  maxItems?: number;
}>(), {
  title: '选择物品',
  multiple: true,
  maxItems: 10,
});

const emit = defineEmits<{
  (e: 'select', items: Array<{ name: string; count: number }>): void;
  (e: 'close'): void;
}>();

const store = useStatusStore();
const search = ref('');

// 按分类获取可用物品
const availableItems = computed(() => {
  return store.getItemsByCategory(...props.categories);
});

// 搜索过滤
const filteredItems = computed(() => {
  if (!search.value) return availableItems.value;
  const kw = search.value.toLowerCase();
  return availableItems.value.filter(item => item.name.toLowerCase().includes(kw));
});

// 已选物品
const selectedItems = ref<Array<{ name: string; count: number }>>([]);

function isSelected(name: string): boolean {
  return selectedItems.value.some(s => s.name === name);
}

function toggleItem(item: StorageItem) {
  const idx = selectedItems.value.findIndex(s => s.name === item.name);
  if (idx >= 0) {
    selectedItems.value.splice(idx, 1);
  } else {
    if (!props.multiple && selectedItems.value.length > 0) {
      selectedItems.value = [];
    }
    if (selectedItems.value.length < props.maxItems) {
      selectedItems.value.push({ name: item.name, count: 1 });
    }
  }
}

function removeSelected(name: string) {
  const idx = selectedItems.value.findIndex(s => s.name === name);
  if (idx >= 0) selectedItems.value.splice(idx, 1);
}

function confirm() {
  emit('select', [...selectedItems.value]);
}

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#94a3b8';
}

function getCategoryIcon(cat: string): string {
  return CATEGORY_ICONS[cat] || '📦';
}
</script>

<style scoped>
.storage-picker {
  background: var(--card-bg, #f8f9ff);
  border: 1.5px solid var(--accent-gold, #c8a96e);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-gold, #b8963e);
}

.picker-close {
  width: 24px; height: 24px;
  border-radius: 6px; border: none;
  background: rgba(200, 169, 110, 0.1);
  color: var(--accent-gold, #b8963e);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}

.picker-close:hover { background: rgba(200, 169, 110, 0.2); }

.picker-search {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 6px;
}

.picker-search svg { color: var(--text-muted, #9ca3af); flex-shrink: 0; }

.picker-search input {
  flex: 1; border: none; outline: none;
  font-size: 12px; color: var(--text-primary, #374151); background: transparent;
}

.search-clear {
  background: none; border: none; color: var(--text-muted, #9ca3af);
  cursor: pointer; font-size: 12px; padding: 0 2px;
}

.picker-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px;
}

.picker-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e8ecf1); border-radius: 6px;
  cursor: pointer; transition: all 0.15s;
}

.picker-item:hover { border-color: var(--accent-gold, #b8963e); background: var(--tab-hover-bg, #eef2ff); }
.picker-item.selected { border-color: var(--accent-gold, #b8963e); background: var(--tab-hover-bg, #eef2ff); }

.item-category { font-size: 14px; }
.item-name { flex: 1; font-size: 12px; font-weight: 600; color: var(--text-primary, #374151); }
.item-count { font-size: 11px; color: var(--text-muted, #6b7280); }
.item-check { color: var(--accent-gold, #b8963e); font-weight: 700; font-size: 14px; }

.picker-empty {
  text-align: center; padding: 16px; color: var(--text-muted, #9ca3af);
  font-size: 12px; font-style: italic;
}

.picker-selected {
  padding-top: 8px; border-top: 1px dashed #e5e7eb;
}

.selected-label {
  font-size: 10px; font-weight: 600; color: var(--text-muted, #64748b);
  margin-bottom: 4px; text-transform: uppercase;
}

.selected-list { display: flex; flex-wrap: wrap; gap: 4px; }

.selected-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; background: var(--tab-hover-bg, #eef2ff);
  border: 1px solid var(--accent-gold, #c8a96e); border-radius: 12px;
  font-size: 11px; color: var(--accent-gold, #b8963e);
}

.tag-remove {
  background: none; border: none; color: var(--accent-gold, #b8963e);
  cursor: pointer; font-size: 10px; padding: 0; margin-left: 2px;
}

.picker-confirm {
  padding: 10px;
  border: none; border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-gold, #b8963e), #9a7d3a);
  color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}

.picker-confirm:hover:not(:disabled) { transform: translateY(-1px); }
.picker-confirm:disabled {
  background: #e8ecf1; color: var(--text-muted, #94a3b8); cursor: not-allowed;
}
</style>
