<template>
  <div class="chaoxi-custom-view" :class="{ mobile: isMobile }">
    <!-- PC: 左侧分组导航 -->
    <div v-if="!isMobile" class="chaoxi-side-nav">
      <div class="chaoxi-side-nav-header">
        <div class="chaoxi-side-nav-title">分组</div>
        <button class="chaoxi-side-nav-restore" @click="onRestoreFromConfig" title="从预设条目重新读取分组数据">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </div>
      <div class="chaoxi-side-nav-list">
        <div
          v-for="group in groups"
          :key="group.id"
          class="chaoxi-side-nav-item"
          :class="{ active: activeGroupId === group.id }"
          @click="activeGroupId = group.id"
          @dblclick="onRenameGroup(group.id)"
        >
          <span class="chaoxi-side-nav-item-name">{{ group.name }}</span>
          <button
            class="chaoxi-group-toggle"
            :class="{ on: getGroupEnabledState(group).allOn, partial: getGroupEnabledState(group).someOn && !getGroupEnabledState(group).allOn }"
            @click.stop="onToggleGroupEnabled(group)"
            :title="getGroupEnabledState(group).allOn ? '关闭整个分组' : '开启整个分组'"
          >
            <span class="chaoxi-group-toggle-knob" />
          </button>
          <span
            class="chaoxi-side-nav-item-del"
            @click.stop="onDeleteGroup(group.id)"
            title="删除分组"
          >×</span>
        </div>
      </div>
      <button class="chaoxi-side-nav-add" @click="onCreateGroup">+ 新建分组</button>
    </div>

    <!-- 右侧/主体内容 -->
    <div class="chaoxi-custom-main">
      <!-- 手机: 分组 Tab -->
      <div v-if="isMobile" class="chaoxi-group-tabs-mobile">
        <button class="chaoxi-group-tab-m chaoxi-group-tab-restore-m" @click="onRestoreFromConfig" title="从预设条目重新读取分组数据">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
        <div
          v-for="group in groups"
          :key="group.id"
          class="chaoxi-group-tab-m"
          :class="{ active: activeGroupId === group.id }"
        >
          <span @click="activeGroupId = group.id">{{ group.name }}</span>
          <button
            class="chaoxi-group-toggle-sm"
            :class="{ on: getGroupEnabledState(group).allOn, partial: getGroupEnabledState(group).someOn && !getGroupEnabledState(group).allOn }"
            @click.stop="onToggleGroupEnabled(group)"
          >
            <span class="chaoxi-group-toggle-knob-sm" />
          </button>
        </div>
        <button class="chaoxi-group-tab-m chaoxi-group-tab-add-m" @click="onCreateGroup">+</button>
      </div>

      <!-- 批量工具栏 -->
      <BatchToolbar
        v-if="activeGroup"
        :total-count="filteredGroupItems.length"
        :selected-count="selectedNames.size"
        :all-selected="allSelected"
        :some-selected="someSelected"
        :show-delete="false"
        :show-move-to-group="false"
        @toggle-all="toggleSelectAll"
        @batch-enable="onBatchEnable"
        @batch-disable="onBatchDisable"
      />

      <!-- 分组内条目列表 -->
      <div class="chaoxi-custom-list">
        <template v-if="activeGroup">
          <div v-if="filteredGroupItems.length === 0" class="chaoxi-empty">
            {{ searchQuery ? '未找到匹配条目' : '当前分组为空，点击下方按钮添加条目' }}
          </div>
          <PromptItem
            v-for="item in filteredGroupItemObjects"
            :key="item.name"
            :item="item"
            :selectable="true"
            :selected="selectedNames.has(item.name)"
            :expandable="false"
            :draggable="false"
            :removable="true"
            @toggle-select="toggleSelect"
            @toggle-enabled="onToggleEnabled"
            @remove="onRemoveFromGroup"
          />

          <!-- 添加条目到分组 -->
          <button class="chaoxi-btn-add" @click="showAddDialog = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加条目到分组
          </button>
        </template>
        <div v-else class="chaoxi-empty">
          {{ groups.length === 0 ? '请创建一个分组' : '请选择一个分组' }}
        </div>
      </div>

      <!-- 手机端分组管理按钮 -->
      <div v-if="isMobile && activeGroup" class="chaoxi-mobile-group-actions">
        <button class="chaoxi-btn-tool" @click="onRenameGroup(activeGroupId)">✏️ 重命名</button>
        <button class="chaoxi-btn-tool chaoxi-btn-danger" @click="onDeleteGroup(activeGroupId)">🗑 删除分组</button>
      </div>
    </div>

    <!-- 添加条目弹窗 -->
    <AddPromptDialog
      :visible="showAddDialog"
      :group-name="activeGroup?.name ?? ''"
      :all-prompts="allPrompts"
      :existing-names="existingNamesSet"
      @close="showAddDialog = false"
      @toggle-prompt="onToggleGroupPrompt"
    />

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
  type ChaoxiConfig,
  getVisiblePrompts,
  togglePromptEnabled,
  batchSetEnabled,
  readConfig,
  saveConfig,
  stripEmoji,
} from './types';
import PromptItem from './PromptItem.vue';
import BatchToolbar from './BatchToolbar.vue';
import AddPromptDialog from './AddPromptDialog.vue';
import ModalDialog from './ModalDialog.vue';
import { useModal } from './useModal';

