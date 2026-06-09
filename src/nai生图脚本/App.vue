<template>
  <div class="nai-root" :class="[`theme-${store.settings.theme}`, `size-${store.settings.sizeLevel}`]">
    <Transition name="nai-fade">
      <button
        v-if="!isPanelOpen"
        class="nai-fab"
        :class="{ dragging: isFabDragging }"
        :style="fabStyle"
        title="NAI 生图"
        @pointerdown="onFabPointerDown"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="10" r="1.8" />
          <path d="M21 16l-5.2-5.2a1.6 1.6 0 0 0-2.2 0L5 19" />
        </svg>
      </button>
    </Transition>

    <Transition name="nai-panel-motion">
      <section v-if="isPanelOpen" class="nai-panel" :class="{ mobile: isMobile }" :style="panelStyle">
        <div v-if="isMobile" class="mobile-grip" @pointerdown="onMobileSwipeStart">
          <span />
        </div>

        <header class="panel-header" @pointerdown="!isMobile && onPanelPointerDown($event)">
          <div class="title-block">
            <strong>NAI 生图 v0.0.1</strong>
            <span>{{ statusLine }}</span>
          </div>
          <div class="header-actions" @pointerdown.stop>
            <div class="segmented">
              <button
                :class="{ active: store.settings.theme === 'warm' }"
                title="暖白黑字"
                @click="store.updateSettings({ theme: 'warm' })"
              >
                暖
              </button>
              <button
                :class="{ active: store.settings.theme === 'cool' }"
                title="冷色白字"
                @click="store.updateSettings({ theme: 'cool' })"
              >
                冷
              </button>
            </div>
            <div class="segmented">
              <button
                v-for="level in [1, 2, 3]"
                :key="level"
                :class="{ active: store.settings.sizeLevel === level }"
                :title="`界面大小 ${level}`"
                @click="store.updateSettings({ sizeLevel: level })"
              >
                {{ level }}
              </button>
            </div>
            <button class="icon-button" title="关闭" @click="isPanelOpen = false">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <nav class="tabbar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>

        <main class="panel-body">
          <section v-if="activeTab === 'api'" class="page-stack">
            <div class="section-band">
              <div class="section-title">API 填写</div>
              <label class="field">
                <span>Persistent API Token</span>
                <input
                  type="password"
                  autocomplete="off"
                  :value="store.settings.token"
                  placeholder="pst-..."
                  @input="store.updateSettings({ token: ($event.target as HTMLInputElement).value })"
                />
              </label>
              <div class="inline-note">当前状态：{{ store.maskedToken() }}</div>
            </div>

            <div class="section-band">
              <div class="section-title">链接与测试</div>
              <label class="field">
                <span>生图接口</span>
                <input
                  :value="store.settings.endpoint"
                  @change="store.updateSettings({ endpoint: ($event.target as HTMLInputElement).value.trim() })"
                />
              </label>
              <label class="field">
                <span>订阅测试接口</span>
                <input
                  :value="store.settings.subscriptionEndpoint"
                  @change="
                    store.updateSettings({ subscriptionEndpoint: ($event.target as HTMLInputElement).value.trim() })
                  "
                />
              </label>
              <div class="button-row">
                <button class="primary-button" :disabled="testingAccount" @click="testAccount">
                  {{ testingAccount ? '测试中' : '测试账号' }}
                </button>
                <button class="secondary-button" :disabled="testingImage" @click="testImageEndpoint">
                  {{ testingImage ? '生图中' : '测试生图' }}
                </button>
              </div>
              <div v-if="testPreview" class="preview-box">
                <img :src="testPreview" alt="NAI 测试图" />
              </div>
            </div>

            <LatestLog />
          </section>

          <section v-else-if="activeTab === 'run'" class="page-stack">
            <div class="section-band">
              <div class="section-title">运行方式</div>
              <label class="switch-row">
                <span>
                  <strong>启用脚本</strong>
                  <small>关闭后不再自动处理楼层</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.enabled"
                  @change="store.updateSettings({ enabled: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="switch-row">
                <span>
                  <strong>自动处理新 AI 楼层</strong>
                  <small>监听回复完成事件</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.autoOnMessage"
                  @change="store.updateSettings({ autoOnMessage: ($event.target as HTMLInputElement).checked })"
                />
              </label>
            </div>

            <div class="section-band">
              <div class="section-title">图片存储</div>
              <div class="choice-grid">
                <button
                  v-for="mode in storageModes"
                  :key="mode.value"
                  :class="{ active: store.settings.storageMode === mode.value }"
                  @click="store.updateSettings({ storageMode: mode.value })"
                >
                  <strong>{{ mode.label }}</strong>
                  <span>{{ mode.desc }}</span>
                </button>
              </div>
              <label class="field compact-field">
                <span>缓存保留天数</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  :value="store.settings.imageTtlDays"
                  @change="updateNumber('imageTtlDays', $event)"
                />
                <small>默认 7 天。到期或被浏览器清理后，楼层会保留重新生成按钮。</small>
              </label>
              <label class="switch-row compact">
                <span>
                  <strong>生成后同时下载</strong>
                  <small>由浏览器保存到默认下载目录</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.autoDownload"
                  @change="store.updateSettings({ autoDownload: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="field">
                <span>下载文件名模板</span>
                <input
                  :value="store.settings.downloadNameTemplate"
                  @change="store.updateSettings({ downloadNameTemplate: ($event.target as HTMLInputElement).value })"
                />
                <small v-pre>可用占位：{{ messageId }}、{{ seed }}、{{ index }}、{{ ext }}</small>
              </label>
              <div class="button-row">
                <button class="secondary-button" :disabled="cacheBusy" @click="refreshCacheCount">
                  {{ cacheCount === null ? '统计缓存' : `缓存 ${cacheCount} 张` }}
                </button>
                <button class="secondary-button" :disabled="cacheBusy" @click="cleanExpiredCache">清理过期缓存</button>
                <button class="secondary-button danger-button" :disabled="cacheBusy" @click="clearCache">
                  清空缓存
                </button>
              </div>
            </div>

            <div class="section-band">
              <div class="section-title">会员免费范围</div>
              <div class="choice-grid paid-grid">
                <button
                  v-for="mode in paidModes"
                  :key="mode.value"
                  :class="{ active: store.settings.paidMode === mode.value }"
                  @click="store.updateSettings({ paidMode: mode.value })"
                >
                  <strong>{{ mode.label }}</strong>
                  <span>{{ mode.desc }}</span>
                </button>
              </div>
              <div v-if="costWarnings.length > 0" class="warning-box">
                <strong>当前参数已超出会员免费生图范围，生成可能消耗 Anlas</strong>
                <p v-for="item in costWarnings" :key="item">{{ item }}</p>
              </div>
              <div v-else class="success-box">当前参数处于会员免费生图范围内。</div>
            </div>
          </section>

          <section v-else-if="activeTab === 'settings'" class="settings-grid">
            <div class="section-band">
              <div class="section-title">模型与画布</div>
              <label class="field">
                <span>模型</span>
                <input
                  :value="store.settings.model"
                  @change="store.updateSettings({ model: ($event.target as HTMLInputElement).value.trim() })"
                />
                <small>默认使用 NAI Diffusion V4.5 Full；如果 NAI 更新模型名，可在这里直接改。</small>
              </label>
              <div class="two-col">
                <label class="field">
                  <span>宽度</span>
                  <input
                    type="number"
                    min="64"
                    step="64"
                    :value="store.settings.width"
                    @change="updateNumber('width', $event)"
                  />
                </label>
                <label class="field">
                  <span>高度</span>
                  <input
                    type="number"
                    min="64"
                    step="64"
                    :value="store.settings.height"
                    @change="updateNumber('height', $event)"
                  />
                </label>
              </div>
              <div class="preset-row">
                <button v-for="preset in sizePresets" :key="preset.label" @click="applySize(preset.w, preset.h)">
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <div class="section-band">
              <div class="section-title">采样参数</div>
              <div class="two-col">
                <label class="field">
                  <span>步数</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    :value="store.settings.steps"
                    @change="updateNumber('steps', $event)"
                  />
                  <small>越高越慢，超过 28 步通常有扣点风险。</small>
                </label>
                <label class="field">
                  <span>提示词强度</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    :value="store.settings.scale"
                    @change="updateNumber('scale', $event)"
                  />
                  <small>越高越贴提示词，但也更容易僵硬。</small>
                </label>
              </div>
              <div class="two-col">
                <label class="field">
                  <span>CFG Rescale</span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    :value="store.settings.cfgRescale"
                    @change="updateNumber('cfgRescale', $event)"
                  />
                  <small>用于缓和过强 CFG 的失真。</small>
                </label>
                <label class="field">
                  <span>张数</span>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    step="1"
                    :value="store.settings.nSamples"
                    @change="updateNumber('nSamples', $event)"
                  />
                  <small>多张通常会增加消耗。</small>
                </label>
              </div>
              <label class="field">
                <span>采样器</span>
                <select
                  :value="store.settings.sampler"
                  @change="store.updateSettings({ sampler: ($event.target as HTMLSelectElement).value })"
                >
                  <option v-for="sampler in samplers" :key="sampler" :value="sampler">{{ sampler }}</option>
                </select>
              </label>
              <label class="field">
                <span>噪声计划</span>
                <select
                  :value="store.settings.noiseSchedule"
                  @change="store.updateSettings({ noiseSchedule: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="karras">karras</option>
                  <option value="exponential">exponential</option>
                  <option value="polyexponential">polyexponential</option>
                  <option value="native">native</option>
                </select>
              </label>
            </div>

            <div class="section-band">
              <div class="section-title">质量与种子</div>
              <label class="switch-row compact">
                <span>
                  <strong>质量标签增强</strong>
                  <small>对应 NAI qualityToggle</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.qualityToggle"
                  @change="store.updateSettings({ qualityToggle: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="switch-row compact">
                <span>
                  <strong>SMEA</strong>
                  <small>改善部分构图，可能影响消耗和速度</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.sm"
                  @change="store.updateSettings({ sm: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="switch-row compact">
                <span>
                  <strong>动态 SMEA</strong>
                  <small>对应 sm_dyn</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.smDyn"
                  @change="store.updateSettings({ smDyn: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="switch-row compact">
                <span>
                  <strong>Brownian 噪声</strong>
                  <small>多数新采样推荐保持开启</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.preferBrownian"
                  @change="store.updateSettings({ preferBrownian: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="switch-row compact">
                <span>
                  <strong>动态阈值</strong>
                  <small>对应 dynamic_thresholding，通常只在特定旧参数中使用</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.dynamicThresholding"
                  @change="store.updateSettings({ dynamicThresholding: ($event.target as HTMLInputElement).checked })"
                />
              </label>
              <label class="switch-row compact">
                <span>
                  <strong>Euler 兼容模式</strong>
                  <small>对应 deliberate_euler_ancestral_bug，仅为复现旧图时保留</small>
                </span>
                <input
                  type="checkbox"
                  :checked="store.settings.deliberateEulerAncestralBug"
                  @change="
                    store.updateSettings({
                      deliberateEulerAncestralBug: ($event.target as HTMLInputElement).checked,
                    })
                  "
                />
              </label>
              <div class="two-col">
                <label class="field">
                  <span>种子模式</span>
                  <select
                    :value="store.settings.seedMode"
                    @change="
                      store.updateSettings({
                        seedMode: ($event.target as HTMLSelectElement).value as 'random' | 'fixed',
                      })
                    "
                  >
                    <option value="random">随机</option>
                    <option value="fixed">固定</option>
                  </select>
                </label>
                <label class="field">
                  <span>固定种子</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :disabled="store.settings.seedMode !== 'fixed'"
                    :value="store.settings.fixedSeed"
                    @change="updateNumber('fixedSeed', $event)"
                  />
                </label>
              </div>
              <div class="two-col">
                <label class="field">
                  <span>图片格式</span>
                  <select
                    :value="store.settings.imageFormat"
                    @change="
                      store.updateSettings({
                        imageFormat: ($event.target as HTMLSelectElement).value as 'png' | 'webp',
                      })
                    "
                  >
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </label>
                <label class="field">
                  <span>UC 预设</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="store.settings.ucPreset"
                    @change="updateNumber('ucPreset', $event)"
                  />
                  <small>对应 ucPreset。多数 V4/V4.5 流程保持 0。</small>
                </label>
              </div>
            </div>

            <div class="section-band wide">
              <div class="section-title">作者串</div>
              <textarea
                :value="store.settings.authorPrompt"
                rows="4"
                @change="store.updateSettings({ authorPrompt: ($event.target as HTMLTextAreaElement).value })"
              />
              <div class="inline-note">
                这里放固定作者串、画风串和质量词。发送给 NAI 时会自动拼到本楼正向提示词前面。
              </div>
            </div>

            <div class="section-band wide">
              <div class="section-title">负面提示词</div>
              <textarea
                :value="store.settings.negativePrompt"
                rows="6"
                @change="store.updateSettings({ negativePrompt: ($event.target as HTMLTextAreaElement).value })"
              />
              <div class="inline-note">世界书块内的 negative_prompt 会临时覆盖这里。</div>
            </div>
          </section>

          <section v-else-if="activeTab === 'assistant'" class="page-stack assistant-page">
            <div class="settings-grid">
              <div class="section-band">
                <div class="section-title">助手接口</div>
                <label class="field">
                  <span>API Key</span>
                  <input
                    type="password"
                    autocomplete="off"
                    :value="store.settings.assistantApiKey"
                    @input="store.updateSettings({ assistantApiKey: ($event.target as HTMLInputElement).value })"
                  />
                  <small>当前状态：{{ store.maskedAssistantApiKey() }}</small>
                </label>
                <label class="field">
                  <span>Base URL</span>
                  <input
                    :value="store.settings.assistantBaseUrl"
                    @change="
                      store.updateSettings({ assistantBaseUrl: ($event.target as HTMLInputElement).value.trim() })
                    "
                  />
                  <small>填写 OpenAI 兼容地址，例如 https://api.openai.com/v1。</small>
                </label>
                <div class="button-row">
                  <button class="primary-button" :disabled="assistantLoadingModels" @click="loadAssistantModels">
                    {{ assistantLoadingModels ? '拉取中' : '拉取模型并激活' }}
                  </button>
                  <button
                    class="secondary-button"
                    :disabled="store.settings.assistantModels.length === 0"
                    @click="store.updateSettings({ assistantEnabled: !store.settings.assistantEnabled })"
                  >
                    {{ store.settings.assistantEnabled ? '停用助手' : '激活助手' }}
                  </button>
                </div>
              </div>

              <div class="section-band">
                <div class="section-title">模型设置</div>
                <label class="field">
                  <span>模型</span>
                  <select
                    :value="store.settings.assistantModel"
                    @change="store.updateSettings({ assistantModel: ($event.target as HTMLSelectElement).value })"
                  >
                    <option value="">未选择</option>
                    <option v-for="model in store.settings.assistantModels" :key="model" :value="model">
                      {{ model }}
                    </option>
                  </select>
                </label>
                <label class="field">
                  <span>温度</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    :value="store.settings.assistantTemperature"
                    @change="updateNumber('assistantTemperature', $event)"
                  />
                  <small>越高越发散，提示词校对建议 0.5 到 0.9。</small>
                </label>
                <div :class="store.settings.assistantEnabled ? 'success-box' : 'warning-box'">
                  {{ store.settings.assistantEnabled ? '提示词助手已激活。' : '提示词助手尚未激活。' }}
                </div>
              </div>
            </div>

            <div class="section-band">
              <div class="section-title">对话</div>
              <div class="assistant-chat">
                <div v-if="store.assistantMessages.length === 0" class="empty-log">
                  可以问：这段正文适合怎样拆成正向、反向和多角色定位？
                </div>
                <div
                  v-for="message in store.assistantMessages"
                  :key="`${message.at}-${message.role}`"
                  class="assistant-message"
                  :class="`assistant-${message.role}`"
                >
                  <strong>{{ message.role === 'user' ? '你' : '助手' }}</strong>
                  <p>{{ message.content }}</p>
                </div>
              </div>
              <label class="field assistant-input">
                <span>输入</span>
                <textarea
                  v-model="assistantDraft"
                  rows="5"
                  :disabled="assistantSending"
                  placeholder="把正文、角色设定或你想要的画面贴在这里。"
                  @keydown.ctrl.enter.prevent="sendAssistantMessage"
                />
              </label>
              <div class="button-row">
                <button
                  class="primary-button"
                  :disabled="assistantSending || !assistantDraft.trim()"
                  @click="sendAssistantMessage"
                >
                  {{ assistantSending ? '发送中' : '发送' }}
                </button>
                <button class="secondary-button" :disabled="assistantSending" @click="insertAssistantTemplate">
                  插入格式模板
                </button>
                <button class="secondary-button danger-button" :disabled="assistantSending" @click="clearAssistantChat">
                  清空对话
                </button>
              </div>
            </div>
          </section>

          <section v-else class="page-stack">
            <LatestLog expanded />
          </section>
        </main>

        <footer v-if="isMobile" class="mobile-footer">
          <button class="secondary-button" @click="isPanelOpen = false">收起面板</button>
        </footer>
        <div v-if="!isMobile" class="resize-handle" @pointerdown="onResizePointerDown" />
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { fetchAssistantModels, requestAssistantReply } from './assistant';
import {
  buildNaiPayload,
  downloadImage,
  getCostWarnings,
  renderDownloadName,
  requestNaiImage,
  testSubscription,
  translateUnknownError,
} from './nai';
import { clearAllCachedImages, countCachedImages, deleteExpiredCachedImages } from './cache';
import { useNaiStore, type NaiPaidMode, type NaiSettings, type NaiStorageMode } from './store';

