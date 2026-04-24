<template>
  <div class="step-page">
    <div class="step-header">
      <div class="step-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#10b981" stroke-width="1.8">
          <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <h2 class="step-title">档案总览</h2>
      <p class="step-desc">确认你创建的机娘，一切准备就绪</p>
    </div>

    <!-- 车手信息 -->
    <div class="summary-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke-linecap="round" />
        </svg>
        <span>车手信息</span>
      </div>
      <div class="card-row">
        <span class="card-label">车队</span>
        <span class="card-value">{{ store.driverTeamType === '独立' ? '独立车手' : store.driverTeam }}</span>
      </div>
      <div class="card-row">
        <span class="card-label">赛事等级</span>
        <span class="card-value">{{ store.initialTier }}</span>
      </div>
      <div class="card-row">
        <span class="card-label">初始资金</span>
        <span class="card-value">{{ store.initialCredits.toLocaleString() }} 信用点</span>
      </div>
    </div>

    <!-- 机娘基础 -->
    <div class="summary-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b5cf6" stroke-width="2">
          <rect x="2" y="12" width="20" height="6" rx="2" />
          <path d="M5 12l2-5h10l2 5" stroke-linecap="round" />
          <circle cx="7" cy="18" r="1.5" fill="none" />
          <circle cx="17" cy="18" r="1.5" fill="none" />
        </svg>
        <span>机娘档案</span>
      </div>
      <div class="card-row">
        <span class="card-label">名称</span>
        <span class="card-value highlight">{{ store.mechGirl.name || '—' }}</span>
      </div>
      <div class="card-row">
        <span class="card-label">赛车型号</span>
        <span class="card-value">{{ store.mechGirl.carModel || '—' }}</span>
      </div>
      <div v-if="store.mechGirl.carType" class="card-row">
        <span class="card-label">赛车类型</span>
        <span class="card-value">{{ store.mechGirl.carType }}</span>
      </div>
      <div v-if="store.mechGirl.height" class="card-row">
        <span class="card-label">身高</span>
        <span class="card-value">{{ store.mechGirl.height }}</span>
      </div>
      <div v-if="store.mechGirl.appearance" class="card-row">
        <span class="card-label">外貌</span>
        <span class="card-value desc">{{ store.mechGirl.appearance }}</span>
      </div>
    </div>

    <!-- 人格调色盘 -->
    <div class="summary-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42" stroke-linecap="round" />
        </svg>
        <span>人格调色盘</span>
      </div>
      <div class="palette-summary">
        <div class="palette-item">
          <span class="palette-dot" style="background: #1e1b4b"></span>
          <span class="palette-type">底色</span>
          <span class="palette-name">{{ store.palette.底色.name || '—' }}</span>
        </div>
        <div v-for="(c, i) in store.palette.主色调" :key="i" class="palette-item">
          <span class="palette-dot" style="background: #6366f1"></span>
          <span class="palette-type">主色调{{ i + 1 }}</span>
          <span class="palette-name">{{ c.name || '—' }}</span>
        </div>
        <div class="palette-item">
          <span class="palette-dot" style="background: #f59e0b"></span>
          <span class="palette-type">点缀</span>
          <span class="palette-name">{{ store.palette.点缀.name || '—' }}</span>
        </div>
        <div v-for="(d, i) in store.palette.衍生色.filter(v => v.trim())" :key="'d' + i" class="palette-item">
          <span class="palette-dot" style="background: #94a3b8"></span>
          <span class="palette-type">衍生</span>
          <span class="palette-name">{{ d }}</span>
        </div>
      </div>
    </div>

    <!-- 五维 + 技能 -->
    <div class="summary-card">
      <div class="card-header">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          <circle cx="12" cy="12" r="2" fill="#10b981" />
        </svg>
        <span>五维 & 共鸣</span>
      </div>
      <div class="stats-grid">
        <div v-for="dim in dimensions" :key="dim" class="stat-item">
          <span class="stat-name">{{ dim }}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" :style="{ width: store.stats[dim] + '%' }"></div>
          </div>
          <span class="stat-val">{{ store.stats[dim] }}</span>
        </div>
      </div>
      <div class="skill-summary">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <span class="skill-name">{{ store.skill.name || '—' }}</span>
          <span class="skill-desc">{{ store.skill.desc || '未填写' }}</span>
        </div>
      </div>
    </div>

    <!-- 开场状态选择 -->
    <div class="state-section">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round" />
        </svg>
        <div>
          <h3 class="state-title">开场状态</h3>
          <p class="state-hint">选择故事开始时的状态，AI 将按对应的变量更新规则运行</p>
        </div>
      </div>
      <div class="state-options">
        <label
          v-for="state in stateOptions"
          :key="state.value"
          class="state-option"
          :class="{ active: store.openingState === state.value }"
        >
          <input
            type="radio"
            :value="state.value"
            v-model="store.openingState"
            class="state-radio"
          />
          <div class="state-option-content">
            <span class="state-option-icon" v-html="state.icon"></span>
            <span class="state-option-name">{{ state.label }}</span>
            <span class="state-option-desc">{{ state.desc }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 开场白方向 -->
    <div class="opening-section">
      <div class="section-header">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#6366f1" stroke-width="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <h3 class="opening-title">开场白方向</h3>
          <p class="opening-hint">描述你与机娘初次见面的场景设想，AI 将据此生成开场白</p>
        </div>
      </div>
      <textarea
        v-model="store.openingDirection"
        class="form-textarea"
        placeholder="例：在旧仓库里第一次见到蒙尘已久的她，阳光从破损的天窗照进来……&#10;或：拍卖会上，她是最后一件无人问津的拍品……&#10;或：赛场维修区偶然相遇，她在角落里独自检修自己……"
        rows="4"
        maxlength="500"
      ></textarea>
      <div class="char-count">{{ store.openingDirection.length }} / 500</div>
    </div>

    <!-- 完成提示 -->
    <div class="finish-notice" v-if="!store.submitted">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
      </svg>
      <span>确认后，机娘信息将写入世界书条目，变量将写入当前楼层（状态: {{ store.openingState }}）。AI 将按该状态的变量更新规则运行。</span>
    </div>

    <!-- 提交成功提示 -->
    <div class="success-notice" v-if="store.submitted">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2">
        <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="12" cy="12" r="10" />
      </svg>
      <span>机娘「{{ store.mechGirl.name }}」档案已成功写入世界书！你可以关闭此界面，开始你们的故事。</span>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <button class="nav-btn secondary" @click="store.prevStep()" :disabled="store.submitted">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        返回修改
      </button>
      <button
        v-if="!store.submitted"
        class="nav-btn finish"
        :disabled="submitting"
        @click="handleSubmit"
      >
        <svg v-if="!submitting" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
        <span v-if="submitting" class="spinner"></span>
        {{ submitting ? '写入中…' : '确认创建' }}
      </button>
      <span v-else class="done-text">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="#10b981">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
        已完成
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCreationStore, type FiveDimensions } from '../store';

