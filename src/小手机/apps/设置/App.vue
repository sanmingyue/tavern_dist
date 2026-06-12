<template>
  <div class="settings-page">
    <!-- iOS 风格导航栏 -->
    <div class="ios-navbar">
      <button class="nav-back" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="nav-title">设置</h1>
      <div style="width:32px"></div>
    </div>

    <div class="settings-scroll">
      <!-- 用户卡片 -->
      <div class="ios-group">
        <div class="user-cell" @click="activeSection = 'profile'">
          <div class="user-avatar" :style="userAvatarStyle" @click.stop="pickUserAvatar" title="点击更换头像">
            <img v-if="store.getUserAvatar()" class="user-avatar-img" :src="store.getUserAvatar()" alt="user" />
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>
          </div>
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-hint">Apple ID、iCloud、媒体与购买项目</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <input ref="userAvatarInputRef" class="hidden-file-input" type="file" accept="image/*" @change="onUserAvatarSelected" />
      </div>

      <!-- 显示与外观 -->
      <div class="ios-group">
        <div class="ios-cell">
          <div class="cell-icon" style="background:#007aff;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
          <span class="cell-label">深色模式</span>
          <label class="ios-toggle">
            <input type="checkbox" :checked="store.isDark" @change="store.toggleTheme()" />
            <span class="ios-toggle-track"></span>
          </label>
        </div>

        <div class="ios-cell">
          <div class="cell-icon" style="background:#5856d6;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688z"/></svg>
          </div>
          <span class="cell-label">主题色</span>
          <div class="color-dots">
            <span v-for="c in themeColors" :key="c" class="color-dot" :style="{ backgroundColor: c }" :class="{ active: selectedAccent === c }" @click="selectedAccent = c"></span>
          </div>
        </div>

        <div class="ios-cell column-cell">
          <div class="cell-row">
            <div class="cell-icon" style="background:#ff9500;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
            </div>
            <span class="cell-label">字体大小</span>
            <span class="cell-value">{{ fontSizeLabel }}</span>
          </div>
          <div class="slider-row">
            <span class="slider-label" style="font-size:12px">A</span>
            <input type="range" v-model.number="fontSize" min="12" max="20" step="1" class="ios-slider" />
            <span class="slider-label" style="font-size:18px;font-weight:600">A</span>
          </div>
        </div>

        <div class="ios-cell column-cell">
          <div class="cell-row">
            <div class="cell-icon" style="background:#34c759;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <span class="cell-label">背景图片</span>
            <span class="cell-value">{{ store.wallpaperImage ? '自定义' : '默认' }}</span>
          </div>
          <div class="wallpaper-row">
            <button class="wallpaper-btn" @click="pickWallpaper">选择图片</button>
            <button v-if="store.wallpaperImage" class="wallpaper-btn secondary" @click="store.clearWallpaper()">恢复默认</button>
          </div>
          <div v-if="store.wallpaperImage" class="wallpaper-preview" :style="{ backgroundImage: `url(${store.wallpaperImage})` }"></div>
          <input ref="wallpaperInputRef" class="hidden-file-input" type="file" accept="image/*" @change="onWallpaperSelected" />
        </div>
      </div>

      <!-- 通知与声音 -->
      <div class="ios-group">
        <div class="ios-cell">
          <div class="cell-icon" style="background:#ff3b30;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
          </div>
          <span class="cell-label">通知</span>
          <label class="ios-toggle">
            <input type="checkbox" v-model="notifications" />
            <span class="ios-toggle-track"></span>
          </label>
        </div>

        <div class="ios-cell">
          <div class="cell-icon" style="background:#ff2d55;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </div>
          <span class="cell-label">声音与触感</span>
          <label class="ios-toggle">
            <input type="checkbox" v-model="sound" />
            <span class="ios-toggle-track"></span>
          </label>
        </div>
      </div>

      <!-- API 配置 -->
      <div class="ios-group">
        <div class="group-header">API 配置</div>

        <div v-if="!isDeepSeekSource" class="ios-cell column-cell">
          <div class="cell-row">
            <span class="cell-label">API 地址</span>
          </div>
          <input type="text" v-model="apiUrl" placeholder="https://api.example.com" class="ios-input" />
        </div>

        <div class="ios-cell column-cell">
          <div class="cell-row">
            <span class="cell-label">API 密钥</span>
          </div>
          <input :type="showKey ? 'text' : 'password'" v-model="apiKey" placeholder="sk-..." class="ios-input" />
        </div>

        <div class="ios-cell column-cell">
          <div class="cell-row">
            <span class="cell-label">模型</span>
          </div>
          <div class="model-row">
            <input type="text" v-model="model" :placeholder="modelPlaceholder" class="ios-input" />
            <button class="fetch-btn" @click="fetchModels" :disabled="isFetchingModels">获取</button>
          </div>
          <div v-if="modelList.length > 0" class="model-chips-scroll">
            <div class="model-list-head">
              <span>{{ modelListSummary }}</span>
              <button v-if="modelPrefix" class="model-clear-btn" @click="model = ''">清空前缀</button>
            </div>
            <div class="model-chips">
              <button v-for="m in filteredModelList" :key="m" class="model-chip" :class="{ active: model === m }" @click="model = m">{{ m }}</button>
              <span v-if="filteredModelList.length === 0" class="model-empty">没有匹配此前缀的模型</span>
            </div>
          </div>
        </div>

        <div class="ios-cell column-cell">
          <div class="cell-row">
            <span class="cell-label">源类型</span>
          </div>
          <select v-model="source" class="ios-select">
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="google">Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>

        <div class="ios-cell column-cell">
          <div class="cell-row">
            <span class="cell-label">温度</span>
            <span class="cell-value">{{ (temperature / 100).toFixed(2) }}</span>
          </div>
          <input type="range" v-model.number="temperature" min="0" max="200" class="ios-slider" />
        </div>

        <div class="btn-row">
          <button class="ios-btn primary" @click="saveApiConfig">保存配置</button>
          <button class="ios-btn secondary" @click="testConnection" :disabled="isTesting">{{ isTesting ? '测试中...' : '测试连接' }}</button>
        </div>

        <div v-if="testResult" class="test-result" :class="testResult.ok ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
      </div>

      <!-- 存储 -->
      <div class="ios-group">
        <div class="group-header">存储</div>
        <div class="ios-cell column-cell">
          <div class="storage-bar">
            <div class="storage-fill" :style="{ width: storagePercent + '%' }"></div>
          </div>
          <div class="storage-info">
            <span>已使用 {{ storageUsed }}</span>
            <span>总计 {{ storageTotal }}</span>
          </div>
        </div>
        <div class="ios-cell">
          <span class="cell-label">清除缓存</span>
          <button class="clear-btn" @click="confirmClearCache">清除</button>
        </div>
      </div>

      <!-- 记忆 -->
      <div class="ios-group">
        <div class="group-header">记忆</div>
        <div class="ios-cell">
          <div class="cell-icon" style="background:#5ac8fa;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M7.5 4.21 12 6.81l4.5-2.6"/><path d="M7.5 19.79V14.6L3 12"/><path d="M21 12l-4.5 2.6v5.19"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>
          </div>
          <span class="cell-label">记忆向量化</span>
          <span class="cell-value">{{ vectorMemoryEnabled ? '开启' : '关闭' }}</span>
          <label class="ios-toggle">
            <input type="checkbox" :checked="vectorMemoryEnabled" @change="toggleVectorMemory" />
            <span class="ios-toggle-track"></span>
          </label>
        </div>
      </div>

      <!-- 关于 -->
      <div class="ios-group">
        <div class="group-header">关于本机</div>
        <div class="ios-cell">
          <span class="cell-label">设备名称</span>
          <span class="cell-value">小手机</span>
        </div>
        <div class="ios-cell">
          <span class="cell-label">系统版本</span>
          <span class="cell-value">XiaoOS 18.0</span>
        </div>
        <div class="ios-cell">
          <span class="cell-label">已安装应用</span>
          <span class="cell-value">{{ installedCount }} 个</span>
        </div>
      </div>

      <!-- 开发者工具 -->
      <div class="ios-group">
        <div class="group-header">开发者工具</div>

        <div class="ios-cell" @click="devExpanded.prompts = !devExpanded.prompts" style="cursor:pointer">
          <div class="cell-icon" style="background:#34c759;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span class="cell-label">查看 ordered_prompts</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" :style="{ transform: devExpanded.prompts ? 'rotate(90deg)' : '' }"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div v-if="devExpanded.prompts" class="dev-panel">
          <select v-model="devSelectedApp" class="ios-select dev-select">
            <option v-for="appId in devAppIds" :key="appId" :value="appId">{{ appId }}</option>
          </select>
          <div class="dev-code-scroll">
            <pre class="dev-code">{{ devOrderedPrompts }}</pre>
          </div>
        </div>

        <div class="ios-cell" @click="devExpanded.memory = !devExpanded.memory" style="cursor:pointer">
          <div class="cell-icon" style="background:#007aff;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span class="cell-label">已注入记忆上下文</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" :style="{ transform: devExpanded.memory ? 'rotate(90deg)' : '' }"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div v-if="devExpanded.memory" class="dev-panel">
          <button class="dev-btn" @click="loadMemoryContext" :disabled="devLoadingMemory">{{ devLoadingMemory ? '加载中...' : '刷新记忆上下文' }}</button>
          <div class="dev-code-scroll">
            <pre class="dev-code">{{ devMemoryContext || '(点击刷新加载)' }}</pre>
          </div>
        </div>

        <div class="ios-cell" @click="devExpanded.presets = !devExpanded.presets" style="cursor:pointer">
          <div class="cell-icon" style="background:#ff9500;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span class="cell-label">各 APP 预设提示词</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" :style="{ transform: devExpanded.presets ? 'rotate(90deg)' : '' }"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div v-if="devExpanded.presets" class="dev-panel">
          <select v-model="devPresetApp" class="ios-select dev-select">
            <option v-for="appId in devAppIds" :key="appId" :value="appId">{{ appId }}</option>
          </select>

          <!-- 预设编辑模式 -->
          <div v-if="isEditingPreset" class="preset-edit-area">
            <div class="preset-edit-header">
              <span class="preset-edit-label">编辑 systemPrompt</span>
              <div class="preset-edit-actions">
                <button class="dev-btn-sm cancel" @click="cancelEditPreset">取消</button>
                <button class="dev-btn-sm save" @click="saveEditPreset">保存</button>
              </div>
            </div>
            <textarea v-model="editingPresetText" class="preset-textarea" rows="12"></textarea>
          </div>

          <!-- 预设查看模式 -->
          <div v-else>
            <button class="dev-btn" @click="startEditPreset" style="margin-bottom:4px;">
              ✏️ 编辑此 APP 预设
            </button>
            <div class="dev-code-scroll">
              <pre class="dev-code">{{ devPresetInfo }}</pre>
            </div>
          </div>
        </div>

        <div class="ios-cell" @click="devExpanded.db = !devExpanded.db" style="cursor:pointer">
          <div class="cell-icon" style="background:#af52de;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <span class="cell-label">IndexedDB 数据统计</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" :style="{ transform: devExpanded.db ? 'rotate(90deg)' : '' }"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div v-if="devExpanded.db" class="dev-panel">
          <button class="dev-btn" @click="loadDbStats" :disabled="devLoadingDb">{{ devLoadingDb ? '加载中...' : '刷新数据统计' }}</button>
          <div class="dev-code-scroll">
            <pre class="dev-code">{{ devDbStats || '(点击刷新加载)' }}</pre>
          </div>
        </div>
      </div>

      <div style="height:20px"></div>
    </div>

    <!-- 清除缓存确认弹窗（内联，不使用 Teleport，避免 iframe 环境问题） -->
    <div v-if="showClearConfirm" class="confirm-overlay" @click.self="showClearConfirm = false">
      <div class="confirm-dialog">
        <div class="confirm-title">清除缓存</div>
        <div class="confirm-message">确定要清除当前聊天的所有手机缓存数据吗？这将删除所有聊天记录、论坛帖子、订单等本地数据，此操作不可撤销。</div>
        <div class="confirm-actions">
          <button class="confirm-btn cancel" @click="showClearConfirm = false">取消</button>
          <button class="confirm-btn destructive" @click="executeClearCache">确定清除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApiStore } from '../../stores/api-store';
import { usePhoneStore } from '../../stores/phone-store';
import { useAppRegistry } from '../../stores/app-registry';
import { usePresetStore } from '../../stores/preset-store';
import { isVectorMemoryEnabled, setVectorMemoryEnabled } from '../../utils/memory-settings';
import { clearMiniPhoneCache } from '../../utils/cache-cleaner';

const store = usePhoneStore();
const apiStore = useApiStore();
const registry = useAppRegistry();
const presetStore = usePresetStore();

const activeSection = ref('');
const userName = ref('用户');
const userAvatarInputRef = ref<HTMLInputElement | null>(null);
const wallpaperInputRef = ref<HTMLInputElement | null>(null);

const themeColors = ['#007aff', '#34c759', '#ff3b30', '#af52de', '#ff9500', '#5ac8fa', '#ff2d55', '#8e8e93'];
const selectedAccent = ref('#007aff');
const fontSize = ref(14);
const fontSizeLabel = computed(() => {
  if (fontSize.value <= 13) return '小';
  if (fontSize.value <= 15) return '标准';
  if (fontSize.value <= 17) return '大';
  return '超大';
});

const notifications = ref(true);
const sound = ref(true);

const DEEPSEEK_API_URL = 'https://api.deepseek.com';
const showKey = ref(false);
const apiUrl = ref('');
const apiKey = ref('');
const model = ref('gpt-4');
const source = ref('openai');
const temperature = ref(70);
const modelList = ref<string[]>([]);
const isFetchingModels = ref(false);
const isTesting = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

const storageUsed = ref('128MB');
const storageTotal = ref('256MB');
const storagePercent = ref(50);
const vectorMemoryEnabled = ref(false);

const installedCount = computed(() => registry.getInstalledApps().length);
const isDeepSeekSource = computed(() => source.value === 'deepseek');
const modelPlaceholder = computed(() => isDeepSeekSource.value ? 'deepseek-chat' : 'gpt-4');
const modelPrefix = computed(() => model.value.trim().toLowerCase());
const userAvatarStyle = computed(() => {
  const avatar = store.getUserAvatar();
  return avatar ? { backgroundImage: `url("${avatar}")` } : {};
});

function pickUserAvatar() {
  userAvatarInputRef.value?.click();
}

async function onUserAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await store.setUserAvatar(file);
  input.value = '';
}

function pickWallpaper() {
  wallpaperInputRef.value?.click();
}

async function onWallpaperSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await store.setWallpaper(file);
  input.value = '';
}
const filteredModelList = computed(() => {
  if (!modelPrefix.value) {
    return modelList.value;
  }
  return modelList.value.filter(item => item.toLowerCase().startsWith(modelPrefix.value));
});
const modelListSummary = computed(() => {
  if (!modelPrefix.value) {
    return `${modelList.value.length} 个模型`;
  }
  return `${filteredModelList.value.length} / ${modelList.value.length} 个模型`;
});

function getApiUrlForSource(): string {
  return isDeepSeekSource.value ? DEEPSEEK_API_URL : apiUrl.value.trim();
}

function sanitizeApiKey(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '');
}

function getApiKeyForRequest(): string {
  return sanitizeApiKey(apiKey.value);
}

watch(() => source.value, value => {
  modelList.value = [];
  if (value === 'deepseek') {
    model.value = '';
  }
});

onMounted(() => {
  vectorMemoryEnabled.value = isVectorMemoryEnabled();
  apiStore.loadConfig();
  if (apiStore.config) {
    apiUrl.value = apiStore.config.apiurl.trim();
    apiKey.value = sanitizeApiKey(apiStore.config.key);
    source.value = apiStore.config.source;
    model.value = apiStore.config.model;
    temperature.value = Math.round((apiStore.config.temperature || 0.7) * 100);
  }
});

async function toggleVectorMemory(event: Event) {
  const enabled = (event.target as HTMLInputElement).checked;
  vectorMemoryEnabled.value = enabled;
  setVectorMemoryEnabled(enabled);

  if (!enabled) {
    toastr.info('记忆向量化已关闭');
    return;
  }

  try {
    const { getLocalDB } = await import('../../utils/local-db');
    const db = await getLocalDB();
    await db.backfillMemoryChunks();
    toastr.success('记忆向量化已开启');
  } catch (e) {
    console.warn('[小手机] 启用记忆向量化失败:', e);
    toastr.warning('已开启，旧数据回填稍后重试');
  }
}

function saveApiConfig(): boolean {
  const cleanKey = getApiKeyForRequest();
  if (isDeepSeekSource.value && !cleanKey) {
    toastr.warning('请先填写 API 密钥');
    return false;
  }
  apiKey.value = cleanKey;
  apiStore.setConfig({
    apiurl: getApiUrlForSource(), key: cleanKey, model: model.value.trim(),
    source: source.value, temperature: temperature.value / 100,
  });
  toastr.success('API 配置已保存');
  return true;
}

type ModelListGetter = (customApi: { apiurl: string; key?: string }) => Promise<string[]>;
type ModelRequest = { url: string; headers: HeadersInit };

function normalizeModelBaseUrl(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/(?:chat\/completions|responses|completions|messages)$/i, '')
    .replace(/\/models$/i, '');
}

function withApiKeyQuery(rawUrl: string, key: string): string {
  if (!key) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('key')) {
      url.searchParams.set('key', key);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function buildModelRequests(rawUrl: string, key: string, apiSource: string): ModelRequest[] {
  const baseUrl = normalizeModelBaseUrl(rawUrl);
  const sourceName = apiSource.toLowerCase();
  const jsonHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const bearerHeaders: Record<string, string> = key
    ? { ...jsonHeaders, Authorization: `Bearer ${key}` }
    : jsonHeaders;

  if (sourceName === 'claude') {
    return [{
      url: `${baseUrl}/models`,
      headers: {
        ...jsonHeaders,
        ...(key ? { 'x-api-key': key } : {}),
        'anthropic-version': '2023-06-01',
      },
    }];
  }

  if (sourceName === 'google' || sourceName === 'gemini' || sourceName === 'makersuite') {
    return [{ url: withApiKeyQuery(`${baseUrl}/models`, key), headers: jsonHeaders }];
  }

  if (sourceName === 'ollama') {
    const ollamaBase = baseUrl.replace(/\/api$/i, '');
    return [
      { url: `${ollamaBase}/api/tags`, headers: jsonHeaders },
      { url: `${baseUrl}/models`, headers: bearerHeaders },
    ];
  }

  if (sourceName === 'deepseek') {
    return [
      { url: `${baseUrl}/models`, headers: bearerHeaders },
      { url: `${baseUrl}/v1/models`, headers: bearerHeaders },
    ];
  }

  return [{ url: `${baseUrl}/models`, headers: bearerHeaders }];
}

function extractModelNames(payload: unknown): string[] {
  const data = payload as any;
  const candidates = [data?.data, data?.models, data?.model_list, payload];
  const names = candidates
    .filter(Array.isArray)
    .flatMap((items: unknown[]) =>
      items
        .map(item => {
          if (typeof item === 'string') return item;
          const model = item as { id?: unknown; name?: unknown; model?: unknown };
          const value = model.id ?? model.name ?? model.model;
          return typeof value === 'string' ? value.replace(/^models\//, '') : '';
        })
        .filter(Boolean),
    );

  return Array.from(new Set(names));
}

async function readModelApiError(response: Response): Promise<string> {
  const status = `${response.status} ${response.statusText || '请求失败'}`;
  try {
    const payload = await response.clone().json();
    const apiMessage = payload?.error?.message ?? payload?.message ?? payload?.error;
    return typeof apiMessage === 'string' ? `${status}: ${apiMessage}` : status;
  } catch {
    try {
      const text = await response.text();
      return text ? `${status}: ${text.slice(0, 240)}` : status;
    } catch {
      return status;
    }
  }
}

async function fetchModelsDirectly(): Promise<string[]> {
  const errors: string[] = [];
  const cleanKey = getApiKeyForRequest();
  apiKey.value = cleanKey;

  for (const request of buildModelRequests(getApiUrlForSource(), cleanKey, source.value)) {
    try {
      const response = await fetch(request.url, {
        method: 'GET',
        headers: request.headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        errors.push(await readModelApiError(response));
        continue;
      }

      const models = extractModelNames(await response.json());
      if (models.length > 0) {
        return models;
      }
      errors.push('响应中没有可用模型');
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  throw new Error(errors.join('；') || '模型端点不可用');
}

async function loadModelList(): Promise<string[]> {
  const tavernGetModelList = (globalThis as unknown as { getModelList?: ModelListGetter }).getModelList;
  if (!isDeepSeekSource.value && typeof tavernGetModelList === 'function') {
    try {
      const models = await tavernGetModelList({ apiurl: getApiUrlForSource(), key: getApiKeyForRequest() });
      if (models.length > 0) {
        return models;
      }
      console.warn('[小手机] 酒馆助手 getModelList 返回空模型列表，改用直接请求');
    } catch (e) {
      console.warn('[小手机] 酒馆助手 getModelList 调用失败，改用直接请求:', e);
    }
  }

  return fetchModelsDirectly();
}

async function fetchModels() {
  if (!isDeepSeekSource.value && !apiUrl.value.trim()) { toastr.warning('请先填写 API 地址'); return; }
  if (isDeepSeekSource.value && !getApiKeyForRequest()) { toastr.warning('请先填写 API 密钥'); return; }
  isFetchingModels.value = true;
  try {
    const models = await loadModelList();
    modelList.value = models;
    toastr.success(`获取到 ${models.length} 个模型`);
  } catch (e) {
    const message = e instanceof Error ? e.message : '未知错误';
    console.warn('[小手机] 获取模型列表失败:', e);
    toastr.error(`获取模型列表失败：${message}`);
  }
  finally { isFetchingModels.value = false; }
}

async function testConnection() {
  if (!isDeepSeekSource.value && !apiUrl.value.trim()) { toastr.warning('请先填写 API 地址'); return; }
  if (isDeepSeekSource.value && !getApiKeyForRequest()) { toastr.warning('请先填写 API 密钥'); return; }
  if (!model.value.trim()) { toastr.warning('请先填写模型'); return; }
  isTesting.value = true;
  testResult.value = null;
  if (!saveApiConfig()) {
    isTesting.value = false;
    return;
  }
  try {
    const result = await apiStore.call('你好，请回复"连接成功"', 'settings', '请简短回复');
    testResult.value = { ok: true, message: `连接成功！回复: ${result.slice(0, 50)}` };
  } catch (e) {
    testResult.value = { ok: false, message: e instanceof Error ? e.message : '连接失败' };
  } finally { isTesting.value = false; }
}

const showClearConfirm = ref(false);

function confirmClearCache() {
  showClearConfirm.value = true;
}

// ─── 开发者工具 ───
const devExpanded = reactive({ prompts: false, memory: false, presets: false, db: false });
const isEditingPreset = ref(false);
const editingPresetText = ref('');
const devSelectedApp = ref('messages');
const devPresetApp = ref('messages');
const devMemoryContext = ref('');
const devDbStats = ref('');
const devLoadingMemory = ref(false);
const devLoadingDb = ref(false);

const devAppIds = computed(() => Object.keys(presetStore.getAllPresets()));

const devOrderedPrompts = computed(() => {
  const prompts = presetStore.buildOrderedPrompts(devSelectedApp.value);
  return prompts.map((p, i) => {
    if (typeof p === 'string') return `[${i}] 📌 内置占位符: ${p}`;
    return `[${i}] 🔹 ${p.role.toUpperCase()}: ${p.content.slice(0, 120)}${p.content.length > 120 ? '...' : ''}`;
  }).join('\n\n');
});

const devPresetInfo = computed(() => {
  const preset = presetStore.getPresetForApp(devPresetApp.value);
  if (!preset) return '(无预设)';
  return [
    `appId: ${preset.appId}`,
    `contextLevel: ${preset.contextLevel}`,
    `outputFormat: ${preset.outputFormat}`,
    `maxChatHistory: ${preset.maxChatHistory}`,
    `formatDescription: ${preset.formatDescription}`,
    ``,
    `--- systemPrompt ---`,
    preset.systemPrompt,
  ].join('\n');
});

async function loadMemoryContext() {
  devLoadingMemory.value = true;
  try {
    const { buildExtraContext } = await import('../../utils/memory-system');
    const ctx = await buildExtraContext(devSelectedApp.value);
    devMemoryContext.value = ctx || '(无记忆上下文)';
  } catch (e) {
    devMemoryContext.value = `加载失败: ${e instanceof Error ? e.message : '未知错误'}`;
  } finally {
    devLoadingMemory.value = false;
  }
}

async function loadDbStats() {
  devLoadingDb.value = true;
  try {
    const { getLocalDB } = await import('../../utils/local-db');
    const db = await getLocalDB();
    const stats = await db.getStats();
    const lines = Object.entries(stats).map(([store, count]) => `${store}: ${count} 条`);
    devDbStats.value = lines.join('\n') || '(数据库为空)';
  } catch (e) {
    devDbStats.value = `加载失败: ${e instanceof Error ? e.message : '未知错误'}`;
  } finally {
    devLoadingDb.value = false;
  }
}

function startEditPreset() {
  const preset = presetStore.getPresetForApp(devPresetApp.value);
  if (preset) {
    editingPresetText.value = preset.systemPrompt;
    isEditingPreset.value = true;
    console.info(`[小手机] 开始编辑预设: ${devPresetApp.value}`);
  } else {
    toastr.warning('该 APP 无预设');
  }
}

function cancelEditPreset() {
  isEditingPreset.value = false;
  editingPresetText.value = '';
  console.info('[小手机] 取消编辑预设');
}

function saveEditPreset() {
  const text = editingPresetText.value;
  presetStore.setPresetForApp(devPresetApp.value, { systemPrompt: text });
  isEditingPreset.value = false;
  editingPresetText.value = '';
  toastr.success(`已保存「${devPresetApp.value}」的预设`, '设置');
  console.info(`[小手机] 已保存预设: ${devPresetApp.value}, 长度: ${text.length}`);
}

// 切换 APP 时退出编辑模式
watch(() => devPresetApp.value, () => {
  if (isEditingPreset.value) {
    isEditingPreset.value = false;
    editingPresetText.value = '';
  }
});

async function executeClearCache() {
  showClearConfirm.value = false;
  console.info('[小手机] 开始清除缓存...');
  try {
    store.resetLocalState();
    apiStore.clearConfig();
    const result = await clearMiniPhoneCache();
    storageUsed.value = '0MB';
    storagePercent.value = 0;
    vectorMemoryEnabled.value = false;

    toastr.success('所有缓存数据已清除', '设置');
    console.info('[小手机] 缓存清除完成:', result);

    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (e) {
    console.error('[小手机] 清除缓存失败:', e);
    toastr.error('清除失败: ' + (e instanceof Error ? e.message : '未知错误'), '设置');
  }
}
</script>

<style scoped>
.settings-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary);
}

/* ─── iOS 导航栏 ─── */
.ios-navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.nav-back {
  width: 32px; height: 32px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
}

