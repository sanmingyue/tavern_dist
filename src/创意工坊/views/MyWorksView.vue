<template>
  <div class="ws-myworks" :class="{ mobile: isMobile }">
    <!-- 未登录 -->
    <div v-if="!isLoggedIn" class="ws-login-prompt">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linecap="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
      <p>登录后查看你的作品</p>
      <button class="ws-login-btn" @click="auth.login()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"
          />
        </svg>
        请先到「账号」页面登录
      </button>
    </div>

    <!-- 已登录 -->
    <template v-else>
      <div class="ws-myworks-header">
        <span class="ws-myworks-title">我的作品</span>
        <span class="ws-myworks-count">{{ works.length }} 个</span>
        <button class="ws-refresh-btn" @click="loadMyWorks">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <div class="ws-myworks-list">
        <div v-for="work in works" :key="work.id" class="ws-mywork-card" @click="openDetail(work)">
          <div class="ws-mywork-left">
            <img
              v-if="work.cover_url"
              :src="work.cover_url"
              class="ws-mywork-cover"
              @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
            />
            <div v-else class="ws-mywork-cover-ph">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              </svg>
            </div>
          </div>
          <div class="ws-mywork-info">
            <div class="ws-mywork-title">{{ work.title }}</div>
            <div class="ws-mywork-meta">
              <span class="ws-mywork-type">{{ getTypeLabel(work.type) }}</span>
              <span class="ws-mywork-status" :class="'status-' + work.status">
                {{ statusLabels[work.status] || work.status }}
              </span>
              <span class="ws-mywork-stats">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                {{ work.like_count }}
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="margin-left: 4px"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {{ work.download_count }}
              </span>
            </div>
            <div v-if="work.status === 'rejected' && work.reject_reason" class="ws-mywork-reject">
              拒绝原因: {{ work.reject_reason }}
            </div>
            <div class="ws-mywork-date">{{ work.created_at?.split('T')[0] }}</div>
          </div>
          <div class="ws-mywork-actions">
            <button class="ws-small-btn ws-btn-edit" title="修改" @click.stop="openEdit(work)">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            <button class="ws-small-btn ws-btn-delete" title="删除" @click.stop="onDelete(work)">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="works.length === 0 && !loading" class="ws-empty-sm">还没有上传过作品</div>

        <div v-if="loading" class="ws-loading-sm">
          <svg
            class="ws-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    </template>

    <!-- 详情弹窗 -->
    <Transition name="ws-dialog">
      <div v-if="detailWork" class="ws-dialog-overlay" @click.self="detailWork = null">
        <!-- 关闭按钮浮出在覆盖层顶部 -->
        <button class="ws-overlay-close-btn" @click="detailWork = null">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- 人设/OC 专属沉浸式布局 -->
        <div v-if="detailWork.type === 'persona'" class="ws-showcase-panel" :class="{ mobile: isMobile }">
          <div class="ws-showcase-content-wrap">
            <div class="ws-showcase-name-block">
              <div class="ws-showcase-type">{{ getTypeLabel(detailWork.type) }}</div>
              <div class="ws-showcase-title" :title="detailWork.char_name || detailWork.title">
                {{ detailWork.char_name || detailWork.title }}
              </div>
            </div>

            <div v-if="detailWork.description" class="ws-showcase-quote">{{ detailWork.description }}</div>

            <div class="ws-showcase-meta">
              <span class="ws-mywork-status" :class="'status-' + detailWork.status">{{
                statusLabels[detailWork.status] || detailWork.status
              }}</span>
              <span class="ws-showcase-date">{{ detailWork.created_at?.split('T')[0] }}</span>
            </div>

            <div v-if="detailWork.tags.length > 0" class="ws-showcase-tags">
              <span v-for="tag in detailWork.tags" :key="tag" class="ws-showcase-tag">#{{ tag }}</span>
            </div>

            <div class="ws-showcase-actions">
              <button class="ws-action-btn" @click="showContentModal = true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                查看
              </button>
              <button class="ws-action-btn ws-btn-edit-outline" @click="openEdit(detailWork)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                修改
              </button>
              <button
                class="ws-action-btn ws-btn-delete-outline"
                @click="
                  onDelete(detailWork);
                  detailWork = null;
                "
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                删除
              </button>
            </div>
          </div>

          <div class="ws-showcase-portrait-wrap">
            <img
              v-if="detailWork.cover_url"
              :src="detailWork.cover_url"
              class="ws-showcase-img"
              @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
            />
            <div v-else class="ws-showcase-img-fallback">SillyTavern</div>
          </div>
        </div>

        <!-- 普通类型标准布局 -->
        <div v-else class="ws-detail-dialog" :class="{ mobile: isMobile }">
          <div class="ws-detail-top">
            <span class="ws-detail-title">{{ detailWork.title }}</span>
            <button class="ws-btn-icon-sm" @click="detailWork = null">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="ws-detail-body">
            <img
              v-if="detailWork.cover_url"
              :src="detailWork.cover_url"
              class="ws-detail-cover"
              @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
            />
            <div class="ws-detail-meta">
              <span class="ws-detail-type">{{ getTypeLabel(detailWork.type) }}</span>
              <span class="ws-mywork-status" :class="'status-' + detailWork.status">{{
                statusLabels[detailWork.status] || detailWork.status
              }}</span>
              <span class="ws-detail-date">{{ detailWork.created_at?.split('T')[0] }}</span>
            </div>
            <div v-if="detailWork.reject_reason" class="ws-detail-reject-reason">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              拒绝原因: {{ detailWork.reject_reason }}
            </div>
            <div v-if="detailWork.card_link" class="ws-detail-card-link">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              适配角色卡: {{ detailWork.card_link }}
            </div>
            <div v-if="detailWork.tags.length > 0" class="ws-detail-tags">
              <span v-for="tag in detailWork.tags" :key="tag" class="ws-detail-tag">#{{ tag }}</span>
            </div>
            <div v-if="detailWork.description" class="ws-detail-desc">{{ detailWork.description }}</div>
            <template v-if="detailWork.type !== 'collection'">
              <div class="ws-detail-content-label">内容预览</div>
              <div class="ws-detail-content">{{ detailContentPreview }}</div>
            </template>
            <div v-else class="ws-detail-collection-notice">此作品为角色卡 PNG 文件。</div>
          </div>
          <div class="ws-detail-actions">
            <button
              class="ws-action-btn ws-btn-delete-outline"
              @click="
                onDelete(detailWork);
                detailWork = null;
              "
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              删除作品
            </button>
            <button class="ws-action-btn ws-btn-edit-outline" @click="openEdit(detailWork)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              修改作品
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 文本内容查看弹窗 -->
    <Transition name="ws-dialog">
      <div
        v-if="showContentModal"
        class="ws-dialog-overlay"
        style="z-index: 10001"
        @click.self="showContentModal = false"
      >
        <div class="ws-detail-dialog" :class="{ mobile: isMobile }" style="max-width: 800px; max-height: 85vh">
          <div class="ws-detail-top">
            <span class="ws-detail-title">{{ detailWork?.char_name || detailWork?.title }} - 设定内容</span>
            <button class="ws-btn-icon-sm" @click="showContentModal = false">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div
            class="ws-detail-body"
            style="
              padding: 24px;
              overflow-y: auto;
              white-space: pre-wrap;
              font-family: monospace;
              font-size: 14px;
              line-height: 1.6;
              color: rgba(255, 255, 255, 0.85);
              background: var(--ws-bg-deep);
            "
          >
            {{ (detailWork as any)?.content || detailContentPreview || '暂无详细内容' }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { deleteWorkApi, fetchMyWorks } from '../api';
import { DEBUG_MODE, getTypeLabel, type MyWork } from '../types';

const props = defineProps<{
  isMobile: boolean;
  auth: any;
}>();

const emit = defineEmits<{
  'edit-work': [work: any];
}>();

const isLoggedIn = computed(() => DEBUG_MODE || props.auth.isLoggedIn.value);

const works = ref<MyWork[]>([]);
const loading = ref(false);
const detailWork = ref<MyWork | null>(null);
const showContentModal = ref(false);

const detailContentPreview = computed(() => {
  const content = (detailWork.value as any)?.content || '';
  return content.length > 2000 ? content.substring(0, 2000) + '...' : content;
});

const statusLabels: Record<string, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
};

