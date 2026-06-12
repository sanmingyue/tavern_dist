<template>
  <div class="delivery-page">
    <!-- ═══ 餐厅详情 ═══ -->
    <template v-if="activeRestaurant">
      <header class="delivery-header">
        <button class="back-btn" @click="activeRestaurant = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">{{ activeRestaurant.name }}</span>
        <button class="cart-btn" @click="showCartPanel = true" v-if="cartTotal > 0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          </svg>
          <span class="cart-badge">{{ cartCount }}</span>
        </button>
      </header>

      <div class="restaurant-detail-scroll">
        <div class="rd-cover" :style="{ backgroundColor: activeRestaurant.coverColor }">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
          </svg>
          <div class="rd-info">
            <div class="rd-rating">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD93D" stroke="none"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/></svg>
              {{ activeRestaurant.rating }} · 月售{{ activeRestaurant.monthlySales }}
            </div>
            <div class="rd-meta">{{ activeRestaurant.deliveryTime }} · {{ activeRestaurant.distance }}</div>
          </div>
        </div>

        <div class="menu-section">
          <div class="menu-title">菜单</div>
          <div v-for="item in activeRestaurant.items" :key="item.name" class="menu-item">
            <div class="menu-item-thumb" :style="{ backgroundColor: item.color }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div class="menu-item-info">
              <span class="menu-item-name">{{ item.name }}</span>
              <span class="menu-item-desc" v-if="item.description">{{ item.description }}</span>
              <span class="menu-item-price">¥{{ item.price }}</span>
            </div>
            <div class="qty-control">
              <button v-if="getCartQty(item) > 0" @click="removeFromCart(item)">−</button>
              <span v-if="getCartQty(item) > 0">{{ getCartQty(item) }}</span>
              <button @click="addToCart(item)">+</button>
            </div>
          </div>
        </div>

        <div class="restaurant-reviews">
          <div class="review-headline">
            <span>商家评价</span>
            <div class="review-actions">
              <button @click="submitRestaurantReview(5)">好评</button>
              <button @click="submitRestaurantReview(3)">一般</button>
            </div>
          </div>
          <div v-for="review in restaurantReviews" :key="review.id" class="merchant-review">
            <span class="review-score">{{ review.score }}.0</span>
            <span>{{ review.content }}</span>
          </div>
        </div>

        <div v-if="cartTotal > 0 && usableCoupons.length > 0" class="coupon-strip">
          <span>优惠券</span>
          <button
            v-for="coupon in usableCoupons"
            :key="coupon.id"
            :class="{ active: selectedCouponId === coupon.id }"
            @click="selectedCouponId = selectedCouponId === coupon.id ? '' : coupon.id"
          >
            {{ coupon.name }} -{{ coupon.amount }}
          </button>
        </div>
      </div>

      <!-- 底部购物栏 -->
      <div v-if="cartTotal > 0" class="cart-bar">
        <div class="cart-bar-info">
          <span class="cart-bar-total">¥{{ cartTotal }}</span>
          <span class="cart-bar-hint">另需配送费¥{{ activeRestaurant.deliveryFee }}</span>
        </div>
        <button class="order-btn" @click="placeOrder">去下单</button>
      </div>
    </template>

    <!-- ═══ 订单状态 ═══ -->
    <template v-else-if="activeOrder">
      <header class="delivery-header">
        <button class="back-btn" @click="activeOrder = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">订单详情</span>
        <div style="width:32px"></div>
      </header>

      <div class="order-detail">
        <div class="order-status-card">
          <div class="order-status-icon">
            <svg v-if="activeOrder.status === 'preparing'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <svg v-else-if="activeOrder.status === 'delivering'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/></svg>
            <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3>{{ orderStatusText }}</h3>
          <p>{{ activeOrder.restaurant }}</p>
        </div>

        <div class="order-timeline">
          <div v-for="step in orderSteps" :key="step.text" class="timeline-step" :class="{ active: step.done }">
            <div class="timeline-dot"></div>
            <span>{{ step.text }}</span>
            <span class="timeline-time" v-if="step.time">{{ step.time }}</span>
          </div>
        </div>

        <div class="courier-card">
          <div class="courier-head">
            <span>{{ activeOrder.rider }}</span>
            <span>{{ activeOrder.status === 'delivered' ? '已送达' : '配送中' }}</span>
          </div>
          <div class="rider-track">
            <span class="track-line"></span>
            <span class="rider-dot" :style="{ left: `${activeOrder.riderProgress}%` }"></span>
          </div>
          <div class="track-labels">
            <span>商家</span>
            <span>你的位置</span>
          </div>
        </div>

        <div class="order-items">
          <div v-for="item in activeOrder.items" :key="item.name" class="order-item-row">
            <span>{{ item.name }} x{{ item.qty }}</span>
            <span>¥{{ item.price * item.qty }}</span>
          </div>
          <div v-if="activeOrder.couponName" class="order-item-row coupon-row">
            <span>{{ activeOrder.couponName }}</span>
            <span>-¥{{ activeOrder.discount }}</span>
          </div>
          <div class="order-total-row">
            <span>合计</span>
            <span>¥{{ activeOrder.total }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ 主页 ═══ -->
    <template v-else>
      <div class="delivery-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="location-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span class="location-text">我的位置</span>
        </div>
        <button class="search-btn" :disabled="isGenerating" @click="generateRestaurants">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>

      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchQuery" type="text" placeholder="搜索美食、餐厅" class="search-input" />
      </div>

      <!-- 分类 -->
      <div class="category-grid">
        <div v-for="cat in categories" :key="cat.name" class="category-item">
          <div class="category-icon" :style="{ backgroundColor: cat.color }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" v-html="cat.icon"></svg>
          </div>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>

      <!-- 优惠 -->
      <div class="promo-banner">
        <div class="promo-card" style="background: linear-gradient(135deg, #ff6b35, #f7931e);">
          <div class="promo-info">
            <span class="promo-tag">限时优惠</span>
            <span class="promo-title">新用户首单立减¥15</span>
          </div>
          <button class="promo-btn" @click="claimCoupon">领取</button>
        </div>
      </div>

      <!-- 订单历史 -->
      <div v-if="orders.length > 0" class="order-history">
        <div class="order-history-title">订单历史</div>
        <button v-for="order in orderHistory" :key="order.id" class="history-order" @click="activeOrder = order">
          <span>{{ order.restaurant }}</span>
          <small>{{ formatTime(order.createTime) }} · ¥{{ order.total }}</small>
        </button>
      </div>

      <div class="section-title">附近推荐</div>

      <SkeletonLoader v-if="isGenerating" type="card" :rows="2" text="AI 正在生成推荐..." />

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generateRestaurants" />

      <div v-else-if="restaurants.length === 0" class="empty-restaurants">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
        </svg>
        <p>暂无餐厅推荐</p>
        <span>点击右上角搜索按钮，AI 将为你生成附近美食</span>
      </div>

      <div v-else class="restaurant-list">
        <div v-for="r in restaurants" :key="r.name" class="restaurant-card" @click="openRestaurant(r)">
          <div class="restaurant-cover" :style="{ backgroundColor: r.coverColor }">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
            </svg>
            <div class="cover-badges">
              <span v-if="r.isNew" class="badge new">新店</span>
              <span v-if="r.discount" class="badge discount">{{ r.discount }}</span>
            </div>
          </div>
          <div class="restaurant-info">
            <div class="restaurant-name-row">
              <span class="restaurant-name">{{ r.name }}</span>
              <div class="rating">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD93D" stroke="none"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/></svg>
                <span>{{ r.rating }}</span>
              </div>
            </div>
            <div class="restaurant-meta">
              <span>月售{{ r.monthlySales }}</span><span class="dot">·</span>
              <span>{{ r.deliveryTime }}</span><span class="dot">·</span>
              <span>{{ r.distance }}</span>
            </div>
            <div class="restaurant-tags">
              <span class="min-order">¥{{ r.minOrder }}起送</span>
              <span class="delivery-fee">配送¥{{ r.deliveryFee }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ 购物车弹窗（内联，不使用 Teleport） ═══ -->
      <div v-if="showCartPanel" class="modal-overlay" @click.self="showCartPanel = false">
        <div class="cart-panel">
          <div class="cart-panel-header">
            <h3>购物车</h3>
            <button class="clear-cart" @click="cart = {}; showCartPanel = false">清空</button>
          </div>
          <div class="cart-items">
            <div v-for="(qty, name) in cart" :key="name" class="cart-row">
              <span class="cart-item-name">{{ name }}</span>
              <div class="qty-control">
                <button @click="removeCartByName(String(name))">−</button>
                <span>{{ qty }}</span>
                <button @click="addCartByName(String(name))">+</button>
              </div>
              <span class="cart-item-price">¥{{ getItemPrice(String(name)) * Number(qty) }}</span>
            </div>
          </div>
          <div class="cart-panel-footer">
            <span>合计 ¥{{ payableTotal }}</span>
            <button class="order-btn" @click="showCartPanel = false; placeOrder()">下单</button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult, extractXmlNumber } from '../../utils/generation-pipeline';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';

const store = usePhoneStore();

const searchQuery = ref('');
const isGenerating = ref(false);
const lastError = ref('');
const showCartPanel = ref(false);

interface FoodItem { name: string; price: number; color: string; description?: string; }
interface Restaurant {
  name: string; rating: number; monthlySales: string; deliveryTime: string; distance: string;
  minOrder: number; deliveryFee: number; isNew: boolean; discount: string | null; coverColor: string;
  items: FoodItem[];
}
interface Order {
  id: string; restaurant: string; items: { name: string; price: number; qty: number }[];
  total: number; status: 'preparing' | 'delivering' | 'delivered'; createTime: number;
  discount: number; couponName?: string; rider: string; riderProgress: number; reviewed?: boolean;
}
interface Coupon { id: string; name: string; amount: number; used: boolean; min: number; }
interface MerchantReview { id: string; restaurant: string; score: number; content: string; }

const coverColors = ['#e74c3c', '#27ae60', '#8e44ad', '#f39c12', '#2980b9'];
const foodColors = ['#c0392b', '#e67e22', '#2ecc71', '#16a085', '#9b59b6'];

const categories = [
  { name: '美食', color: '#ff6b35', icon: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>' },
  { name: '甜品', color: '#e91e63', icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>' },
  { name: '快餐', color: '#ff9800', icon: '<rect x="2" y="7" width="20" height="10" rx="3"/>' },
  { name: '饮品', color: '#00bcd4', icon: '<path d="M8 2h8l-1 18H9L8 2z"/><path d="M6 6h12"/>' },
  { name: '火锅', color: '#f44336', icon: '<circle cx="12" cy="14" r="8"/>' },
  { name: '烧烤', color: '#795548', icon: '<line x1="12" y1="2" x2="12" y2="22"/><circle cx="12" cy="8" r="3"/>' },
  { name: '日料', color: '#607d8b', icon: '<ellipse cx="12" cy="12" rx="10" ry="6"/>' },
  { name: '更多', color: '#9e9e9e', icon: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>' },
];

const restaurants = ref<Restaurant[]>([]);
const hasLoaded = ref(false);

const activeRestaurant = ref<Restaurant | null>(null);
const activeOrder = ref<Order | null>(null);
const orders = ref<Order[]>([]);
const cart = ref<Record<string, number>>({});
const selectedCouponId = ref('');
const coupons = ref<Coupon[]>([
  { id: 'new-user', name: '新客券', amount: 15, min: 25, used: false },
  { id: 'late-night', name: '夜宵券', amount: 8, min: 30, used: false },
]);
const merchantReviews = ref<MerchantReview[]>([
  { id: 'mr_1', restaurant: '默认餐厅', score: 5, content: '包装完整，送餐很快。' },
]);

const cartCount = computed(() => Object.values(cart.value).reduce((s, n) => s + n, 0));
const cartTotal = computed(() => {
  if (!activeRestaurant.value) return 0;
  let total = 0;
  for (const [name, qty] of Object.entries(cart.value)) {
    const item = activeRestaurant.value.items.find(i => i.name === name);
    if (item) total += item.price * qty;
  }
  return total;
});
const usableCoupons = computed(() => coupons.value.filter(c => !c.used && cartTotal.value >= c.min));
const selectedCoupon = computed(() => usableCoupons.value.find(c => c.id === selectedCouponId.value) || null);
const payableTotal = computed(() => {
  const deliveryFee = activeRestaurant.value?.deliveryFee || 0;
  return Math.max(0, cartTotal.value - (selectedCoupon.value?.amount || 0)) + deliveryFee;
});
const orderHistory = computed(() => orders.value.slice().sort((a, b) => b.createTime - a.createTime));
const restaurantReviews = computed(() => {
  const name = activeRestaurant.value?.name;
  const list = merchantReviews.value.filter(r => r.restaurant === name);
  return list.length > 0 ? list : [
    { id: 'seed_fast', restaurant: name || '', score: 5, content: '出餐稳定，味道在线。' },
    { id: 'seed_pack', restaurant: name || '', score: 4, content: '包装不错，适合剧情里的临时加餐。' },
  ];
});

const orderStatusText = computed(() => {
  if (!activeOrder.value) return '';
  const map = { preparing: '商家正在制作', delivering: '骑手正在配送', delivered: '已送达' };
  return map[activeOrder.value.status] || '处理中';
});

const orderSteps = computed(() => {
  if (!activeOrder.value) return [];
  const s = activeOrder.value.status;
  return [
    { text: '下单成功', done: true, time: formatTime(activeOrder.value.createTime) },
    { text: '商家接单', done: true, time: formatTime(activeOrder.value.createTime + 60000) },
    { text: '制作中', done: s !== 'preparing' || true, time: s === 'preparing' ? '进行中...' : formatTime(activeOrder.value.createTime + 600000) },
    { text: '骑手配送', done: s === 'delivering' || s === 'delivered', time: s === 'delivering' ? '进行中...' : (s === 'delivered' ? formatTime(activeOrder.value.createTime + 1200000) : '') },
    { text: '已送达', done: s === 'delivered', time: s === 'delivered' ? formatTime(activeOrder.value.createTime + 1800000) : '' },
  ];
});

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getCartQty(item: FoodItem): number { return cart.value[item.name] || 0; }
function getItemPrice(name: string): number {
  return activeRestaurant.value?.items.find(i => i.name === name)?.price ?? 0;
}

function addToCart(item: FoodItem) {
  cart.value[item.name] = (cart.value[item.name] || 0) + 1;
  store.reportAction({
    appId: 'delivery', appName: '外卖', action: '加购物车',
    summary: `在「${activeRestaurant.value?.name}」加购了「${item.name}」¥${item.price}`,
    data: { restaurant: activeRestaurant.value?.name, item: item.name, price: item.price },
  });
}
function removeFromCart(item: FoodItem) {
  if (cart.value[item.name] > 1) cart.value[item.name]--;
  else delete cart.value[item.name];
}
function addCartByName(name: string) { cart.value[name] = (cart.value[name] || 0) + 1; }
function removeCartByName(name: string) {
  if (cart.value[name] > 1) cart.value[name]--;
  else delete cart.value[name];
}

function openRestaurant(r: Restaurant) {
  activeRestaurant.value = r;
  cart.value = {};
  selectedCouponId.value = '';
  store.reportAction({
    appId: 'delivery', appName: '外卖', action: '查看餐厅',
    summary: `用户在外卖 APP 查看了「${r.name}」`,
    data: { restaurant: r.name, rating: r.rating },
  });
}

function placeOrder() {
  if (!activeRestaurant.value || cartTotal.value === 0) return;
  const orderItems = Object.entries(cart.value).map(([name, qty]) => ({
    name, qty, price: getItemPrice(name),
  }));
  const coupon = selectedCoupon.value;
  if (coupon) coupon.used = true;
  const order: Order = {
    id: `order_${Date.now()}`,
    restaurant: activeRestaurant.value.name,
    items: orderItems,
    total: payableTotal.value,
    status: 'preparing',
    createTime: Date.now(),
    discount: coupon?.amount || 0,
    couponName: coupon?.name,
    rider: ['小周骑手', '阿南骑手', '准时达骑手'][orders.value.length % 3],
    riderProgress: 8,
  };
  orders.value.unshift(order);
  store.reportAction({
    appId: 'delivery', appName: '外卖', action: '下单',
    summary: `用户在「${activeRestaurant.value.name}」下单：${orderItems.map(i => `${i.name}x${i.qty}`).join('、')}，合计¥${order.total}${coupon ? `，使用${coupon.name}` : ''}`,
    data: { restaurant: activeRestaurant.value.name, items: orderItems, total: order.total, coupon: coupon?.name },
  });
  toastr.success(`已下单，预计${activeRestaurant.value.deliveryTime}送达`, '外卖');
  cart.value = {};
  selectedCouponId.value = '';
  activeRestaurant.value = null;
  activeOrder.value = order;

  // 模拟配送状态变化
  setTimeout(() => {
    order.status = 'delivering';
    order.riderProgress = 48;
    store.reportAction({
      appId: 'delivery', appName: '外卖', action: '配送中',
      summary: `「${order.restaurant}」的订单已被骑手取餐，正在配送中`,
      data: { restaurant: order.restaurant, status: 'delivering' },
    });
  }, 8000);
  setTimeout(() => {
    order.status = 'delivered';
    order.riderProgress = 100;
    store.reportAction({
      appId: 'delivery', appName: '外卖', action: '已送达',
      summary: `「${order.restaurant}」的外卖已送达，合计¥${order.total}`,
      data: { restaurant: order.restaurant, total: order.total, status: 'delivered' },
    });
  }, 20000);
}

function claimCoupon() {
  const coupon = coupons.value.find(c => c.id === 'new-user');
  if (coupon) coupon.used = false;
  store.reportAction({
    appId: 'delivery', appName: '外卖', action: '领取优惠',
    summary: '用户在外卖 APP 领取了新用户优惠', data: {},
  });
  toastr.success('优惠已领取！', '外卖');
}

function submitRestaurantReview(score: number) {
  const restaurant = activeRestaurant.value?.name || activeOrder.value?.restaurant;
  if (!restaurant) return;
  merchantReviews.value.unshift({
    id: `mr_${Date.now()}`,
    restaurant,
    score,
    content: score >= 5 ? '这次体验很好，下次还会点。' : '味道还行，希望下次更快一点。',
  });
  if (activeOrder.value && activeOrder.value.restaurant === restaurant) activeOrder.value.reviewed = true;
  store.reportAction({
    appId: 'delivery',
    appName: '外卖',
    action: '评价商家',
    summary: `用户给「${restaurant}」打了 ${score} 星评价`,
    data: { restaurant, score },
  });
  toastr.success('评价已提交', '外卖');
}

function toNumber(v: unknown, fb: number): number {
  const n = Number(v); return Number.isFinite(n) ? n : fb;
}

async function generateRestaurants() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  const keyword = searchQuery.value.trim() || '附近推荐餐厅';
  store.reportAction({
    appId: 'delivery', appName: '外卖', action: '搜索餐厅',
    summary: `在外卖 APP 搜索「${keyword}」`,
    data: { keyword },
  });
  try {
    const result = await generateForApp('delivery', `生成 3 家外卖餐厅和每家 3-4 个菜品，偏好：${keyword}`);
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    const text = result.parsed;
    // XML 解析：提取 <restaurant> 块，子项 items -> item
    const rawRestaurants = parseXmlResult(text, 'restaurant', { items: 'item' });
    if (rawRestaurants.length === 0) {
      lastError.value = '生成结果格式不匹配';
      console.warn('[小手机] 外卖解析失败:', text.slice(0, 200));
      return;
    }
    lastError.value = '';
    restaurants.value = rawRestaurants.slice(0, 4).map((r, i) => ({
      name: String(r.name ?? '餐厅'),
      rating: Math.min(5, Math.max(0, toNumber(r.rating, 4.7))),
      monthlySales: String(r.monthlySales ?? `${900 + i * 500}+`),
      deliveryTime: String(r.deliveryTime ?? '30分钟'),
      distance: String(r.distance ?? `${(0.6 + i * 0.4).toFixed(1)}km`),
      minOrder: toNumber(r.minOrder, 15),
      deliveryFee: toNumber(r.deliveryFee, i + 1),
      isNew: i === 0,
      discount: r.discount ? String(r.discount) : null,
      coverColor: coverColors[i % coverColors.length],
      items: (Array.isArray(r.items) ? r.items : []).slice(0, 5).map((item: any, j: number) => ({
        name: String(item?.name ?? '菜品'),
        price: toNumber(item?.price, 18),
        description: item?.desc || item?.description ? String(item.desc || item.description) : undefined,
        color: foodColors[(i + j) % foodColors.length],
      })),
    }));
    toastr.success('已生成推荐', '外卖');
  } finally { isGenerating.value = false; }
}

// 首次进入自动生成
onMounted(() => {
  if (!hasLoaded.value && restaurants.value.length === 0) {
    hasLoaded.value = true;
    generateRestaurants();
  }
});
</script>

<style scoped>
.delivery-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow-y: auto;
}

.delivery-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn, .search-btn, .cart-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0;
}
.search-btn:disabled { opacity: 0.6; cursor: wait; }
.header-title { flex: 1; font-size: 15px; font-weight: 600; color: var(--text-primary); text-align: center; }
.cart-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--danger); color: white; font-size: 10px; font-weight: 700;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
}
.location-bar {
  flex: 1; display: flex; align-items: center; gap: 4px;
  font-size: 14px; font-weight: 500; color: var(--text-primary);
}
.location-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.search-bar {
  display: flex; align-items: center; gap: 8px;
  margin: 8px 14px; padding: 9px 14px;
  background: var(--bg-primary); border-radius: 20px; color: var(--text-tertiary);
}
.search-input { flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 14px; outline: none; }