.settings-scroll { flex: 1; overflow-y: auto; padding: 0; }

/* ─── iOS 分组 ─── */
.ios-group {
  margin: 8px 16px;
  background: var(--bg-card);
  border-radius: 10px;
  overflow: hidden;
}

.group-header {
  font-size: 13px; font-weight: 400; color: var(--text-secondary);
  padding: 8px 16px 4px;
  text-transform: uppercase; letter-spacing: 0.3px;
  background: transparent;
  margin: 8px 16px 0;
}

.group-header + .ios-group { margin-top: 4px; }

/* ─── iOS Cell ─── */
.ios-cell {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 16px; min-height: 44px;
  border-bottom: 0.5px solid var(--border-secondary);
}

.ios-cell:last-child { border-bottom: none; }

.ios-cell.column-cell {
  flex-direction: column; align-items: stretch; gap: 8px;
}

.cell-row {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
}

.cell-icon {
  width: 29px; height: 29px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-right: 12px;
}

.cell-label {
  font-size: 16px; color: var(--text-primary); flex: 1;
}

.cell-value {
  font-size: 16px; color: var(--text-tertiary);
}

/* ─── 用户卡片 ─── */
.user-cell {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; cursor: pointer;
}

.user-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--accent); display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  overflow: hidden;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info { flex: 1; }
.user-name { font-size: 18px; font-weight: 600; color: var(--text-primary); display: block; }
.user-hint { font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: block; }

