<template>
  <div class="tab-relations">
    <!-- ═══ 心魔模块（置顶） ═══ -->
    <div class="section demon-section" v-if="data.心魔状态 && data.心魔状态 !== '无'">
      <div class="section-title demon-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7c3aed" stroke-width="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        心魔
        <span class="demon-status-badge" :class="demonStatusClass">{{ data.心魔状态 }}</span>
      </div>
      <div class="demon-card">
        <div class="demon-row">
          <div class="demon-avatar" :class="demonAttitudeClass">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01M15 9h.01" />
            </svg>
          </div>
          <div class="demon-content">
            <div class="demon-header">
              <span class="demon-name">{{ data.心魔名 || '无名心魔' }}</span>
              <span class="demon-attitude-tag" :class="demonAttitudeClass">{{ data.心魔态度 || '未知' }}</span>
            </div>
            <div class="demon-obsession" v-if="data.心魔执念">
              <span class="label">执念：</span>{{ data.心魔执念 }}
            </div>
            <div class="demon-memory" v-if="data.$心魔记忆">
              <div class="events-title">
                心魔记忆
                <button v-if="parseDemonMemory.length > 3" class="memory-toggle" @click="demonMemoryExpanded = !demonMemoryExpanded">
                  {{ demonMemoryExpanded ? '收起' : `展开全部(${parseDemonMemory.length})` }}
                </button>
              </div>
              <div class="event-item" v-for="(mem, idx) in visibleDemonMemory" :key="idx">{{ mem }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 关系列表 ═══ -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        关系列表
        <span class="count-badge">{{ relationCount }}</span>
        <!-- 删除模式切换按钮 -->
        <button v-if="relationCount > 0 && !deleteMode" class="delete-toggle-btn" @click="enterDeleteMode" title="批量删除">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <!-- 删除模式操作栏 -->
      <div v-if="deleteMode" class="delete-bar">
        <span class="delete-info">已选 {{ selectedForDelete.size }} 项</span>
        <button class="delete-select-all" @click="toggleSelectAll">
          {{ selectedForDelete.size === filteredList.length ? '取消全选' : '全选' }}
        </button>
        <button class="delete-confirm-btn" :disabled="selectedForDelete.size === 0" @click="confirmDelete">
          删除选中
        </button>
        <button class="delete-cancel-btn" @click="exitDeleteMode">取消</button>
      </div>

      <!-- 搜索框 -->
      <div class="search-box" v-if="relationCount > 0">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          v-model="relationSearch"
          placeholder="搜索关系..."
          class="search-input"
        />
        <button v-if="relationSearch" class="search-clear" @click="relationSearch = ''">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="relations-list" v-if="filteredList.length > 0">
        <div
          class="relation-card"
          :class="{ 'is-selected': deleteMode && selectedForDelete.has(item.name) }"
          v-for="item in paginatedList"
          :key="item.name"
          @click="deleteMode && toggleSelect(item.name)"
        >
          <div class="relation-row">
            <!-- 删除模式复选框 -->
            <div v-if="deleteMode" class="checkbox-col">
              <div class="checkbox" :class="{ checked: selectedForDelete.has(item.name) }">
                <svg v-if="selectedForDelete.has(item.name)" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <!-- 头像 -->
            <div
              class="avatar-wrapper"
              @mouseenter="hoveredAvatar = item.name"
              @mouseleave="hoveredAvatar = ''"
            >
              <div
                class="avatar"
                :class="{ 'has-portrait': hasPortrait(item.name), ['attitude-ring-' + getAttitudeClass(item.parsed.关系态度)]: true }"
                @click.stop="!deleteMode && hasPortrait(item.name) && openPortrait(item.name, item.parsed.关系态度)"
              >
                <img
                  v-if="hasPortrait(item.name)"
                  :src="getPortraitUrl(item.name)!"
                  :alt="item.name"
                  class="avatar-img"
                  loading="lazy"
                />
                <span v-else class="avatar-text">{{ item.name.charAt(0) }}</span>
              </div>
              <!-- 更换头像按钮（hover 时显示） -->
              <div v-if="!deleteMode && hoveredAvatar === item.name" class="avatar-actions">
                <button
                  class="avatar-action-btn avatar-upload-btn"
                  @click.stop="triggerAvatarUpload(item.name)"
                  title="更换头像"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
                <button
                  v-if="hasCustomAvatar(item.name)"
                  class="avatar-action-btn avatar-remove-btn"
                  @click.stop="handleRemoveAvatar(item.name)"
                  title="恢复默认头像"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 右侧信息 -->
            <div class="relation-content">
              <div class="relation-header">
                <span class="relation-name">{{ item.name }}</span>
                <span class="relation-attitude" :class="getAttitudeClass(item.parsed.关系态度)">
                  {{ item.parsed.关系态度 }}
                </span>
              </div>
              <div class="relation-info">
                <span class="info-tag gender">{{ item.parsed.性别 }}</span>
                <span class="info-tag">{{ item.parsed.修为 }}</span>
                <span class="info-tag">{{ item.parsed.所属 }}</span>
              </div>
              <div class="relation-events" v-if="item.parsed.重要事件">
                <div class="events-title">重要事件</div>
                <div class="event-item" v-for="(event, idx) in parseEvents(item.parsed.重要事件)" :key="idx">
                  {{ event }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else-if="relationSearch">未找到匹配的关系</div>

      <div class="empty-state" v-else>
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <span>暂无关系记录</span>
        <span class="hint">与NPC产生有意义的交互后会自动记录</span>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="relationTotalPages > 1">
        <button class="page-btn" :disabled="relationPage === 1" @click="relationPage--">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="page-info">{{ relationPage }}/{{ relationTotalPages }}</span>
        <button class="page-btn" :disabled="relationPage === relationTotalPages" @click="relationPage++">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 立绘弹出层 -->
    <PortraitViewer
      :visible="portraitVisible"
      :url="portraitUrl"
      :name="portraitName"
      :attitude="portraitAttitude"
      @close="portraitVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStatusStore } from '../store';
import { getPortraitUrl, hasPortrait, hasCustomAvatar, saveCustomAvatar, removeCustomAvatar } from '../characterPortraits';
import PortraitViewer from './PortraitViewer.vue';

const store = useStatusStore();
const data = computed(() => store.data);

// ─── 心魔模块 ───
const demonMemoryExpanded = ref(false);

const parseDemonMemory = computed(() => {
  const raw = data.value.$心魔记忆;
  if (!raw) return [];
  // 反转顺序，最新的在前面
  return raw.split(';').filter(e => e.trim()).reverse();
});

const visibleDemonMemory = computed(() => {
  if (demonMemoryExpanded.value || parseDemonMemory.value.length <= 3) {
    return parseDemonMemory.value;
  }
  return parseDemonMemory.value.slice(0, 3);
});

const demonStatusClass = computed(() => {
  const status = data.value.心魔状态;
  if (status === '潜伏') return 'dormant';
  if (status === '活跃') return 'active';
  if (status === '对峙中') return 'confronting';
  return '';
});

const demonAttitudeClass = computed(() => {
  const attitude = data.value.心魔态度;
  const map: Record<string, string> = {
    '敌对': 'hostile', '试探': 'wary', '中立': 'neutral',
    '合作': 'friendly', '爱恋': 'lover', '臣服': 'trust',
  };
  return map[attitude] || 'neutral';
});

// ─── 关系列表 ───
interface ParsedRelation {
  性别: string;
  修为: string;
  所属: string;
  关系态度: string;
  重要事件: string;
}

function parseRelationStr(raw: string): ParsedRelation {
  const parts = raw.split('|');
  return {
    性别: parts[0] || '',
    修为: parts[1] || '',
    所属: parts[2] || '',
    关系态度: parts[3] || '',
    重要事件: parts[4] || '',
  };
}

interface RelationItem {
  name: string;
  raw: string;
  parsed: ParsedRelation;
}

const relations = computed(() => data.value.关系列表 || {});
const relationCount = computed(() => Object.keys(relations.value).length);

const relationList = computed<RelationItem[]>(() =>
  Object.entries(relations.value).map(([name, raw]) => ({
    name,
    raw,
    parsed: parseRelationStr(raw),
  }))
);

// ─── 头像更换 ───
const hoveredAvatar = ref('');
const avatarUploadTarget = ref('');

function triggerAvatarUpload(name: string) {
  avatarUploadTarget.value = name;
  // 创建隐藏的 file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      await saveCustomAvatar(avatarUploadTarget.value, file);
      toastr.success(`已更换 ${avatarUploadTarget.value} 的头像`, '头像');
    } catch (e: any) {
      toastr.error(e.message || '头像更换失败', '头像');
    }
    input.remove();
  };
  document.body.appendChild(input);
  input.click();
}

