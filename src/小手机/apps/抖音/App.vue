<template>
  <div class="tiktok-page" @touchstart="onTouchStart" @touchend="onTouchEnd" @wheel.prevent="onWheel">
    <!-- ═══ 视频流（竖屏全屏） ═══ -->
    <div class="video-viewport">
      <TransitionGroup :name="slideDirection">
        <div
          v-for="(video, index) in displayedVideos"
          v-show="index === currentIndex"
          :key="video.id"
          class="video-slide"
          :style="{ background: video.gradient }"
        >
          <button v-if="videoDeleteMode" class="select-check" :class="{ checked: isVideoSelected(video.id) }" @click.stop="toggleVideoSelection(video.id)">
            <svg v-if="isVideoSelected(video.id)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <!-- 播放按钮 -->
          <div class="play-overlay" @click="togglePlay">
            <svg v-if="!isPlaying" width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          <!-- 右侧互动栏 -->
          <div class="side-actions">
            <div class="side-item" @click.stop="showCreator = video.author">
              <AvatarBadge :name="video.author" size="sm" />
            </div>
            <button class="side-item" :class="{ liked: video.userLiked }" @click.stop="toggleLike(video)">
              <svg width="28" height="28" viewBox="0 0 24 24" :fill="video.userLiked ? '#fe2c55' : 'none'" stroke="white" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{{ formatCount(video.likes) }}</span>
            </button>
            <button class="side-item" @click.stop="showComments = true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{{ formatCount(video.comments.length) }}</span>
            </button>
            <button class="side-item" :class="{ liked: favoriteVideos.includes(video.id) }" @click.stop="toggleFavorite(video)">
              <svg width="24" height="24" viewBox="0 0 24 24" :fill="favoriteVideos.includes(video.id) ? '#ffd60a' : 'none'" stroke="white" stroke-width="2">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
              </svg>
              <span>收藏</span>
            </button>
            <button class="side-item" @click.stop="shareVideo(video)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>分享</span>
            </button>
          </div>

          <!-- 底部信息 -->
          <div class="bottom-info">
            <div class="author-line">
              <strong @click.stop="showCreator = video.author">@{{ video.author }}</strong>
              <button class="follow-chip" v-if="!video.followed" @click.stop="toggleFollow(video)">关注</button>
              <button class="follow-chip followed" v-else @click.stop="toggleFollow(video)">已关注</button>
            </div>
            <p class="desc-text">{{ video.description }}</p>
            <div class="music-line" v-if="video.music">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              <span class="music-scroll">{{ video.music }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- 上下滑动提示（首次） -->
      <div v-if="videos.length > 1 && currentIndex === 0 && !hasScrolled" class="swipe-hint">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <span>上滑看下一个</span>
      </div>
    </div>

    <!-- ═══ 顶部标签栏 ═══ -->
    <header class="top-bar">
      <button class="back-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <div class="tab-row">
        <button :class="{ active: activeTab === 'follow' }" @click="activeTab = 'follow'">关注</button>
        <button :class="{ active: activeTab === 'rec' }" @click="activeTab = 'rec'">推荐</button>
      </div>
      <button class="select-btn" :class="{ active: videoDeleteMode }" @click="toggleVideoDeleteMode">
        {{ videoDeleteMode ? '取消' : '选择' }}
      </button>
      <button v-if="videoDeleteMode" class="select-btn danger" :disabled="selectedVideoIds.length === 0" @click="deleteSelectedVideos">删除</button>
      <button v-else class="gen-btn" :disabled="isGenerating" @click="generateVideos">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M23 4 23 10 17 10" /><path d="M1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
      </button>
    </header>

    <div v-if="videoDeleteMode" class="selection-toolbar">
      <span>已选 {{ selectedVideoIds.length }} 条</span>
      <button :disabled="selectedVideoIds.length === 0" @click="deleteSelectedVideos">删除</button>
    </div>

    <!-- ═══ 评论弹窗 ═══ -->
    <Transition name="comments-slide">
      <div v-if="showComments && currentVideo" class="comments-overlay" @click.self="showComments = false">
        <div class="comments-panel">
          <div class="comments-header">
            <span>{{ currentVideo.comments.length }} 条评论</span>
            <button @click="showComments = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div class="comments-list">
            <SkeletonLoader v-if="isGenerating && currentVideo.comments.length === 0" type="list" :rows="3" />
            <div v-for="comment in currentVideo.comments" :key="comment.id" class="comment-row">
              <AvatarBadge :name="comment.author" size="sm" />
              <div class="comment-content">
                <strong>{{ comment.author }}</strong>
                <p>{{ comment.content }}</p>
                <div class="comment-actions">
                  <button :class="{ liked: comment.userLiked }" @click="comment.userLiked = !comment.userLiked; comment.likes += comment.userLiked ? 1 : -1">
                    <svg width="12" height="12" viewBox="0 0 24 24" :fill="comment.userLiked ? '#fe2c55' : 'none'" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {{ comment.likes }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="comment-input-bar">
            <input v-model="commentInput" placeholder="说点什么..." @keyup.enter="submitComment" />
            <button :disabled="!commentInput.trim()" @click="submitComment">发送</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="comments-slide">
      <div v-if="showCreator" class="creator-overlay" @click.self="showCreator = ''">
        <div class="creator-panel">
          <button class="creator-close" @click="showCreator = ''">×</button>
          <AvatarBadge :name="showCreator" size="lg" />
          <h3>@{{ showCreator }}</h3>
          <p>{{ creatorVideos.length }} 个作品 · {{ creatorFollowed ? '已关注' : '未关注' }}</p>
          <div class="creator-video-list">
            <button v-for="video in creatorVideos" :key="video.id" @click="activeTab = 'rec'; currentIndex = videos.indexOf(video); showCreator = ''">
              {{ video.title }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 加载状态 -->
    <div v-if="lastError" class="loading-overlay">
      <ErrorBlock :message="lastError" :retry-fn="generateVideos" />
    </div>
    <div v-else-if="isGenerating && videos.length === 0" class="loading-overlay">
      <SkeletonLoader type="card" :rows="1" text="AI 正在生成短视频..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult } from '../../utils/generation-pipeline';
import AvatarBadge from '../../components/AvatarBadge.vue';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';

const store = usePhoneStore();
const isGenerating = ref(false);
const lastError = ref('');
const activeTab = ref('rec');
const showComments = ref(false);
const commentInput = ref('');
const hasScrolled = ref(false);
const isPlaying = ref(true);
const slideDirection = ref('slide-up');
const favoriteVideos = ref<string[]>([]);
const showCreator = ref('');
const videoDeleteMode = ref(false);
const selectedVideoIds = ref<string[]>([]);
const TIKTOK_FOLLOW_KEY = 'mini-phone-tiktok-followed-creators';

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
const followedCreators = ref<string[]>(readStringArray(TIKTOK_FOLLOW_KEY));

// 触摸滑动
let touchStartY = 0;

interface TiktokComment {
  id: string; author: string; content: string; likes: number; userLiked: boolean;
}

interface TiktokVideo {
  id: string; title: string; author: string; description: string;
  music: string; gradient: string; likes: number; userLiked: boolean;
  followed: boolean; comments: TiktokComment[];
}

const gradients = [
  'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(180deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(180deg, #0c0c1d 0%, #1a1a3e 50%, #2d2d5e 100%)',
  'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(180deg, #000428 0%, #004e92 100%)',
];

const videos = ref<TiktokVideo[]>([
  {
    id: 'tk_1', title: '今天的落日绝了', author: '日落收藏家', description: '📍城市天台 | 今天的晚霞真的是绝了，赶紧拍下来 #日落 #城市风光', music: '原声 - 日落收藏家',
    gradient: gradients[0], likes: 12500, userLiked: false, followed: followedCreators.value.includes('日落收藏家'),
    comments: [
      { id: 'tc1', author: '小明', content: '好美啊！在哪里拍的？', likes: 45, userLiked: false },
      { id: 'tc2', author: '路人甲', content: '被治愈了', likes: 23, userLiked: false },
    ],
  },
  {
    id: 'tk_2', title: '猫猫日常', author: '铲屎官日记', description: '我家猫今天又把杯子推下桌了... #猫 #萌宠日常', music: '一个人挺好 - 毛不易',
    gradient: gradients[1], likes: 45200, userLiked: false, followed: followedCreators.value.includes('铲屎官日记'),
    comments: [
      { id: 'tc3', author: '爱猫人', content: '哈哈哈哈太真实了', likes: 120, userLiked: false },
    ],
  },
  {
    id: 'tk_3', title: '3分钟学会这道菜', author: '厨房小白', description: '超简单的蒜蓉虾做法，新手也能成功！#美食教程 #做饭', music: '热爱105°C的你',
    gradient: gradients[2], likes: 8700, userLiked: false, followed: followedCreators.value.includes('厨房小白'),
    comments: [],
  },
]);

const currentIndex = ref(0);
const displayedVideos = computed(() => activeTab.value === 'follow' ? videos.value.filter(v => v.followed) : videos.value);
const currentVideo = computed(() => displayedVideos.value[currentIndex.value] || null);
const creatorVideos = computed(() => videos.value.filter(v => v.author === showCreator.value));
const creatorFollowed = computed(() => creatorVideos.value.some(v => v.followed));
watch(activeTab, () => { currentIndex.value = 0; });

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
  selectedVideoIds.value = [];
  videoDeleteMode.value = false;
  currentIndex.value = Math.min(currentIndex.value, Math.max(0, displayedVideos.value.length - 1));
  if (showCreator.value && !creatorVideos.value.length) {
    showCreator.value = '';
  }
  toastr.success(`已删除 ${count} 条内容`, '抖音');
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY;
}

function onTouchEnd(e: TouchEvent) {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) < 50) return;

  if (dy > 0 && currentIndex.value < displayedVideos.value.length - 1) {
    // 上滑 → 下一个
    slideDirection.value = 'slide-up';
    currentIndex.value++;
    hasScrolled.value = true;
    reportView();
  } else if (dy < 0 && currentIndex.value > 0) {
    // 下滑 → 上一个
    slideDirection.value = 'slide-down';
    currentIndex.value--;
  }
}

