<template>
  <div class="xhs-page">
    <!-- ═══ 帖子详情视图 ═══ -->
    <template v-if="activePost">
      <header class="xhs-nav">
        <button class="nav-btn" @click="activePost = null">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div class="nav-author">
          <AvatarBadge :name="activePost.author" size="sm" />
          <span>{{ activePost.author }}</span>
        </div>
        <button v-if="!isFollowing(activePost.author)" class="nav-btn follow-btn-sm" @click="toggleFollow(activePost.author)">关注</button>
        <span v-else class="followed-text" @click="toggleFollow(activePost.author)">已关注</span>
      </header>

      <div class="detail-scroll">
        <!-- 图片区域 -->
        <div class="detail-image forum-visual" :style="forumImageStyle(activePost)">
          <img class="forum-cover" :src="forumCoverUrl(activePost)" alt="" />
        </div>
        <div class="image-strip">
          <button v-for="i in imageCount(activePost)" :key="i" :style="forumThumbStyle(activePost, i)"></button>
        </div>

        <!-- 正文 -->
        <div class="detail-body">
          <h3 class="detail-title">{{ activePost.title }}</h3>
          <p class="detail-text">{{ activePost.body }}</p>
          <div class="detail-tags">
            <span class="xhs-tag">{{ activePost.tag }}</span>
            <span class="xhs-tag">#{{ activePost.group }}</span>
          </div>
          <span class="detail-time">{{ activePost.time }}</span>
        </div>

        <!-- 互动栏 -->
        <div class="detail-actions">
          <button class="action-item" :class="{ active: activePost.userLiked }" @click="toggleLike(activePost)">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              :fill="activePost.userLiked ? '#fe2c55' : 'none'"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
            <span>{{ activePost.likes }}</span>
          </button>
          <button class="action-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              />
            </svg>
            <span>{{ activePost.commentList.length }}</span>
          </button>
          <button class="action-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
            </svg>
            <span>收藏</span>
          </button>
        </div>

        <!-- 评论区 -->
        <div class="comments-section">
          <div class="comments-header">
            <span class="comments-count">共 {{ activePost.commentList.length }} 条评论</span>
            <button class="ai-gen-btn" :disabled="isGenerating" @click="generateComments">
              {{ isGenerating ? '生成中...' : '✨ AI评论' }}
            </button>
          </div>

          <SkeletonLoader v-if="isGenerating && activePost.commentList.length === 0" type="list" :rows="3" />

          <div v-for="comment in activePost.commentList" :key="comment.id" class="comment-item">
            <AvatarBadge :name="comment.author" size="sm" />
            <div class="comment-body">
              <div class="comment-head">
                <strong>{{ comment.author }}</strong>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p>{{ comment.content }}</p>
              <div class="comment-footer">
                <button class="comment-like" :class="{ liked: comment.userLiked }" @click="toggleCommentLike(comment)">
                  <svg
                    viewBox="0 0 24 24"
                    :fill="comment.userLiked ? '#fe2c55' : 'none'"
                    stroke="currentColor"
                    stroke-width="2"
                    width="14"
                    height="14"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  {{ comment.likes }}
                </button>
                <button class="reply-btn" @click="replyTo(comment)">回复</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论输入框 -->
      <div class="comment-input-area">
        <input
          v-model="commentInput"
          :placeholder="replyTarget ? `回复 @${replyTarget}...` : '说点什么...'"
          class="comment-input"
          @keyup.enter="submitComment"
        />
        <button class="comment-send" :disabled="!commentInput.trim()" @click="submitComment">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </template>

    <!-- ═══ 瀑布流列表视图 ═══ -->
    <template v-else>
      <!-- 顶部导航 -->
      <header class="xhs-nav">
        <button class="nav-btn" @click="store.goBack()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <nav class="xhs-tabs">
          <button
            v-for="topic in topics"
            :key="topic"
            :class="{ active: activeTopic === topic }"
            @click="activeTopic = topic"
          >
            {{ topic }}
            <span v-if="activeTopic === topic" class="tab-indicator"></span>
          </button>
        </nav>
        <button class="nav-btn" :class="{ active: postDeleteMode }" @click="togglePostDeleteMode">
          <svg v-if="postDeleteMode" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </button>
        <button v-if="postDeleteMode" class="nav-btn danger" :disabled="selectedPostIds.length === 0" @click="deleteSelectedPosts">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
        <button v-else class="nav-btn" @click="showNewPost = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      <!-- 搜索栏 -->
      <div class="xhs-search" @click="searchFocused = true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input v-model="topicSearch" placeholder="搜索话题、标签或作者" @keyup.enter="applyTopicSearch" />
      </div>

      <div v-if="postDeleteMode" class="selection-toolbar">
        <span>已选 {{ selectedPostIds.length }} 条</span>
        <button :disabled="selectedPostIds.length === 0" @click="deleteSelectedPosts">删除</button>
      </div>

      <div v-if="notifications.length > 0" class="notification-list">
        <button v-for="item in notifications" :key="item.id" @click="openNotification(item)">
          {{ item.text }}
        </button>
      </div>

      <!-- AI 生成区 -->
      <div class="ai-banner" @click="generatePost">
        <div class="ai-banner-icon">✨</div>
        <div class="ai-banner-text">
          <span class="ai-banner-title">{{ isGenerating ? '生成中...' : 'AI 生成笔记' }}</span>
          <span class="ai-banner-desc">根据剧情生成一条小红书笔记</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <!-- 瀑布流卡片 -->
      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generatePost" />

      <SkeletonLoader v-else-if="isGenerating && posts.length === 0" type="card" :rows="3" text="AI 正在生成笔记..." />

      <div class="waterfall">
        <div class="waterfall-col">
          <div v-for="post in leftCol" :key="post.id" class="xhs-card" :class="{ selecting: postDeleteMode, selected: isPostSelected(post.id) }" @click="postDeleteMode ? togglePostSelection(post.id) : openPost(post)">
            <button v-if="postDeleteMode" class="select-check" :class="{ checked: isPostSelected(post.id) }" @click.stop="togglePostSelection(post.id)">
              <svg v-if="isPostSelected(post.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <div class="card-image forum-visual" :style="forumImageStyle(post)">
              <img class="forum-cover" :src="forumCoverUrl(post)" alt="" />
            </div>
            <div class="card-content">
              <p class="card-title">{{ post.title }}</p>
              <div class="card-footer">
                <div class="card-author">
                  <AvatarBadge :name="post.author" size="sm" />
                  <span>{{ post.author }}</span>
                </div>
                <div class="card-likes">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  {{ post.likes }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="waterfall-col">
          <div v-for="post in rightCol" :key="post.id" class="xhs-card" :class="{ selecting: postDeleteMode, selected: isPostSelected(post.id) }" @click="postDeleteMode ? togglePostSelection(post.id) : openPost(post)">
            <button v-if="postDeleteMode" class="select-check" :class="{ checked: isPostSelected(post.id) }" @click.stop="togglePostSelection(post.id)">
              <svg v-if="isPostSelected(post.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <div class="card-image forum-visual" :style="forumImageStyle(post)">
              <img class="forum-cover" :src="forumCoverUrl(post)" alt="" />
            </div>
            <div class="card-content">
              <p class="card-title">{{ post.title }}</p>
              <div class="card-footer">
                <div class="card-author">
                  <AvatarBadge :name="post.author" size="sm" />
                  <span>{{ post.author }}</span>
                </div>
                <div class="card-likes">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  {{ post.likes }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ 发帖弹窗（内联，不使用 Teleport） ═══ -->
      <div v-if="showNewPost" class="modal-overlay" @click.self="showNewPost = false">
        <div class="modal-sheet">
          <div class="modal-header">
            <button class="modal-close" @click="showNewPost = false">取消</button>
            <h3>发布笔记</h3>
            <button
              class="modal-submit"
              :disabled="!newPostTitle.trim() || !newPostBody.trim() || isPublishing"
              @click="publishPost"
            >
              {{ isPublishing ? '发布中...' : '发布' }}
            </button>
          </div>
          <div class="modal-body">
            <div class="add-photo-area">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--xhs-red)" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>添加照片</span>
            </div>
            <input
              v-model="newPostTitle"
              class="post-title-input"
              placeholder="填写标题会更受欢迎哦～"
              maxlength="50"
            />
            <textarea v-model="newPostBody" class="post-body-input" placeholder="添加正文" rows="5"></textarea>
            <div class="topic-select">
              <span class="topic-label"># 添加话题</span>
              <div class="topic-chips">
                <button
                  v-for="t in topics.slice(0, 5)"
                  :key="t"
                  :class="{ active: newPostTopic === t }"
                  @click="newPostTopic = t"
                >
                  {{ t }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import AvatarBadge from '../../components/AvatarBadge.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import forumCover1 from '../../assets/forum-covers/forum-cover-1.jpg?url';
import forumCover2 from '../../assets/forum-covers/forum-cover-2.jpg?url';
import forumCover3 from '../../assets/forum-covers/forum-cover-3.jpg?url';
import forumCover4 from '../../assets/forum-covers/forum-cover-4.jpg?url';
import { usePhoneStore } from '../../stores/phone-store';
import { extractXmlBlocks, generateForApp, parseXmlBlock, parseXmlResult } from '../../utils/generation-pipeline';

const store = usePhoneStore();

const topics = ['推荐', '关注', '热榜', '同城', '剧情', '求助'];
const activeTopic = ref('推荐');
const searchFocused = ref(false);
const topicSearch = ref('');
const FORUM_FOLLOW_KEY = 'mini-phone-forum-followed-authors';
const FORUM_POSTS_KEY = 'mini-phone-forum-posts';

function readStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 不可用时仅保持当前会话状态。
  }
}

