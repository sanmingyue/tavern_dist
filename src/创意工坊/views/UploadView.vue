<template>
  <div class="ws-upload" :class="{ mobile: isMobile }">
    <!-- 未登录提示 -->
    <div v-if="!isLoggedIn" class="ws-login-prompt">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      <p>请先登录才能上传作品</p>
      <button class="ws-login-btn" @click="auth.login()">请先到「账号」页面登录</button>
    </div>

    <!-- 已登录：上传表单 -->
    <div v-else class="ws-upload-form">
      <div class="ws-form-header">
        <span class="ws-form-title">{{ isEditMode ? '更新作品' : '上传新作品' }}</span>
        <span v-if="isEditMode" class="ws-form-hint">更新后需要管理员重新审核</span>
        <span v-else class="ws-form-hint">提交后需要管理员审核通过才能公开显示</span>
      </div>

      <div class="ws-form-body">
        <!-- 封面图上传 -->
        <div class="ws-form-group">
          <label class="ws-label">封面图 *（展示时将自动应用宽比例羽化）</label>
          <div class="ws-cover-upload" @click="triggerCoverSelect">
            <img v-if="coverPreview" :src="coverPreview" class="ws-cover-preview" />
            <div v-else class="ws-cover-placeholder">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>点击上传封面</span>
            </div>
            <input
              ref="coverInputRef"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              style="display: none"
              @change="onCoverSelected"
            />
          </div>
        </div>

        <!-- 类型 -->
        <div class="ws-form-group">
          <label class="ws-label">类型 *</label>
          <select v-model="form.type" class="ws-input" @change="onTypeChange">
            <option value="" disabled>选择作品类型</option>
            <option v-for="t in WORK_TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
          <div v-if="form.type" class="ws-type-desc">{{ typeDescriptions[form.type] || '' }}</div>
        </div>

        <!-- card_addon 子类型 -->
        <div v-if="form.type === 'card_addon'" class="ws-form-group">
          <label class="ws-label">配套内容类型 *</label>
          <select v-model="form.addon_subtype" class="ws-input">
            <option value="" disabled>选择配套内容类型</option>
            <option v-for="s in ADDON_SUBTYPES" :key="s.key" :value="s.key">{{ s.label }}</option>
          </select>
        </div>

        <!-- 标题 -->
        <div class="ws-form-group">
          <label class="ws-label">标题 *</label>
          <input v-model="form.title" class="ws-input" placeholder="给你的作品起个名字" maxlength="100" />
        </div>

        <!-- 描述 -->
        <div class="ws-form-group">
          <label class="ws-label">描述</label>
          <textarea
            v-model="form.description"
            class="ws-textarea"
            placeholder="简单介绍一下你的作品..."
            rows="3"
            maxlength="500"
          ></textarea>
        </div>

        <!-- 标签 (合集不需要标签) -->
        <div v-if="form.type !== 'collection'" class="ws-form-group">
          <label class="ws-label">标签（逗号或空格分隔）</label>
          <input v-model="tagInput" class="ws-input" placeholder="恋爱, 日常, 奇幻" />
        </div>

        <!-- 角色名 (persona/card_addon/character 需要) -->
        <div v-if="needsCharName" class="ws-form-group">
          <label class="ws-label">角色名{{ form.type === 'character' ? '（可选）' : ' *' }}</label>
          <input v-model="form.char_name" class="ws-input" placeholder="输入角色的名字" maxlength="50" />
        </div>

        <!-- 人设/OC：世界书条目属性 -->
        <div v-if="form.type === 'persona' || addonIsPersona" class="ws-form-group ws-entry-panel">
          <label class="ws-label">世界书条目属性</label>
          <div class="ws-entry-grid">
            <div class="ws-entry-field">
              <span class="ws-entry-label">激活方式</span>
              <select v-model="personaEntry.strategyType" class="ws-input">
                <option value="constant">蓝灯：常驻</option>
                <option value="selective">绿灯：关键词触发</option>
              </select>
            </div>
            <div class="ws-entry-field">
              <span class="ws-entry-label">插入位置</span>
              <select v-model="personaEntry.position" class="ws-input">
                <option value="before_character_definition">角色定义之前</option>
                <option value="after_character_definition">角色定义之后</option>
                <option value="before_example_messages">示例消息之前</option>
                <option value="after_example_messages">示例消息之后</option>
                <option value="before_author_note">作者注释之前</option>
                <option value="after_author_note">作者注释之后</option>
                <option value="at_depth">指定深度</option>
              </select>
            </div>
            <div class="ws-entry-field ws-entry-wide">
              <span class="ws-entry-label"
                >主关键词{{ personaEntry.strategyType === 'selective' ? ' *' : '（绿灯时生效）' }}</span
              >
              <input v-model="personaEntry.keys" class="ws-input" placeholder="用逗号或换行分隔，例如：秋啾啾, 啾啾" />
            </div>
            <div class="ws-entry-field ws-entry-wide">
              <span class="ws-entry-label">次关键词</span>
              <input v-model="personaEntry.secondaryKeys" class="ws-input" placeholder="可选，用逗号或换行分隔" />
            </div>
            <div class="ws-entry-field">
              <span class="ws-entry-label">次关键词逻辑</span>
              <select v-model="personaEntry.secondaryLogic" class="ws-input">
                <option value="and_any">任意一个存在</option>
                <option value="and_all">全部存在</option>
                <option value="not_all">不是全部存在</option>
                <option value="not_any">全部不存在</option>
              </select>
            </div>
            <div class="ws-entry-field">
              <span class="ws-entry-label">扫描深度</span>
              <div class="ws-entry-inline">
                <select v-model="personaEntry.scanDepthMode" class="ws-input">
                  <option value="same_as_global">跟随全局</option>
                  <option value="custom">自定义</option>
                </select>
                <input
                  v-if="personaEntry.scanDepthMode === 'custom'"
                  v-model.number="personaEntry.scanDepth"
                  class="ws-input ws-entry-number"
                  type="number"
                  min="1"
                  max="99"
                />
              </div>
            </div>
            <div class="ws-entry-field">
              <span class="ws-entry-label">消息身份</span>
              <select v-model="personaEntry.role" class="ws-input">
                <option value="system">system</option>
                <option value="assistant">assistant</option>
                <option value="user">user</option>
              </select>
            </div>
            <div class="ws-entry-field">
              <span class="ws-entry-label">深度 / 顺序</span>
              <div class="ws-entry-inline">
                <input
                  v-model.number="personaEntry.depth"
                  class="ws-input ws-entry-number"
                  type="number"
                  min="0"
                  max="99"
                />
                <input
                  v-model.number="personaEntry.order"
                  class="ws-input ws-entry-number"
                  type="number"
                  min="-9999"
                  max="9999"
                />
              </div>
            </div>
            <div class="ws-entry-field">
              <span class="ws-entry-label">激活概率 %</span>
              <input v-model.number="personaEntry.probability" class="ws-input" type="number" min="0" max="100" />
            </div>
            <div class="ws-entry-field ws-entry-checks">
              <label class="ws-checkline">
                <input v-model="personaEntry.preventIncoming" type="checkbox" />
                禁止被递归激活
              </label>
              <label class="ws-checkline">
                <input v-model="personaEntry.preventOutgoing" type="checkbox" />
                禁止激活其他条目
              </label>
            </div>
          </div>
        </div>

        <!-- 资源文件上传 (regex/worldbook/character, 以及 card_addon 子类型非 persona 时) -->
        <div v-if="needsResourceFile" class="ws-form-group">
          <label class="ws-label">{{ resourceFileLabel }} *</label>
          <div class="ws-file-upload" @click="triggerResourceFileSelect">
            <div v-if="!resourceFile" class="ws-file-placeholder">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{{ resourceFilePlaceholder }}</span>
            </div>
            <div v-else class="ws-file-selected">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{{ resourceFile.name }} ({{ (resourceFile.size / 1024).toFixed(1) }} KB)</span>
              <button class="ws-file-clear" title="清除" @click.stop="resourceFile = null">×</button>
            </div>
            <input
              ref="resourceFileInputRef"
              type="file"
              :accept="resourceFileAccept"
              style="display: none"
              @change="onResourceFileSelected"
            />
          </div>
        </div>

        <!-- 角色卡链接 (character 必填, card_addon 必填, 其他可选) -->
        <div v-if="showCardLink" class="ws-form-group">
          <label class="ws-label"> 角色卡链接{{ needsCardLinkRequired ? ' *（审核依据）' : '（可选）' }} </label>
          <input v-model="form.card_link" class="ws-input" placeholder="角色卡名称或下载链接" />
          <div v-if="form.type === 'character'" class="ws-field-hint">
            必须填写自己的角色卡链接，用于证明是作者本人上传
          </div>
          <div v-if="form.type === 'card_addon'" class="ws-field-hint">必须提供目标角色卡链接</div>
        </div>

        <!-- collection 类型：选择自己的作品 -->
        <div v-if="form.type === 'collection'" class="ws-form-group">
          <label class="ws-label"
            >包含的作品 *
            <span class="ws-field-hint" style="margin-left: 8px">已选 {{ selectedWorkIds.length }} 件</span>
          </label>
          <div class="ws-collection-pick-list">
            <div v-if="myWorks.length === 0" class="ws-collection-empty">
              您还没有已发布的作品，请先上传其他类型的作品。
            </div>
            <label
              v-for="w in myWorks"
              :key="w.id"
              class="ws-pick-item"
              :class="{ selected: selectedWorkIds.includes(w.id) }"
            >
              <input v-model="selectedWorkIds" type="checkbox" :value="w.id" />
              <div class="ws-pick-thumb">
                <img v-if="w.cover_url" :src="w.cover_url" />
                <span v-else class="ws-pick-thumb-fallback">{{ getTypeLabel(w.type) }}</span>
              </div>
              <div class="ws-pick-body">
                <span class="ws-pick-title">{{ w.char_name || w.title }}</span>
                <span class="ws-type-badge-sm">{{ getTypeLabel(w.type) }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 内容 textarea (仅 persona, 以及 card_addon 子类型为 persona 时) -->
        <div v-if="needsContentTextarea" class="ws-form-group">
          <label class="ws-label">{{ form.type === 'persona' || addonIsPersona ? '人设正文 *' : '内容 *' }}</label>
          <textarea
            v-model="form.content"
            class="ws-textarea ws-content-area"
            :placeholder="contentPlaceholder"
            rows="10"
          ></textarea>
          <div class="ws-char-count">{{ contentSize }}</div>
        </div>

        <!-- 作者名提示（worldbook 类型） -->
        <div v-if="form.type === 'worldbook'" class="ws-author-notice">
          共享世界书将自动附带你的作者名，导入时将创建为「[{{ authorName }}] {{ form.title || '作品名' }}」
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="ws-form-footer">
        <button class="ws-submit-btn" :disabled="!canSubmit || submitting" @click="onSubmit">
          <svg
            v-if="submitting"
            class="ws-spin"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ submitting ? '提交中...' : (isEditMode ? '提交更新' : '提交审核') }}
        </button>
      </div>
    </div>

    <!-- 裁切弹窗 -->
    <Transition name="ws-dialog">
      <div v-if="showCropper" class="ws-cropper-overlay" @click.self="showCropper = false">
        <div class="ws-cropper-dialog">
          <div class="ws-cropper-title">
            裁剪封面图
            <span class="ws-cropper-ratio-hint">
              {{ isMobile ? '（拖动移动 · 双指缩放 · 4:3）' : '（拖动移动 · 滚轮缩放 · 4:3）' }}
            </span>
          </div>
          <div class="ws-cropper-wrap">
            <canvas
              ref="canvasRef"
              class="ws-crop-canvas"
              @mousedown.stop="onCropMouseDown"
              @mousemove.stop="onCropMouseMove"
              @mouseup.stop="onCropMouseUp"
              @mouseleave="onCropMouseUp"
              @wheel.prevent.stop="onCropWheel"
              @touchstart.stop.prevent="onCropTouchStart"
              @touchmove.stop.prevent="onCropTouchMove"
              @touchend.stop="onCropTouchEnd"
            ></canvas>
          </div>
          <div class="ws-cropper-actions">
            <button class="ws-action-btn" @click="showCropper = false">取消</button>
            <button class="ws-action-btn ws-btn-import" @click="onCropConfirm">确认裁剪</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { fetchMyWorks, uploadWork, updateWork } from '../api';
