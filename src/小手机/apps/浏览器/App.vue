<template>
  <div class="browser-page">
    <!-- 顶部导航栏 -->
    <div class="browser-header">
      <button class="nav-btn" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <!-- 地址/搜索栏 -->
      <div class="url-bar" :class="{ focused: isUrlFocused }">
        <svg v-if="!isUrlFocused && currentMode === 'ai'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="url-icon">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.64-6.36l-1.41 1.41M6.05 17.95l-1.41 1.41m0-13.72l1.41 1.41m11.31 11.31l1.41 1.41"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="url-icon">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <input
          type="text"
          v-model="urlInput"
          :placeholder="currentMode === 'ai' ? 'AI搜索...' : '输入网址'"
          class="url-input"
          ref="urlInputRef"
          @focus="isUrlFocused = true"
          @blur="isUrlFocused = false"
          @keyup.enter="onNavigate"
        />
        <button v-if="urlInput" class="clear-btn" @click="urlInput = ''">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <button class="nav-btn" @click="onRefresh">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15A9 9 0 1 1 21 12"/>
        </svg>
      </button>
    </div>

    <!-- 模式切换标签 -->
    <div class="mode-tabs">
      <button
        class="mode-tab"
        :class="{ active: currentMode === 'ai' }"
        @click="switchMode('ai')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2"/>
        </svg>
        AI 搜索
      </button>
      <button
        class="mode-tab"
        :class="{ active: currentMode === 'web' }"
        @click="switchMode('web')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        网页浏览
      </button>
    </div>

    <!-- 页面内容 -->
    <div class="browser-content">
      <!-- AI 搜索模式 -->
      <template v-if="currentMode === 'ai'">
        <!-- 搜索首页 -->
        <div v-if="!aiResult && !isGenerating" class="ai-home">
          <div class="ai-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2m0 18v2m4.22-18.36l-1.42 1.42M6.34 17.66l-1.42 1.42M23 12h-2M3 12H1m18.36 4.22l-1.42-1.42M6.34 6.34L4.92 4.92"/>
            </svg>
          </div>
          <h2 class="ai-title">AI 搜索引擎</h2>
          <p class="ai-desc">输入关键词，AI 为你生成网页内容</p>

          <!-- 快捷搜索 -->
          <div class="quick-searches">
            <button v-for="q in quickSearches" :key="q" class="quick-btn" @click="quickSearch(q)">
              {{ q }}
            </button>
          </div>
        </div>

        <!-- 生成中 -->
        <div v-else-if="isGenerating" class="ai-loading">
          <div class="loading-spinner"></div>
          <p>AI 正在生成内容...</p>
          <button class="stop-btn" @click="stopGeneration">停止</button>
        </div>

        <!-- AI 生成结果 -->
        <div v-else class="ai-result">
          <div class="result-header">
            <span class="result-badge">AI 生成</span>
            <span class="result-query">{{ lastQuery }}</span>
          </div>
          <div class="result-content" v-html="aiResult"></div>
        </div>
      </template>

      <!-- 真实网页模式 -->
      <template v-else>
        <!-- 未加载时显示书签 -->
        <div v-if="!currentUrl" class="web-home">
          <h3 class="bookmarks-title">常用网站</h3>
          <div class="bookmarks-grid">
            <div
              v-for="bm in bookmarks"
              :key="bm.url"
              class="bookmark-item"
              @click="loadUrl(bm.url)"
            >
              <div class="bookmark-icon" :style="{ backgroundColor: bm.color }">
                {{ bm.name.charAt(0) }}
              </div>
              <span class="bookmark-name">{{ bm.name }}</span>
            </div>
          </div>
        </div>

        <!-- iframe 加载真实网页 -->
        <iframe
          v-if="currentUrl"
          ref="webFrame"
          :src="currentUrl"
          class="web-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          @load="onIframeLoad"
        ></iframe>
      </template>
    </div>

    <!-- 底部工具栏 -->
    <div class="browser-toolbar">
      <button class="tool-btn" @click="navigateBack" :disabled="!canGoBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button class="tool-btn" @click="navigateForward" :disabled="!canGoForward">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      <button class="tool-btn" @click="addBookmark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <button class="tool-btn" @click="shareUrl">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { useApiStore } from '../../stores/api-store';

const store = usePhoneStore();
const apiStore = useApiStore();

const urlInput = ref('');
const urlInputRef = ref<HTMLInputElement | null>(null);
const isUrlFocused = ref(false);
const currentMode = ref<'ai' | 'web'>('ai');

// ─── AI 搜索状态 ───
const aiResult = ref('');
const isGenerating = ref(false);
const lastQuery = ref('');

