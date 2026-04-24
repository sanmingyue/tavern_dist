<template>
  <div
    class="chaoxi-item-group"
    :class="{ 'chaoxi-drag-over': isDragOver }"
    :draggable="draggable"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <div class="chaoxi-item-row">
      <!-- Checkbox -->
      <input
        v-if="selectable"
        type="checkbox"
        class="chaoxi-checkbox"
        :checked="selected"
        @change="$emit('toggle-select', item.name)"
      />
      <!-- 拖拽手柄 -->
      <span v-if="draggable" class="chaoxi-drag-handle" title="拖拽排序">≡</span>
      <!-- 展开箭头 -->
      <button v-if="expandable" class="chaoxi-item-expand" @click="$emit('toggle-expand', item.name)">
        <svg
          class="chaoxi-expand-icon"
          :class="{ expanded: expanded }"
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <!-- 条目名称（双击重命名） -->
      <template v-if="isRenaming">
        <input
          class="chaoxi-rename-input"
          :value="renameValue"
          @input="$emit('update:renameValue', ($event.target as HTMLInputElement).value)"
          @keydown.enter="$emit('confirm-rename', item.name)"
          @keydown.escape="$emit('cancel-rename')"
          @blur="$emit('confirm-rename', item.name)"
          ref="renameInputRef"
          spellcheck="false"
        />
      </template>
      <template v-else>
        <span
          class="chaoxi-item-name"
          :title="item.name"
          @dblclick="expandable && $emit('start-rename', item.name)"
        >{{ item.displayName }}</span>
      </template>
      <!-- Role 标签 -->
      <span class="chaoxi-role-tag" :class="`chaoxi-role-${item.role}`">{{ item.role }}</span>
      <!-- 开关 Toggle -->
      <button
        class="chaoxi-toggle"
        :class="{ on: item.enabled }"
        @click="$emit('toggle-enabled', item.name)"
      >
        <span class="chaoxi-toggle-knob" />
      </button>
      <!-- 从分组移除按钮 -->
      <button
        v-if="removable"
        class="chaoxi-btn-icon chaoxi-btn-remove"
        @click="$emit('remove', item.name)"
        title="从分组移除"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
    <!-- 展开的编辑区域 -->
    <Transition name="chaoxi-editor">
      <div v-if="expanded && expandable" class="chaoxi-editor">
        <!-- 操作按钮栏 -->
        <div class="chaoxi-editor-toolbar">
          <button class="chaoxi-btn-tool" @click="$emit('move', item.name, -1)" title="上移">↑ 上移</button>
          <button class="chaoxi-btn-tool" @click="$emit('move', item.name, 1)" title="下移">↓ 下移</button>
          <button class="chaoxi-btn-tool" @click="$emit('duplicate', item.name)" title="复制">📋 复制</button>
          <button class="chaoxi-btn-tool" @click="$emit('start-rename', item.name)" title="重命名">✏️ 重命名</button>
          <button class="chaoxi-btn-tool chaoxi-btn-danger" @click="$emit('delete', item.name)" title="删除">🗑 删除</button>
        </div>
        <!-- 内容编辑 -->
        <div v-if="!item.hasContent" class="chaoxi-file-hint">该条目没有可编辑的内容</div>
        <template v-else>
          <textarea
            class="chaoxi-textarea"
            :value="editContent"
            @input="$emit('update:editContent', ($event.target as HTMLTextAreaElement).value)"
            rows="10"
            spellcheck="false"
          />
          <div class="chaoxi-editor-actions">
            <button class="chaoxi-btn-save" @click="$emit('save-content', item.name)">保存</button>
            <button class="chaoxi-btn-cancel" @click="$emit('toggle-expand', '')">取消</button>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { PromptItem } from './types';

const props = defineProps<{
  item: PromptItem;
  selected?: boolean;
  selectable?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  draggable?: boolean;
  removable?: boolean;
  isRenaming?: boolean;
  renameValue?: string;
  editContent?: string;
}>();

defineEmits<{
  'toggle-select': [name: string];
  'toggle-expand': [name: string];
  'toggle-enabled': [name: string];
  'start-rename': [name: string];
  'confirm-rename': [name: string];
  'cancel-rename': [];
  'update:renameValue': [value: string];
  'update:editContent': [value: string];
  'save-content': [name: string];
  'move': [name: string, direction: -1 | 1];
  'duplicate': [name: string];
  'delete': [name: string];
  'remove': [name: string];
  'drag-start': [name: string];
  'drag-drop': [fromName: string, toName: string];
}>();

const renameInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

watch(
  () => props.isRenaming,
  val => {
    if (val) {
      nextTick(() => {
        renameInputRef.value?.focus();
        renameInputRef.value?.select();
      });
    }
  },
);

// ─── 拖拽事件 ───
let draggedName = '';

function onDragStart(e: DragEvent) {
  if (!props.draggable) return;
  draggedName = props.item.name;
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', props.item.name);
  (e.currentTarget as HTMLElement).classList.add('chaoxi-dragging');
}

