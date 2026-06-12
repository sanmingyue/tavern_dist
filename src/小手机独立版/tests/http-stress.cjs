/* eslint-disable no-console */
const assert = require('node:assert/strict');

const BASE_URL = process.env.XIAOSHOUJI_TEST_URL || 'http://127.0.0.1:39231';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function get(path) {
  const { res, body } = await request(path);
  assert.equal(res.ok, true, `${path} should respond ok`);
  return body;
}

async function postAction(token, action) {
  return request('/api/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, action }),
  });
}

async function main() {
  const status = await get('/api/status');
  assert.equal(status.ok, true);
  assert.equal(typeof status.token, 'string');
  const token = status.token;

  const bad = await postAction('BAD', { type: 'phone.contact.add', name: '坏配对' });
  assert.equal(bad.res.status, 401);

  const emptyMessage = await postAction(token, { type: 'phone.message.send', contact: '', content: '' });
  assert.equal(emptyMessage.res.status, 400);

  const unknown = await postAction(token, { type: 'phone.unknown.action' });
  assert.equal(unknown.res.status, 400);

  const addResults = await Promise.all(
    Array.from({ length: 20 }, (_, i) => postAction(token, {
      type: 'phone.contact.add',
      name: `乱按联系人${i % 7}`,
      extra: { tags: ['stress'] },
    })),
  );
  assert.equal(addResults.every(item => item.res.ok), true);

  const messageResults = await Promise.all(
    Array.from({ length: 80 }, (_, i) => postAction(token, {
      type: 'phone.message.send',
      contact: `乱按联系人${i % 7}`,
      content: `乱操作消息 ${i} ${'x'.repeat(i % 11)}`,
    })),
  );
  assert.equal(messageResults.every(item => item.res.ok), true);

  const state = await get('/api/state');
  const contacts = Object.keys(state.phone.contacts);
  assert.equal(contacts.filter(name => name.startsWith('乱按联系人')).length >= 7, true);
  const totalMessages = contacts.reduce((sum, name) => {
    return sum + (state.phone.conversations[name]?.messages?.length || 0);
  }, 0);
  assert.equal(totalMessages >= 80, true);

  const html = await request('/');
  assert.equal(html.res.status, 200);
  assert.match(String(html.body), /小手机独立版/);

  const manifest = await get('/manifest.webmanifest');
  assert.equal(manifest.short_name, '小手机');

  console.log(JSON.stringify({
    ok: true,
    contacts: contacts.length,
    totalMessages,
    token,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

