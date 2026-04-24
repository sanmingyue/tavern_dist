<template>
  <ArtPageLayout artKey="剑心">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
      </svg>
    </template>

    <!-- 剑心没有熟练度/经验值，显示提示 -->
    <template #realm-extra>
      <div class="hint-text">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>剑心境界随剧情推进，不可凭空提升</span>
      </div>
    </template>

    <!-- 剑心说明卡片 -->
    <template #info>
      <div class="info-section">
        <div class="info-card">
          <div class="info-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
              <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
            </svg>
            <span>何为剑心</span>
          </div>
          <div class="info-content">
            剑心，乃剑修之根本。不在于剑之锋利，而在于心之纯粹。
            心中有剑，万物皆可为剑。剑心通明，可斩情丝、断执念、超然物外。
          </div>
        </div>
      </div>
    </template>

    <!-- 剑心修炼操作区 -->
    <div class="section-header">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" style="display:inline-block;vertical-align:middle">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
      </svg>
      <span>剑心修炼</span>
    </div>

    <!-- 修炼方式 -->
    <div class="input-group">
      <label>修炼方式</label>
      <div class="option-row">
        <button v-for="method in swordMethods" :key="method" :class="['opt-btn', { active: form.method === method }]" @click="form.method = method">{{ method }}</button>
      </div>
    </div>

    <!-- 修炼地点 -->
    <div class="input-group">
      <label>修炼地点</label>
      <input v-model="form.location" type="text" placeholder="如：剑崖、瀑布下、悬崖边" />
    </div>

    <!-- 配合剑术 -->
    <div class="input-group">
      <label>配合剑术</label>
      <input v-model="form.swordTech" type="text" placeholder="如：基础剑法、飞剑术、剑气纵横" />
    </div>

    <!-- 修炼时长 -->
    <div class="input-group">
      <label>修炼时长</label>
      <div class="option-row">
        <button v-for="time in timeOptions" :key="time" :class="['opt-btn', { active: form.duration === time }]" @click="form.duration = time">{{ time }}</button>
      </div>
    </div>

    <!-- 心境状态 -->
    <div class="input-group">
      <label>心境状态</label>
      <div class="option-row">
        <button v-for="mood in moodOptions" :key="mood" :class="['opt-btn', { active: form.mood === mood }]" @click="form.mood = mood">{{ mood }}</button>
      </div>
    </div>

    <!-- 额外补充 -->
    <div class="input-group">
      <label>额外补充</label>
      <textarea v-model="form.extra" placeholder="可补充：顿悟、有人打扰、剑意感悟等特殊情况..." rows="2" />
    </div>

    <!-- 预览 -->
    <div class="preview-box">
      <div class="preview-label">内容预览</div>
      <div class="preview-content">{{ previewContent || '填写上方内容后预览...' }}</div>
    </div>

    <!-- 发送按钮 -->
    <button class="send-btn" :disabled="!canSend" @click="handleSend">
      发送至酒馆
    </button>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ArtPageLayout from './ArtPageLayout.vue';

const swordMethods = ['静心悟剑', '以战养剑', '剑意凝心', '人剑合一', '心剑交融', '剑心通明'];
const timeOptions = ['片刻', '一个时辰', '半日', '一日', '数日', '数月'];
const moodOptions = ['心如止水', '心潮澎湃', '剑意昂扬', '宁静致远', '专注无我', '有所感悟'];

const form = ref({ method: '', location: '', swordTech: '', duration: '', mood: '', extra: '' });

const previewContent = computed(() => {
  const { method, location, swordTech, duration, mood } = form.value;
  if (!method && !location && !swordTech) return '';

  let content = '【剑心修炼】\n\n';
  content += location ? '于' + location : '寻一处静谧之地';
  if (method) content += '，以' + method + '之法';
  if (swordTech) content += '，配合' + swordTech;
  if (duration) content += '，修炼' + duration;
  if (mood) content += '，心境：' + mood;
  content += '。\n\n';

  const methodTexts: Record<string, string> = {
    '以战养剑': '剑光霍霍，敌影重重，在战斗中磨砺剑意...',
    '静心悟剑': '闭目凝神，心如止水，万念俱寂，唯有剑意在心中流转...',
    '人剑合一': '剑在手中，如臂使指，人剑合一，剑意与心神交融...',
  };
  content += methodTexts[method] || '剑意在心中渐渐凝聚，愈发纯粹...';
  content += '\n\n剑心修炼中...';
  return content;
});