function handleRemoveAvatar(name: string) {
  removeCustomAvatar(name);
  toastr.info(`已恢复 ${name} 的默认头像`, '头像');
}

// ─── 立绘弹出 ───
const portraitVisible = ref(false);
const portraitUrl = ref('');
const portraitName = ref('');
const portraitAttitude = ref('');

function openPortrait(name: string, attitude: string) {
  const url = getPortraitUrl(name);
  if (!url) return;
  portraitUrl.value = url;
  portraitName.value = name;
  portraitAttitude.value = attitude;
  portraitVisible.value = true;
}

// ─── 搜索和分页 ───
const RELATIONS_PER_PAGE = 5;
const relationSearch = ref('');
const relationPage = ref(1);

const filteredList = computed<RelationItem[]>(() => {
  if (!relationSearch.value) return relationList.value;
  const keyword = relationSearch.value.toLowerCase();
  return relationList.value.filter(item => item.name.toLowerCase().includes(keyword));
});

const relationTotalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / RELATIONS_PER_PAGE)));

const paginatedList = computed<RelationItem[]>(() => {
  const start = (relationPage.value - 1) * RELATIONS_PER_PAGE;
  return filteredList.value.slice(start, start + RELATIONS_PER_PAGE);
});

watch(relationSearch, () => { relationPage.value = 1; });

