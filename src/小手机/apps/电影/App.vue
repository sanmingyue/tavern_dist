<template>
  <div class="movie-page">
    <!-- ═══ 电影详情 ═══ -->
    <template v-if="activeMovie">
      <header class="movie-header">
        <button class="back-btn" @click="activeMovie = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">电影详情</span>
        <div style="width:32px"></div>
      </header>

      <div class="detail-scroll">
        <!-- 电影封面 -->
        <div class="movie-cover" :style="{ background: activeMovie.gradient }">
          <div class="cover-info">
            <h2>{{ activeMovie.title }}</h2>
            <div class="cover-meta">
              <span>{{ activeMovie.genre }}</span>
              <span>·</span>
              <span>{{ activeMovie.duration }}</span>
              <span>·</span>
              <span>{{ activeMovie.director }}</span>
            </div>
            <div class="cover-rating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD93D" stroke="none"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/></svg>
              <span>{{ activeMovie.rating }}</span>
            </div>
          </div>
        </div>

        <!-- 演员 -->
        <div class="cast-section">
          <span class="section-label">演员</span>
          <div class="cast-list">
            <div v-for="actor in activeMovie.cast" :key="actor" class="cast-chip">{{ actor }}</div>
          </div>
        </div>

        <!-- 简介 -->
        <div class="synopsis-section">
          <span class="section-label">简介</span>
          <p>{{ activeMovie.description }}</p>
        </div>

        <!-- 购票 -->
        <div class="ticket-section">
          <span class="section-label">选座购票</span>
          <div class="showtime-grid">
            <button v-for="time in showtimes" :key="time" class="showtime-btn" :class="{ selected: selectedTime === time }" @click="selectedTime = time">
              {{ time }}
            </button>
          </div>
          <div class="seat-map">
            <div class="screen-line">银幕</div>
            <button
              v-for="seat in seats"
              :key="seat"
              class="seat"
              :class="{ selected: selectedSeats.includes(seat), taken: takenSeats.includes(seat) }"
              :disabled="takenSeats.includes(seat)"
              @click="toggleSeat(seat)"
            >
              {{ seat }}
            </button>
          </div>
          <button class="buy-ticket-btn" :disabled="!selectedTime" @click="buyTicket">
            {{ selectedTime ? `购票 · ${selectedTime}${selectedSeats.length ? ' · ' + selectedSeats.join(',') : ''}` : '请选择场次' }}
          </button>
        </div>

        <!-- 影评 -->
        <div class="review-section">
          <div class="review-header">
            <span class="section-label">影评 ({{ activeMovie.reviews.length }})</span>
            <button class="gen-btn" :disabled="isGenerating" @click="generateReviews">AI 影评</button>
          </div>

          <SkeletonLoader v-if="isGenerating && activeMovie.reviews.length === 0" type="list" :rows="2" />

          <div v-for="review in activeMovie.reviews" :key="review.id" class="review-item" @click="selectedReview = review">
            <div class="review-top">
              <AvatarBadge :name="review.author" size="sm" />
              <div class="review-info">
                <strong>{{ review.author }}</strong>
                <div class="review-stars">
                  <svg v-for="i in 5" :key="i" width="10" height="10" viewBox="0 0 24 24" :fill="i <= Math.round(review.rating / 2) ? '#FFD93D' : 'none'" :stroke="i <= Math.round(review.rating / 2) ? '#FFD93D' : 'var(--text-muted)'" stroke-width="2">
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
                  </svg>
                  <span>{{ review.rating }}/10</span>
                </div>
              </div>
            </div>
            <p class="review-text">{{ review.content }}</p>
          </div>

          <div v-if="selectedReview" class="review-detail-card">
            <strong>{{ selectedReview.author }} 的影评</strong>
            <span>{{ selectedReview.rating }}/10</span>
            <p>{{ selectedReview.content }}</p>
            <button @click="selectedReview = null">收起</button>
          </div>

          <!-- 写影评 -->
          <div class="write-review">
            <input v-model="reviewInput" class="review-input" placeholder="写影评..." @keyup.enter="submitReview" />
            <button class="review-send" :disabled="!reviewInput.trim()" @click="submitReview">发送</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ 电影列表 ═══ -->
    <template v-else>
      <header class="movie-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="tab-row">
          <button :class="{ active: activeTab === 'hot' }" @click="activeTab = 'hot'">热映</button>
          <button :class="{ active: activeTab === 'soon' }" @click="activeTab = 'soon'">即将上映</button>
        </div>
        <button class="gen-btn ghost" :class="{ active: movieDeleteMode }" @click="toggleMovieDeleteMode">
          {{ movieDeleteMode ? '取消' : '选择' }}
        </button>
        <button v-if="movieDeleteMode" class="gen-btn danger" :disabled="selectedMovieKeys.length === 0" @click="deleteSelectedMovies">
          删除
        </button>
        <button v-else class="gen-btn" :disabled="isGenerating" @click="generateMovies">AI</button>
      </header>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateMovies" />

      <div v-if="movieDeleteMode" class="selection-toolbar">
        <span>已选 {{ selectedMovieKeys.length }} 条</span>
        <button :disabled="selectedMovieKeys.length === 0" @click="deleteSelectedMovies">删除</button>
      </div>

      <div v-if="viewingHistory.length > 0" class="history-section">
        <span class="section-label">观影记录</span>
        <button v-for="record in viewingHistory" :key="record.id" @click="openMovie(record.movie)">
          {{ record.movie.title }} · {{ record.time }} · {{ record.seats.join(',') }}
        </button>
      </div>

      <SkeletonLoader v-if="!lastError && isGenerating && movies.length === 0" type="card" :rows="3" text="AI 正在生成电影..." />

      <div class="movie-list">
        <div v-for="movie in movies" :key="movieKey(movie)" class="movie-card" :class="{ selecting: movieDeleteMode, selected: isMovieSelected(movie) }" @click="movieDeleteMode ? toggleMovieSelection(movie) : openMovie(movie)">
          <button v-if="movieDeleteMode" class="select-check" :class="{ checked: isMovieSelected(movie) }" @click.stop="toggleMovieSelection(movie)">
            <svg v-if="isMovieSelected(movie)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <div class="movie-poster" :style="{ background: movie.gradient }">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
            </svg>
            <div class="poster-rating">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFD93D" stroke="none"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/></svg>
              {{ movie.rating }}
            </div>
          </div>
          <div class="movie-info">
            <h4>{{ movie.title }}</h4>
            <span class="movie-meta">{{ movie.genre }} · {{ movie.duration }}</span>
            <span class="movie-cast">{{ movie.cast.slice(0, 2).join(' / ') }}</span>
            <p class="movie-desc">{{ movie.description }}</p>
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
const hasAutoGenerated = ref(false);
const lastError = ref('');
const activeTab = ref('hot');
const reviewInput = ref('');
const selectedTime = ref('');
const selectedSeats = ref<string[]>([]);
const selectedReview = ref<Review | null>(null);
const movieDeleteMode = ref(false);
const selectedMovieKeys = ref<string[]>([]);

