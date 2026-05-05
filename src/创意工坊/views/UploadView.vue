<template>
  <div class="ws-upload">
    <!-- 未登录提示 -->
    <div v-if="!auth.isLoggedIn.value" class="ws-login-prompt">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      <p>请先登录才能上传作品</p>
      <button class="ws-login-btn" @click="auth.login()">
        请先到「账号」页面登录
      </button>
    </div>

    <!-- 已登录：上传表单 -->
    <div v-else class="ws-upload-form">
      <div class="ws-form-header">
        <span class="ws-form-title">上传新作品</span>
        <span class="ws-form-hint">提交后需要管理员审核通过才能公开显示</span>
      </div>

      <div class="ws-form-body">
        <!-- 封面图上传 -->
        <div class="ws-form-group">
          <label class="ws-label">封面图（可选）</label>
          <div class="ws-cover-upload" @click="triggerCoverSelect">
            <img v-if="coverPreview" :src="coverPreview" class="ws-cover-preview" />
            <div v-else class="ws-cover-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <span>点击上传封面</span>
            </div>
            <input ref="coverInputRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none" @change="onCoverSelected" />
          </div>
        </div>

        <!-- 类型 -->
        <div class="ws-form-group">
          <label class="ws-label">类型 *</label>
          <select class="ws-input" v-model="form.type">
            <option value="" disabled>选择作品类型</option>
            <option v-for="t in WORK_TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
          <div v-if="form.type" class="ws-type-desc">{{ typeDescriptions[form.type] || '' }}</div>
        </div>

        <!-- 标题 -->
        <div class="ws-form-group">
          <label class="ws-label">标题 *</label>
          <input class="ws-input" v-model="form.title" placeholder="给你的作品起个名字" maxlength="100" />
        </div>

        <!-- 描述 -->
        <div class="ws-form-group">
          <label class="ws-label">描述</label>
          <textarea class="ws-textarea" v-model="form.description" placeholder="简单介绍一下你的作品..." rows="3" maxlength="500"></textarea>
        </div>

        <!-- 标签 -->
        <div class="ws-form-group">
          <label class="ws-label">标签（逗号或空格分隔）</label>
          <input class="ws-input" v-model="tagInput" placeholder="恋爱, 日常, 奇幻" />
        </div>

        <!-- 角色卡链接 (card_addon 必填, regex/persona/worldbook 可选) -->
        <div v-if="showCardLink" class="ws-form-group">
          <label class="ws-label">
            角色卡链接{{ form.type === 'card_addon' ? ' *' : '（可选）' }}
          </label>
          <input class="ws-input" v-model="form.card_link" placeholder="角色卡名称或下载链接" />
          <div v-if="form.type === 'card_addon'" class="ws-field-hint">角色卡配套类型必须提供角色卡链接</div>
        </div>

        <!-- collection 类型：上传角色卡 PNG -->
        <div v-if="form.type === 'collection'" class="ws-form-group">
          <label class="ws-label">角色卡 PNG 文件 *</label>
          <div class="ws-file-upload" @click="triggerCardFileSelect">
            <div v-if="cardFile" class="ws-file-selected">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <span>{{ cardFile.name }} ({{ (cardFile.size / 1024).toFixed(1) }} KB)</span>
              <button class="ws-file-clear" @click.stop="cardFile = null">x</button>
            </div>
            <div v-else class="ws-file-placeholder">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <span>点击上传角色卡 PNG 文件</span>
            </div>
            <input ref="cardFileInputRef" type="file" accept=".png" style="display:none" @change="onCardFileSelected" />
          </div>
        </div>

        <!-- collection 免责声明 -->
        <div v-if="form.type === 'collection'" class="ws-form-group">
          <label class="ws-disclaimer">
            <input type="checkbox" v-model="disclaimerAgreed" />
            <span>我确认拥有该角色卡的分发权利，或已获得原作者授权。上传即表示同意承担相关责任，作品将标注作者名，作者拥有最终解释权。</span>
          </label>
        </div>

        <!-- 内容 (非 collection 类型) -->
        <div v-if="form.type !== 'collection'" class="ws-form-group">
          <label class="ws-label">内容 *</label>
          <textarea class="ws-textarea ws-content-area" v-model="form.content" :placeholder="contentPlaceholder" rows="10"></textarea>
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
          <svg v-if="submitting" class="ws-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          {{ submitting ? '提交中...' : '提交审核' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WORK_TYPES } from '../types';
