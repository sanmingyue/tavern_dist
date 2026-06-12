<template>
  <div class="weather-page" :style="{ background: weatherGradient }">
    <!-- 顶部 -->
    <div class="weather-header">
      <button class="back-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="location">{{ location }}</span>
      <button class="more-btn" :disabled="isGenerating" @click="generateWeather">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
    </div>

    <!-- 当前天气 -->
    <div class="current-weather">
      <div class="temp-display">{{ currentTemp }}°</div>
      <div class="condition">{{ currentCondition }}</div>
      <div class="temp-range">最高 {{ tempHigh }}° / 最低 {{ tempLow }}°</div>
    </div>

    <!-- 天气图标（SVG动画） -->
    <div class="weather-icon-large">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <!-- 太阳 -->
        <circle cx="40" cy="35" r="14" fill="#FFD93D" opacity="0.9"/>
        <g stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round" opacity="0.7">
          <line x1="40" y1="12" x2="40" y2="17"><animate attributeName="y1" values="12;10;12" dur="3s" repeatCount="indefinite"/></line>
          <line x1="40" y1="53" x2="40" y2="58"/>
          <line x1="17" y1="35" x2="22" y2="35"/>
          <line x1="58" y1="35" x2="63" y2="35"/>
          <line x1="23.8" y1="18.8" x2="27.3" y2="22.3"/>
          <line x1="52.7" y1="47.7" x2="56.2" y2="51.2"/>
          <line x1="23.8" y1="51.2" x2="27.3" y2="47.7"/>
          <line x1="52.7" y1="22.3" x2="56.2" y2="18.8"/>
        </g>
        <!-- 云 -->
        <g opacity="0.85">
          <ellipse cx="48" cy="50" rx="18" ry="10" fill="white"/>
          <ellipse cx="38" cy="46" rx="12" ry="10" fill="white"/>
          <ellipse cx="55" cy="48" rx="10" ry="8" fill="white"/>
        </g>
      </svg>
    </div>

    <!-- 逐时预报 -->
    <div class="hourly-section">
      <div class="hourly-scroll">
        <div v-for="h in hourlyForecast" :key="h.time" class="hourly-item">
          <span class="hourly-time">{{ h.time }}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" opacity="0.8">
            <circle v-if="h.icon === 'sun'" cx="12" cy="12" r="5"/><line v-if="h.icon === 'sun'" x1="12" y1="1" x2="12" y2="3"/>
            <path v-if="h.icon === 'cloud'" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            <path v-if="h.icon === 'rain'" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line v-if="h.icon === 'rain'" x1="8" y1="22" x2="8" y2="24"/>
            <path v-if="h.icon === 'moon'" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span class="hourly-temp">{{ h.temp }}°</span>
        </div>
      </div>
    </div>

    <!-- 7天预报 -->
    <div class="forecast-section">
      <div class="section-title">7天预报</div>
      <div v-for="day in weekForecast" :key="day.day" class="forecast-row">
        <span class="forecast-day">{{ day.day }}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" opacity="0.7">
          <circle v-if="day.icon === 'sun'" cx="12" cy="12" r="5"/>
          <path v-if="day.icon === 'cloud'" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
          <path v-if="day.icon === 'rain'" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
        </svg>
        <div class="temp-bar-container">
          <div class="temp-bar" :style="{ left: getTempBarLeft(day.low) + '%', width: getTempBarWidth(day.low, day.high) + '%' }"></div>
        </div>
        <span class="forecast-temp">{{ day.low }}° {{ day.high }}°</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateWeather" />

    <!-- 气象详情网格 -->
    <div class="detail-grid">
      <div class="detail-card">
        <span class="detail-label">体感温度</span>
        <span class="detail-value">{{ feelsLike }}°</span>
      </div>
      <div class="detail-card">
        <span class="detail-label">湿度</span>
        <span class="detail-value">{{ humidity }}%</span>
      </div>
      <div class="detail-card">
        <span class="detail-label">风速</span>
        <span class="detail-value">{{ windSpeed }} km/h</span>
      </div>
      <div class="detail-card">
        <span class="detail-label">紫外线</span>
        <span class="detail-value">{{ uvIndex }}</span>
      </div>
      <div class="detail-card">
        <span class="detail-label">能见度</span>
        <span class="detail-value">{{ visibility }} km</span>
      </div>
      <div class="detail-card">
        <span class="detail-label">气压</span>
        <span class="detail-value">{{ pressure }} hPa</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult, extractXmlTag, extractXmlNumber } from '../../utils/generation-pipeline';