function goNext() {
  if (currentIndex.value < displayedVideos.value.length - 1) {
    slideDirection.value = 'slide-up';
    currentIndex.value++;
    hasScrolled.value = true;
    reportView();
  }
}

function goPrev() {
  if (currentIndex.value > 0) {
    slideDirection.value = 'slide-down';
    currentIndex.value--;
  }
}

// 键盘上下键支持
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'j') goNext();
  if (e.key === 'ArrowUp' || e.key === 'k') goPrev();
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

// 鼠标滚轮支持
let wheelDebounce = false;
function onWheel(e: WheelEvent) {
  if (wheelDebounce) return;
  wheelDebounce = true;
  setTimeout(() => wheelDebounce = false, 400);
  if (e.deltaY > 0) goNext();
  else if (e.deltaY < 0) goPrev();
}


function togglePlay() {
  isPlaying.value = !isPlaying.value;
}

function toggleLike(video: TiktokVideo) {
  video.userLiked = !video.userLiked;
  video.likes += video.userLiked ? 1 : -1;
}

function toggleFollow(video: TiktokVideo) {
  const next = !video.followed;
  videos.value.forEach(v => { if (v.author === video.author) v.followed = next; });
  followedCreators.value = next
    ? [video.author, ...followedCreators.value.filter(author => author !== video.author)]
    : followedCreators.value.filter(author => author !== video.author);
  writeStringArray(TIKTOK_FOLLOW_KEY, followedCreators.value);
  store.reportAction({
    appId: 'tiktok', appName: '抖音', action: '关注创作者',
    summary: `用户${next ? '关注' : '取消关注'}了创作者「${video.author}」`,
    data: { author: video.author, followed: next },
  });
}

