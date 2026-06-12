<template>
  <div class="notes-page">
    <!-- ═══ 编辑视图 ═══ -->
    <template v-if="activeNote">
      <header class="notes-nav">
        <button class="nav-link" @click="saveAndBack">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          备忘录
        </button>
        <div class="nav-actions">
          <button class="nav-icon-btn" @click="deleteNote">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button class="nav-icon-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="edit-area">
        <input v-model="activeNote.title" class="edit-title" placeholder="标题" />
        <textarea v-model="activeNote.content" class="edit-content" placeholder="请输入内容" rows="15"></textarea>
        <span class="edit-meta">{{ formatDate(activeNote.updateTime) }}</span>
      </div>
    </template>

    <!-- ═══ 列表视图 ═══ -->
    <template v-else>
      <header class="notes-nav">
        <button class="nav-link" @click="store.goBack()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          文件夹
        </button>
        <h1 class="nav-title">备忘录</h1>
        <div class="nav-actions">
          <button class="nav-icon-btn" :disabled="isGenerating" @click="generateNotes">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2">
              <path d="M23 4 23 10 17 10"/><path d="M1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchQuery" placeholder="搜索备忘录" />
      </div>

      <div class="notes-count">{{ filteredNotes.length }} 个备忘录</div>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateNotes" />

      <SkeletonLoader v-else-if="isGenerating && notes.length === 0" type="card" :rows="3" text="AI 正在生成备忘录..." />

      <!-- iOS 分组列表 -->
      <div class="notes-list">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-cell"
          @click="editNote(note)"
        >
          <div class="note-cell-content">
            <span class="note-cell-title">{{ note.title || '无标题' }}</span>
            <div class="note-cell-sub">
              <span class="note-cell-time">{{ formatDate(note.updateTime) }}</span>
              <span class="note-cell-preview">{{ note.content.slice(0, 40) || '无附加文本' }}</span>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      <!-- iOS 风格新建按钮 -->
      <div class="bottom-toolbar">
        <span class="note-count-label">{{ notes.length }} 个备忘录</span>
        <button class="compose-btn" @click="createNote">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, extractXmlBlocks, parseXmlBlock } from '../../utils/generation-pipeline';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { getLocalDB } from '../../utils/local-db';

const store = usePhoneStore();
const isGenerating = ref(false);
const lastError = ref('');
const searchQuery = ref('');

interface Note {
  id: string;
  title: string;
  content: string;
  createTime: number;
  updateTime: number;
}

const notes = ref<Note[]>([
  {
    id: 'n1', title: '待办事项',
    content: '□ 买菜\n□ 交水电费\n□ 给小美回消息\n☑ 取快递',
    createTime: Date.now() - 86400000, updateTime: Date.now() - 3600000,
  },
  {
    id: 'n2', title: '读书笔记',
    content: '《人类简史》第三章要点：\n- 认知革命使智人能够讨论虚构的事物\n- 八卦理论：语言让我们能够传递社会信息',
    createTime: Date.now() - 172800000, updateTime: Date.now() - 86400000,
  },
  {
    id: 'n3', title: '密码备忘',
    content: 'WiFi: home_2024\n邮箱: ****@mail.com\n银行卡尾号: 1234',
    createTime: Date.now() - 604800000, updateTime: Date.now() - 604800000,
  },
]);

const activeNote = ref<Note | null>(null);
const filteredNotes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return notes.value;
  return notes.value.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
});

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function createNote() {
  const note: Note = {
    id: `new_${Date.now()}`,
    title: '',
    content: '',
    createTime: Date.now(),
    updateTime: Date.now(),
  };
  notes.value.unshift(note);
  activeNote.value = note;
}

function editNote(note: Note) {
  activeNote.value = note;
}

function saveAndBack() {
  if (activeNote.value) {
    activeNote.value.updateTime = Date.now();
    if (!activeNote.value.title.trim() && !activeNote.value.content.trim()) {
      notes.value = notes.value.filter(n => n.id !== activeNote.value!.id);
    }
    store.reportAction({
      appId: 'notes', appName: '备忘录', action: '编辑备忘录',
      summary: `用户编辑了备忘录「${activeNote.value.title || '无标题'}」`,
      data: { title: activeNote.value.title, preview: activeNote.value.content.slice(0, 50) },
    });
  }
  activeNote.value = null;
}

function deleteNote() {
  if (!activeNote.value) return;
  notes.value = notes.value.filter(n => n.id !== activeNote.value!.id);
  toastr.success('已删除备忘录');
  activeNote.value = null;
}

