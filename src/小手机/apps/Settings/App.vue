<template>
  <div class="settings-page">
    <div class="page-header">
      <button class="back-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 class="page-title">设置</h1>
    </div>

    <div class="settings-content">
      <!-- API 配置 -->
      <div class="settings-section">
        <h3 class="section-title">API 配置</h3>
        <div v-if="!isDeepSeekSource" class="settings-item">
          <span class="item-label">API 地址</span>
          <input type="text" v-model="apiUrl" placeholder="https://api.example.com" class="item-input" />
        </div>
        <div class="settings-item">
          <span class="item-label">API 密钥</span>
          <input type="password" v-model="apiKey" placeholder="sk-..." class="item-input" />
        </div>
        <div class="settings-item">
          <span class="item-label">模型</span>
          <input type="text" v-model="model" :placeholder="modelPlaceholder" class="item-input" />
        </div>
        <div class="settings-item">
          <span class="item-label">源类型</span>
          <select v-model="source" class="item-select">
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>
        <button class="save-btn" @click="saveApiConfig">保存配置</button>
      </div>

      <!-- 外观 -->
      <div class="settings-section">
        <h3 class="section-title">外观</h3>
        <div class="settings-item">
          <span class="item-label">主题</span>
          <div class="theme-toggle">
            <button :class="{ active: theme === 'dark' }" @click="setTheme('dark')">深色</button>
            <button :class="{ active: theme === 'light' }" @click="setTheme('light')">浅色</button>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div class="settings-section">
        <h3 class="section-title">关于</h3>
        <div class="settings-item">
          <span class="item-label">版本</span>
          <span class="item-value">1.0.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApiStore } from '../../stores/api-store';
import { usePhoneStore } from '../../stores/phone-store';

const store = usePhoneStore();
const apiStore = useApiStore();

const theme = computed(() => store.theme);
const DEEPSEEK_API_URL = 'https://api.deepseek.com';
const apiUrl = ref('');
const apiKey = ref('');
const model = ref('gpt-4');
const source = ref('openai');
const isDeepSeekSource = computed(() => source.value === 'deepseek');
const modelPlaceholder = computed(() => isDeepSeekSource.value ? 'deepseek-chat' : 'gpt-4');

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
  if (value === 'deepseek') {
    model.value = '';
  }
});

onMounted(() => {
  apiStore.loadConfig();
  if (apiStore.config) {
    apiUrl.value = apiStore.config.apiurl.trim();
    apiKey.value = sanitizeApiKey(apiStore.config.key);
    source.value = apiStore.config.source;
    model.value = apiStore.config.model;
  }
});

function setTheme(t: 'light' | 'dark') {
  if (store.theme !== t) {
    store.toggleTheme();
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
    apiurl: getApiUrlForSource(),
    key: cleanKey,
    model: model.value.trim(),
    source: source.value,
  });
  toastr.success('API 配置已保存');
  return true;
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-primary);
}

.back-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 8px;
  margin-bottom: 8px;
}

.item-label {
  font-size: 14px;
  color: var(--text-primary);
}

.item-input,
.item-select {
  flex: 1;
  max-width: 180px;
  padding: 6px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.item-value {
  color: var(--text-tertiary);
  font-size: 14px;
}

.theme-toggle {
  display: flex;
  gap: 4px;
}

.theme-toggle button {
  padding: 6px 12px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.theme-toggle button.active {
  background: var(--accent);
  color: white;
}

.save-btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.save-btn:hover {
  opacity: 0.9;
}
</style>