const followedAuthors = ref<string[]>(readStringArray(FORUM_FOLLOW_KEY));
const notifications = ref<{ id: string; text: string; postId: string }[]>([
  { id: 'nt_1', text: '你关注的话题有新回复', postId: 'p1' },
]);

// ─── 帖子数据 ───
interface Comment {
  id: string;
  author: string;
  content: string;
  time: string;
  likes: number;
  userLiked: boolean;
}

interface ForumPost {
  id: string;
  author: string;
  group: string;
  time: string;
  color: string;
  title: string;
  body: string;
  likes: number;
  tag: string;
  commentList: Comment[];
  userLiked: boolean;
  ratio: string;
}

function readForumPosts(): ForumPost[] {
  try {
    const raw = localStorage.getItem(FORUM_POSTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is ForumPost => typeof item === 'object' && item !== null && typeof (item as Partial<ForumPost>).id === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeForumPosts(value: ForumPost[]) {
  try {
    localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify(value));
  } catch {
    // localStorage 不可用时仅保持当前会话状态。
  }
}

const postColors = ['#f5a0b1', '#a0c4f5', '#b8e6d0', '#d4b8f0', '#f5d0a0', '#a0e6e6', '#f0b8c8'];
const postRatios = ['3/4', '4/5', '1/1', '3/4', '4/3', '3/4'];
const forumCovers = [forumCover1, forumCover2, forumCover3, forumCover4];

const posts = ref<ForumPost[]>([
  {
    id: 'p1',
    author: '青空',
    group: '界面美化',
    time: '刚刚',
    color: '#f5a0b1',
    title: '这个手机面板终于开始像真正的社区了 ✨',
    body: '帖子卡片、图片区、互动栏和话题标签都已经放进来了，后面可以直接接 AI 生成内容。',
    likes: 128,
    tag: '#小手机',
    userLiked: false,
    ratio: '3/4',
    commentList: [
      { id: 'c1', author: '路人乙', content: '支持！期待更多功能', time: '5分钟前', likes: 12, userLiked: false },
      { id: 'c2', author: '小美', content: '界面做得好看👍', time: '3分钟前', likes: 8, userLiked: false },
    ],
  },
  {
    id: 'p2',
    author: '路人甲',
    group: '剧情讨论',
    time: '12分钟前',
    color: '#a0c4f5',
    title: '如果 APP 操作能写回正文，论坛会特别适合做线索板 🔍',
    body: '比如收藏帖子、回复某人、查看热榜，都可以成为角色后续回复能感知的动作。',
    likes: 74,
    tag: '#反馈机制',
    userLiked: false,
    ratio: '4/5',
    commentList: [
      { id: 'c3', author: '技术宅', content: '这个思路很棒，期待实装', time: '10分钟前', likes: 5, userLiked: false },
    ],
  },
]);

const persistedPosts = readForumPosts();
if (persistedPosts.length > 0) {
  posts.value = persistedPosts;
}

const isGenerating = ref(false);
const hasAutoGenerated = ref(persistedPosts.length > 0);
const lastError = ref('');
const activePost = ref<ForumPost | null>(null);
const commentInput = ref('');
const replyTarget = ref('');
const postDeleteMode = ref(false);
const selectedPostIds = ref<string[]>([]);

// ─── 发帖 ───
const showNewPost = ref(false);
const newPostTitle = ref('');
const newPostBody = ref('');
const newPostTopic = ref('推荐');
const isPublishing = ref(false);

watch(posts, () => writeForumPosts(posts.value), { deep: true });

function isPostSelected(id: string): boolean {
  return selectedPostIds.value.includes(id);
}

function togglePostSelection(id: string): void {
  selectedPostIds.value = isPostSelected(id)
    ? selectedPostIds.value.filter(postId => postId !== id)
    : [...selectedPostIds.value, id];
}

function togglePostDeleteMode(): void {
  postDeleteMode.value = !postDeleteMode.value;
  selectedPostIds.value = [];
}

function deleteSelectedPosts(): void {
  if (selectedPostIds.value.length === 0) return;
  const ids = new Set(selectedPostIds.value);
  const count = ids.size;
  posts.value = posts.value.filter(post => !ids.has(post.id));
  notifications.value = notifications.value.filter(item => !ids.has(item.postId));
  if (activePost.value && ids.has(activePost.value.id)) {
    activePost.value = null;
  }
  selectedPostIds.value = [];
  postDeleteMode.value = false;
  writeForumPosts(posts.value);
  toastr.success(`已删除 ${count} 条内容`, '论坛');
}

// ─── 瀑布流分列 ───
const filteredPosts = computed(() => {
  const query = topicSearch.value.trim().toLowerCase();
  let list = posts.value;
  if (activeTopic.value === '关注') {
    list = list.filter(p => followedAuthors.value.includes(p.author));
  } else if (activeTopic.value !== '推荐') {
    list = list.filter(p => p.group === activeTopic.value || p.tag.includes(activeTopic.value));
  }
  if (query) {
    list = list.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.body.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query) ||
      p.tag.toLowerCase().includes(query) ||
      p.group.toLowerCase().includes(query),
    );
  }
  return list;
});
const leftCol = computed(() => filteredPosts.value.filter((_, i) => i % 2 === 0));
const rightCol = computed(() => filteredPosts.value.filter((_, i) => i % 2 === 1));

