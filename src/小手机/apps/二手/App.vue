<template>
  <div class="secondhand-page">
    <!-- ═══ 私聊砍价 ═══ -->
    <template v-if="chatSeller">
      <header class="sh-header">
        <button class="back-btn" @click="chatSeller = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">{{ chatSeller.seller }}</span>
        <div style="width:32px"></div>
      </header>

      <!-- 商品小卡片 -->
      <div class="chat-product-bar">
        <div class="cpb-thumb" :style="{ backgroundColor: chatSeller.color }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </div>
        <div class="cpb-info">
          <span class="cpb-title">{{ chatSeller.title }}</span>
          <span class="cpb-price">¥{{ chatSeller.price }}</span>
        </div>
        <button class="bargain-btn" @click="sendBargain">砍一刀</button>
      </div>

      <div class="chat-messages" ref="chatContainer">
        <div v-for="msg in chatMessages" :key="msg.id" class="chat-msg" :class="{ mine: msg.from === 'me' }">
          <AvatarBadge v-if="msg.from !== 'me'" :name="chatSeller.seller" size="sm" />
          <div class="chat-bubble">{{ msg.content }}</div>
        </div>
        <div v-if="isGenerating" class="chat-msg">
          <AvatarBadge :name="chatSeller.seller" size="sm" />
          <TypingIndicator variant="bubble" :show-text="false" />
        </div>
      </div>

      <div class="chat-input-area">
        <input v-model="chatInput" class="chat-input" placeholder="和卖家聊聊..." @keyup.enter="sendChatMessage" />
        <button class="chat-send" :disabled="!chatInput.trim()" @click="sendChatMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- ═══ 商品详情 ═══ -->
    <template v-else-if="activeItem">
      <header class="sh-header">
        <button class="back-btn" @click="activeItem = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">详情</span>
        <div style="width:32px"></div>
      </header>

      <div class="detail-scroll">
        <div class="item-cover" :style="{ backgroundColor: activeItem.color }">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <div class="item-info-card">
          <div class="item-price-row">
            <span class="item-price">¥{{ activeItem.price }}</span>
            <span class="item-original">原价 ¥{{ activeItem.originalPrice }}</span>
          </div>
          <h3>{{ activeItem.title }}</h3>
          <p class="item-desc">{{ activeItem.description }}</p>
          <div class="seller-row">
            <AvatarBadge :name="activeItem.seller" size="sm" />
            <div class="seller-info">
              <span class="seller-name">{{ activeItem.seller }}</span>
              <span class="seller-loc">{{ activeItem.location }}</span>
            </div>
          </div>
          <div class="item-stats">
            <span>{{ activeItem.views }}人想要</span>
            <span>{{ activeItem.category }}</span>
          </div>
          <div class="trade-panel">
            <div class="trade-row">
              <input v-model.number="offerPrice" type="number" min="1" placeholder="输入出价" />
              <button @click="submitOffer">出价</button>
              <button @click="changeItemPrice">改价</button>
            </div>
            <button class="complete-btn" :disabled="activeItem.sold" @click="completeTrade">
              {{ activeItem.sold ? '交易已完成' : '确认交易完成' }}
            </button>
            <div v-if="activeItem.sold" class="review-row">
              <input v-model="tradeReview" placeholder="写一句交易评价" @keyup.enter="submitTradeReview" />
              <button @click="submitTradeReview">评价</button>
            </div>
            <p v-if="activeItem.buyerReview" class="trade-review">{{ activeItem.buyerReview }}</p>
          </div>
        </div>
      </div>

      <div class="detail-bottom">
        <button class="want-btn" @click="wantItem">我想要</button>
        <button class="chat-seller-btn" @click="openSellerChat">聊一聊</button>
        <button class="buy-btn" @click="buySecondhandItem">立即购买</button>
      </div>
    </template>

    <!-- ═══ 商品列表 ═══ -->
    <template v-else>
      <header class="sh-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" placeholder="搜索闲置好物" class="search-input" @keyup.enter="generateItems" />
        </div>
        <button class="gen-btn ghost" :class="{ active: itemDeleteMode }" @click="toggleItemDeleteMode">
          {{ itemDeleteMode ? '取消' : '选择' }}
        </button>
        <button v-if="itemDeleteMode" class="gen-btn danger" :disabled="selectedItemKeys.length === 0" @click="deleteSelectedItems">
          删除
        </button>
        <button v-else class="gen-btn" :disabled="isGenerating" @click="generateItems">AI</button>
      </header>

      <div class="category-tabs">
        <button v-for="cat in categories" :key="cat" :class="{ active: activeCat === cat }" @click="activeCat = cat">{{ cat }}</button>
      </div>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateItems" />

      <div v-if="itemDeleteMode" class="selection-toolbar">
        <span>已选 {{ selectedItemKeys.length }} 条</span>
        <button :disabled="selectedItemKeys.length === 0" @click="deleteSelectedItems">删除</button>
      </div>

      <SkeletonLoader v-if="!lastError && isGenerating && items.length === 0" type="card" :rows="3" text="AI 正在生成商品..." />

      <div class="items-grid">
        <div v-for="item in items" :key="itemKey(item)" class="item-card" :class="{ selecting: itemDeleteMode, selected: isItemSelected(item) }" @click="itemDeleteMode ? toggleItemSelection(item) : viewItem(item)">
          <button v-if="itemDeleteMode" class="select-check" :class="{ checked: isItemSelected(item) }" @click.stop="toggleItemSelection(item)">
            <svg v-if="isItemSelected(item)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <div class="item-thumb" :style="{ backgroundColor: item.color }">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </div>
          <div class="item-meta">
            <span class="item-name">{{ item.title }}</span>
            <div class="item-bottom">
              <span class="item-card-price">¥{{ item.price }}</span>
              <span class="item-wants">{{ item.views }}想要</span>
            </div>
          </div>
        </div>
      </div>

      <button class="fab" @click="publishItem">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult } from '../../utils/generation-pipeline';
