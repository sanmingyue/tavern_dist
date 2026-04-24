<template>
  <ArtPageLayout artKey="炼丹">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c-4.97 0-9-2.69-9-6 0-2.2 1.17-3.14 2-4 .39-.4.78-.87 1-1.49.11-.31.19-.64.21-.99.03-.56-.11-1.07-.38-1.51C4.73 5.87 7.28 2 12 2c4.72 0 7.27 3.87 6.17 6-.27.44-.41.95-.38 1.51.02.35.1.68.21.99.22.62.61 1.09 1 1.49.83.86 2 1.8 2 4 0 3.31-4.03 6-9 6z" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </template>

    <!-- 炼丹有独特的操作区，不使用 ArtStandardForm -->
    <div class="section-header">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M12 22c-4.97 0-9-2.69-9-6 0-2.2 1.17-3.14 2-4 .39-.4.78-.87 1-1.49.11-.31.19-.64.21-.99.03-.56-.11-1.07-.38-1.51C4.73 5.87 7.28 2 12 2c4.72 0 7.27 3.87 6.17 6-.27.44-.41.95-.38 1.51.02.35.1.68.21.99.22.62.61 1.09 1 1.49.83.86 2 1.8 2 4 0 3.31-4.03 6-9 6z" stroke-linecap="round" stroke-linejoin="round"/></svg>
      开始炼丹
    </div>

    <!-- 丹药名称 -->
    <div class="input-group">
      <label>丹药名称</label>
      <input v-model="form.pillName" type="text" placeholder="如：聚气丹、筑基丹" />
    </div>

    <!-- 主药（单选） -->
    <div class="input-group">
      <label>主药（从储物戒选择）</label>
      <button v-if="!mainMaterial" class="select-btn" @click="showMainPicker = true">
        点击从储物戒选择药材
      </button>
      <div v-else class="selected-material">
        <span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#22c55e" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M6 20h12M12 4v16M9 7c0-2 6-2 6 0s-3 4-6 4 3 2 6 4"/></svg>
          {{ mainMaterial.name }}×{{ mainMaterial.count }}
        </span>
        <button class="clear-btn" @click="mainMaterial = null">✕</button>
      </div>
    </div>

    <!-- 辅药（多选） -->
    <div class="input-group">
      <label>辅药（从储物戒选择，可选）</label>
      <button v-if="auxMaterials.length === 0" class="select-btn" @click="showAuxPicker = true">
        点击从储物戒选择辅药
      </button>
      <div v-else class="selected-materials">
        <span v-for="m in auxMaterials" :key="m.name" class="mat-tag">
          {{ m.name }}×{{ m.count }}
          <button class="tag-rm" @click="removeAux(m.name)">✕</button>
        </span>
        <button class="add-more-btn" @click="showAuxPicker = true">+添加</button>
      </div>
    </div>

    <!-- 火焰选择 -->
    <div class="input-group">
      <label>火焰</label>
      <div class="option-row">
        <button v-for="f in fireOptions" :key="f" :class="['opt-btn', { active: form.fireType === f }]" @click="form.fireType = f">{{ f }}</button>
        <!-- 如果玩家拥有异火，从异火列表变量中读取并展示 -->
        <template v-if="ownedFires.length > 0">
          <button v-for="fire in ownedFires" :key="fire" :class="['opt-btn fire-exotic', { active: form.fireType === fire }]" @click="form.fireType = fire">🔥 {{ fire }}</button>
        </template>
      </div>
    </div>

    <!-- 火候控制 -->
    <div class="input-group">
      <label>火候控制</label>
      <div class="option-row">
        <button v-for="h in heatOptions" :key="h" :class="['opt-btn', { active: form.heat === h }]" @click="form.heat = h">{{ h }}</button>
      </div>
    </div>

    <!-- 额外补充 -->
    <div class="input-group">
      <label>额外补充</label>
      <textarea v-model="form.extra" placeholder="可补充：中途更换火焰、有人协助、发生意外等..." rows="2" />
    </div>

    <!-- 预览 -->
    <div v-if="previewContent" class="preview-box">
      <div class="preview-label">内容预览</div>
      <div class="preview-content">{{ previewContent }}</div>
    </div>

    <!-- 发送按钮 -->
    <button class="send-btn" :disabled="!canSend" @click="handleSend">
      发送至酒馆
    </button>

    <!-- 主药选择器 -->
    <template #picker>
      <div v-if="showMainPicker" class="picker-overlay">
        <StoragePicker title="选择主药" :categories="['药材']" :multiple="false" @select="onMainSelect" @close="showMainPicker = false" />
      </div>
      <div v-if="showAuxPicker" class="picker-overlay">
        <StoragePicker title="选择辅药" :categories="['药材']" :multiple="true" :max-items="5" @select="onAuxSelect" @close="showAuxPicker = false" />
      </div>
    </template>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStatusStore } from '../../store';
