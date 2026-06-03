<script setup lang="ts">
import { useMainStore } from '../stores/mainStore';
import type { CharacterMemory, DynamicProfile } from '../stores/mainStore';
import type { NsfwCharacterMemory } from '../core/nsfwIsolation';
import type { ActorBehaviorTree } from '../core/ecosystem';

const store = useMainStore();

const selectedCharacter = ref('');
const editingMemory = ref('');
const editingKeywords = ref('');
const editingDynamicProfile = ref('');
const isEditing = ref(false);
const isDeleting = ref(false); // 编辑角色模式：显示删除按钮

// NSFW 记忆
const showNsfw = ref(false);
const editingNsfwSensitivePoints = ref('');
const editingNsfwPreferences = ref('');
const editingNsfwBehaviors = ref('');
const editingNsfwMemories = ref('');

// 当前选中角色的 NSFW 记忆
const selectedNsfwMem = computed((): NsfwCharacterMemory | undefined => {
  if (!selectedCharacter.value) return undefined;
  return store.nsfwMemories.find(m => m.characterName === selectedCharacter.value);
});

// 记忆控制弹窗
const showMemoryControl = ref(false);
const memoryMinLocal = ref(store.settings.memoryMinPerChar);
const memoryMaxLocal = ref(store.settings.memoryMaxPerChar);
const recentVersionsLocal = ref(store.settings.recentMemoryVersions ?? 1);
const corePreview = computed(() => Math.max(1, Math.ceil(memoryMaxLocal.value / 3)));

function saveMemoryControl() {
  if (memoryMaxLocal.value < memoryMinLocal.value) {
    memoryMaxLocal.value = memoryMinLocal.value;
  }
  if (recentVersionsLocal.value < 1) recentVersionsLocal.value = 1;
  if (recentVersionsLocal.value > 5) recentVersionsLocal.value = 5;
  store.updateSettings({
    memoryMinPerChar: memoryMinLocal.value,
    memoryMaxPerChar: memoryMaxLocal.value,
    recentMemoryVersions: recentVersionsLocal.value,
  });
  showMemoryControl.value = false;
}

function resetMemoryControl() {
  memoryMinLocal.value = 4;
  memoryMaxLocal.value = 8;
  recentVersionsLocal.value = 1;
}

function openMemoryControl() {
  memoryMinLocal.value = store.settings.memoryMinPerChar;
  memoryMaxLocal.value = store.settings.memoryMaxPerChar;
  recentVersionsLocal.value = store.settings.recentMemoryVersions ?? 1;
  showMemoryControl.value = true;
}

// 追忆弹窗
const showArchive = ref(false);
const archiveCharacter = ref('');

// 追忆编辑
const editingArchiveText = ref('');
const editingArchiveVersion = ref(-1);
const editingArchiveIdx = ref(-1);

function openArchive(name: string) {
  archiveCharacter.value = name;
  showArchive.value = true;
  editingArchiveVersion.value = -1;
}

// 归档数据用 computed 缓存，跳过无记忆记录的版本
const archiveData = computed(() => {
  if (!showArchive.value || !archiveCharacter.value) return [];
  return store.getCharacterMemoryArchive(archiveCharacter.value).filter(v => v.memories.length > 0);
});

function startArchiveEdit(version: number, idx: number, currentText: string) {
  editingArchiveVersion.value = version;
  editingArchiveIdx.value = idx;
  editingArchiveText.value = currentText;
}

