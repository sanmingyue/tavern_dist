<template>
  <div class="translate-script-root">
    <!-- 悬浮按钮 -->
    <Transition name="translate-fab-transition">
      <div
        v-if="!panelVisible"
        class="translate-fab"
        :class="{ 'is-dragging': isDragging }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
        :title="settings.autoTranslate ? '翻译脚本 (自动翻译已开启)' : '翻译脚本'"
      >
        <i class="fa-solid fa-language"></i>
        <span v-if="settings.autoTranslate" class="fab-auto-indicator"></span>
      </div>
    </Transition>

    <!-- 配置面板遮罩 -->
    <div v-if="panelVisible" class="translate-panel-backdrop" @click="panelVisible = false"></div>

    <!-- 配置面板 -->
    <div v-if="panelVisible" class="translate-panel" :style="panelStyle">
      <div class="translate-panel-header">
        <h3><i class="fa-solid fa-language"></i> 异步翻译设置</h3>
        <div class="translate-panel-close" @click="panelVisible = false">
          <i class="fa-solid fa-xmark"></i>
        </div>
      </div>

      <div class="translate-panel-body">
        <!-- 第一区域: 总控 -->
        <div class="translate-section">
          <div class="translate-section-title">总控</div>
          <label class="translate-toggle-row">
            <input type="checkbox" v-model="settings.autoTranslate" />
            <span>自动翻译 AI 消息</span>
          </label>
        </div>

        <!-- 第二区域: API 设置 -->
        <div class="translate-section">
          <div class="translate-section-title">API 设置</div>

          <div class="translate-field">
            <label>API 提供商</label>
            <select v-model="settings.provider">
              <option v-for="(label, key) in providerLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>

          <div class="translate-field">
            <label>API Key</label>
            <input type="password" v-model="settings.apiKey" placeholder="输入 API Key" />
          </div>

          <div v-if="settings.provider === 'custom'" class="translate-field">
            <label>Base URL</label>
            <input type="text" v-model="settings.baseUrl" placeholder="https://your-api.com/v1" />
          </div>

          <div v-else class="translate-field">
            <label>Endpoint</label>
            <input type="text" :value="endpoint" disabled class="translate-field-disabled" />
          </div>

          <div class="translate-field">
            <label>模型名称</label>
            <input type="text" v-model="settings.model" placeholder="gpt-4o-mini" />
          </div>
        </div>

        <!-- 第三区域: 参数设置 -->
        <div class="translate-section">
          <div class="translate-section-title">参数设置</div>

          <div class="translate-field-row">
            <div class="translate-field translate-field-half">
              <label>温度 (Temperature)</label>
              <input type="number" v-model.number="settings.temperature" min="0" max="2" step="0.1" />
            </div>
            <div class="translate-field translate-field-half">
              <label>Top P</label>
              <input type="number" v-model.number="settings.topP" min="0" max="1" step="0.05" />
            </div>
          </div>

          <div class="translate-field-row">
            <div class="translate-field translate-field-half">
              <label>Top K <span class="translate-hint">(部分提供商)</span></label>
              <input type="number" v-model.number="settings.topK" min="1" placeholder="不填则不传" />
            </div>
            <div class="translate-field translate-field-half">
              <label>最大输出 Token</label>
              <input type="number" v-model.number="settings.maxTokens" min="1" />
            </div>
          </div>

          <div class="translate-field-row">
            <div class="translate-field translate-field-half">
              <label>请求超时 (ms)</label>
              <input type="number" v-model.number="settings.timeout" min="5000" step="1000" />
            </div>
            <div class="translate-field translate-field-half">
              <label>最大重试次数</label>
              <input type="number" v-model.number="settings.maxRetries" min="0" max="10" />
            </div>
          </div>
        </div>

        <!-- 第四区域: 标签设置 -->
        <div class="translate-section">
          <div class="translate-section-title">标签设置</div>

          <div class="translate-field-row">
            <div class="translate-field translate-field-half">
              <label>输入提取标签</label>
              <div class="translate-tag-preview">
                <span class="translate-tag-bracket">&lt;</span>
                <input type="text" v-model="settings.inputTag" placeholder="content" />
                <span class="translate-tag-bracket">&gt;</span>
              </div>
            </div>
            <div class="translate-field translate-field-half">
              <label>输出提取标签</label>
              <div class="translate-tag-preview">
                <span class="translate-tag-bracket">&lt;</span>
                <input type="text" v-model="settings.outputTag" placeholder="translated" />
                <span class="translate-tag-bracket">&gt;</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 第五区域: 预设管理 -->
        <div class="translate-section">
          <div class="translate-section-title">翻译预设</div>

          <!-- 预设选择 -->
          <div class="translate-field">
            <label>当前预设</label>
            <div class="translate-preset-selector">
              <select v-model="settings.currentPresetId">
                <option v-for="p in settings.presets" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <div class="translate-preset-actions">
                <button @click="addPreset" title="新建"><i class="fa-solid fa-plus"></i></button>
                <button @click="duplicatePreset" title="另存为"><i class="fa-solid fa-copy"></i></button>
                <button @click="renameCurrentPreset" title="重命名"><i class="fa-solid fa-pen"></i></button>
                <button @click="deleteCurrentPreset" title="删除" :disabled="settings.presets.length <= 1">
                  <i class="fa-solid fa-trash"></i>
                </button>
                <button @click="exportCurrentPreset" title="导出"><i class="fa-solid fa-download"></i></button>
                <button @click="importPreset" title="导入"><i class="fa-solid fa-upload"></i></button>
              </div>
            </div>
          </div>

          <!-- 条目列表 -->
          <div v-if="currentPreset" class="translate-entries">
            <div
              v-for="(entry, idx) in currentPreset.entries"
              :key="entry.id"
              class="translate-entry"
              :class="{ 'translate-entry-history': entry.type === 'history' }"
            >
              <div class="translate-entry-header" @click="toggleEntry(entry.id)">
                <div class="translate-entry-drag" title="拖拽排序">
                  <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <div v-if="entry.type === 'history'" class="translate-entry-badge">
                  <i class="fa-solid fa-clock-rotate-left"></i> 待翻译内容
                </div>
                <select
                  v-model="entry.role"
                  class="translate-entry-role"
                  @click.stop
                >
                  <option value="system">System</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
                <div class="translate-entry-spacer"></div>
                <div class="translate-entry-actions">
                  <button
                    v-if="entry.type !== 'history'"
                    @click.stop="moveEntry(idx, -1)"
                    :disabled="idx === 0"
                    title="上移"
                  >
                    <i class="fa-solid fa-chevron-up"></i>
                  </button>
                  <button
                    v-if="entry.type !== 'history'"
                    @click.stop="moveEntry(idx, 1)"
                    :disabled="idx === currentPreset.entries.length - 1"
                    title="下移"
                  >
                    <i class="fa-solid fa-chevron-down"></i>
                  </button>
                  <button
                    v-if="entry.type !== 'history'"
                    @click.stop="removeEntry(idx)"
                    title="删除"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div class="translate-entry-expand">
                  <i :class="expandedEntries.has(entry.id) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </div>
              </div>

              <div v-if="expandedEntries.has(entry.id)" class="translate-entry-body">
                <textarea
                  v-if="entry.type === 'normal'"
                  v-model="entry.content"
                  rows="4"
                  placeholder="输入提示词内容..."
                ></textarea>
                <div v-else class="translate-entry-history-hint">
                  <i class="fa-solid fa-info-circle"></i>
                  此处将自动填入从 AI 消息中提取的待翻译文本
                </div>
              </div>
            </div>

            <button class="translate-add-entry" @click="addEntry">
              <i class="fa-solid fa-plus"></i> 添加条目
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏容器（通过 teleport 注入到消息中） -->
    <StatusBarManager />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSettingsStore } from './settings';