import { DEBUG_CURRENT_USER, DEBUG_MOCK_CONTENT, debugWorks, mockCollectionChildren, nextDebugId } from '../debugStore';
import {
  ADDON_SUBTYPES,
  DEBUG_MODE,
  encodeFileTypeWithSubtype,
  FILE_UPLOAD_TYPES,
  getTypeLabel,
  WORK_TYPES,
  parseAddonSubtype,
  type MyWork,
} from '../types';

const props = defineProps<{
  isMobile: boolean;
  auth: any;
  editWork?: any;
}>();

const isLoggedIn = computed(() => DEBUG_MODE || props.auth.isLoggedIn.value);

const emit = defineEmits<{ uploaded: []; 'edit-done': [] }>();

/** 是否处于编辑模式 */
const isEditMode = computed(() => !!props.editWork);

/** 预填编辑数据 */
function prefillEditData(work: any) {
  if (!work) return;
  form.type = work.type || '';
  form.title = work.title || '';
  form.description = work.description || '';
  form.card_link = work.card_link || '';
  form.char_name = work.char_name || '';
  form.content = work.content || '';
  form.addon_subtype = '';
  tagInput.value = (work.tags || []).join(', ');
  if (work.type === 'card_addon' && work.file_type) {
    const sub = parseAddonSubtype(work.file_type);
    if (sub) form.addon_subtype = sub;
  }
  if (work.cover_url) coverPreview.value = work.cover_url;
  resourceFile.value = null;
  coverFile.value = null;
}

