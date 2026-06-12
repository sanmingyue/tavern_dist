<template>
  <div class="sms-page">
    <!-- ═══ 短信详情 ═══ -->
    <template v-if="activeThread">
      <header class="sms-header">
        <button class="back-btn" @click="activeThread = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="thread-info">
          <span class="thread-name">{{ activeThread.name }}</span>
          <span class="thread-number">{{ activeThread.number }}</span>
        </div>
        <div style="width: 32px"></div>
      </header>

      <div class="thread-messages" ref="threadContainer">
        <div v-for="msg in activeThread.messages" :key="msg.id" class="sms-msg" :class="{ mine: msg.from === 'me' }">
          <div class="sms-bubble">{{ msg.content }}</div>
          <span class="sms-time">{{ formatMsgTime(msg.timestamp) }}</span>
        </div>

        <div v-if="isGenerating" class="sms-msg">
          <TypingIndicator variant="bubble" :show-text="false" />
        </div>
      </div>

      <div class="reply-area">
        <input
          v-model="replyText"
          class="reply-input"
          :placeholder="`回复 ${activeThread.name}...`"
          @keyup.enter="sendReply"
        />
        <button class="reply-send" :disabled="!replyText.trim()" @click="sendReply">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- ═══ 短信列表 ═══ -->
    <template v-else>
      <header class="sms-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="page-title">短信</span>
        <button class="gen-btn" :disabled="isGenerating" @click="generateSMS">
          {{ isGenerating ? '...' : 'AI' }}
        </button>
        <button class="gen-btn code-btn" @click="simulateCodeSms">验证码</button>
      </header>

      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" v-model="searchQuery" placeholder="搜索短信" class="search-input" />
      </div>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateSMS" />

      <SkeletonLoader v-else-if="isGenerating && threads.length === 0" type="list" :rows="4" text="AI 正在生成短信..." />

      <div class="conversation-list" v-if="filteredThreads.length > 0">
        <div v-for="thread in filteredThreads" :key="thread.id" class="conversation-item" @click="openThread(thread)">
          <AvatarBadge :name="thread.name" size="md" :badge="thread.unread" />
          <div class="conv-content">
            <div class="conv-header">
              <span class="conv-name">{{ thread.name }}</span>
              <span class="conv-time">{{ thread.time }}</span>
            </div>
            <div class="conv-preview">
              <span class="preview-text">{{ thread.preview }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!isGenerating" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <p>暂无短信</p>
      </div>

      <button class="fab" @click="generateSMS">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult, extractXmlBlocks, parseXmlBlock, extractXmlTag } from '../../utils/generation-pipeline';
import AvatarBadge from '../../components/AvatarBadge.vue';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import TypingIndicator from '../../components/TypingIndicator.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { getLocalDB } from '../../utils/local-db';

const store = usePhoneStore();

const searchQuery = ref('');
const isGenerating = ref(false);
const lastError = ref('');
const replyText = ref('');
const threadContainer = ref<HTMLElement | null>(null);

interface SMSMessage {
  id: string;
  content: string;
  from: string;
  timestamp: number;
}

interface SMSThread {
  id: string;
  name: string;
  number: string;
  messages: SMSMessage[];
  time: string;
  preview: string;
  unread: number;
  type: 'notification' | 'personal' | 'marketing';
}

const threads = ref<SMSThread[]>([]);

const activeThread = ref<SMSThread | null>(null);

const filteredThreads = computed(() => {
  if (!searchQuery.value) return threads.value;
  const q = searchQuery.value.toLowerCase();
  return threads.value.filter(t => t.name.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q));
});

function formatMsgTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function openThread(thread: SMSThread) {
  activeThread.value = thread;
  thread.unread = 0;
  nextTick(() => {
    if (threadContainer.value) threadContainer.value.scrollTop = threadContainer.value.scrollHeight;
  });
  store.reportAction({
    appId: 'sms', appName: '短信', action: '查看短信',
    summary: `用户查看了来自「${thread.name}」的短信`,
    data: { sender: thread.name, lastMessage: thread.preview },
  });
}

