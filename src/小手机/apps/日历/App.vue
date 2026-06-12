<template>
  <div class="calendar-page">
    <!-- iOS 导航栏 -->
    <div class="cal-nav">
      <button class="nav-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="nav-title">{{ monthLabel }}</h1>
      <button class="nav-btn today-btn" @click="goToday">今天</button>
      <button class="nav-btn today-btn" @click="showAddEvent = !showAddEvent">＋</button>
    </div>

    <!-- 月份切换 -->
    <div class="month-switch">
      <button class="arrow-btn" @click="prevMonth">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="month-year">{{ year }}年{{ month + 1 }}月</span>
      <button class="arrow-btn" @click="nextMonth">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg>
      </button>
    </div>

    <!-- 星期标题 -->
    <div class="weekday-row">
      <span v-for="d in weekdays" :key="d" class="weekday">{{ d }}</span>
    </div>

    <!-- 日期网格 -->
    <div class="date-grid">
      <button
        v-for="(day, i) in calendarDays"
        :key="i"
        class="date-cell"
        :class="{
          today: day.isToday,
          selected: day.date === selectedDate,
          other: day.isOtherMonth,
          'has-event': day.hasEvent,
        }"
        @click="day.date && selectDate(day)"
      >
        <span class="date-num">{{ day.day }}</span>
        <span v-if="day.hasEvent" class="event-dot"></span>
      </button>
    </div>

    <!-- 事件列表 -->
    <div class="events-section">
      <div class="events-header">
        <span class="events-date">{{ selectedDateLabel }}</span>
      </div>
      <div v-if="showAddEvent" class="event-form">
        <input v-model="newEventTitle" placeholder="事件标题" />
        <input v-model="newEventTime" placeholder="时间，例如 14:00" />
        <button @click="addEvent">添加</button>
      </div>
      <div v-if="selectedEvents.length > 0" class="event-list">
        <div v-for="evt in selectedEvents" :key="evt.id" class="event-item">
          <div class="event-color-bar" :style="{ backgroundColor: evt.color }"></div>
          <div class="event-info">
            <span class="event-title">{{ evt.title }}</span>
            <span class="event-time">{{ evt.time }}</span>
          </div>
          <button class="delete-event" @click="deleteEvent(evt.id)">删除</button>
        </div>
      </div>
      <div v-else class="no-events">
        <span>没有事件</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { getLocalDB } from '../../utils/local-db';
const store = usePhoneStore();

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

const now = new Date();
const year = ref(now.getFullYear());
const month = ref(now.getMonth());
const selectedDate = ref('');
const showAddEvent = ref(false);
const newEventTitle = ref('');
const newEventTime = ref('');

interface CalendarDay {
  day: number;
  date: string;
  isToday: boolean;
  isOtherMonth: boolean;
  hasEvent: boolean;
}

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  time: string;
  color: string;
}

const events = ref<CalendarEvent[]>([
  { id: 'e1', date: formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()), title: '今日待办', time: '全天', color: '#007aff' },
  { id: 'e2', date: formatDateStr(now.getFullYear(), now.getMonth(), now.getDate() + 1), title: '约会', time: '14:00 - 16:00', color: '#ff3b30' },
  { id: 'e3', date: formatDateStr(now.getFullYear(), now.getMonth(), now.getDate() + 3), title: '会议', time: '10:00 - 11:30', color: '#34c759' },
]);

function formatDateStr(y: number, m: number, d: number): string {
  const dt = new Date(y, m, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const monthLabel = computed(() => {
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return monthNames[month.value];
});

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return '选择日期查看事件';
  const [y, m, d] = selectedDate.value.split('-').map(Number);
  return `${m}月${d}日`;
});

const selectedEvents = computed(() => {
  if (!selectedDate.value) return [];
  return events.value.filter(e => e.date === selectedDate.value);
});

const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(year.value, month.value, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate();
  const daysInPrevMonth = new Date(year.value, month.value, 0).getDate();

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const days: CalendarDay[] = [];

  // 上月尾部
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = formatDateStr(year.value, month.value - 1, d);
    days.push({ day: d, date: dateStr, isToday: false, isOtherMonth: true, hasEvent: events.value.some(e => e.date === dateStr) });
  }

  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year.value, month.value, d);
    days.push({ day: d, date: dateStr, isToday: dateStr === todayStr, isOtherMonth: false, hasEvent: events.value.some(e => e.date === dateStr) });
  }

  // 下月头部补齐到 42
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatDateStr(year.value, month.value + 1, d);
    days.push({ day: d, date: dateStr, isToday: false, isOtherMonth: true, hasEvent: events.value.some(e => e.date === dateStr) });
  }

  return days;
});

function selectDate(day: CalendarDay) {
  selectedDate.value = day.date;
}

function prevMonth() {
  if (month.value === 0) { year.value--; month.value = 11; }
  else month.value--;
}

function nextMonth() {
  if (month.value === 11) { year.value++; month.value = 0; }
  else month.value++;
}

function goToday() {
  const today = new Date();
  year.value = today.getFullYear();
  month.value = today.getMonth();
  selectedDate.value = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
}