/* Categories */
.category-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 4px; padding: 10px 16px; }
.category-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.category-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.category-name { font-size: 11px; color: var(--text-secondary); }

/* Promo */
.promo-banner { padding: 0 16px 8px; }
.promo-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-radius: 12px; color: white;
}
.promo-info { display: flex; flex-direction: column; gap: 2px; }
.promo-tag { font-size: 10px; opacity: 0.8; }
.promo-title { font-size: 15px; font-weight: 600; }
.promo-btn {
  padding: 6px 16px; border: none; border-radius: 14px;
  background: white; color: #ff6b35; font-size: 13px; font-weight: 600; cursor: pointer;
}

.orders-hint {
  display: flex; align-items: center; gap: 6px; margin: 0 16px 8px;
  padding: 8px 12px; background: var(--accent-bg); border-radius: 10px;
  font-size: 13px; color: var(--accent); cursor: pointer;
}
.order-history {
  margin: 0 16px 10px; padding: 10px;
  background: var(--bg-primary); border-radius: 12px;
}
.order-history-title {
  font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;
}
.history-order {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  border: none; background: var(--bg-secondary); border-radius: 8px;
  padding: 8px 10px; margin-top: 6px; color: var(--text-primary); cursor: pointer;
}
.history-order small { color: var(--text-tertiary); }