import ErrorBlock from '../../components/ErrorBlock.vue';
const store = usePhoneStore();

const lastError = ref('');
const location = ref('加载中...');
const currentTemp = ref(0);
const currentCondition = ref('--');
const tempHigh = ref(0);
const tempLow = ref(0);
const feelsLike = ref(0);
const humidity = ref(0);
const windSpeed = ref(0);
const uvIndex = ref('--');
const visibility = ref(0);
const pressure = ref(0);
const isGenerating = ref(false);
const hasLoaded = ref(false);

const weatherGradient = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)';
  if (hour >= 12 && hour < 18) return 'linear-gradient(180deg, #0575e6 0%, #021b79 100%)';
  if (hour >= 18 && hour < 21) return 'linear-gradient(180deg, #fa709a 0%, #fee140 100%)';
  return 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
});

const hourlyForecast = ref([
  { time: '现在', temp: 22, icon: 'sun' },
  { time: '14时', temp: 24, icon: 'sun' },
  { time: '15时', temp: 25, icon: 'cloud' },
  { time: '16时', temp: 24, icon: 'cloud' },
  { time: '17时', temp: 23, icon: 'cloud' },
  { time: '18时', temp: 21, icon: 'rain' },
  { time: '19时', temp: 20, icon: 'rain' },
  { time: '20时', temp: 19, icon: 'moon' },
  { time: '21时', temp: 18, icon: 'moon' },
]);

const weekForecast = ref([
  { day: '今天', icon: 'sun', low: 16, high: 26 },
  { day: '明天', icon: 'cloud', low: 15, high: 24 },
  { day: '周三', icon: 'rain', low: 14, high: 21 },
  { day: '周四', icon: 'rain', low: 13, high: 20 },
  { day: '周五', icon: 'cloud', low: 15, high: 23 },
  { day: '周六', icon: 'sun', low: 17, high: 27 },
  { day: '周日', icon: 'sun', low: 18, high: 28 },
]);

function toNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function conditionToIcon(condition: string): 'sun' | 'cloud' | 'rain' | 'moon' {
  if (/雨|雪|雷|阵雨/.test(condition)) return 'rain';
  if (/阴|云|雾|霾/.test(condition)) return 'cloud';
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6 ? 'moon' : 'sun';
}

function rebuildHourlyForecast(condition: string, temp: number) {
  const icon = conditionToIcon(condition);
  const labels = ['现在', '1小时', '2小时', '3小时', '4小时', '5小时', '6小时'];
  const deltas = [0, 1, 2, 1, 0, -1, -2];
  hourlyForecast.value = labels.map((time, index) => ({
    time,
    temp: temp + deltas[index],
    icon: index > 4 && icon === 'sun' ? 'moon' : icon,
  }));
}