function addEvent() {
  const title = newEventTitle.value.trim();
  if (!title || !selectedDate.value) return;
  const evt: CalendarEvent = {
    id: `evt_${Date.now()}`,
    date: selectedDate.value,
    title,
    time: newEventTime.value.trim() || '全天',
    color: ['#007aff', '#ff3b30', '#34c759', '#af52de'][events.value.length % 4],
  };
  events.value.unshift(evt);
  newEventTitle.value = '';
  newEventTime.value = '';
  showAddEvent.value = false;
  store.reportAction({
    appId: 'calendar', appName: '日历', action: '添加事件',
    summary: `用户在日历添加事件「${evt.title}」，时间：${evt.date} ${evt.time}`,
    data: evt,
  });
}

function deleteEvent(id: string) {
  const evt = events.value.find(e => e.id === id);
  events.value = events.value.filter(e => e.id !== id);
  if (evt) {
    store.reportAction({
      appId: 'calendar', appName: '日历', action: '删除事件',
      summary: `用户从日历删除事件「${evt.title}」`,
      data: evt,
    });
  }
}

async function loadCapturedCalendar() {
  try {
    const db = await getLocalDB();
    const captured = (await db.getEventsByApp('calendar')).filter(e => e.type === 'captured_content').slice(-10);
    for (const event of captured) {
      const raw = event.data?.captured;
      const generated = event.data?.generated;
      const title = typeof generated === 'object' && generated?.title ? String(generated.title) : String(raw?.content || event.summary).slice(0, 24);
      const time = raw?.attribute || (typeof generated === 'object' && generated?.time) || '剧情时间';
      if (!events.value.some(e => e.title === title && e.time === time)) {
        events.value.unshift({
          id: `cap_${event.id}`,
          date: formatDateStr(now.getFullYear(), now.getMonth(), now.getDate()),
          title,
          time: String(time),
          color: '#af52de',
        });
      }
    }
  } catch {
    // IndexedDB 不可用时忽略正文时间线联动。
  }
}

onMounted(() => {
  selectedDate.value = formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  loadCapturedCalendar();
});
</script>

<style scoped>
.calendar-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary);
}

/* ─── 导航栏 ─── */
.cal-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.nav-btn {
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent, #007aff); font-size: 14px; font-weight: 400;
  padding: 4px;
}

.today-btn { font-size: 15px; }

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary);
  margin: 0;
}

/* ─── 月份切换 ─── */
.month-switch {
  display: flex; align-items: center; justify-content: center;
  gap: 20px; padding: 8px 0;
}

.arrow-btn {
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: transparent; color: var(--accent, #007aff);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.month-year {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  min-width: 100px; text-align: center;
}

/* ─── 星期标题 ─── */
.weekday-row {
  display: grid; grid-template-columns: repeat(7, 1fr);
  padding: 4px 8px;
}

.weekday {
  text-align: center; font-size: 11px; font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

/* ─── 日期网格 ─── */
.date-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  padding: 0 8px; gap: 2px;
}

.date-cell {
  aspect-ratio: 1; border: none; background: transparent;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: pointer; border-radius: 50%;
  position: relative; font-size: 15px;
  color: var(--text-primary);
  transition: all 0.15s;
}

.date-cell.other { color: var(--text-tertiary); opacity: 0.4; }

.date-cell.today .date-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: #ff3b30; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600;
}

.date-cell.selected:not(.today) .date-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--accent, #007aff); color: white;
  display: flex; align-items: center; justify-content: center;
}

.date-num {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  font-variant-numeric: tabular-nums;
}

.event-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--accent, #007aff);
  position: absolute; bottom: 4px;
}

.date-cell.today .event-dot { background: white; }

/* ─── 事件列表 ─── */
.events-section {
  flex: 1; overflow-y: auto; padding: 12px 16px;
  border-top: 0.5px solid var(--border-secondary);
  margin-top: 4px;
}

.events-header { margin-bottom: 10px; }

.events-date {
  font-size: 17px; font-weight: 700; color: var(--text-primary);
}
.event-form {
  display: grid; grid-template-columns: 1fr 90px auto; gap: 6px; margin-bottom: 10px;
}
.event-form input {
  min-width: 0; border: none; border-radius: 9px; padding: 8px 9px;
  background: var(--bg-secondary); color: var(--text-primary); outline: none;
}
.event-form button,
.delete-event {
  border: none; border-radius: 9px; padding: 7px 9px;
  background: var(--accent, #007aff); color: white; font-size: 12px; cursor: pointer;
}

.event-list { display: flex; flex-direction: column; gap: 8px; }

.event-item {
  display: flex; align-items: stretch; gap: 10px;
  padding: 10px 12px; background: var(--bg-secondary);
  border-radius: 10px;
}

.event-color-bar {
  width: 4px; border-radius: 2px; flex-shrink: 0;
}

.event-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.event-title { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.event-time { font-size: 12px; color: var(--text-tertiary); }
.delete-event { background: var(--bg-tertiary); color: var(--text-tertiary); align-self: center; }

.no-events {
  text-align: center; padding: 20px;
  font-size: 14px; color: var(--text-tertiary);
}
</style>