// 组件挂载时如果已有 editWork 则预填
onMounted(() => {
  if (props.editWork) prefillEditData(props.editWork);
});

// editWork 变化时也预填（应对动态切换）
watch(() => props.editWork, (work) => {
  if (work) prefillEditData(work);
});

const form = reactive({
  title: '',
  type: '' as string,
  description: '',
  content: '',
  card_link: '',
  char_name: '',
  addon_subtype: '' as string,
});
const tagInput = ref('');
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const coverInputRef = ref<HTMLInputElement | null>(null);
const resourceFile = ref<File | null>(null);
const resourceFileInputRef = ref<HTMLInputElement | null>(null);
const cardFile = ref<File | null>(null);
const cardFileInputRef = ref<HTMLInputElement | null>(null);
const disclaimerAgreed = ref(false);
const selectedWorkIds = ref<number[]>([]);
const myWorksFromApi = ref<MyWork[]>([]);

type EntryStrategyType = 'constant' | 'selective';
type EntrySecondaryLogic = 'and_any' | 'and_all' | 'not_all' | 'not_any';
type EntryPosition =
  | 'before_character_definition'
  | 'after_character_definition'
  | 'before_example_messages'
  | 'after_example_messages'
  | 'before_author_note'
  | 'after_author_note'
  | 'at_depth';
type EntryRole = 'system' | 'assistant' | 'user';

const personaEntry = reactive({
  strategyType: 'constant' as EntryStrategyType,
  keys: '',
  secondaryKeys: '',
  secondaryLogic: 'and_any' as EntrySecondaryLogic,
  scanDepthMode: 'same_as_global' as 'same_as_global' | 'custom',
  scanDepth: 4,
  position: 'before_character_definition' as EntryPosition,
  role: 'system' as EntryRole,
  depth: 0,
  order: 100,
  probability: 100,
  preventIncoming: true,
  preventOutgoing: true,
});

/** 可加入合集的自己作品 */
const myWorks = computed(() => {
  if (DEBUG_MODE) return debugWorks.filter(w => w.type !== 'collection' && w.author.username === DEBUG_CURRENT_USER);
  return myWorksFromApi.value.filter(w => w.type !== 'collection');
});

// 切换到合集类型时自动获取自己的作品
watch(
  () => form.type,
  async t => {
    if (t === 'collection' && !DEBUG_MODE && myWorksFromApi.value.length === 0) {
      try {
        const r = await fetchMyWorks();
        myWorksFromApi.value = r.works;
      } catch {
        /* ignore */
      }
    }
  },
);
const submitting = ref(false);

const showCropper = ref(false);
const cropperImg = ref('');

