/**
 * Unit Tests for WCA (WhatsApp Chat API) Suite
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const wca = require('../floppa-wca');
const wcaUtils = require('../floppa-wca/utils');

describe('WCA (WhatsApp Chat API) Integration', () => {

  test('should export main wca function, buildAPI, and utils', () => {
    assert.equal(typeof wca, 'function', 'wca must be a callable function');
    assert.equal(typeof wca.buildAPI, 'function', 'wca.buildAPI must be exported');
    assert.equal(typeof wca.utils, 'object', 'wca.utils must be exported');
  });

  test('should resolve floppa-wca module correctly', () => {
    const floppaWca = require('floppa-wca');
    assert.equal(typeof floppaWca, 'function', 'floppa-wca must resolve to a function');
  });

  test('should correctly identify and format JIDs in wca/utils', () => {
    const rawNumber = '8801712345678';
    const formatted = wcaUtils.formatJID(rawNumber);
    assert.equal(formatted, '8801712345678@s.whatsapp.net');

    assert.equal(wcaUtils.isGroupJID('12345-67890@g.us'), true);
    assert.equal(wcaUtils.isGroupJID('8801712345678@s.whatsapp.net'), false);

    assert.equal(wcaUtils.isDMJID('8801712345678@s.whatsapp.net'), true);
    assert.equal(wcaUtils.isDMJID('12345-67890@g.us'), false);

    assert.equal(wcaUtils.normalizePhoneNumber('+880 171-2345-678'), '8801712345678');
  });

  test('should construct complete WCA API instance with buildAPI', async () => {
    let sentMessageCalled = false;
    let sentPayload = null;

    const dummySock = {
      user: { id: '8801712345678:1@s.whatsapp.net', name: 'GoatBot' },
      ev: { on: () => {} },
      sendMessage: async (jid, content, options) => {
        sentMessageCalled = true;
        sentPayload = { jid, content, options };
        return { key: { id: 'TEST_MSG_ID', remoteJid: jid } };
      },
      sendPresenceUpdate: async () => {},
      groupMetadata: async (jid) => ({ id: jid, subject: 'Test Group' })
    };

    const ctx = {
      selfID: '8801712345678@s.whatsapp.net',
      sock: dummySock,
      globalOptions: { selfListen: false }
    };

    const api = wca.buildAPI(dummySock, ctx, ctx.globalOptions);

    assert.equal(typeof api.sendMessage, 'function');
    assert.equal(typeof api.sendMedia, 'function');
    assert.equal(typeof api.getGroupInfo, 'function');
    assert.equal(typeof api.reactToMessage, 'function');
    assert.equal(typeof api.deleteMessage, 'function');
    assert.equal(typeof api.addUserToGroup, 'function');
    assert.equal(typeof api.kickUser, 'function');
    assert.equal(typeof api.getCurrentUserID, 'function');
    assert.equal(api.getCurrentUserID(), '8801712345678@s.whatsapp.net');

    // Test sending string message
    const res = await api.sendMessage('Hello WhatsApp!', '8801712345678@s.whatsapp.net');
    assert.equal(sentMessageCalled, true);
    assert.equal(sentPayload.content.text, 'Hello WhatsApp!');
    assert.equal(res.key.id, 'TEST_MSG_ID');
  });

  test('should load floppa-wca and include Floppa conduit builders, sliding cache, and groups namespace', () => {
    const floppaWca = require('../floppa-wca');
    assert.equal(typeof floppaWca, 'function');
    assert.equal(typeof floppaWca.buildAPI, 'function');

    const dummySock = {
      user: { id: '8801712345678@s.whatsapp.net', name: 'FloppaGoat' },
      ev: { on: () => {} },
      sendMessage: async () => ({ key: { id: 'FLOPPA_MSG_ID' } })
    };

    const ctx = {
      selfID: '8801712345678@s.whatsapp.net',
      sock: dummySock,
      globalOptions: {}
    };

    const api = floppaWca.buildAPI(dummySock, ctx, ctx.globalOptions);

    // Verify Floppa Extensions
    assert.ok(api.builders, 'api.builders must be attached');
    assert.equal(typeof api.builders.message, 'function', 'Conduit message builder must be present');
    assert.equal(typeof api.builders.attachment, 'function', 'Conduit attachment builder must be present');
    assert.ok(api.cache, 'api.cache must be attached');
    assert.ok(api.messages, 'api.messages namespace must be attached');
    assert.ok(api.groups, 'api.groups namespace must be attached');
    assert.ok(api.threads, 'api.threads namespace must be attached');
    assert.equal(typeof api.createMessageCollector, 'function', 'api.createMessageCollector must be present');
  });

});
