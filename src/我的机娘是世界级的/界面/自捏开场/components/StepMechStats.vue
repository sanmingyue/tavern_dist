<template>
  <div class="step-page">
    <div class="step-header">
      <div class="step-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" stroke-width="1.8">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" stroke-dasharray="2 2" />
          <circle cx="12" cy="12" r="2" fill="#6366f1" />
        </svg>
      </div>
      <h2 class="step-title">五维数据 & 共鸣技能</h2>
      <p class="step-desc">定义她的机械性能与灵魂共鸣</p>
    </div>

    <!-- 雷达图 -->
    <div class="radar-container">
      <svg :viewBox="`0 0 ${svgSize} ${svgSize}`" class="radar-svg">
        <!-- 背景环 -->
        <polygon v-for="level in [1, 0.75, 0.5, 0.25]" :key="level" :points="getPolygonPoints(level)" class="radar-bg" :style="{ opacity: 0.15 + level * 0.1 }" />
        <!-- 轴线 -->
        <line v-for="(_, i) in dimensions" :key="'axis' + i" :x1="center" :y1="center" :x2="getPoint(i, 1).x" :y2="getPoint(i, 1).y" class="radar-axis" />
        <!-- 数据区域 -->
        <polygon :points="dataPoints" class="radar-data" />
        <polygon :points="dataPoints" class="radar-data-stroke" />
        <!-- 数据点 -->
        <circle v-for="(dim, i) in dimensions" :key="'dot' + i" :cx="getPoint(i, store.stats[dim] / 100).x" :cy="getPoint(i, store.stats[dim] / 100).y" r="5" class="radar-dot" />
        <!-- 标签 -->
        <text v-for="(dim, i) in dimensions" :key="'label' + i" :x="getLabelPos(i).x" :y="getLabelPos(i).y" class="radar-label" text-anchor="middle" dominant-baseline="middle">
          {{ dim }}
        </text>
        <!-- 数值 -->
        <text v-for="(dim, i) in dimensions" :key="'val' + i" :x="getLabelPos(i).x" :y="getLabelPos(i).y + 14" class="radar-value" text-anchor="middle" dominant-baseline="middle">
          {{ store.stats[dim] }}
        </text>
      </svg>
      </div>

      <!-- 点数池状态 -->
      <div class="pool-section">
        <div class="pool-header">
          <div class="pool-info">
            <span class="pool-label">剩余点数</span>
            <span class="pool-value" :class="{ danger: store.remainingPoints < 0, warning: store.remainingPoints === 0 }">
              {{ store.remainingPoints }}
            </span>
            <span class="pool-total">/ {{ store.pointPool }}</span>
          </div>
          <div class="pool-bar-wrapper">
            <div class="pool-bar" :style="{ width: Math.max(0, Math.min(100, (store.usedPoints / store.pointPool) * 100)) + '%' }" :class="{ full: store.remainingPoints <= 0 }"></div>
          </div>
        </div>
        <div class="cheat-toggle" @click="store.toggleCheatMode()">
          <div class="cheat-switch" :class="{ active: store.cheatMode }">
            <div class="cheat-knob"></div>
          </div>
          <span class="cheat-text">{{ store.cheatMode ? '🔥 作弊模式 (500点)' : '正常模式 (350点)' }}</span>
          <span v-if="!store.cheatMode" class="cheat-hint">点击切换到作弊模式</span>
          <span v-else class="cheat-hint cheat-active">你是认真的吗？</span>
        </div>
      </div>

      <!-- 五维参考标准 -->
    <div class="ref-card">
      <div class="ref-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" style="color: #6366f1">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
        </svg>
        参考标准
      </div>
      <div class="ref-grid">
        <span class="ref-item"><em>90~100</em> 世界顶尖</span>
        <span class="ref-item"><em>75~89</em> 一流水平</span>
        <span class="ref-item"><em>60~74</em> 优秀</span>
        <span class="ref-item"><em>45~59</em> 良好</span>
        <span class="ref-item"><em>30~44</em> 普通</span>
        <span class="ref-item"><em>&lt;30</em> 有短板</span>
      </div>
    </div>

    <!-- 五维滑块 -->
    <div class="sliders-section">
      <div v-for="dim in dimensions" :key="dim" class="slider-row">
        <div class="slider-label">
          <span class="slider-name">{{ dim }}</span>
          <span class="slider-abbr">{{ dimAbbr[dim] }}</span>
        </div>
        <div class="slider-track-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            :value="store.stats[dim]"
            class="slider-input"
            @input="(e) => store.setStat(dim, Number((e.target as HTMLInputElement).value))"
          />
          <div class="slider-fill" :style="{ width: store.stats[dim] + '%' }"></div>
        </div>
        <span class="slider-value" :class="getValueClass(store.stats[dim])">{{ store.stats[dim] }}</span>
      </div>
    </div>

    <!-- 共鸣技能 -->
    <div class="skill-section">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <h3 class="section-title">共鸣技能 <span class="required">*</span></h3>
          <p class="section-hint">每个机娘终生只有一个共鸣技能，不可更换。技能在首次共鸣时才会被激活显现。</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">技能名称</label>
        <input v-model="store.skill.name" class="form-input" type="text" placeholder="例：月蚀、流星、引力弹弓……" maxlength="20" />
      </div>

      <div class="form-group">
        <label class="form-label">技能效果描述</label>
        <textarea
          v-model="store.skill.desc"
          class="form-textarea"
          placeholder="详细描述技能的发动条件、持续时间、增益效果和代价……&#10;技能既可以强大也可以有缺陷，优劣天差地别才是这个世界的残酷现实。"
          rows="5"
          maxlength="500"
        ></textarea>
        <div class="char-count">{{ store.skill.desc.length }} / 500</div>
      </div>

      <!-- 技能设计提示 -->
      <div class="tip-card">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8b5cf6" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" stroke-linecap="round" />
        </svg>
        <span>好的共鸣技能应该有明确的<strong>增益</strong>和<strong>代价</strong>。技能与机娘的性格、特质密切相关——比如一个偏执的机娘可能有不顾一切的爆发技能，代价是自身损伤。</span>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <button class="nav-btn secondary" @click="store.prevStep()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        返回
      </button>
      <button class="nav-btn primary" :disabled="!store.isStep4Valid" @click="store.nextStep()">
        最终确认
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCreationStore, type FiveDimensions } from '../store';