import AvatarBadge from '../../components/AvatarBadge.vue';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import TypingIndicator from '../../components/TypingIndicator.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';

const store = usePhoneStore();
const isGenerating = ref(false);
const hasAutoGenerated = ref(false);
const lastError = ref('');
const searchQuery = ref('');
const activeCat = ref('推荐');
const chatInput = ref('');
const chatContainer = ref<HTMLElement | null>(null);
const itemDeleteMode = ref(false);
const selectedItemKeys = ref<string[]>([]);
const categories = ['推荐', '数码', '服饰', '家具', '图书', '其他'];

interface SecondhandItem {
  title: string;
  price: number;
  originalPrice: number;
  seller: string;
  description: string;
  location: string;
  category: string;
  views: number;
  color: string;
  bestOffer?: number;
  sold?: boolean;
  buyerReview?: string;
}

interface ChatMsg { id: string; from: string; content: string; }

interface SecondhandPersistedState {
  items?: SecondhandItem[];
  chatThreads?: Record<string, ChatMsg[]>;
}

const SECONDHAND_STATE_KEY = 'mini-phone-secondhand-state';

function readSecondhandState(): SecondhandPersistedState {
  try {
    const raw = localStorage.getItem(SECONDHAND_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    const state = parsed as SecondhandPersistedState;
    const chatThreads: Record<string, ChatMsg[]> = {};
    if (state.chatThreads && typeof state.chatThreads === 'object' && !Array.isArray(state.chatThreads)) {
      for (const [key, value] of Object.entries(state.chatThreads)) {
        if (!Array.isArray(value)) continue;
        chatThreads[key] = value.filter((msg): msg is ChatMsg =>
          typeof msg === 'object' &&
          msg !== null &&
          typeof (msg as Partial<ChatMsg>).id === 'string' &&
          typeof (msg as Partial<ChatMsg>).from === 'string' &&
          typeof (msg as Partial<ChatMsg>).content === 'string',
        );
      }
    }
    return {
      items: Array.isArray(state.items) ? state.items : undefined,
      chatThreads: Object.keys(chatThreads).length > 0 ? chatThreads : undefined,
    };
  } catch {
    return {};
  }
}

function writeSecondhandState() {
  try {
    localStorage.setItem(SECONDHAND_STATE_KEY, JSON.stringify({
      items: items.value,
      chatThreads: chatThreads.value,
    }));
  } catch {
    // localStorage 不可用时仅保持当前会话状态。
  }
}

function itemKey(item: SecondhandItem): string {
  return `${item.seller}::${item.title}`;
}

function isItemSelected(item: SecondhandItem): boolean {
  return selectedItemKeys.value.includes(itemKey(item));
}

function toggleItemSelection(item: SecondhandItem): void {
  const key = itemKey(item);
  selectedItemKeys.value = selectedItemKeys.value.includes(key)
    ? selectedItemKeys.value.filter(itemKey => itemKey !== key)
    : [...selectedItemKeys.value, key];
}

function toggleItemDeleteMode(): void {
  itemDeleteMode.value = !itemDeleteMode.value;
  selectedItemKeys.value = [];
}

function deleteSelectedItems(): void {
  if (selectedItemKeys.value.length === 0) return;
  const keys = new Set(selectedItemKeys.value);
  const count = keys.size;
  items.value = items.value.filter(item => !keys.has(itemKey(item)));
  for (const key of keys) {
    delete chatThreads.value[key];
  }
  if (activeItem.value && keys.has(itemKey(activeItem.value))) {
    activeItem.value = null;
  }
  if (chatSeller.value && keys.has(itemKey(chatSeller.value))) {
    chatSeller.value = null;
    chatMessages.value = [];
  }
  selectedItemKeys.value = [];
  itemDeleteMode.value = false;
  writeSecondhandState();
  toastr.success(`已删除 ${count} 条内容`, '二手');
}

const itemColors = ['#e74c3c', '#3498db', '#9b59b6', '#f39c12', '#1abc9c', '#e91e63', '#795548'];

const items = ref<SecondhandItem[]>([
  { title: '95新 AirPods Pro', price: 800, originalPrice: 1999, seller: '小明', description: '用了三个月，功能完好，配件齐全', location: '北京', category: '数码', views: 45, color: '#3498db' },
  { title: '毕业季清书 全套考研资料', price: 50, originalPrice: 300, seller: '学姐', description: '考上了不需要了，笔记很全', location: '上海', category: '图书', views: 128, color: '#9b59b6' },
  { title: 'MUJI风小书桌', price: 120, originalPrice: 399, seller: '搬家达人', description: '搬家出，八成新，只限自提', location: '广州', category: '家具', views: 32, color: '#f39c12' },
  { title: 'Lolita裙 甜系日常', price: 180, originalPrice: 450, seller: '仙女姐姐', description: '只试穿过一次，不是我的风格', location: '成都', category: '服饰', views: 67, color: '#e91e63' },
]);

const activeItem = ref<SecondhandItem | null>(null);
const chatSeller = ref<SecondhandItem | null>(null);
const offerPrice = ref<number | null>(null);
const tradeReview = ref('');

const chatMessages = ref<ChatMsg[]>([]);
const chatThreads = ref<Record<string, ChatMsg[]>>({});

const persistedSecondhandState = readSecondhandState();
if (persistedSecondhandState.items?.length) {
  items.value = persistedSecondhandState.items;
  hasAutoGenerated.value = true;
}
if (persistedSecondhandState.chatThreads) {
  chatThreads.value = persistedSecondhandState.chatThreads;
}

watch([items, chatThreads], writeSecondhandState, { deep: true });
function persistActiveChatThread() {
  if (!chatSeller.value) return;
  chatThreads.value[itemKey(chatSeller.value)] = [...chatMessages.value];
  writeSecondhandState();
}
watch(chatMessages, persistActiveChatThread, { deep: true });

function viewItem(item: SecondhandItem) {
  activeItem.value = item;
  offerPrice.value = Math.floor(item.price * 0.9);
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '查看商品',
    summary: `用户在二手 APP 查看了「${item.title}」，卖家：${item.seller}，¥${item.price}`,
    data: { title: item.title, seller: item.seller, price: item.price },
  });
}

