<template>
  <div class="ws-workshop">
    <!-- 筛选栏 -->
    <div class="ws-filter-bar">
      <div class="ws-filter-left">
        <select class="ws-select" v-model="filterType" @change="page = 1; loadWorks()">
          <option value="">全部类型</option>
          <option v-for="t in WORK_TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
        </select>
        <select class="ws-select" v-model="sortBy" @change="page = 1; loadWorks()">
          <option value="latest">最新</option>
          <option value="popular">最热</option>
          <option value="likes">最多赞</option>
        </select>
      </div>
      <div class="ws-filter-right">
        <span class="ws-filter-count">{{ total }} 个作品</span>
      </div>
    </div>

    <!-- 标签栏 -->
    <div v-if="allTags.length > 0" class="ws-tag-bar">
      <button class="ws-tag-btn" :class="{ active: !filterTag }" @click="filterTag = ''; page = 1; loadWorks()">全部</button>
      <button
        v-for="tag in allTags.slice(0, 20)"
        :key="tag"
        class="ws-tag-btn"
        :class="{ active: filterTag === tag }"
        @click="filterTag = (filterTag === tag ? '' : tag); page = 1; loadWorks()"
      >#{{ tag }}</button>
    </div>

    <!-- 作品网格 -->
    <div class="ws-grid" :class="{ mobile: isMobile }">
      <div
        v-for="work in works"
        :key="work.id"
        class="ws-card"
        @click="openDetail(work)"
      >
        <!-- 封面 -->
        <div class="ws-card-cover">
          <img
            v-if="work.cover_url"
            :src="work.cover_url"
            :alt="work.title"
            class="ws-card-img"
            loading="lazy"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <div class="ws-card-cover-fallback">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <!-- 类型标签 -->
          <div class="ws-card-type">{{ getTypeLabel(work.type) }}</div>
        </div>

        <!-- 信息 -->
        <div class="ws-card-info">
          <div class="ws-card-title" :title="work.title">{{ work.title }}</div>
          <div class="ws-card-author">
            <img v-if="work.author.avatar" :src="work.author.avatar" class="ws-card-avatar" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
            <span>{{ work.author.display_name || work.author.username }}</span>
          </div>
          <div class="ws-card-meta">
            <span class="ws-card-stat">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {{ work.like_count }}
            </span>
            <span class="ws-card-stat">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {{ work.download_count }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="works.length === 0 && !loading" class="ws-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
        <span>暂无作品</span>
      </div>

      <div v-if="loading" class="ws-loading">
        <svg class="ws-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        加载中...
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="ws-pagination">
      <button class="ws-page-arrow" :disabled="page <= 1" @click="page--; loadWorks()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <span class="ws-page-info">{{ page }} / {{ totalPages }}</span>
      <button class="ws-page-arrow" :disabled="page >= totalPages" @click="page++; loadWorks()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>

    <!-- 详情弹窗 -->
    <Transition name="ws-dialog">
      <div v-if="detailWork" class="ws-dialog-overlay" @click.self="detailWork = null">
        <div class="ws-detail-dialog" :class="{ mobile: isMobile }">
          <div class="ws-detail-top">
            <span class="ws-detail-title">{{ detailWork.title }}</span>
            <button class="ws-btn-icon-sm" @click="detailWork = null">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div class="ws-detail-body">
            <!-- 封面 -->
            <img v-if="detailWork.cover_url" :src="detailWork.cover_url" class="ws-detail-cover" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
            <!-- 元信息 -->
            <div class="ws-detail-meta">
              <span class="ws-detail-type">{{ getTypeLabel(detailWork.type) }}</span>
              <span class="ws-detail-author">
                <img v-if="detailWork.author.avatar" :src="detailWork.author.avatar" class="ws-card-avatar" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
                {{ detailWork.author.display_name || detailWork.author.username }}
              </span>
              <span class="ws-detail-date">{{ detailWork.created_at?.split('T')[0] }}</span>
            </div>
            <!-- 角色卡链接 -->
            <div v-if="detailWork.card_link" class="ws-detail-card-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              适配角色卡: {{ detailWork.card_link }}
            </div>
            <!-- 标签 -->
            <div v-if="detailWork.tags.length > 0" class="ws-detail-tags">
              <span v-for="tag in detailWork.tags" :key="tag" class="ws-detail-tag">#{{ tag }}</span>
            </div>
            <!-- 描述 -->
            <div v-if="detailWork.description" class="ws-detail-desc">{{ detailWork.description }}</div>
            <!-- 内容预览（非 collection 类型） -->
            <template v-if="detailWork.type !== 'collection'">
              <div class="ws-detail-content-label">内容预览</div>
              <div class="ws-detail-content">{{ detailContentPreview }}</div>
            </template>
            <!-- collection 类型提示 -->
            <div v-else class="ws-detail-collection-notice">
              此作品为角色卡 PNG 文件，点击下方按钮导入到酒馆或下载文件。
            </div>
          </div>
          <!-- 操作按钮 -->
          <div class="ws-detail-actions">
            <!-- 点赞 -->
            <button class="ws-action-btn ws-btn-like" :class="{ liked: detailWork.liked }" @click="onLike">
              <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {{ detailWork.like_count }}
            </button>

            <!-- regex: 直接导入 + 下载文件 -->
            <template v-if="detailWork.type === 'regex'">
              <button class="ws-action-btn ws-btn-import" @click="onImportRegex" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                导入到酒馆
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadFile" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载文件
              </button>
            </template>

            <!-- persona: 注入世界书 + 下载文件 -->
            <template v-if="detailWork.type === 'persona'">
              <button class="ws-action-btn ws-btn-import" @click="onInjectToWorldbook" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                注入到角色卡世界书
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadFile" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载文件
              </button>
            </template>

            <!-- card_addon: 同 persona/regex 逻辑 -->
            <template v-if="detailWork.type === 'card_addon'">
              <button class="ws-action-btn ws-btn-import" @click="onInjectToWorldbook" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                注入到角色卡世界书
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadFile" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载文件
              </button>
            </template>

            <!-- worldbook: 导入为独立世界书 + 下载文件 -->
            <template v-if="detailWork.type === 'worldbook'">
              <button class="ws-action-btn ws-btn-import" @click="onImportWorldbook" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                导入为独立世界书
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadFile" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载文件
              </button>
            </template>

            <!-- collection: 导入角色卡 + 下载 PNG -->
            <template v-if="detailWork.type === 'collection'">
              <button class="ws-action-btn ws-btn-import" @click="onImportCharacter" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                导入角色卡到酒馆
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadPng" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载 PNG 文件
              </button>
            </template>

            <!-- 复制内容 (非 collection) -->
            <button v-if="detailWork.type !== 'collection'" class="ws-action-btn" @click="onCopyContent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              复制内容
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 确认弹窗 -->
    <Transition name="ws-dialog">
      <div v-if="confirmDialog.show" class="ws-dialog-overlay" @click.self="confirmDialog.show = false">
        <div class="ws-confirm-dialog">
          <div class="ws-confirm-title">{{ confirmDialog.title }}</div>
          <div class="ws-confirm-message">{{ confirmDialog.message }}</div>
          <div class="ws-confirm-actions">
            <button class="ws-action-btn" @click="confirmDialog.show = false">取消</button>
            <button class="ws-action-btn ws-btn-import" @click="confirmDialog.onConfirm(); confirmDialog.show = false">确认</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { WORK_TYPES, getTypeLabel, type WorkItem } from '../types';
import { fetchWorks, fetchTags, fetchWorkDetail, downloadWork, toggleLikeApi } from '../api';

const props = defineProps<{
  searchQuery: string;
  isMobile: boolean;
  auth: any;
}>();

const works = ref<WorkItem[]>([]);
const total = ref(0);
const totalPages = ref(1);
const page = ref(1);
const loading = ref(false);
const actionLoading = ref(false);
const filterType = ref('');
const filterTag = ref('');
const sortBy = ref('latest');
const allTags = ref<string[]>([]);
const detailWork = ref<(WorkItem & { content?: string }) | null>(null);
const detailContentPreview = computed(() => {
  const content = (detailWork.value as any)?.content || '';
  return content.length > 2000 ? content.substring(0, 2000) + '...' : content;
});

const confirmDialog = reactive({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

function showConfirm(title: string, message: string, onConfirm: () => void) {
  confirmDialog.title = title;
  confirmDialog.message = message;
  confirmDialog.onConfirm = onConfirm;
  confirmDialog.show = true;
}

// 监听搜索词变化
watch(() => props.searchQuery, () => { page.value = 1; loadWorks(); });

async function loadWorks() {
  loading.value = true;
  try {
    const data = await fetchWorks({
      page: page.value,
      page_size: 12,
      type: filterType.value || undefined,
      search: props.searchQuery || undefined,
      sort: sortBy.value,
      tag: filterTag.value || undefined,
    });
    works.value = data.works;
    total.value = data.total;
    totalPages.value = data.total_pages;
  } catch (e) {
    console.error('[创意工坊] 加载作品失败:', e);
  } finally {
    loading.value = false;
  }
}

async function loadTags() {
  try {
    allTags.value = await fetchTags();
  } catch { /* ignore */ }
}

async function openDetail(work: WorkItem) {
  try {
    const detail = await fetchWorkDetail(work.id);
    detailWork.value = { ...work, ...detail };
  } catch (e) {
    toastr.error('加载详情失败');
  }
}

async function onLike() {
  if (!props.auth.isLoggedIn.value) { toastr.warning('请先登录'); return; }
  if (!detailWork.value) return;
  try {
    const result = await toggleLikeApi(detailWork.value.id);
    detailWork.value.liked = result.liked;
    detailWork.value.like_count = result.like_count;
    const item = works.value.find(w => w.id === detailWork.value!.id);
    if (item) { item.liked = result.liked; item.like_count = result.like_count; }
  } catch (e) {
    toastr.error('操作失败');
  }
}

// ─── 导入正则 ───
async function onImportRegex() {
  if (!detailWork.value) return;
  actionLoading.value = true;
  try {
    const data = await downloadWork(detailWork.value.id);
    const filename = `${data.title}.json`;
    await importRawTavernRegex(filename, data.content);
    toastr.success(`正则「${data.title}」已导入到酒馆`);
    updateDownloadCount();
  } catch (e) {
    toastr.error(`导入失败: ${(e as Error).message}`);
  } finally {
    actionLoading.value = false;
  }
}

// ─── 注入到角色卡世界书 ───
async function onInjectToWorldbook() {
  if (!detailWork.value) return;
  showConfirm(
    '注入到角色卡世界书',
    `将把「${detailWork.value.title}」的条目注入到当前角色卡的绑定世界书中。确认操作？`,
    async () => {
      actionLoading.value = true;
      try {
        const data = await downloadWork(detailWork.value!.id);
        const content = JSON.parse(data.content);
        // 获取当前角色卡绑定的世界书
        const charWb = getCharWorldbookNames('current');
        const targetWb = charWb.primary || charWb.additional[0];
        if (!targetWb) {
          toastr.warning('当前角色卡没有绑定世界书，请先绑定一个世界书');
          return;
        }
        // 将内容作为条目注入
        const entries = Array.isArray(content) ? content : [content];
        await createWorldbookEntries(targetWb, entries);
        toastr.success(`已将条目注入到世界书「${targetWb}」`);
        updateDownloadCount();
      } catch (e) {
        toastr.error(`注入失败: ${(e as Error).message}`);
      } finally {
        actionLoading.value = false;
      }
    }
  );
}

// ─── 导入为独立世界书 ───
async function onImportWorldbook() {
  if (!detailWork.value) return;
  showConfirm(
    '导入为独立世界书',
    `将创建独立世界书，名称将包含作者名以保护权益。确认导入？`,
    async () => {
      actionLoading.value = true;
      try {
        const data = await downloadWork(detailWork.value!.id);
        const filename = `[${data.author_name}] ${data.title}.json`;
        await importRawWorldbook(filename, data.content);
        toastr.success(`世界书「[${data.author_name}] ${data.title}」已导入`);
        updateDownloadCount();
      } catch (e) {
        toastr.error(`导入失败: ${(e as Error).message}`);
      } finally {
        actionLoading.value = false;
      }
    }
  );
}

// ─── 导入角色卡 (collection) ───
async function onImportCharacter() {
  if (!detailWork.value) return;
  actionLoading.value = true;
  try {
    const data = await downloadWork(detailWork.value.id);
    if (!data.file_url) {
      toastr.error('角色卡文件不存在');
      return;
    }
    // 下载 PNG 文件
    const resp = await fetch(data.file_url);
    const blob = await resp.blob();
    const filename = `${data.title}.png`;
    await importRawCharacter(filename, blob);
    toastr.success(`角色卡「${data.title}」已导入到酒馆`);
    updateDownloadCount();
  } catch (e) {
    toastr.error(`导入失败: ${(e as Error).message}`);
  } finally {
    actionLoading.value = false;
  }
}

// ─── 下载文件（JSON 类型） ───
async function onDownloadFile() {
  if (!detailWork.value) return;
  actionLoading.value = true;
  try {
    const data = await downloadWork(detailWork.value.id);
    // 创建 Blob 下载
    const blob = new Blob([data.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toastr.success(`已下载「${data.title}」`);
    updateDownloadCount();
  } catch (e) {
    toastr.error(`下载失败: ${(e as Error).message}`);
  } finally {
    actionLoading.value = false;
  }
}

// ─── 下载 PNG（collection 类型） ───
async function onDownloadPng() {
  if (!detailWork.value) return;
  actionLoading.value = true;
  try {
    const data = await downloadWork(detailWork.value.id);
    if (!data.file_url) {
      toastr.error('文件不存在');
      return;
    }
    const resp = await fetch(data.file_url);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toastr.success(`已下载「${data.title}.png」`);
    updateDownloadCount();
  } catch (e) {
    toastr.error(`下载失败: ${(e as Error).message}`);
  } finally {
    actionLoading.value = false;
  }
}

async function onCopyContent() {
  if (!detailWork.value) return;
  try {
    const content = (detailWork.value as any).content || '';
    await navigator.clipboard.writeText(content);
    toastr.success('内容已复制到剪贴板');
  } catch {
    toastr.error('复制失败');
  }
}

function updateDownloadCount() {
  if (!detailWork.value) return;
  const item = works.value.find(w => w.id === detailWork.value!.id);
  if (item) item.download_count++;
  if (detailWork.value) detailWork.value.download_count = (detailWork.value.download_count || 0) + 1;
}

// 初始加载
loadWorks();
loadTags();
</script>

<style scoped>
.ws-workshop { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }

/* 筛选栏 */
.ws-filter-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid rgba(77,201,246,.1); background: rgba(5,8,16,.4); flex-shrink: 0; gap: 8px; }
.ws-filter-left { display: flex; gap: 6px; }
.ws-filter-right { display: flex; align-items: center; }
.ws-filter-count { font-size: 11px; color: rgba(255,255,255,.3); }
.ws-select { padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(77,201,246,.15); background: rgba(77,201,246,.04); color: rgba(255,255,255,.7); font-size: 11px; outline: none; cursor: pointer; }
.ws-select option { background: #0a0e1a; color: #e0e0e0; }

/* 标签栏 */
.ws-tag-bar { display: flex; gap: 4px; padding: 6px 10px; border-bottom: 1px solid rgba(77,201,246,.06); flex-shrink: 0; overflow-x: auto; }
.ws-tag-bar::-webkit-scrollbar { height: 0; }
.ws-tag-btn { padding: 2px 8px; font-size: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,.06); background: transparent; color: rgba(255,255,255,.35); cursor: pointer; white-space: nowrap; transition: all .15s; }
.ws-tag-btn:hover { color: rgba(255,255,255,.6); background: rgba(77,201,246,.04); }
.ws-tag-btn.active { color: #4dc9f6; background: rgba(77,201,246,.1); border-color: rgba(77,201,246,.2); }

/* 作品网格 */
.ws-grid { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; align-content: start; }
.ws-grid.mobile { grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px; }
.ws-grid::-webkit-scrollbar { width: 3px; }
.ws-grid::-webkit-scrollbar-thumb { background: rgba(77,201,246,.12); border-radius: 2px; }

/* 卡片 */
.ws-card { position: relative; border-radius: 12px; border: 1px solid rgba(77,201,246,.08); background: rgba(77,201,246,.02); cursor: pointer; transition: all .2s; overflow: hidden; display: flex; flex-direction: column; }
.ws-card:hover { border-color: rgba(77,201,246,.2); background: rgba(77,201,246,.06); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.35); }

.ws-card-cover { width: 100%; aspect-ratio: 4 / 3; position: relative; background: rgba(0,0,0,.15); overflow: hidden; flex-shrink: 0; }
.ws-card-img { width: 100%; height: 100%; object-fit: cover; display: block; position: relative; z-index: 1; }
.ws-card-cover-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.06); }
.ws-card-type { position: absolute; top: 6px; left: 6px; z-index: 2; padding: 2px 8px; border-radius: 4px; background: rgba(5,8,16,.7); color: rgba(77,201,246,.7); font-size: 10px; font-weight: 500; backdrop-filter: blur(4px); }

.ws-card-info { padding: 8px 10px; }
.ws-card-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.9); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-card-author { display: flex; align-items: center; gap: 4px; font-size: 10px; color: rgba(255,255,255,.35); margin-top: 4px; }
.ws-card-avatar { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
.ws-card-meta { display: flex; gap: 8px; margin-top: 4px; }
.ws-card-stat { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,.3); }

/* 空/加载状态 */
.ws-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: rgba(255,255,255,.2); font-size: 13px; padding: 40px 16px; grid-column: 1 / -1; }
.ws-loading { display: flex; align-items: center; justify-content: center; gap: 6px; color: rgba(77,201,246,.5); font-size: 12px; padding: 20px; grid-column: 1 / -1; }

