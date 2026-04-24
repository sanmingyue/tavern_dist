<template>
  <div class="chaoxi-preset-view">
    <!-- 批量工具栏 -->
    <BatchToolbar
      :total-count="filteredPrompts.length"
      :selected-count="selectedNames.size"
      :all-selected="allSelected"
      :some-selected="someSelected"
      :show-delete="true"
      :show-move-to-group="hasGroups"
      @toggle-all="toggleSelectAll"
      @batch-enable="onBatchEnable"
      @batch-disable="onBatchDisable"
      @batch-delete="onBatchDelete"
      @batch-move-to-group="showGroupSelector = true"
    />

    <!-- 条目列表 -->
    <div class="chaoxi-prompt-list" ref="listRef" @drop="onListDrop">
      <div v-if="filteredPrompts.length === 0" class="chaoxi-empty">
        {{ searchQuery ? '未找到匹配条目' : '当前预设无可控条目' }}
      </div>
      <PromptItem
        v-for="item in filteredPrompts"
        :key="item.name"
        :item="item"
        :selectable="true"
        :selected="selectedNames.has(item.name)"
        :expandable="true"
        :expanded="expandedItem === item.name"
        :draggable="!searchQuery"
        :is-renaming="renamingItem === item.name"
        :rename-value="renameValue"
        :edit-content="editContent"
        @toggle-select="toggleSelect"
        @toggle-expand="onToggleExpand"
        @toggle-enabled="onToggleEnabled"
        @start-rename="onStartRename"
        @confirm-rename="onConfirmRename"
        @cancel-rename="renamingItem = ''"
        @update:rename-value="renameValue = $event"
        @update:edit-content="editContent = $event"
        @save-content="onSaveContent"
        @move="onMove"
        @duplicate="onDuplicate"
        @delete="onDelete"
      />
    </div>

    <!-- 新建条目按钮 -->
    <button class="chaoxi-btn-add" @click="onCreatePrompt">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      新建条目
    </button>

    <!-- 移到分组选择弹窗 -->
    <Transition name="chaoxi-dialog">
      <div v-if="showGroupSelector" class="chaoxi-dialog-overlay" @click.self="showGroupSelector = false">
        <div class="chaoxi-group-selector">
          <div class="chaoxi-group-selector-header">
            <span>选择目标分组</span>
            <button class="chaoxi-btn-icon" @click="showGroupSelector = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="chaoxi-group-selector-list">
            <button
              v-for="group in groups"
              :key="group.id"
              class="chaoxi-group-selector-item"
              @click="onBatchMoveToGroup(group.id)"
            >
              📁 {{ group.name }}
            </button>
            <div v-if="groups.length === 0" class="chaoxi-dialog-empty">
              暂无分组，请先在自定义视图中创建
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 内置弹窗 -->
    <ModalDialog
      :visible="modal.visible.value"
      :title="modal.title.value"
      :message="modal.message.value"
      :mode="modal.mode.value"
      :default-value="modal.defaultValue.value"
      @confirm="modal.onConfirm"
      @cancel="modal.onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import {
  type PromptItem as PromptItemType,
  type CustomGroup,
  getVisiblePrompts,
  togglePromptEnabled,
  batchSetEnabled,
  batchDeletePrompts,
  createPrompt,
  deletePrompt,
  movePrompt,
  movePromptToIndex,
  duplicatePrompt,
  renamePrompt,
  savePromptContent,
  stripEmoji,
} from './types';
import PromptItem from './PromptItem.vue';
import BatchToolbar from './BatchToolbar.vue';
import ModalDialog from './ModalDialog.vue';
import { useModal } from './useModal';

const props = defineProps<{
  searchQuery: string;
  groups: CustomGroup[];
  onRefresh: () => void;
  onAddToGroup: (groupId: string, names: string[]) => void;
}>();

const modal = useModal();