async function generateNotes() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const result = await generateForApp(
      'notes',
      '生成 2-3 条角色可能写的备忘录，每条有不同的写作风格和用途。',
      '备忘录可以是待办、日记、灵感、购物清单等。角色的备忘录应该体现其性格。',
    );

    if (!result.success || !result.parsed) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    lastError.value = '';

    const text = result.parsed;
    // XML 解析：提取 <note> 块
    const rawNotes = extractXmlBlocks(text, 'note').map(parseXmlBlock);

    for (const [i, n] of rawNotes.entries()) {
      const title = String(n.title ?? '').trim();
      const content = String(n.content ?? '').trim();
      if (!title && !content) continue;

      notes.value.unshift({
        id: `ai_${Date.now()}_${i}`,
        title: title || '无标题',
        content,
        createTime: Date.now(),
        updateTime: Date.now(),
      });
    }

    toastr.success('已生成备忘录', '备忘录');
  } finally {
    isGenerating.value = false;
  }
}

async function loadCapturedNotes() {
  try {
    const db = await getLocalDB();
    const events = await db.getEventsByApp('notes');
    for (const event of events.filter(e => e.type === 'captured_content').slice(-10)) {
      const captured = event.data?.captured;
      const generated = event.data?.generated;
      const content = typeof generated === 'string' ? generated : (generated?.content || captured?.content || event.summary);
      const title = typeof generated === 'object' && generated?.title ? String(generated.title) : String(content).slice(0, 18);
      if (!notes.value.some(n => n.content === String(content))) {
        notes.value.unshift({
          id: `cap_${event.id}`,
          title: title || 'AI 备忘录',
          content: String(content),
          createTime: event.timestamp,
          updateTime: event.timestamp,
        });
      }
    }
  } catch {
    // IndexedDB 不可用时忽略正文联动。
  }
}

onMounted(loadCapturedNotes);
</script>

<style scoped>
.notes-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary);
}

/* ─── iOS 导航栏 ─── */
.notes-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0; min-height: 44px;
}

.nav-link {
  display: flex; align-items: center; gap: 2px;
  border: none; background: transparent;
  color: var(--accent, #007aff); font-size: 15px;
  cursor: pointer; padding: 0;
}

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
  position: absolute; left: 50%; transform: translateX(-50%);
}

.nav-actions { display: flex; gap: 12px; }

.nav-icon-btn {
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px;
}
.nav-icon-btn:disabled { opacity: 0.4; }

/* ─── 搜索栏 ─── */
.search-bar {
  display: flex; align-items: center; gap: 8px;
  margin: 8px 16px; padding: 8px 12px; border-radius: 10px;
  background: var(--bg-tertiary, rgba(118,118,128,0.12));
  color: var(--text-tertiary); font-size: 15px;
}
.search-bar input {
  flex: 1; border: none; background: transparent; outline: none;
  color: var(--text-primary); font-size: 15px;
}

.notes-count {
  padding: 8px 16px 4px; font-size: 13px; color: var(--text-tertiary);
}

/* ─── 备忘录列表（iOS Cell 样式） ─── */
.notes-list {
  flex: 1; overflow-y: auto; padding: 0 16px;
}

.note-cell {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 0;
  border-bottom: 0.5px solid var(--border-secondary);
  cursor: pointer;
}

.note-cell-content { flex: 1; min-width: 0; }

.note-cell-title {
  font-size: 16px; font-weight: 500; color: var(--text-primary);
  display: block; margin-bottom: 3px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.note-cell-sub {
  display: flex; gap: 8px; align-items: center;
}

.note-cell-time {
  font-size: 13px; color: var(--text-tertiary);
  flex-shrink: 0;
}

.note-cell-preview {
  font-size: 13px; color: var(--text-tertiary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ─── 编辑区域（iOS 备忘录纸张感） ─── */
.edit-area {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  background: var(--bg-primary);
}

.edit-title {
  width: 100%; border: none; background: transparent;
  color: var(--text-primary); font-size: 22px; font-weight: 700;
  outline: none; margin-bottom: 12px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
.edit-title::placeholder { color: var(--text-tertiary); font-weight: 700; }

.edit-content {
  width: 100%; border: none; background: transparent;
  color: var(--text-primary); font-size: 16px; line-height: 1.65;
  resize: none; outline: none; min-height: 300px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
.edit-content::placeholder { color: var(--text-tertiary); }

.edit-meta {
  font-size: 12px; color: var(--text-tertiary);
  display: block; margin-top: 16px; text-align: center;
}

/* ─── 底部工具栏 ─── */
.bottom-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: var(--bg-primary);
  border-top: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.note-count-label {
  font-size: 12px; color: var(--text-tertiary);
  flex: 1; text-align: center;
}

.compose-btn {
  width: 36px; height: 36px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
</style>