function imageCount(post: ForumPost): number {
  return post.body.length > 80 ? 3 : 2;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function forumImageStyle(post: ForumPost): Record<string, string> {
  return {
    aspectRatio: post.ratio,
  };
}

function forumThumbStyle(post: ForumPost, index: number): Record<string, string> {
  return {
    backgroundImage: `url("${forumCoverUrl(post, index)}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

function forumCoverUrl(post: ForumPost, offset = 0): string {
  return forumCovers[(stableHash(`${post.id}${post.author}${post.title}`) + offset) % forumCovers.length];
}

function isFollowing(author: string): boolean {
  return followedAuthors.value.includes(author);
}

function toggleFollow(author: string) {
  if (isFollowing(author)) {
    followedAuthors.value = followedAuthors.value.filter(a => a !== author);
  } else {
    followedAuthors.value.unshift(author);
    notifications.value.unshift({ id: `nt_${Date.now()}`, text: `${author} 发布动态时会提醒你`, postId: activePost.value?.id || '' });
  }
  writeStringArray(FORUM_FOLLOW_KEY, followedAuthors.value);
  store.reportAction({
    appId: 'forum',
    appName: '论坛',
    action: '关注用户',
    summary: `用户${isFollowing(author) ? '关注' : '取消关注'}了论坛用户「${author}」`,
    data: { author, followed: isFollowing(author) },
  });
}

function applyTopicSearch() {
  store.reportAction({
    appId: 'forum',
    appName: '论坛',
    action: '搜索话题',
    summary: `用户在论坛搜索「${topicSearch.value.trim()}」`,
    data: { keyword: topicSearch.value.trim() },
  });
}

function openNotification(item: { postId: string }) {
  const post = posts.value.find(p => p.id === item.postId);
  if (post) openPost(post);
}

function openPost(post: ForumPost) {
  activePost.value = post;
  store.reportAction({
    appId: 'forum',
    appName: '论坛',
    action: '查看帖子',
    summary: `用户在论坛查看了帖子「${post.title}」`,
    data: { title: post.title, author: post.author },
  });
}

function toggleLike(post: ForumPost) {
  post.userLiked = !post.userLiked;
  post.likes += post.userLiked ? 1 : -1;
  if (post.userLiked) {
    store.reportAction({
      appId: 'forum',
      appName: '论坛',
      action: '点赞帖子',
      summary: `用户在论坛给「${post.author}」的帖子「${post.title}」点了赞`,
      data: { title: post.title, author: post.author },
    });
  }
}

function toggleCommentLike(comment: Comment) {
  comment.userLiked = !comment.userLiked;
  comment.likes += comment.userLiked ? 1 : -1;
}

function replyTo(comment: Comment) {
  replyTarget.value = comment.author;
  commentInput.value = '';
}

function submitComment() {
  const text = commentInput.value.trim();
  if (!text || !activePost.value) return;

  const content = replyTarget.value ? `@${replyTarget.value} ${text}` : text;

  activePost.value.commentList.push({
    id: `uc_${Date.now()}`,
    author: '我',
    content,
    time: '刚刚',
    likes: 0,
    userLiked: false,
  });

  store.reportAction({
    appId: 'forum',
    appName: '论坛',
    action: '发表评论',
    summary: `用户在帖子「${activePost.value.title}」下评论：${content}`,
    data: { postTitle: activePost.value.title, comment: content },
  });

  commentInput.value = '';
  replyTarget.value = '';

  // AI 生成回复评论
  generateComments();
}

async function publishPost() {
  if (!newPostTitle.value.trim() || !newPostBody.value.trim()) return;
  isPublishing.value = true;

  const newPost: ForumPost = {
    id: `up_${Date.now()}`,
    author: '我',
    group: newPostTopic.value,
    time: '刚刚',
    color: postColors[posts.value.length % postColors.length],
    title: newPostTitle.value.trim(),
    body: newPostBody.value.trim(),
    likes: 0,
    tag: `#${newPostTopic.value}`,
    commentList: [],
    userLiked: false,
    ratio: postRatios[posts.value.length % postRatios.length],
  };

  posts.value.unshift(newPost);
  writeForumPosts(posts.value);
  showNewPost.value = false;
  newPostTitle.value = '';
  newPostBody.value = '';

  store.reportAction({
    appId: 'forum',
    appName: '论坛',
    action: '发布帖子',
    summary: `用户在论坛发布了帖子「${newPost.title}」`,
    data: { title: newPost.title, content: newPost.body, topic: newPostTopic.value },
  });

  toastr.success('笔记已发布', '小红书');
  isPublishing.value = false;

  // AI 生成评论
  activePost.value = newPost;
  await generateComments();
}

function toNumber(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

async function generatePost() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const result = await generateForApp(
      'forum',
      '围绕当前剧情、角色关系或世界中的事件，生成一条论坛热帖，包含标题、正文和评论。',
      `当前话题分类：${topics.join('、')}`,
    );

    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    lastError.value = '';

    const text = result.parsed;
    // XML 解析：提取 <post> 块，子项 comments -> comment
    const parsedPosts = parseXmlResult(text, 'post', { comments: 'comment' });
    if (parsedPosts.length === 0) {
      console.warn('[小手机] 论坛解析失败:', text.slice(0, 200));
      lastError.value = '生成结果格式不匹配';
      return;
    }

    const source = parsedPosts[0];
    const title = source.title;
    if (!title) {
      lastError.value = '生成结果缺少标题';
      return;
    }

    const comments: Comment[] = (Array.isArray(source.comments) ? source.comments : [])
      .map((c: any, i: number) => ({
        id: `gc_${Date.now()}_${i}`,
        author: String(c.author ?? `用户${i + 1}`),
        content: String(c.content ?? ''),
        time: '刚刚',
        likes: toNumber(c.likes, _.random(0, 20)),
        userLiked: false,
      }))
      .filter((c: Comment) => c.content);

    const post: ForumPost = {
      id: `ai_${Date.now()}`,
      author: String(source.author ?? '匿名用户'),
      group: String(source.category ?? '推荐'),
      time: '刚刚',
      color: postColors[posts.value.length % postColors.length],
      title: String(title),
      body: String(source.content ?? ''),
      likes: toNumber(source.likes, _.random(10, 200)),
      tag: `#${String(source.category ?? 'AI生成').replace(/^#/, '')}`,
      commentList: comments,
      userLiked: false,
      ratio: postRatios[posts.value.length % postRatios.length],
    };

    posts.value.unshift(post);
    writeForumPosts(posts.value);
    store.reportAction({
      appId: 'forum',
      appName: '论坛',
      action: 'AI生成帖子',
      summary: `论坛生成了「${post.author}」发的帖子「${post.title}」`,
      data: { title: post.title, author: post.author },
    });
    toastr.success('已生成笔记', '小红书');
  } finally {
    isGenerating.value = false;
  }
}