function wantItem() {
  if (!activeItem.value) return;
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '想要商品',
    summary: `用户对二手商品「${activeItem.value.title}」（¥${activeItem.value.price}）表示想要`,
    data: { title: activeItem.value.title, price: activeItem.value.price },
  });
  toastr.success('已标记想要', '二手');
}

function buySecondhandItem() {
  if (!activeItem.value) return;
  activeItem.value.sold = true;
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '下单购买',
    summary: `用户在二手 APP 下单购买了「${activeItem.value.title}」，¥${activeItem.value.price}，卖家：${activeItem.value.seller}`,
    data: { title: activeItem.value.title, price: activeItem.value.price, seller: activeItem.value.seller },
  });
  toastr.success(`已下单「${activeItem.value.title}」，¥${activeItem.value.price}`, '二手');
}

function submitOffer() {
  if (!activeItem.value || !offerPrice.value) return;
  activeItem.value.bestOffer = offerPrice.value;
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '出价',
    summary: `用户对二手商品「${activeItem.value.title}」出价 ¥${offerPrice.value}`,
    data: { title: activeItem.value.title, offer: offerPrice.value },
  });
  toastr.success('出价已发送', '二手');
}

function changeItemPrice() {
  if (!activeItem.value || !offerPrice.value) return;
  const oldPrice = activeItem.value.price;
  activeItem.value.price = offerPrice.value;
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '改价',
    summary: `用户将「${activeItem.value.title}」价格从 ¥${oldPrice} 改为 ¥${offerPrice.value}`,
    data: { title: activeItem.value.title, oldPrice, newPrice: offerPrice.value },
  });
  toastr.success('价格已更新', '二手');
}