// ─── 数据 ───
const allPrompts = ref<PromptItemType[]>([]);
const selectedNames = reactive(new Set<string>());
const expandedItem = ref('');
const editContent = ref('');
const renamingItem = ref('');
const renameValue = ref('');
const showGroupSelector = ref(false);
const listRef = ref<HTMLElement | null>(null);

const hasGroups = computed(() => props.groups.length > 0);

// ─── 过滤 ───
const filteredPrompts = computed(() => {
  if (!props.searchQuery) return allPrompts.value;
  const q = props.searchQuery.toLowerCase();
  return allPrompts.value.filter(
    p => p.name.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q),
  );
});

// ─── 选择 ───
const allSelected = computed(() => {
  if (filteredPrompts.value.length === 0) return false;
  return filteredPrompts.value.every(p => selectedNames.has(p.name));
});
const someSelected = computed(() => filteredPrompts.value.some(p => selectedNames.has(p.name)));

function toggleSelect(name: string) {
  if (selectedNames.has(name)) selectedNames.delete(name);
  else selectedNames.add(name);
}

function toggleSelectAll() {
  if (allSelected.value) {
    filteredPrompts.value.forEach(p => selectedNames.delete(p.name));
  } else {
    filteredPrompts.value.forEach(p => selectedNames.add(p.name));
  }
}

// ─── 刷新 ───
function refresh() {
  allPrompts.value = getVisiblePrompts();
  const names = new Set(allPrompts.value.map(p => p.name));
  for (const n of selectedNames) {
    if (!names.has(n)) selectedNames.delete(n);
  }
}

refresh();
const refreshTimer = setInterval(refresh, 3000);
onUnmounted(() => clearInterval(refreshTimer));

defineExpose({ refresh });

// ─── 展开/编辑 ───
function onToggleExpand(name: string) {
  if (expandedItem.value === name) {
    expandedItem.value = '';
    return;
  }
  expandedItem.value = name;
  editContent.value = allPrompts.value.find(p => p.name === name)?.content ?? '';
}

// ─── 开关 ───
async function onToggleEnabled(name: string) {
  const item = allPrompts.value.find(p => p.name === name);
  if (!item) return;
  const old = item.enabled;
  item.enabled = !old;
  try {
    await togglePromptEnabled(name, old);
  } catch (e) {
    item.enabled = old;
    console.error('[潮汐预设脚本] 切换失败:', e);
  }
}

// ─── 保存内容 ───
async function onSaveContent(name: string) {
  try {
    await savePromptContent(name, editContent.value);
    const item = allPrompts.value.find(p => p.name === name);
    if (item) item.content = editContent.value;
    expandedItem.value = '';
  } catch (e) {
    console.error('[潮汐预设脚本] 保存失败:', e);
  }
}

// ─── 移动 ───
async function onMove(name: string, direction: -1 | 1) {
  try {
    await movePrompt(name, direction);
    refresh();
  } catch (e) {
    console.error('[潮汐预设脚本] 移动失败:', e);
  }
}

// ─── 拖拽排序 ───
function onListDrop(e: DragEvent) {
  const fromName = e.dataTransfer?.getData('text/plain');
  let target = e.target as HTMLElement | null;
  while (target && !target.classList.contains('chaoxi-item-group')) {
    target = target.parentElement;
  }
  if (!target || !fromName) return;

  const items = listRef.value?.querySelectorAll('.chaoxi-item-group');
  if (!items) return;

  const targetIdx = Array.from(items).indexOf(target);
  if (targetIdx < 0 || targetIdx >= filteredPrompts.value.length) return;

  const toName = filteredPrompts.value[targetIdx].name;
  if (fromName !== toName) {
    movePromptToIndex(fromName, toName).then(() => refresh());
  }
}

// ─── 复制 ───
async function onDuplicate(name: string) {
  try {
    await duplicatePrompt(name);
    refresh();
  } catch (e) {
    console.error('[潮汐预设脚本] 复制失败:', e);
  }
}