function saveArchiveEdit() {
  const version = editingArchiveVersion.value;
  const idx = editingArchiveIdx.value;
  if (version < 0 || idx < 0) return;
  const summary = store.chatData.summaries.find((s: any) => s.version === version);
  if (!summary) return;
  const mem = summary.characterMemories.find((m: any) => m.characterName === archiveCharacter.value);
  if (!mem) return;
  const ordered = (mem as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
  if (!ordered || idx >= ordered.length) return;
  ordered[idx] = { text: editingArchiveText.value.trim(), isCore: ordered[idx].isCore };
  store.forcePersist();
  editingArchiveVersion.value = -1;
}

function cancelArchiveEdit() {
  editingArchiveVersion.value = -1;
}

function toggleArchiveCore(version: number, idx: number) {
  const summary = store.chatData.summaries.find((s: any) => s.version === version);
  if (!summary) return;
  const mem = summary.characterMemories.find((m: any) => m.characterName === archiveCharacter.value);
  if (!mem) return;
  const ordered = (mem as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
  if (!ordered || idx >= ordered.length) return;
  ordered[idx] = { text: ordered[idx].text, isCore: !ordered[idx].isCore };
  store.forcePersist();
}

// 所有角色名（归一化：Qingyue (清月) → Qingyue），排除已忽略
const allCharacters = computed(() => {
  const rawNames = new Set<string>();
  const ignored = new Set(store.chatData.ignoredCharacters);
  const latestSummary = store.getLatestSummary();
  if (latestSummary) {
    for (const m of latestSummary.characterMemories) {
      if (!ignored.has(m.characterName)) {
        rawNames.add(m.characterName);
      }
    }
  }
  for (const p of store.dynamicProfiles) {
    if (!ignored.has(p.characterName)) {
      rawNames.add(p.characterName);
    }
  }
  // 后台推演的角色也加入列表
  const ecoState = store.ecosystemState;
  if (ecoState?.behaviorTrees) {
    for (const t of ecoState.behaviorTrees) {
      if (!ignored.has(t.characterName)) {
        rawNames.add(t.characterName);
      }
    }
  }
  // 归一化去重：去掉括号后缀，优先保留短名
  const normalized = new Map<string, string>();
  for (const name of rawNames) {
    const norm = name.replace(/\s*\(.+?\)$/g, '');
    if (!normalized.has(norm) || name.length < normalized.get(norm)!.length) {
      normalized.set(norm, name);
    }
  }
  return Array.from(normalized.values());
});

// 当前选中角色的记忆（融合后）
const selectedMemory = computed((): CharacterMemory | undefined => {
  if (!selectedCharacter.value) return undefined;
  return store.getCharacterMemories(selectedCharacter.value);
});

// 当前选中角色的动态人设
const selectedProfile = computed((): DynamicProfile | undefined => {
  if (!selectedCharacter.value) return undefined;
  return store.dynamicProfiles.find(p => p.characterName === selectedCharacter.value);
});

// 记忆条目的排序展示列表
const memoryDisplayItems = computed(() => {
  const mem = selectedMemory.value;
  if (!mem) return [];
  const ordered = (mem as any)._orderedItems as Array<{ text: string; isCore: boolean }> | undefined;
  if (ordered && ordered.length > 0) return ordered;
  return (mem.memories || []).map((m: string) => {
    const match = m.match(/^\[(核心|近期)\](.*)/);
    return match
      ? { text: match[2].trim(), isCore: match[1] === '核心' }
      : { text: m, isCore: false };
  });
});

// 行为逻辑树
const showBehaviorTree = ref(false);

const selectedBehaviorTree = computed((): ActorBehaviorTree | undefined => {
  if (!selectedCharacter.value) return undefined;
  const ecoState = store.ecosystemState;
  if (!ecoState?.behaviorTrees) return undefined;
  return ecoState.behaviorTrees.find(t => t.characterName === selectedCharacter.value);
});

function selectCharacter(name: string) {
  selectedCharacter.value = name;
  isEditing.value = false;
  showBehaviorTree.value = false;
  loadEditFields();
}

function removeCharacter(name: string) {
  if (confirm(`确定要忽略角色「${name}」吗？\n\n忽略后：\n- 从角色库中移除\n- 后续大总结不再生成该角色的记忆和动态人设\n- 可在设置页恢复`)) {
    // 移除角色后，如果当前选中的就是这个角色，清除选中
    if (selectedCharacter.value === name) {
      selectedCharacter.value = '';
    }
    store.ignoreCharacter(name);
    store.forcePersist();
  }
}

function loadEditFields() {
  const mem = selectedMemory.value;
  if (mem) {
    const ordered = (mem as any)._orderedItems as Array<{ text: string; isCore: boolean }> | undefined;
    if (ordered) {
      editingMemory.value = ordered.map(m => m.text).join('\n');
    } else {
      editingMemory.value = (mem.memories || []).map((m: string) => m.replace(/^\[(?:核心|近期)\]/, '')).join('\n');
    }
    editingKeywords.value = mem.keywords.join(', ');
  } else {
    editingMemory.value = '';
    editingKeywords.value = '';
  }
  const prof = selectedProfile.value;
  editingDynamicProfile.value = prof?.dynamicContent || '';
  // NSFW 字段
  const nsfw = selectedNsfwMem.value;
  editingNsfwSensitivePoints.value = (nsfw?.sensitivePoints || []).join('\n');
  editingNsfwPreferences.value = (nsfw?.preferences || []).join('\n');
  editingNsfwBehaviors.value = (nsfw?.behaviors || []).join('\n');
  editingNsfwMemories.value = (nsfw?.memories || []).join('\n');
}

function saveEdits() {
  if (!selectedCharacter.value) return;

  // 写入最新 delta（而不是组装视图）
  const delta = store.getLatestDelta();
  if (!delta) return;

  let memIdx = delta.characterMemories.findIndex(
    m => m.characterName === selectedCharacter.value,
  );

  // 如果最新 delta 中没有该角色（只有旧版本才有），在 delta 中创建一个条目
  if (memIdx === -1) {
    delta.characterMemories.push({
      characterName: selectedCharacter.value,
      aliases: [],
      attitude: 'neutral' as const,
      coreMemories: [],
      recentMemories: [],
      keywords: [],
    });
    memIdx = delta.characterMemories.length - 1;
  }

  const lines = editingMemory.value.split('\n').map(l => l.trim()).filter(Boolean);
  const oldOrdered = (delta.characterMemories[memIdx] as any).orderedNewMemories as Array<{ text: string; isCore: boolean }> | undefined;
  const oldTextToCore = new Map((oldOrdered || []).map(m => [m.text, m.isCore]));
  const newOrdered = lines.map(l => ({
    text: l,
    isCore: oldTextToCore.get(l) ?? false,
  }));
  (delta.characterMemories[memIdx] as any).orderedNewMemories = newOrdered;
  delta.characterMemories[memIdx].coreMemories = newOrdered.filter(o => o.isCore).map(o => o.text);
  delta.characterMemories[memIdx].recentMemories = newOrdered.filter(o => !o.isCore).map(o => o.text);
  (delta.characterMemories[memIdx] as any)._manuallyEdited = true;
  delta.characterMemories[memIdx].keywords = editingKeywords.value
    .split(/[,，、]/)
    .map(k => k.trim())
    .filter(Boolean);

  if (editingDynamicProfile.value.trim()) {
    store.updateDynamicProfile({
      characterName: selectedCharacter.value,
      dynamicContent: editingDynamicProfile.value.trim(),
      lastUpdatedAt: new Date().toISOString(),
      basedOnSummaryVersion: delta.version,
    });
  }

  // NSFW 记忆保存
  const nsfwLines = (str: string) => str.split('\n').map(l => l.trim()).filter(Boolean);
  const nsfwNew: NsfwCharacterMemory = {
    characterName: selectedCharacter.value,
    sensitivePoints: nsfwLines(editingNsfwSensitivePoints.value),
    preferences: nsfwLines(editingNsfwPreferences.value),
    behaviors: nsfwLines(editingNsfwBehaviors.value),
    memories: nsfwLines(editingNsfwMemories.value),
    lastUpdatedAt: new Date().toISOString(),
  };
  const nsfwIdx = store.chatData.nsfwMemories.findIndex(m => m.characterName === selectedCharacter.value);
  if (nsfwIdx >= 0) {
    store.chatData.nsfwMemories[nsfwIdx] = nsfwNew;
  } else {
    store.chatData.nsfwMemories.push(nsfwNew);
  }

  isEditing.value = false;
  // 强制替换 delta 对象引用触发 Vue 响应式
  const lastIdx = store.chatData.summaries.length - 1;
  store.chatData.summaries[lastIdx] = { ...store.chatData.summaries[lastIdx] };
  store.forcePersist();
}

function cancelEdit() {
  isEditing.value = false;
  loadEditFields();
}
</script>

<template>
  <div class="zhino-character">
    <!-- 滚动内容区 -->
    <div class="zhino-char-scroll">
      <!-- 顶部按钮栏 -->
      <div class="zhino-char-topbar">
        <button class="zhino-memory-ctrl-btn" @click="openMemoryControl" title="记忆控制">
          记忆控制
        </button>
        <button
          v-if="allCharacters.length > 0"
          class="zhino-btn-sm zhino-edit-role-btn"
          :class="{ 'zhino-btn-delete-mode': isDeleting }"
          @click="isDeleting = !isDeleting"
        >
          {{ isDeleting ? '结束编辑' : '编辑角色' }}
        </button>
      </div>

      <!-- 角色列表 -->
      <div class="zhino-section">
        <div class="zhino-section-header">
          <div class="zhino-section-title">角色列表 ({{ allCharacters.length }})</div>
        </div>
        <div v-if="allCharacters.length === 0" class="zhino-empty-hint">
          暂无角色数据（完成首次大总结后显示）
        </div>
        <div v-else class="zhino-char-list">
          <button
            v-for="name in allCharacters"
            :key="name"
            class="zhino-char-item"
            :class="{ active: selectedCharacter === name }"
            @click="selectCharacter(name)"
          >
            <span class="zhino-char-name">{{ name }}</span>
            <span v-if="selectedMemory && selectedCharacter === name" class="zhino-char-attitude"
              :class="selectedMemory.attitude"
            >
              {{ selectedMemory.attitude === 'like' ? '♥' : selectedMemory.attitude === 'dislike' ? '✗' : '—' }}
            </span>
            <span v-if="isDeleting" class="zhino-char-delete" title="忽略此角色" @click.stop="removeCharacter(name)">✕</span>
          </button>
        </div>
      </div>

      <!-- 角色详情 -->
      <template v-if="selectedCharacter">
        <div class="zhino-section">
          <div class="zhino-section-header">
            <div class="zhino-section-title">{{ selectedCharacter }} 详情</div>
            <div v-if="!isEditing" class="zhino-btn-group">
              <button class="zhino-btn-sm zhino-btn-archive" @click="openArchive(selectedCharacter)">追忆</button>
              <button class="zhino-btn-sm" @click="isEditing = true">编辑</button>
            </div>
            <div v-else class="zhino-btn-group">
              <button class="zhino-btn-sm zhino-btn-save" @click="saveEdits">保存</button>
              <button class="zhino-btn-sm" @click="cancelEdit">取消</button>
            </div>
          </div>

          <div v-if="selectedMemory?.aliases?.length" class="zhino-detail-row">
            <span class="zhino-detail-label">别名：</span>
            <span class="zhino-detail-value">{{ selectedMemory.aliases.join(', ') }}</span>
          </div>

          <div v-if="selectedMemory" class="zhino-detail-row">
            <span class="zhino-detail-label">态度：</span>
            <span class="zhino-detail-value" :class="'attitude-' + selectedMemory.attitude">
              {{ selectedMemory.attitude === 'like' ? '好感' : selectedMemory.attitude === 'dislike' ? '厌恶' : '中立' }}
            </span>
          </div>

          <div class="zhino-detail-block">
            <div class="zhino-detail-label">记忆条目：</div>
            <template v-if="isEditing">
              <textarea v-model="editingMemory" class="zhino-textarea" rows="6" placeholder="每行一条记忆（第一人称）" />
            </template>
            <template v-else>
              <div v-if="memoryDisplayItems.length > 0" class="zhino-memory-list">
                <div v-for="(item, idx) in memoryDisplayItems" :key="idx" class="zhino-memory-item" :class="{ 'is-core': item.isCore, 'is-recent': !item.isCore }">
                  <span class="zhino-memory-badge">{{ item.isCore ? '核心' : '近期' }}</span>
                  <span class="zhino-memory-text">{{ item.text }}</span>
                </div>
              </div>
              <div v-else class="zhino-empty-hint">无记忆数据</div>
            </template>
          </div>

          <div class="zhino-detail-block">
            <div class="zhino-detail-label">激活关键词：</div>
            <template v-if="isEditing">
              <input v-model="editingKeywords" class="zhino-input" placeholder="逗号分隔" />
            </template>
            <template v-else>
              <div v-if="selectedMemory && selectedMemory.keywords.length > 0" class="zhino-tag-list">
                <span v-for="kw in selectedMemory.keywords" :key="kw" class="zhino-tag">{{ kw }}</span>
              </div>
              <div v-else class="zhino-empty-hint">无关键词</div>
            </template>
          </div>

          <div class="zhino-detail-block">
            <div class="zhino-detail-label">动态人设：</div>
            <template v-if="isEditing">
              <textarea v-model="editingDynamicProfile" class="zhino-textarea" rows="4" placeholder="角色当前状态描述" />
            </template>
            <template v-else>
              <div v-if="selectedProfile" class="zhino-profile-text">{{ selectedProfile.dynamicContent }}</div>
              <div v-else class="zhino-empty-hint">无动态人设</div>
            </template>
          </div>

          <!-- NSFW 记忆 -->
          <div class="zhino-detail-block">
            <div class="zhino-behavior-header" @click="showNsfw = !showNsfw">
              <span class="zhino-detail-label" style="margin-bottom:0;cursor:pointer">NSFW 记忆 ▸</span>
              <span class="zhino-behavior-toggle" :style="{ color: selectedNsfwMem ? 'rgba(248,113,113,0.6)' : '' }">{{ showNsfw ? '收起' : selectedNsfwMem ? '展开 (有数据)' : '展开' }}</span>
            </div>
            <template v-if="showNsfw">
              <template v-if="isEditing">
                <div class="zhino-nsfw-field">
                  <span class="zhino-detail-label">身体敏感点：</span>
                  <textarea v-model="editingNsfwSensitivePoints" class="zhino-textarea" rows="2" placeholder="每行一个" />
                </div>
                <div class="zhino-nsfw-field">
                  <span class="zhino-detail-label">性爱偏好：</span>
                  <textarea v-model="editingNsfwPreferences" class="zhino-textarea" rows="2" placeholder="每行一个" />
                </div>
                <div class="zhino-nsfw-field">
                  <span class="zhino-detail-label">行为模式：</span>
                  <textarea v-model="editingNsfwBehaviors" class="zhino-textarea" rows="2" placeholder="每行一个（主动/被动等）" />
                </div>
                <div class="zhino-nsfw-field">
                  <span class="zhino-detail-label">细节记忆：</span>
                  <textarea v-model="editingNsfwMemories" class="zhino-textarea" rows="3" placeholder="每行一条（第一人称）" />
                </div>
              </template>
              <template v-else>
                <div v-if="selectedNsfwMem">
                  <div v-if="selectedNsfwMem.sensitivePoints.length > 0" class="zhino-nsfw-row">
                    <span class="zhino-detail-label">身体敏感点：</span>
                    <span class="zhino-tag-list">
                      <span v-for="(sp, i) in selectedNsfwMem.sensitivePoints" :key="'sp-'+i" class="zhino-tag zhino-tag-nsfw">{{ sp }}</span>
                    </span>
                  </div>
                  <div v-if="selectedNsfwMem.preferences.length > 0" class="zhino-nsfw-row">
                    <span class="zhino-detail-label">性爱偏好：</span>
                    <span class="zhino-tag-list">
                      <span v-for="(p, i) in selectedNsfwMem.preferences" :key="'p-'+i" class="zhino-tag zhino-tag-nsfw">{{ p }}</span>
                    </span>
                  </div>
                  <div v-if="selectedNsfwMem.behaviors.length > 0" class="zhino-nsfw-row">
                    <span class="zhino-detail-label">行为模式：</span>
                    <span class="zhino-tag-list">
                      <span v-for="(b, i) in selectedNsfwMem.behaviors" :key="'b-'+i" class="zhino-tag zhino-tag-nsfw">{{ b }}</span>
                    </span>
                  </div>
                  <div v-if="selectedNsfwMem.memories.length > 0" class="zhino-nsfw-row">
                    <span class="zhino-detail-label">细节记忆：</span>
                    <div class="zhino-memory-list" style="margin-top:2px">
                      <div v-for="(m, i) in selectedNsfwMem.memories" :key="'m-'+i" class="zhino-memory-item zhino-nsfw-memory-item">{{ m }}</div>
                    </div>
                  </div>
                  <div class="zhino-nsfw-updated" v-if="selectedNsfwMem.lastUpdatedAt">
                    更新于 {{ new Date(selectedNsfwMem.lastUpdatedAt).toLocaleString() }}
                  </div>
                </div>
                <div v-else class="zhino-empty-hint">该角色暂无 NSFW 记忆数据</div>
              </template>
            </template>
          </div>

          <!-- 行为逻辑树 -->
          <div v-if="selectedBehaviorTree" class="zhino-detail-block">
            <div class="zhino-behavior-header" @click="showBehaviorTree = !showBehaviorTree">
              <span class="zhino-detail-label" style="margin-bottom:0;cursor:pointer">行为逻辑 ▸</span>
              <span class="zhino-behavior-toggle">{{ showBehaviorTree ? '收起' : '展开' }}</span>
            </div>
            <div v-if="showBehaviorTree" class="zhino-behavior-tree">
              <div
                v-for="(node, idx) in selectedBehaviorTree.nodes"
                :key="idx"
                class="zhino-behavior-node"
              >
                <span class="zhino-behavior-condition">{{ node.condition }}</span>
                <span class="zhino-behavior-arrow">→</span>
                <span class="zhino-behavior-action">{{ node.action }}</span>
                <span class="zhino-behavior-loc">@ {{ node.location }}</span>
                <span class="zhino-behavior-priority">[{{ node.priority }}]</span>
              </div>
              <div class="zhino-behavior-node zhino-behavior-fallback">
                <span class="zhino-behavior-condition">默认</span>
                <span class="zhino-behavior-arrow">→</span>
                <span class="zhino-behavior-action">{{ selectedBehaviorTree.fallbackAction }}</span>
                <span class="zhino-behavior-loc">@ {{ selectedBehaviorTree.fallbackLocation }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 追忆弹窗（滚动容器外，不被裁剪） -->
    <div v-if="showArchive" class="zhino-overlay" @click.self="showArchive = false">
      <div class="zhino-archive-panel">
        <div class="zhino-section-header">
          <div class="zhino-section-title">追忆：{{ archiveCharacter }}</div>
          <button class="zhino-btn-sm" @click="showArchive = false">关闭</button>
        </div>
        <div class="zhino-archive-list">
          <div v-if="archiveData.length === 0" class="zhino-empty-hint">该角色暂无记忆记录</div>
            <div v-for="ver in archiveData" :key="ver.version" class="zhino-archive-version">
            <div class="zhino-archive-ver-header">
              大总结 v{{ ver.version }}（{{ new Date(ver.generatedAt).toLocaleString() }}）
            </div>
            <div v-for="(item, idx) in ver.memories" :key="idx" class="zhino-archive-item" :class="{ 'is-core': item.isCore }">
              <span class="zhino-memory-badge">{{ item.isCore ? '核心' : '近期' }}</span>
              <template v-if="editingArchiveVersion === ver.version && editingArchiveIdx === idx">
                <textarea v-model="editingArchiveText" class="zhino-archive-input" @keydown.ctrl.enter="saveArchiveEdit" @keydown.escape="cancelArchiveEdit" autofocus rows="3"></textarea>
                <div class="zhino-archive-item-actions">
                  <button class="zhino-btn-sm zhino-btn-save" @click="saveArchiveEdit">✓</button>
                  <button class="zhino-btn-sm" @click="cancelArchiveEdit">✗</button>
                </div>
              </template>
              <template v-else>
                <span class="zhino-memory-text">{{ item.text }}</span>
                <div class="zhino-archive-item-actions">
                  <button class="zhino-btn-sm zhino-btn-toggle" @click="toggleArchiveCore(ver.version, idx)" :title="item.isCore ? '转为近期' : '转为核心'">↻</button>
                  <button class="zhino-btn-sm zhino-btn-edit" @click="startArchiveEdit(ver.version, idx, item.text)" title="编辑">✎</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 记忆控制弹窗（滚动容器外，不被裁剪） -->
    <div v-if="showMemoryControl" class="zhino-overlay" @click.self="showMemoryControl = false">
      <div class="zhino-memory-ctrl-panel">
        <div class="zhino-section-title">记忆控制</div>
        <div class="zhino-memory-ctrl-desc">控制每次大总结时每个角色生成的记忆条目数量</div>
        <div class="zhino-memory-ctrl-row">
          <span class="zhino-memory-ctrl-label">最少记忆</span>
          <input type="range" class="zhino-slider" :value="memoryMinLocal" min="3" max="10" @input="memoryMinLocal = Number(($event.target as HTMLInputElement).value)" />
          <span class="zhino-memory-ctrl-value">{{ memoryMinLocal }}</span>
        </div>
        <div class="zhino-memory-ctrl-row">
          <span class="zhino-memory-ctrl-label">最多记忆</span>
          <input type="range" class="zhino-slider" :value="memoryMaxLocal" min="3" max="12" @input="memoryMaxLocal = Number(($event.target as HTMLInputElement).value)" />
          <span class="zhino-memory-ctrl-value">{{ memoryMaxLocal }}</span>
        </div>
        <div class="zhino-section-title" style="margin-top:12px">角色记忆力</div>
        <div class="zhino-memory-ctrl-desc">（核心记忆永远保留，近期记忆逐渐遗忘）</div>
        <div class="zhino-memory-ctrl-row">
          <span class="zhino-memory-ctrl-label">记忆量</span>
          <input type="range" class="zhino-slider" :value="recentVersionsLocal" min="1" max="5" @input="recentVersionsLocal = Number(($event.target as HTMLInputElement).value)" />
          <span class="zhino-memory-ctrl-value">{{ recentVersionsLocal }}</span>
        </div>
        <div class="zhino-memory-ctrl-preview">保留最近 <strong>{{ recentVersionsLocal }}</strong> 次总结的近期记忆</div>
        <div class="zhino-memory-ctrl-preview" style="margin-top:6px">每次生成 <strong>{{ memoryMinLocal }}-{{ memoryMaxLocal }}</strong> 条记忆，其中核心 <strong>1-{{ corePreview }}</strong> 条</div>
        <div class="zhino-btn-group" style="justify-content:space-between;margin-top:10px">
          <button class="zhino-btn-sm" @click="resetMemoryControl">恢复默认</button>
          <div>
            <button class="zhino-btn-sm" @click="showMemoryControl = false">取消</button>
            <button class="zhino-btn-sm zhino-btn-save" @click="saveMemoryControl">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zhino-character {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* 内部滚动容器 */
.zhino-char-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 顶部按钮栏 */
.zhino-char-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

/* 记忆控制按钮 */
.zhino-memory-ctrl-btn {
  padding: 2px 10px;
  font-size: 11px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s;
}
.zhino-memory-ctrl-btn:hover {
  background: rgba(167, 139, 250, 0.12);
  border-color: rgba(167, 139, 250, 0.3);
  color: rgba(167, 139, 250, 0.8);
}

/* 编辑角色按钮 */
.zhino-edit-role-btn {
  margin-left: 0 !important;
}

/* 弹窗遮罩 — 在滚动容器外，position:absolute 相对 .zhino-character */
.zhino-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

/* 弹窗面板 */
.zhino-memory-ctrl-panel {
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 16px 20px;
  width: 360px;
  max-width: calc(100% - 24px);
  max-height: calc(100% - 24px);
  overflow-y: auto;
}
.zhino-memory-ctrl-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 12px;
}
.zhino-memory-ctrl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.zhino-memory-ctrl-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}
.zhino-memory-ctrl-value {
  font-size: 14px;
  font-weight: 600;
  color: rgba(167, 139, 250, 0.9);
  min-width: 20px;
  text-align: center;
}
.zhino-memory-ctrl-preview {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.zhino-memory-ctrl-preview strong {
  color: rgba(167, 139, 250, 0.8);
}

/* 滑块 */
.zhino-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
}
.zhino-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(167, 139, 250, 0.9);
  border: 2px solid #1e1e2e;
  cursor: pointer;
}
.zhino-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(167, 139, 250, 0.9);
  border: 2px solid #1e1e2e;
  cursor: pointer;
}