// ─── Canvas 裁剪器状态 ───
const canvasRef = ref<HTMLCanvasElement | null>(null);
const cropImgObj = ref<HTMLImageElement | null>(null);
const imgX = ref(0);
const imgY = ref(0);
const imgScale = ref(1);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const imgStartX = ref(0);
const imgStartY = ref(0);

// 裁剪框尺寸（居中固定 4:3）
function getCropBox(canvas: HTMLCanvasElement) {
  const margin = 30;
  const availW = canvas.width - margin * 2;
  const availH = canvas.height - margin * 2;
  let w = availW;
  let h = (w * 3) / 4;
  if (h > availH) {
    h = availH;
    w = (h * 4) / 3;
  }
  return { x: (canvas.width - w) / 2, y: (canvas.height - h) / 2, w, h };
}

function renderCropCanvas() {
  const canvas = canvasRef.value;
  const img = cropImgObj.value;
  if (!canvas || !img) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 画图片
  ctx.drawImage(img, imgX.value, imgY.value, img.width * imgScale.value, img.height * imgScale.value);
  // 画蒙版
  const cb = getCropBox(canvas);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(cb.x, cb.y, cb.w, cb.h);
  // 重画裁剪框内的图片
  ctx.drawImage(img, imgX.value, imgY.value, img.width * imgScale.value, img.height * imgScale.value);
  // 裁剪框边框
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cb.x, cb.y, cb.w, cb.h);
  // 三分线
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    ctx.moveTo(cb.x + (cb.w * i) / 3, cb.y);
    ctx.lineTo(cb.x + (cb.w * i) / 3, cb.y + cb.h);
    ctx.moveTo(cb.x, cb.y + (cb.h * i) / 3);
    ctx.lineTo(cb.x + cb.w, cb.y + (cb.h * i) / 3);
  }
  ctx.stroke();
  // 四角手柄
  const hs = 12;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  const corners = [
    [cb.x, cb.y],
    [cb.x + cb.w, cb.y],
    [cb.x, cb.y + cb.h],
    [cb.x + cb.w, cb.y + cb.h],
  ];
  corners.forEach(([cx, cy]) => {
    const sx = cx === cb.x ? 1 : -1;
    const sy = cy === cb.y ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + sx * hs, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * hs);
    ctx.stroke();
  });
}

function initCropCanvas(src: string) {
  nextTick(() => {
    // 等待一帧，确保 CSS 已经应用（移动端 flex 布局需要）
    requestAnimationFrame(() => {
      const canvas = canvasRef.value;
      if (!canvas) return;
      const w = canvas.offsetWidth || 680;
      // 如果 offsetHeight 为 0（flex 还未撑开），用 innerHeight 估算
      const h = canvas.offsetHeight > 20 ? canvas.offsetHeight : Math.round(window.innerHeight * 0.9 - 140);
      canvas.width = w;
      canvas.height = h;
      const img = new Image();
      img.onload = () => {
        cropImgObj.value = img;
        // 计算初始缩放，以 cover 方式填满画布
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        imgScale.value = Math.max(scaleX, scaleY);
        imgX.value = (canvas.width - img.width * imgScale.value) / 2;
        imgY.value = (canvas.height - img.height * imgScale.value) / 2;
        renderCropCanvas();
      };
      img.src = src;
    });
  });
}

function onCropMouseDown(e: MouseEvent) {
  isDragging.value = true;
  dragStartX.value = e.offsetX;
  dragStartY.value = e.offsetY;
  imgStartX.value = imgX.value;
  imgStartY.value = imgY.value;
}

function onCropMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  imgX.value = imgStartX.value + (e.offsetX - dragStartX.value);
  imgY.value = imgStartY.value + (e.offsetY - dragStartY.value);
  renderCropCanvas();
}

function onCropMouseUp() {
  isDragging.value = false;
}

function onCropWheel(e: WheelEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.11;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  imgX.value = mx - (mx - imgX.value) * zoomFactor;
  imgY.value = my - (my - imgY.value) * zoomFactor;
  imgScale.value *= zoomFactor;
  renderCropCanvas();
}

// ─── 触摸事件处理（移动端）───
let pinchStartDist = 0;
let pinchStartScale = 1;

function getTouchOffset(touch: Touch, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
}

function onCropTouchStart(e: TouchEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (e.touches.length === 1) {
    const pos = getTouchOffset(e.touches[0], canvas);
    isDragging.value = true;
    dragStartX.value = pos.x;
    dragStartY.value = pos.y;
    imgStartX.value = imgX.value;
    imgStartY.value = imgY.value;
  } else if (e.touches.length === 2) {
    isDragging.value = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchStartDist = Math.hypot(dx, dy);
    pinchStartScale = imgScale.value;
  }
}

function onCropTouchMove(e: TouchEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (e.touches.length === 1 && isDragging.value) {
    const pos = getTouchOffset(e.touches[0], canvas);
    imgX.value = imgStartX.value + (pos.x - dragStartX.value);
    imgY.value = imgStartY.value + (pos.y - dragStartY.value);
    renderCropCanvas();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (pinchStartDist === 0) return;
    const zoomFactor = dist / pinchStartDist;
    // 以两指中点为缩放中心
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * (canvas.width / rect.width);
    const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * (canvas.height / rect.height);
    const newScale = pinchStartScale * zoomFactor;
    const scaleDelta = newScale / imgScale.value;
    imgX.value = mx - (mx - imgX.value) * scaleDelta;
    imgY.value = my - (my - imgY.value) * scaleDelta;
    imgScale.value = newScale;
    renderCropCanvas();
  }
}

function onCropTouchEnd() {
  isDragging.value = false;
  pinchStartDist = 0;
}