async function loadMyWorks() {
  if (!isLoggedIn.value) return;
  loading.value = true;
  try {
    if (DEBUG_MODE) {
      works.value = [
        {
          id: 901,
          title: '我的测试正则',
          description: 'desc',
          type: 'regex',
          tags: ['测试'],
          cover_url: null,
          card_link: '',
          file_type: 'json',
          status: 'approved',
          reject_reason: '',
          download_count: 10,
          like_count: 5,
          created_at: '2026-05-01T12:00:00Z',
          updated_at: '2026-05-01T12:00:00Z',
        },
        {
          id: 902,
          title: '被拒绝的作品',
          char_name: '测试角色',
          description: 'desc',
          type: 'persona',
          tags: ['测试'],
          cover_url: null,
          card_link: '',
          file_type: 'json',
          status: 'rejected',
          reject_reason: '图片包含敏感内容',
          download_count: 0,
          like_count: 0,
          created_at: '2026-05-02T12:00:00Z',
          updated_at: '2026-05-02T12:00:00Z',
        },
        {
          id: 903,
          title: '审核中的合集',
          description: 'desc',
          type: 'collection',
          tags: ['测试'],
          cover_url: null,
          card_link: '',
          file_type: 'png',
          status: 'pending',
          reject_reason: '',
          download_count: 0,
          like_count: 0,
          created_at: '2026-05-03T12:00:00Z',
          updated_at: '2026-05-03T12:00:00Z',
        },
      ];
      return;
    }
    const data = await fetchMyWorks();
    works.value = data.works;
  } catch (e) {
    console.error('[创意工坊] 加载我的作品失败:', e);
  } finally {
    loading.value = false;
  }
}

