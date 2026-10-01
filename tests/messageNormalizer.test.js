const test = require('node:test');
const assert = require('node:assert');
const { normalizeMessage } = require('../src/core/message');
const config = require('../src/config');

test('Message Normalization and Parser', async (t) => {
  const mockSock = {
    user: { id: `${config.ownerNumber}:0@s.whatsapp.net` },
    sendMessage: async () => ({ key: { id: 'sent-1' } })
  };

  await t.test('should parse command, prefix, and arguments correctly', async () => {
    const rawMsg = {
      key: {
        id: 'msg-12345',
        remoteJid: '123456789-987654321@g.us',
        fromMe: false,
        participant: '111222333@s.whatsapp.net'
      },
      message: {
        conversation: '!kick @999999999 spamming links'
      }
    };

    const ctx = await normalizeMessage(mockSock, rawMsg);
    assert.ok(ctx);
    assert.strictEqual(ctx.id, 'msg-12345');
    assert.strictEqual(ctx.isGroup, true);
    assert.strictEqual(ctx.command, 'kick');
    assert.strictEqual(ctx.prefix, '!');
    assert.deepStrictEqual(ctx.args, ['@999999999', 'spamming', 'links']);
    assert.strictEqual(ctx.sender, '111222333@s.whatsapp.net');
    assert.strictEqual(typeof ctx.message.reply, 'function');
  });

  await t.test('should handle messages without prefix', async () => {
    const rawMsg = {
      key: {
        id: 'msg-67890',
        remoteJid: '111222333@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'hello world'
      }
    };

    const ctx = await normalizeMessage(mockSock, rawMsg);
    assert.ok(ctx);
    assert.strictEqual(ctx.isGroup, false);
    assert.strictEqual(ctx.isPrivate, true);
    assert.strictEqual(ctx.hasPrefix, false);
    assert.strictEqual(ctx.text, 'hello world');
  });
});