.section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); padding: 0 16px 8px; }

.empty-restaurants {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 20px; gap: 10px; color: var(--text-muted);
}
.empty-restaurants p { font-size: 15px; font-weight: 500; color: var(--text-secondary); margin: 0; }
.empty-restaurants span { font-size: 12px; color: var(--text-tertiary); text-align: center; }

/* Restaurant List */
.restaurant-list { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px; }
.restaurant-card { background: var(--bg-primary); border-radius: 12px; overflow: hidden; cursor: pointer; }
.restaurant-cover { height: 70px; display: flex; align-items: center; justify-content: center; position: relative; }
.cover-badges { position: absolute; top: 8px; left: 8px; display: flex; gap: 4px; }
.badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
.badge.new { background: #ff6b35; color: white; }
.badge.discount { background: #e74c3c; color: white; }
.restaurant-info { padding: 8px 12px; }
.restaurant-name-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.restaurant-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.rating { display: flex; align-items: center; gap: 2px; font-size: 13px; font-weight: 600; color: #FFD93D; }
.restaurant-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
.dot { opacity: 0.4; }
.restaurant-tags { display: flex; gap: 6px; }
.min-order, .delivery-fee { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--bg-tertiary); color: var(--text-tertiary); }

/* Restaurant Detail */
.restaurant-detail-scroll { flex: 1; overflow-y: auto; }
.rd-cover { height: 100px; display: flex; align-items: center; justify-content: center; position: relative; }
.rd-info { position: absolute; bottom: 8px; left: 12px; color: white; }
.rd-rating { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.rd-meta { font-size: 11px; opacity: 0.8; }

.menu-section { padding: 12px; }
.menu-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; }
.menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--border-secondary);
}
.menu-item-thumb {
  width: 48px; height: 48px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.menu-item-info { flex: 1; min-width: 0; }
.menu-item-name { font-size: 14px; color: var(--text-primary); display: block; }
.menu-item-desc { font-size: 12px; color: var(--text-muted); display: block; margin-top: 2px; }
.menu-item-price { font-size: 14px; font-weight: 600; color: #ff6b35; display: block; margin-top: 4px; }
.restaurant-reviews,
.coupon-strip {
  margin: 0 12px 12px; padding: 12px;
  background: var(--bg-primary); border-radius: 12px;
}
.review-headline {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;
}
.review-actions { display: flex; gap: 6px; }
.review-actions button,
.coupon-strip button {
  border: none; border-radius: 12px; padding: 5px 10px;
  background: var(--bg-tertiary); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.merchant-review {
  display: flex; gap: 8px; padding: 6px 0;
  font-size: 12px; color: var(--text-secondary);
}
.review-score { color: #ff6b35; font-weight: 700; }
.coupon-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 13px; color: var(--text-primary);
}
.coupon-strip button.active { background: #ff6b35; color: white; }

.qty-control { display: flex; align-items: center; gap: 6px; }
.qty-control button {
  width: 24px; height: 24px; border: 1px solid var(--border-primary);
  border-radius: 50%; background: transparent; color: var(--text-primary);
  font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.qty-control span { font-size: 14px; color: var(--text-primary); min-width: 16px; text-align: center; }

/* Cart Bar */
.cart-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: var(--bg-primary);
  border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.cart-bar-info { display: flex; flex-direction: column; }
.cart-bar-total { font-size: 18px; font-weight: 700; color: #ff6b35; }
.cart-bar-hint { font-size: 11px; color: var(--text-muted); }
.order-btn {
  padding: 10px 24px; border: none; border-radius: 20px;
  background: #ff6b35; color: white; font-size: 14px; font-weight: 600; cursor: pointer;
}

/* Order Detail */
.order-detail { flex: 1; overflow-y: auto; padding: 14px; }
.order-status-card {
  text-align: center; padding: 20px; background: var(--bg-primary);
  border-radius: 12px; margin-bottom: 12px;
}
.order-status-icon { margin-bottom: 8px; }
.order-status-card h3 { margin: 0 0 4px; font-size: 18px; color: var(--text-primary); }
.order-status-card p { margin: 0; font-size: 13px; color: var(--text-secondary); }

.order-timeline { padding: 12px; background: var(--bg-primary); border-radius: 12px; margin-bottom: 12px; }
.timeline-step {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  font-size: 13px; color: var(--text-muted);
}
.timeline-step.active { color: var(--text-primary); }
.timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
.timeline-step.active .timeline-dot { background: var(--accent); }
.timeline-time { margin-left: auto; font-size: 11px; color: var(--text-muted); }
.courier-card {
  padding: 12px; background: var(--bg-primary); border-radius: 12px; margin-bottom: 12px;
}
.courier-head,
.track-labels {
  display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);
}
.courier-head { font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.rider-track { position: relative; height: 24px; margin: 4px 4px 8px; }
.track-line {
  position: absolute; left: 0; right: 0; top: 11px; height: 3px;
  background: var(--border-secondary); border-radius: 999px;
}
.rider-dot {
  position: absolute; top: 3px; width: 18px; height: 18px; border-radius: 50%;
  background: #ff6b35; box-shadow: 0 0 0 4px rgba(255,107,53,0.16);
  transition: left 0.8s ease; transform: translateX(-50%);
}
.coupon-row { color: #27ae60; }

.order-items { background: var(--bg-primary); border-radius: 12px; padding: 12px; }
.order-item-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: var(--text-secondary); }
.order-total-row {
  display: flex; justify-content: space-between; padding-top: 8px;
  border-top: 1px solid var(--border-secondary); margin-top: 4px;
  font-size: 15px; font-weight: 600; color: var(--text-primary);
}

/* Cart Modal */
.modal-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center; z-index: 200;
}
.cart-panel {
  width: 100%; max-height: 60%; background: var(--bg-primary);
  border-radius: 16px 16px 0 0; overflow: hidden;
}
.cart-panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--border-secondary);
}
.cart-panel-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
.clear-cart { border: none; background: none; color: var(--text-tertiary); font-size: 13px; cursor: pointer; }
.cart-items { padding: 8px 16px; max-height: 200px; overflow-y: auto; }
.cart-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border-secondary); }
.cart-item-name { flex: 1; font-size: 14px; color: var(--text-primary); }
.cart-item-price { font-size: 14px; font-weight: 600; color: #ff6b35; min-width: 50px; text-align: right; }
.cart-panel-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-top: 1px solid var(--border-secondary);
  font-size: 16px; font-weight: 600; color: var(--text-primary);
}
</style>