async function generateWeather() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    const result = await generateForApp(
      'weather',
      '根据角色卡中的世界观和当前剧情地点，生成当前天气和 7 天预报。请在 location 标签中填写角色当前所在的地点名称。',
      '天气可以贴合剧情氛围，但数值要合理，forecast 中至少 5 个 day。注意：location 必须是角色卡/世界书中设定的地点，不要使用现实中的"北京"等城市。',
    );

    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    lastError.value = '';

    const text = result.parsed;
    // 解析 <weather> 块
    const weatherBlocks = parseXmlResult(text, 'weather', { forecast: 'day' });
    if (weatherBlocks.length === 0) {
      console.warn('[小手机] 天气生成结果无法识别:', text.slice(0, 200));
      toastr.error('生成结果无法识别', '天气');
      return;
    }

    const w = weatherBlocks[0];
    // 解析 location
    location.value = String(w.location ?? extractXmlTag(text, 'location') ?? location.value);

    // 解析 <current> 块
    const currentBlock = extractXmlTag(text, 'current') ?? '';
    currentTemp.value = extractXmlNumber(currentBlock, 'temp', currentTemp.value);
    currentCondition.value = extractXmlTag(currentBlock, 'condition') ?? currentCondition.value;
    humidity.value = extractXmlNumber(currentBlock, 'humidity', humidity.value);
    windSpeed.value = extractXmlNumber(currentBlock, 'wind', windSpeed.value);
    feelsLike.value = extractXmlNumber(currentBlock, 'feelsLike', currentTemp.value);

    // 逐时预报
    rebuildHourlyForecast(currentCondition.value, currentTemp.value);

    // 解析 <forecast> 中的 <day> 列表
    const forecastBlock = extractXmlTag(text, 'forecast') ?? '';
    const days = parseXmlResult(forecastBlock, 'day');
    if (days.length > 0) {
      weekForecast.value = days.slice(0, 7).map((day, index) => ({
        day: String(day.date ?? (index === 0 ? '今天' : `第${index + 1}天`)),
        icon: conditionToIcon(String(day.condition ?? currentCondition.value)),
        low: toNumber(day.tempLow, tempLow.value),
        high: toNumber(day.tempHigh, tempHigh.value),
      }));
      const today = weekForecast.value[0];
      if (today) {
        tempHigh.value = today.high;
        tempLow.value = today.low;
      }
    }

    // 计算高低温（如果 forecast 没有提供）
    if (days.length === 0) {
      tempHigh.value = currentTemp.value + 4;
      tempLow.value = currentTemp.value - 6;
    }

    hasLoaded.value = true;
    store.reportAction({
      appId: 'weather',
      action: `查看天气：${location.value} ${currentTemp.value}°${currentCondition.value}`,
      summary: `查看了${location.value}的天气：${currentTemp.value}°${currentCondition.value}`,
    });
  } finally {
    isGenerating.value = false;
  }
}

// 首次进入时自动生成天气
onMounted(() => {
  if (!hasLoaded.value) {
    generateWeather();
  }
});

function getTempBarLeft(low: number): number {
  const minTemp = 10;
  const maxTemp = 35;
  return ((low - minTemp) / (maxTemp - minTemp)) * 100;
}

function getTempBarWidth(low: number, high: number): number {
  const minTemp = 10;
  const maxTemp = 35;
  return ((high - low) / (maxTemp - minTemp)) * 100;
}
</script>

<style scoped>
.weather-page {
  height: 100%; display: flex; flex-direction: column;
  overflow-y: auto; color: white;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.weather-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
}

.back-btn, .more-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.15); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.more-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.location { font-size: 16px; font-weight: 500; }

/* 当前天气 */
.current-weather { text-align: center; padding: 8px 0; }
.temp-display { font-size: 64px; font-weight: 200; line-height: 1; }
.condition { font-size: 16px; opacity: 0.85; margin-top: 4px; }
.temp-range { font-size: 13px; opacity: 0.7; margin-top: 4px; }

.weather-icon-large { display: flex; justify-content: center; padding: 8px 0 16px; }

/* 逐时预报 */
.hourly-section {
  padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.15);
  border-bottom: 1px solid rgba(255,255,255,0.15);
  margin: 0 16px;
}

.hourly-scroll {
  display: flex; gap: 16px; overflow-x: auto;
  scrollbar-width: none; padding: 0 4px;
}

.hourly-scroll::-webkit-scrollbar { display: none; }

.hourly-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  min-width: 44px; flex-shrink: 0;
}

.hourly-time { font-size: 12px; opacity: 0.7; }
.hourly-temp { font-size: 15px; font-weight: 500; }

/* 7天预报 */
.forecast-section { padding: 16px; }

.section-title {
  font-size: 13px; opacity: 0.6; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 12px;
}

.forecast-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0;
}

.forecast-day { width: 40px; font-size: 14px; }

.temp-bar-container {
  flex: 1; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,0.15); position: relative;
}

.temp-bar {
  position: absolute; height: 100%; border-radius: 2px;
  background: linear-gradient(90deg, #4facfe, #FFD93D, #fa709a);
}

.forecast-temp { font-size: 13px; opacity: 0.8; min-width: 60px; text-align: right; }

/* 气象详情 */
.detail-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 8px; padding: 0 16px 24px;
}

.detail-card {
  padding: 14px; border-radius: 12px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; gap: 4px;
}

.detail-label { font-size: 11px; opacity: 0.6; text-transform: uppercase; }
.detail-value { font-size: 22px; font-weight: 500; }
</style>