async function generateComments() {
  if (!activePost.value || isGenerating.value) return;
  isGenerating.value = true;

  try {
    const existingComments = activePost.value.commentList.map(c => `${c.author}: ${c.content}`).join('\n');
    const result = await generateForApp(
      'forum',
      `为帖子「${activePost.value.title}」生成 2-3 条新评论回复。请用 <comment> 标签输出。`,
      `帖子正文：${activePost.value.body}\n已有评论:\n${existingComments}`,
    );

    if (!result.success || !result.parsed) return;

    const text = result.parsed;
    // 尝试从 <post> 中提取，或直接提取 <comment>
    const parsedPosts = parseXmlResult(text, 'post', { comments: 'comment' });
    let rawComments: Record<string, string>[];
    if (parsedPosts.length > 0 && Array.isArray(parsedPosts[0].comments)) {
      rawComments = parsedPosts[0].comments;
    } else {
      // 直接提取 <comment> 块
      rawComments = extractXmlBlocks(text, 'comment').map(parseXmlBlock);
    }

    let didAppend = false;
    for (const [i, c] of rawComments.entries()) {
      if (!c.content) continue;
      activePost.value.commentList.push({
        id: `ac_${Date.now()}_${i}`,
        author: String(c.author ?? `路人${String.fromCharCode(65 + i)}`),
        content: String(c.content),
        time: '刚刚',
        likes: toNumber(c.likes, _.random(0, 15)),
        userLiked: false,
      });
      didAppend = true;
    }
    if (didAppend) {
      writeForumPosts(posts.value);
    }
  } finally {
    isGenerating.value = false;
  }
}