const store = useNaiStore();
type NumericSettingKey = Extract<
  keyof NaiSettings,
  | 'width'
  | 'height'
  | 'steps'
  | 'scale'
  | 'cfgRescale'
  | 'nSamples'
  | 'ucPreset'
  | 'fixedSeed'
  | 'imageTtlDays'
  | 'assistantTemperature'
>;

defineExpose({
  openPanel: () => {
    isPanelOpen.value = true;
  },
});

const hostWindow = window.parent;
const windowSize = reactive(getViewportSize());
const isMobile = computed(() => windowSize.width <= 760);
const isPanelOpen = ref(false);
const activeTab = ref<'api' | 'run' | 'settings' | 'assistant' | 'log'>('api');
const testingAccount = ref(false);
const testingImage = ref(false);
const testPreview = ref('');
const cacheBusy = ref(false);
const cacheCount = ref<number | null>(null);
const assistantLoadingModels = ref(false);
const assistantSending = ref(false);
const assistantDraft = ref('');

const tabs = [
  { key: 'api' as const, label: '接口' },
  { key: 'run' as const, label: '生成' },
  { key: 'settings' as const, label: 'NAI设置' },
  { key: 'assistant' as const, label: '提示词助手' },
  { key: 'log' as const, label: '日志' },
];