function toggleFavorite(video: TiktokVideo) {
  const has = favoriteVideos.value.includes(video.id);
  favoriteVideos.value = has ? favoriteVideos.value.filter(id => id !== video.id) : [video.id, ...favoriteVideos.value];
  store.reportAction({
    appId: 'tiktok', appName: '抖音', action: '收藏视频',
    summary: `用户${has ? '取消收藏' : '收藏'}了短视频「${video.title}」`,
    data: { title: video.title, favorite: !has },
  });
}

function shareVideo(video: TiktokVideo) {
  store.reportAction({
    appId: 'tiktok', appName: '抖音', action: '分享视频',
    summary: `用户分享了短视频「${video.title}」`,
    data: { title: video.title, author: video.author },
  });
  toastr.success('已分享视频', '抖音');
}

function reportView() {
  const v = currentVideo.value;
  if (!v) return;
  store.reportAction({
    appId: 'tiktok', appName: '抖音', action: '观看短视频',
    summary: `观看了「${v.author}」的短视频「${v.title}」`,
    data: { title: v.title, author: v.author },
  });
}

function submitComment() {
  const text = commentInput.value.trim();
  if (!text || !currentVideo.value) return;
  currentVideo.value.comments.push({
    id: `uc_${Date.now()}`, author: '我', content: text, likes: 0, userLiked: false,
  });
  store.reportAction({
    appId: 'tiktok', appName: '抖音', action: '发表评论',
    summary: `在「${currentVideo.value.title}」下评论：${text}`,
    data: { videoTitle: currentVideo.value.title, comment: text },
  });
  commentInput.value = '';
}