watch(showCropper, val => {
  if (val && cropperImg.value) initCropCanvas(cropperImg.value);
});

const authorName = computed(() => {
  if (DEBUG_MODE) return DEBUG_CURRENT_USER;
  return props.auth.user.value?.display_name || props.auth.user.value?.username || '作者';
});

const typeDescriptions: Record<string, string> = {
  regex: '美化正则 -- 上传正则 JSON 文件，可直接导入到酒馆正则列表',
  persona: '人设/OC条目 -- 填写人设正文与世界书属性，可注入到角色卡绑定世界书',
  character: '角色卡 -- 上传自己的角色卡文件（JSON/PNG），需提供角色卡链接证明是作者',
  card_addon: '角色卡二创 -- 为特定角色卡提供配套世界书/正则/人设，需绑定目标角色卡',
  worldbook: '共享世界书 -- 上传完整世界书文件，导入时将自动附带作者名',
  collection: '作者合集 -- 上传封面并选择自己的作品组合成合集',
};

/** card_addon 子类型是否为 persona */
const addonIsPersona = computed(() => form.type === 'card_addon' && form.addon_subtype === 'persona');

/** 需要角色名的类型 */
const needsCharName = computed(() => {
  return form.type === 'persona' || form.type === 'card_addon' || form.type === 'character';
});

/** 需要资源文件上传（非 textarea 内容）的类型 */
const needsResourceFile = computed(() => {
  if (FILE_UPLOAD_TYPES.includes(form.type)) return true;
  // card_addon 子类型非 persona 时也需要文件上传
  if (form.type === 'card_addon' && form.addon_subtype && form.addon_subtype !== 'persona') return true;
  return false;
});

/** 需要 content textarea 的类型 */
const needsContentTextarea = computed(() => {
  if (form.type === 'collection') return false;
  if (form.type === 'persona') return true;
  if (addonIsPersona.value) return true;
  // 文件上传类型不需要 textarea
  if (needsResourceFile.value) return false;
  // card_addon 未选子类型时不显示任何输入
  if (form.type === 'card_addon' && !form.addon_subtype) return false;
  return false;
});

/** 资源文件的 accept 属性 */
const resourceFileAccept = computed(() => {
  if (form.type === 'character') return '.json,.png';
  return '.json';
});

/** 资源文件上传区标签 */
const resourceFileLabel = computed(() => {
  switch (form.type) {
    case 'regex':
      return '正则文件';
    case 'worldbook':
      return '世界书文件';
    case 'character':
      return '角色卡文件';
    case 'card_addon':
      if (form.addon_subtype === 'worldbook') return '世界书文件';
      if (form.addon_subtype === 'regex') return '正则文件';
      return '资源文件';
    default:
      return '资源文件';
  }
});

/** 资源文件 placeholder */
const resourceFilePlaceholder = computed(() => {
  if (form.type === 'character') return '点击选择 JSON 或 PNG 角色卡文件';
  if (form.type === 'regex') return '点击选择正则 JSON 文件';
  if (form.type === 'worldbook') return '点击选择世界书 JSON 文件';
  if (form.type === 'card_addon') {
    if (form.addon_subtype === 'worldbook') return '点击选择世界书 JSON 文件';
    if (form.addon_subtype === 'regex') return '点击选择正则 JSON 文件';
  }
  return '点击选择文件';
});

const contentPlaceholder = computed(() => {
  if (form.type === 'persona' || addonIsPersona.value) {
    return '填写人设正文；提交时会自动包装成世界书条目 JSON...';
  }
  return '在这里填写内容...';
});

const showCardLink = computed(() => {
  return ['regex', 'persona', 'character', 'card_addon', 'worldbook'].includes(form.type);
});

/** 角色卡链接是否必填 */
const needsCardLinkRequired = computed(() => {
  return form.type === 'character' || form.type === 'card_addon';
});

const contentSize = computed(() => {
  const bytes = new Blob([form.content]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
});

const canSubmit = computed(() => {
  if (!form.title.trim() || !form.type) return false;
  if (!coverFile.value && !isEditMode.value) return false; // 新上传时强制必须上传封面图

  // 角色名校验
  if (form.type === 'persona' && !form.char_name.trim()) return false;
  if (form.type === 'card_addon' && !form.char_name.trim()) return false;

  // persona 绿灯校验
  if (
    form.type === 'persona' &&
    personaEntry.strategyType === 'selective' &&
    splitEntryKeywords(personaEntry.keys).length === 0
  )
    return false;
  if (
    addonIsPersona.value &&
    personaEntry.strategyType === 'selective' &&
    splitEntryKeywords(personaEntry.keys).length === 0
  )
    return false;

  // 合集校验
  if (form.type === 'collection') return selectedWorkIds.value.length > 0;

  // 角色卡链接必填校验
  if (needsCardLinkRequired.value && !form.card_link.trim()) return false;

  // card_addon 子类型必填
  if (form.type === 'card_addon' && !form.addon_subtype) return false;

  // 资源文件校验（编辑模式下不必填，不选则保留原文件）
  if (needsResourceFile.value && !isEditMode.value) return !!resourceFile.value;

  // 内容校验（persona 和 addonIsPersona）
  if (needsContentTextarea.value) return !!form.content.trim();

  return true;
});

/** 类型切换时重置相关状态 */
function onTypeChange() {
  resourceFile.value = null;
  form.addon_subtype = '';
  form.content = '';
}

/** 触发资源文件选择 */
function triggerResourceFileSelect() {
  resourceFileInputRef.value?.click();
}

/** 资源文件选择回调 */
function onResourceFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    toastr.warning('资源文件不能超过 10MB');
    input.value = '';
    return;
  }
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const allowedExts = form.type === 'character' ? ['json', 'png'] : ['json'];
  if (!allowedExts.includes(ext)) {
    toastr.warning(`只支持 ${allowedExts.join('/')} 格式的文件`);
    input.value = '';
    return;
  }
  resourceFile.value = file;
  input.value = '';
}

