<template>
  <div class="ws-workshop" :class="{ mobile: isMobile }">
    <!-- 顶部分类标签 -->
    <div class="ws-type-tabs" :style="isMobile ? 'margin-top:6px; padding-left:10px;' : 'margin-top:10px; padding-left:30px;'">
      <div class="ws-type-tabs-left">
        <button class="ws-type-tab" :class="{ active: filterType === '' }" @click="filterType = ''; page = 1; loadWorks()">
          全部
        </button>
        <button
          v-for="t in WORK_TYPES"
          :key="t.key"
          class="ws-type-tab"
          :class="{ active: filterType === t.key }"
          @click="filterType = t.key; page = 1; loadWorks()"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="ws-type-tabs-right">
        <span class="ws-filter-count">{{ total }} 个作品</span>
        <div class="ws-sort-wrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          <select class="ws-sort-select" v-model="sortBy" @change="page = 1; loadWorks()">
            <option value="latest">最新</option>
            <option value="popular">最热</option>
            <option value="likes">最多赞</option>
          </select>
        </div>
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
      <div v-if="detailWork" class="ws-dialog-overlay" @click.self="parentCollection ? backToCollection() : (detailWork = null)">

        <!-- 返回合集按钮 (仅查看子作品时显示) -->
        <div v-if="parentCollection" class="ws-overlay-top-bar">
          <button class="ws-back-btn" @click="backToCollection">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            返回合集
          </button>
        </div>
        <!-- 关闭按钮 固定右上角 -->
        <button class="ws-overlay-close-btn" @click="detailWork = null; parentCollection = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <!-- 作者合集: 缩略图网格 -->
        <div v-if="detailWork.type === 'collection'" class="ws-collection-panel" :class="{ mobile: isMobile }">
          <div class="ws-collection-header">
            <div class="ws-collection-info">
              <span class="ws-showcase-type">作者合集</span>
              <h2 class="ws-collection-title">{{ detailWork.title }}</h2>
              <p class="ws-collection-meta">by {{ detailWork.author.display_name || detailWork.author.username }} · {{ (detailWork as any).children?.length || 0 }} 件作品</p>
              <p class="ws-collection-desc">{{ detailWork.description }}</p>
            </div>
            <!-- 批量操作按鈕 -->
            <div class="ws-collection-batch-btns">
              <button class="ws-action-btn ws-btn-like" :class="{ liked: detailWork.liked }" @click="onLike">
                <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                {{ detailWork.like_count }}
              </button>
              <button class="ws-action-btn ws-btn-favorite" :class="{ active: detailWork.favorited }" @click="onFavorite">
                <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                {{ detailWork.favorite_count || 0 }}
              </button>
              <button v-if="isCollectionAuthor" class="ws-action-btn" @click="onToggleAddWorks">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                添加作品
              </button>
              <button
                class="ws-action-btn ws-btn-import"
                :disabled="actionLoading || !(detailWork as any).children?.length"
                @click="onInjectAll"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                一键注入全部
              </button>
              <button
                class="ws-action-btn ws-btn-download"
                :disabled="actionLoading || !(detailWork as any).children?.length"
                @click="onDownloadAll"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                一键下载全部
              </button>
            </div>
          </div>

          <div v-if="showAddWorks" class="ws-add-works-panel">
            <div class="ws-add-works-title">选择要加入合集的作品</div>
            <div class="ws-collection-pick-list">
              <div v-if="availableToAdd.length === 0" class="ws-collection-empty">没有可添加的已发布作品</div>
              <label
                v-for="work in availableToAdd"
                :key="work.id"
                class="ws-pick-item"
                :class="{ selected: addWorkIds.includes(work.id) }"
              >
                <input type="checkbox" :value="work.id" v-model="addWorkIds" />
                <div class="ws-pick-thumb">
                  <img v-if="work.cover_url" :src="work.cover_url" @error="(e: Event) => (e.target as HTMLImageElement).style.display='none'" />
                  <div v-else class="ws-pick-thumb-fallback">{{ getTypeLabel(work.type) }}</div>
                </div>
                <div class="ws-pick-body">
                  <span class="ws-pick-title">{{ work.char_name || work.title }}</span>
                  <span class="ws-type-badge-sm">{{ getTypeLabel(work.type) }}</span>
                </div>
              </label>
            </div>
            <div class="ws-add-works-actions">
              <button class="ws-action-btn" @click="showAddWorks = false; addWorkIds = []">取消</button>
              <button class="ws-action-btn ws-btn-import" :disabled="addWorkIds.length === 0" @click="confirmAddWorks">确认添加</button>
            </div>
          </div>

          <div class="ws-collection-grid">
            <div
              v-for="child in (detailWork as any).children || []"
              :key="child.id"
              class="ws-collection-card"
              @click.stop="openCollectionChild(child)"
            >
              <div class="ws-collection-card-thumb">
                <img v-if="child.cover_url" :src="child.cover_url" @error="(e: Event) => (e.target as HTMLImageElement).style.display='none'" />
                <div v-else class="ws-collection-thumb-fallback">{{ getTypeLabel(child.type) }}</div>
              </div>
              <div class="ws-collection-card-body">
                <span class="ws-type-badge-sm">{{ getTypeLabel(child.type) }}</span>
                <div class="ws-collection-card-title">{{ child.char_name || child.title }}</div>
                <div class="ws-collection-card-desc">{{ child.description }}</div>
                <div class="ws-collection-card-meta">
                  <span>♥ {{ child.like_count }}</span>
              <span>↓ {{ child.download_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ws-comments-panel">
            <div class="ws-comments-head">
              <span>评论</span>
              <span>{{ comments.length }}</span>
            </div>
            <div class="ws-comments-list">
              <div v-if="commentsLoading" class="ws-comment-empty">加载中...</div>
              <div v-else-if="comments.length === 0" class="ws-comment-empty">暂无评论</div>
              <template v-else>
                <div v-for="comment in comments" :key="comment.id" class="ws-comment" :class="{ hidden: comment.status !== 'visible' }">
                  <div class="ws-comment-top">
                    <span>{{ comment.author.display_name || comment.author.username }}</span>
                    <button v-if="canManageComment(comment)" class="ws-comment-action" @click="removeComment(comment)">{{ comment.author.id === auth.user.value?.id ? '删除' : '隐藏' }}</button>
                  </div>
                  <div class="ws-comment-content">{{ comment.content }}</div>
                  <div v-if="comment.status !== 'visible'" class="ws-comment-hidden">已隐藏：{{ comment.hidden_reason || '无理由' }}</div>
                </div>
              </template>
            </div>
            <div class="ws-comment-form">
              <textarea v-model="commentDraft" maxlength="1000" placeholder="写下评论..." />
              <button class="ws-action-btn ws-btn-import" :disabled="commentSubmitting || !commentDraft.trim()" @click="submitComment">发布</button>
            </div>
          </div>
        </div>


        <!-- 人设/OC 专属沉浸式布局 -->
        <div v-else-if="detailWork.type === 'persona' || detailWork.type === 'card_addon'" class="ws-showcase-panel" :class="{ mobile: isMobile }">

          <div class="ws-showcase-content-wrap">
            <div class="ws-showcase-name-block">
              <div v-if="detailWork.title && detailWork.title !== detailWork.char_name" class="ws-showcase-work-title">{{ detailWork.title }}</div>
              <div class="ws-showcase-type">{{ getTypeLabel(detailWork.type) }}</div>
              <div class="ws-showcase-title" :title="detailWork.char_name || detailWork.title">{{ detailWork.char_name || detailWork.title }}</div>
            </div>

            <div v-if="detailWork.description" class="ws-showcase-quote">{{ detailWork.description }}</div>

            <div class="ws-showcase-meta">
              <span class="ws-showcase-author">
                <img v-if="detailWork.author.avatar" :src="detailWork.author.avatar" class="ws-card-avatar" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
                {{ detailWork.author.display_name || detailWork.author.username }}
              </span>
              <span class="ws-showcase-date">{{ detailWork.created_at?.split('T')[0] }}</span>
            </div>

            <div v-if="detailWork.tags.length > 0" class="ws-showcase-tags">
              <span v-for="tag in detailWork.tags" :key="tag" class="ws-showcase-tag">#{{ tag }}</span>
            </div>

            <div class="ws-showcase-actions">
              <button class="ws-action-btn ws-btn-like" :class="{ liked: detailWork.liked }" @click="onLike">
                <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                {{ detailWork.like_count }}
              </button>
              <button class="ws-action-btn ws-btn-favorite" :class="{ active: detailWork.favorited }" @click="onFavorite">
                <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                {{ detailWork.favorite_count || 0 }}
              </button>
              <button class="ws-action-btn" @click="showContentModal = true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                查看
              </button>
              <button class="ws-action-btn ws-btn-import" @click="onInjectToWorldbook" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                注入
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadFile" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载
              </button>
              <button v-if="detailWork.card_link" class="ws-action-btn ws-btn-card" @click="openLink(detailWork.card_link)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                角色卡
              </button>
            </div>

            <div class="ws-comments-panel">
              <div class="ws-comments-head">
                <span>评论</span>
                <span>{{ comments.length }}</span>
              </div>
              <div class="ws-comments-list">
                <div v-if="commentsLoading" class="ws-comment-empty">加载中...</div>
                <div v-else-if="comments.length === 0" class="ws-comment-empty">暂无评论</div>
                <template v-else>
                  <div v-for="comment in comments" :key="comment.id" class="ws-comment" :class="{ hidden: comment.status !== 'visible' }">
                    <div class="ws-comment-top">
                      <span>{{ comment.author.display_name || comment.author.username }}</span>
                      <button v-if="canManageComment(comment)" class="ws-comment-action" @click="removeComment(comment)">{{ comment.author.id === auth.user.value?.id ? '删除' : '隐藏' }}</button>
                    </div>
                    <div class="ws-comment-content">{{ comment.content }}</div>
                    <div v-if="comment.status !== 'visible'" class="ws-comment-hidden">已隐藏：{{ comment.hidden_reason || '无理由' }}</div>
                  </div>
                </template>
              </div>
              <div class="ws-comment-form">
                <textarea v-model="commentDraft" maxlength="1000" placeholder="写下评论..." />
                <button class="ws-action-btn ws-btn-import" :disabled="commentSubmitting || !commentDraft.trim()" @click="submitComment">发布</button>
              </div>
            </div>
          </div>

          <div class="ws-showcase-portrait-wrap">
            <img v-if="detailWork.cover_url" :src="detailWork.cover_url" class="ws-showcase-img" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
            <div v-else class="ws-showcase-img-fallback">SillyTavern</div>
          </div>
        </div>

        <!-- 普通类型标准布局 -->
        <div v-else class="ws-detail-dialog" :class="{ mobile: isMobile }">
          <div class="ws-detail-top">
            <span class="ws-detail-title">{{ detailWork.title }}</span>
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
            <!-- 内容预览（character 文件类型无预览） -->
            <div v-if="detailWork.type !== 'character'" class="ws-detail-content-label">内容预览</div>
            <div v-if="detailWork.type !== 'character'" class="ws-detail-content">{{ detailContentPreview }}</div>
            <div v-if="detailWork.type === 'character'" class="ws-detail-content-label">角色卡文件（{{ detailWork.file_type === 'png' ? 'PNG' : 'JSON' }} 格式）</div>
            <div class="ws-comments-panel">
              <div class="ws-comments-head">
                <span>评论</span>
                <span>{{ comments.length }}</span>
              </div>
              <div class="ws-comments-list">
                <div v-if="commentsLoading" class="ws-comment-empty">加载中...</div>
                <div v-else-if="comments.length === 0" class="ws-comment-empty">暂无评论</div>
                <template v-else>
                  <div v-for="comment in comments" :key="comment.id" class="ws-comment" :class="{ hidden: comment.status !== 'visible' }">
                    <div class="ws-comment-top">
                      <span>{{ comment.author.display_name || comment.author.username }}</span>
                      <button v-if="canManageComment(comment)" class="ws-comment-action" @click="removeComment(comment)">{{ comment.author.id === auth.user.value?.id ? '删除' : '隐藏' }}</button>
                    </div>
                    <div class="ws-comment-content">{{ comment.content }}</div>
                    <div v-if="comment.status !== 'visible'" class="ws-comment-hidden">已隐藏：{{ comment.hidden_reason || '无理由' }}</div>
                  </div>
                </template>
              </div>
              <div class="ws-comment-form">
                <textarea v-model="commentDraft" maxlength="1000" placeholder="写下评论..." />
                <button class="ws-action-btn ws-btn-import" :disabled="commentSubmitting || !commentDraft.trim()" @click="submitComment">发布</button>
              </div>
            </div>
          </div>
          <!-- 操作按钮 -->
          <div class="ws-detail-actions">
            <!-- 点赞 -->
            <button class="ws-action-btn ws-btn-like" :class="{ liked: detailWork.liked }" @click="onLike">
              <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {{ detailWork.like_count }}
            </button>
            <button class="ws-action-btn ws-btn-favorite" :class="{ active: detailWork.favorited }" @click="onFavorite">
              <svg width="12" height="12" viewBox="0 0 24 24" :fill="detailWork.favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              {{ detailWork.favorite_count || 0 }}
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

            <!-- character: 导入角色卡 + 下载原文件 -->
            <template v-if="detailWork.type === 'character'">
              <button class="ws-action-btn ws-btn-import" @click="onImportCharacter" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>
                导入角色卡
              </button>
              <button class="ws-action-btn ws-btn-download" @click="onDownloadCharacterFile" :disabled="actionLoading">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                下载角色卡
              </button>
            </template>

            <!-- 复制内容 (非 collection, 非 character) -->
            <button v-if="detailWork.type !== 'character'" class="ws-action-btn" @click="onCopyContent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              复制内容
            </button>
            <button v-if="detailWork.card_link" class="ws-action-btn ws-btn-card" @click="openLink(detailWork.card_link)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              角色卡
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

    <!-- 文本内容查看弹窗 -->
    <Transition name="ws-dialog">
      <div v-if="showContentModal" class="ws-dialog-overlay" @click.self="showContentModal = false" style="z-index: 10001;">
        <div class="ws-detail-dialog" :class="{ mobile: isMobile }" style="max-width: 800px; max-height: 85vh;">
          <div class="ws-detail-top">
            <span class="ws-detail-title">{{ detailWork?.char_name || detailWork?.title }} - 设定内容</span>
            <button class="ws-btn-icon-sm" @click="showContentModal = false">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div class="ws-detail-body" style="padding: 24px; overflow-y: auto; white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.85); background: var(--ws-bg-deep);">
            {{ detailWork?.content || detailContentPreview || '暂无详细内容' }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { WORK_TYPES, getTypeLabel, DEBUG_MODE, parseAddonSubtype, type WorkItem, type WorkDetail, type WorkComment } from '../types';
import { debugWorks, DEBUG_MOCK_CONTENT, mockCollectionChildren, DEBUG_CURRENT_USER } from '../debugStore';
import {
  fetchWorks,
  fetchTags,
  fetchWorkDetail,
  downloadWork,
  toggleLikeApi,
  toggleFavoriteApi,
  addWorksToCollection,
  fetchMyWorks,
  fetchComments,
  createCommentApi,
  deleteCommentApi,
} from '../api';

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
const showContentModal = ref(false);
const filterType = ref('');
const filterTag = ref('');
const sortBy = ref('latest');
const allTags = ref<string[]>([]);
const detailWork = ref<WorkDetail | null>(null);
const parentCollection = ref<WorkDetail | null>(null);
const showAddWorks = ref(false);
const addWorkIds = ref<number[]>([]);
const comments = ref<WorkComment[]>([]);
const commentsLoading = ref(false);
const commentDraft = ref('');
const commentSubmitting = ref(false);

/** 当前登录用户是否是合集作者 */
const isCollectionAuthor = computed(() => {
  if (!detailWork.value || detailWork.value.type !== 'collection') return false;
  if (DEBUG_MODE) return detailWork.value.author.username === DEBUG_CURRENT_USER;
  const me = props.auth?.user?.value;
  return me && (me.username === detailWork.value.author.username);
});

const myWorksForAdd = ref<any[]>([]);

/** 当前合集中还没有的属于我的作品 */
const availableToAdd = computed(() => {
  if (!detailWork.value || detailWork.value.type !== 'collection') return [];
  const existingIds = new Set((detailWork.value.children || []).map((c: any) => c.id));
  const source = DEBUG_MODE ? debugWorks.filter(w => w.author.username === DEBUG_CURRENT_USER) : myWorksForAdd.value;
  return source.filter((w: any) => w.type !== 'collection' && !existingIds.has(w.id) && (DEBUG_MODE || (w.status === 'approved' && (w.visibility || 'public') === 'public')));
});
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

/** 在 SillyTavern iframe 环境中安全地打开外部链接 */
function openLink(url: string) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const WORLDBOOK_POSITION_TYPES = [
  'before_character_definition',
  'after_character_definition',
  'before_example_messages',
  'after_example_messages',
  'before_author_note',
  'after_author_note',
  'at_depth',
] as const;
const WORLDBOOK_ROLES = ['system', 'user', 'assistant'] as const;
const WORLDBOOK_SECONDARY_LOGICS = ['and_any', 'and_all', 'not_all', 'not_any'] as const;
const NATIVE_SECONDARY_LOGIC_BY_INDEX = ['and_any', 'not_all', 'not_any', 'and_all'] as const;

type WorkshopWorkLike = {
  id: number;
  title: string;
  type: string;
  char_name?: string;
  author?: { username?: string; display_name?: string };
};

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getWorkEntryName(work: WorkshopWorkLike): string {
  return (work.char_name || work.title || `创意工坊作品 ${work.id}`).trim();
}

function canUsePlainTextEntry(work: WorkshopWorkLike): boolean {
  return work.type === 'persona' || work.type === 'card_addon';
}

function splitEntryKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return _.uniq(value.flatMap(item => splitEntryKeywords(item)));
  }
  if (typeof value !== 'string') return [];
  return _.uniq(
    value
      .split(/[,，;；\n]+/)
      .map(item => item.trim())
      .filter(Boolean),
  );
}

function clampEntryNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizePositionType(value: unknown): (typeof WORLDBOOK_POSITION_TYPES)[number] {
  if (typeof value === 'number' && WORLDBOOK_POSITION_TYPES[value]) return WORLDBOOK_POSITION_TYPES[value];
  if (typeof value === 'string' && (WORLDBOOK_POSITION_TYPES as readonly string[]).includes(value)) {
    return value as (typeof WORLDBOOK_POSITION_TYPES)[number];
  }
  return 'before_character_definition';
}

function normalizeRole(value: unknown): (typeof WORLDBOOK_ROLES)[number] {
  if (typeof value === 'number' && WORLDBOOK_ROLES[value]) return WORLDBOOK_ROLES[value];
  if (typeof value === 'string' && (WORLDBOOK_ROLES as readonly string[]).includes(value)) {
    return value as (typeof WORLDBOOK_ROLES)[number];
  }
  return 'system';
}

function normalizeSecondaryLogic(value: unknown): (typeof WORLDBOOK_SECONDARY_LOGICS)[number] {
  if (typeof value === 'number' && NATIVE_SECONDARY_LOGIC_BY_INDEX[value]) return NATIVE_SECONDARY_LOGIC_BY_INDEX[value];
  if (typeof value === 'string' && (WORLDBOOK_SECONDARY_LOGICS as readonly string[]).includes(value)) {
    return value as (typeof WORLDBOOK_SECONDARY_LOGICS)[number];
  }
  return 'and_any';
}

function hasWorldbookEntryShape(value: Record<string, any>): boolean {
  return ['content', 'strategy', 'keys', 'key', 'constant', 'selective', 'position'].some(key => key in value);
}

function buildFallbackWorldbookEntry(work: WorkshopWorkLike, content: string): Record<string, any> {
  return {
    name: getWorkEntryName(work),
    enabled: true,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'before_character_definition',
      role: 'system',
      depth: 0,
      order: 100,
    },
    content,
    probability: 100,
    recursion: {
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
    extra: {
      workshop: {
        work_id: work.id,
        title: work.title,
        type: work.type,
        legacy_plain_text: true,
      },
    },
  };
}

function normalizeWorldbookEntryRecord(entry: Record<string, any>, work: WorkshopWorkLike): Record<string, any> {
  if (!hasWorldbookEntryShape(entry)) {
    if (canUsePlainTextEntry(work)) {
      return buildFallbackWorldbookEntry(work, JSON.stringify(entry, null, 2));
    }
    throw new Error('JSON 内容不是世界书条目对象');
  }

  const normalized = { ...entry };
  const extensions = isRecord(entry.extensions) ? entry.extensions : {};
  const existingStrategy = isRecord(normalized.strategy) ? normalized.strategy : {};
  const existingSecondary = isRecord(existingStrategy.keys_secondary) ? existingStrategy.keys_secondary : {};
  const primaryKeys = splitEntryKeywords(existingStrategy.keys ?? entry.keys ?? entry.key);
  const secondaryKeys = splitEntryKeywords(existingSecondary.keys ?? entry.secondary_keys ?? entry.keysecondary);
  const nativeSelective = Boolean(entry.selective) || primaryKeys.length > 0;
  const nativeVectorized = Boolean(entry.vectorized) || Boolean(extensions.vectorized);

  normalized.name = typeof normalized.name === 'string' && normalized.name.trim()
    ? normalized.name.trim()
    : typeof entry.comment === 'string' && entry.comment.trim()
      ? entry.comment.trim()
      : getWorkEntryName(work);
  normalized.enabled = typeof normalized.enabled === 'boolean'
    ? normalized.enabled
    : typeof entry.disable === 'boolean'
      ? !entry.disable
      : true;
  normalized.content = typeof entry.content === 'string'
    ? entry.content
    : entry.content == null
      ? ''
      : JSON.stringify(entry.content, null, 2);

  const strategy = { ...existingStrategy };
  strategy.type = strategy.type || (nativeVectorized ? 'vectorized' : nativeSelective ? 'selective' : 'constant');
  strategy.keys = primaryKeys;
  strategy.keys_secondary = {
    logic: normalizeSecondaryLogic(existingSecondary.logic ?? entry.selectiveLogic ?? extensions.selectiveLogic),
    keys: secondaryKeys,
  };
  const scanDepth = strategy.scan_depth ?? entry.scanDepth ?? extensions.scan_depth;
  strategy.scan_depth = typeof scanDepth === 'number' && scanDepth > 0 ? scanDepth : 'same_as_global';
  normalized.strategy = strategy;

  const rawPosition = normalized.position;
  const existingPosition = isRecord(rawPosition) ? rawPosition : {};
  normalized.position = {
    ...existingPosition,
    type: normalizePositionType(existingPosition.type ?? rawPosition ?? extensions.position),
    role: normalizeRole(existingPosition.role ?? entry.role ?? extensions.role),
    depth: clampEntryNumber(existingPosition.depth ?? entry.depth ?? extensions.depth, 0, 99, 0),
    order: clampEntryNumber(existingPosition.order ?? entry.insertion_order ?? entry.order, -9999, 9999, 100),
  };

  if (typeof normalized.probability !== 'number') {
    const rawProbability = typeof extensions.probability === 'number' ? extensions.probability : entry.probability;
    normalized.probability = typeof rawProbability === 'number'
      ? clampEntryNumber(rawProbability <= 1 ? rawProbability * 100 : rawProbability, 0, 100, 100)
      : 100;
  }
  if (!isRecord(normalized.recursion)) {
    normalized.recursion = {
      prevent_incoming: Boolean(entry.excludeRecursion ?? extensions.exclude_recursion),
      prevent_outgoing: Boolean(entry.preventRecursion ?? extensions.prevent_recursion),
      delay_until: null,
    };
  }
  if (!isRecord(normalized.effect)) {
    normalized.effect = {
      sticky: typeof entry.sticky === 'number' ? entry.sticky : null,
      cooldown: typeof entry.cooldown === 'number' ? entry.cooldown : null,
      delay: typeof entry.delay === 'number' ? entry.delay : null,
    };
  }

  normalized.extra = {
    ...(isRecord(normalized.extra) ? normalized.extra : {}),
    workshop: {
      ...(isRecord(normalized.extra?.workshop) ? normalized.extra.workshop : {}),
      work_id: work.id,
      title: work.title,
      type: work.type,
    },
  };
  return normalized;
}

function normalizeParsedWorldbookEntries(parsed: unknown, work: WorkshopWorkLike): Record<string, any>[] {
  if (typeof parsed === 'string' && canUsePlainTextEntry(work)) {
    return [buildFallbackWorldbookEntry(work, parsed)];
  }
  if (Array.isArray(parsed)) {
    return parsed.map(item => {
      if (!isRecord(item)) throw new Error('JSON 数组中存在非对象条目');
      return normalizeWorldbookEntryRecord(item, work);
    });
  }
  if (isRecord(parsed)) {
    if ('entries' in parsed) {
      const rawEntries = Array.isArray(parsed.entries)
        ? parsed.entries
        : isRecord(parsed.entries)
          ? Object.values(parsed.entries)
          : [];
      return normalizeParsedWorldbookEntries(rawEntries, work);
    }
    return [normalizeWorldbookEntryRecord(parsed, work)];
  }
  throw new Error('作品内容不是世界书条目 JSON');
}

function parseWorldbookEntriesFromContent(content: string, work: WorkshopWorkLike): Record<string, any>[] {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('作品内容为空');
  try {
    return normalizeParsedWorldbookEntries(JSON.parse(trimmed), work);
  } catch (e) {
    if (canUsePlainTextEntry(work)) {
      console.warn('[创意工坊] 作品内容不是 JSON，已按纯文本人设包装为世界书条目:', e);
      return [buildFallbackWorldbookEntry(work, trimmed)];
    }
    throw e;
  }
}

/**
 * 将条目数组包装为酒馆可导入的完整世界书 JSON 格式
 * 酒馆格式: {"entries":{"<uid>": {酒馆原生字段}}}
 */
function wrapAsImportableWorldbook(entries: Record<string, any>[], work: WorkshopWorkLike): string {
  const POSITION_MAP: Record<string, number> = {
    'before_character_definition': 0,
    'after_character_definition': 1,
    'before_example_messages': 2,
    'after_example_messages': 3,
    'before_author_note': 4,
    'after_author_note': 5,
    'at_depth': 4, // at_depth maps to position=4 in native format
  };
  const ROLE_MAP: Record<string, number> = { 'system': 0, 'user': 1, 'assistant': 2 };
  const SECONDARY_LOGIC_MAP: Record<string, number> = { 'and_any': 0, 'not_all': 1, 'not_any': 2, 'and_all': 3 };

  const nativeEntries: Record<string, any> = {};
  entries.forEach((entry, idx) => {
    const uid = 10000 + idx;
    const strategy = entry.strategy || {};
    const position = entry.position || {};
    const recursion = entry.recursion || {};

    nativeEntries[String(uid)] = {
      uid,
      displayIndex: idx,
      comment: entry.name || `条目${idx}`,
      disable: entry.enabled === false,
      constant: strategy.type === 'constant' || (!strategy.type),
      selective: strategy.type === 'selective' || (Array.isArray(strategy.keys) && strategy.keys.length > 0),
      key: (strategy.keys || []).map((k: any) => String(k)),
      selectiveLogic: SECONDARY_LOGIC_MAP[strategy.keys_secondary?.logic] ?? 0,
      keysecondary: (strategy.keys_secondary?.keys || []).map((k: any) => String(k)),
      scanDepth: strategy.scan_depth === 'same_as_global' ? null : (typeof strategy.scan_depth === 'number' ? strategy.scan_depth : null),
      vectorized: strategy.type === 'vectorized',
      position: POSITION_MAP[position.type] ?? 0,
      role: ROLE_MAP[position.role] ?? 0,
      depth: typeof position.depth === 'number' ? position.depth : 4,
      order: typeof position.order === 'number' ? position.order : 100,
      content: entry.content || '',
      useProbability: true,
      probability: typeof entry.probability === 'number' ? entry.probability : 100,
      excludeRecursion: recursion.prevent_incoming ?? false,
      preventRecursion: recursion.prevent_outgoing ?? false,
      delayUntilRecursion: recursion.delay_until != null,
      sticky: entry.effect?.sticky ?? 0,
      cooldown: entry.effect?.cooldown ?? 0,
      delay: entry.effect?.delay ?? 0,
      addMemo: true,
      matchPersonaDescription: false,
      matchCharacterDescription: false,
      matchCharacterPersonality: false,
      matchCharacterDepthPrompt: false,
      matchScenario: false,
      matchCreatorNotes: false,
      group: '',
      groupOverride: false,
      groupWeight: 100,
      caseSensitive: null,
      matchWholeWords: null,
      useGroupScoring: null,
      automationId: '',
      ignoreBudget: false,
      outletName: '',
      triggers: [],
    };
  });

  return JSON.stringify({ entries: nativeEntries }, null, 2);
}

function getDownloadFileContent(content: string, work: WorkshopWorkLike): string {
  // persona 类型：下载为完整可导入世界书文件
  if (work.type === 'persona') {
    try {
      const entries = parseWorldbookEntriesFromContent(content, work);
      return wrapAsImportableWorldbook(entries, work);
    } catch {
      return content;
    }
  }
  // card_addon 子类型为 persona 时也包装为世界书
  if (work.type === 'card_addon') {
    const subtype = parseAddonSubtype((work as any).file_type || '');
    if (subtype === 'persona') {
      try {
        const entries = parseWorldbookEntriesFromContent(content, work);
        return wrapAsImportableWorldbook(entries, work);
      } catch {
        return content;
      }
    }
  }
  // 其他类型（regex/worldbook/character）原样返回
  return content;
}

// 监听搜索词变化
watch(() => props.searchQuery, () => { page.value = 1; loadWorks(); });

async function loadWorks() {
  loading.value = true;
  try {
    if (DEBUG_MODE) {
      let filtered = [...debugWorks];
      if (filterType.value) {
        filtered = filtered.filter(w => w.type === filterType.value);
      }
      if (filterTag.value) {
        filtered = filtered.filter(w => w.tags.includes(filterTag.value));
      }
      if (props.searchQuery) {
        const q = props.searchQuery.toLowerCase();
        filtered = filtered.filter(w => w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
      }

      if (sortBy.value === 'popular') {
        filtered.sort((a, b) => b.download_count - a.download_count);
      } else if (sortBy.value === 'likes') {
        filtered.sort((a, b) => b.like_count - a.like_count);
      } else {
        filtered.sort((a, b) => b.id - a.id);
      }

      works.value = filtered;
      total.value = filtered.length;
      totalPages.value = 1;
      return;
    }
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

async function loadComments(workId: number) {
  comments.value = [];
  commentDraft.value = '';
  if (DEBUG_MODE) return;
  commentsLoading.value = true;
  try {
    const data = await fetchComments(workId);
    comments.value = data.comments;
  } catch {
    comments.value = [];
  } finally {
    commentsLoading.value = false;
  }
}

async function openDetail(work: WorkItem) {
  try {
    if (DEBUG_MODE && work.id > 9990) {
      const children = work.type === 'collection' ? (mockCollectionChildren[work.id] || []) : undefined;
      detailWork.value = { ...work, content: (work as any).content || DEBUG_MOCK_CONTENT, status: 'approved', reject_reason: '', updated_at: work.created_at, children };
      showContentModal.value = false;
      comments.value = [];
      return;
    }
    const detail = await fetchWorkDetail(work.id);
    detailWork.value = { ...work, ...detail };
    showContentModal.value = false;
    await loadComments(work.id);
  } catch (e) {
    toastr.error('加载详情失败');
  }
}

/** 点击合集内子作品，保存当前合集为 parentCollection */
async function openCollectionChild(child: any) {
  parentCollection.value = detailWork.value;
  try {
    const detail = DEBUG_MODE ? null : await fetchWorkDetail(child.id);
    detailWork.value = { ...child, ...(detail || {}), status: 'approved', reject_reason: '', updated_at: new Date().toISOString() } as unknown as WorkDetail;
    showContentModal.value = false;
    await loadComments(child.id);
  } catch {
    detailWork.value = { ...child, status: 'approved', reject_reason: '', updated_at: new Date().toISOString() } as unknown as WorkDetail;
    showContentModal.value = false;
    await loadComments(child.id);
  }
}

/** 返回工作中的合集视图 */
function backToCollection() {
  if (parentCollection.value) {
    detailWork.value = parentCollection.value;
    loadComments(parentCollection.value.id);
    parentCollection.value = null;
  }
}

/** 切换"添加作品"面板，首次展开时拉取我的作品 */
async function onToggleAddWorks() {
  showAddWorks.value = !showAddWorks.value;
  if (showAddWorks.value && !DEBUG_MODE && myWorksForAdd.value.length === 0) {
    try {
      const r = await fetchMyWorks();
      myWorksForAdd.value = r.works;
    } catch { /* ignore */ }
  }
}

/** 确认将选中作品添加到当前合集 */
async function confirmAddWorks() {
  if (!detailWork.value || addWorkIds.value.length === 0) return;
  const collectionId = detailWork.value.id;
  if (DEBUG_MODE) {
    // 调试模式：直接写入 mock 数据
    const newChildren = debugWorks
      .filter(w => addWorkIds.value.includes(w.id))
      .map(w => ({ ...w, content: DEBUG_MOCK_CONTENT }));
    const existing = detailWork.value.children || [];
    const merged = [...existing, ...newChildren];
    detailWork.value.children = merged;
    mockCollectionChildren[collectionId] = merged as any;
    toastr.success(`已添加 ${newChildren.length} 件作品`);
  } else {
    try {
      await addWorksToCollection(collectionId, addWorkIds.value);
      // 重新拉取详情以刷新 children
      const detail = await fetchWorkDetail(collectionId);
      detailWork.value = { ...detailWork.value, ...detail };
      toastr.success('已成功添加到合集');
    } catch (e) {
      toastr.error('添加失败');
      return;
    }
  }
  showAddWorks.value = false;
  addWorkIds.value = [];
}

// ─── 合集：一键注入全部 ───
async function onInjectAll() {
  if (!detailWork.value) return;
  const children = detailWork.value.children;
  if (!children?.length) return;
  showConfirm(
    '一键注入全部',
    `将把合集「${detailWork.value.title}」中全部 ${children.length} 件作品的条目注入到当前角色卡的绑定世界书中。确认操作？`,
    async () => {
      actionLoading.value = true;
      let successCount = 0, failCount = 0;
      try {
        const charWb = getCharWorldbookNames('current');
        const targetWb = charWb.primary || charWb.additional[0];
        if (!targetWb) { toastr.warning('当前角色卡没有绑定世界书，请先绑定一个世界书'); return; }
        for (const child of children) {
          try {
            let contentStr: string;
            if (DEBUG_MODE) {
              contentStr = child.content;
            } else {
              const data = await downloadWork(child.id);
              contentStr = data.content;
            }
            const entries = parseWorldbookEntriesFromContent(contentStr, child);
            await createWorldbookEntries(targetWb, entries as any);
            successCount++;
          } catch { failCount++; }
        }
        toastr.success(`已注入 ${successCount} 件作品到「${targetWb}」${failCount > 0 ? `，${failCount} 件失败` : ''}`);
      } catch (e) {
        toastr.error(`注入失败: ${(e as Error).message}`);
      } finally {
        actionLoading.value = false;
      }
    }
  );
}

// ─── 合集：一键下载全部 ───
async function onDownloadAll() {
  if (!detailWork.value) return;
  const children = detailWork.value.children;
  if (!children?.length) return;
  showConfirm(
    '一键下载全部',
    `将逐个下载合集「${detailWork.value.title}」中全部 ${children.length} 件作品的 JSON 文件。确认下载？`,
    async () => {
      actionLoading.value = true;
      let successCount = 0, failCount = 0;
      try {
        for (const child of children) {
          try {
            let contentStr: string;
            let title = child.title;
            if (DEBUG_MODE) {
              contentStr = child.content;
            } else {
              const data = await downloadWork(child.id);
              contentStr = data.content;
              title = data.title;
            }
            const fileContent = getDownloadFileContent(contentStr, child);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.json`;
            a.click();
            URL.revokeObjectURL(url);
            successCount++;
            // 小延迟，防止浏览器拦截多文件下载
            await new Promise(r => setTimeout(r, 350));
          } catch { failCount++; }
        }
        toastr.success(`已下载 ${successCount} 件作品${failCount > 0 ? `，${failCount} 件失败` : ''}`);
      } finally {
        actionLoading.value = false;
      }
    }
  );
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

async function onFavorite() {
  if (!props.auth.isLoggedIn.value) { toastr.warning('请先登录'); return; }
  if (!detailWork.value) return;
  try {
    const result = await toggleFavoriteApi(detailWork.value.id);
    detailWork.value.favorited = result.favorited;
    detailWork.value.favorite_count = result.favorite_count;
    const item = works.value.find(w => w.id === detailWork.value!.id);
    if (item) { item.favorited = result.favorited; item.favorite_count = result.favorite_count; }
    toastr.success(result.favorited ? '已收藏' : '已取消收藏');
  } catch {
    toastr.error('收藏失败');
  }
}

function canManageComment(comment: WorkComment): boolean {
  const me = props.auth?.user?.value;
  if (!me || !detailWork.value) return false;
  return comment.author.id === me.id || detailWork.value.author.username === me.username;
}

async function submitComment() {
  if (!props.auth.isLoggedIn.value) { toastr.warning('请先登录'); return; }
  if (!detailWork.value) return;
  const content = commentDraft.value.trim();
  if (!content) return;
  commentSubmitting.value = true;
  try {
    await createCommentApi(detailWork.value.id, content);
    commentDraft.value = '';
    await loadComments(detailWork.value.id);
    detailWork.value.comment_count = (detailWork.value.comment_count || 0) + 1;
    toastr.success('评论已发布');
  } catch (e: any) {
    toastr.error(e?.message || '评论失败');
  } finally {
    commentSubmitting.value = false;
  }
}

async function removeComment(comment: WorkComment) {
  if (!detailWork.value) return;
  const label = comment.author.username === props.auth?.user?.value?.username ? '删除这条评论？' : '隐藏这条评论？';
  if (!confirm(label)) return;
  try {
    await deleteCommentApi(comment.id, '作者隐藏评论');
    await loadComments(detailWork.value.id);
    detailWork.value.comment_count = Math.max(0, (detailWork.value.comment_count || 0) - 1);
    toastr.success('已处理评论');
  } catch (e: any) {
    toastr.error(e?.message || '处理失败');
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
        // 获取当前角色卡绑定的世界书
        const charWb = getCharWorldbookNames('current');
        const targetWb = charWb.primary || charWb.additional[0];
        if (!targetWb) {
          toastr.warning('当前角色卡没有绑定世界书，请先绑定一个世界书');
          return;
        }
        // 将内容作为条目注入
        const entries = parseWorldbookEntriesFromContent(data.content, detailWork.value!);
        await createWorldbookEntries(targetWb, entries as any);
        toastr.success(`已将 ${entries.length} 个条目注入到世界书「${targetWb}」`);
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

// ─── 导入角色卡 (character 类型) ───
async function onImportCharacter() {
  if (!detailWork.value) return;
  actionLoading.value = true;
  try {
    const data = await downloadWork(detailWork.value.id);
    const fileType = data.file_type || 'json';
    if (fileType === 'png' && data.file_url) {
      // PNG 角色卡：通过 file_url 下载
      const resp = await fetch(data.file_url);
      const blob = await resp.blob();
      await importRawCharacter(`${data.title}.png`, blob);
    } else if (data.file_url) {
      // JSON 角色卡通过 file_url 下载
      const resp = await fetch(data.file_url);
      const blob = await resp.blob();
      await importRawCharacter(`${data.title}.json`, blob);
    } else if (data.content) {
      // JSON 内容直接作为 Blob
      const blob = new Blob([data.content], { type: 'application/json' });
      await importRawCharacter(`${data.title}.json`, blob);
    } else {
      toastr.error('角色卡文件不存在');
      return;
    }
    toastr.success(`角色卡「${data.title}」已导入到酒馆`);
    updateDownloadCount();
  } catch (e) {
    toastr.error(`导入失败: ${(e as Error).message}`);
  } finally {
    actionLoading.value = false;
  }
}

// ─── 下载角色卡原文件 ───
async function onDownloadCharacterFile() {
  if (!detailWork.value) return;
  actionLoading.value = true;
  try {
    const data = await downloadWork(detailWork.value.id);
    const fileType = data.file_type || 'json';
    if (data.file_url) {
      // 通过 file_url 下载原文件
      const resp = await fetch(data.file_url);
      const blob = await resp.blob();
      const ext = fileType === 'png' ? 'png' : 'json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (data.content) {
      // 纯内容下载
      const blob = new Blob([data.content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toastr.error('角色卡文件不存在');
      return;
    }
    toastr.success(`已下载「${data.title}」`);
    updateDownloadCount();
  } catch (e) {
    toastr.error(`下载失败: ${(e as Error).message}`);
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
    const fileContent = getDownloadFileContent(data.content, detailWork.value);
    // 创建 Blob 下载
    const blob = new Blob([fileContent], { type: 'application/json' });
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
.ws-filter-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px !important; margin: 10px 0 0 30px !important; border-bottom: 1px solid var(--ws-border); background: rgba(0,0,0,.3); flex-shrink: 0; gap: 8px; }
.ws-filter-left { display: flex; gap: 6px; }
.ws-filter-right { display: flex; align-items: center; }
.ws-filter-count { font-size: 11px; color: rgba(255,255,255,.3); }
.ws-select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--ws-border); background: var(--ws-glass); color: rgba(255,255,255,.7); font-size: 11px; outline: none; cursor: pointer; transition: all .2s; }
.ws-select:focus { border-color: var(--ws-primary); box-shadow: 0 0 8px var(--ws-primary-glow); }
.ws-select option { background: var(--ws-bg-section); color: #e0e0e0; }

/* 标签栏 */
.ws-tag-bar { display: flex; gap: 6px; padding: 6px 10px; border-bottom: 1px solid var(--ws-border); flex-shrink: 0; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; touch-action: pan-x; }
.ws-tag-bar::-webkit-scrollbar { height: 0; }
.ws-tag-btn { padding: 4px 10px; font-size: 10px; border-radius: 4px; border: 1px solid var(--ws-border); background: var(--ws-glass); color: rgba(255,255,255,.4); cursor: pointer; white-space: nowrap; transition: all .2s; }
.ws-tag-btn:hover { color: #fff; background: var(--ws-primary-dim); border-color: var(--ws-primary); }
.ws-tag-btn.active { color: #fff; background: var(--ws-primary); border-color: var(--ws-primary); box-shadow: 0 0 10px var(--ws-primary-glow); font-weight: 600; }

/* 作品网格 */
.ws-grid { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 12px 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; align-content: start; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; }
.ws-grid.mobile { grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px; }
.ws-grid::-webkit-scrollbar { width: 3px; }
.ws-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }

/* 卡片 */
.ws-card { position: relative; border-radius: 12px; border: 1px solid var(--ws-border); background: var(--ws-glass); cursor: pointer; transition: all .3s; overflow: hidden; display: flex; flex-direction: column; backdrop-filter: blur(4px); }
.ws-card:hover { border-color: var(--ws-primary); background: rgba(229,20,0,.04); transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,.5), 0 0 15px var(--ws-primary-glow); }

.ws-card-cover { width: 100%; aspect-ratio: 4 / 3; position: relative; background: rgba(0,0,0,.3); overflow: hidden; flex-shrink: 0; }
.ws-card-img { width: 100%; height: 100%; object-fit: cover; display: block; position: relative; z-index: 1; transition: transform .3s; }
.ws-card:hover .ws-card-img { transform: scale(1.05); }
.ws-card-cover-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.06); }
.ws-card-type { position: absolute; top: 6px; left: 6px; z-index: 2; padding: 2px 8px; border-radius: 4px; background: rgba(0,0,0,.7); color: var(--ws-primary); font-size: 10px; font-weight: 600; backdrop-filter: blur(4px); border: 1px solid rgba(229,20,0,.3); }

.ws-card-info { padding: 10px; }
.ws-card-title { font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 0 4px rgba(255,255,255,0.2); }
.ws-card-author { display: flex; align-items: center; gap: 4px; font-size: 10px; color: rgba(255,255,255,.4); margin-top: 6px; }
.ws-card-avatar { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(255,255,255,.1); }
.ws-card-meta { display: flex; gap: 8px; margin-top: 6px; }
.ws-card-stat { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,.45); transition: color .2s; }
.ws-card:hover .ws-card-stat { color: rgba(255,255,255,.6); }
.ws-grid.mobile .ws-card-stat { font-size: 11px; color: rgba(255,255,255,.75); }
.ws-grid.mobile .ws-card-stat svg { width: 12px; height: 12px; }

/* 空/加载状态 */
.ws-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: rgba(255,255,255,.2); font-size: 13px; padding: 40px 16px; grid-column: 1 / -1; }
.ws-loading { display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--ws-primary); font-size: 12px; padding: 20px; grid-column: 1 / -1; text-shadow: 0 0 8px var(--ws-primary-glow); }

/* 分页 */
.ws-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 14px; border-top: 1px solid var(--ws-border); background: rgba(0,0,0,.3); flex-shrink: 0; }
.ws-page-arrow { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--ws-border); background: var(--ws-glass); color: rgba(255,255,255,.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; }
.ws-page-arrow:hover:not(:disabled) { background: var(--ws-primary-dim); color: var(--ws-primary); border-color: var(--ws-primary); box-shadow: 0 0 10px var(--ws-primary-glow); }
.ws-page-arrow:disabled { opacity: .3; cursor: not-allowed; }
.ws-page-info { font-size: 12px; color: rgba(255,255,255,.4); }

/* 详情弹窗 */
.ws-dialog-overlay { position: absolute; inset: 0; min-height: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10; padding: 16px; }
.ws-detail-dialog { width: 560px; max-width: 100%; max-height: 90%; min-height: 0; background: var(--ws-bg-section); border: 1px solid var(--ws-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,.8), 0 0 20px var(--ws-primary-glow); }
.ws-detail-dialog.mobile { width: 100%; height: 100%; max-height: 100%; border-radius: 0; align-self: stretch; }
.ws-detail-top { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--ws-border); background: rgba(0,0,0,.3); flex-shrink: 0; }
.ws-detail-title { font-size: 15px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 0 8px rgba(255,255,255,0.3); }
.ws-btn-icon-sm { width: 24px; height: 24px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: rgba(255,255,255,.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; }
.ws-btn-icon-sm:hover { background: var(--ws-primary-dim); color: var(--ws-primary); border-color: var(--ws-primary); box-shadow: 0 0 8px var(--ws-primary-glow); }

.ws-detail-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; }
.ws-detail-body::-webkit-scrollbar { width: 3px; }
.ws-detail-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }

.ws-detail-cover { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--ws-border); }
.ws-detail-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.ws-detail-type { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(229,20,0,.15); color: var(--ws-primary); font-weight: 600; border: 1px solid rgba(229,20,0,.3); }
.ws-detail-author { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,.6); }
.ws-detail-date { font-size: 10px; color: rgba(255,255,255,.3); }

/* 角色卡链接 */
.ws-detail-card-link { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ws-primary); background: var(--ws-primary-dim); border: 1px solid rgba(229,20,0,.3); border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; text-shadow: 0 0 5px rgba(229,20,0,.5); }

.ws-detail-tags { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
.ws-detail-tag { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: var(--ws-glass); border: 1px solid var(--ws-border); color: rgba(255,255,255,.5); }
.ws-detail-desc { font-size: 12px; color: rgba(255,255,255,.6); line-height: 1.6; margin-bottom: 12px; }
.ws-detail-content-label { font-size: 11px; color: rgba(255,255,255,.4); margin-bottom: 4px; letter-spacing: 1px; }
.ws-detail-content { font-size: 11px; color: rgba(255,255,255,.5); background: rgba(0,0,0,.4); padding: 10px; border-radius: 6px; border: 1px solid var(--ws-border); max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; font-family: monospace; line-height: 1.5; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; }

/* collection 提示 */
.ws-detail-collection-notice { font-size: 12px; color: rgba(255,255,255,.6); background: rgba(229,20,0,.05); border: 1px solid rgba(229,20,0,.2); border-radius: 6px; padding: 12px; text-align: center; line-height: 1.6; }

/* 操作按钮 */
.ws-detail-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--ws-border); background: rgba(0,0,0,.3); flex-shrink: 0; flex-wrap: wrap; }
.ws-action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; border: 1px solid var(--ws-border); background: var(--ws-glass); color: rgba(255,255,255,.7); font-size: 12px; font-weight: 500; cursor: pointer; transition: all .2s; white-space: nowrap; }
.ws-action-btn:hover:not(:disabled) { background: rgba(255,255,255,.1); color: #fff; border-color: rgba(255,255,255,.3); box-shadow: 0 0 10px rgba(255,255,255,.1); }
.ws-action-btn:disabled { opacity: .4; cursor: not-allowed; }

.ws-btn-like.liked { color: var(--ws-primary); border-color: rgba(229,20,0,.4); background: var(--ws-primary-dim); box-shadow: 0 0 8px var(--ws-primary-glow); }
.ws-btn-like:hover:not(:disabled) { background: rgba(229,20,0,.2) !important; color: var(--ws-primary) !important; border-color: var(--ws-primary) !important; }

.ws-btn-favorite.active { color: #fbbf24; border-color: rgba(251,191,36,.45); background: rgba(251,191,36,.1); box-shadow: 0 0 10px rgba(251,191,36,.25); }
.ws-btn-favorite:hover:not(:disabled) { background: rgba(251,191,36,.16); color: #fbbf24; border-color: rgba(251,191,36,.5); }

.ws-btn-download { border-color: rgba(52,211,153,.3); background: rgba(52,211,153,.08); color: #34d399; }
.ws-btn-download:hover:not(:disabled) { background: rgba(52,211,153,.2); border-color: #34d399; box-shadow: 0 0 12px rgba(52,211,153,.4); color: #fff; }

.ws-btn-import { border-color: rgba(229,20,0,.3); background: rgba(229,20,0,.1); color: var(--ws-primary); }
.ws-btn-import:hover:not(:disabled) { background: rgba(229,20,0,.25); border-color: var(--ws-primary); box-shadow: 0 0 15px var(--ws-primary-glow); color: #fff; }

.ws-btn-card { border-color: rgba(139,92,246,.4); background: rgba(139,92,246,.1); color: #a78bfa; }
.ws-btn-card:hover:not(:disabled) { background: rgba(139,92,246,.25); border-color: #a78bfa; box-shadow: 0 0 12px rgba(139,92,246,.4); color: #fff; }

.ws-comments-panel { margin-top: 14px; border: 1px solid var(--ws-border); border-radius: 8px; background: rgba(0,0,0,.24); overflow: hidden; flex-shrink: 0; }
.ws-collection-panel > .ws-comments-panel { margin: 12px 18px 18px; }
.ws-comments-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--ws-border); color: rgba(255,255,255,.62); font-size: 12px; font-weight: 600; }
.ws-comments-list { max-height: 170px; min-height: 0; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; }
.ws-comments-list::-webkit-scrollbar { width: 3px; }
.ws-comments-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }
.ws-comment { border: 1px solid rgba(255,255,255,.06); border-radius: 6px; padding: 8px; background: rgba(255,255,255,.025); }
.ws-comment.hidden { opacity: .62; border-style: dashed; }
.ws-comment-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: rgba(255,255,255,.68); font-size: 11px; margin-bottom: 4px; }
.ws-comment-content { color: rgba(255,255,255,.78); font-size: 12px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.ws-comment-hidden { margin-top: 5px; color: #fbbf24; font-size: 10px; }
.ws-comment-empty { color: rgba(255,255,255,.28); font-size: 12px; text-align: center; padding: 12px; }
.ws-comment-action { border: none; background: transparent; color: rgba(248,113,113,.75); font-size: 10px; cursor: pointer; padding: 2px 4px; border-radius: 4px; }
.ws-comment-action:hover { background: rgba(248,113,113,.12); color: #f87171; }
.ws-comment-form { display: flex; gap: 8px; padding: 8px 10px 10px; border-top: 1px solid var(--ws-border); align-items: flex-end; }
.ws-comment-form textarea { flex: 1; min-height: 42px; max-height: 92px; resize: vertical; border-radius: 6px; border: 1px solid rgba(255,255,255,.08); background: #000 !important; color: rgba(255,255,255,.82) !important; padding: 8px 10px; font-size: 12px; outline: none; }
.ws-comment-form textarea:focus { border-color: var(--ws-primary); box-shadow: 0 0 10px var(--ws-primary-glow); }

/* 确认弹窗 */
.ws-confirm-dialog { width: 380px; max-width: 90%; background: var(--ws-bg-section); border: 1px solid var(--ws-primary); border-radius: 12px; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,.8), 0 0 20px var(--ws-primary-glow); }
.ws-confirm-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 12px; letter-spacing: 1px; }
.ws-confirm-message { font-size: 12px; color: rgba(255,255,255,.6); line-height: 1.6; margin-bottom: 20px; }
.ws-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

@keyframes ws-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.ws-spin { animation: ws-spin-anim .8s linear infinite; }

.ws-dialog-enter-active, .ws-dialog-leave-active { transition: opacity .2s ease; }
.ws-dialog-enter-from, .ws-dialog-leave-to { opacity: 0; }

/* 顶部分类标签 */
.ws-type-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  padding-right: 16px;
  border-bottom: 1px solid var(--ws-border);
  flex-shrink: 0;
}
.ws-type-tabs-left {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}
.ws-type-tabs-left::-webkit-scrollbar { display: none; }
.ws-type-tabs-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.ws-type-tabs::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}
.ws-type-tab {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s var(--ws-transition-smooth);
  white-space: nowrap;
}
.ws-type-tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}
.ws-type-tab.active {
  color: var(--ws-primary);
  background: var(--ws-primary-dim);
  border-color: rgba(229, 20, 0, 0.3);
  text-shadow: 0 0 5px var(--ws-primary-glow);
  box-shadow: 0 0 10px rgba(229, 20, 0, 0.1);
}

/* 沉浸式展示面板 (Persona 专属) */
/* ─── 顶部导航栏（返回 + 关闭）─── */
.ws-overlay-top-bar {
  position: fixed;
  top: 20px;
  left: 40px;
  z-index: 10000;
}
.ws-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.ws-back-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

/* ─── 作者合集面板 ─── */
.ws-collection-panel {
  position: relative;
  width: 90%;
  max-width: 1100px;
  max-height: 88vh;
  min-height: 0;
  background: var(--ws-bg-section);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7);
}
.ws-collection-header {
  padding: 24px 28px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.ws-collection-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 6px 0 4px;
  letter-spacing: 0.5px;
}
.ws-collection-meta {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin: 0 0 6px;
}
.ws-collection-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  margin: 0;
  line-height: 1.5;
}
.ws-collection-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 28px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-collection-card {
  background: var(--ws-bg-deep);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.ws-collection-card:hover {
  transform: translateY(-3px);
  border-color: var(--ws-primary);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
.ws-collection-card-thumb {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--ws-bg-section);
}
.ws-collection-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ws-collection-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  background: linear-gradient(135deg, rgba(229,20,0,0.08), rgba(0,0,0,0.3));
}
.ws-collection-card-body {
  padding: 10px 12px;
}
.ws-type-badge-sm {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(229,20,0,0.15);
  color: var(--ws-primary);
  border: 1px solid rgba(229,20,0,0.3);
}
.ws-collection-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin: 6px 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-collection-card-desc {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.ws-collection-card-meta {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
}

/* 合集"添加作品"内联面板 */
.ws-collection-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ws-collection-batch-btns { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; align-self: flex-start; margin-top: 4px; }
.ws-add-works-panel {
  padding: 14px 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(229,20,0,0.04);
  flex-shrink: 0;
}
.ws-add-works-title { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 8px; letter-spacing: 0.5px; }
.ws-add-works-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
.ws-collection-pick-list {
  max-height: 200px; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  background: var(--ws-bg-deep);
}
.ws-collection-empty { padding: 16px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.3); }
.ws-pick-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 12px; cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;
}
.ws-pick-item:last-child { border-bottom: none; }
.ws-pick-item:hover { background: rgba(255,255,255,0.04); }
.ws-pick-item.selected { background: rgba(229,20,0,0.08); }
.ws-pick-item input[type="checkbox"] { display: none; }
.ws-pick-thumb {
  width: 44px; height: 33px; border-radius: 4px; overflow: hidden; flex-shrink: 0;
  background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center;
}
.ws-pick-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ws-pick-thumb-fallback { font-size: 9px; color: rgba(255,255,255,0.3); text-align: center; }
.ws-pick-body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.ws-pick-title { font-size: 13px; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ws-showcase-panel {

  position: relative;
  width: 85%;
  height: 85%;
  max-width: 1400px;
  min-height: 0;
  background: #0f0f15;
  border-radius: 16px;
  border: 1px solid var(--ws-border);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px var(--ws-primary-glow);
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
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  color: rgba(255,255,255,0.8);
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
.ws-showcase-work-title {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 1.5px;
  margin-bottom: 6px;
  font-weight: 400;
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
  color: rgba(255,255,255,0.6);
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
  color: rgba(255,255,255,0.7);
  font-size: 0.8rem;
  letter-spacing: 1px;
  border-radius: 4px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(5px);
}

.ws-showcase-content {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  line-height: 1.8;
  overflow-y: auto;
  max-height: 200px;
  padding-right: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}
.ws-showcase-content::-webkit-scrollbar { width: 4px; }
.ws-showcase-content::-webkit-scrollbar-thumb { background: var(--ws-primary); border-radius: 4px; }

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

/* ========================================
   移动端适配 (iPhone 14 Pro Max: 430 × 932px)
   ======================================== */

/* 弹窗遮罩层 — 移动端去 padding，小弹窗正常居中 */
.ws-workshop.mobile .ws-dialog-overlay {
  padding: 0;
  overflow: hidden;
}

/* 类型标签栏 — 移动端允许横滚 */
.ws-workshop.mobile .ws-type-tabs {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "tabs"
    "sort";
  gap: 4px;
  margin-top: 4px !important;
  margin-bottom: 6px;
  padding: 4px 10px 6px !important;
  overflow: hidden;
}
.ws-workshop.mobile .ws-type-tabs-left {
  grid-area: tabs;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 1;
  min-width: 0;
  scrollbar-width: none;
  gap: 6px;
  padding-bottom: 1px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  scroll-snap-type: x proximity;
}
.ws-workshop.mobile .ws-type-tabs-left::-webkit-scrollbar { display: none; }
.ws-workshop.mobile .ws-type-tab {
  flex: 0 0 auto;
  padding: 5px 10px;
  font-size: 11px;
  white-space: nowrap;
  border-radius: 6px;
  scroll-snap-align: start;
}
/* 移动端：隐藏作品计数，只保留排序 */
.ws-workshop.mobile .ws-filter-count { display: none; }
.ws-workshop.mobile .ws-type-tabs-right {
  grid-area: sort;
  justify-self: end;
  min-width: max-content;
}
.ws-workshop.mobile .ws-sort-wrap { padding: 3px 8px; gap: 4px; }
.ws-workshop.mobile .ws-sort-select { font-size: 11px; line-height: 1.2; }

/* 关闭/返回 按钮 — 移动端靠近边缘 */
.ws-workshop.mobile .ws-overlay-close-btn { top: 12px; right: 12px; width: 36px; height: 36px; }
.ws-workshop.mobile .ws-overlay-top-bar { top: 12px; left: 12px; }

/* 详情弹窗 — 移动端全屏无圆角 */
.ws-detail-dialog.mobile { border-radius: 0; }
.ws-workshop.mobile .ws-detail-header { padding: 14px 14px 0; }
.ws-workshop.mobile .ws-detail-title { font-size: 15px; }
.ws-workshop.mobile .ws-detail-body { padding: 12px 14px; gap: 10px; }
.ws-workshop.mobile .ws-detail-actions { flex-wrap: wrap; gap: 6px; }
.ws-workshop.mobile .ws-action-btn { padding: 7px 12px; font-size: 11px; }

/* 沉浸面板 — 移动端垂直布局优化 */
.ws-showcase-panel.mobile {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  overflow-y: auto;
  align-self: stretch;
}
.ws-showcase-panel.mobile .ws-showcase-portrait-wrap {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  min-height: unset;
  margin-left: 0;
  order: 1;
}
.ws-showcase-panel.mobile .ws-showcase-content-wrap { padding: 16px 18px; gap: 10px; }
.ws-showcase-panel.mobile .ws-showcase-title {
  font-size: clamp(1.6rem, 10vw, 2.2rem);
  white-space: normal;
  word-break: keep-all;
  letter-spacing: 2px;
}
.ws-showcase-panel.mobile .ws-showcase-quote {
  font-size: 0.85rem;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ws-showcase-panel.mobile .ws-showcase-img {
  -webkit-mask-image: none;
  mask-image: none;
  object-position: center top;
  object-fit: cover;
  border-radius: 0;
}
.ws-showcase-panel.mobile .ws-showcase-actions { flex-wrap: wrap; gap: 8px; }
.ws-showcase-panel.mobile .ws-showcase-type { font-size: 0.75rem; letter-spacing: 2px; }

/* 合集面板 — 移动端 */
.ws-collection-panel.mobile {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  align-self: stretch;
}
.ws-collection-panel.mobile .ws-collection-header { flex-direction: column; align-items: flex-start; gap: 10px; padding: 14px; }
.ws-collection-panel.mobile .ws-collection-title { font-size: 18px; }
.ws-collection-panel.mobile .ws-collection-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 10px; }
.ws-collection-panel.mobile .ws-collection-card-title { font-size: 11px; }

/* 分页 — 移动端 */
.ws-workshop.mobile .ws-pagination { padding: 8px 10px; }
.ws-workshop.mobile .ws-page-info { font-size: 10px; }
</style>
