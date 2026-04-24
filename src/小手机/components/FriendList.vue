<template>
  <div class="friend-list">
    <div class="friend-header">
      <span class="friend-header-title">联系人</span>
      <div class="friend-header-actions">
        <button class="friend-add-btn" @click="store.showAddContact = true" title="添加好友">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 我的名片（点击头像换头像） -->
    <div class="my-card" @click="triggerUserAvatarUpload">
      <div class="my-card-avatar">
        <img v-if="store.getUserAvatar()" class="my-card-avatar-img" :src="store.getUserAvatar()!" alt="user" />
        <div v-else class="my-card-avatar-placeholder">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
      <div class="my-card-info">
        <span class="my-card-name">{{ store.resolvedUserName }}</span>
        <span class="my-card-hint">点击头像更换</span>
      </div>
    </div>
    <input ref="userAvatarInputRef" type="file" accept="image/*" class="hidden-input" @change="onUserAvatarSelected" />
    <input ref="contactAvatarInputRef" type="file" accept="image/*" class="hidden-input" @change="onContactAvatarSelected" />

    <!-- 搜索栏 -->
    <div class="friend-search">
      <div class="search-input-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索联系人"
        />
      </div>
    </div>

    <div class="friend-items">
      <!-- 分组：字母索引 -->
      <template v-for="group in groupedContacts" :key="group.letter">
        <div class="friend-group-header">{{ group.letter }}</div>
        <div
          v-for="contact in group.contacts"
          :key="contact.name"
          class="friend-item"
          @click="openChat(contact.name)"
        >
          <div class="friend-avatar-wrap" @click.stop="triggerContactAvatarUpload(contact.name)" title="点击更换头像">
            <img v-if="store.getAvatar(contact.name)" class="friend-avatar-img" :src="store.getAvatar(contact.name)!" :alt="contact.name" />
            <div v-else class="friend-avatar-placeholder" :style="{ background: avatarGradient(contact.name) }">
              {{ contact.avatarChar }}
            </div>
          </div>
          <div class="friend-info">
            <span class="friend-name">{{ contact.name }}</span>
          </div>
        </div>
      </template>

      <div v-if="store.contacts.length === 0" class="friend-empty">
        <!-- 空状态图标 -->
        <svg class="empty-icon-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        <div class="empty-text">暂无联系人</div>
        <div class="empty-hint">点击右上角添加好友</div>
      </div>
    </div>

    <div class="friend-count">{{ store.contacts.length }} 位联系人</div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../store';
import type { Contact } from '../store';

const store = usePhoneStore();
const emit = defineEmits<{
  (e: 'openChat', name: string): void;
}>();
const searchQuery = ref('');
const userAvatarInputRef = ref<HTMLInputElement | null>(null);
const contactAvatarInputRef = ref<HTMLInputElement | null>(null);
const pendingAvatarName = ref('');

const filteredContacts = computed(() => {
  if (!searchQuery.value.trim()) return store.contacts;
  const q = searchQuery.value.trim().toLowerCase();
  return store.contacts.filter(c => c.name.toLowerCase().includes(q));
});

interface ContactGroup {
  letter: string;
  contacts: Contact[];
}

const groupedContacts = computed<ContactGroup[]>(() => {
  const groups: Record<string, Contact[]> = {};
  for (const contact of filteredContacts.value) {
    const firstChar = contact.name.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .map(([letter, contacts]) => ({ letter, contacts }));
});

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

function openChat(name: string) {
  store.selectContact(name);
  emit('openChat', name);
}

function triggerUserAvatarUpload() {
  userAvatarInputRef.value?.click();
}

function triggerContactAvatarUpload(name: string) {
  pendingAvatarName.value = name;
  contactAvatarInputRef.value?.click();
}

async function onUserAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await store.setUserAvatar(file);
  input.value = '';
}

async function onContactAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !pendingAvatarName.value) return;
  await store.setAvatar(pendingAvatarName.value, file);
  input.value = '';
  pendingAvatarName.value = '';
}
</script>

<style scoped>
.friend-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.friend-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.friend-header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.friend-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 我的名片 */
.my-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.my-card:hover {
  background: var(--bg-hover);
}

.my-card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.my-card-avatar-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
}

.my-card-avatar-placeholder {
  width: 44px;
  height: 44px;
  background: var(--accent-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.my-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.my-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.my-card-hint {
  font-size: 11px;
  color: var(--text-hint);
}

.friend-add-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.friend-add-btn:hover { background: var(--bg-active); color: var(--text-secondary); }

.hidden-input { display: none; }

.friend-search {
  padding: 8px 16px;
  flex-shrink: 0;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border-radius: 8px;
  padding: 0 10px;
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.search-input::placeholder { color: var(--text-hint); }

.friend-items {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--text-hint) transparent;
}

.friend-items::-webkit-scrollbar { width: 4px; }
.friend-items::-webkit-scrollbar-thumb { background: var(--text-hint); border-radius: 2px; }

.friend-group-header {
  padding: 4px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  position: sticky;
  top: 0;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.friend-item:hover { background: var(--bg-hover); }
.friend-item:active { background: var(--bg-active); }

.friend-avatar-wrap {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.friend-avatar-wrap:hover {
  opacity: 0.8;
}

.friend-avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.friend-info { flex: 1; min-width: 0; }

.friend-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.friend-count {
  padding: 8px 16px;
  text-align: center;
  font-size: 11px;
  color: var(--text-hint);
  flex-shrink: 0;
  border-top: 1px solid var(--border-secondary);
}

.friend-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 8px;
}

.empty-icon-svg { color: var(--text-muted); opacity: 0.5; }
.empty-text { font-size: 14px; color: var(--text-tertiary); }
.empty-hint { font-size: 11px; color: var(--text-hint); text-align: center; }
</style>