const showtimes = ['10:30', '13:00', '15:30', '18:00', '20:30', '23:00'];
const seats = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];
const takenSeats = ['A3', 'B2', 'C4'];

interface Review {
  id: string;
  author: string;
  content: string;
  rating: number;
}

interface Movie {
  title: string;
  rating: number;
  genre: string;
  director: string;
  cast: string[];
  description: string;
  duration: string;
  gradient: string;
  reviews: Review[];
}
interface ViewingRecord { id: string; movie: Movie; time: string; seats: string[]; }

const gradients = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
];

const movies = ref<Movie[]>([
  {
    title: '星际迷航：新纪元', rating: 8.7, genre: '科幻', director: '张艺谋',
    cast: ['吴京', '刘德华', '赵丽颖'], description: '人类首次接触外星文明，一场跨越星系的冒险由此展开。',
    duration: '148分钟', gradient: gradients[0], reviews: [
      { id: 'rv1', author: '影评人A', content: '视觉效果震撼，剧本略有不足但瑕不掩瑜', rating: 9 },
    ],
  },
  {
    title: '城市恋曲', rating: 7.5, genre: '爱情', director: '陈可辛',
    cast: ['周冬雨', '易烊千玺'], description: '两个都市男女在繁忙生活中偶然相遇，一段关于勇气和坦诚的爱情故事。',
    duration: '112分钟', gradient: gradients[1], reviews: [],
  },
  {
    title: '暗夜猎人', rating: 8.2, genre: '悬疑', director: '韩寒',
    cast: ['沈腾', '黄渤', '张子枫'], description: '一个看似普通的失踪案，却牵出了隐藏多年的惊天秘密。',
    duration: '126分钟', gradient: gradients[2], reviews: [],
  },
]);

