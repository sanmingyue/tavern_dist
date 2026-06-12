<template>
  <div class="lanjing-shell" :class="{ open: ui.isOpen }">
    <button class="lanjing-fab" type="button" title="澜景市规则面板" @click="ui.toggle">
      澜
    </button>

    <section v-if="ui.isOpen" class="lanjing-panel">
      <header class="panel-header">
        <div>
          <strong>澜景市规则接口</strong>
          <span>v{{ LANJING_SCRIPT_VERSION }} · {{ game.gameStarted ? '运行中' : '待开局' }}</span>
        </div>
        <button type="button" title="关闭" @click="ui.toggle">×</button>
      </header>

      <div class="status-grid">
        <div>
          <span>时间</span>
          <b>{{ game.currentTime }}</b>
        </div>
        <div>
          <span>地点</span>
          <b>{{ game.locationId }}</b>
        </div>
        <div>
          <span>余额</span>
          <b>¥{{ game.money.toFixed(2) }}</b>
        </div>
        <div>
          <span>天气</span>
          <b>{{ game.save.time.weather }}</b>
        </div>
      </div>

      <div class="actions">
        <button type="button" :disabled="ui.busy" @click="runTick">Tick</button>
        <button type="button" :disabled="ui.busy" @click="runPhoneSync">同步小手机</button>
        <button type="button" :disabled="ui.busy" @click="game.persist(); ui.info('存档已写入 chat 变量')">保存</button>
      </div>

      <button class="zhino-toggle" type="button" :disabled="ui.busy" @click="openZhino">
        展开智脑功能
      </button>

      <p v-if="ui.lastMessage" class="message">{{ ui.lastMessage }}</p>
      <p v-if="ui.lastError" class="message error">{{ ui.lastError }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useLanjingGameStore } from './stores/gameStore';
import { useLanjingUiStore } from './stores/uiStore';
import { LANJING_SCRIPT_VERSION } from './types/schema';
import { installLanjingZhino } from './内置智脑';

const game = useLanjingGameStore();
const ui = useLanjingUiStore();

function guarded(fn: () => void): void {
  ui.busy = true;
  try {
    fn();
  } catch (error) {
    ui.error(error instanceof Error ? error.message : String(error));
  } finally {
    ui.busy = false;
  }
}

function runTick(): void {
  guarded(() => {
    game.tick();
    ui.info('Tick 已执行');
  });
}

function runPhoneSync(): void {
  guarded(() => {
    const result = game.syncPhone();
    ui.info(`小手机同步完成：操作 ${result.actions} 条，联系人 ${result.contacts} 个`);
  });
}

function openZhino(): void {
  guarded(() => {
    installLanjingZhino({ openPanel: true });
    ui.info('澜景内置智脑已展开');
  });
}
</script>

<style scoped>
.lanjing-shell {
  position: fixed;
  right: 18px;
  bottom: 84px;
  z-index: 9999;
  color: #1d2433;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.lanjing-fab {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(20, 28, 42, 0.16);
  border-radius: 8px;
  background: #f8fafc;
  color: #1f5c7a;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}

.lanjing-panel {
  width: 320px;
  margin-bottom: 10px;
  border: 1px solid rgba(20, 28, 42, 0.14);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(20, 28, 42, 0.1);
}

.panel-header div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-header span,
.status-grid span {
  color: #64748b;
  font-size: 12px;
}

.panel-header button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.06);
  cursor: pointer;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 14px;
}

.status-grid div {
  min-width: 0;
  padding: 8px;
  border-radius: 6px;
  background: rgba(226, 232, 240, 0.7);
}

.status-grid b {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 8px;
  padding: 0 14px 12px;
}

.actions button {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 1px solid rgba(31, 92, 122, 0.24);
  border-radius: 6px;
  background: #e7f2f5;
  color: #1f5c7a;
  font-size: 12px;
  cursor: pointer;
}

.actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.zhino-toggle {
  width: calc(100% - 28px);
  height: 34px;
  margin: 0 14px 12px;
  border: 1px solid rgba(80, 55, 125, 0.25);
  border-radius: 6px;
  background: #f2eef8;
  color: #50377d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.zhino-toggle:disabled {
  cursor: wait;
  opacity: 0.6;
}

.message {
  margin: 0;
  padding: 0 14px 12px;
  color: #475569;
  font-size: 12px;
  line-height: 1.45;
}

.message.error {
  color: #b42318;
}
</style>
