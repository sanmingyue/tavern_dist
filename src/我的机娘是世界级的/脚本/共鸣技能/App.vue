<template>
  <!-- 全屏闪烁遮罩 -->
  <div v-if="showFlash" class="resonance-flash" :class="{ 'flash-active': flashActive }"></div>

  <!-- 共鸣技能确认弹窗 -->
  <Teleport :to="hostBody">
    <Transition name="resonance-modal">
      <div v-if="showModal" class="resonance-overlay" @click.self="dismiss">
        <div class="resonance-modal">
          <!-- 顶部光条 -->
          <div class="modal-glow-top"></div>

          <!-- 共鸣图标 -->
          <div class="modal-icon">
            <svg viewBox="0 0 64 64" width="56" height="56">
              <circle cx="32" cy="32" r="28" fill="none" stroke="url(#resonanceGrad)" stroke-width="3" />
              <path
                d="M32 12 L36 28 L52 32 L36 36 L32 52 L28 36 L12 32 L28 28 Z"
                fill="url(#resonanceGrad)"
                opacity="0.9"
              />
              <defs>
                <linearGradient id="resonanceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6366f1" />
                  <stop offset="50%" stop-color="#06b6d4" />
                  <stop offset="100%" stop-color="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- 标题 -->
          <div class="modal-title">共鸣技能就绪</div>

          <!-- 机娘名 + 技能名 -->
          <div class="modal-mech-name">{{ partnerName }}</div>
          <div class="modal-skill-name">「{{ skillName }}」</div>
          <div class="modal-skill-desc">{{ skillDesc }}</div>

          <!-- 按钮组 -->
          <div class="modal-buttons">
            <button class="btn-activate" @click="activateSkill">
              <svg viewBox="0 0 20 20" width="16" height="16" style="margin-right: 6px">
                <polygon points="3,1 17,10 3,19" fill="currentColor" />
              </svg>
              发动共鸣
            </button>
            <button class="btn-dismiss" @click="dismiss">暂不使用</button>
          </div>

          <!-- 底部光条 -->
          <div class="modal-glow-bottom"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Schema } from '../../schema';

const hostBody = window.parent.document.body;

const showFlash = ref(false);
const flashActive = ref(false);
const showModal = ref(false);

const partnerName = ref('');
const skillName = ref('');
const skillDesc = ref('');

// 已经触发过的搭档机娘名（防止同一机娘重复触发）
const triggeredSet = new Set<string>();

// 检测共鸣值
function checkResonance() {
  const raw = Mvu.getMvuData({ type: 'message', message_id: -1 });
  const data = Schema.parse(_.get(raw, 'stat_data'));

  // 只在比赛中检测
  if (data.世界._当前状态 !== '比赛中') return;

  const partner = data.当前比赛._搭档机娘;
  if (!partner) return;

  const mech = data.机娘库[partner];
  if (!mech) return;

  const resonance = mech.共鸣;
  if (!resonance.已激活) return;
  if (resonance.当前共鸣值 < 100) return;

  // 防止重复触发
  if (triggeredSet.has(partner)) return;
  triggeredSet.add(partner);

  // 触发共鸣效果
  partnerName.value = partner;
  skillName.value = resonance.技能名;
  skillDesc.value = resonance.技能描述;
  triggerFlashAndModal();
}

// 触发闪烁 + 弹窗
function triggerFlashAndModal() {
  showFlash.value = true;
  flashActive.value = false;

  // 启动闪烁动画
  requestAnimationFrame(() => {
    flashActive.value = true;
  });

  // 闪烁持续 1.5s 后显示弹窗
  setTimeout(() => {
    showModal.value = true;
  }, 800);

  // 闪烁 2s 后渐隐
  setTimeout(() => {
    flashActive.value = false;
    setTimeout(() => {
      showFlash.value = false;
    }, 500);
  }, 2000);
}