const activeMovie = ref<Movie | null>(null);
const viewingHistory = ref<ViewingRecord[]>([]);

function movieKey(movie: Movie): string {
  return `${movie.title}::${movie.director}`;
}

function isMovieSelected(movie: Movie): boolean {
  return selectedMovieKeys.value.includes(movieKey(movie));
}

function toggleMovieSelection(movie: Movie): void {
  const key = movieKey(movie);
  selectedMovieKeys.value = selectedMovieKeys.value.includes(key)
    ? selectedMovieKeys.value.filter(item => item !== key)
    : [...selectedMovieKeys.value, key];
}

function toggleMovieDeleteMode(): void {
  movieDeleteMode.value = !movieDeleteMode.value;
  selectedMovieKeys.value = [];
}

function deleteSelectedMovies(): void {
  if (selectedMovieKeys.value.length === 0) return;
  const keys = new Set(selectedMovieKeys.value);
  const count = keys.size;
  movies.value = movies.value.filter(movie => !keys.has(movieKey(movie)));
  viewingHistory.value = viewingHistory.value.filter(record => !keys.has(movieKey(record.movie)));
  if (activeMovie.value && keys.has(movieKey(activeMovie.value))) {
    activeMovie.value = null;
  }
  selectedMovieKeys.value = [];
  movieDeleteMode.value = false;
  toastr.success(`已删除 ${count} 条内容`, '电影');
}

function openMovie(movie: Movie) {
  activeMovie.value = movie;
  selectedTime.value = '';
  selectedSeats.value = [];
  selectedReview.value = null;
  store.reportAction({
    appId: 'movie', appName: '电影', action: '查看电影',
    summary: `用户在电影 APP 查看了「${movie.title}」`,
    data: { title: movie.title, rating: movie.rating },
  });
}

function toggleSeat(seat: string) {
  if (takenSeats.includes(seat)) return;
  selectedSeats.value = selectedSeats.value.includes(seat)
    ? selectedSeats.value.filter(s => s !== seat)
    : [...selectedSeats.value, seat].slice(0, 4);
}

function buyTicket() {
  if (!activeMovie.value || !selectedTime.value) return;
  const seatsLabel = selectedSeats.value.length ? selectedSeats.value : ['系统自动选座'];
  viewingHistory.value.unshift({
    id: `vh_${Date.now()}`,
    movie: activeMovie.value,
    time: selectedTime.value,
    seats: seatsLabel,
  });
  store.reportAction({
    appId: 'movie', appName: '电影', action: '购买电影票',
    summary: `用户购买了「${activeMovie.value.title}」的电影票，场次：${selectedTime.value}，座位：${seatsLabel.join(',')}`,
    data: { title: activeMovie.value.title, showtime: selectedTime.value, seats: seatsLabel },
  });
  toastr.success(`已购票「${activeMovie.value.title}」${selectedTime.value}场`, '电影');
}

function submitReview() {
  const text = reviewInput.value.trim();
  if (!text || !activeMovie.value) return;

  activeMovie.value.reviews.push({
    id: `ur_${Date.now()}`,
    author: '我',
    content: text,
    rating: 8,
  });

  store.reportAction({
    appId: 'movie', appName: '电影', action: '写影评',
    summary: `用户为「${activeMovie.value.title}」写了影评：${text}`,
    data: { title: activeMovie.value.title, review: text },
  });

  reviewInput.value = '';
  generateReviews();
}

function toNum(v: unknown, fb: number): number {
  const n = Number(v); return Number.isFinite(n) ? n : fb;
}