async function openDetail(work: MyWork) {
  if (DEBUG_MODE && work.id > 900) {
    detailWork.value = { ...work, content: '[DEBUG] 这里是作品内容预览文本。', updated_at: work.created_at } as any;
    showContentModal.value = false;
    return;
  }
  try {
    const { fetchWorkDetail } = await import('../api');
    const detail = await fetchWorkDetail(work.id);
    detailWork.value = { ...work, ...detail };
    showContentModal.value = false;
  } catch (e) {
    toastr.error('加载详情失败');
  }
}

async function openEdit(work: MyWork) {
  // 通过 emit 让 App 切换到上传页面的编辑模式
  try {
    const { fetchWorkDetail } = await import('../api');
    const detail = DEBUG_MODE ? null : await fetchWorkDetail(work.id);
    const full = { ...work, ...(detail || {}) };
    detailWork.value = null; // 关闭详情弹窗
    emit('edit-work', full);
  } catch {
    toastr.error('加载作品内容失败');
  }
}

async function onDelete(work: MyWork) {
  if (!confirm(`确定删除"${work.title}"?`)) return;
  try {
    await deleteWorkApi(work.id);
    works.value = works.value.filter(w => w.id !== work.id);
    toastr.success('已删除');
  } catch (e) {
    toastr.error('删除失败');
  }
}

watch(
  () => isLoggedIn.value,
  v => {
    if (v) loadMyWorks();
  },
  { immediate: true },
);
</script>

<style scoped>
.ws-myworks {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ws-login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px;
}
.ws-login-prompt p {
  font-size: 13px;
}
.ws-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid rgba(88, 101, 242, 0.4);
  background: rgba(88, 101, 242, 0.15);
  color: #7289da;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.ws-login-btn:hover {
  background: rgba(88, 101, 242, 0.25);
}

.ws-myworks-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ws-border);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}
.ws-myworks-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}
.ws-myworks-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}
.ws-refresh-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--ws-border);
  background: var(--ws-glass);
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s;
}
.ws-refresh-btn:hover {
  background: var(--ws-primary-dim);
  color: var(--ws-primary);
  border-color: var(--ws-primary);
  box-shadow: 0 0 8px var(--ws-primary-glow);
}

.ws-myworks-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-myworks-list::-webkit-scrollbar {
  width: 3px;
}
.ws-myworks-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

.ws-mywork-card {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--ws-border);
  margin-bottom: 8px;
  transition: background 0.15s;
}
.ws-mywork-card:hover {
  background: rgba(229, 20, 0, 0.03);
  border-color: rgba(229, 20, 0, 0.2);
}

.ws-mywork-left {
  flex-shrink: 0;
}
.ws-mywork-cover {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
}
.ws-mywork-cover-ph {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  background: var(--ws-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.1);
}

.ws-mywork-info {
  flex: 1;
  min-width: 0;
}
.ws-mywork-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-mywork-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  flex-wrap: wrap;
}
.ws-mywork-type {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--ws-primary-dim);
  color: var(--ws-primary);
  opacity: 0.8;
}
.ws-mywork-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
}
.status-pending {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}
.status-approved {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
}
.status-rejected {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
}
.ws-mywork-stats {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
}
.ws-mywork-reject {
  font-size: 10px;
  color: rgba(248, 113, 113, 0.6);
  margin-top: 3px;
}
.ws-mywork-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
  margin-top: 2px;
}

