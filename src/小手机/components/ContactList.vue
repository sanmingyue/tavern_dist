<template>
  <div class="contact-list">
    <div class="contact-header">
      <span class="contact-header-title">消息</span>
      <button class="add-contact-btn" @click="store.showAddContact = true" title="添加好友">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
    <div class="contact-items">
      <div
        v-for="contact in store.contacts"
        :key="contact.name"
        class="contact-item"
        @click="store.selectContact(contact.name)"
      >
        <div class="contact-avatar-wrap" @click.stop="triggerAvatarUpload(contact.name)" title="点击更换头像">
          <img v-if="store.getAvatar(contact.name)" class="contact-avatar-img" :src="store.getAvatar(contact.name)!" :alt="contact.name" />
          <div v-else class="contact-avatar-placeholder" :style="{ background: avatarGradient(contact.name) }">
            {{ contact.avatarChar }}
          </div>
          <!-- 消息红点 -->
          <span v-if="(store.unreadCounts[contact.name] || 0) > 0" class="avatar-badge">
            {{ (store.unreadCounts[contact.name] || 0) > 99 ? '99+' : store.unreadCounts[contact.name] }}
          </span>
        </div>
        <div class="contact-info">
          <div class="contact-name-row">
            <span class="contact-name">{{ contact.name }}</span>
          </div>
          <div class="contact-preview-row">
            <span class="contact-preview">{{ truncate(store.contactPreviews[contact.name]?.content) }}</span>
          </div>
        </div>
        <button class="contact-delete-btn" @click.stop="confirmDelete(contact.name)" title="删除联系人">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div v-if="store.contacts.length === 0" class="contact-empty">
        <!-- 空状态图标 -->
        <svg class="empty-icon-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        <div class="empty-text">暂无联系人</div>
        <div class="empty-hint">点击右上角 + 添加好友，或等待AI输出 &lt;iphone&gt; 标签自动添加</div>
      </div>
    </div>
    <!-- 隐藏的文件选择器 -->
    <input ref="avatarInputRef" type="file" accept="image/*" class="hidden-input" @change="onAvatarSelected" />
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../store';

const store = usePhoneStore();
const avatarInputRef = ref<HTMLInputElement | null>(null);
const pendingAvatarName = ref('');

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function truncate(text?: string): string {
  if (!text) return '';
  return text.length > 20 ? text.slice(0, 20) + '...' : text;
}

function confirmDelete(name: string) {
  if (window.parent.confirm(`确定要删除联系人「${name}」及其聊天记录吗？`)) {
    store.removeContact(name);
  }
}

function triggerAvatarUpload(name: string) {
  pendingAvatarName.value = name;
  avatarInputRef.value?.click();
}

async function onAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !pendingAvatarName.value) return;
  await store.setAvatar(pendingAvatarName.value, file);
  input.value = '';
  pendingAvatarName.value = '';
}
</script>

<style scoped>
.contact-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contact-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.add-contact-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.add-contact-btn:hover {
  background: var(--bg-active);
  color: var(--text-secondary);
}

.contact-items {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--text-hint) transparent;
}

.contact-items::-webkit-scrollbar {
  width: 4px;
}

.contact-items::-webkit-scrollbar-thumb {
  background: var(--text-hint);
  border-radius: 2px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.contact-item:hover {
  background: var(--bg-hover);
}

.contact-item:active {
  background: var(--bg-active);
}

/* 头像容器 */
.contact-avatar-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.contact-avatar-wrap:hover {
  opacity: 0.8;
}

.hidden-input {
  display: none;
}

.contact-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
}

.contact-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

/* 头像右上角红点 */
.avatar-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--bg-secondary);
  line-height: 1;
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.contact-preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-preview {
  font-size: 12px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.contact-delete-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-hint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  opacity: 0;
}

.contact-item:hover .contact-delete-btn {
  opacity: 1;
}

.contact-delete-btn:hover {
  background: rgba(231, 76, 60, 0.15);
  color: var(--danger);
}

.contact-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 8px;
}

.empty-icon-svg {
  color: var(--text-muted);
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: var(--text-tertiary);
}

.empty-hint {
  font-size: 11px;
  color: var(--text-hint);
  text-align: center;
  line-height: 1.4;
}
</style>
