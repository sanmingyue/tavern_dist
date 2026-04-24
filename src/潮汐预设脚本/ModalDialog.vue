<template>
  <Transition name="chaoxi-modal">
    <div v-if="visible" class="chaoxi-modal-overlay" @click.self="onCancel">
      <div class="chaoxi-modal">
        <div class="chaoxi-modal-header">
          <span class="chaoxi-modal-title">{{ title }}</span>
        </div>
        <div class="chaoxi-modal-body">
          <p v-if="message" class="chaoxi-modal-message">{{ message }}</p>
          <input
            v-if="mode === 'prompt'"
            ref="inputRef"
            class="chaoxi-modal-input"
            v-model="inputValue"
            @keydown.enter="onConfirm"
            @keydown.escape="onCancel"
            spellcheck="false"
          />
        </div>
        <div class="chaoxi-modal-footer">
          <button class="chaoxi-modal-btn chaoxi-modal-btn-cancel" @click="onCancel">取消</button>
          <button class="chaoxi-modal-btn chaoxi-modal-btn-ok" @click="onConfirm">确定</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  title: string;
  message?: string;
  mode: 'confirm' | 'prompt';
  defaultValue?: string;
}>();

const emit = defineEmits<{
  confirm: [value: string | true];
  cancel: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');

watch(
  () => props.visible,
  val => {
    if (val) {
      inputValue.value = props.defaultValue ?? '';
      nextTick(() => {
        inputRef.value?.focus();
        inputRef.value?.select();
      });
    }
  },
);

function onConfirm() {
  if (props.mode === 'prompt') {
    const v = inputValue.value.trim();
    if (!v) return;
    emit('confirm', v);
  } else {
    emit('confirm', true);
  }
}

function onCancel() {
  emit('cancel');
}
</script>

<style scoped>
.chaoxi-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
  box-sizing: border-box;
}

.chaoxi-modal {
  width: 340px;
  max-width: 90vw;
  max-height: 80vh;
  background: #0a0e1a;
  border: 1px solid rgba(77, 201, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  margin: auto;
}

.chaoxi-modal-header {
  padding: 14px 18px 0;
}

.chaoxi-modal-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.chaoxi-modal-body {
  padding: 12px 18px 16px;
}

.chaoxi-modal-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 12px;
  line-height: 1.5;
}

.chaoxi-modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(77, 201, 246, 0.2);
  border-radius: 6px;
  background: rgba(5, 8, 16, 0.8);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.chaoxi-modal-input:focus {
  border-color: #4dc9f6;
  box-shadow: 0 0 0 2px rgba(77, 201, 246, 0.1);
}

.chaoxi-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 18px 14px;
}

.chaoxi-modal-btn {
  padding: 6px 20px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.chaoxi-modal-btn-cancel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
}
.chaoxi-modal-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.chaoxi-modal-btn-ok {
  border: 1px solid rgba(77, 201, 246, 0.3);
  background: rgba(77, 201, 246, 0.15);
  color: #4dc9f6;
}
.chaoxi-modal-btn-ok:hover {
  background: rgba(77, 201, 246, 0.25);
}

/* 过渡 */
.chaoxi-modal-enter-active,
.chaoxi-modal-leave-active {
  transition: opacity 0.2s ease;
}
.chaoxi-modal-enter-from,
.chaoxi-modal-leave-to {
  opacity: 0;
}
</style>