function completeTrade() {
  if (!activeItem.value) return;
  activeItem.value.sold = true;
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '交易完成',
    summary: `用户确认二手商品「${activeItem.value.title}」交易完成，成交价 ¥${activeItem.value.price}`,
    data: { title: activeItem.value.title, price: activeItem.value.price },
  });
  toastr.success('交易完成', '二手');
}

function submitTradeReview() {
  if (!activeItem.value) return;
  const content = tradeReview.value.trim() || '交易顺利，沟通很爽快。';
  activeItem.value.buyerReview = content;
  tradeReview.value = '';
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '交易评价',
    summary: `用户评价二手交易「${activeItem.value.title}」：${content}`,
    data: { title: activeItem.value.title, review: content },
  });
  toastr.success('评价已发布', '二手');
}

function openSellerChat() {
  if (!activeItem.value) return;
  chatSeller.value = activeItem.value;
  activeItem.value = null;
  const savedMessages = chatThreads.value[itemKey(chatSeller.value)];
  chatMessages.value = savedMessages?.length
    ? [...savedMessages]
    : [
        { id: 'sys', from: 'system', content: `关于「${chatSeller.value.title}」的对话` },
        { id: 'hello', from: chatSeller.value.seller, content: '你好，这个还在的，有什么想问的吗？' },
      ];
}

function sendBargain() {
  if (!chatSeller.value) return;
  const bargainPrice = Math.floor(chatSeller.value.price * 0.8);
  chatMessages.value.push({
    id: `b_${Date.now()}`,
    from: 'me',
    content: `亲，这个能${bargainPrice}出吗？诚心想要`,
  });
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '砍价',
    summary: `用户对「${chatSeller.value.title}」砍价到¥${bargainPrice}`,
    data: { title: chatSeller.value.title, originalPrice: chatSeller.value.price, bargainPrice },
  });
  generateSellerReply();
}

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !chatSeller.value) return;
  chatMessages.value.push({ id: `m_${Date.now()}`, from: 'me', content: text });
  persistActiveChatThread();
  chatInput.value = '';
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '私聊卖家',
    summary: `用户在二手 APP 私聊「${chatSeller.value.seller}」：${text}`,
    data: { seller: chatSeller.value.seller, message: text },
  });
  nextTick(() => { if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight; });
  generateSellerReply();
}

async function generateSellerReply() {
  if (!chatSeller.value || isGenerating.value) return;
  isGenerating.value = true;
  try {
    const history = chatMessages.value.filter(m => m.from !== 'system').slice(-6)
      .map(m => `${m.from === 'me' ? '买家' : '卖家'}：${m.content}`).join('\n');
    const result = await generateForApp(
      'secondhand',
      `作为卖家「${chatSeller.value.seller}」回复买家。商品：${chatSeller.value.title}，标价¥${chatSeller.value.price}`,
      `对话历史:\n${history}\n\n卖家性格由角色设定决定，回复要简短自然，像真人聊天。`,
    );
    if (!result.success) return;
    const content = result.parsed.trim();
    if (content) {
      // 取第一行作为回复
      const firstLine = content.split('\n')[0].trim();
      chatMessages.value.push({ id: `sr_${Date.now()}`, from: chatSeller.value.seller, content: firstLine });
      persistActiveChatThread();
    }
    nextTick(() => { if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight; });
  } finally { isGenerating.value = false; }
}