import { uploadWork } from '../api';

const props = defineProps<{
  isMobile: boolean;
  auth: any;
}>();

const emit = defineEmits<{ uploaded: [] }>();

const form = reactive({
  title: '',
  type: '' as string,
  description: '',
  content: '',
  card_link: '',
});
const tagInput = ref('');
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const coverInputRef = ref<HTMLInputElement | null>(null);
const cardFile = ref<File | null>(null);
const cardFileInputRef = ref<HTMLInputElement | null>(null);
const disclaimerAgreed = ref(false);
const submitting = ref(false);

const authorName = computed(() => {
  return props.auth.user.value?.display_name || props.auth.user.value?.username || '作者';
});

const typeDescriptions: Record<string, string> = {
  regex: '美化正则 -- 下载文件或直接导入到酒馆正则列表',
  persona: '人设/OC条目 -- 注入到角色卡绑定世界书或下载文件',
  card_addon: '角色卡配套 -- 为特定角色卡提供的世界书/正则等配套资源',
  worldbook: '共享世界书 -- 创建独立世界书，文件名将自动附带作者名',
  collection: '作者合集 -- 上传角色卡 PNG，导入到酒馆角色列表（需授权声明）',
};

const contentPlaceholder = computed(() => {
  switch (form.type) {
    case 'regex': return '粘贴正则 JSON 内容...';
    case 'persona': return '粘贴世界书条目 JSON 内容...';
    case 'card_addon': return '粘贴世界书条目或正则 JSON 内容...';
    case 'worldbook': return '粘贴世界书 JSON 内容...';
    default: return '在这里粘贴你的内容...';
  }
});

const showCardLink = computed(() => {
  return ['regex', 'persona', 'card_addon', 'worldbook'].includes(form.type);
});