import ArtPageLayout from './ArtPageLayout.vue';
import StoragePicker from '../StoragePicker.vue';

const store = useStatusStore();

const fireOptions = ['凡火', '地火', '灵火'];
const heatOptions = ['文火', '中火', '武火', '先文后武', '先武后文', '文武交替'];

// 从异火列表变量中读取玩家拥有的异火
const ownedFires = computed(() => {
  const raw = store.data.异火列表;
  if (!raw) return [];
  return raw.split('|').map(s => s.trim()).filter(Boolean);
});

const form = ref({ pillName: '', fireType: '', heat: '', extra: '' });

// ─── 材料选择 ───
const showMainPicker = ref(false);
const showAuxPicker = ref(false);
const mainMaterial = ref<{ name: string; count: number } | null>(null);
const auxMaterials = ref<Array<{ name: string; count: number }>>([]);

function onMainSelect(items: Array<{ name: string; count: number }>) {
  if (items.length > 0) mainMaterial.value = items[0];
  showMainPicker.value = false;
}

function onAuxSelect(items: Array<{ name: string; count: number }>) {
  auxMaterials.value = items;
  showAuxPicker.value = false;
}

function removeAux(name: string) {
  auxMaterials.value = auxMaterials.value.filter(m => m.name !== name);
}

// ─── 预览 ───
const previewContent = computed(() => {
  const { pillName, fireType, heat } = form.value;
  const furnace = store.data['装备_丹炉'] || '丹炉';
  if (!pillName && !mainMaterial.value && !fireType) return '';

  let c = '【炼丹开始】\n\n';
  c += '取' + furnace + '一座';
  if (mainMaterial.value) c += '，以' + mainMaterial.value.name + '为主药';
  if (auxMaterials.value.length > 0) c += '，佐以' + auxMaterials.value.map(m => m.name).join('、');
  if (fireType) c += '，燃' + fireType + '温炉';
  if (pillName) c += '，炼制' + pillName;
  if (heat) c += '，以' + heat + '徐徐温养';
  c += '。\n\n正在见证结果...';
  if (form.value.extra?.trim()) c += '\n\n【额外】' + form.value.extra.trim();
  return c;
});

const canSend = computed(() => form.value.pillName.trim() || mainMaterial.value || form.value.fireType);

// ─── 发送 ───
async function handleSend() {
  if (!canSend.value) return;

  const materialsToRemove: Array<{ name: string; count?: number }> = [];
  if (mainMaterial.value) materialsToRemove.push(mainMaterial.value);
  for (const aux of auxMaterials.value) materialsToRemove.push(aux);
  const removedCount = await store.removeMultipleFromStorage(materialsToRemove);

  await store.saveData();
  triggerSlash('/send ' + previewContent.value + ' | /trigger');

  form.value = { pillName: '', fireType: '', heat: '', extra: '' };
  mainMaterial.value = null;
  auxMaterials.value = [];

  if (removedCount > 0) {
    toastr.success('炼丹内容已发送，消耗' + removedCount + '份材料');
  } else {
    toastr.success('炼丹内容已发送');
  }
}
</script>