function publishItem() {
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '发布闲置',
    summary: '用户准备在二手 APP 发布闲置物品',
    data: {},
  });
  toastr.info('发布闲置功能开发中', '二手');
}

function toNum(v: unknown, fb: number): number {
  const n = Number(v); return Number.isFinite(n) ? n : fb;
}

async function generateItems() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  const keyword = searchQuery.value.trim() || '推荐二手商品';
  store.reportAction({
    appId: 'secondhand', appName: '二手', action: '搜索商品',
    summary: `在二手 APP 搜索「${keyword}」`,
    data: { keyword },
  });
  try {
    const result = await generateForApp('secondhand', `搜索「${keyword}」，生成 4 个二手商品`);
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    const text = result.parsed;
    // XML 解析：提取 <item> 块
    const rawItems = parseXmlResult(text, 'item');
    if (rawItems.length === 0) {
      lastError.value = '生成结果格式不匹配';
      console.warn('[小手机] 二手解析失败:', text.slice(0, 200));
      return;
    }
    lastError.value = '';
    items.value = rawItems.slice(0, 6).map((item, i) => ({
      title: String(item.title ?? '商品'),
      price: toNum(item.price, 99),
      originalPrice: toNum(item.originalPrice, toNum(item.price, 99) * 2),
      seller: String(item.seller ?? `卖家${i + 1}`),
      description: String(item.description ?? ''),
      location: String(item.location ?? '未知'),
      category: String(item.category ?? '其他'),
      views: toNum(item.views, _.random(10, 100)),
      color: itemColors[i % itemColors.length],
    }));
    writeSecondhandState();
    toastr.success('已生成二手商品', '二手');
  } finally { isGenerating.value = false; }
}

// 首次进入自动生成
onMounted(() => {
  if (!hasAutoGenerated.value) {
    hasAutoGenerated.value = true;
    generateItems();
  }
});
</script>

<style scoped>
.secondhand-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow: hidden; position: relative;
}

