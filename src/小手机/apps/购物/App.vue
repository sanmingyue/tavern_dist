<template>
  <div class="shop-page">
    <!-- ═══ 订单物流详情 ═══ -->
    <template v-if="activeOrder">
      <header class="shop-header">
        <button class="back-btn" @click="activeOrder = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">订单详情</span>
        <div style="width:32px"></div>
      </header>

      <div class="order-detail-scroll">
        <div class="order-status-card">
          <strong>{{ activeOrder.refundStatus || activeOrder.status }}</strong>
          <span>订单号 {{ activeOrder.id.slice(-8) }}</span>
        </div>
        <div class="logistics-card">
          <div class="logistics-title">物流详情</div>
          <div v-for="step in activeOrder.logistics" :key="step.time + step.text" class="logistics-step" :class="{ done: step.done }">
            <span class="logistics-dot"></span>
            <div>
              <strong>{{ step.text }}</strong>
              <small>{{ step.time }}</small>
            </div>
          </div>
        </div>
        <div class="order-items-card">
          <div v-for="item in activeOrder.items" :key="item.name" class="order-item-line">
            <span>{{ item.name }} x{{ item.qty }}</span>
            <span>¥{{ item.price * item.qty }}</span>
          </div>
          <div class="order-item-line total">
            <span>实付</span>
            <span>¥{{ activeOrder.total }}</span>
          </div>
        </div>
        <button class="refund-btn" :disabled="activeOrder.refundStatus === '退款处理中'" @click="requestRefund(activeOrder)">
          {{ activeOrder.refundStatus || '申请退款/售后' }}
        </button>
      </div>
    </template>

    <!-- ═══ 商品详情 ═══ -->
    <template v-else-if="activeProduct">
      <header class="shop-header">
        <button class="back-btn" @click="activeProduct = null">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">商品详情</span>
        <button class="cart-btn" @click="activeProduct = null; showCart = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </button>
      </header>

      <div class="detail-scroll">
        <div class="product-cover" :style="{ backgroundColor: activeProduct.color }">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div class="product-info-card">
          <div class="price-row">
            <span class="price">¥{{ activeProduct.price }}</span>
            <span v-if="activeProduct.originalPrice" class="original-price">¥{{ activeProduct.originalPrice }}</span>
            <span class="sales">{{ activeProduct.sales }}</span>
          </div>
          <h3 class="product-title">{{ activeProduct.name }}</h3>
          <p class="product-desc">{{ activeProduct.description }}</p>
          <div class="rating-row">
            <span class="stars">
              <svg v-for="i in 5" :key="i" width="14" height="14" viewBox="0 0 24 24" :fill="i <= Math.round(activeProduct.rating) ? '#FFD93D' : 'none'" :stroke="i <= Math.round(activeProduct.rating) ? '#FFD93D' : 'var(--text-muted)'" stroke-width="2">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
              </svg>
            </span>
            <span class="rating-text">{{ activeProduct.rating }}分</span>
          </div>

          <!-- 评价区 -->
          <div class="reviews-section">
            <div class="section-head">
              <span>用户评价 ({{ activeProduct.reviews.length }})</span>
              <button class="gen-review-btn" :disabled="isGenerating" @click="generateReviews">AI 评价</button>
            </div>
            <SkeletonLoader v-if="isGenerating && activeProduct.reviews.length === 0" type="list" :rows="2" />
            <div v-for="review in activeProduct.reviews" :key="review.id" class="review-item">
              <div class="review-head">
                <AvatarBadge :name="review.author" size="sm" />
                <div>
                  <strong>{{ review.author }}</strong>
                  <div class="review-stars">
                    <svg v-for="i in 5" :key="i" width="10" height="10" viewBox="0 0 24 24" :fill="i <= review.stars ? '#FFD93D' : 'none'" :stroke="i <= review.stars ? '#FFD93D' : 'var(--text-muted)'" stroke-width="2">
                      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <p class="review-text">{{ review.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-actions">
        <button class="favorite-btn" :class="{ active: isFavorite(activeProduct) }" @click="toggleFavorite(activeProduct)">
          {{ isFavorite(activeProduct) ? '已收藏' : '收藏' }}
        </button>
        <button class="add-cart-btn" @click="addToCart(activeProduct)">加入购物车</button>
        <button class="buy-now-btn" @click="buyNow(activeProduct)">立即购买</button>
      </div>
    </template>

    <!-- ═══ 购物车 ═══ -->
    <template v-else-if="showCart">
      <header class="shop-header">
        <button class="back-btn" @click="showCart = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="header-title">购物车 ({{ cartCount }})</span>
        <button v-if="cart.length > 0" class="clear-text" @click="cart = []">清空</button>
      </header>

      <div class="cart-scroll" v-if="cart.length > 0">
        <div v-for="item in cart" :key="item.product.name" class="cart-item">
          <div class="cart-thumb" :style="{ backgroundColor: item.product.color }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            </svg>
          </div>
          <div class="cart-info">
            <span class="cart-name">{{ item.product.name }}</span>
            <span class="cart-price">¥{{ item.product.price }}</span>
          </div>
          <div class="qty-control">
            <button @click="item.qty > 1 ? item.qty-- : removeFromCart(item)">−</button>
            <span>{{ item.qty }}</span>
            <button @click="item.qty++">+</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
        <p>购物车是空的</p>
      </div>

      <div v-if="cart.length > 0" class="cart-footer">
        <div class="cart-total">
          <span>合计</span>
          <span class="total-price">¥{{ cartTotal }}</span>
        </div>
        <button class="checkout-btn" @click="checkout">结算 ({{ cartCount }}件)</button>
      </div>
    </template>

    <!-- ═══ 商品列表 ═══ -->
    <template v-else>
      <header class="shop-header">
        <button class="back-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" placeholder="搜索商品" class="search-input" @keyup.enter="searchProducts" />
        </div>
        <button class="cart-btn" @click="showCart = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </button>
        <button class="select-btn" :class="{ active: productDeleteMode }" @click="toggleProductDeleteMode">
          {{ productDeleteMode ? '取消' : '选择' }}
        </button>
      </header>

      <!-- 分类 -->
      <div class="category-tabs">
        <button v-for="cat in categories" :key="cat" :class="{ active: activeCategory === cat }" @click="activeCategory = cat">
          {{ cat }}
        </button>
      </div>

      <div v-if="searchHistory.length > 0" class="history-strip">
        <span>搜索历史</span>
        <button v-for="keyword in searchHistory" :key="keyword" @click="searchQuery = keyword; searchProducts()">{{ keyword }}</button>
      </div>

      <div v-if="favorites.length > 0" class="favorite-strip">
        <span>收藏夹</span>
        <button v-for="product in favorites" :key="product.name" @click="viewProduct(product)">{{ product.name }}</button>
      </div>

      <div v-if="shopOrders.length > 0" class="shop-order-strip">
        <span>我的订单</span>
        <button v-for="order in shopOrders" :key="order.id" @click="activeOrder = order">{{ order.items[0]?.name || '购物订单' }}</button>
      </div>

      <div v-if="productDeleteMode" class="selection-toolbar">
        <span>已选 {{ selectedProductNames.length }} 条</span>
        <button :disabled="selectedProductNames.length === 0" @click="deleteSelectedProducts">删除</button>
      </div>

      <!-- AI生成按钮 -->
      <div class="ai-gen-bar">
        <button class="ai-gen-btn" :disabled="isGenerating" @click="searchProducts">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {{ isGenerating ? 'AI 搜索中...' : 'AI 搜索商品' }}
        </button>
      </div>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="searchProducts" />

      <SkeletonLoader v-else-if="isGenerating && products.length === 0" type="card" :rows="3" text="AI 正在生成商品..." />

      <div class="product-grid">
        <div v-for="product in products" :key="product.name" class="product-card" :class="{ selecting: productDeleteMode, selected: isProductSelected(product) }" @click="productDeleteMode ? toggleProductSelection(product) : viewProduct(product)">
          <button v-if="productDeleteMode" class="select-check" :class="{ checked: isProductSelected(product) }" @click.stop="toggleProductSelection(product)">
            <svg v-if="isProductSelected(product)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <div class="product-thumb" :style="{ backgroundColor: product.color }">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            </svg>
          </div>
          <div class="product-meta">
            <span class="product-name">{{ product.name }}</span>
            <div class="product-price-row">
              <span class="product-price">¥{{ product.price }}</span>
              <span class="product-sales">{{ product.sales }}</span>
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

const searchQuery = ref('');
const isGenerating = ref(false);
const lastError = ref('');
const showCart = ref(false);
const activeCategory = ref('推荐');
const productDeleteMode = ref(false);
const selectedProductNames = ref<string[]>([]);
const categories = ['推荐', '数码', '服饰', '美妆', '食品', '家居'];

interface Review {
  id: string;
  author: string;
  content: string;
  stars: number;
}

interface Product {
  name: string;
  price: number;
  originalPrice: number;
  sales: string;
  rating: number;
  description: string;
  color: string;
  reviews: Review[];
}
interface ShopOrder {
  id: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  logistics: { time: string; text: string; done: boolean }[];
  refundStatus?: string;
}

interface ShopPersistedState {
  products?: Product[];
  searchHistory?: string[];
  favorites?: Product[];
  shopOrders?: ShopOrder[];
}

const SHOP_STATE_KEY = 'mini-phone-shop-state';

function readShopState(): ShopPersistedState {
  try {
    const raw = localStorage.getItem(SHOP_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    const state = parsed as ShopPersistedState;
    return {
      products: Array.isArray(state.products) ? state.products : undefined,
      searchHistory: Array.isArray(state.searchHistory) ? state.searchHistory.filter((item): item is string => typeof item === 'string') : undefined,
      favorites: Array.isArray(state.favorites) ? state.favorites : undefined,
      shopOrders: Array.isArray(state.shopOrders) ? state.shopOrders : undefined,
    };
  } catch {
    return {};
  }
}

function writeShopState() {
  try {
    localStorage.setItem(SHOP_STATE_KEY, JSON.stringify({
      products: products.value,
      searchHistory: searchHistory.value,
      favorites: favorites.value,
      shopOrders: shopOrders.value,
    }));
  } catch {
    // localStorage 不可用时仅保持当前会话状态。
  }
}

const productColors = ['#e74c3c', '#3498db', '#9b59b6', '#f39c12', '#1abc9c', '#e91e63', '#795548', '#607d8b'];

const products = ref<Product[]>([
  { name: '无线蓝牙耳机', price: 199, originalPrice: 299, sales: '月销2.3万', rating: 4.7, description: '主动降噪，续航30小时，IPX5防水', color: '#3498db', reviews: [
    { id: 'r1', author: '数码达人', content: '降噪效果超赞，性价比很高', stars: 5 },
  ]},
  { name: '轻薄羽绒服', price: 399, originalPrice: 699, sales: '月销8500', rating: 4.5, description: '90%鹅绒，轻薄保暖，可收纳', color: '#9b59b6', reviews: [
    { id: 'r2', author: '时尚买手', content: '版型好看，穿着舒适', stars: 4 },
  ]},
  { name: '手冲咖啡壶套装', price: 89, originalPrice: 129, sales: '月销1.2万', rating: 4.8, description: '含滤杯+手冲壶+温度计', color: '#795548', reviews: [] },
  { name: '机械键盘', price: 329, originalPrice: 459, sales: '月销6700', rating: 4.6, description: '红轴，热插拔，RGB背光', color: '#e74c3c', reviews: [] },
]);

const hasAutoGenerated = ref(false);
const activeProduct = ref<Product | null>(null);
const activeOrder = ref<ShopOrder | null>(null);
const searchHistory = ref<string[]>([]);
const favorites = ref<Product[]>([]);
const shopOrders = ref<ShopOrder[]>([]);

const persistedShopState = readShopState();
if (persistedShopState.products?.length) {
  products.value = persistedShopState.products;
  hasAutoGenerated.value = true;
}
if (persistedShopState.searchHistory?.length) {
  searchHistory.value = persistedShopState.searchHistory;
}
if (persistedShopState.favorites?.length) {
  favorites.value = persistedShopState.favorites;
}
if (persistedShopState.shopOrders?.length) {
  shopOrders.value = persistedShopState.shopOrders;
}

watch([products, searchHistory, favorites, shopOrders], writeShopState, { deep: true });

function isProductSelected(product: Product): boolean {
  return selectedProductNames.value.includes(product.name);
}

function toggleProductSelection(product: Product): void {
  selectedProductNames.value = isProductSelected(product)
    ? selectedProductNames.value.filter(name => name !== product.name)
    : [...selectedProductNames.value, product.name];
}

function toggleProductDeleteMode(): void {
  productDeleteMode.value = !productDeleteMode.value;
  selectedProductNames.value = [];
}

function deleteSelectedProducts(): void {
  if (selectedProductNames.value.length === 0) return;
  const names = new Set(selectedProductNames.value);
  const count = names.size;
  products.value = products.value.filter(product => !names.has(product.name));
  favorites.value = favorites.value.filter(product => !names.has(product.name));
  cart.value = cart.value.filter(item => !names.has(item.product.name));
  if (activeProduct.value && names.has(activeProduct.value.name)) {
    activeProduct.value = null;
  }
  selectedProductNames.value = [];
  productDeleteMode.value = false;
  writeShopState();
  toastr.success(`已删除 ${count} 条内容`, '购物');
}

// ─── 购物车 ───
interface CartItem { product: Product; qty: number; }
const cart = ref<CartItem[]>([]);

const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0));
const cartTotal = computed(() => cart.value.reduce((s, i) => s + i.product.price * i.qty, 0));

function recordSearch(keyword: string) {
  const normalized = keyword.trim();
  if (!normalized) return;
  searchHistory.value = [normalized, ...searchHistory.value.filter(k => k !== normalized)].slice(0, 6);
}

function isFavorite(product: Product): boolean {
  return favorites.value.some(p => p.name === product.name);
}

function toggleFavorite(product: Product) {
  if (isFavorite(product)) {
    favorites.value = favorites.value.filter(p => p.name !== product.name);
  } else {
    favorites.value.unshift(product);
  }
  store.reportAction({
    appId: 'shop', appName: '购物', action: '收藏商品',
    summary: `用户${isFavorite(product) ? '收藏' : '取消收藏'}了「${product.name}」`,
    data: { product: product.name, favorite: isFavorite(product) },
  });
}

function createShopOrder(items: { name: string; qty: number; price: number }[], total: number): ShopOrder {
  return {
    id: `so_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    items,
    total,
    status: '已发货',
    logistics: [
      { time: '刚刚', text: '订单已支付', done: true },
      { time: '刚刚', text: '商家已接单', done: true },
      { time: '15分钟后', text: '仓库打包中', done: false },
      { time: '30分钟后', text: '等待揽收', done: false },
    ],
  };
}

function requestRefund(order: ShopOrder) {
  order.refundStatus = '退款处理中';
  order.logistics.unshift({ time: '刚刚', text: '已提交售后申请', done: true });
  store.reportAction({
    appId: 'shop', appName: '购物', action: '申请退款售后',
    summary: `用户对购物订单「${order.items.map(i => i.name).join('、')}」发起退款/售后`,
    data: { orderId: order.id, items: order.items },
  });
  toastr.info('售后申请已提交', '购物');
}

function addToCart(product: Product) {
  const existing = cart.value.find(i => i.product.name === product.name);
  if (existing) { existing.qty++; }
  else { cart.value.push({ product, qty: 1 }); }
  toastr.success(`${product.name} 已加入购物车`);
  store.reportAction({
    appId: 'shop', appName: '购物', action: '加入购物车',
    summary: `用户将「${product.name}」加入购物车，单价¥${product.price}`,
    data: { product: product.name, price: product.price },
  });
}

function removeFromCart(item: CartItem) {
  cart.value = cart.value.filter(i => i !== item);
}

function buyNow(product: Product) {
  const order = createShopOrder([{ name: product.name, qty: 1, price: product.price }], product.price);
  shopOrders.value.unshift(order);
  store.reportAction({
    appId: 'shop', appName: '购物', action: '立即购买',
    summary: `用户在购物 APP 下单购买「${product.name}」，¥${product.price}`,
    data: { product: product.name, price: product.price, orderId: order.id },
  });
  toastr.success(`已下单「${product.name}」`, '购物');
  activeOrder.value = order;
  activeProduct.value = null;
}

function checkout() {
  const items = cart.value.map(i => `${i.product.name}x${i.qty}`).join('、');
  const order = createShopOrder(cart.value.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price })), cartTotal.value);
  shopOrders.value.unshift(order);
  store.reportAction({
    appId: 'shop', appName: '购物', action: '结算下单',
    summary: `用户在购物 APP 下单：${items}，合计¥${cartTotal.value}`,
    data: { items: order.items, total: order.total, orderId: order.id },
  });
  toastr.success(`已下单，合计¥${cartTotal.value}`, '购物');

  // 模拟物流状态
  const orderItems = items;
  const orderTotal = cartTotal.value;
  setTimeout(() => {
    order.logistics = order.logistics.map((step, index) => ({ ...step, done: index < 3 }));
    order.logistics.push({ time: '刚刚', text: '包裹已发货', done: true });
    store.reportAction({
      appId: 'shop', appName: '购物', action: '物流更新',
      summary: `购物订单（${orderItems}，¥${orderTotal}）已发货`,
      data: { items: orderItems, total: orderTotal, status: 'shipped' },
    });
    toastr.info('你的购物订单已发货', '购物');
  }, 15000);

  cart.value = [];
  showCart.value = false;
  activeOrder.value = order;
}

function viewProduct(product: Product) {
  activeProduct.value = product;
  store.reportAction({
    appId: 'shop', appName: '购物', action: '查看商品',
    summary: `用户在购物 APP 查看了「${product.name}」`,
    data: { product: product.name, price: product.price },
  });
}

function toNum(v: unknown, fb: number): number {
  const n = Number(v); return Number.isFinite(n) ? n : fb;
}

async function searchProducts() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  const keyword = searchQuery.value.trim() || `${activeCategory.value}类热门商品`;
  recordSearch(keyword);
  writeShopState();
  store.reportAction({
    appId: 'shop', appName: '购物', action: '搜索商品',
    summary: `在购物 APP 搜索「${keyword}」`,
    data: { keyword },
  });
  try {
    const result = await generateForApp(
      'shop',
      `搜索「${keyword}」，生成 4 个商品`,
    );
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    const text = result.parsed;
    // XML 解析：提取 <product> 块
    const rawProducts = parseXmlResult(text, 'product');
    if (rawProducts.length === 0) {
      lastError.value = '生成结果格式不匹配';
      console.warn('[小手机] 购物解析失败:', text.slice(0, 200));
      return;
    }
    lastError.value = '';
    products.value = rawProducts.slice(0, 6).map((p, i) => ({
      name: String(p.name ?? '商品'),
      price: toNum(p.price, 99),
      originalPrice: toNum(p.originalPrice, toNum(p.price, 99) * 1.5),
      sales: String(p.sales ?? `月销${_.random(100, 9999)}`),
      rating: Math.min(5, Math.max(0, toNum(p.rating, 4.5))),
      description: String(p.description ?? ''),
      color: productColors[i % productColors.length],
      reviews: [],
    }));
    writeShopState();
    toastr.success('已生成商品推荐', '购物');
  } finally { isGenerating.value = false; }
}

async function generateReviews() {
  if (!activeProduct.value || isGenerating.value) return;
  isGenerating.value = true;
  try {
    const result = await generateForApp(
      'shop',
      `为商品「${activeProduct.value.name}」生成 3 条用户评价，部分可以是角色写的（带角色语气）。请用 <review> 标签输出。`,
      `商品信息：${activeProduct.value.description}，价格¥${activeProduct.value.price}`,
    );
    if (!result.success || !result.parsed) return;
    const text = result.parsed;
    // XML 解析：直接提取 <review> 块
    const rawReviews = extractXmlBlocks(text, 'review').map(parseXmlBlock);
    let didAppend = false;
    for (const [i, r] of rawReviews.entries()) {
      if (!r.content) continue;
      activeProduct.value.reviews.push({
        id: `rv_${Date.now()}_${i}`,
        author: String(r.author ?? `用户${i + 1}`),
        content: String(r.content),
        stars: Math.min(5, Math.max(1, toNum(r.rating ?? r.stars, _.random(3, 5)))),
      });
      didAppend = true;
    }
    if (didAppend) {
      writeShopState();
    }
  } finally { isGenerating.value = false; }
}

// 首次进入自动生成
onMounted(() => {
  if (!hasAutoGenerated.value) {
    hasAutoGenerated.value = true;
    searchProducts();
  }
});
</script>

<style scoped>
.shop-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow: hidden;
}

/* ─── Header ─── */
.shop-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn, .cart-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0;
}
.select-btn {
  border: none; border-radius: 12px; padding: 6px 10px;
  background: var(--bg-tertiary); color: var(--text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer; flex-shrink: 0;
}
.select-btn.active {
  background: rgba(231, 76, 60, 0.14);
  color: var(--danger);
}
.header-title { flex: 1; font-size: 16px; font-weight: 600; color: var(--text-primary); text-align: center; }
.cart-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--danger); color: white; font-size: 10px; font-weight: 700;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
}
.clear-text { border: none; background: none; color: var(--text-tertiary); font-size: 13px; cursor: pointer; }

.search-bar {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; background: var(--bg-secondary); border-radius: 18px;
  color: var(--text-tertiary);
}
.search-input {
  flex: 1; border: none; background: transparent;
  color: var(--text-primary); font-size: 13px; outline: none;
}

/* ─── Categories ─── */
.category-tabs {
  display: flex; gap: 4px; padding: 8px 12px;
  overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
}
.category-tabs::-webkit-scrollbar { display: none; }
.category-tabs button {
  flex: 0 0 auto; border: 0; border-radius: 14px; padding: 5px 12px;
  background: var(--bg-primary); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.category-tabs button.active { background: var(--accent); color: white; }

.history-strip,
.favorite-strip,
.shop-order-strip {
  display: flex; align-items: center; gap: 6px;
  padding: 0 12px 8px; overflow-x: auto; scrollbar-width: none;
  color: var(--text-secondary); font-size: 12px; flex-shrink: 0;
}
.history-strip::-webkit-scrollbar,
.favorite-strip::-webkit-scrollbar,
.shop-order-strip::-webkit-scrollbar { display: none; }
.history-strip button,
.favorite-strip button,
.shop-order-strip button {
  flex: 0 0 auto; border: none; border-radius: 12px; padding: 5px 10px;
  background: var(--bg-primary); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}

.ai-gen-bar { padding: 0 12px 8px; }
.selection-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 0 12px 8px; padding: 8px 12px;
  border-radius: 12px; background: rgba(231, 76, 60, 0.08);
  color: var(--text-secondary); font-size: 13px; flex-shrink: 0;
}
.selection-toolbar button {
  border: none; border-radius: 12px; padding: 5px 12px;
  background: var(--danger); color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.selection-toolbar button:disabled { opacity: 0.45; cursor: not-allowed; }
.ai-gen-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border: 1px dashed var(--border-primary); border-radius: 10px;
  background: transparent; color: var(--text-tertiary); font-size: 13px; cursor: pointer;
}
.ai-gen-btn:disabled { opacity: 0.5; cursor: wait; }

/* ─── Product Grid ─── */
.product-grid {
  flex: 1; overflow-y: auto; padding: 0 12px 12px;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  align-content: start;
}
.product-card {
  background: var(--bg-primary); border-radius: 12px; overflow: hidden; cursor: pointer;
  position: relative;
}
.product-card.selecting { outline: 1px solid rgba(231, 76, 60, 0.18); }
.product-card.selected { outline: 2px solid var(--danger); }
.select-check {
  position: absolute; top: 8px; right: 8px; z-index: 3;
  width: 24px; height: 24px; border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%; background: rgba(0, 0, 0, 0.26); color: white;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.select-check.checked { background: var(--danger); border-color: var(--danger); }
.product-thumb {
  height: 100px; display: flex; align-items: center; justify-content: center;
}
.product-meta { padding: 8px 10px; }
.product-name {
  font-size: 13px; color: var(--text-primary); line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-price-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.product-price { font-size: 16px; font-weight: 700; color: #ff4757; }
.product-sales { font-size: 11px; color: var(--text-muted); }

/* ─── Detail ─── */
.detail-scroll { flex: 1; overflow-y: auto; }
.product-cover { height: 180px; display: flex; align-items: center; justify-content: center; }
.product-info-card { padding: 14px; }
.price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.price { font-size: 24px; font-weight: 700; color: #ff4757; }
.original-price { font-size: 14px; color: var(--text-muted); text-decoration: line-through; }
.sales { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.product-title { margin: 0 0 6px; font-size: 16px; color: var(--text-primary); line-height: 1.4; }
.product-desc { margin: 0 0 10px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.rating-row { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
.stars { display: flex; gap: 2px; }
.rating-text { font-size: 13px; color: var(--text-tertiary); }

.reviews-section { margin-top: 16px; border-top: 1px solid var(--border-secondary); padding-top: 12px; }
.section-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;
}
.gen-review-btn {
  border: none; border-radius: 10px; padding: 4px 10px;
  background: var(--accent); color: white; font-size: 11px; cursor: pointer;
}
.gen-review-btn:disabled { opacity: 0.5; }

.review-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-secondary); }
.review-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.review-head strong { font-size: 13px; color: var(--text-primary); }
.review-stars { display: flex; gap: 1px; margin-top: 2px; }
.review-text { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

.detail-actions {
  display: flex; gap: 8px; padding: 10px 14px;
  background: var(--bg-primary); border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.favorite-btn, .add-cart-btn, .buy-now-btn {
  flex: 1; padding: 10px; border: none; border-radius: 20px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.favorite-btn { background: var(--bg-tertiary); color: var(--text-primary); }
.favorite-btn.active { background: #ffcc00; color: #3a2a00; }
.add-cart-btn { background: var(--accent); color: white; }
.buy-now-btn { background: #ff4757; color: white; }

.order-detail-scroll { flex: 1; overflow-y: auto; padding: 12px; }
.order-status-card,
.logistics-card,
.order-items-card {
  padding: 12px; background: var(--bg-primary); border-radius: 12px; margin-bottom: 10px;
}
.order-status-card { display: flex; justify-content: space-between; color: var(--text-primary); }
.order-status-card span { color: var(--text-tertiary); font-size: 12px; }
.logistics-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.logistics-step { display: flex; gap: 10px; padding: 8px 0; color: var(--text-muted); }
.logistics-step.done { color: var(--text-primary); }
.logistics-dot {
  width: 8px; height: 8px; border-radius: 50%; margin-top: 6px;
  background: var(--text-muted); flex-shrink: 0;
}
.logistics-step.done .logistics-dot { background: var(--accent); }
.logistics-step strong { display: block; font-size: 13px; }
.logistics-step small { display: block; margin-top: 2px; font-size: 11px; color: var(--text-tertiary); }
.order-item-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: var(--text-secondary); }
.order-item-line.total { border-top: 1px solid var(--border-secondary); margin-top: 6px; color: var(--text-primary); font-weight: 700; }
.refund-btn {
  width: 100%; border: none; border-radius: 20px; padding: 11px;
  background: #ff9500; color: white; font-size: 14px; font-weight: 700; cursor: pointer;
}
.refund-btn:disabled { opacity: 0.7; cursor: default; }

/* ─── Cart ─── */
.cart-scroll { flex: 1; overflow-y: auto; padding: 8px 12px; }
.cart-item {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  background: var(--bg-primary); border-radius: 10px; margin-bottom: 8px;
}
.cart-thumb {
  width: 50px; height: 50px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.cart-info { flex: 1; min-width: 0; }
.cart-name { font-size: 13px; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cart-price { font-size: 14px; font-weight: 600; color: #ff4757; }

.qty-control { display: flex; align-items: center; gap: 8px; }
.qty-control button {
  width: 26px; height: 26px; border: 1px solid var(--border-primary);
  border-radius: 50%; background: transparent; color: var(--text-primary);
  font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.qty-control span { font-size: 14px; color: var(--text-primary); min-width: 20px; text-align: center; }

.cart-footer {
  padding: 10px 14px; background: var(--bg-primary);
  border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.cart-total { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary); }
.total-price { font-size: 18px; font-weight: 700; color: #ff4757; }
.checkout-btn {
  width: 100%; padding: 10px; border: none; border-radius: 20px;
  background: #ff4757; color: white; font-size: 15px; font-weight: 600; cursor: pointer;
}

.empty-state {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: var(--text-muted); gap: 10px;
}
.empty-state p { margin: 0; font-size: 14px; }
</style>
