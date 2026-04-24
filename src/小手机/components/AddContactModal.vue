<template>
  <Transition name="modal">
    <div v-if="store.showAddContact" class="modal-overlay" @click.self="close">
      <div class="modal-panel">
        <div class="modal-header">
          <span class="modal-title">添加好友</span>
          <button class="modal-close" @click="close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="input-group">
            <label class="input-label">角色名称</label>
            <input
              ref="inputRef"
              v-model="contactName"
              class="input-field"
              placeholder="输入要添加的角色名..."
              @keydown.enter="handleAdd"
            />
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="close">取消</button>
          <button class="btn btn-confirm" :class="{ disabled: !contactName.trim() }" @click="handleAdd">
            添加
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../store';

const store = usePhoneStore();
const inputRef = ref<HTMLInputElement | null>(null);
const contactName = ref('');
const errorMsg = ref('');

watch(() => store.showAddContact, (show) => {
  if (show) {
    contactName.value = '';
    errorMsg.value = '';
    nextTick(() => inputRef.value?.focus());
  }
});

function close() {
  store.showAddContact = false;
  contactName.value = '';
  errorMsg.value = '';
}

async function handleAdd() {
  const name = contactName.value.trim();
  if (!name) {
    errorMsg.value = '请输入角色名称';
    return;
  }

  if (name === store.resolvedUserName) {
    errorMsg.value = '不能添加自己为好友';
    return;
  }

  if (store.contacts.some(c => c.name === name)) {
    errorMsg.value = `「${name}」已在通讯录中`;
    return;
  }

  errorMsg.value = '';
  const success = await store.addContact(name);
  if (success) {
    close();
  }
}
</script>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.modal-panel {
  width: 85%;
  max-width: 280px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.modal-body {
  padding: 4px 16px 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: var(--accent);
}

.input-field::placeholder {
  color: var(--text-hint);
}

.error-msg {
  margin-top: 8px;
  font-size: 12px;
  color: var(--danger);
}

.modal-footer {
  display: flex;
  gap: 8px;
  padding: 0 16px 14px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: var(--bg-hover);
  color: var(--text-tertiary);
}

.btn-cancel:hover {
  background: var(--bg-active);
  color: var(--text-secondary);
}

.btn-confirm {
  background: var(--accent);
  color: white;
}

.btn-confirm:hover {
  background: var(--accent-hover);
}

.btn-confirm.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: scale(0.9);
}

.modal-leave-to .modal-panel {
  transform: scale(0.9);
}
</style>