/* ─── iOS Toggle ─── */
.ios-toggle {
  position: relative; width: 51px; height: 31px; cursor: pointer; flex-shrink: 0;
}
.ios-toggle input { opacity: 0; width: 0; height: 0; }
.ios-toggle-track {
  position: absolute; inset: 0;
  background: var(--bg-active, #e9e9eb);
  border-radius: 16px; transition: background 0.25s;
}
.ios-toggle-track::before {
  content: ''; position: absolute; width: 27px; height: 27px;
  border-radius: 50%; background: white; top: 2px; left: 2px;
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.05);
}
.ios-toggle input:checked + .ios-toggle-track { background: #34c759; }
.ios-toggle input:checked + .ios-toggle-track::before { transform: translateX(20px); }

/* ─── 颜色选择 ─── */
.color-dots { display: flex; gap: 6px; }
.color-dot {
  width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
  border: 2.5px solid transparent; transition: all 0.2s;
}
.color-dot.active { border-color: var(--text-primary); transform: scale(1.1); }

/* ─── Slider ─── */
.slider-row { display: flex; align-items: center; gap: 10px; }
.slider-label { color: var(--text-tertiary); min-width: 16px; text-align: center; }

.wallpaper-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.wallpaper-btn {
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  cursor: pointer;
}

.wallpaper-btn.secondary {
  background: var(--bg-active);
  color: var(--text-secondary);
}

.wallpaper-preview {
  width: 100%;
  aspect-ratio: 16/9;
  margin-top: 10px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  border: 0.5px solid var(--border-secondary);
}

.hidden-file-input {
  display: none;
}

.ios-slider {
  flex: 1; appearance: none; height: 4px; border-radius: 2px;
  background: var(--bg-active); outline: none;
}
.ios-slider::-webkit-slider-thumb {
  appearance: none; width: 22px; height: 22px; border-radius: 50%;
  background: white; box-shadow: 0 0.5px 4px rgba(0,0,0,0.2);
  border: 0.5px solid rgba(0,0,0,0.04);
}

/* ─── 输入 ─── */
.ios-input, .ios-select {
  width: 100%; padding: 8px 12px;
  border: 0.5px solid var(--border-primary); border-radius: 8px;
  background: var(--bg-input); color: var(--text-primary);
  font-size: 15px; outline: none;
}
.ios-input:focus { border-color: var(--accent); }

.model-row { display: flex; gap: 8px; width: 100%; }
.model-row .ios-input { flex: 1; }

.fetch-btn {
  padding: 8px 14px; border: 1px solid var(--accent); border-radius: 8px;
  background: transparent; color: var(--accent); font-size: 14px; font-weight: 500;
  cursor: pointer; flex-shrink: 0;
}
.fetch-btn:disabled { opacity: 0.4; }

.model-chips-scroll {
  max-height: 120px; overflow-y: auto; border-radius: 8px;
  border: 0.5px solid var(--border-secondary);
}
.model-list-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 6px 8px 0;
  color: var(--text-tertiary); font-size: 11px;
}
.model-clear-btn {
  border: none; background: transparent; color: var(--accent);
  font-size: 11px; cursor: pointer; flex-shrink: 0; padding: 0;
}
.model-chips { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; }
.model-chip {
  padding: 4px 10px; border: 0.5px solid var(--border-primary);
  border-radius: 14px; background: var(--bg-tertiary);
  color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.model-chip.active { background: var(--accent); color: white; border-color: var(--accent); }
.model-empty {
  color: var(--text-tertiary); font-size: 12px; padding: 4px 2px;
}

/* ─── 按钮 ─── */
.btn-row { display: flex; gap: 8px; padding: 4px 16px 12px; }

.ios-btn {
  flex: 1; padding: 12px; border: none; border-radius: 10px;
  font-size: 15px; font-weight: 500; cursor: pointer;
}
.ios-btn.primary { background: var(--accent); color: white; }
.ios-btn.secondary {
  background: transparent; border: 1px solid var(--accent);
  color: var(--accent);
}
.ios-btn:disabled { opacity: 0.4; }

.test-result {
  padding: 10px 16px; margin: 0 16px 12px;
  border-radius: 8px; font-size: 13px;
}
.test-result.success { background: rgba(52,199,89,0.1); color: #34c759; }
.test-result.error { background: rgba(255,59,48,0.1); color: #ff3b30; }

/* ─── 存储 ─── */
.storage-bar {
  height: 8px; background: var(--bg-active); border-radius: 4px;
  overflow: hidden; width: 100%;
}
.storage-fill {
  height: 100%; background: var(--accent); border-radius: 4px;
  transition: width 0.3s;
}
.storage-info {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--text-tertiary);
}

.clear-btn {
  padding: 5px 14px; border: 1px solid var(--danger); border-radius: 8px;
  background: transparent; color: var(--danger); font-size: 13px;
  cursor: pointer; font-weight: 500;
}

/* ─── 确认弹窗 ─── */
.confirm-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; backdrop-filter: blur(4px);
}
.confirm-dialog {
  width: 270px; background: var(--bg-card, #1c1c1e);
  border-radius: 14px; overflow: hidden; text-align: center;
}
.confirm-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary);
  padding: 20px 16px 4px;
}
.confirm-message {
  font-size: 13px; color: var(--text-secondary); line-height: 1.5;
  padding: 4px 16px 20px;
}
.confirm-actions {
  display: flex; border-top: 0.5px solid var(--border-secondary);
}
.confirm-btn {
  flex: 1; padding: 12px; border: none; background: transparent;
  font-size: 17px; cursor: pointer;
}
.confirm-btn.cancel { color: var(--accent); font-weight: 400; }
.confirm-btn.destructive {
  color: var(--danger); font-weight: 600;
  border-left: 0.5px solid var(--border-secondary);
}