function parseEvents(eventsStr: string): string[] {
  if (!eventsStr) return [];
  return eventsStr.split(';').filter(e => e.trim());
}

function getAttitudeClass(attitude: string): string {
  const map: Record<string, string> = {
    '陌生': 'neutral', '警惕': 'wary', '敌对': 'hostile',
    '中立': 'neutral', '好感': 'friendly', '信任': 'trust',
    '敬畏': 'awe', '仇恨': 'hate', '挚友': 'close',
    '师徒': 'master', '道侣': 'lover',
  };
  return map[attitude] || 'neutral';
}

// ─── 批量删除模式 ───
const deleteMode = ref(false);
const selectedForDelete = ref<Set<string>>(new Set());

function enterDeleteMode() {
  deleteMode.value = true;
  selectedForDelete.value = new Set();
}

function exitDeleteMode() {
  deleteMode.value = false;
  selectedForDelete.value = new Set();
}

function toggleSelect(name: string) {
  const s = new Set(selectedForDelete.value);
  if (s.has(name)) s.delete(name);
  else s.add(name);
  selectedForDelete.value = s;
}

function toggleSelectAll() {
  if (selectedForDelete.value.size === filteredList.value.length) {
    selectedForDelete.value = new Set();
  } else {
    selectedForDelete.value = new Set(filteredList.value.map(item => item.name));
  }
}

async function confirmDelete() {
  if (selectedForDelete.value.size === 0) return;
  const names = Array.from(selectedForDelete.value);
  const newRelations = { ...store.data.关系列表 };
  for (const name of names) {
    delete newRelations[name];
  }
  store.data.关系列表 = newRelations;
  await store.saveData();
  toastr.info(`已删除 ${names.length} 条关系`, '关系列表');
  exitDeleteMode();
}
</script>