// 首次进入自动生成帖子
onMounted(() => {
  if (!hasAutoGenerated.value) {
    hasAutoGenerated.value = true;
    generatePost();
  }
});
</script>

<style scoped>
/* ─── 小红书主题变量 ─── */
.xhs-page {
  --xhs-red: #ff2442;
  --xhs-pink: #fff0f0;
  --xhs-bg: var(--bg-secondary);
  --xhs-card: var(--bg-primary);
  --xhs-text: var(--text-primary);
  --xhs-text2: var(--text-secondary);
  --xhs-text3: var(--text-tertiary);
  --xhs-border: var(--border-secondary);

  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--xhs-bg);
  color: var(--xhs-text);
}

/* ─── 导航栏 ─── */
.xhs-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--xhs-card);
  border-bottom: 0.5px solid var(--xhs-border);
  flex-shrink: 0;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--xhs-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nav-btn.active {
  background: rgba(254, 44, 85, 0.12);
  color: var(--xhs-red);
}
.nav-btn.danger {
  background: rgba(254, 44, 85, 0.12);
  color: var(--xhs-red);
}
.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.nav-author {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.follow-btn-sm {
  width: auto;
  height: auto;
  padding: 4px 14px;
  background: var(--xhs-red);
  color: white;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
}

.followed-text {
  font-size: 12px;
  color: var(--xhs-text3);
}

/* ─── Tab 栏 ─── */
.xhs-tabs {
  flex: 1;
  display: flex;
  gap: 2px;
  justify-content: center;
  overflow-x: auto;
  scrollbar-width: none;
}
.xhs-tabs::-webkit-scrollbar {
  display: none;
}

.xhs-tabs button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--xhs-text3);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
}

