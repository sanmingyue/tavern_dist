<template>
  <div class="weather-page">
    <!-- 当前天气 -->
    <div class="current-weather">
      <div class="weather-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </div>
      <div class="temperature">{{ currentTemp }}°</div>
      <div class="weather-desc">{{ weatherDesc }}</div>
      <div class="location">{{ location }}</div>
    </div>

    <!-- 详细信息 -->
    <div class="weather-details">
      <div class="detail-item">
        <span class="detail-label">体感温度</span>
        <span class="detail-value">{{ feelsLike }}°</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">湿度</span>
        <span class="detail-value">{{ humidity }}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">风速</span>
        <span class="detail-value">{{ wind }} km/h</span>
      </div>
    </div>

    <!-- 天气预报 -->
    <div class="forecast">
      <h3 class="section-title">天气预报</h3>
      <div class="forecast-list">
        <div v-for="(day, index) in forecast" :key="index" class="forecast-item">
          <span class="forecast-day">{{ day.day }}</span>
          <svg class="forecast-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
          </svg>
          <span class="forecast-temp">{{ day.temp }}</span>
        </div>
      </div>
    </div>

    <!-- 底部预留 -->
    <div class="bottom-space"></div>
  </div>
</template>

<script setup lang="ts">
const location = ref('上海市');
const currentTemp = ref(24);
const feelsLike = ref(26);
const humidity = ref(65);
const wind = ref(12);
const weatherDesc = ref('晴');

const forecast = ref([
  { day: '今天', temp: '24°/16°' },
  { day: '明天', temp: '22°/15°' },
  { day: '后天', temp: '20°/14°' },
  { day: '周四', temp: '18°/12°' },
  { day: '周五', temp: '21°/13°' },
]);
</script>

<style scoped>
.weather-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a4a7a 0%, #0b0e14 60%);
  overflow-y: auto;
}

.current-weather {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 20px;
}

.weather-icon {
  color: #ffd700;
  margin-bottom: 8px;
}

.temperature {
  font-size: 72px;
  font-weight: 200;
  color: white;
  line-height: 1;
}

.weather-desc {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

.location {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.weather-details {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  margin: 0 16px;
  border-radius: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.detail-value {
  font-size: 18px;
  font-weight: 500;
  color: white;
}

.forecast {
  padding: 20px 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px 0;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forecast-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.forecast-day {
  flex: 1;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.forecast-icon {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 12px;
}

.forecast-temp {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.bottom-space {
  height: 100px;
}
</style>
