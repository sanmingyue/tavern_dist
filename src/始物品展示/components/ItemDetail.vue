<template>
  <Transition name="detail">
    <div v-if="item" class="detail-overlay" @click.self="$emit('close')">
      <div class="detail-card" @click.stop>
        <!-- 关闭按钮 -->
        <button class="detail-close" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- 物品图片 -->
        <div class="detail-img-area">
          <img
            :src="itemImage"
            :alt="item.name"
            class="detail-img"
          />
        </div>

        <!-- 物品信息 -->
        <div class="detail-info">
          <div class="detail-name">{{ item.name }}</div>
          <div v-if="itemKeywords" class="detail-keywords">{{ itemKeywords }}</div>
          <div class="detail-desc">{{ item.description }}</div>

          <!-- 可交互操作列表 -->
          <div v-if="interactionList.length > 0" class="detail-interactions">
            <div class="detail-section-title">可用操作</div>
            <div
              v-for="(action, idx) in interactionList"
              :key="idx"
              class="detail-action"
              @click="onActionClick(action)"
            >
              <span class="action-dot"></span>
              <span class="action-name">{{ action.name }}</span>
              <svg class="action-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ItemData } from '../schema';
import { ITEM_IMAGES, ITEM_KEYWORDS, DEFAULT_ITEM_IMAGE } from '../items';

const props = defineProps<{
  item: ItemData | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const itemImage = computed(() => {
  if (!props.item) return DEFAULT_ITEM_IMAGE;
  return ITEM_IMAGES[props.item.name] || DEFAULT_ITEM_IMAGE;
});

const itemKeywords = computed(() => {
  if (!props.item) return '';
  return ITEM_KEYWORDS[props.item.name] || '';
});

interface ActionInfo {
  name: string;
  instruction: string;
}

const interactionList = computed<ActionInfo[]>(() => {
  if (!props.item?.interactions) return [];
  return props.item.interactions.flatMap(record => {
    return Object.entries(record).map(([name, instruction]) => ({ name, instruction }));
  });
});

/**
 * 点击操作：将玩家意图填入酒馆输入框并发送
 *
 * 密室交互脚本使用 registerFunctionTool 注册了 interact 工具，
 * AI 模型会自动识别用户意图并调用对应的 function tool。
 * 玩家只需发送简洁的意图描述即可。
 */
function onActionClick(action: ActionInfo) {
  try {
    // 构建简洁的用户意图
    const userInput = `${action.name}${props.item!.name}`;

    // 通过 jQuery 操作酒馆输入框
    const $textarea = $('#send_textarea');
    if ($textarea.length > 0) {
      // 填入文本
      $textarea.val(userInput);
      // 触发 input 事件让酒馆感知到内容变化
      $textarea.trigger('input');

      // 短暂延迟后点击发送按钮
      setTimeout(() => {
        const $sendBtn = $('#send_but');
        if ($sendBtn.length > 0) {
          $sendBtn.trigger('click');
        }
      }, 100);

      // 关闭详情面板
      emit('close');

      toastr.info(`正在执行：${action.name} → ${props.item!.name}`, '', { timeOut: 2000 });
    } else {
      console.warn('[始物品展示] 未找到酒馆输入框');
      toastr.warning('未找到酒馆输入框');
    }
  } catch (err) {
    console.error('[始物品展示] 操作执行失败:', err);
    toastr.error('操作执行失败');
  }
}
</script>

<style scoped>
.detail-overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(6px);
  pointer-events: auto;
  padding: 16px;
  box-sizing: border-box;
}

.detail-card {
  position: relative;
  max-width: 460px;
  width: 100%;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: linear-gradient(145deg, rgba(18, 22, 35, 0.98), rgba(12, 16, 28, 0.98));
  border-radius: 14px;
  border: 1px solid rgba(200, 170, 110, 0.15);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(200, 170, 110, 0.05);
  margin: auto;
}

.detail-card::-webkit-scrollbar {
  width: 3px;
}

.detail-card::-webkit-scrollbar-thumb {
  background: rgba(200, 170, 110, 0.2);
  border-radius: 2px;
}

.detail-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-close:hover {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.detail-img-area {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 14px 14px 0 0;
}

.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-info {
  padding: 18px 22px 22px;
}

.detail-name {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.detail-keywords {
  font-size: 12px;
  color: rgba(200, 170, 110, 0.6);
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}

.detail-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.7;
  margin-bottom: 16px;
}

.detail-interactions {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 14px;
}

.detail-section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(200, 170, 110, 0.7);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
}

.detail-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 6px;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}

.detail-action:hover {
  background: rgba(200, 170, 110, 0.1);
  border-color: rgba(200, 170, 110, 0.2);
}

.detail-action:active {
  background: rgba(200, 170, 110, 0.15);
  transform: scale(0.98);
}

.action-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(200, 170, 110, 0.5);
  flex-shrink: 0;
}

.detail-action:hover .action-dot {
  background: rgba(200, 170, 110, 0.8);
}

.action-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
}

.detail-action:hover .action-name {
  color: rgba(255, 255, 255, 0.95);
}

.action-arrow {
  color: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  transition: color 0.2s, transform 0.2s;
}

.detail-action:hover .action-arrow {
  color: rgba(200, 170, 110, 0.7);
  transform: translateX(2px);
}

/* 过渡动画 */
.detail-enter-active,
.detail-leave-active {
  transition: opacity 0.25s ease;
}

.detail-enter-active .detail-card,
.detail-leave-active .detail-card {
  transition: transform 0.25s ease;
}

.detail-enter-from,
.detail-leave-to {
  opacity: 0;
}

.detail-enter-from .detail-card {
  transform: scale(0.92) translateY(10px);
}

.detail-leave-to .detail-card {
  transform: scale(0.92) translateY(10px);
}

/* 手机端适配 */
@media (max-width: 500px) {
  .detail-overlay {
    padding: 8px;
  }

  .detail-card {
    max-width: 100%;
    border-radius: 12px;
  }

  .detail-img-area {
    aspect-ratio: 4 / 3;
    border-radius: 12px 12px 0 0;
  }

  .detail-info {
    padding: 14px 16px 16px;
  }

  .detail-name {
    font-size: 15px;
  }

  .detail-keywords {
    font-size: 11px;
  }

  .detail-desc {
    font-size: 12px;
  }

  .action-name {
    font-size: 13px;
  }
}
</style>
