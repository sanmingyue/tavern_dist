<template>
  <Transition name="chaoxi-dialog">
    <div v-if="visible" class="chaoxi-dialog-overlay" @click.self="$emit('close')">
      <div class="chaoxi-dialog">
        <div class="chaoxi-dialog-header">
          <span>选择条目添加到「{{ groupName }}」</span>
          <button class="chaoxi-btn-icon" @click="$emit('close')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="chaoxi-dialog-search">
          <input
            class="chaoxi-dialog-search-input"
            v-model="search"
            placeholder="搜索条目…"
            spellcheck="false"
          />
        </div>
        <div class="chaoxi-dialog-list">
          <label
            v-for="p in filteredPrompts"
            :key="p.name"
            class="chaoxi-dialog-item"
            :class="{ checked: existingNames.has(p.name) }"
          >
            <input
              type="checkbox"
              :checked="existingNames.has(p.name)"
              @change="$emit('toggle-prompt', p.name)"
            />
            <span class="chaoxi-dialog-item-name">{{ p.displayName }}</span>
            <span class="chaoxi-dialog-item-role" :class="`chaoxi-role-${p.role}`">{{ p.role }}</span>
          </label>
          <div v-if="filteredPrompts.length === 0" class="chaoxi-dialog-empty">
            未找到匹配条目
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { PromptItem } from './types';
import { stripEmoji } from './types';

const props = defineProps<{
  visible: boolean;
  groupName: string;
  allPrompts: PromptItem[];
  existingNames: Set<string>;
}>();

defineEmits<{
  close: [];
  'toggle-prompt': [name: string];
}>();

const search = ref('');

// 关闭时清除搜索
watch(
  () => props.visible,
  val => {
    if (!val) search.value = '';
  },
);

const filteredPrompts = computed(() => {
  if (!search.value) return props.allPrompts;
  const q = search.value.toLowerCase();
  return props.allPrompts.filter(
    p => p.name.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q),
  );
});
</script>

<style scoped>
.chaoxi-dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.chaoxi-dialog {
  width: 90%;
  max-width: 420px;
  max-height: 80%;
  background: #050810;
  border: 1px solid rgba(77, 201, 246, 0.15);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.chaoxi-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.15);
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
}

.chaoxi-btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.chaoxi-btn-icon:hover {
  background: rgba(77, 201, 246, 0.15);
  color: #4dc9f6;
}

.chaoxi-dialog-search {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.1);
}

.chaoxi-dialog-search-input {
  width: 100%;
  background: rgba(5, 8, 16, 0.8);
  border: 1px solid rgba(77, 201, 246, 0.15);
  border-radius: 6px;
  padding: 6px 10px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}
.chaoxi-dialog-search-input:focus {
  border-color: #4dc9f6;
}
.chaoxi-dialog-search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.chaoxi-dialog-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
}
.chaoxi-dialog-list::-webkit-scrollbar {
  width: 3px;
}
.chaoxi-dialog-list::-webkit-scrollbar-thumb {
  background: rgba(77, 201, 246, 0.12);
  border-radius: 2px;
}

.chaoxi-dialog-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.15s;
}
.chaoxi-dialog-item:hover {
  background: rgba(77, 201, 246, 0.04);
  color: rgba(255, 255, 255, 0.88);
}
.chaoxi-dialog-item.checked {
  color: #34d399;
}
.chaoxi-dialog-item input[type='checkbox'] {
  accent-color: #34d399;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.chaoxi-dialog-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.chaoxi-dialog-item-role {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
  text-transform: uppercase;
}
.chaoxi-role-system {
  background: rgba(77, 201, 246, 0.1);
  color: rgba(77, 201, 246, 0.6);
}
.chaoxi-role-user {
  background: rgba(52, 211, 153, 0.1);
  color: rgba(52, 211, 153, 0.6);
}
.chaoxi-role-assistant {
  background: rgba(251, 191, 36, 0.1);
  color: rgba(251, 191, 36, 0.6);
}

.chaoxi-dialog-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  padding: 24px 16px;
}

/* 过渡 */
.chaoxi-dialog-enter-active,
.chaoxi-dialog-leave-active {
  transition: opacity 0.2s ease;
}
.chaoxi-dialog-enter-from,
.chaoxi-dialog-leave-to {
  opacity: 0;
}
</style>