function toNum(v: unknown, fb: number): number {
  const n = Number(v); return Number.isFinite(n) ? n : fb;
}

async function generateVideos() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const result = await generateForApp('tiktok', '生成 4 个竖屏短视频内容，包含标题、作者、简介、背景音乐名。风格要贴近抖音/TikTok，内容有趣接地气。');
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    const text = result.parsed;
    // XML 解析：提取 <video> 块
    const rawVideos = parseXmlResult(text, 'video');
    if (rawVideos.length === 0) {
      lastError.value = '生成结果格式不匹配';
      console.warn('[小手机] 抖音解析失败:', text.slice(0, 200));
      return;
    }
    lastError.value = '';
    videos.value = rawVideos.slice(0, 6).map((v, i) => {
      const author = String(v.author ?? `创作者${i + 1}`);
      return {
        id: `tk_ai_${Date.now()}_${i}`,
        title: String(v.title ?? '短视频'),
        author,
        description: String(v.description ?? ''),
        music: String(v.music || '原声'),
        gradient: gradients[i % gradients.length],
        likes: toNum(v.likes, _.random(1000, 50000)),
        userLiked: false,
        followed: followedCreators.value.includes(author),
        comments: [],
      };
    });
    currentIndex.value = 0;
    toastr.success('已生成短视频推荐', '抖音');
  } finally { isGenerating.value = false; }
}
</script>

<style scoped>
.tiktok-page {
  height: 100%; display: flex; flex-direction: column;
  background: #000; overflow: hidden; position: relative; user-select: none;
}