.ws-mywork-actions {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex-shrink: 0;
}
.ws-small-btn {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.ws-btn-edit:hover {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}
.ws-btn-delete:hover {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
}

.ws-empty-sm {
  text-align: center;
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
  padding: 40px;
}
.ws-loading-sm {
  text-align: center;
  padding: 20px;
  color: var(--ws-primary);
  opacity: 0.5;
}

@keyframes ws-spin-anim {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.ws-spin {
  animation: ws-spin-anim 0.8s linear infinite;
}

/* 详情弹窗 (复用 WorkshopView 样式) */
.ws-mywork-card {
  cursor: pointer;
}
.ws-dialog-overlay {
  position: absolute;
  inset: 0;
  min-height: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 16px;
}
.ws-detail-dialog {
  width: 560px;
  max-width: 100%;
  max-height: 90%;
  min-height: 0;
  background: var(--ws-bg-section);
  border: 1px solid var(--ws-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.8),
    0 0 20px var(--ws-primary-glow);
}
.ws-detail-dialog.mobile {
  width: 100%;
  max-height: 100%;
  border-radius: 12px 12px 0 0;
}
.ws-detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ws-border);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}
.ws-detail-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}
.ws-btn-icon-sm {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.ws-btn-icon-sm:hover {
  background: var(--ws-primary-dim);
  color: var(--ws-primary);
  border-color: var(--ws-primary);
  box-shadow: 0 0 8px var(--ws-primary-glow);
}
.ws-detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-detail-body::-webkit-scrollbar {
  width: 3px;
}
.ws-detail-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}
.ws-detail-cover {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid var(--ws-border);
}
.ws-detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.ws-detail-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(229, 20, 0, 0.15);
  color: var(--ws-primary);
  font-weight: 600;
  border: 1px solid rgba(229, 20, 0, 0.3);
}
.ws-detail-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}
.ws-detail-reject-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
}
.ws-detail-card-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ws-primary);
  background: var(--ws-primary-dim);
  border: 1px solid rgba(229, 20, 0, 0.3);
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
}
.ws-detail-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.ws-detail-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--ws-glass);
  border: 1px solid var(--ws-border);
  color: rgba(255, 255, 255, 0.5);
}
.ws-detail-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 12px;
}
.ws-detail-content-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.ws-detail-content {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--ws-border);
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  line-height: 1.5;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-detail-collection-notice {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(229, 20, 0, 0.05);
  border: 1px solid rgba(229, 20, 0, 0.2);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}
.ws-detail-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--ws-border);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.ws-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--ws-border);
  background: var(--ws-glass);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.ws-btn-delete-outline {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.06);
  color: #f87171;
}
.ws-btn-delete-outline:hover {
  background: rgba(248, 113, 113, 0.15);
  border-color: #f87171;
  box-shadow: 0 0 10px rgba(248, 113, 113, 0.3);
}
.ws-btn-edit-outline {
  border-color: rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.08);
  color: #fbbf24;
}
.ws-btn-edit-outline:hover:not(:disabled) {
  background: rgba(251, 191, 36, 0.16);
  border-color: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.28);
}
.ws-edit-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-edit-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 4px;
}
.ws-edit-input {
  width: 100%;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #000 !important;
  color: rgba(255, 255, 255, 0.84) !important;
  padding: 8px 10px;
  font-size: 12px;
  outline: none;
}
.ws-edit-input:focus {
  border-color: var(--ws-primary);
  box-shadow: 0 0 10px var(--ws-primary-glow);
}
.ws-edit-textarea {
  min-height: 76px;
  resize: vertical;
}
.ws-edit-content {
  min-height: 220px;
  resize: vertical;
  font-family: monospace;
  line-height: 1.5;
}
.ws-dialog-enter-active,
.ws-dialog-leave-active {
  transition: opacity 0.2s ease;
}
.ws-dialog-enter-from,
.ws-dialog-leave-to {
  opacity: 0;
}
/* 沉浸式展示面板 (Persona 专属) */
.ws-showcase-panel {
  position: relative;
  width: 85%;
  height: 85%;
  max-width: 1400px;
  min-height: 0;
  background: #0f0f15;
  border-radius: 16px;
  border: 1px solid var(--ws-border);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 30px var(--ws-primary-glow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: 0 0 0 6%;
}

.ws-showcase-panel.mobile {
  flex-direction: column;
  padding: 0;
  height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  justify-content: flex-start;
}

.ws-overlay-close-btn {
  position: absolute;
  top: 40px;
  right: 40px;
  width: 44px;
  height: 44px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.ws-overlay-close-btn:hover {
  background: var(--ws-primary);
  border-color: var(--ws-primary);
  color: #fff;
  box-shadow: 0 0 15px var(--ws-primary-glow);
  transform: scale(1.1);
}
.ws-showcase-close:hover {
  color: #fff;
  background: var(--ws-primary);
  border-color: var(--ws-primary);
  box-shadow: 0 0 15px var(--ws-primary-glow);
}

.ws-showcase-bg-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 280px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.02);
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  letter-spacing: 10px;
}

