/* eslint-disable no-console */
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { Server } = require('socket.io');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const DATA_DIR = path.join(ROOT_DIR, 'server-data');
const STATE_FILE = path.join(DATA_DIR, 'phone-state.json');
const TOKEN_FILE = path.join(DATA_DIR, 'pairing-token.txt');
const PORT = Number(process.env.XIAOSHOUJI_PORT || 39231);
const HOST = process.env.XIAOSHOUJI_HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function now() {
  return Date.now();
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function createDefaultState() {
  return {
    version: 1,
    updatedAt: now(),
    tavern: {
      connected: false,
      chatId: 'default',
      characterName: '',
      userName: '用户',
      lastSeenAt: null,
    },
    phone: {
      device: {
        id: createId('phone'),
        name: '小手机独立版',
        owner: '用户',
      },
      contacts: {},
      conversations: {},
      events: [],
      notifications: [],
      settings: {
        theme: 'dark',
        wallpaper: '',
      },
    },
  };
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(`[小手机服务] 读取 JSON 失败: ${file}`, error.message);
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function loadState() {
  const loaded = readJson(STATE_FILE, null);
  if (!loaded) {
    const initial = createDefaultState();
    writeJson(STATE_FILE, initial);
    return initial;
  }
  return {
    ...createDefaultState(),
    ...loaded,
    tavern: { ...createDefaultState().tavern, ...(loaded.tavern || {}) },
    phone: { ...createDefaultState().phone, ...(loaded.phone || {}) },
  };
}

function saveState() {
  state.updatedAt = now();
  writeJson(STATE_FILE, state);
}

function getPairingToken() {
  ensureDir(DATA_DIR);
  if (fs.existsSync(TOKEN_FILE)) {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  }
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  fs.writeFileSync(TOKEN_FILE, token, 'utf8');
  return token;
}

function listLanUrls() {
  const urls = [`http://127.0.0.1:${PORT}`];
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${PORT}`);
      }
    }
  }
  return urls;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const target = path.normalize(path.join(CLIENT_DIR, safePath));
  if (!target.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let file = target;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) file = path.join(CLIENT_DIR, 'index.html');

  const ext = path.extname(file);
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
  });
  fs.createReadStream(file).pipe(res);
}

function requireToken(payload) {
  const token = getPairingToken();
  return !token || payload?.token === token;
}

function upsertContact(name, extra = {}) {
  const normalized = String(name || '').trim();
  if (!normalized) return null;
  if (!state.phone.contacts[normalized]) {
    state.phone.contacts[normalized] = {
      name: normalized,
      alias: extra.alias || '',
      phone: extra.phone || '',
      tags: extra.tags || [],
      addedAt: now(),
    };
  } else {
    state.phone.contacts[normalized] = {
      ...state.phone.contacts[normalized],
      ...extra,
      name: normalized,
    };
  }
  if (!state.phone.conversations[normalized]) {
    state.phone.conversations[normalized] = {
      contactName: normalized,
      messages: [],
      unread: 0,
      lastUpdate: now(),
    };
  }
  return state.phone.contacts[normalized];
}

function appendMessage(contactName, message) {
  const contact = upsertContact(contactName);
  if (!contact) return null;
  const conversation = state.phone.conversations[contact.name];
  const record = {
    id: message.id || createId('msg'),
    from: message.from || contact.name,
    to: message.to || state.phone.device.owner,
    content: String(message.content || ''),
    timestamp: message.timestamp || now(),
    type: message.type || 'text',
    read: Boolean(message.read),
    source: message.source || 'local',
  };
  conversation.messages.push(record);
  conversation.lastUpdate = record.timestamp;
  if (!record.read && record.from !== state.phone.device.owner) {
    conversation.unread += 1;
  }
  return record;
}

function addNotification(appId, title, content) {
  const item = {
    id: createId('ntf'),
    appId,
    title,
    content,
    timestamp: now(),
    read: false,
  };
  state.phone.notifications.unshift(item);
  state.phone.notifications = state.phone.notifications.slice(0, 100);
  return item;
}

function parsePhoneTags(text, messageId) {
  const results = [];
  const patterns = [
    {
      appId: 'messages',
      re: /<闪讯(?:\s+from=["']?([^"'>\s]+)["']?)?>([\s\S]*?)<\/闪讯>/gi,
    },
    {
      appId: 'messages',
      re: /<messages?(?:\s+from=["']?([^"'>\s]+)["']?)?>([\s\S]*?)<\/messages?>/gi,
    },
    {
      appId: 'sms',
      re: /<短信(?:\s+from=["']?([^"'>\s]+)["']?)?>([\s\S]*?)<\/短信>/gi,
    },
    {
      appId: 'forum',
      re: /<论坛(?:\s+author=["']?([^"'>\s]+)["']?)?>([\s\S]*?)<\/论坛>/gi,
    },
  ];
  for (const pattern of patterns) {
    pattern.re.lastIndex = 0;
    let match;
    while ((match = pattern.re.exec(text)) !== null) {
      results.push({
        appId: pattern.appId,
        actor: match[1] || '剧情',
        content: String(match[2] || '').trim(),
        messageId,
      });
    }
  }
  return results;
}

function handleTavernEvent(event) {
  const payload = event.payload || {};
  if (event.type === 'tavern.chat.changed') {
    state.tavern.chatId = payload.chatId || 'default';
    state.tavern.characterName = payload.characterName || state.tavern.characterName;
    state.tavern.userName = payload.userName || state.tavern.userName;
    state.phone.device.owner = payload.userName || state.phone.device.owner;
  }

  if (event.type === 'tavern.message.received') {
    state.phone.events.unshift({
      id: createId('evt'),
      type: event.type,
      payload,
      timestamp: now(),
    });
    state.phone.events = state.phone.events.slice(0, 300);

    if (payload.role === 'assistant' && payload.content) {
      const tags = parsePhoneTags(payload.content, payload.messageId);
      for (const tag of tags) {
        if (tag.appId === 'messages' || tag.appId === 'sms') {
          appendMessage(tag.actor, {
            from: tag.actor,
            to: state.phone.device.owner,
            content: tag.content,
            read: false,
            source: 'tavern-tag',
          });
          addNotification(tag.appId, `来自 ${tag.actor}`, tag.content.slice(0, 80));
        } else {
          addNotification(tag.appId, tag.actor, tag.content.slice(0, 80));
        }
      }
    }
  }

  state.tavern.lastSeenAt = now();
  saveState();
  io.emit('phone.state', publicState());
}

function publicState() {
  return {
    ...state,
    pairingToken: undefined,
    server: {
      urls: listLanUrls(),
      port: PORT,
      tokenRequired: true,
    },
  };
}

function forwardCommandToTavern(type, payload) {
  if (!tavernSocket) return false;
  tavernSocket.emit('server.command', {
    id: createId('cmd'),
    type,
    payload,
    timestamp: now(),
  });
  return true;
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/status') {
    sendJson(res, 200, {
      ok: true,
      token: getPairingToken(),
      urls: listLanUrls(),
      tavernConnected: Boolean(tavernSocket),
      stateFile: STATE_FILE,
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/state') {
    sendJson(res, 200, publicState());
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/action') {
    const body = await readBody(req);
    if (!requireToken(body)) {
      sendJson(res, 401, { ok: false, error: '配对码不正确' });
      return;
    }
    const action = body.action || {};
    if (action.type === 'phone.message.send') {
      const contact = String(action.contact || '').trim();
      const content = String(action.content || '').trim();
      if (!contact || !content) {
        sendJson(res, 400, { ok: false, error: '联系人和内容不能为空' });
        return;
      }
      const message = appendMessage(contact, {
        from: state.phone.device.owner,
        to: contact,
        content,
        read: true,
        source: 'phone-ui',
      });
      saveState();
      const tavernOk = forwardCommandToTavern('tavern.input.append', {
        text: `<闪讯 from="${state.phone.device.owner}" to="${contact}">${content}</闪讯>`,
      });
      io.emit('phone.state', publicState());
      sendJson(res, 200, { ok: true, message, tavernOk });
      return;
    }
    if (action.type === 'phone.contact.add') {
      const contact = upsertContact(action.name, action.extra || {});
      saveState();
      io.emit('phone.state', publicState());
      sendJson(res, 200, { ok: true, contact });
      return;
    }
    sendJson(res, 400, { ok: false, error: '未知操作' });
    return;
  }
  sendJson(res, 404, { ok: false, error: 'Not found' });
}

ensureDir(DATA_DIR);
let state = loadState();
let tavernSocket = null;

const server = http.createServer((req, res) => {
  if (!req.url?.startsWith('/api/')) {
    serveStatic(req, res);
    return;
  }

  handleApi(req, res).catch(error => {
    console.error('[小手机服务] API 错误:', error);
    sendJson(res, 500, { ok: false, error: error.message });
  });
});

const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', socket => {
  socket.emit('server.hello', {
    urls: listLanUrls(),
    tokenRequired: true,
    tavernConnected: Boolean(tavernSocket),
  });

  socket.on('bridge.hello', payload => {
    if (!requireToken(payload)) {
      socket.emit('bridge.error', { code: 'BAD_TOKEN', message: '配对码不正确' });
      socket.disconnect(true);
      return;
    }
    socket.data.role = payload.role;
    socket.data.deviceName = payload.deviceName || payload.role;
    if (payload.role === 'tavern-bridge') {
      tavernSocket = socket;
      state.tavern.connected = true;
      state.tavern.lastSeenAt = now();
      saveState();
    }
    socket.emit('bridge.ready', {
      sessionId: socket.id,
      serverVersion: '0.1.0',
      tavernConnected: Boolean(tavernSocket),
      state: publicState(),
    });
    io.emit('phone.state', publicState());
  });

  socket.on('tavern.event', event => {
    if (socket !== tavernSocket) return;
    handleTavernEvent(event);
  });

  socket.on('phone.action', payload => {
    if (!requireToken(payload)) {
      socket.emit('bridge.error', { code: 'BAD_TOKEN', message: '配对码不正确' });
      return;
    }
    if (payload.action?.type === 'phone.message.send') {
      const action = payload.action;
      const contact = String(action.contact || '').trim();
      const content = String(action.content || '').trim();
      if (!contact || !content) return;
      appendMessage(contact, {
        from: state.phone.device.owner,
        to: contact,
        content,
        read: true,
        source: 'phone-ui',
      });
      saveState();
      forwardCommandToTavern('tavern.input.append', {
        text: `<闪讯 from="${state.phone.device.owner}" to="${contact}">${content}</闪讯>`,
      });
      io.emit('phone.state', publicState());
    }
  });

  socket.on('disconnect', () => {
    if (socket === tavernSocket) {
      tavernSocket = null;
      state.tavern.connected = false;
      saveState();
      io.emit('phone.state', publicState());
    }
  });
});

server.listen(PORT, HOST, () => {
  const token = getPairingToken();
  console.log('\n[小手机独立版] 已启动');
  console.log(`[小手机独立版] 配对码: ${token}`);
  for (const url of listLanUrls()) {
    console.log(`[小手机独立版] 访问: ${url}`);
  }
  console.log(`[小手机独立版] 数据: ${STATE_FILE}\n`);
});
