<template>
  <div class="contacts-page">
    <div class="page-header">
      <h1 class="page-title">通讯录</h1>
      <button class="add-btn" @click="showAddModal = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <div class="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="text" v-model="searchQuery" placeholder="搜索联系人" class="search-input" />
    </div>

    <div class="contacts-list" v-if="filteredContacts.length > 0">
      <div v-for="contact in filteredContacts" :key="contact.name" class="contact-item" @click="openChat(contact.name)">
        <AvatarBadge :name="contact.name" size="md" />
        <div class="contact-info">
          <span class="contact-name">{{ contact.name }}</span>
          <span v-if="contact.alias" class="contact-alias">{{ contact.alias }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
      <p>暂无联系人</p>
    </div>

    <!-- 添加联系人弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3 class="modal-title">添加联系人</h3>
        <input type="text" v-model="newContactName" placeholder="联系人名称" class="modal-input" />
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showAddModal = false">取消</button>
          <button class="modal-btn confirm" @click="addContact">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import AvatarBadge from '../../components/AvatarBadge.vue';

defineEmits<{
  (e: 'back'): void;
}>();

const store = usePhoneStore();

const searchQuery = ref('');
const showAddModal = ref(false);
const newContactName = ref('');

const contacts = computed(() => Object.values(store.phoneData.contacts));

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value;
  const query = searchQuery.value.toLowerCase();
  return contacts.value.filter(c => c.name.toLowerCase().includes(query) || c.alias?.toLowerCase().includes(query));
});

function addContact() {
  if (newContactName.value.trim()) {
    store.addContact(newContactName.value.trim());
    newContactName.value = '';
    showAddModal.value = false;
  }
}

function openChat(name: string) {
  store.selectContact(name);
  store.openApp('messages');
}
</script>

<style scoped>
.contacts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 16px;
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: 10px;
  color: var(--text-tertiary);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.contact-item:active { background: var(--bg-hover); }

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-size: 16px;
  font-weight: 400;
  color: var(--text-primary);
}

.contact-alias {
  font-size: 13px;
  color: var(--text-tertiary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 12px;
}

/* iOS 风格 Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal {
  width: 270px;
  padding: 0;
  background: var(--bg-card);
  border-radius: 14px;
  overflow: hidden;
  text-align: center;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding: 20px 16px 4px;
}

.modal-input {
  width: calc(100% - 32px);
  margin: 12px 16px 16px;
  padding: 10px 12px;
  border: 0.5px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
}

.modal-actions {
  display: flex;
  border-top: 0.5px solid var(--border-secondary);
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 0;
  font-size: 17px;
  cursor: pointer;
  background: transparent;
}

.modal-btn.cancel {
  color: var(--accent);
  font-weight: 400;
  border-right: 0.5px solid var(--border-secondary);
}

.modal-btn.confirm {
  color: var(--accent);
  font-weight: 600;
}
</style>
