<template>
  <div class="wallet-page">
    <!-- 顶部 -->
    <div class="wallet-header">
      <button class="back-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="header-title">钱包</span>
      <button class="more-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
    </div>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-label">总资产 (元)</div>
      <div class="balance-amount" @click="showBalance = !showBalance">
        <span v-if="showBalance" class="amount">¥ {{ balance.toFixed(2) }}</span>
        <span v-else class="amount-hidden">¥ ****</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="showBalance" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle v-if="showBalance" cx="12" cy="12" r="3"/>
          <path v-else d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8"/>
        </svg>
      </div>
    </div>

    <!-- 快捷功能网格（模仿支付宝） -->
    <div class="quick-grid">
      <div class="quick-item" v-for="item in quickActions" :key="item.name" @click="handleQuickAction(item.action)">
        <div class="quick-icon" :style="{ backgroundColor: item.color }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" v-html="item.icon"></svg>
        </div>
        <span class="quick-label">{{ item.name }}</span>
      </div>
    </div>

    <div v-if="activeForm" class="wallet-form">
      <div class="form-title">{{ activeForm === 'recharge' ? '余额充值' : '转账' }}</div>
      <input v-if="activeForm === 'transfer'" v-model="transferTarget" placeholder="收款人" />
      <input v-model.number="moneyAmount" type="number" min="1" placeholder="金额" />
      <div class="form-actions">
        <button @click="activeForm = ''">取消</button>
        <button @click="submitMoneyAction">确认</button>
      </div>
    </div>

    <!-- 银行卡列表 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">我的银行卡</span>
        <button class="section-action">管理</button>
      </div>
      <div class="card-list">
        <div v-for="card in cards" :key="card.id" class="bank-card" :style="{ background: card.gradient }">
          <div class="card-top">
            <span class="bank-name">{{ card.bank }}</span>
            <span class="card-type">{{ card.type }}</span>
          </div>
          <div class="card-number">**** **** **** {{ card.last4 }}</div>
        </div>
      </div>
    </div>

    <!-- 账单列表 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">最近账单</span>
        <button class="section-action">查看全部</button>
      </div>
      <div class="bill-list">
        <div v-for="bill in bills" :key="bill.id" class="bill-item">
          <div class="bill-icon" :class="bill.type">
            <svg v-if="bill.type === 'expense'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </div>
          <div class="bill-info">
            <span class="bill-desc">{{ bill.description }}</span>
            <span class="bill-time">{{ bill.time }}</span>
          </div>
          <span class="bill-amount" :class="bill.type">
            {{ bill.type === 'expense' ? '-' : '+' }}¥{{ bill.amount.toFixed(2) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const showBalance = ref(true);
const balance = ref(12580.50);
const activeForm = ref<'recharge' | 'transfer' | ''>('');
const moneyAmount = ref<number | null>(null);
const transferTarget = ref('');

const quickActions = [
  { name: '扫一扫', action: 'scan', color: '#2196f3', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
  { name: '付款码', action: 'pay', color: '#4caf50', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="11" y1="8" x2="11" y2="16"/><line x1="15" y1="8" x2="15" y2="16"/>' },
  { name: '转账', action: 'transfer', color: '#ff9800', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  { name: '缴费', action: 'pay', color: '#9c27b0', icon: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>' },
  { name: '理财', action: 'info', color: '#e91e63', icon: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>' },
  { name: '红包', action: 'pay', color: '#f44336', icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8m-4-4h8"/>' },
  { name: '充值', action: 'recharge', color: '#00bcd4', icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
  { name: '更多', action: 'info', color: '#607d8b', icon: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>' },
];

const cards = ref([
  { id: '1', bank: '招商银行', type: '储蓄卡', last4: '6688', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
  { id: '2', bank: '工商银行', type: '信用卡', last4: '9527', gradient: 'linear-gradient(135deg, #2c3e50, #34495e)' },
]);

const bills = ref([
  { id: '1', type: 'expense', description: '美团外卖', amount: 35.50, time: '今天 12:30' },
  { id: '2', type: 'expense', description: '微信转账', amount: 200.00, time: '今天 10:15' },
  { id: '3', type: 'income', description: '工资到账', amount: 8500.00, time: '昨天 09:00' },
  { id: '4', type: 'expense', description: '话费充值', amount: 50.00, time: '前天 14:20' },
  { id: '5', type: 'expense', description: '超市购物', amount: 127.80, time: '3天前' },
]);

function pushBill(type: 'expense' | 'income', description: string, amount: number) {
  bills.value.unshift({ id: `bill_${Date.now()}`, type, description, amount, time: '刚刚' });
}

function handleQuickAction(action: string) {
  if (action === 'recharge' || action === 'transfer') {
    activeForm.value = action;
    moneyAmount.value = null;
    transferTarget.value = '';
    return;
  }
  toastr.info('功能已记录', '钱包');
}

function submitMoneyAction() {
  const amount = Number(moneyAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) return;
  if (activeForm.value === 'recharge') {
    balance.value += amount;
    pushBill('income', '余额充值', amount);
    store.reportAction({
      appId: 'wallet', appName: '钱包', action: '余额充值',
      summary: `用户充值钱包余额 ¥${amount.toFixed(2)}`,
      data: { amount },
    });
  } else if (activeForm.value === 'transfer') {
    const target = transferTarget.value.trim() || '好友';
    balance.value -= amount;
    pushBill('expense', `转账给${target}`, amount);
    store.reportAction({
      appId: 'wallet', appName: '钱包', action: '转账',
      summary: `用户向「${target}」转账 ¥${amount.toFixed(2)}`,
      data: { target, amount },
    });
  }
  activeForm.value = '';
  moneyAmount.value = null;
}
</script>

<style scoped>
.wallet-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow-y: auto;
}

.wallet-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1a73e8, #4285f4);
}

.back-btn, .more-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.15); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.header-title { font-size: 17px; font-weight: 600; color: white; }

/* 余额卡片 */
.balance-card {
  margin: -1px 16px 16px; padding: 20px;
  background: linear-gradient(135deg, #1a73e8, #4285f4);
  border-radius: 0 0 16px 16px;
  color: white;
}

.balance-label { font-size: 13px; opacity: 0.8; margin-bottom: 8px; }

.balance-amount {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}

.amount { font-size: 28px; font-weight: 700; }
.amount-hidden { font-size: 28px; font-weight: 700; letter-spacing: 2px; }

/* 快捷功能 */
.quick-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px; padding: 16px;
  background: var(--bg-primary); margin: 0 16px 16px;
  border-radius: 12px;
}

.quick-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer;
}

.quick-item:active { transform: scale(0.95); }

.quick-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.quick-label { font-size: 11px; color: var(--text-secondary); }

.wallet-form {
  margin: 0 16px 16px; padding: 12px;
  background: var(--bg-primary); border-radius: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.form-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.wallet-form input {
  border: none; border-radius: 10px; padding: 9px 10px;
  background: var(--bg-secondary); color: var(--text-primary); outline: none;
}
.form-actions { display: flex; gap: 8px; }
.form-actions button {
  flex: 1; border: none; border-radius: 10px; padding: 9px;
  background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer;
}
.form-actions button:last-child { background: #1a73e8; color: white; }

/* 区块 */
.section { padding: 0 16px 16px; }

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}

.section-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }

.section-action {
  border: none; background: transparent; color: var(--accent);
  font-size: 13px; cursor: pointer;
}

/* 银行卡 */
.card-list { display: flex; flex-direction: column; gap: 8px; }

.bank-card {
  padding: 16px; border-radius: 12px; color: white;
}

.card-top { display: flex; justify-content: space-between; margin-bottom: 16px; }
.bank-name { font-size: 15px; font-weight: 600; }
.card-type { font-size: 12px; opacity: 0.8; }
.card-number { font-size: 18px; font-weight: 500; letter-spacing: 2px; }

/* 账单 */
.bill-list { display: flex; flex-direction: column; gap: 2px; }

.bill-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: var(--bg-primary); border-radius: 8px;
}

.bill-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.bill-icon.expense { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }
.bill-icon.income { background: rgba(39, 174, 96, 0.1); color: #27ae60; }

.bill-info { flex: 1; display: flex; flex-direction: column; }
.bill-desc { font-size: 14px; color: var(--text-primary); }
.bill-time { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.bill-amount { font-size: 15px; font-weight: 600; }
.bill-amount.expense { color: var(--text-primary); }
.bill-amount.income { color: #27ae60; }
</style>
