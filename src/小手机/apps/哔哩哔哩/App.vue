<template>
  <div class="bilibili-page">
    <!-- ═══ 视频详情 ═══ -->
    <template v-if="activeVideo">
      <header class="bili-header">
        <button class="back-btn" @click="activeVideo = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span class="header-title">视频详情</span>
        <div style="width:32px"></div>
      </header>

      <div class="detail-scroll">
        <!-- 播放器区域（16:9） -->
        <div class="player-area" :style="{ background: activeVideo.gradient }">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M8 5v14l11-7z" /></svg>
          <span class="duration-tag">{{ activeVideo.duration }}</span>
          <div class="danmaku-overlay">
            <span v-for="(dm, i) in floatingDanmaku" :key="i" class="danmaku-item" :style="{ top: `${10 + (i * 22) % 80}%`, animationDelay: `${i * 0.5}s` }">{{ dm }}</span>
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="video-info">
          <h3>{{ activeVideo.title }}</h3>
          <div class="stat-row">
            <span>{{ activeVideo.views }}播放</span>
            <span>·</span>
            <span>{{ activeVideo.danmakuCount }}弹幕</span>
            <span>·</span>
            <span>{{ activeVideo.date }}</span>
          </div>

          <div class="up-row" @click="showCreator = activeVideo.author">
            <AvatarBadge :name="activeVideo.author" size="sm" />
            <div class="up-info">
              <strong>{{ activeVideo.author }}</strong>
              <span>{{ activeVideo.fans }}粉丝</span>
            </div>
            <button class="follow-btn" :class="{ followed: isAuthorFollowed(activeVideo.author) }" @click.stop="toggleFollow(activeVideo)">
              {{ isAuthorFollowed(activeVideo.author) ? '已关注' : '+ 关注' }}
            </button>
          </div>

          <div v-if="showCreator" class="creator-card">
            <button @click="showCreator = ''">收起</button>
            <strong>{{ showCreator }}</strong>
            <span>{{ creatorVideos.length }} 个投稿</span>
            <div class="creator-posts">
              <button v-for="video in creatorVideos" :key="video.id" @click="openVideo(video); showCreator = ''">{{ video.title }}</button>
            </div>
          </div>

          <p class="desc">{{ activeVideo.description }}</p>

          <!-- 互动栏 -->
          <div class="action-bar">
            <button :class="{ active: activeVideo.userLiked }" @click="toggleLike">
              <svg width="18" height="18" viewBox="0 0 24 24" :fill="activeVideo.userLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
              <span>{{ activeVideo.likes }}</span>
            </button>
            <button>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{{ activeVideo.comments.length }}</span>
            </button>
            <button :class="{ active: favoriteVideos.includes(activeVideo.id) }" @click="toggleFavorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
              </svg>
              <span>收藏</span>
            </button>
            <button @click="shareVideo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>转发</span>
            </button>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comment-section">
          <div class="section-head">
            <span>评论 ({{ activeVideo.comments.length }})</span>
            <button class="ai-btn" :disabled="isGenerating" @click="generateComments">AI 评论</button>
          </div>

          <SkeletonLoader v-if="isGenerating && activeVideo.comments.length === 0" type="list" :rows="3" />

          <div v-for="comment in activeVideo.comments" :key="comment.id" class="comment-item">
            <AvatarBadge :name="comment.author" size="sm" />
            <div class="comment-body">
              <div class="comment-header">
                <strong>{{ comment.author }}</strong>
                <span v-if="comment.level" class="level-badge">LV{{ comment.level }}</span>
              </div>
              <p>{{ comment.content }}</p>
              <div class="comment-meta">
                <button :class="{ liked: comment.userLiked }" @click="comment.userLiked = !comment.userLiked; comment.likes += comment.userLiked ? 1 : -1">
                  👍 {{ comment.likes }}
                </button>
                <button @click="replyTarget = comment.author">回复</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论输入 -->
      <div class="input-bar">
        <input
          v-model="commentInput"
          :placeholder="replyTarget ? `回复 @${replyTarget}` : '发一条友善的评论'"
          @keyup.enter="submitComment"
        />
        <button :disabled="!commentInput.trim()" @click="submitComment">发送</button>
      </div>
    </template>

    <!-- ═══ 视频列表 ═══ -->
    <template v-else>
      <header class="bili-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div class="tab-row">
          <button v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="switchTab(tab.id)">{{ tab.label }}</button>
        </div>
        <button class="ai-btn ghost" :class="{ active: videoDeleteMode }" @click="toggleVideoDeleteMode">
          {{ videoDeleteMode ? '取消' : '选择' }}
        </button>
        <button v-if="videoDeleteMode" class="ai-btn danger" :disabled="selectedVideoIds.length === 0" @click="deleteSelectedVideos">删除</button>
        <button v-else class="ai-btn" :disabled="isGenerating" @click="generateVideos">AI</button>
      </header>

      <!-- 分区标签 -->
      <div class="category-bar">
        <button v-for="cat in categories" :key="cat" :class="{ active: activeCat === cat }" @click="activeCat = cat">{{ cat }}</button>
      </div>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateVideos" />

      <div v-if="videoDeleteMode" class="selection-toolbar">
        <span>已选 {{ selectedVideoIds.length }} 条</span>
        <button :disabled="selectedVideoIds.length === 0" @click="deleteSelectedVideos">删除</button>
      </div>

      <SkeletonLoader v-if="!lastError && isGenerating && videos.length === 0" type="card" :rows="3" text="AI 正在生成视频推荐..." />

      <div class="video-list">
        <!-- 双列布局 -->
        <div class="video-grid">
          <div v-for="video in filteredVideos" :key="video.id" class="video-card" :class="{ selecting: videoDeleteMode, selected: isVideoSelected(video.id) }" @click="videoDeleteMode ? toggleVideoSelection(video.id) : openVideo(video)">
            <button v-if="videoDeleteMode" class="select-check" :class="{ checked: isVideoSelected(video.id) }" @click.stop="toggleVideoSelection(video.id)">
              <svg v-if="isVideoSelected(video.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <div class="card-thumb" :style="{ background: video.gradient }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M8 5v14l11-7z" /></svg>
              <span class="card-duration">{{ video.duration }}</span>
              <div class="card-stats-overlay">
                <span>▶ {{ video.views }}</span>
                <span>💬 {{ video.danmakuCount }}</span>
              </div>
            </div>
            <div class="card-info">
              <span class="card-title">{{ video.title }}</span>
              <div class="card-meta">
                <AvatarBadge :name="video.author" size="sm" />
                <span>{{ video.author }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult, extractXmlBlocks, parseXmlBlock } from '../../utils/generation-pipeline';