.ws-showcase-content-wrap {
  position: relative;
  z-index: 3;
  width: 55%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 100%;
  padding: 40px 0;
}
.ws-showcase-panel.mobile .ws-showcase-content-wrap {
  width: 100%;
  padding: 24px;
  order: 2;
}

.ws-showcase-name-block {
  display: flex;
  flex-direction: column;
}
.ws-showcase-type {
  font-size: 1rem;
  color: var(--ws-primary);
  letter-spacing: 4px;
  font-weight: 700;
  margin-bottom: 8px;
  opacity: 0.8;
}
.ws-showcase-title {
  font-size: clamp(2.5rem, 4.5rem, 4.5rem);
  font-weight: 900;
  letter-spacing: 4px;
  line-height: 1.1;
  background: linear-gradient(135deg, #fff 0%, #e0e0f0 50%, var(--ws-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ws-showcase-quote {
  font-size: 1.1rem;
  font-style: italic;
  color: rgba(200, 200, 220, 0.9);
  line-height: 1.8;
  border-left: 2px solid var(--ws-primary);
  padding-left: 16px;
}

.ws-showcase-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.ws-showcase-author {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
}

.ws-showcase-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ws-showcase-tag {
  padding: 4px 12px;
  border: 1px solid var(--ws-border);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  letter-spacing: 1px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
}

.ws-showcase-content {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.8;
  overflow-y: auto;
  max-height: 200px;
  padding-right: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-showcase-content::-webkit-scrollbar {
  width: 4px;
}
.ws-showcase-content::-webkit-scrollbar-thumb {
  background: var(--ws-primary);
  border-radius: 4px;
}

.ws-showcase-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: nowrap;
}

.ws-showcase-portrait-wrap {
  position: relative;
  z-index: 2;
  width: 80%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  margin-left: -35%;
}
.ws-showcase-panel.mobile .ws-showcase-portrait-wrap {
  width: 100%;
  height: 50vh;
  margin-left: 0;
  order: 1;
}

.ws-showcase-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 85%);
  mask-image: linear-gradient(to right, transparent 0%, black 85%);
}
.ws-showcase-panel.mobile .ws-showcase-img {
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 40%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 40%);
  object-position: center top;
}

.ws-showcase-img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 900;
  color: var(--ws-primary);
  opacity: 0.1;
  letter-spacing: 20px;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 60%);
  mask-image: linear-gradient(to right, transparent 0%, black 60%);
  background: radial-gradient(circle, var(--ws-primary-dim) 0%, transparent 70%);
}

/* 手机弹层必须被限制在酒馆面板内部，避免 90vh/88vh 撑出可视区后无法触摸滚动 */
.ws-myworks.mobile .ws-dialog-overlay {
  padding: 0;
  overflow: hidden;
}
.ws-myworks.mobile .ws-detail-dialog.mobile {
  width: 100%;
  height: 100%;
  max-height: 100% !important;
  border-radius: 0;
  align-self: stretch;
}
.ws-myworks.mobile .ws-overlay-close-btn {
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
}
.ws-myworks.mobile .ws-showcase-panel.mobile {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  align-self: stretch;
}
.ws-myworks.mobile .ws-showcase-portrait-wrap {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  min-height: unset;
  margin-left: 0;
  order: 1;
}
.ws-myworks.mobile .ws-showcase-content-wrap {
  width: 100%;
  max-height: none;
  padding: 16px 18px;
  gap: 10px;
  order: 2;
}
.ws-myworks.mobile .ws-showcase-title {
  font-size: clamp(1.6rem, 10vw, 2.2rem);
  white-space: normal;
  word-break: keep-all;
  letter-spacing: 2px;
}
.ws-myworks.mobile .ws-showcase-quote {
  font-size: 0.85rem;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ws-myworks.mobile .ws-showcase-actions {
  flex-wrap: wrap;
  gap: 8px;
}
.ws-myworks.mobile .ws-showcase-img {
  -webkit-mask-image: none;
  mask-image: none;
  object-position: center top;
  object-fit: cover;
  border-radius: 0;
}
</style>