/* ─── 开发者工具 ─── */
.dev-panel {
  padding: 8px 16px 12px;
  border-top: 0.5px solid var(--border-secondary);
}
.dev-select {
  margin-bottom: 8px;
}
.dev-btn {
  width: 100%; padding: 8px; border: 1px solid var(--accent);
  border-radius: 8px; background: transparent;
  color: var(--accent); font-size: 13px; font-weight: 500;
  cursor: pointer; margin-bottom: 8px;
}
.dev-btn:disabled { opacity: 0.4; cursor: wait; }
.dev-code-scroll {
  max-height: 200px; overflow-y: auto;
  border: 0.5px solid var(--border-secondary);
  border-radius: 8px; background: var(--bg-input);
}
.dev-code {
  margin: 0; padding: 10px;
  font-size: 11px; line-height: 1.5;
  color: var(--text-secondary); white-space: pre-wrap;
  word-break: break-all; font-family: 'SF Mono', 'Menlo', monospace;
}

/* ─── 预设编辑 ─── */
.preset-edit-area {
  display: flex; flex-direction: column; gap: 6px;
}
.preset-edit-header {
  display: flex; justify-content: space-between; align-items: center;
}
.preset-edit-label {
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
}
.preset-edit-actions {
  display: flex; gap: 6px;
}
.dev-btn-sm {
  padding: 4px 12px; border: none; border-radius: 6px;
  font-size: 12px; font-weight: 500; cursor: pointer;
}
.dev-btn-sm.cancel {
  background: var(--bg-tertiary); color: var(--text-secondary);
}
.dev-btn-sm.save {
  background: var(--accent); color: white;
}
.preset-textarea {
  width: 100%; padding: 10px; border: 0.5px solid var(--border-primary);
  border-radius: 8px; background: var(--bg-input); color: var(--text-primary);
  font-size: 12px; line-height: 1.5; resize: vertical; outline: none;
  font-family: 'SF Mono', 'Menlo', monospace; box-sizing: border-box;
  min-height: 150px;
}
.preset-textarea:focus { border-color: var(--accent); }
</style>