const quickSearches = ['今日新闻', '美食推荐', '旅游攻略', '科技资讯', '生活技巧', '热门话题'];

// ─── 网页浏览状态 ───
const currentUrl = ref('');
const webFrame = ref<HTMLIFrameElement | null>(null);
const historyStack = ref<string[]>([]);
const forwardStack = ref<string[]>([]);

const canGoBack = computed(() => historyStack.value.length > 0);
const canGoForward = computed(() => forwardStack.value.length > 0);

const bookmarks = ref([
  { name: '百度', url: 'https://m.baidu.com', color: '#2932e1' },
  { name: '必应', url: 'https://cn.bing.com', color: '#008373' },
  { name: '知乎', url: 'https://m.zhihu.com', color: '#0066ff' },
  { name: '微博', url: 'https://m.weibo.cn', color: '#e6162d' },
  { name: 'B站', url: 'https://m.bilibili.com', color: '#fb7299' },
  { name: '淘宝', url: 'https://m.taobao.com', color: '#ff5000' },
  { name: '京东', url: 'https://m.jd.com', color: '#e4393c' },
  { name: '豆瓣', url: 'https://m.douban.com', color: '#007722' },
]);

function switchMode(mode: 'ai' | 'web') {
  currentMode.value = mode;
  urlInput.value = '';
}

function onNavigate() {
  if (!urlInput.value.trim()) return;

  if (currentMode.value === 'ai') {
    searchAI(urlInput.value.trim());
  } else {
    let url = urlInput.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // 判断是否像网址
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        // 当搜索词处理
        url = `https://m.baidu.com/s?wd=${encodeURIComponent(url)}`;
      }
    }
    loadUrl(url);
  }
}

function loadUrl(url: string) {
  if (currentUrl.value) {
    historyStack.value.push(currentUrl.value);
  }
  forwardStack.value = [];
  currentUrl.value = url;
  urlInput.value = url;
}

function navigateBack() {
  if (historyStack.value.length === 0) return;
  forwardStack.value.push(currentUrl.value);
  currentUrl.value = historyStack.value.pop()!;
  urlInput.value = currentUrl.value;
}

function navigateForward() {
  if (forwardStack.value.length === 0) return;
  historyStack.value.push(currentUrl.value);
  currentUrl.value = forwardStack.value.pop()!;
  urlInput.value = currentUrl.value;
}

function onRefresh() {
  if (currentMode.value === 'web' && webFrame.value) {
    webFrame.value.src = currentUrl.value;
  }
}

function onIframeLoad() {
  // iframe 加载完成
}

function addBookmark() {
  if (currentUrl.value) {
    toastr.success('已添加书签');
  }
}

function shareUrl() {
  if (currentUrl.value) {
    toastr.info('链接已复制');
  }
}

// ─── AI 搜索 ───
async function searchAI(query: string) {
  lastQuery.value = query;
  isGenerating.value = true;
  aiResult.value = '';

  try {
    if (!apiStore.isConfigured) {
      // 未配置 API 时显示模拟内容
      await new Promise(r => setTimeout(r, 1500));
      aiResult.value = generateMockContent(query);
    } else {
      const systemPrompt = `你是一个网页内容生成器。用户输入搜索关键词，你需要生成一个美观的网页内容。
请用 HTML 格式回复，包含标题、正文、列表等元素。内容要丰富、有趣、信息量大。
不要使用 markdown，直接输出 HTML 标签。使用内联样式美化。`;

      const result = await apiStore.call(query, 'browser', systemPrompt);
      aiResult.value = result;
    }
  } catch (e) {
    aiResult.value = `<div style="color: #e74c3c; padding: 20px; text-align: center;">
      <p>生成失败</p>
      <p style="font-size: 13px; opacity: 0.7;">${e instanceof Error ? e.message : '未知错误'}</p>
    </div>`;
  } finally {
    isGenerating.value = false;
  }
}

function quickSearch(query: string) {
  urlInput.value = query;
  searchAI(query);
}

function stopGeneration() {
  apiStore.stopGeneration();
  isGenerating.value = false;
}