const storageModes: Array<{ value: NaiStorageMode; label: string; desc: string }> = [
  { value: 'cache', label: '浏览器缓存', desc: '按设置天数保留，聊天文件保持轻量' },
  { value: 'download', label: '缓存并下载', desc: '同时触发浏览器下载，楼层仍只保存记录' },
];

const paidModes: Array<{ value: NaiPaidMode; label: string; desc: string }> = [
  { value: 'block', label: '免费优先', desc: '超出免费范围时停止请求' },
  { value: 'warn', label: '提醒后允许', desc: '先提醒，再继续请求' },
  { value: 'allow', label: '直接允许', desc: '只显示状态，不阻止请求' },
];

const samplers = ['k_euler_ancestral', 'k_euler', 'k_dpmpp_2m', 'k_dpmpp_2s_ancestral', 'k_dpmpp_sde', 'ddim_v3'];

const sizePresets = [
  { label: '竖图', w: 832, h: 1216 },
  { label: '横图', w: 1216, h: 832 },
  { label: '方图', w: 1024, h: 1024 },
  { label: '轻测', w: 512, h: 512 },
];

const costWarnings = computed(() => getCostWarnings(store.settings));
const statusLine = computed(() => {
  const log = store.lastLog;
  if (log) return `${log.title} · ${formatTime(log.at)}`;
  if (costWarnings.value.length > 0) return '可能消耗 Anlas';
  return store.settings.enabled ? '待命' : '已关闭';
});
const hasShownAnlasWarning = ref(false);