.sh-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.header-title { flex: 1; font-size: 15px; font-weight: 600; color: var(--text-primary); text-align: center; }
.search-bar {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; background: var(--bg-secondary); border-radius: 18px; color: var(--text-tertiary);
}
.search-input { flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 13px; outline: none; }
.gen-btn {
  border: none; border-radius: 10px; padding: 5px 10px;
  background: #ffd21e; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
}
.gen-btn:disabled { opacity: 0.5; }
.gen-btn.ghost {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
.gen-btn.ghost.active,
.gen-btn.danger {
  background: rgba(255, 71, 87, 0.14);
  color: #ff4757;
}

.category-tabs {
  display: flex; gap: 4px; padding: 8px 12px; overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
}
.category-tabs::-webkit-scrollbar { display: none; }
.category-tabs button {
  flex: 0 0 auto; border: 0; border-radius: 14px; padding: 5px 12px;
  background: var(--bg-primary); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.category-tabs button.active { background: #ffd21e; color: #333; }
.selection-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 0 12px 8px; padding: 8px 12px;
  border-radius: 12px; background: rgba(255, 71, 87, 0.08);
  color: var(--text-secondary); font-size: 13px; flex-shrink: 0;
}
.selection-toolbar button {
  border: none; border-radius: 12px; padding: 5px 12px;
  background: #ff4757; color: white; font-size: 12px; font-weight: 700; cursor: pointer;
}
.selection-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }

/* ─── Items Grid ─── */
.items-grid {
  flex: 1; overflow-y: auto; padding: 0 12px 80px;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; align-content: start;
}
.item-card { background: var(--bg-primary); border-radius: 12px; overflow: hidden; cursor: pointer; position: relative; }
.item-card.selecting { outline: 1px solid rgba(255, 71, 87, 0.18); }
.item-card.selected { outline: 2px solid #ff4757; }
.select-check {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  width: 24px; height: 24px; border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%; background: rgba(0, 0, 0, 0.26); color: white;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.select-check.checked { background: #ff4757; border-color: #ff4757; }
.item-thumb { height: 100px; display: flex; align-items: center; justify-content: center; }
.item-meta { padding: 8px 10px; }
.item-name {
  font-size: 13px; color: var(--text-primary); line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.item-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.item-card-price { font-size: 16px; font-weight: 700; color: #ff4757; }
.item-wants { font-size: 11px; color: var(--text-muted); }

/* ─── Detail ─── */
.detail-scroll { flex: 1; overflow-y: auto; }
.item-cover { height: 200px; display: flex; align-items: center; justify-content: center; }
.item-info-card { padding: 14px; }
.item-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.item-price { font-size: 24px; font-weight: 700; color: #ff4757; }
.item-original { font-size: 13px; color: var(--text-muted); text-decoration: line-through; }
.item-info-card h3 { margin: 0 0 8px; font-size: 16px; color: var(--text-primary); }
.item-desc { margin: 0 0 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.seller-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border-secondary); }
.seller-info { flex: 1; }
.seller-name { font-size: 14px; font-weight: 500; color: var(--text-primary); display: block; }
.seller-loc { font-size: 12px; color: var(--text-muted); }
.item-stats { display: flex; gap: 12px; padding-top: 8px; font-size: 12px; color: var(--text-tertiary); }
.trade-panel {
  margin-top: 12px; padding: 12px; border-radius: 12px;
  background: var(--bg-secondary); display: flex; flex-direction: column; gap: 8px;
}
.trade-row,
.review-row { display: flex; gap: 8px; }
.trade-row input,
.review-row input {
  flex: 1; border: none; border-radius: 10px; padding: 8px 10px;
  background: var(--bg-primary); color: var(--text-primary); outline: none;
}
.trade-row button,
.review-row button,
.complete-btn {
  border: none; border-radius: 12px; padding: 8px 12px;
  background: #ffd21e; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
}
.complete-btn { width: 100%; background: #ff4757; color: white; }
.complete-btn:disabled { opacity: 0.65; cursor: default; }
.trade-review { margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

.detail-bottom {
  display: flex; gap: 8px; padding: 10px 14px;
  background: var(--bg-primary); border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.want-btn, .chat-seller-btn, .buy-btn {
  flex: 1; padding: 10px; border: none; border-radius: 20px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.want-btn { background: var(--bg-tertiary); color: var(--text-primary); }
.chat-seller-btn { background: #ffd21e; color: #333; }
.buy-btn { background: #ff4757; color: white; }

/* ─── Chat ─── */
.chat-product-bar {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px;
  background: var(--bg-primary); border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.cpb-thumb { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cpb-info { flex: 1; min-width: 0; }
.cpb-title { font-size: 13px; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cpb-price { font-size: 14px; font-weight: 700; color: #ff4757; }
.bargain-btn {
  border: none; border-radius: 14px; padding: 5px 12px;
  background: #ff4757; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}

.chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.chat-msg { display: flex; align-items: flex-end; gap: 8px; max-width: 82%; }
.chat-msg.mine { align-self: flex-end; flex-direction: row-reverse; }
.chat-msg:not(.mine) { align-self: flex-start; }
.chat-bubble {
  padding: 9px 13px; border-radius: 16px; font-size: 14px; line-height: 1.45; word-break: break-word;
}
.chat-msg.mine .chat-bubble { background: #ffd21e; color: #333; border-bottom-right-radius: 4px; }
.chat-msg:not(.mine) .chat-bubble { background: var(--bg-primary); color: var(--text-primary); border-bottom-left-radius: 4px; }

.chat-input-area {
  display: flex; gap: 8px; padding: 8px 12px;
  background: var(--bg-primary); border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.chat-input {
  flex: 1; padding: 8px 14px; border: none; border-radius: 18px;
  background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; outline: none;
}
.chat-send {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: #ffd21e; color: #333; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.chat-send:disabled { opacity: 0.4; }

.fab {
  position: absolute; bottom: 20px; right: 20px;
  width: 52px; height: 52px; border: none; border-radius: 50%;
  background: #ffd21e; color: #333; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 210, 30, 0.4);
}
</style>