const props = defineProps<{
  searchQuery: string;
  isMobile: boolean;
}>();

const modal = useModal();

// ─── 数据 ───
const allPrompts = ref<PromptItemType[]>([]);
const groups = ref<CustomGroup[]>([]);
const activeGroupId = ref('');
const selectedNames = reactive(new Set<string>());
const showAddDialog = ref(false);

// ─── 活跃分组 ───
const activeGroup = computed(() => groups.value.find(g => g.id === activeGroupId.value));

// ─── 分组内条目列表（过滤+映射） ───
const filteredGroupItems = computed(() => {
  const group = activeGroup.value;
  if (!group) return [];
  if (!props.searchQuery) return group.promptNames;
  const q = props.searchQuery.toLowerCase();
  return group.promptNames.filter(
    name => name.toLowerCase().includes(q) || stripEmoji(name).toLowerCase().includes(q),
  );
});

const filteredGroupItemObjects = computed<PromptItemType[]>(() => {
  return filteredGroupItems.value.map(name => {
    const found = allPrompts.value.find(p => p.name === name);
    return (
      found ?? {
        name,
        displayName: stripEmoji(name),
        enabled: false,
        hasContent: false,
        content: '',
        role: 'system',
        originalIndex: -1,
      }
    );
  });
});

const existingNamesSet = computed(() => new Set(activeGroup.value?.promptNames ?? []));

// ─── 选择 ───
const allSelected = computed(() => {
  if (filteredGroupItems.value.length === 0) return false;
  return filteredGroupItems.value.every(n => selectedNames.has(n));
});
const someSelected = computed(() => filteredGroupItems.value.some(n => selectedNames.has(n)));

function toggleSelect(name: string) {
  if (selectedNames.has(name)) selectedNames.delete(name);
  else selectedNames.add(name);
}

function toggleSelectAll() {
  if (allSelected.value) {
    filteredGroupItems.value.forEach(n => selectedNames.delete(n));
  } else {
    filteredGroupItems.value.forEach(n => selectedNames.add(n));
  }
}

// ─── 刷新 ───
function refresh() {
  allPrompts.value = getVisiblePrompts();
  const config = readConfig();
  groups.value = config.groups;
  if (groups.value.length > 0 && !groups.value.find(g => g.id === activeGroupId.value)) {
    activeGroupId.value = groups.value[0].id;
  }
}

refresh();
const refreshTimer = setInterval(refresh, 3000);
onUnmounted(() => clearInterval(refreshTimer));

// ─── 从预设条目恢复分组 ───
async function onRestoreFromConfig() {
  const ok = await modal.showConfirm('读取分组', '从预设中的 Sanmingyue 条目重新读取分组数据？当前前端分组将被覆盖。');
  if (!ok) return;
  try {
    const config = readConfig();
    groups.value = config.groups;
    if (groups.value.length > 0 && !groups.value.find(g => g.id === activeGroupId.value)) {
      activeGroupId.value = groups.value[0].id;
    }
    selectedNames.clear();
    console.info('[潮汐预设脚本] 已从 Sanmingyue 条目恢复分组数据，共', groups.value.length, '个分组');
  } catch (e) {
    console.error('[潮汐预设脚本] 读取分组数据失败:', e);
  }
}

// ─── 保存分组 ───
async function persistGroups() {
  const config: ChaoxiConfig = { groups: JSON.parse(JSON.stringify(groups.value)) };
  await saveConfig(config);
}