// 发动共鸣技能
async function activateSkill() {
  showModal.value = false;

  // 注入提示词告知 AI 共鸣技能被发动
  const injectText = `[系统提示] 车手发动了搭档机娘「${partnerName.value}」的共鸣技能「${skillName.value}」！技能效果：${skillDesc.value}。共鸣值归零，请在接下来的回复中体现共鸣技能的发动效果和对赛况的影响。`;

  injectPrompts(
    [
      {
        id: `resonance-skill-${Date.now()}`,
        position: 'in_chat',
        depth: 0,
        role: 'system',
        content: injectText,
        should_scan: false,
      },
    ],
    { once: true },
  );

  toastr.success(`共鸣技能「${skillName.value}」已发动！`, partnerName.value);
}

// 暂不使用
function dismiss() {
  showModal.value = false;
  // 移除已触发标记，允许下次再触发
  triggeredSet.delete(partnerName.value);
}

// 监听 MVU 变量更新
onMounted(() => {
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
    checkResonance();
  });
});
</script>

<style scoped>
/* ===== 全屏闪烁遮罩 ===== */
.resonance-flash {
  position: fixed;
  inset: 0;
  z-index: 99998;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.2), transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.resonance-flash.flash-active {
  animation: resonanceFlash 2s ease-out;
}

@keyframes resonanceFlash {
  0% {
    opacity: 0;
  }
  8% {
    opacity: 1;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 255, 255, 0.9),
      rgba(99, 102, 241, 0.6),
      rgba(6, 182, 212, 0.3),
      transparent 80%
    );
  }
  15% {
    opacity: 0.3;
  }
  25% {
    opacity: 0.9;
    background: radial-gradient(
      ellipse at center,
      rgba(245, 158, 11, 0.7),
      rgba(99, 102, 241, 0.5),
      transparent 70%
    );
  }
  35% {
    opacity: 0.2;
  }
  45% {
    opacity: 0.7;
    background: radial-gradient(
      ellipse at center,
      rgba(6, 182, 212, 0.6),
      rgba(99, 102, 241, 0.4),
      transparent 70%
    );
  }
  60% {
    opacity: 0.4;
  }
  75% {
    opacity: 0.15;
  }
  100% {
    opacity: 0;
  }
}

/* ===== 弹窗遮罩 ===== */
.resonance-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* ===== 弹窗主体 ===== */
.resonance-modal {
  position: relative;
  width: 360px;
  max-width: 90vw;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f1729 100%);
  border: 1px solid rgba(99, 102, 241, 0.4);
  clip-path: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));
  padding: 32px 28px;
  text-align: center;
  box-shadow:
    0 0 40px rgba(99, 102, 241, 0.3),
    0 0 80px rgba(6, 182, 212, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

/* 顶部/底部光条 */
.modal-glow-top,
.modal-glow-bottom {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6366f1, #06b6d4, #f59e0b, transparent);
  animation: glowPulse 2s ease-in-out infinite;
}

.modal-glow-top {
  top: 0;
}

.modal-glow-bottom {
  bottom: 0;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 共鸣图标 */
.modal-icon {
  margin-bottom: 16px;
  animation: iconSpin 4s linear infinite;
}

@keyframes iconSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 标题 */
.modal-title {
  font-family: 'Rajdhani', 'Noto Sans SC', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

/* 机娘名 */
.modal-mech-name {
  font-family: 'Rajdhani', 'Noto Sans SC', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
}

/* 技能名 */
.modal-skill-name {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #06b6d4, #f59e0b);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  animation: skillShimmer 3s ease-in-out infinite;
}

@keyframes skillShimmer {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.3);
  }
}

/* 技能描述 */
.modal-skill-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 0 8px;
}

/* 按钮组 */
.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-activate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 28px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  clip-path: polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px));
  transition: all 0.2s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn-activate:hover {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
}

.btn-activate:active {
  transform: translateY(0);
}

.btn-dismiss {
  padding: 10px 20px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 14px;
  cursor: pointer;
  clip-path: polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px));
  transition: all 0.2s ease;
}

.btn-dismiss:hover {
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
}

/* ===== 弹窗过渡动画 ===== */
.resonance-modal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.resonance-modal-leave-active {
  transition: all 0.25s ease-in;
}

.resonance-modal-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.resonance-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