watch(
  costWarnings,
  warnings => {
    if (warnings.length === 0) {
      hasShownAnlasWarning.value = false;
      return;
    }
    if (hasShownAnlasWarning.value) return;

    hasShownAnlasWarning.value = true;
    toastr.warning('当前参数已超出会员免费生图范围，生成可能消耗 Anlas。', 'NAI Anlas 提醒');
  },
  { immediate: true },
);

function getViewportSize(): { width: number; height: number } {
  const visualViewport = hostWindow.visualViewport;
  return {
    width: Math.floor(visualViewport?.width ?? hostWindow.innerWidth),
    height: Math.floor(visualViewport?.height ?? hostWindow.innerHeight),
  };
}

function updateNumber(key: NumericSettingKey, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.updateSettings({ [key]: value } as Partial<NaiSettings>);
}

function applySize(width: number, height: number): void {
  store.updateSettings({ width, height });
}

async function refreshCacheCount(): Promise<void> {
  cacheBusy.value = true;
  try {
    cacheCount.value = await countCachedImages();
    store.setLastLog({
      level: 'info',
      title: '缓存统计完成',
      message: `当前浏览器缓存中有 ${cacheCount.value} 张 NAI 图片。`,
      solution: '无需处理。缓存到期后会自动清理，也可以手动清理过期缓存。',
      detail: '',
    });
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({ level: 'error', ...translated });
    toastr.error(translated.message, translated.title);
  } finally {
    cacheBusy.value = false;
  }
}

async function cleanExpiredCache(): Promise<void> {
  cacheBusy.value = true;
  try {
    const count = await deleteExpiredCachedImages();
    cacheCount.value = await countCachedImages();
    store.setLastLog({
      level: 'success',
      title: '过期缓存已清理',
      message: `已清理 ${count} 张过期图片，当前剩余 ${cacheCount.value} 张。`,
      solution: '楼层中已过期的图片仍会保留重新生成按钮。',
      detail: '',
    });
    toastr.success('过期缓存已清理。');
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({ level: 'error', ...translated });
    toastr.error(translated.message, translated.title);
  } finally {
    cacheBusy.value = false;
  }
}

async function clearCache(): Promise<void> {
  if (!hostWindow.confirm('确定清空所有 NAI 图片缓存吗？楼层会保留重新生成按钮。')) return;

  cacheBusy.value = true;
  try {
    await clearAllCachedImages();
    cacheCount.value = 0;
    store.setLastLog({
      level: 'warning',
      title: '图片缓存已清空',
      message: '浏览器中的 NAI 图片缓存已清空。',
      solution: '需要恢复图片时，点击对应楼层下方的“重新生成”。',
      detail: '',
    });
    toastr.warning('NAI 图片缓存已清空。');
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({ level: 'error', ...translated });
    toastr.error(translated.message, translated.title);
  } finally {
    cacheBusy.value = false;
  }
}

