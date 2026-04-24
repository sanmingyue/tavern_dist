<template>
  <div class="step-page">
    <div class="step-header">
      <div class="step-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" stroke-width="1.8">
          <!-- 赛车简化图标 -->
          <rect x="2" y="12" width="20" height="6" rx="2" />
          <circle cx="7" cy="18" r="2" fill="none" />
          <circle cx="17" cy="18" r="2" fill="none" />
          <path d="M5 12l2-5h10l2 5" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="12" y1="7" x2="12" y2="12" />
        </svg>
      </div>
      <h2 class="step-title">机娘档案</h2>
      <p class="step-desc">她从机械中诞生——现在由你定义她的存在</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke-linecap="round" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        机娘名
        <span class="required">*</span>
      </label>
      <input v-model="store.mechGirl.name" class="form-input" type="text" placeholder="她的名字" maxlength="20" />
    </div>

    <div class="form-row">
      <div class="form-group half">
        <label class="form-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="13" width="20" height="5" rx="2" />
            <path d="M5 13l2-5h10l2 5" stroke-linecap="round" />
          </svg>
          赛车型号
          <span class="required">*</span>
        </label>
        <input
          v-model="store.mechGirl.carModel"
          class="form-input"
          type="text"
          placeholder="如 Lamborghini Veneno"
          maxlength="40"
        />
      </div>
      <div class="form-group half">
        <label class="form-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15h16M4 9h16M9 3v18M15 3v18" stroke-linecap="round" />
          </svg>
          赛车类型
        </label>
        <select v-model="store.mechGirl.carType" class="form-select">
          <option value="">请选择</option>
          <option value="超级跑车">超级跑车</option>
          <option value="GT赛车">GT赛车</option>
          <option value="方程式">方程式</option>
          <option value="拉力赛车">拉力赛车</option>
          <option value="漂移赛车">漂移赛车</option>
          <option value="耐力赛车">耐力赛车</option>
          <option value="其他">其他</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M8 6h8" stroke-linecap="round" />
          <path d="M10 22h4" stroke-linecap="round" />
        </svg>
        身高
      </label>
      <input v-model="store.mechGirl.height" class="form-input" type="text" placeholder="如 170cm" maxlength="10" />
    </div>

    <div class="form-group">
      <label class="form-label">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path d="M2 12c2.5-4.5 5.5-7 10-7s7.5 2.5 10 7c-2.5 4.5-5.5 7-10 7s-7.5-2.5-10-7z" stroke-linecap="round" />
        </svg>
        外貌描述
      </label>
      <textarea
        v-model="store.mechGirl.appearance"
        class="form-textarea"
        placeholder="描述她的人形态外貌：发色、瞳色、穿搭风格、标志性特征……"
        rows="4"
        maxlength="300"
      ></textarea>
      <div class="char-count">{{ store.mechGirl.appearance.length }} / 300</div>
    </div>

    <!-- 提示卡 -->
    <div class="tip-card">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8b5cf6" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" stroke-linecap="round" />
      </svg>
      <span>机娘的外貌和赛车型号有关联——赛车服花纹会接近赛车涂装。核心位于胸口正中，有3个改装芯片插口。</span>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <button class="nav-btn secondary" @click="store.prevStep()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        返回
      </button>
      <button class="nav-btn primary" :disabled="!store.isStep2Valid" @click="store.nextStep()">
        下一步：塑造人格
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCreationStore } from '../store';
const store = useCreationStore();
</script>

<style scoped>
.step-page {
  padding-bottom: 16px;
}

.step-header {
  text-align: center;
  margin-bottom: 24px;
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

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
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

/* 提示卡 */
.tip-card {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: #faf5ff;
  border: 1px solid #ede9fe;
  border-radius: 10px;
  margin-bottom: 8px;
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

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-size: 16px;
    padding: 10px 12px;
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