async function generateMovies() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const result = await generateForApp('movie', '生成 4 部电影，包含标题、评分、类型、导演、演员、简介。');
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    const text = result.parsed;
    // XML 解析：提取 <movie> 块
    const rawMovies = parseXmlResult(text, 'movie');
    if (rawMovies.length === 0) {
      lastError.value = '生成结果格式不匹配';
      console.warn('[小手机] 电影解析失败:', text.slice(0, 200));
      return;
    }
    lastError.value = '';
    movies.value = rawMovies.slice(0, 6).map((m, i) => ({
      title: String(m.title ?? '电影'),
      rating: Math.min(10, Math.max(0, toNum(m.rating, 7.5))),
      genre: String(m.genre ?? '剧情'),
      director: String(m.director ?? '未知'),
      cast: m.cast ? String(m.cast).split(/[,，、]/).map((s: string) => s.trim()) : ['未知'],
      description: String(m.description ?? ''),
      duration: String(m.duration ?? '120分钟'),
      gradient: gradients[i % gradients.length],
      reviews: [],
    }));
    toastr.success('已生成电影推荐', '电影');
  } finally { isGenerating.value = false; }
}

async function generateReviews() {
  if (!activeMovie.value || isGenerating.value) return;
  isGenerating.value = true;
  try {
    const existing = activeMovie.value.reviews.map(r => `${r.author}: ${r.content}`).join('\n');
    const result = await generateForApp(
      'movie',
      `为电影「${activeMovie.value.title}」生成 2-3 条影评，部分可以是角色写的。请用 <review> 标签输出。`,
      `电影简介：${activeMovie.value.description}\n已有影评:\n${existing}`,
    );
    if (!result.success || !result.parsed) return;
    const text = result.parsed;
    // XML 解析：直接提取 <review> 块
    const rawReviews = extractXmlBlocks(text, 'review').map(parseXmlBlock);
    for (const [i, r] of rawReviews.entries()) {
      const content = String(r.content ?? '').trim();
      if (!content) continue;
      activeMovie.value.reviews.push({
        id: `ar_${Date.now()}_${i}`,
        author: String(r.author ?? `影迷${i + 1}`),
        content,
        rating: Math.min(10, Math.max(1, toNum(r.rating, _.random(6, 10)))),
      });
    }
  } finally { isGenerating.value = false; }
}

// 首次进入自动生成
onMounted(() => {
  if (!hasAutoGenerated.value) {
    hasAutoGenerated.value = true;
    generateMovies();
  }
});
</script>

<style scoped>
.movie-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow: hidden;
}