const canSend = computed(() => form.value.method || form.value.location || form.value.swordTech);

function handleSend() {
  if (!canSend.value) return;
  const { method, location, swordTech, duration, mood, extra } = form.value;

  let content = '【剑心修炼】\n\n';
  content += location ? '于' + location : '寻一处静谧之地';
  if (method) content += '，以' + method + '之法';
  if (swordTech) content += '，配合' + swordTech;
  if (duration) content += '，修炼' + duration;
  if (mood) content += '，心持' + mood;
  content += '。\n\n';

  const methodTexts: Record<string, string> = {
    '以战养剑': '剑光霍霍，破空之声不绝于耳。在无数次交锋中，剑意愈发锋锐...',
    '静心悟剑': '闭目凝神，呼吸渐渐绵长，心如止水，万念俱寂... 剑意在心中如泉水般涓涓流淌，渐渐凝聚成形...',
    '人剑合一': '剑在手中，如臂使指，人剑合一，剑意与心神彻底交融...',
    '剑意凝心': '剑意凝聚，化作一道精纯的光芒，沉入心海深处，化作剑心种子...',
    '心剑交融': '心神与剑意交融，感知到剑的脉动，仿佛能听到剑的呼吸...',
    '剑心通明': '剑心通明，心如明镜，万事万物皆可一剑斩之... 心中再无杂念，唯有一剑...',
  };
  content += methodTexts[method] || '剑意在心中渐渐凝聚，愈发纯粹，愈发锋锐...';
  content += '\n\n正在见证结果...';
  if (extra?.trim()) content += '\n\n【额外】' + extra.trim();

  triggerSlash('/send ' + content + ' | /trigger');

  form.value = { method: '', location: '', swordTech: '', duration: '', mood: '', extra: '' };
  toastr.success('剑心内容已发送');
}
</script>

<style scoped>
.hint-text { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted, #94a3b8); }

.info-section { padding: 0 12px 12px; flex-shrink: 0; }
.info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
.info-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-secondary, #475569); margin-bottom: 6px; }
.info-content { font-size: 11px; color: var(--text-muted, #64748b); line-height: 1.6; }

.section-header { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text-secondary, #475569); }

.input-group { display: flex; flex-direction: column; gap: 4px; }
.input-group label { font-size: 11px; font-weight: 600; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.5px; }
.input-group input, .input-group textarea { padding: 8px 10px; border: 1px solid var(--card-border, #e8ecf1); border-radius: 6px; font-size: 13px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff); transition: border-color 0.2s; }
.input-group input:focus, .input-group textarea:focus { outline: none; border-color: var(--art-color, #64748b); }
.input-group textarea { resize: vertical; min-height: 50px; }

.option-row { display: flex; flex-wrap: wrap; gap: 6px; }
.opt-btn { padding: 5px 10px; border: 1px solid var(--card-border, #e8ecf1); border-radius: 16px; background: var(--content-bg, #fff); font-size: 12px; color: var(--text-secondary, #475569); cursor: pointer; transition: all 0.2s; }
.opt-btn:hover { border-color: var(--art-color, #64748b); color: var(--art-color, #64748b); }
.opt-btn.active { background: var(--art-color, #64748b); border-color: var(--art-color, #64748b); color: white; }

.preview-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 10px; }
.preview-label { font-size: 10px; font-weight: 700; color: #a16207; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.preview-content { font-size: 12px; color: var(--text-secondary, #475569); line-height: 1.6; white-space: pre-wrap; max-height: 120px; overflow-y: auto; }

.send-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--art-color, #64748b), color-mix(in srgb, var(--art-color, #64748b) 60%, black)); color: white; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px color-mix(in srgb, var(--art-color) 40%, transparent); }
.send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px color-mix(in srgb, var(--art-color) 50%, transparent); }
.send-btn:disabled { background: #e8ecf1; color: var(--text-muted, #94a3b8); cursor: not-allowed; box-shadow: none; }
</style>
