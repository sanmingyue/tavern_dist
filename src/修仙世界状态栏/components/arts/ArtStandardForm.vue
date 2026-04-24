<template>
  <div class="standard-form">
    <!-- 操作区标题 -->
    <div class="section-header" :style="{ color: headerColor }">
      <slot name="header-icon" />
      {{ actionTitle }}
    </div>

    <!-- 产物/操作名称输入 -->
    <div class="input-group">
      <label>{{ itemLabel }}</label>
      <input v-model="form.itemName" type="text" :placeholder="itemPlaceholder" />
    </div>

    <!-- 从储物戒选择材料 -->
    <div class="input-group" v-if="pickerCategories.length > 0">
      <label>材料（从储物戒选择）</label>
      <button class="select-btn" @click="showPicker = true" v-if="materials.length === 0">
        点击从储物戒选择材料
      </button>
      <div class="selected-materials" v-else>
        <span class="mat-tag" v-for="m in materials" :key="m.name">
          {{ m.name }}×{{ m.count }}
          <button class="tag-rm" @click="removeMat(m.name)">✕</button>
        </span>
        <button class="add-more-btn" @click="showPicker = true">+添加</button>
      </div>
    </div>

    <!-- 选项组1 -->
    <div class="input-group" v-if="options1 && options1.items.length > 0">
      <label>{{ options1.label }}</label>
      <div class="option-row">
        <button
          v-for="o in options1.items"
          :key="o"
          :class="['opt-btn', { active: form.opt1 === o }]"
          @click="form.opt1 = o"
        >{{ o }}</button>
      </div>
    </div>

    <!-- 选项组2 -->
    <div class="input-group" v-if="options2 && options2.items.length > 0">
      <label>{{ options2.label }}</label>
      <div class="option-row">
        <button
          v-for="o in options2.items"
          :key="o"
          :class="['opt-btn', { active: form.opt2 === o }]"
          @click="form.opt2 = o"
        >{{ o }}</button>
      </div>
    </div>

    <!-- 额外补充 -->
    <div class="input-group">
      <label>额外补充</label>
      <textarea v-model="form.extra" :placeholder="extraPlaceholder" rows="2" />
    </div>

    <!-- 预览 -->
    <div class="preview-box" v-if="previewContent">
      <div class="preview-label">内容预览</div>
      <div class="preview-content">{{ previewContent }}</div>
    </div>

    <!-- 发送按钮 -->
    <button class="send-btn" :disabled="!canSend" @click="handleSend">
      发送至酒馆
    </button>

    <!-- StoragePicker 遮罩 -->
    <div class="picker-overlay" v-if="showPicker">
      <StoragePicker
        title="选择材料"
        :categories="pickerCategories"
        :multiple="true"
        :max-items="5"
        @select="onPickerSelect"
        @close="showPicker = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStatusStore, ARTS_MAP, type ArtKey } from '../../store';
import StoragePicker from '../StoragePicker.vue';
import type { Schema } from '../../schema';

interface OptionGroup {
  label: string;
  items: string[];
}

const props = withDefaults(defineProps<{
  artKey: ArtKey;
  /** 操作区标题，如"开始炼器" */
  actionTitle: string;
  /** 产物输入框标签，如"炼制名称" */
  itemLabel: string;
  /** 产物输入框占位文字 */
  itemPlaceholder?: string;
  /** StoragePicker 分类筛选，如 ['矿石', '灵材']。空数组则不显示材料选择 */
  pickerCategories?: string[];
  /** 选项组1 */
  options1?: OptionGroup;
  /** 选项组2 */
  options2?: OptionGroup;
  /** 额外补充占位文字 */
  extraPlaceholder?: string;
  /** 预览内容的动词，如"炼制"、"布置" */
  previewVerb?: string;
  /** 预览开头标题，如"【炼制开始】" */
  previewTitle?: string;
  /** 发送成功的 toast 消息 */
  sendToast?: string;
}>(), {
  itemPlaceholder: '输入名称...',
  pickerCategories: () => [],
  extraPlaceholder: '可补充额外信息...',
  previewVerb: '操作',
  previewTitle: '【操作开始】',
  sendToast: '内容已发送',
});

const store = useStatusStore();
const artConfig = computed(() => ARTS_MAP[props.artKey]);

// 标题颜色
const headerColor = computed(() => {
  const c = artConfig.value.color;
  // 混合更深的颜色作为标题色
  return `color-mix(in srgb, ${c} 80%, black)`;
});

// ─── 表单状态 ───
const form = ref({ itemName: '', opt1: '', opt2: '', extra: '' });
const showPicker = ref(false);
const materials = ref<Array<{ name: string; count: number }>>([]);

function onPickerSelect(items: Array<{ name: string; count: number }>) {
  materials.value = items;
  showPicker.value = false;
}