function upsertThread(sender: string, content: string, type: SMSThread['type'] = 'notification', number?: string) {
  const existing = threads.value.find(t => t.name === sender);
  if (existing) {
    existing.messages.push({ id: `sms_${Date.now()}`, content, from: sender, timestamp: Date.now() });
    existing.preview = content;
    existing.time = '刚刚';
    existing.unread++;
    return existing;
  }
  const thread: SMSThread = {
    id: `th_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: sender,
    number: number || `1${_.random(30, 99)}****${_.random(1000, 9999)}`,
    time: '刚刚',
    preview: content,
    unread: 1,
    type,
    messages: [{ id: `sms_${Date.now()}`, content, from: sender, timestamp: Date.now() }],
  };
  threads.value.unshift(thread);
  return thread;
}

function simulateCodeSms() {
  const code = String(_.random(100000, 999999));
  const sender = ['银行服务', '外卖平台', '安全中心'][_.random(0, 2)];
  const content = `验证码 ${code}，5 分钟内有效。若非本人操作请忽略。`;
  upsertThread(sender, content, 'notification', '1069');
  store.reportAction({
    appId: 'sms', appName: '短信', action: '模拟验证码短信',
    summary: `短信 APP 收到来自「${sender}」的验证码 ${code}`,
    data: { sender, code },
  });
  toastr.success('收到验证码短信', '短信');
}

async function loadCapturedSMS() {
  try {
    const db = await getLocalDB();
    const events = await db.getEventsByApp('sms');
    const recent = events.filter(e => e.type === 'captured_content').slice(-10);
    for (const event of recent) {
      const captured = event.data?.captured;
      const generated = event.data?.generated;
      const sender = captured?.attribute || event.actor || '短信';
      const content = typeof generated === 'string' ? generated : (generated?.content || captured?.content || event.summary);
      if (!threads.value.some(t => t.messages.some(m => m.content === content))) {
        upsertThread(sender, String(content), 'personal');
      }
    }
  } catch {
    // IndexedDB 不可用时保持本地短信列表。
  }
}

async function sendReply() {
  const text = replyText.value.trim();
  if (!text || !activeThread.value) return;

  activeThread.value.messages.push({
    id: `rm_${Date.now()}`,
    content: text,
    from: 'me',
    timestamp: Date.now(),
  });
  activeThread.value.preview = text;
  activeThread.value.time = '刚刚';
  replyText.value = '';
  nextTick(() => {
    if (threadContainer.value) threadContainer.value.scrollTop = threadContainer.value.scrollHeight;
  });

  store.reportAction({
    appId: 'sms', appName: '短信', action: '回复短信',
    summary: `用户回复了「${activeThread.value.name}」的短信：${text}`,
    data: { to: activeThread.value.name, content: text },
  });

  // AI 生成回复（角色类短信）
  if (activeThread.value.type === 'personal' || activeThread.value.name !== '10086') {
    await generateReply();
  }
}

async function generateReply() {
  if (!activeThread.value || isGenerating.value) return;
  isGenerating.value = true;

  try {
    const history = activeThread.value.messages.slice(-6).map(m => `${m.from === 'me' ? '用户' : activeThread.value!.name}: ${m.content}`).join('\n');
    const result = await generateForApp(
      'sms',
      `为「${activeThread.value.name}」生成一条回复短信。请用 <message> 标签输出。`,
      `短信对话历史:\n${history}`,
    );

    if (!result.success || !result.parsed) return;
    const text = result.parsed;
    // XML 解析：提取 <message> 块
    const msgs = extractXmlBlocks(text, 'message').map(parseXmlBlock);
    // 如果没有 message 标签，直接用纯文本
    if (msgs.length > 0) {
      const content = String(msgs[0].content ?? '').trim();
      if (content) {
        activeThread.value.messages.push({
          id: `ai_${Date.now()}`,
          content,
          from: activeThread.value.name,
          timestamp: Date.now(),
        });
        activeThread.value.preview = content;
      }
    } else {
      // 降级：直接取纯文本第一行
      const firstLine = text.split('\n')[0].trim();
      if (firstLine) {
        activeThread.value.messages.push({
          id: `ai_${Date.now()}`,
          content: firstLine,
          from: activeThread.value.name,
          timestamp: Date.now(),
        });
        activeThread.value.preview = firstLine;
      }
    }
    nextTick(() => {
      if (threadContainer.value) threadContainer.value.scrollTop = threadContainer.value.scrollHeight;
    });
  } finally {
    isGenerating.value = false;
  }
}

async function generateSMS() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const result = await generateForApp(
      'sms',
      '生成 2-3 条新短信通知，包括系统通知和可能的角色私信。',
      '可以包括快递、银行、外卖、角色发来的短信等。',
    );

    if (!result.success || !result.parsed) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    lastError.value = '';

    const text = result.parsed;
    // XML 解析：提取 <message> 块
    const msgs = extractXmlBlocks(text, 'message').map(parseXmlBlock);
    for (const [i, msg] of msgs.entries()) {
      const sender = String(msg.sender ?? `通知${i + 1}`);
      const content = String(msg.content ?? '').trim();
      if (!content) continue;

      upsertThread(sender, content, (msg.type as any) ?? 'notification');
    }
    toastr.success('收到新短信', '短信');
  } finally {
    isGenerating.value = false;
  }
}

onMounted(loadCapturedSMS);
</script>

<style scoped>
.sms-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary); position: relative;
}

.sms-header {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: transparent; color: var(--accent);
  cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.page-title { flex: 1; font-size: 17px; font-weight: 600; color: var(--text-primary); text-align: center; }
.gen-btn {
  border: none; border-radius: 14px; padding: 5px 12px;
  background: var(--accent); color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.gen-btn:disabled { opacity: 0.5; }
.code-btn { background: #34c759; padding: 5px 8px; }

.thread-info { flex: 1; text-align: center; }
.thread-name { font-size: 15px; font-weight: 600; color: var(--text-primary); display: block; }
.thread-number { font-size: 11px; color: var(--text-muted); }

.search-bar {
  display: flex; align-items: center; gap: 8px;
  margin: 8px 16px; padding: 8px 12px;
  background: var(--bg-input); border-radius: 10px; color: var(--text-tertiary);
}
.search-input {
  flex: 1; border: none; background: transparent;
  color: var(--text-primary); font-size: 14px; outline: none;
}

.conversation-list { flex: 1; overflow-y: auto; }
.conversation-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary); cursor: pointer;
  transition: background 0.15s;
}
.conversation-item:hover { background: var(--bg-hover); }
.conv-content { flex: 1; min-width: 0; }
.conv-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
.conv-name { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.conv-time { font-size: 12px; color: var(--text-tertiary); }
.preview-text {
  font-size: 13px; color: var(--text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ─── Thread Detail ─── */
.thread-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.sms-msg { display: flex; flex-direction: column; max-width: 82%; }
.sms-msg.mine { align-self: flex-end; align-items: flex-end; }
.sms-msg:not(.mine) { align-self: flex-start; align-items: flex-start; }
.sms-bubble {
  padding: 9px 14px; border-radius: 18px;
  font-size: 15px; line-height: 1.4; word-break: break-word;
}
.sms-msg.mine .sms-bubble {
  background: #34c759; color: white; border-bottom-right-radius: 4px;
}
.sms-msg:not(.mine) .sms-bubble {
  background: var(--bg-grouped, var(--bg-tertiary)); color: var(--text-primary); border-bottom-left-radius: 4px;
}
.sms-time { font-size: 10px; color: var(--text-muted); margin-top: 3px; }

.reply-area {
  display: flex; gap: 8px; padding: 6px 12px 8px;
  background: var(--bg-primary); border-top: 0.5px solid var(--border-secondary); flex-shrink: 0;
}
.reply-input {
  flex: 1; padding: 8px 14px; border: 0.5px solid var(--border-primary); border-radius: 20px;
  background: var(--bg-input); color: var(--text-primary); font-size: 15px; outline: none;
}
.reply-send {
  width: 34px; height: 34px; border: none; border-radius: 50%;
  background: #34c759; color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.reply-send:disabled { opacity: 0.4; cursor: not-allowed; }

.empty-state {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: var(--text-muted); gap: 10px;
}
.empty-state p { margin: 0; }

.fab {
  position: absolute; bottom: 20px; right: 20px;
  width: 48px; height: 48px; border: none; border-radius: 50%;
  background: var(--accent); color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}
</style>