<style scoped>
.section-header { font-size: 13px; font-weight: 700; color: color-mix(in srgb, var(--art-color, #ef4444) 80%, black); display: flex; align-items: center; gap: 6px; }
.input-group { display: flex; flex-direction: column; gap: 4px; }
.input-group label { font-size: 11px; font-weight: 600; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.5px; }
.input-group input, .input-group textarea { padding: 8px 10px; border: 1px solid var(--card-border, #e8ecf1); border-radius: 6px; font-size: 13px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff); }
.input-group input:focus, .input-group textarea:focus { outline: none; border-color: var(--art-color, #ef4444); }
.input-group textarea { resize: vertical; min-height: 50px; }

.select-btn { padding: 10px; border: 1.5px dashed color-mix(in srgb, var(--art-color) 30%, white); border-radius: 8px; background: var(--content-bg, #fff); color: color-mix(in srgb, var(--art-color) 80%, black); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.select-btn:hover { background: var(--art-bg-tint); border-color: var(--art-color); }

.selected-material { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--art-bg-tint); border: 1px solid color-mix(in srgb, var(--art-color) 30%, white); border-radius: 6px; font-size: 12px; color: color-mix(in srgb, var(--art-color) 80%, black); font-weight: 600; }
.clear-btn { background: none; border: none; color: var(--art-color); cursor: pointer; font-size: 14px; }

.selected-materials { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.mat-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--art-bg-tint); border: 1px solid color-mix(in srgb, var(--art-color) 30%, white); border-radius: 12px; font-size: 11px; color: color-mix(in srgb, var(--art-color) 80%, black); }
.tag-rm { background: none; border: none; color: var(--art-color); cursor: pointer; font-size: 10px; padding: 0; }
.add-more-btn { padding: 4px 10px; border: 1px dashed color-mix(in srgb, var(--art-color) 30%, white); border-radius: 12px; background: var(--content-bg, #fff); color: color-mix(in srgb, var(--art-color) 80%, black); font-size: 11px; cursor: pointer; }

.option-row { display: flex; flex-wrap: wrap; gap: 6px; }
.opt-btn { padding: 5px 10px; border: 1px solid var(--card-border, #e8ecf1); border-radius: 16px; background: var(--content-bg, #fff); font-size: 12px; color: var(--text-secondary, #475569); cursor: pointer; transition: all 0.2s; }
.opt-btn:hover { border-color: var(--art-color); color: var(--art-color); }
.opt-btn.active { background: var(--art-color); border-color: var(--art-color); color: #fff; }
.opt-btn.fire-exotic { border-color: #f59e0b; color: #92400e; }
.opt-btn.fire-exotic:hover { border-color: #d97706; color: #d97706; background: #fffbeb; }
.opt-btn.fire-exotic.active { background: linear-gradient(135deg, #f59e0b, #d97706); border-color: #d97706; color: #fff; }

.preview-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 10px; }
.preview-label { font-size: 10px; font-weight: 700; color: #a16207; margin-bottom: 6px; text-transform: uppercase; }
.preview-content { font-size: 12px; color: var(--text-secondary, #475569); line-height: 1.6; white-space: pre-wrap; max-height: 120px; overflow-y: auto; }

.send-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--art-color), color-mix(in srgb, var(--art-color) 60%, black)); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px color-mix(in srgb, var(--art-color) 40%, transparent); transition: all 0.2s; }
.send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px color-mix(in srgb, var(--art-color) 50%, transparent); }
.send-btn:disabled { background: #e8ecf1; color: var(--text-muted, #94a3b8); cursor: not-allowed; box-shadow: none; }

.picker-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 10; }
</style>
