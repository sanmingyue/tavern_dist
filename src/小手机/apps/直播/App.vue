<template>
  <div class="live-page">
    <!-- ═══ 直播间 ═══ -->
    <template v-if="activeRoom">
      <div class="live-room" :style="{ background: activeRoom.gradient }">
        <!-- 顶部信息 -->
        <div class="room-top">
          <div class="streamer-info">
            <AvatarBadge :name="activeRoom.streamer" size="sm" />
            <div>
              <span class="streamer-name">{{ activeRoom.streamer }}</span>
              <span class="viewer-count">{{ activeRoom.viewers }}人观看</span>
            </div>
            <button class="room-follow" :class="{ followed: isFollowing(activeRoom) }" @click.stop="toggleFollow(activeRoom)">
              {{ isFollowing(activeRoom) ? '已关注' : '关注' }}
            </button>
          </div>
          <button class="close-btn" @click="activeRoom = null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- 直播画面占位 -->
        <div class="live-stage">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <span class="live-tag">LIVE</span>
          <span class="topic-tag">{{ activeRoom.topic }}</span>
        </div>

        <!-- 弹幕区 -->
        <div class="danmaku-area" ref="danmakuContainer">
          <TransitionGroup name="danmaku">
            <div v-for="dm in danmakuList" :key="dm.id" class="danmaku-item" :class="dm.type">
              <span v-if="dm.type === 'gift'" class="gift-icon">🎁</span>
              <span v-if="dm.type === 'system'" class="system-icon">📢</span>
              <span class="dm-user">{{ dm.user }}</span>
              <span class="dm-text">{{ dm.text }}</span>
            </div>
          </TransitionGroup>
        </div>

        <!-- 底部互动栏 -->
        <div class="room-bottom">
          <input
            v-model="danmakuInput"
            class="danmaku-input"
            placeholder="发弹幕..."
            @keyup.enter="sendDanmaku"
          />
          <button class="gift-btn" @click="showGiftPanel = !showGiftPanel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </button>
          <button class="ai-btn" :disabled="isGenerating" @click="generateDanmaku">
            AI
          </button>
        </div>

        <!-- 礼物面板 -->
        <Transition name="slide-up">
          <div v-if="showGiftPanel" class="gift-panel">
            <div class="gift-grid">
              <button v-for="gift in gifts" :key="gift.name" class="gift-item" @click="sendGift(gift)">
                <span class="gift-emoji">{{ gift.emoji }}</span>
                <span class="gift-name">{{ gift.name }}</span>
                <span class="gift-price">{{ gift.price }}币</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <!-- ═══ 直播列表 ═══ -->
    <template v-else>
      <header class="live-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="tab-row">
          <button :class="{ active: activeTab === 'hot' }" @click="activeTab = 'hot'">热门</button>
          <button :class="{ active: activeTab === 'follow' }" @click="activeTab = 'follow'">关注</button>
          <button :class="{ active: activeTab === 'game' }" @click="activeTab = 'game'">游戏</button>
        </div>
        <button class="gen-btn" :disabled="isGenerating" @click="generateRooms">AI</button>
      </header>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateRooms" />

      <div class="room-grid">
        <div v-for="room in displayedRooms" :key="room.streamer" class="room-card" @click="enterRoom(room)">
          <div class="room-cover" :style="{ background: room.gradient }">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            <div class="room-badges">
              <span class="live-badge">LIVE</span>
              <span class="viewer-badge">{{ room.viewers }}</span>
            </div>
          </div>
          <div class="room-info">
            <span class="room-title">{{ room.topic }}</span>
            <span class="room-streamer">{{ room.streamer }}</span>
            <button class="follow-mini" :class="{ followed: isFollowing(room) }" @click.stop="toggleFollow(room)">
              {{ isFollowing(room) ? '已关注' : '关注' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult, extractXmlBlocks, parseXmlBlock, extractXmlTag } from '../../utils/generation-pipeline';
import AvatarBadge from '../../components/AvatarBadge.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';

const store = usePhoneStore();
const isGenerating = ref(false);
const lastError = ref('');
const activeTab = ref('hot');
const danmakuInput = ref('');
const showGiftPanel = ref(false);
const danmakuContainer = ref<HTMLElement | null>(null);

interface DanmakuItem {
  id: string;
  user: string;
  text: string;
  type: 'normal' | 'gift' | 'system';
}

interface LiveRoom {
  streamer: string;
  topic: string;
  viewers: string;
  gradient: string;
  followed?: boolean;
}

const liveGradients = [
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'linear-gradient(135deg, #2d1b69, #5b2c6f, #1a0530)',
  'linear-gradient(135deg, #0d1117, #161b22, #21262d)',
];

const rooms = ref<LiveRoom[]>([
  { streamer: '小星星', topic: '深夜唱歌🎤 点歌互动', viewers: '3.2万', gradient: liveGradients[0] },
  { streamer: '游戏达人', topic: '王者荣耀 冲国服', viewers: '1.8万', gradient: liveGradients[1] },
  { streamer: '美食博主', topic: '教做糖醋排骨🍖', viewers: '8500', gradient: liveGradients[2] },
  { streamer: '聊天室', topic: '失眠的来聊聊', viewers: '2.1万', gradient: liveGradients[3] },
]);

const activeRoom = ref<LiveRoom | null>(null);
const danmakuList = ref<DanmakuItem[]>([]);
const LIVE_FOLLOW_KEY = 'mini-phone-live-followed-streamers';

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

const followedStreamers = ref<string[]>(readStringArray(LIVE_FOLLOW_KEY));
const displayedRooms = computed(() => {
  if (activeTab.value === 'follow') return rooms.value.filter(isFollowing);
  if (activeTab.value === 'game') return rooms.value.filter(r => /游戏|王者|冲国|game/i.test(r.topic));
  return rooms.value;
});

const gifts = [
  { name: '小花花', emoji: '🌸', price: 1 },
  { name: '爱心', emoji: '❤️', price: 5 },
  { name: '火箭', emoji: '🚀', price: 50 },
  { name: '皇冠', emoji: '👑', price: 100 },
  { name: '城堡', emoji: '🏰', price: 500 },
  { name: '星球', emoji: '🌍', price: 1000 },
];

function isFollowing(room: LiveRoom): boolean {
  return followedStreamers.value.includes(room.streamer) || !!room.followed;
}

function toggleFollow(room: LiveRoom) {
  const followed = isFollowing(room);
  room.followed = !followed;
  followedStreamers.value = followed
    ? followedStreamers.value.filter(name => name !== room.streamer)
    : [room.streamer, ...followedStreamers.value.filter(name => name !== room.streamer)];
  writeStringArray(LIVE_FOLLOW_KEY, followedStreamers.value);
  store.reportAction({
    appId: 'live', appName: '直播', action: '关注主播',
    summary: `用户${!followed ? '关注' : '取消关注'}了主播「${room.streamer}」`,
    data: { streamer: room.streamer, followed: !followed },
  });
}

let danmakuTimer: ReturnType<typeof setInterval> | null = null;

function enterRoom(room: LiveRoom) {
  activeRoom.value = room;
  danmakuList.value = [
    { id: 'sys1', user: '系统', text: `欢迎来到${room.streamer}的直播间`, type: 'system' },
    { id: 'dm1', user: '路人甲', text: '来了来了~', type: 'normal' },
    { id: 'dm2', user: '老粉丝', text: '主播今天好漂亮', type: 'normal' },
  ];

  store.reportAction({
    appId: 'live', appName: '直播', action: '进入直播间',
    summary: `用户进入了「${room.streamer}」的直播间：${room.topic}`,
    data: { streamer: room.streamer, topic: room.topic },
  });

  // 模拟弹幕
  startAutoBarrage();
}

function startAutoBarrage() {
  if (danmakuTimer) clearInterval(danmakuTimer);
  const randomBarrages = [
    '666', '好厉害！', '支持主播', '第一次来', '哈哈哈', '太棒了',
    '感谢分享', '学到了', '加油💪', '❤️', '👏👏', '还有吗',
    '主播唱得好听', '真的假的', '笑死了', '太真实了', '赞赞赞',
  ];
  const randomUsers = ['观众A', '小粉丝', '路人乙', '新人', '老观众', '铁粉', '萌新', '大佬'];

  danmakuTimer = setInterval(() => {
    if (!activeRoom.value) {
      if (danmakuTimer) clearInterval(danmakuTimer);
      return;
    }
    danmakuList.value.push({
      id: `auto_${Date.now()}_${Math.random()}`,
      user: randomUsers[_.random(0, randomUsers.length - 1)],
      text: randomBarrages[_.random(0, randomBarrages.length - 1)],
      type: 'normal',
    });
    // 保持最多 30 条
    if (danmakuList.value.length > 30) danmakuList.value.shift();
    nextTick(() => {
      if (danmakuContainer.value) danmakuContainer.value.scrollTop = danmakuContainer.value.scrollHeight;
    });
  }, _.random(2000, 4000));
}

onUnmounted(() => {
  if (danmakuTimer) clearInterval(danmakuTimer);
});

function sendDanmaku() {
  const text = danmakuInput.value.trim();
  if (!text) return;

  danmakuList.value.push({
    id: `me_${Date.now()}`,
    user: '我',
    text,
    type: 'normal',
  });
  danmakuInput.value = '';

  store.reportAction({
    appId: 'live', appName: '直播', action: '发弹幕',
    summary: `用户在「${activeRoom.value?.streamer}」直播间发了弹幕：${text}`,
    data: { streamer: activeRoom.value?.streamer, text },
  });

  nextTick(() => {
    if (danmakuContainer.value) danmakuContainer.value.scrollTop = danmakuContainer.value.scrollHeight;
  });
}

function sendGift(gift: typeof gifts[0]) {
  showGiftPanel.value = false;
  danmakuList.value.push({
    id: `gift_${Date.now()}`,
    user: '我',
    text: `送出了 ${gift.emoji}${gift.name}`,
    type: 'gift',
  });

  store.reportAction({
    appId: 'live', appName: '直播', action: '送礼物',
    summary: `用户在「${activeRoom.value?.streamer}」直播间送出了${gift.name}（${gift.price}币）`,
    data: { streamer: activeRoom.value?.streamer, gift: gift.name, price: gift.price },
  });

  // 主播感谢
  setTimeout(() => {
    danmakuList.value.push({
      id: `thx_${Date.now()}`,
      user: activeRoom.value?.streamer ?? '主播',
      text: `谢谢宝子的${gift.name}！爱你们~ ${gift.emoji}`,
      type: 'system',
    });
  }, 1500);
}

async function generateDanmaku() {
  if (isGenerating.value || !activeRoom.value) return;
  isGenerating.value = true;

  try {
    const result = await generateForApp(
      'live',
      `为「${activeRoom.value.streamer}」的直播间（话题：${activeRoom.value.topic}）生成 5 条弹幕。`,
      '弹幕可以包括普通弹幕、角色弹幕、送礼提示。请用 <dm> 标签输出。',
    );

    if (!result.success || !result.parsed) return;
    const text = result.parsed;
    // XML 解析：先尝试从 <liveroom> 中提取 <danmaku> 下的 <dm>，否则直接提取 <dm>
    const liveroomBlock = extractXmlTag(text, 'liveroom') ?? text;
    const danmakuBlock = extractXmlTag(liveroomBlock, 'danmaku') ?? liveroomBlock;
    const items = extractXmlBlocks(danmakuBlock, 'dm').map(parseXmlBlock);

    for (const [i, dm] of items.entries()) {
      danmakuList.value.push({
        id: `ai_${Date.now()}_${i}`,
        user: String(dm.user ?? `观众${i}`),
        text: String(dm.text ?? ''),
        type: (dm.type as any) ?? 'normal',
      });
    }
    if (danmakuList.value.length > 30) {
      danmakuList.value = danmakuList.value.slice(-30);
    }
  } finally {
    isGenerating.value = false;
  }
}

async function generateRooms() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const result = await generateForApp('live', '生成 4 个直播间，包含主播名、直播话题、观看人数。请用 <liveroom> 标签输出每个直播间。');
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    if (!result.parsed) {
      lastError.value = '生成结果为空';
      return;
    }
    lastError.value = '';
    const text = result.parsed;

    // XML 解析：提取 <liveroom> 块
    const rawRooms = parseXmlResult(text, 'liveroom', { danmaku: 'dm' });
    if (rawRooms.length === 0) {
      console.warn('[小手机] 直播解析失败:', text.slice(0, 200));
      lastError.value = '生成结果格式不匹配';
      return;
    }

    const newRooms: LiveRoom[] = rawRooms.slice(0, 6).map((r, i) => {
      const streamer = String(r.streamer ?? r.author ?? r.name ?? `主播${i + 1}`);
      return {
        streamer,
        topic: String(r.topic ?? r.title ?? '直播中'),
        viewers: String(r.viewers ?? `${_.random(1000, 50000)}`),
        gradient: liveGradients[(rooms.value.length + i) % liveGradients.length],
        followed: followedStreamers.value.includes(streamer),
      };
    });

    rooms.value.unshift(...newRooms);
    toastr.success(`已生成${newRooms.length}个直播间`, '直播');
  } finally { isGenerating.value = false; }
}
</script>