import AvatarBadge from '../../components/AvatarBadge.vue';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';

const store = usePhoneStore();
const isGenerating = ref(false);
const lastError = ref('');
const activeTab = ref('rec');
const activeCat = ref('全部');
const commentInput = ref('');
const replyTarget = ref('');
const favoriteVideos = ref<string[]>([]);
const showCreator = ref('');
const videoDeleteMode = ref(false);
const selectedVideoIds = ref<string[]>([]);
const BILI_FOLLOW_KEY = 'mini-phone-bilibili-followed-authors';
const BILI_STATE_KEY = 'mini-phone-bilibili-state';

function readStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').map(normalizeFollowName).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function normalizeFollowName(name: string): string {
  return name.trim().normalize('NFC');
}

function writeStringArray(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value.map(normalizeFollowName).filter(Boolean)));
  } catch {
    // localStorage 不可用时仅保持当前会话状态。
  }
}
const followedAuthors = ref<string[]>(readStringArray(BILI_FOLLOW_KEY));

const tabs = [
  { id: 'rec', label: '推荐' },
  { id: 'hot', label: '热门' },
  { id: 'follow', label: '动态' },
];

const categories = ['全部', '动画', '游戏', '生活', '鬼畜', '知识', '美食', '音乐'];

interface BiliComment {
  id: string; author: string; content: string; likes: number; userLiked: boolean; level?: number;
}