const store = useCreationStore();
const dimensions: (keyof FiveDimensions)[] = ['加速度', '极速', '操控', '漂移', '耐久'];
const submitting = ref(false);

const stateOptions = [
  {
    value: '日常' as const,
    label: '日常',
    desc: '日常休闲、探索、交流',
    icon: '<svg viewBox="0 0 20 20" width="18" height="18" fill="#10b981"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>',
  },
  {
    value: '赛前准备' as const,
    label: '赛前准备',
    desc: '改装、训练、备战',
    icon: '<svg viewBox="0 0 20 20" width="18" height="18" fill="#f59e0b"><path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/></svg>',
  },
  {
    value: '比赛中' as const,
    label: '比赛中',
    desc: '正式赛事进行中',
    icon: '<svg viewBox="0 0 20 20" width="18" height="18" fill="#ef4444"><path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/></svg>',
  },
];

async function handleSubmit() {
  submitting.value = true;
  try {
    await store.submitToWorldbook();
  } finally {
    submitting.value = false;
  }
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
  background: #ecfdf5;
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

/* 总览卡片 */
.summary-card {
  background: #fafbfe;
  border: 1px solid #eef0f6;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eef0f6;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 0;
}

.card-label {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.card-value {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-align: right;
}

.card-value.highlight {
  color: #6366f1;
  font-size: 15px;
}

.card-value.desc {
  font-size: 12px;
  font-weight: 400;
  max-width: 300px;
  line-height: 1.5;
}

/* 调色盘总览 */
.palette-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}

.palette-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.palette-type {
  font-size: 11px;
  color: #94a3b8;
  width: 48px;
  flex-shrink: 0;
}

.palette-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

/* 五维条 */
.stats-grid {
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stat-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  width: 40px;
  flex-shrink: 0;
}

.stat-bar-track {
  flex: 1;
  height: 6px;
  background: #e8ecf1;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #a5b4fc, #6366f1);
  border-radius: 3px;
  transition: width 0.3s;
}

.stat-val {
  font-size: 13px;
  font-weight: 700;
  color: #6366f1;
  width: 28px;
  text-align: right;
}

/* 技能总览 */
.skill-summary {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 10px;
}

.skill-summary svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.skill-name {
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
  display: block;
}

.skill-desc {
  font-size: 12px;
  color: #78716c;
  line-height: 1.5;
  display: block;
  margin-top: 2px;
}

/* 开场状态选择 */
.state-section {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.state-section .section-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.state-title {
  font-size: 15px;
  font-weight: 700;
  color: #92400e;
  margin: 0;
}

.state-hint {
  font-size: 12px;
  color: #b45309;
  margin: 2px 0 0;
  line-height: 1.5;
}

.state-options {
  display: flex;
  gap: 8px;
}

.state-option {
  flex: 1;
  cursor: pointer;
  display: block;
}

.state-radio {
  display: none;
}

.state-option-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  transition: all 0.2s;
}

.state-option.active .state-option-content {
  border-color: #f59e0b;
  background: #fef9ee;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}

.state-option:hover:not(.active) .state-option-content {
  border-color: #d1d5db;
  background: #fafafa;
}

.state-option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.state-option-name {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.state-option-desc {
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
  line-height: 1.3;
}

/* 开场白方向 */
.opening-section {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.opening-section .section-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.opening-title {
  font-size: 15px;
  font-weight: 700;
  color: #0c4a6e;
  margin: 0;
}

.opening-hint {
  font-size: 12px;
  color: #0369a1;
  margin: 2px 0 0;
  line-height: 1.5;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #bae6fd;
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
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.char-count {
  text-align: right;
  font-size: 11px;
  color: #cbd5e1;
  margin-top: 2px;
}

/* 提示 */
.finish-notice {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  margin-bottom: 8px;
}

.finish-notice span {
  font-size: 12px;
  color: #3730a3;
  line-height: 1.6;
}

.finish-notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.success-notice {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: 10px;
  margin-bottom: 8px;
}

.success-notice span {
  font-size: 13px;
  color: #065f46;
  line-height: 1.6;
  font-weight: 500;
}

.success-notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* 底部导航 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.nav-btn.finish {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.nav-btn.finish:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.nav-btn.finish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
}

.nav-btn.secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.nav-btn.secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.done-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

  .summary-card {
    padding: 12px 12px;
  }

  .card-header {
    font-size: 13px;
  }

  .card-value.desc {
    max-width: 180px;
  }

  .state-options {
    flex-direction: column;
  }

  .state-option-content {
    flex-direction: row;
    padding: 10px 12px;
    gap: 8px;
  }

  .state-option-icon {
    width: 28px;
    height: 28px;
  }

  .state-option-name {
    font-size: 13px;
    flex-shrink: 0;
  }

  .state-option-desc {
    text-align: left;
    font-size: 10px;
  }

  .state-section,
  .opening-section {
    padding: 12px;
  }

  .finish-notice,
  .success-notice {
    padding: 10px 12px;
  }

  .finish-notice span,
  .success-notice span {
    font-size: 11px;
  }

  .nav-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .form-textarea {
    font-size: 14px;
    padding: 10px;
  }
}
</style>