function splitEntryKeywords(value: string): string[] {
  return _.uniq(
    value
      .split(/[,，;；\n]+/)
      .map(item => item.trim())
      .filter(Boolean),
  );
}

function clampNumber(value: number, min: number, max: number): number {
  const normalized = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, Math.round(normalized)));
}

function buildPersonaWorldbookContent(): string {
  const entry = {
    name: form.char_name.trim() || form.title.trim(),
    enabled: true,
    strategy: {
      type: personaEntry.strategyType,
      keys: personaEntry.strategyType === 'selective' ? splitEntryKeywords(personaEntry.keys) : [],
      keys_secondary: {
        logic: personaEntry.secondaryLogic,
        keys: splitEntryKeywords(personaEntry.secondaryKeys),
      },
      scan_depth:
        personaEntry.scanDepthMode === 'same_as_global' ? 'same_as_global' : clampNumber(personaEntry.scanDepth, 1, 99),
    },
    position: {
      type: personaEntry.position,
      role: personaEntry.role,
      depth: clampNumber(personaEntry.depth, 0, 99),
      order: clampNumber(personaEntry.order, -9999, 9999),
    },
    content: form.content.trim(),
    probability: clampNumber(personaEntry.probability, 0, 100),
    recursion: {
      prevent_incoming: personaEntry.preventIncoming,
      prevent_outgoing: personaEntry.preventOutgoing,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
    extra: {
      workshop: {
        kind: 'persona',
        title: form.title.trim(),
        char_name: form.char_name.trim(),
        author: authorName.value,
        exported_at: new Date().toISOString(),
      },
    },
  };
  return JSON.stringify(entry, null, 2);
}

function buildUploadContent(): string {
  if (form.type === 'collection') return '';
  if (form.type === 'persona') return buildPersonaWorldbookContent();
  if (addonIsPersona.value) return buildPersonaWorldbookContent();
  // 文件上传类型不需要 content（后端从文件读取）
  if (needsResourceFile.value) return '';
  return form.content;
}

/** 计算上传时的 file_type */
function getUploadFileType(): string {
  if (form.type === 'character' && resourceFile.value) {
    const ext = resourceFile.value.name.toLowerCase().split('.').pop() || 'json';
    return ext === 'png' ? 'png' : 'json';
  }
  if (form.type === 'card_addon' && form.addon_subtype) {
    const baseType = resourceFile.value?.name.toLowerCase().endsWith('.png') ? 'png' : 'json';
    return encodeFileTypeWithSubtype(baseType, form.addon_subtype);
  }
  return 'json';
}

function resetPersonaEntry() {
  personaEntry.strategyType = 'constant';
  personaEntry.keys = '';
  personaEntry.secondaryKeys = '';
  personaEntry.secondaryLogic = 'and_any';
  personaEntry.scanDepthMode = 'same_as_global';
  personaEntry.scanDepth = 4;
  personaEntry.position = 'before_character_definition';
  personaEntry.role = 'system';
  personaEntry.depth = 0;
  personaEntry.order = 100;
  personaEntry.probability = 100;
  personaEntry.preventIncoming = true;
  personaEntry.preventOutgoing = true;
}

function triggerCoverSelect() {
  coverInputRef.value?.click();
}

function onCoverSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toastr.warning('封面图不能超过 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    cropperImg.value = reader.result as string;
    showCropper.value = true;
    if (input) input.value = ''; // 重置 file input
  };
  reader.readAsDataURL(file);
}

function onCropConfirm() {
  const canvas = canvasRef.value;
  const img = cropImgObj.value;
  if (!canvas || !img) {
    toastr.error('裁剪器未就绪');
    return;
  }
  const cb = getCropBox(canvas);
  // 计算裁剪框对应到原始图片的区域
  const srcX = (cb.x - imgX.value) / imgScale.value;
  const srcY = (cb.y - imgY.value) / imgScale.value;
  const srcW = cb.w / imgScale.value;
  const srcH = cb.h / imgScale.value;
  // 输出到 800x600 canvas
  const out = document.createElement('canvas');
  out.width = 800;
  out.height = 600;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 800, 600);
  out.toBlob(
    blob => {
      if (!blob) {
        toastr.error('导出失败');
        return;
      }
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      coverFile.value = file;
      coverPreview.value = URL.createObjectURL(blob);
      showCropper.value = false;
    },
    'image/jpeg',
    0.92,
  );
}

function triggerCardFileSelect() {
  cardFileInputRef.value?.click();
}

function onCardFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    toastr.warning('角色卡文件不能超过 10MB');
    return;
  }
  if (!file.name.toLowerCase().endsWith('.png')) {
    toastr.warning('只支持 PNG 格式的角色卡文件');
    return;
  }
  cardFile.value = file;
}