interface BiliVideo {
  id: string; title: string; author: string; views: string; duration: string;
  description: string; category: string; gradient: string; date: string;
  fans: string; danmakuCount: string; likes: number; userLiked: boolean;
  followed: boolean; comments: BiliComment[];
}

interface BiliPersistedState {
  videos?: BiliVideo[];
  favoriteVideos?: string[];
}

function readBiliState(): BiliPersistedState {
  try {
    const raw = localStorage.getItem(BILI_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    const state = parsed as BiliPersistedState;
    return {
      videos: Array.isArray(state.videos) ? state.videos : undefined,
      favoriteVideos: Array.isArray(state.favoriteVideos) ? state.favoriteVideos.filter((item): item is string => typeof item === 'string') : undefined,
    };
  } catch {
    return {};
  }
}

function writeBiliState() {
  try {
    localStorage.setItem(BILI_STATE_KEY, JSON.stringify({
      videos: videos.value,
      favoriteVideos: favoriteVideos.value,
    }));
  } catch {
    // localStorage 不可用时仅保持当前会话状态。
  }
}

const videoGradients = [
  'linear-gradient(135deg, #667eea, #764ba2)', 'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)', 'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)', 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)', 'linear-gradient(135deg, #89f7fe, #66a6ff)',
];

const videos = ref<BiliVideo[]>([
  {
    id: 'bl_1', title: '【科普】为什么猫总是能用四脚着地？', author: '科学阿虫', views: '82.3万', duration: '8:24',
    description: '今天来聊聊猫的翻正反射，从物理和生物学角度解释这个有趣的现象。', category: '知识',
    gradient: videoGradients[0], date: '3天前', fans: '45.2万', danmakuCount: '1.2万',
    likes: 23400, userLiked: false, followed: followedAuthors.value.includes('科学阿虾'),
    comments: [
      { id: 'bc1', author: '好奇宝宝', content: '长知识了！原来猫这么厉害', likes: 234, userLiked: false, level: 4 },
      { id: 'bc2', author: '物理课代表', content: '角动量守恒的经典应用', likes: 156, userLiked: false, level: 6 },
    ],
  },
  {
    id: 'bl_2', title: '挑战用100元吃遍街边摊', author: '干饭王小张', views: '156万', duration: '12:07',
    description: '带着100块在夜市里能吃多少好吃的？结果远超我的预期！', category: '美食',
    gradient: videoGradients[1], date: '1天前', fans: '98万', danmakuCount: '3.4万',
    likes: 56000, userLiked: false, followed: followedAuthors.value.includes('干饭王小张'),
    comments: [
      { id: 'bc3', author: '吃货联盟', content: '馋哭了家人们', likes: 890, userLiked: false, level: 5 },
    ],
  },
  {
    id: 'bl_3', title: '当AI学会了鬼畜...', author: '鬼畜大师', views: '234万', duration: '3:42',
    description: '用AI生成的鬼畜音频，效果意外地好笑', category: '鬼畜',
    gradient: videoGradients[2], date: '5小时前', fans: '178万', danmakuCount: '8.9万',
    likes: 89000, userLiked: false, followed: followedAuthors.value.includes('鬼畜大师'),
    comments: [],
  },
  {
    id: 'bl_4', title: '独居女生的一天vlog', author: '小楠daily', views: '45.6万', duration: '15:30',
    description: '记录独居生活的美好瞬间，做了一顿丰盛的早餐', category: '生活',
    gradient: videoGradients[3], date: '2天前', fans: '23万', danmakuCount: '6700',
    likes: 12300, userLiked: false, followed: followedAuthors.value.includes('小楠daily'),
    comments: [],
  },
]);

const persistedBiliState = readBiliState();
if (persistedBiliState.videos?.length) {
  videos.value = persistedBiliState.videos;
}
if (persistedBiliState.favoriteVideos?.length) {
  favoriteVideos.value = persistedBiliState.favoriteVideos;
}

const activeVideo = ref<BiliVideo | null>(null);
const creatorVideos = computed(() => videos.value.filter(v => v.author === showCreator.value));

const filteredVideos = computed(() => {
  let list = videos.value;
  if (activeTab.value === 'follow') list = list.filter(v => isAuthorFollowed(v.author));
  if (activeCat.value !== '全部') list = list.filter(v => v.category === activeCat.value);
  return list;
});

const floatingDanmaku = computed(() => {
  if (!activeVideo.value) return [];
  return activeVideo.value.comments.slice(0, 5).map(c => c.content.slice(0, 15));
});

function isVideoSelected(id: string): boolean {
  return selectedVideoIds.value.includes(id);
}

function toggleVideoSelection(id: string): void {
  selectedVideoIds.value = isVideoSelected(id)
    ? selectedVideoIds.value.filter(videoId => videoId !== id)
    : [...selectedVideoIds.value, id];
}

function toggleVideoDeleteMode(): void {
  videoDeleteMode.value = !videoDeleteMode.value;
  selectedVideoIds.value = [];
}

function deleteSelectedVideos(): void {
  if (selectedVideoIds.value.length === 0) return;
  const ids = new Set(selectedVideoIds.value);
  const count = ids.size;
  videos.value = videos.value.filter(video => !ids.has(video.id));
  favoriteVideos.value = favoriteVideos.value.filter(id => !ids.has(id));
  if (activeVideo.value && ids.has(activeVideo.value.id)) {
    activeVideo.value = null;
  }
  selectedVideoIds.value = [];
  videoDeleteMode.value = false;
  writeBiliState();
  toastr.success(`已删除 ${count} 条内容`, '哔哩哔哩');
}

function openVideo(video: BiliVideo) {
  syncVideoFollowState();
  activeVideo.value = video;
  replyTarget.value = '';
  store.reportAction({
    appId: 'bilibili', appName: '哔哩哔哩', action: '观看视频',
    summary: `观看了「${video.author}」的视频「${video.title}」`,
    data: { title: video.title, author: video.author },
  });
}

function isAuthorFollowed(author: string): boolean {
  const normalized = normalizeFollowName(author);
  return followedAuthors.value.some(name => normalizeFollowName(name) === normalized);
}

function syncVideoFollowState() {
  videos.value.forEach(video => {
    video.followed = isAuthorFollowed(video.author);
  });
}

function switchTab(tabId: string) {
  activeTab.value = tabId;
  if (tabId === 'follow') activeCat.value = '全部';
  syncVideoFollowState();
}

function toggleLike() {
  if (!activeVideo.value) return;
  activeVideo.value.userLiked = !activeVideo.value.userLiked;
  activeVideo.value.likes += activeVideo.value.userLiked ? 1 : -1;
}

function toggleFollow(video: BiliVideo) {
  const author = normalizeFollowName(video.author);
  const next = !isAuthorFollowed(author);
  videos.value.forEach(v => { if (normalizeFollowName(v.author) === author) v.followed = next; });
  followedAuthors.value = next
    ? [author, ...followedAuthors.value.filter(name => normalizeFollowName(name) !== author)]
    : followedAuthors.value.filter(name => normalizeFollowName(name) !== author);
  writeStringArray(BILI_FOLLOW_KEY, followedAuthors.value);
  store.reportAction({
    appId: 'bilibili', appName: '哔哩哔哩', action: '关注UP主',
    summary: `用户${next ? '关注' : '取消关注'}了 UP 主「${author}」`,
    data: { author, followed: next },
  });
}

function toggleFavorite() {
  if (!activeVideo.value) return;
  const id = activeVideo.value.id;
  const has = favoriteVideos.value.includes(id);
  favoriteVideos.value = has ? favoriteVideos.value.filter(v => v !== id) : [id, ...favoriteVideos.value];
  store.reportAction({
    appId: 'bilibili', appName: '哔哩哔哩', action: '收藏视频',
    summary: `用户${has ? '取消收藏' : '收藏'}了 B 站视频「${activeVideo.value.title}」`,
    data: { title: activeVideo.value.title, favorite: !has },
  });
}

function shareVideo() {
  if (!activeVideo.value) return;
  store.reportAction({
    appId: 'bilibili', appName: '哔哩哔哩', action: '分享视频',
    summary: `用户分享了 B 站视频「${activeVideo.value.title}」`,
    data: { title: activeVideo.value.title, author: activeVideo.value.author },
  });
  toastr.success('已分享视频', '哔哩哔哩');
}

function submitComment() {
  const text = commentInput.value.trim();
  if (!text || !activeVideo.value) return;
  const content = replyTarget.value ? `@${replyTarget.value} ${text}` : text;
  activeVideo.value.comments.push({
    id: `uc_${Date.now()}`, author: '我', content, likes: 0, userLiked: false, level: 3,
  });
  store.reportAction({
    appId: 'bilibili', appName: '哔哩哔哩', action: '发表评论',
    summary: `在「${activeVideo.value.title}」下评论：${content}`,
    data: { videoTitle: activeVideo.value.title, comment: content },
  });
  commentInput.value = '';
  replyTarget.value = '';
}

function toNum(v: unknown, fb: number): number {
  const n = Number(v); return Number.isFinite(n) ? n : fb;
}

async function generateVideos() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const result = await generateForApp('bilibili', '生成 6 个B站风格的视频推荐，包含标题、UP主、播放量、时长、简介、分类（动画/游戏/生活/鬼畜/知识/美食/音乐）。标题风格要像B站，可以用【】标注类型。');
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    const text = result.parsed;
    // XML 解析：提取 <video> 块
    const rawVideos = parseXmlResult(text, 'video');
    if (rawVideos.length === 0) {
      lastError.value = '生成结果格式不匹配';
      console.warn('[小手机] B站解析失败:', text.slice(0, 200));
      return;
    }
    lastError.value = '';
    videos.value = rawVideos.slice(0, 8).map((v, i) => {
      const author = String(v.author ?? `UP主${i + 1}`);
      return {
        id: `bl_ai_${Date.now()}_${i}`,
        title: String(v.title ?? '视频'),
        author,
        views: String(v.views ?? `${_.random(1, 999)}万`),
        duration: String(v.duration ?? '5:00'),
        description: String(v.description ?? ''),
        category: String(v.category ?? categories[_.random(1, categories.length - 1)]),
        gradient: videoGradients[i % videoGradients.length],
        date: '刚刚',
        fans: `${_.random(1, 200)}万`,
        danmakuCount: `${_.random(100, 50000)}`,
        likes: toNum(v.likes, _.random(1000, 100000)),
        userLiked: false,
        followed: isAuthorFollowed(author),
        comments: [],
      };
    });
    syncVideoFollowState();
    writeBiliState();
    toastr.success('已生成视频推荐', '哔哩哔哩');
  } finally { isGenerating.value = false; }
}

