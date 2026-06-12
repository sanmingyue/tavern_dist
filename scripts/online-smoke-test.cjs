const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const workspaceDir = path.resolve(__dirname, '..');
const backendDir = process.argv[2] || 'C:\\Users\\三明月\\Desktop\\workshop-server';
const dataDir = path.join(workspaceDir, 'tmp-online-smoke-data');
const port = Number(process.env.ONLINE_SMOKE_PORT || 19082);
const baseUrl = `http://127.0.0.1:${port}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Server is still booting.
    }
    await sleep(250);
  }
  throw new Error('Timed out waiting for local workshop server health check');
}

function seedSessions() {
  const Database = require(path.join(backendDir, 'node_modules', 'better-sqlite3'));
  const db = new Database(path.join(dataDir, 'workshop.db'));
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const insertUser = db.prepare(`
    INSERT INTO users (
      discord_id, discord_username, discord_display_name, discord_avatar, role, banned, created_at, last_login
    ) VALUES (?, ?, ?, '', 'user', 0, ?, ?)
  `);
  const insertSession = db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)');

  const host = insertUser.run('online-smoke-host', 'smoke_host', '烟测房主', now, now).lastInsertRowid;
  const player = insertUser.run('online-smoke-player', 'smoke_player', '烟测玩家', now, now).lastInsertRowid;
  insertSession.run('host-token', host, now, expires);
  insertSession.run('player-token', player, now, expires);
  db.close();
}

async function api(pathname, token, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text}`);
  }
  return data;
}

async function main() {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });

  const server = spawn(process.execPath, ['dist/index.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(port),
      BASE_URL: baseUrl,
      DATA_DIR: dataDir,
      SESSION_SECRET: 'online-smoke-secret',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logs = [];
  server.stdout.on('data', chunk => logs.push(chunk.toString()));
  server.stderr.on('data', chunk => logs.push(chunk.toString()));

  let roomId = '';
  let roundId = 0;
  try {
    await waitForHealth();
    seedSessions();

    const created = await api('/api/online/rooms', 'host-token', {
      method: 'POST',
      body: {
        title: '联机烟测房',
        visibility: 'public',
        character_name: '秋青子',
        character_summary: '用于联机接口烟测的角色摘要。',
        character_card_link: 'https://discord.com/channels/000/111/222',
        preset_name: '烟测预设',
        required_assets: ['角色卡公开链接'],
        per_player_words: 1000,
        candidate_timeout_seconds: 60,
        erase_on_close: true,
      },
    });
    roomId = created.room.id;

    const listed = await api('/api/online/rooms', 'player-token');
    if (!listed.rooms.some(room => room.id === roomId)) throw new Error('Created room was not listed');

    await api(`/api/online/rooms/${roomId}/join`, 'player-token', { method: 'POST', body: {} });
    await api(`/api/online/rooms/${roomId}/chat`, 'player-token', { method: 'POST', body: { content: '我已进入房间。' } });

    const started = await api(`/api/online/rooms/${roomId}/rounds`, 'host-token', { method: 'POST', body: {} });
    roundId = started.round_id;

    await api(`/api/online/rounds/${roundId}/input`, 'host-token', {
      method: 'POST',
      body: { player_message: '房主发言。' },
    });
    await api(`/api/online/rounds/${roundId}/input`, 'player-token', {
      method: 'POST',
      body: { player_message: '玩家发言。' },
    });
    await api(`/api/online/rounds/${roundId}/candidate`, 'host-token', {
      method: 'POST',
      body: { candidate_reply: '房主本地候选回复。' },
    });
    await api(`/api/online/rounds/${roundId}/candidate`, 'player-token', {
      method: 'POST',
      body: { candidate_reply: '玩家本地候选回复。' },
    });
    await api(`/api/online/rounds/${roundId}/finalize`, 'host-token', {
      method: 'POST',
      body: {
        user_message: '[多人联机整合]\n烟测用户楼层。',
        assistant_message: '烟测导演最终回复。',
      },
    });

    const state = await api(`/api/online/rooms/${roomId}`, 'player-token');
    if (state.finalized_rounds.length !== 1) throw new Error('Finalized round was not visible to player');
    if (state.finalized_rounds[0].inputs.length !== 2) throw new Error('Round input count mismatch');

    await api(`/api/online/rooms/${roomId}/close`, 'host-token', { method: 'POST', body: {} });

    const Database = require(path.join(backendDir, 'node_modules', 'better-sqlite3'));
    const db = new Database(path.join(dataDir, 'workshop.db'));
    const closedRoom = db.prepare('SELECT status FROM online_rooms WHERE id = ?').get(roomId);
    const chatCount = db.prepare('SELECT COUNT(*) AS count FROM online_room_chat_messages WHERE room_id = ?').get(roomId).count;
    const closedRound = db.prepare('SELECT user_message, assistant_message FROM online_rounds WHERE id = ?').get(roundId);
    db.close();

    if (!closedRoom || closedRoom.status !== 'closed') throw new Error('Room did not close');
    if (chatCount !== 0) throw new Error('Chat messages were not erased on close');
    if (closedRound.user_message || closedRound.assistant_message) throw new Error('Final room content was not erased on close');

    console.log(JSON.stringify({ ok: true, roomId, roundId }, null, 2));
  } catch (error) {
    console.error(logs.join('').trim());
    throw error;
  } finally {
    server.kill();
    await sleep(500);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