async function loadAssistantModels(): Promise<void> {
  assistantLoadingModels.value = true;
  try {
    const models = await fetchAssistantModels(store.settings);
    const selectedModel = models.includes(store.settings.assistantModel)
      ? store.settings.assistantModel
      : (models[0] ?? '');
    store.updateSettings({
      assistantModels: models,
      assistantModel: selectedModel,
      assistantEnabled: Boolean(selectedModel),
    });
    store.setLastLog({
      level: 'success',
      title: '提示词助手已激活',
      message: `已拉取 ${models.length} 个模型，当前模型：${selectedModel || '未选择'}。`,
      solution: '现在可以在“提示词助手”页和模型讨论提示词写法。',
      detail: models.join('\n'),
    });
    toastr.success('提示词助手模型拉取成功。');
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({
      level: 'error',
      title: '提示词助手连接失败',
      message: translated.message,
      solution: '检查 API Key、Base URL 是否正确，以及接口是否允许浏览器跨域请求。',
      detail: translated.detail,
    });
    toastr.error(translated.message, '提示词助手连接失败');
  } finally {
    assistantLoadingModels.value = false;
  }
}

async function sendAssistantMessage(): Promise<void> {
  const content = assistantDraft.value.trim();
  if (!content || assistantSending.value) return;

  if (!store.settings.assistantEnabled) {
    toastr.warning('请先拉取模型并激活提示词助手。');
    return;
  }

  assistantSending.value = true;
  assistantDraft.value = '';
  const userMessage = { role: 'user' as const, content };
  store.addAssistantMessage(userMessage);

  try {
    const reply = await requestAssistantReply(store.settings, store.assistantMessages);
    store.addAssistantMessage({ role: 'assistant', content: reply });
    await nextTick();
  } catch (error) {
    const translated = translateUnknownError(error);
    store.addAssistantMessage({
      role: 'assistant',
      content: `请求失败：${translated.message}\n\n解决方案：检查 API Key、Base URL、模型名和接口跨域设置。`,
    });
    store.setLastLog({
      level: 'error',
      title: '提示词助手请求失败',
      message: translated.message,
      solution: '检查 API Key、Base URL、模型名和接口跨域设置。',
      detail: translated.detail,
    });
  } finally {
    assistantSending.value = false;
  }
}

function insertAssistantTemplate(): void {
  const template = `请根据下面这段正文，帮我拆成 NovelAI 可用的正向提示词、反向提示词，并判断是否需要多角色定位。

正文：

要求：
1. 固定作者串不要写进 positive，作者串由脚本面板管理。
2. 如果有多角色，请输出 characters，每个角色写 prompt 和 position。
3. 最后给出可直接复制到 <nai-image> 的 YAML 块。`;
  assistantDraft.value = assistantDraft.value.trim() ? `${assistantDraft.value.trim()}\n\n${template}` : template;
}

function clearAssistantChat(): void {
  if (!hostWindow.confirm('确定清空提示词助手对话吗？')) return;
  store.clearAssistantMessages();
}

function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso.slice(11, 19);
  }
}

async function testAccount(): Promise<void> {
  testingAccount.value = true;
  try {
    const data = await testSubscription(store.settings);
    store.setLastLog({
      level: 'success',
      title: '账号测试成功',
      message: `订阅状态：${data.active ? '可用' : '不可用'}，等级：${String(data.tier ?? '未知')}`,
      solution: '账号可以访问 NovelAI 订阅接口。下一步可测试生图接口。',
      detail: JSON.stringify(data, null, 2),
    });
    toastr.success('NovelAI 账号测试成功。');
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({ level: 'error', ...translated });
    toastr.error(translated.message, translated.title);
  } finally {
    testingAccount.value = false;
  }
}

async function testImageEndpoint(): Promise<void> {
  const warnings = getCostWarnings(store.settings, { width: 512, height: 512, steps: 28 });
  if (warnings.length > 0 && store.settings.paidMode === 'block') {
    store.setLastLog({
      level: 'warning',
      title: '测试被扣点策略阻止',
      message: warnings.join('\n'),
      solution: '测试生图固定使用 512x512 与 28 步；如果仍有提醒，请检查张数、SMEA 等设置。',
      detail: '',
    });
    return;
  }

  testingImage.value = true;
  testPreview.value = '';
  try {
    const payload = buildNaiPayload(store.settings, {
      prompt: 'best quality, very aesthetic, simple moonlit lake, no humans',
      negative_prompt: 'lowres, text, watermark',
      width: 512,
      height: 512,
      steps: 28,
      seed: 'random',
    });
    const image = await requestNaiImage(store.settings, payload);
    testPreview.value = image.dataUrl;

    if (store.settings.autoDownload) {
      const ext = image.mimeType.includes('webp') ? 'webp' : 'png';
      downloadImage(
        image,
        renderDownloadName(store.settings.downloadNameTemplate, { messageId: 0, seed: image.seed, ext }),
      );
    }

    store.setLastLog({
      level: 'success',
      title: '生图测试成功',
      message: `NAI 已返回测试图片，seed=${image.seed}。`,
      solution:
        warnings.length > 0 ? `本次测试存在提醒：\n${warnings.join('\n')}` : '接口、token 和 zip 解包流程可用。',
      detail: JSON.stringify(
        {
          model: payload.model,
          width: payload.parameters.width,
          height: payload.parameters.height,
          steps: payload.parameters.steps,
          sampler: payload.parameters.sampler,
        },
        null,
        2,
      ),
    });
    toastr.success('NovelAI 生图测试成功。');
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({ level: 'error', ...translated });
    toastr.error(translated.message, translated.title);
  } finally {
    testingImage.value = false;
  }
}