function removeMat(name: string) {
  materials.value = materials.value.filter(m => m.name !== name);
}

// ─── 预览 ───
const previewContent = computed(() => {
  const { itemName, opt1, opt2 } = form.value;
  const toolField = artConfig.value.工具字段;
  const tool = toolField ? ((store.data[toolField as keyof Schema] as string) || toolField.replace(/^装备_/, '')) : '';

  if (!itemName && materials.value.length === 0 && !opt1) return '';

  let c = props.previewTitle + '\n\n';
  if (tool) c += '取' + tool;
  if (materials.value.length > 0) c += '，以' + materials.value.map(m => m.name).join('、') + '为材';
  if (itemName) c += '，' + props.previewVerb + itemName;
  if (opt1) c += '，采用' + opt1;
  if (opt2) c += '，以' + opt2 + '之法';
  c += '。\n\n正在见证结果...';
  if (form.value.extra?.trim()) c += '\n\n【额外】' + form.value.extra.trim();
  return c;
});

const canSend = computed(() => {
  return form.value.itemName.trim() || materials.value.length > 0 || form.value.opt1;
});

// ─── 发送 ───
async function handleSend() {
  if (!canSend.value) return;

  // 1. 扣除材料
  let removedCount = 0;
  if (materials.value.length > 0) {
    removedCount = await store.removeMultipleFromStorage(materials.value);
  }

  // 2. 保存数据
  await store.saveData();

  // 3. 发送到酒馆
  triggerSlash('/send ' + previewContent.value + ' | /trigger');

  // 4. 重置表单
  form.value = { itemName: '', opt1: '', opt2: '', extra: '' };
  materials.value = [];

  // 5. 提示
  if (removedCount > 0) {
    toastr.success(props.sendToast + '，消耗' + removedCount + '份材料');
  } else {
    toastr.success(props.sendToast);
  }
}
</script>

<style scoped>
.standard-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-header :deep(svg) {
  width: 14px;
  height: 14px;
  display: inline-block;
  vertical-align: middle;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-group input,
.input-group textarea {
  padding: 8px 10px;
  border: 1px solid var(--card-border, #e8ecf1);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary, #1e293b);
  background: var(--content-bg, #fff);
}

.input-group input:focus,
.input-group textarea:focus {
  outline: none;
  border-color: var(--art-color, #64748b);
}

.input-group textarea {
  resize: vertical;
  min-height: 50px;
}

.select-btn {
  padding: 10px;
  border: 1.5px dashed color-mix(in srgb, var(--art-color, #64748b) 30%, white);
  border-radius: 8px;
  background: var(--content-bg, #fff);
  color: color-mix(in srgb, var(--art-color, #64748b) 80%, black);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.select-btn:hover {
  background: var(--art-bg-tint, #f8fafc);
  border-color: var(--art-color, #64748b);
}

.selected-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.mat-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--art-bg-tint, #f8fafc);
  border: 1px solid color-mix(in srgb, var(--art-color, #64748b) 30%, white);
  border-radius: 12px;
  font-size: 11px;
  color: color-mix(in srgb, var(--art-color, #64748b) 80%, black);
}

.tag-rm {
  background: none;
  border: none;
  color: var(--art-color, #64748b);
  cursor: pointer;
  font-size: 10px;
  padding: 0;
}

.add-more-btn {
  padding: 4px 10px;
  border: 1px dashed color-mix(in srgb, var(--art-color, #64748b) 30%, white);
  border-radius: 12px;
  background: var(--content-bg, #fff);
  color: color-mix(in srgb, var(--art-color, #64748b) 80%, black);
  font-size: 11px;
  cursor: pointer;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opt-btn {
  padding: 5px 10px;
  border: 1px solid var(--card-border, #e8ecf1);
  border-radius: 16px;
  background: var(--content-bg, #fff);
  font-size: 12px;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.2s;
}

.opt-btn:hover {
  border-color: var(--art-color, #64748b);
  color: var(--art-color, #64748b);
}

.opt-btn.active {
  background: var(--art-color, #64748b);
  border-color: var(--art-color, #64748b);
  color: #fff;
}

.preview-box {
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 8px;
  padding: 10px;
}

.preview-label {
  font-size: 10px;
  font-weight: 700;
  color: #a16207;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.preview-content {
  font-size: 12px;
  color: var(--text-secondary, #475569);
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 120px;
  overflow-y: auto;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--art-color, #64748b), color-mix(in srgb, var(--art-color, #64748b) 60%, black));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--art-color, #64748b) 40%, transparent);
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--art-color, #64748b) 50%, transparent);
}

.send-btn:disabled {
  background: #e8ecf1;
  color: var(--text-muted, #94a3b8);
  cursor: not-allowed;
  box-shadow: none;
}

.picker-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 10;
}
</style>