.movie-header {
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
  padding: 5px 14px; border: none; border-radius: 14px;
  background: transparent; color: var(--text-tertiary); font-size: 13px; font-weight: 500; cursor: pointer;
}
.tab-row button.active { background: var(--accent); color: white; }
.gen-btn {
  border: none; border-radius: 10px; padding: 5px 10px;
  background: var(--accent); color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.gen-btn:disabled { opacity: 0.5; }
.gen-btn.ghost {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
.gen-btn.ghost.active,
.gen-btn.danger {
  background: rgba(231, 76, 60, 0.14);
  color: var(--danger);
}
.selection-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 8px 14px 0; padding: 8px 12px;
  border-radius: 12px; background: rgba(231, 76, 60, 0.08);
  color: var(--text-secondary); font-size: 13px;
}
.selection-toolbar button {
  border: none; border-radius: 12px; padding: 5px 12px;
  background: var(--danger); color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.selection-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }

/* ─── Movie List ─── */
.movie-list { flex: 1; overflow-y: auto; padding: 8px 14px; }
.movie-card {
  display: flex; gap: 12px; padding: 12px;
  background: var(--bg-primary); border-radius: 12px; margin-bottom: 8px; cursor: pointer;
  position: relative;
}
.movie-card.selecting { outline: 1px solid rgba(231, 76, 60, 0.18); }
.movie-card.selected { outline: 2px solid var(--danger); }
.select-check {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  width: 24px; height: 24px; border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%; background: rgba(0, 0, 0, 0.26); color: white;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.select-check.checked { background: var(--danger); border-color: var(--danger); }
.movie-poster {
  width: 80px; height: 110px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.poster-rating {
  position: absolute; top: 6px; right: 6px;
  display: flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 700; color: white;
  background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 6px;
}
.movie-info { flex: 1; min-width: 0; }
.movie-info h4 { margin: 0 0 4px; font-size: 15px; color: var(--text-primary); }
.movie-meta { font-size: 12px; color: var(--text-tertiary); }
.movie-cast { font-size: 12px; color: var(--text-muted); display: block; margin-top: 2px; }
.movie-desc {
  margin: 4px 0 0; font-size: 12px; color: var(--text-secondary); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ─── Detail ─── */
.detail-scroll { flex: 1; overflow-y: auto; }
.movie-cover {
  height: 180px; display: flex; align-items: flex-end; padding: 16px;
}
.cover-info { color: white; }
.cover-info h2 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.cover-meta { font-size: 12px; opacity: 0.8; display: flex; gap: 6px; }
.cover-rating {
  display: flex; align-items: center; gap: 4px;
  font-size: 18px; font-weight: 700; margin-top: 6px;
}

.section-label {
  font-size: 14px; font-weight: 600; color: var(--text-primary);
  display: block; margin-bottom: 8px;
}

.cast-section { padding: 14px; }
.cast-list { display: flex; gap: 6px; flex-wrap: wrap; }
.cast-chip {
  padding: 4px 10px; background: var(--bg-tertiary); border-radius: 12px;
  font-size: 12px; color: var(--text-secondary);
}

.synopsis-section { padding: 0 14px 14px; }
.synopsis-section p { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

.ticket-section { padding: 0 14px 14px; }
.showtime-grid { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.showtime-btn {
  padding: 6px 14px; border: 1px solid var(--border-primary); border-radius: 10px;
  background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer;
}
.showtime-btn.selected { background: var(--accent); color: white; border-color: var(--accent); }
.seat-map {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  margin-bottom: 10px; padding: 10px; background: var(--bg-primary); border-radius: 12px;
}
.screen-line {
  grid-column: 1 / -1; text-align: center; font-size: 11px; color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-secondary); padding-bottom: 6px; margin-bottom: 2px;
}
.seat {
  border: none; border-radius: 8px; padding: 7px 0;
  background: var(--bg-tertiary); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.seat.selected { background: #9b59b6; color: white; }
.seat.taken { opacity: 0.35; cursor: not-allowed; }
.buy-ticket-btn {
  width: 100%; padding: 10px; border: none; border-radius: 20px;
  background: #9b59b6; color: white; font-size: 14px; font-weight: 600; cursor: pointer;
}
.buy-ticket-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── Reviews ─── */
.review-section { padding: 14px; border-top: 1px solid var(--border-secondary); }
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.review-item { padding: 10px 0; border-bottom: 1px solid var(--border-secondary); }
.review-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.review-info strong { font-size: 13px; color: var(--text-primary); display: block; }
.review-stars { display: flex; align-items: center; gap: 2px; margin-top: 2px; }
.review-stars span { font-size: 11px; color: var(--text-muted); margin-left: 4px; }
.review-text { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.review-detail-card {
  margin-top: 10px; padding: 12px; border-radius: 12px; background: var(--bg-primary);
  display: flex; flex-direction: column; gap: 4px; color: var(--text-primary);
}
.review-detail-card span { color: #9b59b6; font-size: 12px; font-weight: 700; }
.review-detail-card p { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.review-detail-card button {
  align-self: flex-end; border: none; background: transparent; color: var(--accent); cursor: pointer;
}

.history-section {
  display: flex; flex-direction: column; gap: 6px; padding: 10px 14px;
}
.history-section button {
  border: none; border-radius: 10px; padding: 9px 10px;
  background: var(--bg-primary); color: var(--text-secondary); text-align: left; cursor: pointer;
}

.write-review { display: flex; gap: 8px; margin-top: 12px; }
.review-input {
  flex: 1; padding: 8px 14px; border: none; border-radius: 18px;
  background: var(--bg-primary); color: var(--text-primary); font-size: 13px; outline: none;
}
.review-send {
  border: none; border-radius: 14px; padding: 6px 14px;
  background: var(--accent); color: white; font-size: 13px; font-weight: 600; cursor: pointer;
}
.review-send:disabled { opacity: 0.4; }
</style>