.xhs-tabs button.active {
  color: var(--xhs-text);
  font-weight: 700;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--xhs-red);
}

/* ─── 搜索栏 ─── */
.xhs-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 12px;
  padding: 9px 14px;
  border-radius: 20px;
  background: var(--xhs-card);
  color: var(--xhs-text3);
  font-size: 13px;
  cursor: pointer;
}
.xhs-search svg {
  flex-shrink: 0;
}
.xhs-search input {
  flex: 1; border: none; background: transparent; outline: none;
  color: var(--xhs-text); font-size: 13px;
}
.selection-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 12px 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(254, 44, 85, 0.08);
  color: var(--xhs-text);
  font-size: 13px;
}
.selection-toolbar button {
  border: none;
  border-radius: 12px;
  padding: 5px 12px;
  background: var(--xhs-red);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.selection-toolbar button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.notification-list {
  display: flex; gap: 6px; overflow-x: auto; padding: 0 12px 8px; scrollbar-width: none;
}
.notification-list::-webkit-scrollbar { display: none; }
.notification-list button {
  flex: 0 0 auto; border: none; border-radius: 12px; padding: 6px 10px;
  background: rgba(254,44,85,0.1); color: var(--xhs-red); font-size: 12px; cursor: pointer;
}

/* ─── AI 生成横幅 ─── */
.ai-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 12px 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff0f0, #ffe8ec);
  cursor: pointer;
}

