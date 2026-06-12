/* global io */
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

let socket = null;
let state = null;
let token = localStorage.getItem('xiaoshouji-token') || '';
let activeView = 'lock';
let activeContact = '';
let lastBridgeErrorAt = 0;

const views = {
  lock: $('#lock-view'),
  messages: $('#messages-view'),
  contacts: $('#contacts-view'),
  events: $('#events-view'),
  settings: $('#settings-view'),
};

function setView(name) {
  activeView = name;
  Object.entries(views).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
  render();
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function updateClock() {
  $('#clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function setConnectionText(text, ok = false) {
  $('#connection-text').textContent = text;
  $('#bridge-dot').classList.toggle('is-on', ok);
}

async function fetchStatus() {
  const res = await fetch('/api/status');
  const data = await res.json();
  $('#settings-urls').innerHTML = (data.urls || []).map(url => `<span>${url}</span>`).join('<br>');
  if (!token && data.token) {
    $('#token-input').placeholder = `例如 ${data.token}`;
  }
  return data;
}

function connect() {
  if (socket) socket.disconnect();
  socket = io({ transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    socket.emit('bridge.hello', {
      role: 'phone-client',
      version: '0.1.0',
      token,
      deviceName: navigator.userAgent.includes('Mobile') ? '手机网页' : '电脑网页',
    });
  });

  socket.on('bridge.ready', payload => {
    state = payload.state;
    setConnectionText(payload.tavernConnected ? '已连接酒馆桥接' : '已连接本地服务，等待酒馆桥接', true);
    render();
  });

  socket.on('phone.state', next => {
    state = next;
    setConnectionText(next.tavern.connected ? '已连接酒馆桥接' : '已连接本地服务，等待酒馆桥接', true);
    render();
  });

  socket.on('bridge.error', error => {
    lastBridgeErrorAt = Date.now();
    setConnectionText(error.message || '连接失败', false);
  });

  socket.on('disconnect', () => {
    if (Date.now() - lastBridgeErrorAt < 1500) return;
    setConnectionText('连接已断开，正在等待重连', false);
  });
}

function getContacts() {
  if (!state?.phone?.contacts) return [];
  return Object.values(state.phone.contacts).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

function getConversation(name) {
  return state?.phone?.conversations?.[name] || { messages: [], unread: 0 };
}

function renderContacts() {
  const contacts = getContacts();
  const html = contacts.length
    ? contacts.map(contact => {
      const conv = getConversation(contact.name);
      const latest = conv.messages[conv.messages.length - 1];
      return `<button class="contact ${activeContact === contact.name ? 'is-active' : ''}" data-contact="${contact.name}">
        <strong>${contact.name}</strong>
        <span>${latest ? latest.content : '暂无消息'}${conv.unread ? ` · ${conv.unread}` : ''}</span>
      </button>`;
    }).join('')
    : '<div class="list-item"><strong>还没有联系人</strong><span>点击右上角添加，或等待酒馆剧情标签同步。</span></div>';
  $('#contact-list').innerHTML = html;
  $('#contacts-page-list').innerHTML = html.replaceAll('class="contact', 'class="list-item contact');

  $$('#contact-list [data-contact], #contacts-page-list [data-contact]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeContact = btn.dataset.contact;
      setView('messages');
      render();
    });
  });
}

function renderMessages() {
  const title = $('#chat-title');
  const list = $('#message-list');
  const input = $('#message-input');
  if (!activeContact) {
    title.textContent = '选择联系人';
    list.innerHTML = '<div class="list-item"><strong>没有打开的对话</strong><span>从左侧联系人列表选择一位角色。</span></div>';
    input.disabled = true;
    return;
  }
  input.disabled = false;
  title.textContent = activeContact;
  const owner = state?.phone?.device?.owner || '用户';
  const conv = getConversation(activeContact);
  list.innerHTML = conv.messages.map(message => {
    const mine = message.from === owner;
    return `<div class="bubble ${mine ? 'mine' : ''}">
      <small>${message.from} · ${formatTime(message.timestamp)}</small>
      ${escapeHtml(message.content)}
    </div>`;
  }).join('') || '<div class="list-item"><strong>暂无消息</strong><span>发送第一条闪讯。</span></div>';
  list.scrollTop = list.scrollHeight;
}

function renderEvents() {
  const events = state?.phone?.events || [];
  $('#event-list').innerHTML = events.length
    ? events.slice(0, 80).map(event => `<div class="list-item">
      <strong>${event.type}</strong>
      <span>${formatTime(event.timestamp)} · ${escapeHtml(event.payload?.content || event.payload?.chatId || '')}</span>
    </div>`).join('')
    : '<div class="list-item"><strong>暂无事件</strong><span>酒馆桥接连接后，新消息会显示在这里。</span></div>';
}

function renderSettings() {
  const connected = state?.tavern?.connected;
  $('#settings-status').textContent = connected
    ? `酒馆已连接：${state.tavern.chatId || 'default'}`
    : '本地服务已连接，酒馆桥接未连接';
  if (state?.server?.urls) {
    $('#settings-urls').innerHTML = state.server.urls.map(url => `<span>${url}</span>`).join('<br>');
  }
}

function render() {
  renderContacts();
  renderMessages();
  renderEvents();
  renderSettings();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendAction(action) {
  if (socket?.connected) {
    socket.emit('phone.action', { token, action });
    return;
  }
  await fetch('/api/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, action }),
  });
}

$('#pair-form').addEventListener('submit', event => {
  event.preventDefault();
  token = $('#token-input').value.trim().toUpperCase();
  localStorage.setItem('xiaoshouji-token', token);
  connect();
});

$$('[data-open]').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.open));
});

$$('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => setView('lock'));
});

$('#send-form').addEventListener('submit', async event => {
  event.preventDefault();
  const content = $('#message-input').value.trim();
  if (!activeContact || !content) return;
  $('#message-input').value = '';
  await sendAction({
    type: 'phone.message.send',
    contact: activeContact,
    content,
  });
});

function promptContact() {
  const name = window.prompt('联系人名称');
  if (!name?.trim()) return;
  activeContact = name.trim();
  sendAction({ type: 'phone.contact.add', name: activeContact });
  setView('messages');
}

$('#add-contact-btn').addEventListener('click', promptContact);
$('#contact-create-btn').addEventListener('click', promptContact);
$('#refresh-btn').addEventListener('click', () => location.reload());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

setInterval(updateClock, 1000);
updateClock();
fetchStatus().then(() => {
  if (token) connect();
  else setConnectionText('请输入服务窗口显示的配对码');
});
