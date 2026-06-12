<template>
  <div class="credits-root">
    <!-- 顶部信息 -->
    <div class="credits-header">
      <button class="credits-back-btn" @click="$emit('back')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        返回
      </button>
      <div class="credits-header-info">
        <div class="credits-title">感谢每一位点赞的朋友 👍</div>
        <div class="credits-author">
          <span class="credits-author-label">作者</span>
          <span class="credits-author-name">shiyue67</span>
        </div>
        <div class="credits-meta" v-if="metadata">
          <span class="credits-meta-item">
            <span class="credits-meta-label">总人数</span>
            {{ metadata.total_users.toLocaleString() }}
          </span>
          <span class="credits-meta-item">
            <span class="credits-meta-label">统计时间</span>
            {{ formatTime(metadata.scraped_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="credits-search-bar">
      <svg class="credits-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        class="credits-search-input"
        v-model="localSearch"
        placeholder="搜索用户名…"
        spellcheck="false"
      />
      <button v-if="localSearch" class="credits-search-clear" @click="localSearch = ''">×</button>
    </div>

    <!-- 加载 / 错误状态 -->
    <div v-if="loading" class="credits-status">
      <div class="credits-loading-spinner" />
      <span>加载中…</span>
    </div>
    <div v-else-if="error" class="credits-status credits-error">
      <span>{{ error }}</span>
      <button class="credits-retry-btn" @click="loadData">重试</button>
    </div>

    <!-- 虚拟滚动列表 -->
    <div
      v-else
      ref="viewportRef"
      class="credits-viewport"
      @scroll="onScroll"
    >
      <div class="credits-ghost" :style="{ height: ghostHeight + 'px' }" />
      <div class="credits-content" :style="{ transform: `translateY(${contentOffset}px)` }">
        <div
          v-for="(user, i) in visibleUsers"
          :key="startIndex + i"
          class="credits-user-row"
        >
          <div class="credits-col-index">{{ String(startIndex + i + 1).padStart(3, '0') }}</div>
          <img
            v-if="user.avatar_url"
            class="credits-col-avatar"
            :src="user.avatar_url + '?size=64'"
            loading="lazy"
            alt=""
          />
          <div v-else class="credits-col-avatar credits-avatar-fallback">
            {{ getInitial(user) }}
          </div>
          <div class="credits-col-name">{{ user.global_name || user.username || 'Unknown' }}</div>
        </div>
      </div>

      <!-- 空结果 -->
      <div v-if="filteredData.length === 0 && !loading" class="credits-empty">
        {{ rawData.length === 0 ? '暂无数据' : '无匹配结果' }}
      </div>
    </div>

    <!-- 底部统计 -->
    <div v-if="!loading && !error" class="credits-footer">
      显示 {{ filteredData.length }} / {{ rawData.length }} 位用户
    </div>
  </div>
</template>

<script setup lang="ts">
const ITEM_HEIGHT = 56;
const BUFFER_ITEMS = 10;

// CDN 地址 - 使用 reactions 版本号标签
const REACTIONS_URL = 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@reactions-v1.0.0/dist/reactions/reactions.json';

interface UserData {
  id: string;
  username: string;
  global_name: string | null;
  avatar_url: string | null;
}

interface Metadata {
  scraped_at: string;
  channel_id: string;
  message_id: string;
  emoji: string;
  total_users: number;
}

defineEmits<{
  back: [];
}>();

const loading = ref(true);
const error = ref('');
const rawData = ref<UserData[]>([]);
const metadata = ref<Metadata | null>(null);
const localSearch = ref('');
const viewportRef = ref<HTMLDivElement | null>(null);

// 过滤数据
const filteredData = computed(() => {
  const term = localSearch.value.trim().toLowerCase();
  if (!term) return rawData.value;
  return rawData.value.filter(user => {
    const globalName = (user.global_name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    return globalName.includes(term) || username.includes(term);
  });
});

// 虚拟滚动
const scrollTop = ref(0);
const viewportHeight = ref(400);

const ghostHeight = computed(() => filteredData.value.length * ITEM_HEIGHT);

const startIndex = computed(() => {
  const raw = Math.floor(scrollTop.value / ITEM_HEIGHT);
  return Math.max(0, raw - BUFFER_ITEMS);
});

const endIndex = computed(() => {
  const raw = Math.ceil((scrollTop.value + viewportHeight.value) / ITEM_HEIGHT);
  return Math.min(filteredData.value.length - 1, raw + BUFFER_ITEMS);
});

const contentOffset = computed(() => startIndex.value * ITEM_HEIGHT);

const visibleUsers = computed(() => {
  if (filteredData.value.length === 0) return [];
  return filteredData.value.slice(startIndex.value, endIndex.value + 1);
});

function onScroll() {
  if (!viewportRef.value) return;
  scrollTop.value = viewportRef.value.scrollTop;
  viewportHeight.value = viewportRef.value.clientHeight;
}

// 搜索变化时重置滚动
watch(localSearch, () => {
  if (viewportRef.value) {
    viewportRef.value.scrollTop = 0;
    scrollTop.value = 0;
  }
});

// 格式化时间
function formatTime(isoString: string): string {
  if (!isoString) return '未知';
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 获取首字母
function getInitial(user: UserData): string {
  const name = user.global_name || user.username || '?';
  return name.charAt(0).toUpperCase();
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const resp = await fetch(REACTIONS_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    if (json.data && Array.isArray(json.data)) {
      rawData.value = json.data;
      metadata.value = json.metadata || null;
    } else if (Array.isArray(json)) {
      rawData.value = json;
    } else {
      throw new Error('数据格式错误');
    }
  } catch (e: any) {
    error.value = `加载失败: ${e.message || e}`;
    console.error('[致谢页面] 数据加载失败:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
  nextTick(() => {
    if (viewportRef.value) {
      viewportHeight.value = viewportRef.value.clientHeight;
    }
  });
});
</script>

<style scoped>
.credits-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: rgba(255, 255, 255, 0.88);
}

/* ═══ 顶部 ═══ */
.credits-header {
  flex-shrink: 0;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.15);
  background: rgba(5, 8, 16, 0.6);
}

.credits-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(77, 201, 246, 0.2);
  background: rgba(77, 201, 246, 0.06);
  color: rgba(77, 201, 246, 0.9);
  font-size: 12px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.15s;
}
.credits-back-btn:hover {
  background: rgba(77, 201, 246, 0.15);
  border-color: rgba(77, 201, 246, 0.4);
}

.credits-header-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.credits-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(77, 201, 246, 0.95);
  letter-spacing: 0.5px;
}

.credits-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.credits-author-label {
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.credits-author-name {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.credits-meta {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.credits-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.credits-meta-label {
  color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ═══ 搜索框 ═══ */
.credits-search-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.1);
  background: rgba(5, 8, 16, 0.4);
}
.credits-search-icon {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.3);
}
.credits-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  padding: 4px 0;
  min-width: 0;
}
.credits-search-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}
.credits-search-clear {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.credits-search-clear:hover {
  color: rgba(255, 255, 255, 0.7);
}

/* ═══ 状态 ═══ */
.credits-status {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
.credits-error {
  color: rgba(255, 120, 120, 0.7);
}
.credits-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(77, 201, 246, 0.15);
  border-top-color: rgba(77, 201, 246, 0.7);
  border-radius: 50%;
  animation: credits-spin 0.8s linear infinite;
}
@keyframes credits-spin {
  to { transform: rotate(360deg); }
}
.credits-retry-btn {
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid rgba(77, 201, 246, 0.25);
  background: rgba(77, 201, 246, 0.08);
  color: rgba(77, 201, 246, 0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.credits-retry-btn:hover {
  background: rgba(77, 201, 246, 0.18);
}

/* ═══ 虚拟滚动列表 ═══ */
.credits-viewport {
  flex: 1;
  overflow-y: auto;
  position: relative;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(77, 201, 246, 0.15) transparent;
}
.credits-viewport::-webkit-scrollbar {
  width: 4px;
}
.credits-viewport::-webkit-scrollbar-track {
  background: transparent;
}
.credits-viewport::-webkit-scrollbar-thumb {
  background: rgba(77, 201, 246, 0.2);
  border-radius: 2px;
}

.credits-ghost {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  opacity: 0;
  pointer-events: none;
}

.credits-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 14px;
}

.credits-user-row {
  height: 56px;
  display: grid;
  grid-template-columns: 36px 44px 1fr;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  gap: 0;
  transition: background 0.15s;
}
.credits-user-row:hover {
  background: rgba(77, 201, 246, 0.04);
}

.credits-col-index {
  color: rgba(255, 255, 255, 0.2);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  letter-spacing: 0.03em;
}

.credits-col-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.06);
  display: block;
}

.credits-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
}

.credits-col-name {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 8px;
}

.credits-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.25);
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* ═══ 底部 ═══ */
.credits-footer {
  flex-shrink: 0;
  padding: 6px 14px;
  border-top: 1px solid rgba(77, 201, 246, 0.1);
  background: rgba(5, 8, 16, 0.6);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
}
</style>