const LatestLog = defineComponent({
  props: {
    expanded: Boolean,
  },
  setup(props) {
    return () => {
      const log = store.lastLog;
      if (!log) {
        return h('div', { class: 'section-band' }, [
          h('div', { class: 'section-title' }, '最新日志'),
          h('div', { class: 'empty-log' }, '暂无日志'),
        ]);
      }
      return h('div', { class: ['section-band', 'log-band', `log-${log.level}`] }, [
        h('div', { class: 'section-title' }, '最新日志'),
        h('div', { class: 'log-head' }, [h('strong', log.title), h('span', formatTime(log.at))]),
        h('p', { class: 'log-message' }, log.message),
        h('div', { class: 'solution-box' }, [h('strong', '解决方案'), h('p', log.solution || '无需处理。')]),
        props.expanded && log.detail ? h('pre', { class: 'log-detail' }, log.detail) : null,
      ]);
    };
  },
});

const FAB_SIZE = 46;
const GAP = 10;
const fabPos = reactive(readFabPos());
const isFabDragging = ref(false);
let fabStart = { x: 0, y: 0 };
let fabBase = { x: 0, y: 0 };
let fabMoved = false;

const fabStyle = computed(() => ({
  left: `${fabPos.x}px`,
  top: `${fabPos.y}px`,
}));

function defaultFabPos() {
  return {
    x: Math.max(GAP, hostWindow.innerWidth - FAB_SIZE - 22),
    y: Math.max(GAP, hostWindow.innerHeight * 0.42),
  };
}

function readFabPos() {
  try {
    const raw = hostWindow.localStorage.getItem('nai-image-fab');
    if (raw) return clampFabPos(JSON.parse(raw) as { x: number; y: number });
  } catch {
    // ignore
  }
  return clampFabPos(defaultFabPos());
}

function clampFabPos(pos: { x: number; y: number }) {
  return {
    x: _.clamp(pos.x, GAP, Math.max(GAP, hostWindow.innerWidth - FAB_SIZE - GAP)),
    y: _.clamp(pos.y, GAP, Math.max(GAP, hostWindow.innerHeight - FAB_SIZE - GAP)),
  };
}

function saveFabPos(): void {
  try {
    hostWindow.localStorage.setItem('nai-image-fab', JSON.stringify({ x: fabPos.x, y: fabPos.y }));
  } catch {
    // ignore
  }
}

function onFabPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return;
  event.preventDefault();
  fabMoved = false;
  fabStart = { x: event.screenX, y: event.screenY };
  fabBase = { x: fabPos.x, y: fabPos.y };
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(event: PointerEvent): void {
  const dx = event.screenX - fabStart.x;
  const dy = event.screenY - fabStart.y;
  if (!fabMoved && Math.abs(dx) + Math.abs(dy) < 5) return;
  fabMoved = true;
  isFabDragging.value = true;
  const next = clampFabPos({ x: fabBase.x + dx, y: fabBase.y + dy });
  fabPos.x = next.x;
  fabPos.y = next.y;
}

function onFabPointerUp(): void {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isFabDragging.value = false;
  saveFabPos();
  if (!fabMoved) isPanelOpen.value = true;
}

const panelSize = reactive(readPanelSize());
const panelOffset = ref<{ x: number; y: number } | null>(null);
let panelStart = { x: 0, y: 0 };
let panelBase = { x: 0, y: 0 };