<style scoped>
.tab-relations {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section {
  background: var(--card-bg, #fafafa);
  border-radius: 10px;
  padding: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-gold, #b8963e);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.count-badge {
  padding: 2px 8px;
  background: rgba(200, 169, 110, 0.15);
  color: var(--accent-gold, #b8963e);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

/* ─── 心魔模块 ─── */
.demon-section {
  border: 1px solid rgba(124, 58, 237, 0.2);
  background: color-mix(in srgb, var(--card-bg, #fafafa) 92%, #7c3aed);
}

.demon-title {
  color: #7c3aed;
}

.demon-status-badge {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}
.demon-status-badge.dormant { background: rgba(100, 116, 139, 0.15); color: #64748b; }
.demon-status-badge.active { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.demon-status-badge.confronting { background: rgba(239, 68, 68, 0.25); color: #dc2626; }

.demon-card {
  background: var(--content-bg, #fff);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid var(--card-border, #e5e7eb);
}

.demon-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.demon-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.1);
  border: 2px solid rgba(124, 58, 237, 0.4);
  color: #7c3aed;
}
.demon-avatar.hostile { border-color: rgba(220, 38, 38, 0.5); color: #dc2626; background: rgba(220, 38, 38, 0.08); }
.demon-avatar.wary { border-color: rgba(234, 88, 12, 0.5); color: #ea580c; background: rgba(234, 88, 12, 0.08); }
.demon-avatar.friendly { border-color: rgba(5, 150, 105, 0.5); color: #059669; background: rgba(5, 150, 105, 0.08); }
.demon-avatar.lover { border-color: rgba(219, 39, 119, 0.5); color: #db2777; background: rgba(219, 39, 119, 0.08); }
.demon-avatar.trust { border-color: rgba(59, 130, 246, 0.5); color: #3b82f6; background: rgba(59, 130, 246, 0.08); }

.demon-content { flex: 1; min-width: 0; }

.demon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.demon-name {
  font-size: 14px;
  font-weight: 700;
  color: #7c3aed;
}

.demon-attitude-tag {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: var(--card-bg, #f3f4f6);
  color: var(--text-muted, #6b7280);
}
.demon-attitude-tag.hostile { background: #fee2e2; color: #dc2626; }
.demon-attitude-tag.wary { background: #fed7aa; color: #ea580c; }
.demon-attitude-tag.friendly { background: #d1fae5; color: #059669; }
.demon-attitude-tag.lover { background: #fce7f3; color: #db2777; }
.demon-attitude-tag.trust { background: #dbeafe; color: #3b82f6; }

.demon-obsession {
  font-size: 12px;
  color: var(--text-secondary, #475569);
  margin-bottom: 6px;
}
.demon-obsession .label {
  font-weight: 600;
  color: var(--text-muted, #64748b);
  font-size: 10px;
  text-transform: uppercase;
}

.demon-memory {
  padding-top: 8px;
  border-top: 1px dashed rgba(124, 58, 237, 0.2);
.memory-toggle {
  margin-left: auto;
  padding: 1px 8px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  background: transparent;
  font-size: 9px;
  color: #7c3aed;
  cursor: pointer;
  transition: all 0.15s;
}
.memory-toggle:hover {
  background: rgba(124, 58, 237, 0.08);
  border-color: rgba(124, 58, 237, 0.4);
}

}

/* ─── 删除模式 ─── */
.delete-toggle-btn {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--card-border, #e5e7eb);
  background: transparent;
  color: var(--text-muted, #9ca3af);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.delete-toggle-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.delete-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  margin-bottom: 10px;
}

.delete-info {
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
}

.delete-select-all,
.delete-cancel-btn {
  padding: 4px 10px;
  border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 6px;
  background: var(--content-bg, #fff);
  font-size: 11px;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.15s;
}
.delete-select-all:hover,
.delete-cancel-btn:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.delete-confirm-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: auto;
}
.delete-confirm-btn:hover:not(:disabled) { background: #dc2626; }
.delete-confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.checkbox-col {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid var(--card-border, #d1d5db);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  cursor: pointer;
}
.checkbox.checked {
  background: #ef4444;
  border-color: #ef4444;
}

.relation-card.is-selected {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.03);
}

/* ─── 关系列表（保持原有样式） ─── */
.relations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.relation-card {
  background: var(--content-bg, #fff);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid var(--card-border, #e5e7eb);
  transition: border-color 0.15s, background 0.15s;
}

.relation-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px;
  min-height: 44px;
  max-width: 44px;
  max-height: 44px;
  border-radius: 50% !important;
  flex-shrink: 0;
  overflow: hidden !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, #f3f4f6);
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
  position: relative;
  aspect-ratio: 1 / 1;
}

.avatar.has-portrait {
  cursor: pointer;
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.15);
}

.avatar.has-portrait:hover {
  border-color: var(--accent-gold, #b8963e);
  box-shadow: 0 0 14px rgba(139, 92, 246, 0.35);
  transform: scale(1.08);
}

.avatar-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: 50% !important;
  display: block;
  aspect-ratio: 1 / 1;
}

.avatar-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-muted, #9ca3af);
  user-select: none;
}

/* ─── 态度光环 ─── */
.avatar.attitude-ring-friendly,
.avatar.attitude-ring-trust,
.avatar.attitude-ring-close {
  border-color: rgba(5, 150, 105, 0.5);
}
.avatar.attitude-ring-friendly.has-portrait:hover,
.avatar.attitude-ring-trust.has-portrait:hover,
.avatar.attitude-ring-close.has-portrait:hover {
  border-color: #059669;
  box-shadow: 0 0 14px rgba(5, 150, 105, 0.35);
}

.avatar.attitude-ring-lover {
  border-color: rgba(219, 39, 119, 0.5);
}
.avatar.attitude-ring-lover.has-portrait:hover {
  border-color: #db2777;
  box-shadow: 0 0 14px rgba(219, 39, 119, 0.35);
}

.avatar.attitude-ring-hostile,
.avatar.attitude-ring-hate {
  border-color: rgba(220, 38, 38, 0.5);
}
.avatar.attitude-ring-hostile.has-portrait:hover,
.avatar.attitude-ring-hate.has-portrait:hover {
  border-color: #dc2626;
  box-shadow: 0 0 14px rgba(220, 38, 38, 0.35);
}

.avatar.attitude-ring-awe {
  border-color: rgba(217, 119, 6, 0.5);
}
.avatar.attitude-ring-awe.has-portrait:hover {
  border-color: #d97706;
  box-shadow: 0 0 14px rgba(217, 119, 6, 0.35);
}

.avatar.attitude-ring-wary {
  border-color: rgba(234, 88, 12, 0.5);
}
.avatar.attitude-ring-wary.has-portrait:hover {
  border-color: #ea580c;
  box-shadow: 0 0 14px rgba(234, 88, 12, 0.35);
}

.avatar.attitude-ring-master {
  border-color: rgba(139, 92, 246, 0.5);
}
.avatar.attitude-ring-master.has-portrait:hover {
  border-color: var(--accent-gold, #b8963e);
  box-shadow: 0 0 14px rgba(139, 92, 246, 0.35);
}

/* ─── 头像操作按钮 ─── */
.avatar-actions {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  z-index: 10;
}

.avatar-action-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--card-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}

.avatar-upload-btn {
  background: var(--accent-gold, #b8963e);
  border-color: var(--accent-gold, #b8963e);
  color: #fff;
}
.avatar-upload-btn:hover {
  background: #a07c2e;
  transform: scale(1.1);
}

.avatar-remove-btn {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.avatar-remove-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.relation-content {
  flex: 1;
  min-width: 0;
}

.relation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.relation-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
}

.relation-attitude {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: var(--card-bg, #f3f4f6);
  color: var(--text-muted, #6b7280);
}

.relation-attitude.friendly,
.relation-attitude.trust,
.relation-attitude.close {
  background: #d1fae5;
  color: #059669;
}

.relation-attitude.lover {
  background: #fce7f3;
  color: #db2777;
}

.relation-attitude.hostile,
.relation-attitude.hate {
  background: #fee2e2;
  color: #dc2626;
}

.relation-attitude.awe {
  background: #fef3c7;
  color: #d97706;
}

.relation-attitude.wary {
  background: #fed7aa;
  color: #ea580c;
}

.relation-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.info-tag {
  padding: 2px 8px;
  background: var(--card-bg, #f3f4f6);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-muted, #6b7280);
}

.info-tag.gender {
  background: #ede9fe;
  color: var(--accent-gold, #b8963e);
}

.relation-events {
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.events-title {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted, #9ca3af);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.event-item {
  font-size: 11px;
  color: #4b5563;
  padding: 4px 0;
  padding-left: 12px;
  position: relative;
}

.event-item::before {
  content: '·';
  position: absolute;
  left: 0;
  color: #d1d5db;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: var(--text-muted, #9ca3af);
  text-align: center;
}

.empty-state svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state span {
  font-size: 12px;
}

.empty-state .hint {
  font-size: 10px;
  margin-top: 6px;
  opacity: 0.7;
}

/* ─── 搜索 ─── */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--content-bg, #fff);
  border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 8px;
  margin-bottom: 10px;
}

.search-box svg {
  color: var(--text-muted, #9ca3af);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--text-primary, #374151);
  background: transparent;
}

.search-input::placeholder {
  color: var(--text-muted, #9ca3af);
}

.search-clear {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: #e5e7eb;
  color: var(--text-muted, #6b7280);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.search-clear:hover {
  background: #d1d5db;
}

/* ─── 分页 ─── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.page-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--card-border, #e5e7eb);
  background: var(--content-bg, #fff);
  color: var(--text-muted, #6b7280);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: var(--tab-hover-bg, #f5f3ff);
  border-color: var(--accent-gold, #b8963e);
  color: var(--accent-gold, #b8963e);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

/* PC端字号放大 */
@media (min-width: 501px) {
  .section-title { font-size: 14px; }
}

/* 手机端适配 */
@media (max-width: 500px) {
  .tab-relations { padding: 10px; gap: 10px; }
  .section { padding: 10px; }
  .relation-card { padding: 10px; }
  .relation-row { gap: 10px; }
  .avatar {
    width: 38px !important;
    height: 38px !important;
    min-width: 38px;
    min-height: 38px;
    max-width: 38px;
    max-height: 38px;
  }
  .avatar-action-btn {
    width: 18px;
    height: 18px;
  }
  .relation-name { font-size: 13px; }
  .relation-attitude { font-size: 10px; padding: 2px 8px; }
  .info-tag { font-size: 9px; padding: 2px 6px; }
  .event-item { font-size: 10px; }
  .search-box { padding: 6px 10px; }
  .delete-bar { padding: 6px 8px; gap: 6px; }
  .delete-info { font-size: 11px; }

  /* 心魔模块 */
  .demon-avatar { width: 38px; height: 38px; }
  .demon-name { font-size: 13px; }
  .demon-obsession { font-size: 11px; }
}
</style>