<style scoped>
.live-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow: hidden;
}

/* ─── Header ─── */
.live-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tab-row { flex: 1; display: flex; gap: 4px; justify-content: center; }
.tab-row button {
  padding: 5px 14px; border: none; border-radius: 14px;
  background: transparent; color: var(--text-tertiary); font-size: 13px; cursor: pointer;
}
.tab-row button.active { background: #ff0050; color: white; }
.gen-btn {
  border: none; border-radius: 10px; padding: 5px 10px;
  background: #ff0050; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.gen-btn:disabled { opacity: 0.5; }

/* ─── Room Grid ─── */
.room-grid {
  flex: 1; overflow-y: auto; padding: 8px 12px;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; align-content: start;
}
.room-card { border-radius: 12px; overflow: hidden; cursor: pointer; background: var(--bg-primary); }
.room-cover {
  height: 120px; display: flex; align-items: center; justify-content: center; position: relative;
}
.room-badges {
  position: absolute; top: 8px; left: 8px; display: flex; gap: 4px;
}
.live-badge {
  padding: 2px 6px; background: #ff0050; color: white;
  font-size: 10px; font-weight: 700; border-radius: 4px;
}
.viewer-badge {
  padding: 2px 6px; background: rgba(0,0,0,0.5); color: white;
  font-size: 10px; border-radius: 4px;
}
.room-info { padding: 8px 10px; }
.room-title {
  font-size: 13px; color: var(--text-primary); display: block;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.room-streamer { font-size: 11px; color: var(--text-muted); }
.follow-mini {
  margin-top: 6px; border: none; border-radius: 10px; padding: 3px 8px;
  background: rgba(255,0,80,0.12); color: #ff0050; font-size: 11px; cursor: pointer;
}
.follow-mini.followed { background: var(--bg-tertiary); color: var(--text-tertiary); }

/* ─── Live Room ─── */
.live-room {
  height: 100%; display: flex; flex-direction: column; position: relative; color: white;
}
.room-top {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; z-index: 2;
}
.streamer-info { display: flex; align-items: center; gap: 8px; }
.streamer-name { font-size: 14px; font-weight: 600; display: block; }
.viewer-count { font-size: 11px; opacity: 0.7; }
.room-follow {
  border: none; border-radius: 12px; padding: 4px 10px;
  background: #ff0050; color: white; font-size: 12px; cursor: pointer;
}
.room-follow.followed { background: rgba(255,255,255,0.2); }
.close-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.15); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.live-stage {
  flex: 0 0 120px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px; position: relative;
}
.live-tag {
  position: absolute; top: 8px; left: 14px;
  padding: 2px 8px; background: #ff0050; border-radius: 4px;
  font-size: 10px; font-weight: 700;
}
.topic-tag {
  font-size: 12px; opacity: 0.6;
}

/* ─── Danmaku ─── */
.danmaku-area {
  flex: 1; overflow-y: auto; padding: 8px 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.danmaku-item {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: 8px;
  background: rgba(0,0,0,0.3); font-size: 13px;
  backdrop-filter: blur(4px);
}
.danmaku-item.gift { background: rgba(255, 0, 80, 0.3); }
.danmaku-item.system { background: rgba(255, 193, 7, 0.2); }
.dm-user { font-weight: 600; opacity: 0.8; font-size: 12px; }
.dm-text { opacity: 0.9; }
.gift-icon, .system-icon { font-size: 14px; }

.danmaku-enter-active { transition: all 0.3s ease; }
.danmaku-enter-from { opacity: 0; transform: translateX(-10px); }

/* ─── Bottom Bar ─── */
.room-bottom {
  display: flex; gap: 8px; padding: 8px 14px;
  background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); z-index: 2;
}
.danmaku-input {
  flex: 1; padding: 8px 14px; border: none; border-radius: 18px;
  background: rgba(255,255,255,0.15); color: white; font-size: 13px; outline: none;
}
.danmaku-input::placeholder { color: rgba(255,255,255,0.5); }
.gift-btn, .ai-btn {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.15); color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
}
.ai-btn { background: #ff0050; }
.ai-btn:disabled { opacity: 0.5; }

/* ─── Gift Panel ─── */
.gift-panel {
  padding: 14px; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(12px); z-index: 3;
}
.gift-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.gift-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
  background: rgba(255,255,255,0.05); cursor: pointer; transition: all 0.15s;
}
.gift-item:hover { background: rgba(255,255,255,0.15); }
.gift-emoji { font-size: 24px; }
.gift-name { font-size: 11px; }
.gift-price { font-size: 10px; opacity: 0.6; }

/* ─── Transitions ─── */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>