// ─── 分组操作（使用内置弹窗） ───
async function onCreateGroup() {
  const name = await modal.showPrompt('新建分组', '新分组');
  if (!name) return;
  const newGroup: CustomGroup = {
    id: `group_${Date.now()}`,
    name: name as string,
    promptNames: [],
  };
  groups.value.push(newGroup);
  activeGroupId.value = newGroup.id;
  await persistGroups();
}

async function onDeleteGroup(id: string) {
  const group = groups.value.find(g => g.id === id);
  if (!group) return;
  const ok = await modal.showConfirm('确认删除', `确定要删除分组「${group.name}」吗？`);
  if (!ok) return;
  groups.value = groups.value.filter(g => g.id !== id);
  if (activeGroupId.value === id) {
    activeGroupId.value = groups.value[0]?.id ?? '';
  }
  selectedNames.clear();
  await persistGroups();
}

async function onRenameGroup(id: string) {
  const group = groups.value.find(g => g.id === id);
  if (!group) return;
  const newName = await modal.showPrompt('重命名分组', group.name);
  if (!newName || newName === group.name) return;
  group.name = newName as string;
  await persistGroups();
}

// ─── 条目操作 ───
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

async function onRemoveFromGroup(name: string) {
  const group = activeGroup.value;
  if (!group) return;
  group.promptNames = group.promptNames.filter(n => n !== name);
  selectedNames.delete(name);
  await persistGroups();
}

async function onToggleGroupPrompt(name: string) {
  const group = activeGroup.value;
  if (!group) return;
  const idx = group.promptNames.indexOf(name);
  if (idx >= 0) {
    group.promptNames.splice(idx, 1);
  } else {
    group.promptNames.push(name);
  }
  await persistGroups();
}

// ─── 提供给外部的添加到分组方法 ───
async function addToGroup(groupId: string, names: string[]) {
  const group = groups.value.find(g => g.id === groupId);
  if (!group) return;
  for (const name of names) {
    if (!group.promptNames.includes(name)) {
      group.promptNames.push(name);
    }
  }
  await persistGroups();
}

// ─── 分组一键开关 ───
function getGroupEnabledState(group: CustomGroup): { allOn: boolean; someOn: boolean } {
  if (group.promptNames.length === 0) return { allOn: false, someOn: false };
  let onCount = 0;
  for (const name of group.promptNames) {
    const item = allPrompts.value.find(p => p.name === name);
    if (item?.enabled) onCount++;
  }
  return {
    allOn: onCount === group.promptNames.length,
    someOn: onCount > 0,
  };
}

async function onToggleGroupEnabled(group: CustomGroup) {
  if (group.promptNames.length === 0) return;
  const state = getGroupEnabledState(group);
  const targetEnabled = !state.allOn;
  for (const name of group.promptNames) {
    const item = allPrompts.value.find(p => p.name === name);
    if (item) item.enabled = targetEnabled;
  }
  try {
    await batchSetEnabled(group.promptNames, targetEnabled);
  } catch (e) {
    console.error('[潮汐预设脚本] 分组切换失败:', e);
    refresh();
  }
}

defineExpose({ refresh, addToGroup });

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
</script>

<style scoped>
.chaoxi-custom-view {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.chaoxi-custom-view.mobile {
  flex-direction: column;
}

/* ═══ 左侧导航 ═══ */
.chaoxi-side-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px;
}

.chaoxi-side-nav-restore {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}
.chaoxi-side-nav-restore:hover {
  color: #4dc9f6;
  background: rgba(77, 201, 246, 0.08);
}

.chaoxi-side-nav {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid rgba(77, 201, 246, 0.1);
  display: flex;
  flex-direction: column;
  background: rgba(5, 8, 16, 0.4);
}

.chaoxi-side-nav-title {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chaoxi-side-nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 6px;
}
.chaoxi-side-nav-list::-webkit-scrollbar {
  width: 2px;
}
.chaoxi-side-nav-list::-webkit-scrollbar-thumb {
  background: rgba(77, 201, 246, 0.1);
}

.chaoxi-side-nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  gap: 4px;
  margin-bottom: 2px;
  box-sizing: border-box;
}
.chaoxi-side-nav-item:hover {
  background: rgba(77, 201, 246, 0.06);
  color: rgba(255, 255, 255, 0.8);
}
.chaoxi-side-nav-item.active {
  background: rgba(77, 201, 246, 0.12);
  color: #4dc9f6;
}