function onDragOver(e: DragEvent) {
  if (!props.draggable) return;
  e.dataTransfer!.dropEffect = 'move';
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (!props.draggable) return;
  const fromName = e.dataTransfer!.getData('text/plain');
  if (fromName && fromName !== props.item.name) {
    // Use the parent's handler
    (e as any).__chaoxiDropTarget = props.item.name;
    (e as any).__chaoxiDropFrom = fromName;
  }
}

function onDragEnd(e: DragEvent) {
  (e.currentTarget as HTMLElement).classList.remove('chaoxi-dragging');
}
</script>

<style scoped>
.chaoxi-item-group {
  border-bottom: 1px solid rgba(77, 201, 246, 0.06);
  transition: background 0.15s;
}
.chaoxi-item-group:last-child {
  border-bottom: none;
}
.chaoxi-item-group.chaoxi-drag-over {
  background: rgba(77, 201, 246, 0.08);
  border-top: 2px solid rgba(77, 201, 246, 0.4);
}
.chaoxi-item-group.chaoxi-dragging {
  opacity: 0.4;
}

.chaoxi-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
}

/* Checkbox */
.chaoxi-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #4dc9f6;
  cursor: pointer;
  flex-shrink: 0;
}

/* 拖拽手柄 */
.chaoxi-drag-handle {
  cursor: grab;
  color: rgba(255, 255, 255, 0.25);
  font-size: 14px;
  flex-shrink: 0;
  user-select: none;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.15s;
}
.chaoxi-drag-handle:hover {
  color: rgba(77, 201, 246, 0.6);
}
.chaoxi-drag-handle:active {
  cursor: grabbing;
}

/* 展开按钮 */
.chaoxi-item-expand {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: color 0.15s;
}
.chaoxi-item-expand:hover {
  color: #4dc9f6;
}
.chaoxi-expand-icon {
  flex-shrink: 0;
  transition: transform 0.2s;
}
.chaoxi-expand-icon.expanded {
  transform: rotate(90deg);
}

/* 条目名称 */
.chaoxi-item-name {
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
  min-width: 0;
}

/* 重命名输入框 */
.chaoxi-rename-input {
  flex: 1;
  background: rgba(5, 8, 16, 0.6);
  border: 1px solid #4dc9f6;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  padding: 2px 6px;
  outline: none;
  min-width: 0;
}

/* Role 标签 */
.chaoxi-role-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.chaoxi-role-system {
  background: rgba(77, 201, 246, 0.1);
  color: rgba(77, 201, 246, 0.7);
}
.chaoxi-role-user {
  background: rgba(52, 211, 153, 0.1);
  color: rgba(52, 211, 153, 0.7);
}
.chaoxi-role-assistant {
  background: rgba(251, 191, 36, 0.1);
  color: rgba(251, 191, 36, 0.7);
}

/* Toggle 开关 */
.chaoxi-toggle {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.2s;
}
.chaoxi-toggle.on {
  background: rgba(52, 211, 153, 0.12);
  border-color: rgba(52, 211, 153, 0.3);
}
.chaoxi-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
.chaoxi-toggle.on .chaoxi-toggle-knob {
  left: 18px;
  background: #34d399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.4);
}

/* 按钮 */
.chaoxi-btn-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
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
.chaoxi-btn-remove:hover {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}

/* 编辑区域 */
.chaoxi-editor {
  padding: 4px 8px 10px 36px;
}
.chaoxi-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.chaoxi-btn-tool {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(77, 201, 246, 0.15);
  background: rgba(77, 201, 246, 0.04);
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.chaoxi-btn-tool:hover {
  background: rgba(77, 201, 246, 0.15);
  color: #4dc9f6;
  border-color: rgba(77, 201, 246, 0.3);
}
.chaoxi-btn-danger:hover {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}

.chaoxi-file-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  padding: 8px 12px;
  background: rgba(77, 201, 246, 0.04);
  border-radius: 6px;
  border: 1px dashed rgba(77, 201, 246, 0.15);
}
.chaoxi-textarea {
  width: 100%;
  min-height: 140px;
  max-height: 400px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(77, 201, 246, 0.15);
  background: rgba(5, 8, 16, 0.6);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.chaoxi-textarea:focus {
  border-color: #4dc9f6;
  box-shadow: 0 0 0 2px rgba(77, 201, 246, 0.1);
}
.chaoxi-editor-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}
.chaoxi-btn-save {
  padding: 5px 16px;
  border-radius: 6px;
  border: 1px solid rgba(52, 211, 153, 0.3);
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.chaoxi-btn-save:hover {
  background: rgba(52, 211, 153, 0.22);
}
.chaoxi-btn-cancel {
  padding: 5px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.chaoxi-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
}

/* 过渡动画 */
.chaoxi-editor-enter-active,
.chaoxi-editor-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.chaoxi-editor-enter-from,
.chaoxi-editor-leave-to {
  opacity: 0;
  max-height: 0;
}
.chaoxi-editor-enter-to,
.chaoxi-editor-leave-from {
  max-height: 600px;
}
</style>
