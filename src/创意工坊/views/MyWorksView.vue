<template>
  <div class="ws-myworks">
    <!-- 未登录 -->
    <div v-if="!auth.isLoggedIn.value" class="ws-login-prompt">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
      </svg>
      <p>登录后查看你的作品</p>
      <button class="ws-login-btn" @click="auth.login()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
        请先到「账号」页面登录
      </button>
    </div>

    <!-- 已登录 -->
    <template v-else>
      <div class="ws-myworks-header">
        <span class="ws-myworks-title">我的作品</span>
        <span class="ws-myworks-count">{{ works.length }} 个</span>
        <button class="ws-refresh-btn" @click="loadMyWorks">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
        </button>
      </div>

      <div class="ws-myworks-list">
        <div
          v-for="work in works"
          :key="work.id"
          class="ws-mywork-card"
        >
          <div class="ws-mywork-left">
            <img v-if="work.cover_url" :src="work.cover_url" class="ws-mywork-cover" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
            <div v-else class="ws-mywork-cover-ph">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
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
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                {{ work.like_count }}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                {{ work.download_count }}
              </span>
            </div>
            <div v-if="work.status === 'rejected' && work.reject_reason" class="ws-mywork-reject">
              拒绝原因: {{ work.reject_reason }}
            </div>
            <div class="ws-mywork-date">{{ work.created_at?.split('T')[0] }}</div>
          </div>
          <div class="ws-mywork-actions">
            <button class="ws-small-btn ws-btn-delete" @click="onDelete(work)" title="删除">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        </div>

        <div v-if="works.length === 0 && !loading" class="ws-empty-sm">
          还没有上传过作品
        </div>

        <div v-if="loading" class="ws-loading-sm">
          <svg class="ws-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getTypeLabel, type MyWork } from '../types';
import { fetchMyWorks, deleteWorkApi } from '../api';

const props = defineProps<{
  isMobile: boolean;
  auth: any;
}>();

const works = ref<MyWork[]>([]);
const loading = ref(false);

const statusLabels: Record<string, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
};

async function loadMyWorks() {
  if (!props.auth.isLoggedIn.value) return;
  loading.value = true;
  try {
    const data = await fetchMyWorks();
    works.value = data.works;
  } catch (e) {
    console.error('[创意工坊] 加载我的作品失败:', e);
  } finally {
    loading.value = false;
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

watch(() => props.auth.isLoggedIn.value, (v) => { if (v) loadMyWorks(); }, { immediate: true });
</script>

<style scoped>
.ws-myworks { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }

.ws-login-prompt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; flex: 1; color: rgba(255,255,255,.3); padding: 40px; }
.ws-login-prompt p { font-size: 13px; }
.ws-login-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 8px; border: 1px solid rgba(88,101,242,.4); background: rgba(88,101,242,.15); color: #7289da; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; }
.ws-login-btn:hover { background: rgba(88,101,242,.25); }

.ws-myworks-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(77,201,246,.1); background: rgba(5,8,16,.4); flex-shrink: 0; }
.ws-myworks-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.7); }
.ws-myworks-count { font-size: 11px; color: rgba(255,255,255,.3); }
.ws-refresh-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(77,201,246,.12); background: rgba(77,201,246,.04); color: rgba(255,255,255,.4); display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: auto; transition: all .15s; }
.ws-refresh-btn:hover { background: rgba(77,201,246,.12); color: #4dc9f6; }

.ws-myworks-list { flex: 1; overflow-y: auto; padding: 8px 12px; }
.ws-myworks-list::-webkit-scrollbar { width: 3px; }
.ws-myworks-list::-webkit-scrollbar-thumb { background: rgba(77,201,246,.12); border-radius: 2px; }

.ws-mywork-card { display: flex; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid rgba(77,201,246,.06); margin-bottom: 8px; transition: background .15s; }
.ws-mywork-card:hover { background: rgba(77,201,246,.03); }

.ws-mywork-left { flex-shrink: 0; }
.ws-mywork-cover { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; }
.ws-mywork-cover-ph { width: 56px; height: 56px; border-radius: 6px; background: rgba(77,201,246,.04); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.1); }

.ws-mywork-info { flex: 1; min-width: 0; }
.ws-mywork-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-mywork-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; flex-wrap: wrap; }
.ws-mywork-type { font-size: 10px; padding: 1px 6px; border-radius: 3px; background: rgba(77,201,246,.08); color: rgba(77,201,246,.6); }
.ws-mywork-status { font-size: 10px; padding: 1px 6px; border-radius: 3px; }
.status-pending { background: rgba(251,191,36,.1); color: #fbbf24; }
.status-approved { background: rgba(52,211,153,.1); color: #34d399; }
.status-rejected { background: rgba(248,113,113,.1); color: #f87171; }
.ws-mywork-stats { display: inline-flex; align-items: center; gap: 2px; font-size: 10px; color: rgba(255,255,255,.25); }
.ws-mywork-reject { font-size: 10px; color: rgba(248,113,113,.6); margin-top: 3px; }
.ws-mywork-date { font-size: 10px; color: rgba(255,255,255,.2); margin-top: 2px; }

.ws-mywork-actions { display: flex; align-items: flex-start; gap: 4px; flex-shrink: 0; }
.ws-small-btn { width: 24px; height: 24px; border-radius: 5px; border: none; background: transparent; color: rgba(255,255,255,.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
.ws-btn-delete:hover { background: rgba(248,113,113,.1); color: #f87171; }

.ws-empty-sm { text-align: center; color: rgba(255,255,255,.2); font-size: 13px; padding: 40px; }
.ws-loading-sm { text-align: center; padding: 20px; color: rgba(77,201,246,.5); }

@keyframes ws-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.ws-spin { animation: ws-spin-anim .8s linear infinite; }
</style>
