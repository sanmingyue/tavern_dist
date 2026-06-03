<template>
  <div class="chaoxi-store-view">
    <div class="chaoxi-store-header">
      <span class="chaoxi-store-title">📦 预设仓库</span>
      <span class="chaoxi-store-subtitle">by 三明月</span>
    </div>
    <div class="chaoxi-store-list">
      <div v-for="item in catalog" :key="item.filename" class="chaoxi-store-card">
        <div class="chaoxi-store-card-top">
          <span class="chaoxi-store-card-name">{{ item.name }}</span>
          <span class="chaoxi-store-card-meta">
            <span class="chaoxi-store-card-author">{{ item.author }}</span>
            <span v-if="item.updateDate" class="chaoxi-store-card-date">更新 {{ item.updateDate }}</span>
          </span>
        </div>
        <p class="chaoxi-store-card-desc">{{ item.description }}</p>
        <div class="chaoxi-store-card-tags">
          <span v-for="tag in item.tags" :key="tag" class="chaoxi-store-tag">{{ tag }}</span>
        </div>
        <div class="chaoxi-store-card-actions">
          <button
            class="chaoxi-store-import-btn"
            :disabled="importing === item.filename"
            @click="onImport(item)"
          >
            <template v-if="importing === item.filename">
              <svg class="chaoxi-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              导入中...
            </template>
            <template v-else-if="imported.has(item.filename)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              已导入
            </template>
            <template v-else>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              导入预设
            </template>
          </button>
        </div>
      </div>
    </div>
    <ModalDialog :visible="modal.visible.value" :title="modal.title.value" :message="modal.message.value" :mode="modal.mode.value" :default-value="modal.defaultValue.value" @confirm="modal.onConfirm" @cancel="modal.onCancel" />
  </div>
</template>

<script setup lang="ts">
import { PRESET_CATALOG, CDN_BASE, type PresetCatalogItem } from './presetCatalog';
import ModalDialog from './ModalDialog.vue';
import { useModal } from './useModal';

const modal = useModal();
const catalog = PRESET_CATALOG;
const importing = ref('');
const imported = reactive(new Set<string>());

async function onImport(item: PresetCatalogItem) {
  const ok = await modal.showConfirm('导入预设', `确定要导入预设「${item.name}」吗？同名预设将被覆盖。`);
  if (!ok) return;

  importing.value = item.filename;
  try {
    const url = `${CDN_BASE}/${encodeURIComponent(item.filename)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`下载失败: ${resp.status} ${resp.statusText}`);
    const content = await resp.text();
    // importRawPreset 会自动加 .json 后缀，需要去掉文件名中已有的 .json
    const importName = item.filename.replace(/\.json$/i, '');
    const success = await importRawPreset(importName, content);
    if (success) {
      imported.add(item.filename);
      toastr.success(`预设「${item.name}」导入成功`);
    } else {
      toastr.error(`预设「${item.name}」导入失败`);
    }
  } catch (e) {
    console.error('[潮汐预设脚本] 导入预设失败:', e);
    toastr.error(`导入失败: ${(e as Error).message}`);
  } finally {
    importing.value = '';
  }
}
</script>

<style scoped>
.chaoxi-store-view { display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden; }
.chaoxi-store-header { display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(77,201,246,.1);background:rgba(5,8,16,.4);flex-shrink:0; }
.chaoxi-store-title { font-size:13px;font-weight:600;color:rgba(255,255,255,.8); }
.chaoxi-store-subtitle { font-size:11px;color:rgba(255,255,255,.3); }
.chaoxi-store-list { flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px; }
.chaoxi-store-list::-webkit-scrollbar { width:3px; }
.chaoxi-store-list::-webkit-scrollbar-thumb { background:rgba(77,201,246,.12);border-radius:2px; }

.chaoxi-store-card { padding:12px 14px;border-radius:10px;border:1px solid rgba(77,201,246,.1);background:rgba(77,201,246,.02);transition:all .15s; }
.chaoxi-store-card:hover { border-color:rgba(77,201,246,.2);background:rgba(77,201,246,.05); }
.chaoxi-store-card-top { display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px; }
.chaoxi-store-card-name { font-size:13px;font-weight:600;color:rgba(255,255,255,.9); }
.chaoxi-store-card-meta { display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0; }
.chaoxi-store-card-author { font-size:10px;color:rgba(255,255,255,.3); }
.chaoxi-store-card-date { font-size:10px;color:rgba(77,201,246,.62);white-space:nowrap; }
.chaoxi-store-card-desc { font-size:12px;color:rgba(255,255,255,.55);margin:0 0 8px;line-height:1.5; }
.chaoxi-store-card-tags { display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px; }
.chaoxi-store-tag { font-size:10px;padding:2px 7px;border-radius:999px;background:rgba(77,201,246,.08);color:rgba(77,201,246,.6);border:1px solid rgba(77,201,246,.1); }
.chaoxi-store-card-actions { display:flex;justify-content:flex-end; }
.chaoxi-store-import-btn { display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:6px;border:1px solid rgba(52,211,153,.25);background:rgba(52,211,153,.08);color:#34d399;font-size:11px;font-weight:500;cursor:pointer;transition:all .15s; }
.chaoxi-store-import-btn:hover:not(:disabled) { background:rgba(52,211,153,.18);border-color:rgba(52,211,153,.4); }
.chaoxi-store-import-btn:disabled { opacity:.6;cursor:not-allowed; }

@keyframes chaoxi-spin-anim { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
.chaoxi-spin { animation:chaoxi-spin-anim .8s linear infinite; }

/* 弹窗 */
.chaoxi-dialog-overlay { position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:10; }
</style>