/* 分页 */
.ws-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 14px; border-top: 1px solid rgba(77,201,246,.1); background: rgba(5,8,16,.4); flex-shrink: 0; }
.ws-page-arrow { width: 30px; height: 30px; border-radius: 6px; border: 1px solid rgba(77,201,246,.12); background: rgba(77,201,246,.04); color: rgba(255,255,255,.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
.ws-page-arrow:hover:not(:disabled) { background: rgba(77,201,246,.15); color: #4dc9f6; }
.ws-page-arrow:disabled { opacity: .3; cursor: not-allowed; }
.ws-page-info { font-size: 12px; color: rgba(255,255,255,.4); }

/* 详情弹窗 */
.ws-dialog-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 10; padding: 16px; }
.ws-detail-dialog { width: 560px; max-width: 100%; max-height: 90%; background: #050810; border: 1px solid rgba(77,201,246,.15); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,.5); }
.ws-detail-dialog.mobile { width: 100%; max-height: 100%; border-radius: 12px 12px 0 0; }
.ws-detail-top { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(77,201,246,.1); flex-shrink: 0; }
.ws-detail-title { font-size: 15px; font-weight: 600; color: rgba(255,255,255,.9); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-btn-icon-sm { width: 24px; height: 24px; border-radius: 6px; border: none; background: transparent; color: rgba(255,255,255,.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
.ws-btn-icon-sm:hover { background: rgba(77,201,246,.15); color: #4dc9f6; }

.ws-detail-body { flex: 1; overflow-y: auto; padding: 16px; }
.ws-detail-body::-webkit-scrollbar { width: 3px; }
.ws-detail-body::-webkit-scrollbar-thumb { background: rgba(77,201,246,.12); border-radius: 2px; }

.ws-detail-cover { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; }
.ws-detail-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.ws-detail-type { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(77,201,246,.1); color: rgba(77,201,246,.7); }
.ws-detail-author { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,.5); }
.ws-detail-date { font-size: 10px; color: rgba(255,255,255,.25); }

/* 角色卡链接 */
.ws-detail-card-link { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(77,201,246,.6); background: rgba(77,201,246,.04); border: 1px solid rgba(77,201,246,.08); border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; }

.ws-detail-tags { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
.ws-detail-tag { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: rgba(77,201,246,.06); color: rgba(77,201,246,.5); }
.ws-detail-desc { font-size: 12px; color: rgba(255,255,255,.5); line-height: 1.6; margin-bottom: 12px; }
.ws-detail-content-label { font-size: 11px; color: rgba(255,255,255,.3); margin-bottom: 4px; }
.ws-detail-content { font-size: 11px; color: rgba(255,255,255,.4); background: rgba(0,0,0,.2); padding: 10px; border-radius: 6px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; font-family: monospace; line-height: 1.5; }

/* collection 提示 */
.ws-detail-collection-notice { font-size: 12px; color: rgba(255,255,255,.4); background: rgba(77,201,246,.04); border: 1px solid rgba(77,201,246,.08); border-radius: 6px; padding: 12px; text-align: center; line-height: 1.6; }

/* 操作按钮 */
.ws-detail-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid rgba(77,201,246,.1); flex-shrink: 0; flex-wrap: wrap; }
.ws-action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 6px; border: 1px solid rgba(77,201,246,.15); background: rgba(77,201,246,.04); color: rgba(255,255,255,.6); font-size: 12px; cursor: pointer; transition: all .15s; }
.ws-action-btn:hover:not(:disabled) { background: rgba(77,201,246,.12); color: #4dc9f6; border-color: rgba(77,201,246,.3); }
.ws-action-btn:disabled { opacity: .5; cursor: not-allowed; }
.ws-btn-like.liked { color: #f87171; border-color: rgba(248,113,113,.3); background: rgba(248,113,113,.08); }
.ws-btn-download { border-color: rgba(52,211,153,.25); background: rgba(52,211,153,.06); color: #34d399; }
.ws-btn-download:hover:not(:disabled) { background: rgba(52,211,153,.15); border-color: rgba(52,211,153,.4); }
.ws-btn-import { border-color: rgba(77,201,246,.25); background: rgba(77,201,246,.08); color: #4dc9f6; }
.ws-btn-import:hover:not(:disabled) { background: rgba(77,201,246,.18); border-color: rgba(77,201,246,.4); }

/* 确认弹窗 */
.ws-confirm-dialog { width: 380px; max-width: 90%; background: #050810; border: 1px solid rgba(77,201,246,.2); border-radius: 12px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,.6); }
.ws-confirm-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,.85); margin-bottom: 10px; }
.ws-confirm-message { font-size: 12px; color: rgba(255,255,255,.5); line-height: 1.6; margin-bottom: 16px; }
.ws-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

@keyframes ws-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.ws-spin { animation: ws-spin-anim .8s linear infinite; }

.ws-dialog-enter-active, .ws-dialog-leave-active { transition: opacity .2s ease; }
.ws-dialog-enter-from, .ws-dialog-leave-to { opacity: 0; }
</style>