async function onSubmit() {
  if (!canSubmit.value || submitting.value) return;

  // 解析标签
  const tags = tagInput.value
    .split(/[,，\s]+/)
    .map(t => t.trim())
    .filter(Boolean);
  const contentForUpload = buildUploadContent();

  submitting.value = true;
  try {
    if (DEBUG_MODE) {
      const newId = nextDebugId();
      // 直接构造 WorkItem 推入共享 debugWorks，切回广场立即可见
      debugWorks.unshift({
        id: newId,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type as any,
        tags,
        char_name: form.type === 'persona' || form.type === 'card_addon' ? form.char_name.trim() : undefined,
        cover_url: coverPreview.value || null,
        card_link: form.card_link.trim(),
        file_type: 'json',
        author: {
          username: DEBUG_CURRENT_USER,
          display_name: DEBUG_CURRENT_USER,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${DEBUG_CURRENT_USER}`,
        },
        download_count: 0,
        like_count: 0,
        liked: false,
        created_at: new Date().toISOString(),
        content: contentForUpload,
      } as any);
      // 合集：把选中的作品存入 mockCollectionChildren
      if (form.type === 'collection' && selectedWorkIds.value.length > 0) {
        const children = debugWorks
          .filter(w => selectedWorkIds.value.includes(w.id))
          .map(w => ({ ...w, content: (w as any).content || DEBUG_MOCK_CONTENT }) as any);
        mockCollectionChildren[newId] = children;
      }
      toastr.success('【调试】作品已发布，切换到广场查看！');
    } else {
      if (isEditMode.value && props.editWork?.id) {
        // 编辑模式：调用 updateWork
        await updateWork(props.editWork.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          content: contentForUpload || undefined,
          tags,
          char_name: needsCharName.value ? form.char_name.trim() : undefined,
          cover: coverFile.value || undefined,
          card_link: form.card_link.trim() || undefined,
          file_type: getUploadFileType(),
          resource_file: resourceFile.value || undefined,
          addon_subtype: form.type === 'card_addon' ? form.addon_subtype : undefined,
        });
      } else {
        // 新建模式
        await uploadWork({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          content: contentForUpload,
          tags,
          char_name: needsCharName.value ? form.char_name.trim() : undefined,
          cover: coverFile.value || undefined,
          card_link: form.card_link.trim() || undefined,
          file_type: getUploadFileType(),
          resource_file: resourceFile.value || undefined,
          addon_subtype: form.type === 'card_addon' ? form.addon_subtype : undefined,
          child_ids: form.type === 'collection' ? selectedWorkIds.value : undefined,
        });
      }
      toastr.success(isEditMode.value ? '作品更新已提交，等待审核' : '作品已提交，等待管理员审核');
    }

    // 编辑模式完成后通知父组件
    if (isEditMode.value) {
      emit('edit-done');
    }

    // 重置表单
    form.title = '';
    form.type = '';
    form.description = '';
    form.content = '';
    form.card_link = '';
    form.char_name = '';
    form.addon_subtype = '';
    tagInput.value = '';
    coverFile.value = null;
    coverPreview.value = '';
    resourceFile.value = null;
    cardFile.value = null;
    selectedWorkIds.value = [];
    resetPersonaEntry();

    emit('uploaded');
  } catch (e) {
    toastr.error(`提交失败: ${(e as Error).message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.ws-upload {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 登录提示 */
.ws-login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px;
}
.ws-login-prompt p {
  font-size: 13px;
  text-align: center;
}
.ws-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid rgba(88, 101, 242, 0.4);
  background: rgba(88, 101, 242, 0.15);
  color: #7289da;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.ws-login-btn:hover {
  background: rgba(88, 101, 242, 0.25);
  border-color: rgba(88, 101, 242, 0.6);
}

/* 上传表单 */
.ws-upload-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.ws-form-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--ws-border);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}
.ws-form-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}
.ws-form-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  margin-left: 8px;
}

.ws-form-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-form-body::-webkit-scrollbar {
  width: 3px;
}
.ws-form-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

.ws-form-group {
  margin-bottom: 14px;
}
.ws-label {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
  font-weight: 500;
}
.ws-input,
.ws-textarea {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #000 !important;
  color: var(--ws-text) !important;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.ws-textarea {
  resize: vertical;
  min-height: 80px;
}
.ws-input:hover,
.ws-textarea:hover {
  border-color: rgba(229, 20, 0, 0.3);
}
.ws-input:focus,
.ws-textarea:focus {
  border-color: var(--ws-primary);
  box-shadow: 0 0 12px var(--ws-primary-glow);
}
.ws-input::placeholder,
.ws-textarea::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
.ws-content-area {
  font-family: monospace;
  min-height: 120px;
}
.ws-char-count {
  text-align: right;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
  margin-top: 2px;
}

/* 世界书条目属性 */
.ws-entry-panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  padding: 10px;
}
.ws-entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.ws-entry-field {
  min-width: 0;
}
.ws-entry-wide {
  grid-column: 1 / -1;
}
.ws-entry-label {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 4px;
}
.ws-entry-inline {
  display: flex;
  gap: 8px;
}
.ws-entry-number {
  max-width: 88px;
}
.ws-entry-checks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: flex-end;
}
.ws-checkline {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 11px;
  cursor: pointer;
}
.ws-checkline input {
  accent-color: var(--ws-primary);
}

/* 类型描述 */
.ws-type-desc {
  font-size: 10px;
  color: var(--ws-primary);
  opacity: 0.8;
  margin-top: 4px;
  line-height: 1.4;
}

/* 字段提示 */
.ws-field-hint {
  font-size: 10px;
  color: rgba(251, 191, 36, 0.5);
  margin-top: 2px;
}

/* 封面上传 */
.ws-cover-upload {
  width: 160px;
  height: 120px;
  border-radius: 8px;
  border: 1px dashed var(--ws-primary-dim);
  background: var(--ws-glass);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.15s;
  position: relative;
}
.ws-cover-upload:hover {
  border-color: var(--ws-primary);
  background: rgba(229, 20, 0, 0.06);
  box-shadow: 0 0 10px var(--ws-primary-glow);
}
.ws-cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ws-cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  color: rgba(255, 255, 255, 0.2);
  font-size: 11px;
}