async function generateComments() {
  if (!activeVideo.value || isGenerating.value) return;
  isGenerating.value = true;
  try {
    const existing = activeVideo.value.comments.map(c => `${c.author}: ${c.content}`).join('\n');
    const result = await generateForApp(
      'bilibili',
      `为B站视频「${activeVideo.value.title}」生成 3-4 条评论，风格要像B站用户，可以有梗、吐槽、科普。请用 <comment> 标签输出。`,
      `视频简介：${activeVideo.value.description}\n已有评论:\n${existing}`,
    );
    if (!result.success || !result.parsed) return;
    const text = result.parsed;
    // XML 解析：直接提取 <comment> 块
    const rawComments = extractXmlBlocks(text, 'comment').map(parseXmlBlock);
    let didAppend = false;
    for (const [i, c] of rawComments.entries()) {
      const content = String(c.content ?? '').trim();
      if (!content) continue;
      activeVideo.value.comments.push({
        id: `ac_${Date.now()}_${i}`,
        author: String(c.author ?? `用户${i + 1}`),
        content,
        likes: toNum(c.likes, _.random(0, 200)),
        userLiked: false,
        level: _.random(1, 6),
      });
      didAppend = true;
    }
    if (didAppend) {
      writeBiliState();
    }
  } finally { isGenerating.value = false; }
}