// ─── 删除（使用内置弹窗） ───
async function onDelete(name: string) {
  const ok = await modal.showConfirm('确认删除', `确定要删除条目「${stripEmoji(name)}」吗？`);
  if (!ok) return;
  try {
    await deletePrompt(name);
    expandedItem.value = '';
    selectedNames.delete(name);
    refresh();
  } catch (e) {
    console.error('[潮汐预设脚本] 删除失败:', e);
  }
}

// ─── 重命名 ───
function onStartRename(name: string) {
  renamingItem.value = name;
  renameValue.value = name;
}

async function onConfirmRename(oldName: string) {
  const newName = renameValue.value.trim();
  renamingItem.value = '';
  if (!newName || newName === oldName) return;
  try {
    await renamePrompt(oldName, newName);
    refresh();
  } catch (e) {
    console.error('[潮汐预设脚本] 重命名失败:', e);
  }
}

// ─── 新建（使用内置弹窗） ───
async function onCreatePrompt() {
  const name = await modal.showPrompt('新建条目', '新条目');
  if (!name) return;
  try {
    await createPrompt(name as string);
    refresh();
  } catch (e) {
    console.error('[潮汐预设脚本] 新建失败:', e);
  }
}

// ─── 批量操作 ───
async function onBatchEnable() {
  const names = [...selectedNames];
  if (names.length === 0) return;
  names.forEach(n => {
    const item = allPrompts.value.find(p => p.name === n);
    if (item) item.enabled = true;
  });
  try {
    await batchSetEnabled(names, true);
  } catch (e) {
    console.error('[潮汐预设脚本] 批量开启失败:', e);
    refresh();
  }
}

async function onBatchDisable() {
  const names = [...selectedNames];
  if (names.length === 0) return;
  names.forEach(n => {
    const item = allPrompts.value.find(p => p.name === n);
    if (item) item.enabled = false;
  });
  try {
    await batchSetEnabled(names, false);
  } catch (e) {
    console.error('[潮汐预设脚本] 批量关闭失败:', e);
    refresh();
  }
}

async function onBatchDelete() {
  const names = [...selectedNames];
  if (names.length === 0) return;
  const ok = await modal.showConfirm('确认删除', `确定要删除选中的 ${names.length} 个条目吗？`);
  if (!ok) return;
  try {
    await batchDeletePrompts(names);
    names.forEach(n => selectedNames.delete(n));
    expandedItem.value = '';
    refresh();
  } catch (e) {
    console.error('[潮汐预设脚本] 批量删除失败:', e);
    refresh();
  }
}

function onBatchMoveToGroup(groupId: string) {
  const names = [...selectedNames];
  if (names.length === 0) return;
  props.onAddToGroup(groupId, names);
  showGroupSelector.value = false;
}
</script>

<style scoped>
.chaoxi-preset-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.chaoxi-prompt-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 8px;
}
.chaoxi-prompt-list::-webkit-scrollbar {
  width: 3px;
}
.chaoxi-prompt-list::-webkit-scrollbar-thumb {
  background: rgba(77, 201, 246, 0.12);
  border-radius: 2px;
}

.chaoxi-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  padding: 40px 16px;
}

.chaoxi-btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: calc(100% - 16px);
  padding: 10px 0;
  margin: 6px 8px 8px;
  border-radius: 8px;
  border: 1px dashed rgba(77, 201, 246, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.chaoxi-btn-add:hover {
  background: rgba(77, 201, 246, 0.15);
  color: #4dc9f6;
  border-color: rgba(77, 201, 246, 0.3);
}

/* 分组选择弹窗 */
.chaoxi-dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.chaoxi-group-selector {
  width: 280px;
  max-height: 60%;
  background: #050810;
  border: 1px solid rgba(77, 201, 246, 0.15);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.chaoxi-group-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.1);
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

.chaoxi-group-selector-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.chaoxi-group-selector-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}
.chaoxi-group-selector-item:hover {
  background: rgba(77, 201, 246, 0.1);
  color: #4dc9f6;
}

.chaoxi-dialog-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  padding: 20px 16px;
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
