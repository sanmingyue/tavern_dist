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
      <div v-for="contact in filteredContacts" :key="contact.name" class="contact-item" @click="selectContact(contact)">
        <div class="avatar">{{ contact.name.charAt(0) }}</div>
        <div class="contact-info">
          <span class="contact-name">{{ contact.name }}</span>
          <span v-if="contact.alias" class="contact-alias">{{ contact.alias }}</span>
        </div>
        <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
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

    <!-- 联系人详情抽屉 -->
    <div v-if="selectedContact" class="sheet-overlay" @click.self="selectedContact = null">
      <div class="contact-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-profile">
          <div class="avatar large">{{ selectedContact.name.charAt(0) }}</div>
          <div>
            <h2>{{ selectedContact.name }}</h2>
            <p>{{ selectedContact.alias || '未设置备注' }}</p>
          </div>
        </div>
        <div class="quick-actions">
          <button @click="openChat(selectedContact.name)">发消息</button>
          <button @click="callContact">电话</button>
          <button @click="editRemark">备注</button>
          <button @click="removeSelectedContact">删除</button>
        </div>
        <div class="detail-list">
          <div><span>分组标签</span><strong>{{ selectedContact.tags?.join('、') || '默认分组' }}</strong></div>
          <div><span>添加时间</span><strong>{{ formatDate(selectedContact.addedAt) }}</strong></div>
          <div><span>页面结构</span><strong>资料 / 聊天 / 电话 / 备注</strong></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';

defineEmits<{
  (e: 'back'): void;
}>();

const store = usePhoneStore();

const searchQuery = ref('');
const showAddModal = ref(false);
const newContactName = ref('');
const selectedContact = ref<any | null>(null);

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

function selectContact(contact: any) {
  selectedContact.value = contact;
}

function openChat(name: string) {
  store.selectContact(name);
  store.openApp('chat');
}

function callContact() {
  if (!selectedContact.value) return;
  toastr.info(`电话结构已预留：${selectedContact.value.name}`);
}

function editRemark() {
  toastr.info('备注编辑结构已预留');
}

function removeSelectedContact() {
  if (!selectedContact.value) return;
  store.removeContact(selectedContact.value.name);
  selectedContact.value = null;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
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
  padding: 16px;
  background: var(--bg-primary);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 20px;
  color: var(--text-tertiary);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
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
  padding: 12px 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chevron {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.contact-name {
  font-size: 15px;
  font-weight: 500;
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

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  width: 280px;
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.modal-btn.cancel {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.modal-btn.confirm {
  background: var(--accent);
  color: white;
}

.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.48);
}

.contact-sheet {
  width: 100%;
  border-radius: 18px 18px 0 0;
  background: var(--bg-primary);
  padding: 10px 16px 18px;
}

.sheet-handle {
  width: 38px;
  height: 4px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: var(--border-primary);
}

.sheet-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.avatar.large {
  width: 58px;
  height: 58px;
  font-size: 22px;
}

.sheet-profile h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
}

.sheet-profile p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.quick-actions button {
  border: 0;
  border-radius: 12px;
  padding: 10px 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.detail-list {
  display: grid;
  gap: 8px;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary);
}

.detail-list span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.detail-list strong {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}
</style>
