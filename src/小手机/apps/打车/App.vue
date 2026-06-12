<template>
  <div class="taxi-page">
    <!-- 地图背景 -->
    <div class="taxi-map">
      <svg viewBox="0 0 400 400" class="map-svg">
        <g stroke="rgba(180,180,180,0.4)" stroke-width="3" fill="none">
          <line x1="0" y1="80" x2="400" y2="80"/>
          <line x1="0" y1="160" x2="400" y2="160"/>
          <line x1="0" y1="240" x2="400" y2="240"/>
          <line x1="0" y1="320" x2="400" y2="320"/>
          <line x1="80" y1="0" x2="80" y2="400"/>
          <line x1="160" y1="0" x2="160" y2="400"/>
          <line x1="240" y1="0" x2="240" y2="400"/>
          <line x1="320" y1="0" x2="320" y2="400"/>
        </g>
        <g stroke="rgba(120,120,120,0.5)" stroke-width="5" fill="none">
          <line x1="0" y1="200" x2="400" y2="200"/>
          <line x1="200" y1="0" x2="200" y2="400"/>
        </g>
        <g fill="rgba(100,100,100,0.2)">
          <rect x="90" y="90" width="60" height="60" rx="4"/>
          <rect x="170" y="90" width="50" height="60" rx="4"/>
          <rect x="250" y="90" width="60" height="50" rx="4"/>
          <rect x="90" y="250" width="60" height="60" rx="4"/>
          <rect x="250" y="250" width="60" height="60" rx="4"/>
        </g>
        <!-- 当前位置 -->
        <g transform="translate(200, 200)">
          <circle r="24" fill="#12b656" opacity="0.12"/>
          <circle r="8" fill="#12b656" stroke="white" stroke-width="2.5"/>
        </g>
      </svg>

      <!-- 顶部栏 -->
      <div class="taxi-top">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="taxi-tabs">
          <button v-for="t in rideTypes" :key="t" :class="{ active: activeType === t }" @click="activeType = t">
            {{ t }}
          </button>
        </div>
        <div style="width:36px"></div>
      </div>
    </div>

    <!-- 底部面板 -->
    <div class="taxi-panel">
      <div class="panel-handle"></div>

      <!-- 起终点输入 -->
      <div class="route-inputs">
        <div class="route-dots">
          <div class="dot start"></div>
          <div class="dot-line"></div>
          <div class="dot end"></div>
        </div>
        <div class="route-fields">
          <div class="route-input">
            <input v-model="startPoint" placeholder="您在哪儿上车" class="input-field" />
          </div>
          <div class="route-divider"></div>
          <div class="route-input">
            <input v-model="endPoint" placeholder="您要去哪儿" class="input-field" @keyup.enter="callRide" />
          </div>
        </div>
      </div>

      <!-- 快捷地点 -->
      <div class="quick-places">
        <button v-for="place in quickPlaces" :key="place.name" class="place-chip" @click="endPoint = place.name">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="place.icon"></svg>
          {{ place.name }}
        </button>
      </div>

      <!-- 预估价格 -->
      <div v-if="endPoint.trim()" class="price-cards">
        <div v-for="option in rideOptions" :key="option.type" class="price-card" :class="{ selected: selectedOption === option.type }" @click="selectedOption = option.type">
          <div class="price-left">
            <span class="option-name">{{ option.type }}</span>
            <span class="option-desc">{{ option.desc }}</span>
          </div>
          <div class="price-right">
            <span class="option-price">¥{{ option.price }}</span>
            <span class="option-time">约{{ option.time }}分钟</span>
          </div>
        </div>
      </div>

      <!-- 呼叫按钮 -->
      <button class="call-ride-btn" :disabled="!endPoint.trim()" @click="callRide">
        {{ endPoint.trim() ? `呼叫${selectedOption}` : '输入目的地' }}
      </button>

      <!-- 行程状态 -->
      <div v-if="tripStatus" class="trip-status">
        <div class="trip-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
            <circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
          </svg>
        </div>
        <div class="trip-info">
          <span class="trip-title">{{ tripStatus }}</span>
          <span class="trip-detail">{{ tripDetail }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const rideTypes = ['快车', '专车', '拼车', '代驾'];
const activeType = ref('快车');
const startPoint = ref('当前位置');
const endPoint = ref('');
const selectedOption = ref('快车');
const tripStatus = ref('');
const tripDetail = ref('');

const quickPlaces = [
  { name: '公司', icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/>' },
  { name: '家', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { name: '机场', icon: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3s-3-1-4.5.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 4.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>' },
];

const rideOptions = computed(() => [
  { type: '快车', desc: '性价比之选', price: (12 + Math.floor(endPoint.value.length * 2.5)).toFixed(0), time: 8 + endPoint.value.length },
  { type: '专车', desc: '舒适出行', price: (20 + Math.floor(endPoint.value.length * 3.5)).toFixed(0), time: 5 + endPoint.value.length },
  { type: '拼车', desc: '绿色出行更优惠', price: (8 + Math.floor(endPoint.value.length * 1.5)).toFixed(0), time: 12 + endPoint.value.length },
]);

function callRide() {
  if (!endPoint.value.trim()) return;
  store.reportAction({
    appId: 'taxi', appName: '打车', action: '呼叫打车',
    summary: `用户呼叫了${selectedOption.value}，从「${startPoint.value}」到「${endPoint.value}」`,
    data: { type: selectedOption.value, from: startPoint.value, to: endPoint.value },
  });
  tripStatus.value = '正在为您匹配司机...';
  tripDetail.value = `${startPoint.value} → ${endPoint.value}`;

  setTimeout(() => {
    tripStatus.value = '司机已接单，正在赶来';
    tripDetail.value = '预计3分钟到达';
  }, 3000);

  setTimeout(() => {
    tripStatus.value = '司机已到达上车点';
    tripDetail.value = '请尽快上车';
  }, 8000);

  toastr.success(`已呼叫${selectedOption.value}`, '打车');
}
</script>

<style scoped>
.taxi-page {
  height: 100%; display: flex; flex-direction: column;
  position: relative; overflow: hidden;
  background: var(--bg-secondary);
}

/* ─── 地图 ─── */
.taxi-map {
  flex: 1; position: relative;
  background: linear-gradient(180deg, #e8eef5 0%, #d0dae6 100%);
  min-height: 40%;
}
.map-svg { width: 100%; height: 100%; }

.taxi-top {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; z-index: 2;
}

.back-btn {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.9); color: #333;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1); flex-shrink: 0;
}

.taxi-tabs {
  flex: 1; display: flex; gap: 4px; justify-content: center;
  background: rgba(255,255,255,0.9); border-radius: 20px;
  padding: 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.taxi-tabs button {
  padding: 5px 14px; border: none; border-radius: 16px;
  background: transparent; color: #666; font-size: 13px;
  cursor: pointer; font-weight: 500;
}
.taxi-tabs button.active { background: #12b656; color: white; }

/* ─── 底部面板 ─── */
.taxi-panel {
  background: var(--bg-primary); border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  padding: 8px 16px 16px;
  position: relative; z-index: 2;
}

.panel-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: var(--border-primary, rgba(0,0,0,0.12));
  margin: 0 auto 12px;
}

/* ─── 起终点 ─── */
.route-inputs {
  display: flex; gap: 12px; margin-bottom: 12px;
}

.route-dots {
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 0; gap: 2px;
}

.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.start { background: #12b656; }
.dot.end { background: #ff6633; }
.dot-line { width: 1.5px; flex: 1; background: var(--border-primary, #ddd); min-height: 20px; }

.route-fields { flex: 1; display: flex; flex-direction: column; }

.route-input { padding: 10px 0; }
.route-divider { height: 0.5px; background: var(--border-secondary); }

.input-field {
  width: 100%; border: none; background: transparent;
  color: var(--text-primary); font-size: 15px; outline: none;
}
.input-field::placeholder { color: var(--text-tertiary); }

/* ─── 快捷地点 ─── */
.quick-places {
  display: flex; gap: 8px; margin-bottom: 12px;
}

.place-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border: 1px solid var(--border-secondary);
  border-radius: 16px; background: transparent;
  color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.place-chip:hover { background: var(--bg-secondary); }

/* ─── 预估价格 ─── */
.price-cards { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }

.price-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-radius: 10px;
  border: 1.5px solid var(--border-secondary);
  cursor: pointer; transition: all 0.15s;
}
.price-card.selected { border-color: #12b656; background: rgba(18,182,86,0.05); }

.price-left { display: flex; flex-direction: column; }
.option-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.option-desc { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.price-right { display: flex; flex-direction: column; align-items: flex-end; }
.option-price { font-size: 18px; font-weight: 700; color: #12b656; }
.option-time { font-size: 11px; color: var(--text-tertiary); }

/* ─── 呼叫按钮 ─── */
.call-ride-btn {
  width: 100%; padding: 14px; border: none; border-radius: 24px;
  background: #12b656; color: white;
  font-size: 16px; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.call-ride-btn:disabled { background: var(--bg-tertiary); color: var(--text-tertiary); }
.call-ride-btn:active:not(:disabled) { transform: scale(0.98); }

/* ─── 行程状态 ─── */
.trip-status {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; margin-top: 12px;
  background: #12b656; border-radius: 12px; color: white;
}

.trip-icon {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
}

.trip-info { flex: 1; }
.trip-title { font-size: 15px; font-weight: 600; display: block; }
.trip-detail { font-size: 12px; opacity: 0.8; display: block; margin-top: 2px; }
</style>