.zhino-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 12px;
}
.zhino-section-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}
.zhino-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.zhino-char-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.zhino-char-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.zhino-char-delete {
  color: rgba(255, 255, 255, 0.4);
  font-size: 22px;
  font-weight: bold;
  margin-left: 10px;
  transition: all 0.15s;
  line-height: 1;
  flex-shrink: 0;
  padding: 0 4px;
}
.zhino-char-delete:hover {
  color: #f87171;
}
.zhino-btn-delete-mode {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(248, 113, 113, 0.35);
  color: #f87171;
}
.zhino-char-item:hover {
  background: rgba(167, 139, 250, 0.08);
  border-color: rgba(167, 139, 250, 0.2);
}
.zhino-char-item.active {
  background: rgba(167, 139, 250, 0.15);
  border-color: rgba(167, 139, 250, 0.3);
  color: rgba(167, 139, 250, 0.9);
}
.zhino-char-attitude {
  font-size: 10px;
}
.zhino-char-attitude.like { color: #4ade80; }
.zhino-char-attitude.dislike { color: #f87171; }
.zhino-char-attitude.neutral { color: rgba(255, 255, 255, 0.3); }

.zhino-detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 6px;
}
.zhino-detail-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  margin-bottom: 4px;
}
.zhino-detail-value {
  color: rgba(255, 255, 255, 0.8);
}
.attitude-like { color: #4ade80; }
.attitude-dislike { color: #f87171; }
.attitude-neutral { color: rgba(255, 255, 255, 0.5); }

.zhino-detail-block {
  margin-top: 10px;
}

.zhino-memory-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.zhino-memory-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border-left: 2px solid rgba(167, 139, 250, 0.3);
}
.zhino-memory-item.is-core {
  border-left-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.04);
}
.zhino-memory-item.is-recent {
  border-left-color: rgba(250, 204, 21, 0.4);
}
.zhino-memory-badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  line-height: 1.5;
}
.is-core .zhino-memory-badge {
  background: rgba(74, 222, 128, 0.15);
  color: rgba(74, 222, 128, 0.85);
}
.is-recent .zhino-memory-badge {
  background: rgba(250, 204, 21, 0.12);
  color: rgba(250, 204, 21, 0.8);
}
.zhino-memory-text {
  flex: 1;
  line-height: 1.5;
}