.ai-banner-icon {
  font-size: 20px;
}
.ai-banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ai-banner-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--xhs-red);
}
.ai-banner-desc {
  font-size: 11px;
  color: #cc4466;
  margin-top: 2px;
}
.ai-banner svg {
  color: var(--xhs-red);
}

/* ─── 瀑布流 ─── */
.waterfall {
  flex: 1;
  overflow-y: auto;
  padding: 0 6px 16px;
  display: flex;
  gap: 6px;
}

.waterfall-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xhs-card {
  background: var(--xhs-card);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
  position: relative;
}
.xhs-card:active {
  transform: scale(0.98);
}
.xhs-card.selecting {
  outline: 1px solid rgba(254, 44, 85, 0.16);
}
.xhs-card.selected {
  outline: 2px solid var(--xhs-red);
}
.select-check {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.select-check.checked {
  border-color: var(--xhs-red);
  background: var(--xhs-red);
}

.card-image {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.forum-visual {
  position: relative;
  overflow: hidden;
  background: var(--xhs-bg2);
}

.forum-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-content {
  padding: 8px 10px 10px;
}

.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--xhs-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--xhs-text3);
  overflow: hidden;
}

.card-author span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-likes {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--xhs-text3);
}

/* ─── 详情页 ─── */
.detail-scroll {
  flex: 1;
  overflow-y: auto;
}