import { PROVIDER_LABELS, FAB_POS_KEY } from './types';
import type { TranslatePreset, PresetEntry } from './types';
import { uuidv4 } from '@util/common';
import StatusBarManager from './components/StatusBarManager.vue';

const store = useSettingsStore();
const { settings, currentPreset, endpoint } = storeToRefs(store);

const providerLabels = PROVIDER_LABELS;
const panelVisible = ref(false);
const expandedEntries = ref(new Set<string>());

// ─── 宿主窗口 + 常量 ───
const hostWindow = window.parent;
const FAB_SIZE = 44;
const EDGE_GAP = 12;
const DRAG_THRESHOLD = 5;

// ─── FAB 位置（使用 left/top 定位） ───
function defaultFabPos() {
  return { x: hostWindow.innerWidth - FAB_SIZE - 16, y: hostWindow.innerHeight * 0.35 };
}

function readFabPos(): { x: number; y: number } {
  try {
    const raw = hostWindow.localStorage.getItem(FAB_POS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultFabPos();
}

function saveFabPos(pos: { x: number; y: number }) {
  try {
    hostWindow.localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
  } catch { /* ignore */ }
}

function clampPos(x: number, y: number) {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  return {
    x: _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

const fabPos = reactive(clampPos(readFabPos().x, readFabPos().y));

function setFabPos(x: number, y: number) {
  const c = clampPos(x, y);
  fabPos.x = c.x;
  fabPos.y = c.y;
  saveFabPos(c);
}

const fabStyle = computed(() => ({
  left: `${fabPos.x}px`,
  top: `${fabPos.y}px`,
}));

const panelStyle = computed(() => {
  // 面板出现在 FAB 附近，向左上方展开
  const panelW = 420;
  const panelMaxH = hostWindow.innerHeight * 0.7;
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;

  // 优先放在 FAB 左边
  let left = fabPos.x - panelW - 8;
  if (left < EDGE_GAP) {
    left = fabPos.x + FAB_SIZE + 8;
  }
  if (left + panelW > vw - EDGE_GAP) {
    left = Math.max(EDGE_GAP, (vw - panelW) / 2);
  }

  // 顶部对齐 FAB，但不超出屏幕
  let top = fabPos.y;
  if (top + panelMaxH > vh - EDGE_GAP) {
    top = Math.max(EDGE_GAP, vh - panelMaxH - EDGE_GAP);
  }

  return {
    position: 'fixed' as const,
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
  };
});

// ─── FAB 拖拽（使用 pointer events + hostWindow） ───
const isDragging = ref(false);
let dragStart = { x: 0, y: 0 };
let dragBase = { x: 0, y: 0 };
let hasMoved = false;

function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  isDragging.value = false;
  hasMoved = false;
  dragStart = { x: e.clientX, y: e.clientY };
  dragBase = { x: fabPos.x, y: fabPos.y };
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(e: PointerEvent) {
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (!hasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  hasMoved = true;
  isDragging.value = true;
  setFabPos(dragBase.x + dx, dragBase.y + dy);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isDragging.value = false;
  if (!hasMoved) {
    panelVisible.value = true;
  }
}

// ─── resize 时重新 clamp FAB 位置 ───
const onResize = () => {
  setFabPos(fabPos.x, fabPos.y);
};
onMounted(() => {
  hostWindow.addEventListener('resize', onResize);
});
onUnmounted(() => {
  hostWindow.removeEventListener('resize', onResize);
});

// ─── 条目操作 ───
function toggleEntry(id: string) {
  if (expandedEntries.value.has(id)) {
    expandedEntries.value.delete(id);
  } else {
    expandedEntries.value.add(id);
  }
}

function addEntry() {
  if (!currentPreset.value) return;
  const entry: PresetEntry = {
    id: uuidv4(),
    type: 'normal',
    role: 'system',
    content: '',
  };
  currentPreset.value.entries.push(entry);
  expandedEntries.value.add(entry.id);
}

function removeEntry(idx: number) {
  if (!currentPreset.value) return;
  currentPreset.value.entries.splice(idx, 1);
}

function moveEntry(idx: number, direction: -1 | 1) {
  if (!currentPreset.value) return;
  const entries = currentPreset.value.entries;
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= entries.length) return;
  [entries[idx], entries[targetIdx]] = [entries[targetIdx], entries[idx]];
}

// ─── 预设操作 ───
function addPreset() {
  const name = prompt('请输入新预设名称：');
  if (!name) return;
  const preset: TranslatePreset = {
    id: uuidv4(),
    name,
    entries: [
      { id: uuidv4(), type: 'history', role: 'user', content: '' },
    ],
  };
  settings.value.presets.push(preset);
  settings.value.currentPresetId = preset.id;
}

function duplicatePreset() {
  if (!currentPreset.value) return;
  const name = prompt('请输入新预设名称：', `${currentPreset.value.name} (副本)`);
  if (!name) return;
  const clone: TranslatePreset = JSON.parse(JSON.stringify(currentPreset.value));
  clone.id = uuidv4();
  clone.name = name;
  clone.entries.forEach(e => (e.id = uuidv4()));
  settings.value.presets.push(clone);
  settings.value.currentPresetId = clone.id;
}

function renameCurrentPreset() {
  if (!currentPreset.value) return;
  const name = prompt('请输入新名称：', currentPreset.value.name);
  if (!name) return;
  currentPreset.value.name = name;
}

function deleteCurrentPreset() {
  if (settings.value.presets.length <= 1) return;
  if (!confirm(`确定删除预设「${currentPreset.value?.name}」？`)) return;
  const idx = settings.value.presets.findIndex(p => p.id === settings.value.currentPresetId);
  if (idx >= 0) {
    settings.value.presets.splice(idx, 1);
    settings.value.currentPresetId = settings.value.presets[0].id;
  }
}

function exportCurrentPreset() {
  if (!currentPreset.value) return;
  const json = JSON.stringify(currentPreset.value, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentPreset.value.name}.json`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

function importPreset() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as TranslatePreset;
      if (!data.entries || !Array.isArray(data.entries)) {
        toastr.error('无效的预设文件');
        return;
      }
      data.id = uuidv4();
      data.entries.forEach(e => (e.id = uuidv4()));
      settings.value.presets.push(data);
      settings.value.currentPresetId = data.id;
      toastr.success(`已导入预设「${data.name}」`);
    } catch (e) {
      toastr.error('导入预设失败');
      console.error(e);
    } finally {
      input.remove();
    }
  });

  document.body.appendChild(input);
  input.click();
}
</script>

<style scoped>
.translate-fab {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--SmartThemeBodyColor, #333);
  color: var(--SmartThemeQuoteColor, #aaa);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 20px;
  user-select: none;
  touch-action: none;
  z-index: 9998;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.translate-fab:hover {
  background: var(--SmartThemeBlurTintColor, #444);
  transform: scale(1.08);
}
.translate-fab:active,
.translate-fab.is-dragging {
  cursor: grabbing;
  transform: scale(1);
}
.fab-auto-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
}

.translate-panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}

.translate-panel {
  width: 420px;
  max-height: 70vh;
  background: var(--SmartThemeBodyColor, #2b2b2b);
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.translate-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor, #555);
}
.translate-panel-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--SmartThemeQuoteColor, #ddd);
}
.translate-panel-close {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--SmartThemeQuoteColor, #aaa);
}
.translate-panel-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.translate-panel-body {
  overflow-y: auto;
  padding: 12px 16px;
  flex: 1;
}

.translate-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}
.translate-section:last-child {
  border-bottom: none;
}
.translate-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--SmartThemeQuoteColor, #bbb);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.translate-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--SmartThemeQuoteColor, #ccc);
  font-size: 13px;
}
.translate-toggle-row input[type='checkbox'] {
  width: 16px;
  height: 16px;
}

.translate-field {
  margin-bottom: 8px;
}
.translate-field label {
  display: block;
  font-size: 12px;
  color: var(--SmartThemeQuoteColor, #aaa);
  margin-bottom: 3px;
}
.translate-field input,
.translate-field select {
  width: 100%;
  padding: 6px 8px;
  background: var(--SmartThemeBlurTintColor, #1e1e1e);
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 6px;
  color: var(--SmartThemeQuoteColor, #ddd);
  font-size: 13px;
  box-sizing: border-box;
}
.translate-field-disabled {
  opacity: 0.5;
}
.translate-field-row {
  display: flex;
  gap: 8px;
}
.translate-field-half {
  flex: 1;
}
.translate-hint {
  font-size: 10px;
  opacity: 0.6;
}

.translate-tag-preview {
  display: flex;
  align-items: center;
  gap: 2px;
}
.translate-tag-preview input {
  flex: 1;
}
.translate-tag-bracket {
  color: var(--SmartThemeQuoteColor, #888);
  font-size: 14px;
  font-family: monospace;
}

.translate-preset-selector {
  display: flex;
  gap: 6px;
  align-items: center;
}
.translate-preset-selector select {
  flex: 1;
  padding: 6px 8px;
  background: var(--SmartThemeBlurTintColor, #1e1e1e);
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 6px;
  color: var(--SmartThemeQuoteColor, #ddd);
  font-size: 13px;
}
.translate-preset-actions {
  display: flex;
  gap: 2px;
}
.translate-preset-actions button {
  background: none;
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 4px;
  color: var(--SmartThemeQuoteColor, #aaa);
  padding: 4px 7px;
  cursor: pointer;
  font-size: 11px;
}
.translate-preset-actions button:hover {
  background: rgba(255, 255, 255, 0.1);
}
.translate-preset-actions button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.translate-entries {
  margin-top: 8px;
}
.translate-entry {
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 6px;
  margin-bottom: 6px;
  overflow: hidden;
}
.translate-entry-history {
  border-color: #f0ad4e;
  background: rgba(240, 173, 78, 0.08);
}
.translate-entry-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
}
.translate-entry-header:hover {
  background: rgba(255, 255, 255, 0.03);
}
.translate-entry-drag {
  color: var(--SmartThemeQuoteColor, #666);
  cursor: grab;
}
.translate-entry-badge {
  background: rgba(240, 173, 78, 0.25);
  color: #f0ad4e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.translate-entry-role {
  padding: 2px 4px;
  background: var(--SmartThemeBlurTintColor, #1e1e1e);
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 4px;
  color: var(--SmartThemeQuoteColor, #ddd);
  font-size: 11px;
}
.translate-entry-spacer {
  flex: 1;
}
.translate-entry-actions {
  display: flex;
  gap: 2px;
}
.translate-entry-actions button {
  background: none;
  border: none;
  color: var(--SmartThemeQuoteColor, #888);
  cursor: pointer;
  padding: 2px 4px;
  font-size: 11px;
}
.translate-entry-actions button:hover {
  color: var(--SmartThemeQuoteColor, #ddd);
}
.translate-entry-actions button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.translate-entry-expand {
  color: var(--SmartThemeQuoteColor, #666);
  font-size: 10px;
}

.translate-entry-body {
  padding: 0 8px 8px;
}
.translate-entry-body textarea {
  width: 100%;
  background: var(--SmartThemeBlurTintColor, #1e1e1e);
  border: 1px solid var(--SmartThemeBorderColor, #555);
  border-radius: 4px;
  color: var(--SmartThemeQuoteColor, #ddd);
  font-size: 12px;
  padding: 6px 8px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}
.translate-entry-history-hint {
  color: #f0ad4e;
  font-size: 12px;
  padding: 8px;
  text-align: center;
  opacity: 0.8;
}

.translate-add-entry {
  width: 100%;
  padding: 6px;
  background: none;
  border: 1px dashed var(--SmartThemeBorderColor, #555);
  border-radius: 6px;
  color: var(--SmartThemeQuoteColor, #aaa);
  cursor: pointer;
  font-size: 12px;
  margin-top: 4px;
}
.translate-add-entry:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* ═══ 过渡动画 ═══ */
.translate-fab-transition-enter-active,
.translate-fab-transition-leave-active {
  transition: opacity 0.2s ease;
}
.translate-fab-transition-enter-from,
.translate-fab-transition-leave-to {
  opacity: 0;
}
</style>