.zhino-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.zhino-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(167, 139, 250, 0.12);
  color: rgba(167, 139, 250, 0.8);
  border: 1px solid rgba(167, 139, 250, 0.2);
}

.zhino-profile-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  white-space: pre-wrap;
}

.zhino-empty-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.zhino-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  resize: vertical;
  outline: none;
  font-family: inherit;
}
.zhino-textarea:focus {
  border-color: rgba(167, 139, 250, 0.4);
}

.zhino-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  outline: none;
}
.zhino-input:focus {
  border-color: rgba(167, 139, 250, 0.4);
}

.zhino-btn-sm {
  padding: 3px 10px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s;
}
.zhino-btn-sm:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}
.zhino-btn-save {
  border-color: rgba(167, 139, 250, 0.3);
  color: rgba(167, 139, 250, 0.9);
}
.zhino-btn-save:hover {
  background: rgba(167, 139, 250, 0.15);
}
.zhino-btn-group {
  display: flex;
  gap: 4px;
}

/* 追忆按钮 */
.zhino-btn-archive {
  border-color: rgba(250, 204, 21, 0.3) !important;
  color: rgba(250, 204, 21, 0.8) !important;
}
.zhino-btn-archive:hover {
  background: rgba(250, 204, 21, 0.1) !important;
}