/* 文件上传 */
.ws-file-upload {
  border-radius: 8px;
  border: 1px dashed var(--ws-primary-dim);
  background: var(--ws-glass);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.15s;
  padding: 12px;
}
.ws-file-upload:hover {
  border-color: var(--ws-primary);
  background: rgba(229, 20, 0, 0.06);
  box-shadow: 0 0 10px var(--ws-primary-glow);
}
.ws-file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.25);
  font-size: 11px;
  padding: 8px;
}
.ws-file-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(52, 211, 153, 0.7);
  font-size: 12px;
}
.ws-file-clear {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

/* 免责声明 */
.ws-disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.5;
  cursor: pointer;
}
.ws-disclaimer input[type='checkbox'] {
  margin-top: 2px;
  accent-color: var(--ws-primary);
  flex-shrink: 0;
}

/* 合集作品选择器 */
.ws-collection-pick-list {
  max-height: 280px;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: var(--ws-bg-deep);
}
.ws-collection-empty {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}
.ws-pick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}
.ws-pick-item:last-child {
  border-bottom: none;
}
.ws-pick-item:hover {
  background: rgba(255, 255, 255, 0.04);
}
.ws-pick-item.selected {
  background: rgba(229, 20, 0, 0.08);
}
.ws-pick-item input[type='checkbox'] {
  display: none;
}
.ws-pick-thumb {
  width: 44px;
  height: 33px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ws-pick-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ws-pick-thumb-fallback {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
}
.ws-pick-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ws-pick-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-type-badge-sm {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0;
  background: rgba(229, 20, 0, 0.12);
  color: var(--ws-primary);
  border: 1px solid rgba(229, 20, 0, 0.25);
}

/* 作者名提示 */
.ws-author-notice {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  background: var(--ws-primary-dim);
  border: 1px solid rgba(229, 20, 0, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
  line-height: 1.5;
  text-shadow: 0 0 5px rgba(229, 20, 0, 0.5);
}

/* 提交 */
.ws-form-footer {
  padding: 10px 14px;
  border-top: 1px solid var(--ws-border);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}
.ws-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid rgba(52, 211, 153, 0.3);
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.ws-submit-btn:hover:not(:disabled) {
  background: rgba(52, 211, 153, 0.2);
  border-color: rgba(52, 211, 153, 0.5);
}
.ws-submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes ws-spin-anim {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.ws-spin {
  animation: ws-spin-anim 0.8s linear infinite;
}
/* Action Buttons shared */
.ws-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--ws-border);
  background: var(--ws-glass);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.ws-action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}
.ws-btn-import {
  border-color: rgba(229, 20, 0, 0.3);
  background: rgba(229, 20, 0, 0.1);
  color: var(--ws-primary);
}
.ws-btn-import:hover:not(:disabled) {
  background: rgba(229, 20, 0, 0.25);
  border-color: var(--ws-primary);
  box-shadow: 0 0 15px var(--ws-primary-glow);
  color: #fff;
}

/* 裁剪弹窗 - 独立 fixed 层，不受父容器限制 */
.ws-cropper-overlay {
  position: fixed !important;
  inset: 0 !important;
  z-index: 99999 !important;
  background: rgba(0, 0, 0, 0.85) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(4px);
}
.ws-cropper-dialog {
  width: min(90vw, 800px);
  max-height: 90vh;
  background: var(--ws-bg-section);
  border: 1px solid var(--ws-primary);
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.8),
    0 0 20px var(--ws-primary-glow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.ws-cropper-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.ws-cropper-ratio-hint {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 6px;
}
.ws-cropper-wrap {
  width: 100%;
  height: 480px;
  background: #111;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  touch-action: none; /* 防止浏览器原生滚动干扰 */
}
.ws-cropper-wrap:active {
  cursor: grabbing;
}
.ws-crop-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.ws-cropper-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  flex-shrink: 0;
}

/* === 移动端适配 === */
.ws-upload.mobile .ws-form-body {
  padding: 12px;
}
.ws-upload.mobile .ws-form-group {
  margin-bottom: 12px;
}
.ws-upload.mobile .ws-form-label {
  font-size: 11px;
}
.ws-upload.mobile .ws-form-input,
.ws-upload.mobile .ws-form-select,
.ws-upload.mobile .ws-form-textarea {
  font-size: 14px !important;
  padding: 9px 12px;
}
.ws-upload.mobile .ws-submit-btn {
  padding: 12px;
  font-size: 13px;
}
.ws-upload.mobile .ws-cover-upload {
  min-height: 120px;
}
.ws-upload.mobile .ws-type-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.ws-upload.mobile .ws-pick-item {
  padding: 8px;
  gap: 6px;
}
.ws-upload.mobile .ws-pick-thumb {
  width: 36px;
  height: 36px;
}

/* 裁剪弹窗 — 移动端全屏 */
.ws-upload.mobile .ws-cropper-dialog {
  width: 100%;
  height: 90vh;
  max-height: 90vh;
  border-radius: 12px 12px 0 0;
  padding: 14px;
  display: flex;
  flex-direction: column;
}
.ws-upload.mobile .ws-cropper-wrap {
  flex: 1;
  min-height: 0;
  height: calc(90vh - 140px);
}
.ws-upload.mobile .ws-cropper-title {
  font-size: 13px;
  margin-bottom: 10px;
}
.ws-upload.mobile .ws-cropper-actions {
  margin-top: 12px;
}
</style>