const panelStyle = computed(() => {
  if (isMobile.value) {
    const height = Math.floor(windowSize.height * 0.92);
    return {
      left: '0px',
      top: `${windowSize.height - height}px`,
      width: '100vw',
      height: `${height}px`,
    };
  }
  const size = desktopPanelSize();
  const pos = panelOffset.value ?? {
    x: Math.max(GAP, (windowSize.width - size.w) / 2),
    y: Math.max(GAP, (windowSize.height - size.h) / 2),
  };
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${size.w}px`,
    height: `${size.h}px`,
  };
});

function readPanelSize() {
  try {
    const raw = hostWindow.localStorage.getItem('nai-image-panel-size');
    if (raw) return JSON.parse(raw) as { w: number; h: number };
  } catch {
    // ignore
  }
  return { w: 980, h: 620 };
}

function savePanelSize(): void {
  try {
    hostWindow.localStorage.setItem('nai-image-panel-size', JSON.stringify(panelSize));
  } catch {
    // ignore
  }
}

function desktopPanelSize() {
  const scale = store.settings.sizeLevel === 3 ? 1.12 : store.settings.sizeLevel === 2 ? 1.04 : 1;
  const maxW = Math.floor(windowSize.width * 0.92);
  const maxH = Math.floor(windowSize.height * 0.88);
  return {
    w: _.clamp(Math.floor(panelSize.w * scale), 760, maxW),
    h: _.clamp(Math.floor(panelSize.h * scale), 520, maxH),
  };
}

function onPanelPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return;
  event.preventDefault();
  const current = panelOffset.value ?? {
    x: Number.parseFloat(String(panelStyle.value.left)),
    y: Number.parseFloat(String(panelStyle.value.top)),
  };
  panelStart = { x: event.screenX, y: event.screenY };
  panelBase = current;
  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(event: PointerEvent): void {
  const size = desktopPanelSize();
  panelOffset.value = {
    x: _.clamp(panelBase.x + event.screenX - panelStart.x, GAP, Math.max(GAP, windowSize.width - size.w - GAP)),
    y: _.clamp(panelBase.y + event.screenY - panelStart.y, GAP, Math.max(GAP, windowSize.height - size.h - GAP)),
  };
}

function onPanelPointerUp(): void {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
}

let resizeStart = { x: 0, y: 0 };
let resizeBase = { w: 0, h: 0 };

function onResizePointerDown(event: PointerEvent): void {
  event.preventDefault();
  event.stopPropagation();
  resizeStart = { x: event.screenX, y: event.screenY };
  resizeBase = { w: panelSize.w, h: panelSize.h };
  hostWindow.addEventListener('pointermove', onResizePointerMove);
  hostWindow.addEventListener('pointerup', onResizePointerUp);
}

function onResizePointerMove(event: PointerEvent): void {
  panelSize.w = _.clamp(resizeBase.w + event.screenX - resizeStart.x, 760, Math.floor(windowSize.width * 0.92));
  panelSize.h = _.clamp(resizeBase.h + event.screenY - resizeStart.y, 520, Math.floor(windowSize.height * 0.88));
}

function onResizePointerUp(): void {
  hostWindow.removeEventListener('pointermove', onResizePointerMove);
  hostWindow.removeEventListener('pointerup', onResizePointerUp);
  savePanelSize();
}

let swipeStartY = 0;

function onMobileSwipeStart(event: PointerEvent): void {
  swipeStartY = event.clientY;
  hostWindow.addEventListener('pointerup', onMobileSwipeEnd);
}

function onMobileSwipeEnd(event: PointerEvent): void {
  hostWindow.removeEventListener('pointerup', onMobileSwipeEnd);
  if (event.clientY - swipeStartY > 45) isPanelOpen.value = false;
}

function onResizeWindow(): void {
  const size = getViewportSize();
  windowSize.width = size.width;
  windowSize.height = size.height;
  const next = clampFabPos(fabPos);
  fabPos.x = next.x;
  fabPos.y = next.y;

  if (panelOffset.value && !isMobile.value) {
    const panel = desktopPanelSize();
    panelOffset.value = {
      x: _.clamp(panelOffset.value.x, GAP, Math.max(GAP, windowSize.width - panel.w - GAP)),
      y: _.clamp(panelOffset.value.y, GAP, Math.max(GAP, windowSize.height - panel.h - GAP)),
    };
  }
}

onMounted(() => {
  hostWindow.addEventListener('resize', onResizeWindow);
  hostWindow.visualViewport?.addEventListener('resize', onResizeWindow);
});

onUnmounted(() => {
  hostWindow.removeEventListener('resize', onResizeWindow);
  hostWindow.visualViewport?.removeEventListener('resize', onResizeWindow);
});
</script>

<style scoped>
.nai-root {
  --font-size: 13px;
  --title-size: 15px;
  --radius: 8px;
  --shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
  position: relative;
  font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif;
  line-height: 1.45;
  letter-spacing: 0;
}
.nai-root.size-2 {
  --font-size: 14px;
  --title-size: 16px;
}
.nai-root.size-3 {
  --font-size: 15px;
  --title-size: 17px;
}
.theme-warm {
  --bg: #f8f3ea;
  --surface: #fffaf3;
  --surface-2: #f1e8dc;
  --text: #181512;
  --muted: #6e6258;
  --subtle: #8a7c70;
  --border: #dfd2c3;
  --accent: #2f6f9f;
  --accent-strong: #174f78;
  --accent-soft: rgba(47, 111, 159, 0.12);
  --accent-button: #2f6f9f;
  --accent-button-hover: #174f78;
  --primary-button-text: #fffdf8;
  --input: #fffdf8;
  --danger: #a33a2b;
  --success: #16744a;
  --warning: #8f6200;
  --danger-soft: rgba(163, 58, 43, 0.1);
  --success-soft: rgba(22, 116, 74, 0.1);
  --warning-soft: rgba(143, 98, 0, 0.11);
  color-scheme: light;
}
.theme-cool {
  --bg: #0b1117;
  --surface: #121b23;
  --surface-2: #182632;
  --text: #f7fbff;
  --muted: #c0cfda;
  --subtle: #9aafbf;
  --border: #2b4355;
  --accent: #6ec7ed;
  --accent-strong: #c7efff;
  --accent-soft: rgba(110, 199, 237, 0.16);
  --accent-button: #2f7fa8;
  --accent-button-hover: #3d98c0;
  --primary-button-text: #f7fbff;
  --input: #0e1821;
  --danger: #ffb4a8;
  --success: #8edfb5;
  --warning: #ffd27d;
  --danger-soft: rgba(255, 180, 168, 0.12);
  --success-soft: rgba(142, 223, 181, 0.12);
  --warning-soft: rgba(255, 210, 125, 0.13);
  color-scheme: dark;
}
button,
input,
select,
textarea {
  font: inherit;
  letter-spacing: 0;
}
button {
  min-width: 0;
  user-select: none;
}
.nai-fab {
  position: fixed;
  z-index: 9999;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow);
  display: grid;
  place-items: center;
  cursor: grab;
  padding: 0;
  touch-action: none;
}
.nai-fab:hover {
  filter: brightness(1.04);
}
.nai-fab.dragging {
  cursor: grabbing;
}
.nai-fab svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}
.nai-panel {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  color: var(--text);
  box-shadow: var(--shadow);
  font-size: var(--font-size);
}
.nai-panel.mobile {
  border-radius: 18px 18px 0 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
}
.mobile-grip {
  display: flex;
  justify-content: center;
  padding: 8px 0 2px;
  touch-action: none;
}
.mobile-grip span {
  width: 42px;
  height: 4px;
  border-radius: 99px;
  background: var(--border);
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  cursor: grab;
  touch-action: none;
}
.mobile .panel-header {
  cursor: default;
}
.title-block {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.title-block strong {
  font-size: var(--title-size);
  color: var(--text);
}
.title-block span {
  overflow: hidden;
  color: var(--muted);
  font-size: calc(var(--font-size) - 2px);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.segmented {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-2);
}
.segmented button {
  min-width: 30px;
  height: 30px;
  border: 0;
  border-right: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
}
.segmented button:last-child {
  border-right: 0;
}
.segmented button.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 700;
}
.icon-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
}
.icon-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}
.tabbar {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.tabbar button {
  min-width: 0;
  flex: 1;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-weight: 650;
  padding: 10px 6px;
  white-space: nowrap;
}
.tabbar button.active {
  border-bottom-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
}
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.section-band {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 12px;
}
.section-band.wide {
  grid-column: 1 / -1;
}
.section-title {
  margin-bottom: 10px;
  color: var(--accent-strong);
  font-size: calc(var(--font-size) - 1px);
  font-weight: 750;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
  color: var(--text);
}
.field span,
.field strong {
  font-weight: 650;
}
.field small,
.inline-note {
  color: var(--subtle);
  font-size: calc(var(--font-size) - 2px);
}
input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--input);
  color: var(--text);
  outline: none;
  padding: 8px 10px;
}
input::placeholder,
textarea::placeholder {
  color: var(--subtle);
  opacity: 0.78;
}
option {
  background: var(--input);
  color: var(--text);
}
textarea {
  min-height: 120px;
  resize: vertical;
}
input:focus,
select:focus,
textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
input:disabled {
  opacity: 0.55;
}
.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.preset-row,
.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preset-row button,
.primary-button,
.secondary-button {
  border-radius: 7px;
  cursor: pointer;
  font-weight: 700;
  padding: 8px 12px;
}
.preset-row button,
.secondary-button {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
}
.danger-button {
  border-color: var(--danger);
  color: var(--danger);
}
.primary-button {
  border: 1px solid var(--accent-button);
  background: var(--accent-button);
  color: var(--primary-button-text);
}
.primary-button:hover:not(:disabled) {
  border-color: var(--accent-button-hover);
  background: var(--accent-button-hover);
}
.secondary-button:hover:not(:disabled),
.preset-row button:hover:not(:disabled),
.choice-grid button:hover:not(:disabled),
.segmented button:hover:not(:disabled),
.icon-button:hover:not(:disabled) {
  border-color: var(--accent);
}
.primary-button:disabled,
.secondary-button:disabled {
  cursor: wait;
  opacity: 0.6;
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 0;
  color: var(--text);
}
.switch-row.compact {
  padding: 7px 0;
}
.switch-row span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.switch-row small {
  color: var(--subtle);
}
.switch-row input {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  accent-color: var(--accent);
  box-shadow: none;
}
.choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.choice-grid button {
  min-height: 76px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  padding: 10px;
  text-align: left;
  overflow-wrap: anywhere;
}
.choice-grid button strong,
.choice-grid button span {
  display: block;
}
.choice-grid button span {
  margin-top: 4px;
  color: var(--subtle);
  font-size: calc(var(--font-size) - 2px);
}
.choice-grid button.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.choice-grid button.active strong {
  color: var(--accent-strong);
}
.warning-box,
.success-box,
.solution-box {
  margin-top: 10px;
  border-radius: var(--radius);
  padding: 10px;
}
.warning-box {
  border: 1px solid var(--warning);
  background: var(--warning-soft);
  color: var(--text);
}
.success-box {
  border: 1px solid var(--success);
  background: var(--success-soft);
  color: var(--text);
}
.warning-box p,
.solution-box p,
.log-message {
  margin: 4px 0 0;
  white-space: pre-wrap;
}
.preview-box {
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
}
.preview-box img {
  display: block;
  max-height: 220px;
  width: 100%;
  object-fit: contain;
}
.log-band {
  border-left-width: 4px;
}
.log-success {
  border-left-color: var(--success);
}
.log-error {
  border-left-color: var(--danger);
}
.log-warning {
  border-left-color: var(--warning);
}
.log-info {
  border-left-color: var(--accent);
}
.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.log-head span,
.empty-log {
  color: var(--subtle);
  font-size: calc(var(--font-size) - 2px);
}
.solution-box {
  border: 1px solid var(--border);
  background: var(--surface-2);
}
.log-detail,
.code-sample {
  overflow: auto;
  max-height: 260px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--input);
  color: var(--text);
  font-family: Consolas, 'Microsoft YaHei Mono', monospace;
  font-size: calc(var(--font-size) - 2px);
  padding: 10px;
  white-space: pre-wrap;
}
.assistant-page .settings-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.assistant-chat {
  display: flex;
  min-height: 210px;
  max-height: 320px;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--input);
  padding: 10px;
}
.assistant-message {
  max-width: 86%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  padding: 9px 10px;
}
.assistant-message strong {
  display: block;
  margin-bottom: 4px;
  color: var(--accent-strong);
  font-size: calc(var(--font-size) - 2px);
}
.assistant-message p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.assistant-user {
  align-self: flex-end;
  background: var(--accent-soft);
}
.assistant-assistant {
  align-self: flex-start;
}
.assistant-input {
  margin-top: 10px;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
}
.resize-handle::after {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--border);
  border-bottom: 2px solid var(--border);
  content: '';
}
.mobile-footer {
  padding: 9px 14px max(12px, env(safe-area-inset-bottom, 12px));
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.mobile-footer button {
  width: 100%;
}
.nai-fade-enter-active,
.nai-fade-leave-active,
.nai-panel-motion-enter-active,
.nai-panel-motion-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.nai-fade-enter-from,
.nai-fade-leave-to,
.nai-panel-motion-enter-from,
.nai-panel-motion-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
@media (max-width: 760px) {
  .panel-body {
    padding: 12px;
  }
  .settings-grid,
  .assistant-page .settings-grid,
  .two-col,
  .choice-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    gap: 5px;
  }
  .segmented button {
    min-width: 28px;
  }
}
@media (max-width: 520px) {
  .panel-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  .tabbar {
    overflow-x: auto;
  }
  .tabbar button {
    flex: 1 0 72px;
  }
}
</style>