.detail-image {
  width: 100%;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-strip {
  display: flex; gap: 6px; padding: 8px 14px; background: var(--xhs-bg);
}
.image-strip button {
  width: 48px; height: 48px; border: none; border-radius: 8px;
  opacity: 0.85; cursor: pointer;
}

.detail-body {
  padding: 14px;
}

.detail-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--xhs-text);
  line-height: 1.4;
}

.detail-text {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--xhs-text2);
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.xhs-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: var(--xhs-pink, rgba(255, 36, 66, 0.08));
  color: var(--xhs-red);
  font-weight: 500;
}

.detail-time {
  font-size: 12px;
  color: var(--xhs-text3);
}

/* ─── 互动栏 ─── */
.detail-actions {
  display: flex;
  justify-content: space-around;
  padding: 12px 14px;
  border-top: 0.5px solid var(--xhs-border);
  border-bottom: 0.5px solid var(--xhs-border);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  color: var(--xhs-text3);
  font-size: 13px;
  cursor: pointer;
}
.action-item.active {
  color: var(--xhs-red);
}
.action-item svg {
  flex-shrink: 0;
}

/* ─── 评论区 ─── */
.comments-section {
  padding: 14px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.comments-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--xhs-text);
}

.ai-gen-btn {
  border: 1px solid var(--xhs-red);
  border-radius: 14px;
  padding: 4px 12px;
  background: transparent;
  color: var(--xhs-red);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.ai-gen-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--xhs-border);
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.comment-head strong {
  font-size: 13px;
  color: var(--xhs-text);
}
.comment-time {
  font-size: 11px;
  color: var(--xhs-text3);
}

.comment-body p {
  margin: 0;
  font-size: 13px;
  color: var(--xhs-text2);
  line-height: 1.5;
}

.comment-footer {
  display: flex;
  gap: 16px;
  margin-top: 6px;
}

.comment-like {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: none;
  background: none;
  color: var(--xhs-text3);
  font-size: 12px;
  cursor: pointer;
}
.comment-like.liked {
  color: var(--xhs-red);
}

.reply-btn {
  border: none;
  background: none;
  color: var(--xhs-text3);
  font-size: 12px;
  cursor: pointer;
}
.reply-btn:hover {
  color: var(--xhs-red);
}

/* ─── 评论输入 ─── */
.comment-input-area {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  background: var(--xhs-card);
  border-top: 0.5px solid var(--xhs-border);
  flex-shrink: 0;
}

.comment-input {
  flex: 1;
  padding: 9px 14px;
  border: none;
  border-radius: 20px;
  background: var(--xhs-bg);
  color: var(--xhs-text);
  font-size: 13px;
  outline: none;
}

.comment-send {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--xhs-red);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comment-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ─── 发帖弹窗 ─── */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}

.modal-sheet {
  width: 100%;
  max-height: 85%;
  background: var(--xhs-card);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--xhs-border);
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--xhs-text);
}

.modal-close {
  border: none;
  background: none;
  color: var(--xhs-text3);
  font-size: 14px;
  cursor: pointer;
}

.modal-submit {
  border: none;
  border-radius: 14px;
  padding: 6px 16px;
  background: var(--xhs-red);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.modal-submit:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.add-photo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1.5px dashed var(--xhs-red);
  margin-bottom: 14px;
  font-size: 11px;
  color: var(--xhs-red);
  cursor: pointer;
}

.post-title-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 0.5px solid var(--xhs-border);
  background: transparent;
  color: var(--xhs-text);
  font-size: 16px;
  font-weight: 600;
  outline: none;
  margin-bottom: 10px;
}

.post-body-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: var(--xhs-text);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  margin-bottom: 14px;
}

.topic-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.topic-label {
  font-size: 13px;
  color: var(--xhs-red);
  font-weight: 500;
}
.topic-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.topic-chips button {
  border: 1px solid var(--xhs-border);
  border-radius: 14px;
  padding: 5px 12px;
  background: transparent;
  color: var(--xhs-text2);
  font-size: 12px;
  cursor: pointer;
}
.topic-chips button.active {
  background: var(--xhs-red);
  color: white;
  border-color: var(--xhs-red);
}
</style>