onMounted(syncVideoFollowState);
watch([videos, favoriteVideos], writeBiliState, { deep: true });
watch(followedAuthors, syncVideoFollowState, { deep: true });
</script>

<style scoped>
.bilibili-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow: hidden;
}

/* ─── Header ─── */
.bili-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.header-title { flex: 1; font-size: 16px; font-weight: 600; color: var(--text-primary); text-align: center; }
.tab-row { flex: 1; display: flex; gap: 4px; justify-content: center; }
.tab-row button {
  padding: 5px 12px; border: none; border-radius: 14px;
  background: transparent; color: var(--text-tertiary); font-size: 13px; cursor: pointer;
}
.tab-row button.active { background: #00a1d6; color: white; }
.ai-btn {
  border: none; border-radius: 10px; padding: 5px 10px;
  background: #00a1d6; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.ai-btn:disabled { opacity: 0.5; }
.ai-btn.ghost {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
.ai-btn.ghost.active,
.ai-btn.danger {
  background: rgba(231, 76, 60, 0.14);
  color: var(--danger);
}

/* ─── 分区标签 ─── */
.category-bar {
  display: flex; gap: 6px; padding: 8px 12px; overflow-x: auto; flex-shrink: 0;
  background: var(--bg-primary);
}
.category-bar::-webkit-scrollbar { display: none; }
.category-bar button {
  padding: 4px 12px; border: 1px solid var(--border-primary); border-radius: 14px;
  background: transparent; color: var(--text-secondary); font-size: 12px; white-space: nowrap; cursor: pointer;
}
.category-bar button.active {
  background: #00a1d6; border-color: #00a1d6; color: white;
}
.selection-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 8px 12px 0; padding: 8px 12px;
  border-radius: 12px; background: rgba(231, 76, 60, 0.08);
  color: var(--text-secondary); font-size: 13px; flex-shrink: 0;
}
.selection-toolbar button {
  border: none; border-radius: 12px; padding: 5px 12px;
  background: var(--danger); color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.selection-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }

/* ─── 双列网格 ─── */
.video-list { flex: 1; overflow-y: auto; padding: 8px; }
.video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.video-card {
  background: var(--bg-primary); border-radius: 8px; overflow: hidden; cursor: pointer;
  position: relative;
}
.video-card.selecting { outline: 1px solid rgba(231, 76, 60, 0.18); }
.video-card.selected { outline: 2px solid var(--danger); }
.select-check {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  width: 24px; height: 24px; border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%; background: rgba(0, 0, 0, 0.26); color: white;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.select-check.checked { background: var(--danger); border-color: var(--danger); }
.card-thumb {
  aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.card-duration {
  position: absolute; bottom: 4px; right: 4px;
  padding: 1px 4px; background: rgba(0,0,0,0.7); color: white;
  font-size: 10px; border-radius: 3px;
}
.card-stats-overlay {
  position: absolute; bottom: 4px; left: 4px;
  display: flex; gap: 8px; font-size: 10px; color: rgba(255,255,255,0.9);
}
.card-info { padding: 6px 8px; }
.card-title {
  font-size: 12px; color: var(--text-primary); font-weight: 500;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.4;
}
.card-meta {
  display: flex; align-items: center; gap: 4px; margin-top: 4px;
  font-size: 11px; color: var(--text-muted);
}

/* ─── 详情页 ─── */
.detail-scroll { flex: 1; overflow-y: auto; }

.player-area {
  aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;
  position: relative; cursor: pointer; overflow: hidden;
}
.duration-tag {
  position: absolute; bottom: 8px; right: 8px;
  padding: 2px 8px; background: rgba(0,0,0,0.7); color: white;
  font-size: 12px; border-radius: 4px;
}

/* 弹幕效果 */
.danmaku-overlay {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
}
.danmaku-item {
  position: absolute; right: -200px; white-space: nowrap;
  color: white; font-size: 13px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  animation: danmakuFlow 6s linear infinite;
}
@keyframes danmakuFlow {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-100% - 400px)); }
}

.video-info { padding: 12px; }
.video-info h3 { margin: 0 0 6px; font-size: 15px; color: var(--text-primary); line-height: 1.4; }
.stat-row { font-size: 12px; color: var(--text-muted); display: flex; gap: 6px; margin-bottom: 10px; }

.up-row {
  display: flex; align-items: center; gap: 8px; padding: 10px 0;
  border-top: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary);
}
.up-info { flex: 1; }
.up-info strong { display: block; font-size: 14px; color: var(--text-primary); }
.up-info span { font-size: 12px; color: var(--text-muted); }
.follow-btn {
  border: none; border-radius: 14px; padding: 5px 16px;
  background: #00a1d6; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.follow-btn.followed { background: var(--bg-tertiary); color: var(--text-tertiary); }
.creator-card {
  margin: 10px 0; padding: 12px; border-radius: 12px;
  background: var(--bg-primary); display: flex; flex-direction: column; gap: 6px;
}
.creator-card > button {
  align-self: flex-end; border: none; background: transparent; color: #00a1d6; cursor: pointer;
}
.creator-card strong { color: var(--text-primary); }
.creator-card span { color: var(--text-muted); font-size: 12px; }
.creator-posts { display: flex; flex-direction: column; gap: 6px; }
.creator-posts button {
  border: none; border-radius: 8px; padding: 7px 8px;
  background: var(--bg-tertiary); color: var(--text-secondary); text-align: left; cursor: pointer;
}

.desc { margin: 10px 0 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

.action-bar {
  display: flex; justify-content: space-around; padding: 12px 0;
  border-top: 1px solid var(--border-secondary); margin-top: 10px;
}
.action-bar button {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: none; background: none; color: var(--text-tertiary); cursor: pointer; font-size: 12px;
}
.action-bar button.active { color: #00a1d6; }

/* ─── 评论区 ─── */
.comment-section { padding: 12px; }
.section-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;
}
.comment-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-secondary); }
.comment-body { flex: 1; min-width: 0; }
.comment-header { display: flex; align-items: center; gap: 6px; }
.comment-header strong { font-size: 13px; color: var(--text-secondary); }
.level-badge {
  padding: 0 4px; border-radius: 3px; font-size: 10px; font-weight: 600;
  background: #00a1d6; color: white;
}
.comment-body p { margin: 3px 0; font-size: 13px; color: var(--text-primary); line-height: 1.4; }
.comment-meta { display: flex; gap: 12px; margin-top: 4px; }
.comment-meta button {
  border: none; background: none; color: var(--text-muted); font-size: 12px; cursor: pointer;
}
.comment-meta button.liked { color: #00a1d6; }

/* ─── 底部输入 ─── */
.input-bar {
  display: flex; gap: 8px; padding: 8px 12px;
  background: var(--bg-primary); border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.input-bar input {
  flex: 1; padding: 8px 14px; border: none; border-radius: 18px;
  background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; outline: none;
}
.input-bar button {
  border: none; border-radius: 14px; padding: 6px 14px;
  background: #00a1d6; color: white; font-size: 13px; font-weight: 600; cursor: pointer;
}
.input-bar button:disabled { opacity: 0.4; }
</style>