/* 追忆弹窗 */
.zhino-archive-panel {
  background: #080812;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 16px 20px;
  width: 560px;
  max-width: calc(100% - 24px);
  max-height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
}
.zhino-archive-list {
  overflow-y: auto;
  flex: 1;
  margin-top: 8px;
  padding-bottom: 12px;
}
.zhino-archive-version {
  margin-bottom: 16px;
}
.zhino-archive-ver-header {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.zhino-archive-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  margin-bottom: 3px;
  border-left: 2px solid rgba(167, 139, 250, 0.3);
}
.zhino-archive-item.is-core {
  border-left-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.04);
}
.zhino-archive-item .zhino-memory-badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  line-height: 1.5;
}
.zhino-archive-item.is-core .zhino-memory-badge {
  background: rgba(74, 222, 128, 0.15);
  color: rgba(74, 222, 128, 0.85);
}
.zhino-archive-item:not(.is-core) .zhino-memory-badge {
  background: rgba(250, 204, 21, 0.12);
  color: rgba(250, 204, 21, 0.8);
}
.zhino-archive-item .zhino-memory-text {
  flex: 1;
  line-height: 1.5;
}
.zhino-archive-item-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.zhino-archive-item:hover .zhino-archive-item-actions {
  opacity: 1;
}
.zhino-btn-toggle {
  border-color: rgba(167, 139, 250, 0.25) !important;
  color: rgba(167, 139, 250, 0.7) !important;
  font-size: 14px !important;
  line-height: 1;
}
.zhino-btn-toggle:hover {
  background: rgba(167, 139, 250, 0.15) !important;
}
.zhino-btn-edit {
  font-size: 12px !important;
}
.zhino-archive-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(167, 139, 250, 0.4);
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  font-family: inherit;
  resize: vertical;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* NSFW 记忆 */