/* ─── 顶部栏 ─── */
.top-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
}
.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.1); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tab-row { flex: 1; display: flex; gap: 4px; justify-content: center; }
.tab-row button {
  padding: 5px 14px; border: none; border-radius: 14px;
  background: transparent; color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 600; cursor: pointer;
}
.tab-row button.active { color: white; }
.gen-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.1); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.gen-btn:disabled { opacity: 0.4; }
.select-btn {
  border: none; border-radius: 14px; padding: 6px 10px;
  background: rgba(255,255,255,0.1); color: white;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.select-btn.active,
.select-btn.danger {
  background: rgba(254,44,85,0.86);
}
.select-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.selection-toolbar {
  position: absolute; top: 54px; left: 12px; right: 12px; z-index: 12;
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 14px;
  background: rgba(0,0,0,0.42); color: white; font-size: 13px;
  backdrop-filter: blur(8px);
}
.selection-toolbar button {
  border: none; border-radius: 12px; padding: 5px 12px;
  background: #fe2c55; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.selection-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }

/* ─── 视频视口 ─── */
.video-viewport { flex: 1; position: relative; overflow: hidden; }

.video-slide {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.select-check {
  position: absolute; top: 94px; left: 14px; z-index: 13;
  width: 30px; height: 30px; border: 1px solid rgba(255,255,255,0.8);
  border-radius: 50%; background: rgba(0,0,0,0.28); color: white;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.select-check.checked { background: #fe2c55; border-color: #fe2c55; }

.play-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}

/* ─── 右侧互动栏 ─── */
.side-actions {
  position: absolute; right: 10px; bottom: 120px;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
}
.side-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: none; background: none; color: white; cursor: pointer; font-size: 12px;
}
.side-item.liked { color: #fe2c55; }

/* ─── 底部信息 ─── */
.bottom-info {
  position: absolute; left: 12px; right: 60px; bottom: 16px;
  color: white;
}
.author-line {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.author-line strong { font-size: 15px; }
.follow-chip {
  border: 1px solid rgba(255,255,255,0.6); border-radius: 10px;
  padding: 2px 10px; background: transparent; color: white; font-size: 12px; cursor: pointer;
}
.follow-chip.followed { background: rgba(255,255,255,0.18); border-color: transparent; }
.desc-text {
  margin: 0 0 6px; font-size: 13px; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.music-line {
  display: flex; align-items: center; gap: 6px; font-size: 12px;
  color: rgba(255,255,255,0.8);
}
.music-scroll {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;
}

/* ─── 滑动提示 ─── */
.swipe-hint {
  position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  color: rgba(255,255,255,0.5); font-size: 12px;
  animation: swipeHintBounce 2s ease-in-out infinite;
}
@keyframes swipeHintBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
}

/* ─── 评论弹窗 ─── */
.comments-overlay {
  position: absolute; inset: 0; z-index: 20;
  background: rgba(0,0,0,0.4);
  display: flex; flex-direction: column; justify-content: flex-end;
}
.comments-panel {
  background: var(--bg-primary, #1a1a1a); border-radius: 16px 16px 0 0;
  max-height: 60%; display: flex; flex-direction: column;
}
.comments-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; font-size: 14px; font-weight: 600; color: var(--text-primary, #fff);
  border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.1));
}
.comments-header button {
  border: none; background: none; color: var(--text-tertiary, rgba(255,255,255,0.5)); cursor: pointer;
}
.comments-list { flex: 1; overflow-y: auto; padding: 10px 16px; }
.comment-row { display: flex; gap: 10px; padding: 8px 0; }
.comment-content { flex: 1; min-width: 0; }
.comment-content strong { font-size: 13px; color: var(--text-secondary, rgba(255,255,255,0.7)); }
.comment-content p { margin: 3px 0; font-size: 13px; color: var(--text-primary, #fff); line-height: 1.4; }
.comment-actions button {
  display: inline-flex; align-items: center; gap: 4px;
  border: none; background: none; color: var(--text-muted, rgba(255,255,255,0.4)); font-size: 12px; cursor: pointer;
}
.comment-actions button.liked { color: #fe2c55; }

.comment-input-bar {
  display: flex; gap: 8px; padding: 10px 16px;
  border-top: 1px solid var(--border-secondary, rgba(255,255,255,0.1));
}
.comment-input-bar input {
  flex: 1; padding: 8px 14px; border: none; border-radius: 18px;
  background: var(--bg-input, rgba(255,255,255,0.1)); color: var(--text-primary, #fff); font-size: 13px; outline: none;
}
.comment-input-bar button {
  border: none; border-radius: 14px; padding: 6px 14px;
  background: #fe2c55; color: white; font-size: 13px; font-weight: 600; cursor: pointer;
}
.comment-input-bar button:disabled { opacity: 0.4; }

/* ─── 加载 ─── */
.loading-overlay {
  position: absolute; inset: 0; z-index: 15;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.8);
}

/* ─── 滑动动画 ─── */
.slide-up-enter-active, .slide-up-leave-active,
.slide-down-enter-active, .slide-down-leave-active {
  transition: transform 0.35s ease;
}
.slide-up-enter-from { transform: translateY(100%); }
.slide-up-leave-to { transform: translateY(-100%); }
.slide-down-enter-from { transform: translateY(-100%); }
.slide-down-leave-to { transform: translateY(100%); }

/* ─── 评论弹窗动画 ─── */
.comments-slide-enter-active, .comments-slide-leave-active {
  transition: all 0.3s ease;
}
.comments-slide-enter-from .comments-panel,
.comments-slide-leave-to .comments-panel {
  transform: translateY(100%);
}

.creator-overlay {
  position: absolute; inset: 0; z-index: 30; background: rgba(0,0,0,0.45);
  display: flex; align-items: flex-end;
}
.creator-panel {
  width: 100%; padding: 18px; border-radius: 18px 18px 0 0;
  background: #111; color: white; text-align: center;
}
.creator-close {
  float: right; border: none; background: transparent; color: white;
  font-size: 24px; cursor: pointer;
}
.creator-panel h3 { margin: 8px 0 4px; }
.creator-panel p { margin: 0 0 12px; color: rgba(255,255,255,0.65); font-size: 13px; }
.creator-video-list { display: flex; flex-direction: column; gap: 6px; }
.creator-video-list button {
  border: none; border-radius: 10px; padding: 9px 10px;
  background: rgba(255,255,255,0.08); color: white; text-align: left; cursor: pointer;
}
</style>
