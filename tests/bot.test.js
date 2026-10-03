const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const client = require('../src/core/client');
const scheduler = require('../src/core/scheduler');
const { handleMessages } = require('../src/handlers/messageHandler');
const { handleGroupParticipantsUpdate, handleGroupUpdate, handleCalls } = require('../src/handlers/eventHandler');
const commandManager = require('../src/core/command');
const eventManager = require('../src/core/events');
const config = require('../src/config');
const utils = require('../utils');

test('Bot Core Services and Execution Suite', async (t) => {
  await t.test('WhatsAppClient instance and interface verification', async () => {
    assert.ok(client, 'WhatsAppClient singleton instance must exist');
    assert.strictEqual(typeof client.connect, 'function');
    assert.strictEqual(typeof client.getSocket, 'function');
    assert.strictEqual(typeof client.getWaWebToken, 'function');
    assert.strictEqual(typeof client.setWaWebToken, 'function');
    assert.strictEqual(client.maxRetries, 10);
    assert.strictEqual(client.isReconnecting, false);
    assert.strictEqual(client.retryCount, 0);
  });

  await t.test('Scheduler subsystem registration and lifecycle', async () => {
    assert.ok(scheduler, 'Scheduler instance must exist');
    assert.strictEqual(typeof scheduler.init, 'function');
    assert.strictEqual(typeof scheduler.schedule, 'function');
    assert.strictEqual(typeof scheduler.stopAll, 'function');

    scheduler.init();
    assert.ok(scheduler.intervals.length > 0);

    const testJob = scheduler.schedule('* * * * *', () => {});
    assert.ok(testJob);
    assert.ok(scheduler.jobs.length > 0);

    scheduler.stopAll();
    assert.strictEqual(scheduler.jobs.length, 0);
    assert.strictEqual(scheduler.intervals.length, 0);
  });

  await t.test('Message handler pipeline graceful execution', async () => {
    assert.strictEqual(typeof handleMessages, 'function');

    // Null and empty updates should be handled safely without throwing
    await assert.doesNotReject(async () => {
      await handleMessages(null, null);
    });

    await assert.doesNotReject(async () => {
      await handleMessages({}, { type: 'append', messages: [] });
    });

    const mockSock = {
      user: { id: '1234567890:0@s.whatsapp.net' },
      sendMessage: async () => ({ key: { id: 'mock-id' } })
    };

    // Non-message upsert
    await assert.doesNotReject(async () => {
      await handleMessages(mockSock, { type: 'notify', messages: [] });
    });
  });

  await t.test('Event handler pipeline graceful execution', async () => {
    assert.strictEqual(typeof handleGroupParticipantsUpdate, 'function');
    assert.strictEqual(typeof handleGroupUpdate, 'function');
    assert.strictEqual(typeof handleCalls, 'function');

    const mockSock = {
      user: { id: '1234567890:0@s.whatsapp.net' },
      sendMessage: async () => ({ key: { id: 'mock-event' } }),
      rejectCall: async () => true
    };

    // Should handle empty / invalid arguments without crashing
    await assert.doesNotReject(async () => {
      await handleGroupParticipantsUpdate(mockSock, { id: 'group123@g.us', participants: [], action: 'add' });
    });

    await assert.doesNotReject(async () => {
      await handleGroupUpdate(mockSock, []);
    });

    await assert.doesNotReject(async () => {
      await handleCalls(mockSock, []);
    });
  });

  await t.test('GoatBot and Floppa-WCA runtime compatibility helpers', async () => {
    // Phone number cleaner
    const phone = utils.jidToPhone('8801700000000:1@s.whatsapp.net');
    assert.strictEqual(phone, '8801700000000');

    // Group jid cleaner
    const groupPhone = utils.jidToPhone('120363000000000000@g.us');
    assert.strictEqual(groupPhone, '120363000000000000');

    // Duration formatting
    const durationShort = utils.humanDuration(12000);
    assert.ok(durationShort.includes('s') || durationShort.includes('sec'));

    // Normalize content
    const norm = utils.normalizeContent('Test message');
    assert.strictEqual(norm.body, 'Test message');

    // Message builder
    const mockApi = {
      sendMessage: async (content, tid) => ({ id: 'mock-sent-id', threadID: tid })
    };
    const msgObj = utils.buildMessage(mockApi, { threadID: '12345@s.whatsapp.net' });
    assert.ok(msgObj);
    assert.strictEqual(typeof msgObj.reply, 'function');
    assert.strictEqual(typeof msgObj.send, 'function');

    // Global ST & GoatBot wiring check
    global.ST = global.ST || {};
    global.ST.config = config;
    global.GoatBot = global.GoatBot || {};
    global.GoatBot.config = config;

    assert.strictEqual(global.ST.config.version, '2.0.0');
    assert.strictEqual(global.GoatBot.config.version, '2.0.0');
  });

  await t.test('Command and event registry integrity', async () => {
    const cmdDir = path.resolve(__dirname, '../scripts/cmds');
    commandManager.loadFromDirectory(cmdDir);

    const cmds = commandManager.getAll();
    assert.ok(Array.isArray(cmds));
    assert.ok(cmds.length > 50, `Expected >50 commands loaded, found ${cmds.length}`);

    // Ping should be resolvable
    const pingCmd = commandManager.get('ping');
    assert.ok(pingCmd, 'ping command must be registered');
    assert.strictEqual(pingCmd.name, 'ping');

    // Help should be resolvable
    const helpCmd = commandManager.get('help');
    assert.ok(helpCmd, 'help command must be registered');
  });
});
