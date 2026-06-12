/**
 * 小手机独立版：酒馆桥接脚本
 *
 * 用法：
 * 1. 先启动 `src/小手机独立版/server/index.js`
 * 2. 将本脚本作为酒馆助手脚本打包/启用
 * 3. 脚本会连接本地服务，并把酒馆事件同步到独立小手机
 */

const SERVER_URL_KEY = 'xiaoshouji-standalone-server-url';
const TOKEN_KEY = 'xiaoshouji-standalone-token';
const DEFAULT_SERVER_URL = 'http://127.0.0.1:39231';

type BridgeSocket = {
  connected: boolean;
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  disconnect: () => void;
};

declare global {
  interface Window {
    io?: (url?: string, options?: Record<string, unknown>) => BridgeSocket;
  }
}

function getServerUrl(): string {
  return window.localStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL;
}

function getToken(): string {
  let token = window.localStorage.getItem(TOKEN_KEY) || '';
  if (!token) {
    token = window.prompt('请输入小手机独立版服务窗口显示的配对码')?.trim().toUpperCase() || '';
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function loadSocketIo(serverUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.io) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `${serverUrl}/socket.io/socket.io.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('无法加载小手机独立版 socket.io 客户端'));
    document.head.appendChild(script);
  });
}

function safeGetCurrentChatId(): string {
  try {
    return SillyTavern.getCurrentChatId() || 'default';
  } catch {
    return 'default';
  }
}

function safeUserName(): string {
  try {
    return SillyTavern.name1 || '用户';
  } catch {
    return '用户';
  }
}

function safeCharacterName(): string {
  try {
    return SillyTavern.name2 || '';
  } catch {
    return '';
  }
}

function appendToInput(text: string): void {
  const $textarea = $('#send_textarea', window.parent.document);
  if ($textarea.length > 0) {
    const current = String($textarea.val() || '');
    $textarea.val(current.trim() ? `${current}\n${text}` : text);
    $textarea.trigger('input');
    toastr.success('已写入酒馆输入框', '小手机独立版', { timeOut: 1400 });
    return;
  }
  toastr.error('没有找到酒馆输入框', '小手机独立版');
}

async function main(): Promise<void> {
  const serverUrl = getServerUrl();
  const token = getToken();
  await loadSocketIo(serverUrl);
  if (!window.io) throw new Error('socket.io 未加载');

  const socket = window.io(serverUrl, { transports: ['websocket', 'polling'] });

  function emitTavernEvent(type: string, payload: Record<string, unknown>): void {
    if (!socket.connected) return;
    socket.emit('tavern.event', {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      source: 'tavern',
      target: 'server',
      timestamp: Date.now(),
      payload,
    });
  }

  socket.on('connect', () => {
    socket.emit('bridge.hello', {
      role: 'tavern-bridge',
      version: '0.1.0',
      token,
      deviceName: 'SillyTavern',
    });
  });

  socket.on('bridge.ready', () => {
    toastr.success('小手机独立版已连接', '酒馆桥接', { timeOut: 1600 });
    emitTavernEvent('tavern.chat.changed', {
      chatId: safeGetCurrentChatId(),
      characterName: safeCharacterName(),
      userName: safeUserName(),
    });
  });

  socket.on('bridge.error', (error: { message?: string }) => {
    toastr.error(error.message || '连接失败', '小手机独立版');
  });

  socket.on('server.command', async (command: { type: string; payload?: any }) => {
    if (command.type === 'tavern.input.append') {
      appendToInput(String(command.payload?.text || ''));
      return;
    }
    if (command.type === 'tavern.generate.raw') {
      const result = await generateRaw({
        user_input: String(command.payload?.userInput || ''),
        should_stream: Boolean(command.payload?.shouldStream),
      });
      socket.emit('tavern.event', {
        type: 'tavern.generate.raw.result',
        payload: { result },
        timestamp: Date.now(),
      });
    }
  });

  eventOn(tavern_events.CHAT_CHANGED, (chatId: string) => {
    emitTavernEvent('tavern.chat.changed', {
      chatId: chatId || safeGetCurrentChatId(),
      characterName: safeCharacterName(),
      userName: safeUserName(),
    });
  });

  eventOn(tavern_events.MESSAGE_RECEIVED, (messageId: number) => {
    try {
      const messages = getChatMessages(messageId);
      const message = messages?.[0];
      if (!message) return;
      emitTavernEvent('tavern.message.received', {
        chatId: safeGetCurrentChatId(),
        messageId,
        role: message.role,
        name: message.name,
        content: message.message,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.warn('[小手机独立版] 同步酒馆消息失败:', error);
    }
  });

  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dryRun) => {
    emitTavernEvent('tavern.generation.before', {
      chatId: safeGetCurrentChatId(),
      dryRun: Boolean(dryRun),
    });
  });

  $(window).on('pagehide', () => {
    socket.disconnect();
  });
}

main().catch(error => {
  console.error('[小手机独立版] 桥接启动失败:', error);
  toastr.error(error.message || '桥接启动失败', '小手机独立版');
});