.zhino-nsfw-field {
  margin-bottom: 8px;
}
.zhino-nsfw-field .zhino-textarea {
  margin-top: 2px;
}
.zhino-nsfw-row {
  margin-bottom: 8px;
}
.zhino-nsfw-row .zhino-detail-label {
  margin-bottom: 2px;
}
.zhino-nsfw-memory-item {
  border-left-color: rgba(248, 113, 113, 0.4) !important;
  background: rgba(248, 113, 113, 0.04) !important;
}
.zhino-nsfw-updated {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 6px;
}
.zhino-tag-nsfw {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.2);
  color: rgba(248, 113, 113, 0.8);
}

/* 行为逻辑树 */
.zhino-behavior-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 0;
}
.zhino-behavior-toggle {
  font-size: 10px;
  color: rgba(167, 139, 250, 0.6);
}
.zhino-behavior-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}
.zhino-behavior-node {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 11px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  border-left: 2px solid rgba(167, 139, 250, 0.25);
  flex-wrap: wrap;
  line-height: 1.5;
}
.zhino-behavior-fallback {
  border-left-color: rgba(250, 204, 21, 0.4);
}
.zhino-behavior-condition {
  color: rgba(74, 222, 128, 0.8);
  font-weight: 500;
  word-break: break-word;
}
.zhino-behavior-fallback .zhino-behavior-condition {
  color: rgba(250, 204, 21, 0.8);
}
.zhino-behavior-arrow {
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}
.zhino-behavior-action {
  color: rgba(255, 255, 255, 0.75);
  word-break: break-word;
}
.zhino-behavior-loc {
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  flex-shrink: 0;
}
.zhino-behavior-priority {
  color: rgba(167, 139, 250, 0.5);
  font-size: 10px;
  flex-shrink: 0;
}
</style>