const store = useCreationStore();

const dimensions: (keyof FiveDimensions)[] = ['加速度', '极速', '操控', '漂移', '耐久'];
const dimAbbr: Record<string, string> = {
  加速度: 'ACC',
  极速: 'SPD',
  操控: 'HDL',
  漂移: 'DFT',
  耐久: 'END',
};

// 雷达图参数
const svgSize = 280;
const center = svgSize / 2;
const radius = 100;
const labelOffset = 28;

function getPoint(index: number, scale: number) {
  const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
  return {
    x: center + radius * scale * Math.cos(angle),
    y: center + radius * scale * Math.sin(angle),
  };
}

function getPolygonPoints(scale: number) {
  return dimensions.map((_, i) => {
    const p = getPoint(i, scale);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function getLabelPos(index: number) {
  const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
  return {
    x: center + (radius + labelOffset) * Math.cos(angle),
    y: center + (radius + labelOffset) * Math.sin(angle),
  };
}

const dataPoints = computed(() => {
  return dimensions.map((dim, i) => {
    const p = getPoint(i, store.stats[dim] / 100);
    return `${p.x},${p.y}`;
  }).join(' ');
});

function getValueClass(val: number) {
  if (val >= 90) return 'legendary';
  if (val >= 75) return 'elite';
  if (val >= 60) return 'good';
  return '';
}
</script>

<style scoped>
.step-page {
  padding-bottom: 16px;
}

.step-header {
  text-align: center;
  margin-bottom: 20px;
}

.step-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: #eef2ff;
  border-radius: 14px;
  margin-bottom: 8px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 4px;
}

.step-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* 雷达图 */
.radar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.radar-svg {
  width: 280px;
  height: 280px;
}

.radar-bg {
  fill: #e8ecf1;
  stroke: #d1d5db;
  stroke-width: 0.5;
}

.radar-axis {
  stroke: #d1d5db;
  stroke-width: 0.5;
}

.radar-data {
  fill: rgba(99, 102, 241, 0.15);
}

.radar-data-stroke {
  fill: none;
  stroke: #6366f1;
  stroke-width: 2;
}

.radar-dot {
  fill: #6366f1;
  stroke: #fff;
  stroke-width: 2;
}

.radar-label {
  font-size: 12px;
  font-weight: 700;
  fill: #374151;
}

.radar-value {
  font-size: 11px;
  font-weight: 600;
  fill: #6366f1;
}

/* 点数池 */
.pool-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.pool-header {
  margin-bottom: 10px;
}

.pool-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.pool-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.pool-value {
  font-size: 28px;
  font-weight: 800;
  color: #6366f1;
  line-height: 1;
}

.pool-value.warning {
  color: #f59e0b;
}

.pool-value.danger {
  color: #ef4444;
}

.pool-total {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.pool-bar-wrapper {
  width: 100%;
  height: 6px;
  background: #e8ecf1;
  border-radius: 3px;
  overflow: hidden;
}

.pool-bar {
  height: 100%;
  background: linear-gradient(90deg, #a5b4fc, #6366f1);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.pool-bar.full {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.cheat-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 0 0;
  user-select: none;
}

.cheat-switch {
  width: 36px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 10px;
  position: relative;
  transition: background 0.25s;
  flex-shrink: 0;
}

.cheat-switch.active {
  background: #ef4444;
}

.cheat-knob {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.25s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.cheat-switch.active .cheat-knob {
  transform: translateX(16px);
}

.cheat-text {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.cheat-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
}

.cheat-hint.cheat-active {
  color: #ef4444;
  font-weight: 600;
}

/* 参考标准 */
.ref-card {
  background: #f8f7ff;
  border: 1px solid #e8e5f8;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 18px;
}

.ref-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 6px;
}

.ref-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2px 12px;
}

.ref-item {
  font-size: 11px;
  color: #64748b;
}

.ref-item em {
  font-style: normal;
  font-weight: 700;
  color: #374151;
}

/* 五维滑块 */
.sliders-section {
  margin-bottom: 24px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.slider-label {
  width: 56px;
  flex-shrink: 0;
}

.slider-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: block;
}

.slider-abbr {
  font-size: 10px;
  color: #94a3b8;
}

.slider-track-wrapper {
  flex: 1;
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
}

.slider-input {
  width: 100%;
  height: 6px;
  appearance: none;
  background: #e8ecf1;
  border-radius: 3px;
  outline: none;
  position: relative;
  z-index: 2;
}

.slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 6px;
  background: linear-gradient(90deg, #a5b4fc, #6366f1);
  border-radius: 3px;
  pointer-events: none;
  z-index: 1;
}

.slider-value {
  width: 36px;
  text-align: right;
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
}

.slider-value.legendary {
  color: #f59e0b;
}

.slider-value.elite {
  color: #6366f1;
}

.slider-value.good {
  color: #10b981;
}

/* 共鸣技能 */
.skill-section {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 8px;
}

.skill-section .section-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #92400e;
  margin: 0;
}

.section-hint {
  font-size: 12px;
  color: #b45309;
  margin: 2px 0 0;
  line-height: 1.5;
}

.required {
  color: #ef4444;
}

.form-group {
  margin-bottom: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.char-count {
  text-align: right;
  font-size: 11px;
  color: #cbd5e1;
  margin-top: 2px;
}

/* 提示卡 */
.tip-card {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #faf5ff;
  border: 1px solid #ede9fe;
  border-radius: 8px;
  margin-top: 8px;
}

.tip-card span {
  font-size: 12px;
  color: #6b21a8;
  line-height: 1.6;
}

.tip-card svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* 底部导航 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.nav-btn.primary:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.nav-btn.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
}

.nav-btn.secondary:hover {
  background: #e2e8f0;
}

/* 手机端适配 */
@media (max-width: 480px) {
  .step-icon {
    width: 44px;
    height: 44px;
  }

  .step-title {
    font-size: 17px;
  }

  .radar-svg {
    width: 240px;
    height: 240px;
  }

  .ref-grid {
    grid-template-columns: 1fr 1fr;
    gap: 2px 8px;
  }

  .slider-label {
    width: 48px;
  }

  .slider-name {
    font-size: 12px;
  }

  .slider-value {
    font-size: 14px;
    width: 30px;
  }

  .skill-section {
    padding: 12px;
  }

  .form-input,
  .form-textarea {
    font-size: 14px;
  }

  .nav-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .tip-card span {
    font-size: 11px;
  }
}
</style>