function generateMockContent(query: string): string {
  return `
    <div style="padding: 16px; font-family: -apple-system, sans-serif;">
      <h1 style="font-size: 20px; color: var(--text-primary, #333); margin: 0 0 12px;">关于「${query}」</h1>
      <p style="font-size: 14px; color: var(--text-secondary, #666); line-height: 1.6; margin: 0 0 16px;">
        这是一段由 AI 生成的示例内容。请在设置中配置 API 密钥以启用真实的 AI 搜索功能。
      </p>
      <div style="background: var(--bg-tertiary, #f5f5f5); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 15px; margin: 0 0 8px; color: var(--text-primary, #333);">📌 提示</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--text-secondary, #666); line-height: 1.8;">
          <li>前往 <strong>设置</strong> APP 配置你的 API</li>
          <li>支持 OpenAI / Claude / Gemini 等模型</li>
          <li>配置完成后即可使用 AI 搜索生成丰富内容</li>
        </ul>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 10px; padding: 14px; color: white;">
          <div style="font-size: 22px; font-weight: 700;">AI</div>
          <div style="font-size: 11px; opacity: 0.8;">智能搜索</div>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 10px; padding: 14px; color: white;">
          <div style="font-size: 22px; font-weight: 700;">WEB</div>
          <div style="font-size: 11px; opacity: 0.8;">网页浏览</div>
        </div>
      </div>
    </div>
  `;
}

function goBack() {
  if (currentMode.value === 'web' && currentUrl.value) {
    currentUrl.value = '';
    urlInput.value = '';
  } else {
    store.goBack();
  }
}
</script>

<style scoped>
.browser-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.browser-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.nav-btn:hover { background: var(--bg-hover); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; color: var(--text-muted); }

.url-bar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  background: var(--bg-input);
  border-radius: 10px;
  border: none;
  transition: all 0.2s;
}

.url-bar.focused {
  background: var(--bg-primary);
  box-shadow: 0 0 0 2px var(--accent);
}

.url-icon { color: var(--text-tertiary); flex-shrink: 0; }

.url-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.clear-btn {
  width: 18px; height: 18px; border: none; border-radius: 50%;
  background: var(--bg-active); color: var(--text-tertiary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 2px;
  padding: 4px 10px 6px;
  background: var(--bg-primary);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-tab.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* 内容区 */
.browser-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-secondary);
}

/* AI 首页 */
.ai-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.ai-logo {
  width: 80px; height: 80px; border-radius: 20px;
  background: var(--bg-tertiary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}

.ai-title {
  font-size: 20px; font-weight: 700;
  color: var(--text-primary); margin: 0 0 6px;
}

.ai-desc {
  font-size: 13px; color: var(--text-tertiary); margin: 0 0 24px;
}

.quick-searches {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
}

.quick-btn {
  padding: 6px 14px; border: 1px solid var(--border-primary);
  border-radius: 16px; background: var(--bg-primary);
  color: var(--text-secondary); font-size: 12px;
  cursor: pointer; transition: all 0.15s;
}

.quick-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }

/* AI 加载 */
.ai-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 20px; gap: 16px;
}

.loading-spinner {
  width: 32px; height: 32px; border: 3px solid var(--bg-active);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.ai-loading p { font-size: 14px; color: var(--text-secondary); margin: 0; }

.stop-btn {
  padding: 6px 20px; border: 1px solid var(--danger);
  border-radius: 16px; background: transparent;
  color: var(--danger); font-size: 13px; cursor: pointer;
}

/* AI 结果 */
.ai-result {
  padding: 12px;
}

.result-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; margin-bottom: 12px;
  background: var(--bg-primary); border-radius: 8px;
}

.result-badge {
  padding: 2px 8px; background: var(--accent); color: white;
  font-size: 10px; font-weight: 600; border-radius: 4px;
}

.result-query {
  font-size: 13px; color: var(--text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.result-content {
  background: var(--bg-primary); border-radius: 12px;
  overflow: hidden;
}

/* 网页首页 */
.web-home {
  padding: 20px 16px;
}

.bookmarks-title {
  font-size: 15px; font-weight: 600;
  color: var(--text-secondary); margin: 0 0 16px;
}

.bookmarks-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}

.bookmark-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: transform 0.15s;
}

.bookmark-item:active { transform: scale(0.95); }

.bookmark-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 18px; font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.bookmark-name {
  font-size: 11px; color: var(--text-secondary);
}

/* iframe */
.web-iframe {
  width: 100%; height: 100%; border: none;
}

/* 底部工具栏 - Safari 风格 */
.browser-toolbar {
  display: flex; justify-content: space-around;
  padding: 4px 16px 6px;
  background: var(--bg-primary);
  border-top: 0.5px solid var(--border-secondary);
}

.tool-btn {
  width: 40px; height: 40px; border: none; border-radius: 50%;
  background: transparent; color: var(--accent);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}

.tool-btn:hover { background: var(--bg-hover); }
.tool-btn:disabled { opacity: 0.3; cursor: not-allowed; color: var(--text-muted); }
</style>