.chaoxi-side-nav-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chaoxi-side-nav-item-del {
  font-size: 14px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: color 0.15s;
  padding: 0 2px;
  opacity: 0;
}
.chaoxi-side-nav-item:hover .chaoxi-side-nav-item-del {
  opacity: 1;
}
.chaoxi-side-nav-item-del:hover {
  color: #f87171;
}

.chaoxi-side-nav-add {
  margin: 4px 6px 8px;
  padding: 6px 0;
  border: 1px dashed rgba(77, 201, 246, 0.15);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.chaoxi-side-nav-add:hover {
  background: rgba(77, 201, 246, 0.08);
  color: #4dc9f6;
  border-color: rgba(77, 201, 246, 0.3);
}

/* ═══ 主体 ═══ */
.chaoxi-custom-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.chaoxi-custom-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 8px;
}
.chaoxi-custom-list::-webkit-scrollbar {
  width: 3px;
}
.chaoxi-custom-list::-webkit-scrollbar-thumb {
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

/* ═══ 手机分组 Tab ═══ */
.chaoxi-group-tabs-mobile {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 8px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.1);
  flex-shrink: 0;
}

.chaoxi-group-tab-m {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.chaoxi-group-tab-m:hover {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(77, 201, 246, 0.04);
}
.chaoxi-group-tab-m.active {
  color: #4dc9f6;
  background: rgba(77, 201, 246, 0.12);
  border-color: rgba(77, 201, 246, 0.25);
}
.chaoxi-group-tab-add-m {
  border-style: dashed;
}
.chaoxi-group-tab-restore-m {
  border-style: solid;
  border-color: rgba(77, 201, 246, 0.15);
  color: rgba(255, 255, 255, 0.3);
  padding: 5px 8px;
}
.chaoxi-group-tab-restore-m:hover {
  color: #4dc9f6;
  border-color: rgba(77, 201, 246, 0.3);
  background: rgba(77, 201, 246, 0.06);
}
.chaoxi-group-tab-add-m:hover {
  color: #4dc9f6;
  border-color: rgba(77, 201, 246, 0.3);
}

/* ═══ 手机分组管理 ═══ */
.chaoxi-mobile-group-actions {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border-top: 1px solid rgba(77, 201, 246, 0.08);
  flex-shrink: 0;
}

.chaoxi-btn-tool {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid rgba(77, 201, 246, 0.15);
  background: rgba(77, 201, 246, 0.04);
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.chaoxi-btn-tool:hover {
  background: rgba(77, 201, 246, 0.15);
  color: #4dc9f6;
}
.chaoxi-btn-danger:hover {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}

/* ═══ 分组一键开关 (PC) ═══ */
.chaoxi-group-toggle {
  position: relative;
  width: 28px;
  height: 14px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.2s;
}
.chaoxi-group-toggle.on {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.3);
}
.chaoxi-group-toggle.partial {
  background: rgba(251, 191, 36, 0.12);
  border-color: rgba(251, 191, 36, 0.25);
}
.chaoxi-group-toggle-knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.2s;
}
.chaoxi-group-toggle.on .chaoxi-group-toggle-knob {
  left: 15px;
  background: #34d399;
  box-shadow: 0 0 4px rgba(52, 211, 153, 0.4);
}
.chaoxi-group-toggle.partial .chaoxi-group-toggle-knob {
  left: 8px;
  background: #fbbf24;
  box-shadow: 0 0 4px rgba(251, 191, 36, 0.3);
}

/* ═══ 分组一键开关 (手机) ═══ */
.chaoxi-group-toggle-sm {
  position: relative;
  width: 22px;
  height: 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.2s;
}
.chaoxi-group-toggle-sm.on {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.3);
}
.chaoxi-group-toggle-sm.partial {
  background: rgba(251, 191, 36, 0.12);
  border-color: rgba(251, 191, 36, 0.25);
}
.chaoxi-group-toggle-knob-sm {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.2s;
}
.chaoxi-group-toggle-sm.on .chaoxi-group-toggle-knob-sm {
  left: 11px;
  background: #34d399;
  box-shadow: 0 0 4px rgba(52, 211, 153, 0.4);
}
.chaoxi-group-toggle-sm.partial .chaoxi-group-toggle-knob-sm {
  left: 6px;
  background: #fbbf24;
  box-shadow: 0 0 4px rgba(251, 191, 36, 0.3);
}
</style>