const contentSize = computed(() => {
  const bytes = new Blob([form.content]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
});

const canSubmit = computed(() => {
  if (!form.title.trim() || !form.type) return false;
  if (form.type === 'collection') {
    return !!cardFile.value && disclaimerAgreed.value;
  }
  if (form.type === 'card_addon' && !form.card_link.trim()) return false;
  return !!form.content.trim();
});

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
  coverFile.value = file;
  const reader = new FileReader();
  reader.onload = () => { coverPreview.value = reader.result as string; };
  reader.readAsDataURL(file);
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

  submitting.value = true;
  try {
    await uploadWork({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      content: form.type === 'collection' ? '' : form.content,
      tags,
      cover: coverFile.value || undefined,
      card_link: form.card_link.trim() || undefined,
      file_type: form.type === 'collection' ? 'png' : 'json',
      card_file: cardFile.value || undefined,
      disclaimer_agreed: form.type === 'collection' ? disclaimerAgreed.value : undefined,
    });

    toastr.success('作品已提交，等待管理员审核');

    // 重置表单
    form.title = '';
    form.type = '';
    form.description = '';
    form.content = '';
    form.card_link = '';
    tagInput.value = '';
    coverFile.value = null;
    coverPreview.value = '';
    cardFile.value = null;
    disclaimerAgreed.value = false;

    emit('uploaded');
  } catch (e) {
    toastr.error(`提交失败: ${(e as Error).message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.ws-upload { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }

/* 登录提示 */
.ws-login-prompt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex: 1; color: rgba(255,255,255,.3); padding: 40px; }
.ws-login-prompt p { font-size: 13px; text-align: center; }
.ws-login-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 8px; border: 1px solid rgba(88,101,242,.4); background: rgba(88,101,242,.15); color: #7289da; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; }
.ws-login-btn:hover { background: rgba(88,101,242,.25); border-color: rgba(88,101,242,.6); }

/* 上传表单 */
.ws-upload-form { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.ws-form-header { padding: 10px 14px; border-bottom: 1px solid rgba(77,201,246,.1); background: rgba(5,8,16,.4); flex-shrink: 0; }
.ws-form-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.8); }
.ws-form-hint { font-size: 10px; color: rgba(255,255,255,.25); margin-left: 8px; }

.ws-form-body { flex: 1; overflow-y: auto; padding: 14px; }
.ws-form-body::-webkit-scrollbar { width: 3px; }
.ws-form-body::-webkit-scrollbar-thumb { background: rgba(77,201,246,.12); border-radius: 2px; }

.ws-form-group { margin-bottom: 14px; }
.ws-label { display: block; font-size: 11px; color: rgba(255,255,255,.4); margin-bottom: 4px; font-weight: 500; }
.ws-input { width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(77,201,246,.12); background: rgba(77,201,246,.04); color: rgba(255,255,255,.85); font-size: 12px; outline: none; transition: border-color .15s; }
.ws-input:focus { border-color: rgba(77,201,246,.3); }
.ws-input::placeholder { color: rgba(255,255,255,.2); }
.ws-textarea { width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(77,201,246,.12); background: rgba(77,201,246,.04); color: rgba(255,255,255,.85); font-size: 12px; outline: none; resize: vertical; font-family: inherit; transition: border-color .15s; }
.ws-textarea:focus { border-color: rgba(77,201,246,.3); }
.ws-textarea::placeholder { color: rgba(255,255,255,.2); }
.ws-content-area { font-family: monospace; min-height: 120px; }
.ws-char-count { text-align: right; font-size: 10px; color: rgba(255,255,255,.2); margin-top: 2px; }

/* 类型描述 */
.ws-type-desc { font-size: 10px; color: rgba(77,201,246,.5); margin-top: 4px; line-height: 1.4; }

/* 字段提示 */
.ws-field-hint { font-size: 10px; color: rgba(251,191,36,.5); margin-top: 2px; }

/* 封面上传 */
.ws-cover-upload { width: 160px; height: 120px; border-radius: 8px; border: 1px dashed rgba(77,201,246,.2); background: rgba(77,201,246,.02); cursor: pointer; overflow: hidden; transition: all .15s; position: relative; }
.ws-cover-upload:hover { border-color: rgba(77,201,246,.4); background: rgba(77,201,246,.06); }
.ws-cover-preview { width: 100%; height: 100%; object-fit: cover; }
.ws-cover-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; height: 100%; color: rgba(255,255,255,.2); font-size: 11px; }

/* 文件上传 */
.ws-file-upload { border-radius: 8px; border: 1px dashed rgba(77,201,246,.2); background: rgba(77,201,246,.02); cursor: pointer; overflow: hidden; transition: all .15s; padding: 12px; }
.ws-file-upload:hover { border-color: rgba(77,201,246,.4); background: rgba(77,201,246,.06); }
.ws-file-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: rgba(255,255,255,.25); font-size: 11px; padding: 8px; }
.ws-file-selected { display: flex; align-items: center; gap: 8px; color: rgba(52,211,153,.7); font-size: 12px; }
.ws-file-clear { width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(248,113,113,.15); color: #f87171; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: auto; }

/* 免责声明 */
.ws-disclaimer { display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: rgba(255,255,255,.45); line-height: 1.5; cursor: pointer; }
.ws-disclaimer input[type="checkbox"] { margin-top: 2px; accent-color: #4dc9f6; flex-shrink: 0; }

/* 作者名提示 */
.ws-author-notice { font-size: 10px; color: rgba(77,201,246,.4); background: rgba(77,201,246,.04); border: 1px solid rgba(77,201,246,.08); border-radius: 6px; padding: 8px 10px; line-height: 1.5; }

/* 提交 */
.ws-form-footer { padding: 10px 14px; border-top: 1px solid rgba(77,201,246,.1); background: rgba(5,8,16,.4); flex-shrink: 0; }
.ws-submit-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px 24px; border-radius: 8px; border: 1px solid rgba(52,211,153,.3); background: rgba(52,211,153,.1); color: #34d399; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
.ws-submit-btn:hover:not(:disabled) { background: rgba(52,211,153,.2); border-color: rgba(52,211,153,.5); }
.ws-submit-btn:disabled { opacity: .4; cursor: not-allowed; }

@keyframes ws-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.ws-spin { animation: ws-spin-anim .8s linear infinite; }
</style>
