const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const {
  parseWaWebToken,
  encodeWaWebToken,
  applyWaWebToken,
  restoreWaWebSession,
  exportWaWebToken,
  readWaWebSessionContent,
  hasValidSession
} = require('../src/utils/waWebAuth');

test('WhatsApp Web Access Token & Session Auth Suite', async (t) => {
  const dummyCreds = {
    noiseKey: {
      private: Buffer.from('dummy_private_noise_key_32bytes!'),
      public: Buffer.from('dummy_public_noise_key_32bytes!')
    },
    registrationId: 12345,
    signedIdentityKey: {
      private: Buffer.from('dummy_private_identity_32bytes!'),
      public: Buffer.from('dummy_public_identity_32bytes!')
    },
    me: { id: '628123456789:1@s.whatsapp.net', name: 'TestUser' },
    registered: true,
    platform: 'whatsapp-web'
  };

  await t.test('encodeWaWebToken should produce a valid WA_WEB~ token string', () => {
    const token = encodeWaWebToken(dummyCreds);
    assert.ok(typeof token === 'string');
    assert.ok(token.startsWith('WA_WEB~'));
    assert.ok(token.length > 50);
  });

  await t.test('parseWaWebToken should decode encoded token back to creds with Buffers', () => {
    const token = encodeWaWebToken(dummyCreds);
    const parsed = parseWaWebToken(token);

    assert.ok(parsed);
    assert.ok(parsed.creds);
    assert.strictEqual(parsed.creds.registrationId, 12345);
    assert.strictEqual(parsed.creds.me.id, '628123456789:1@s.whatsapp.net');
    assert.ok(Buffer.isBuffer(parsed.creds.noiseKey.private));
    assert.strictEqual(parsed.creds.noiseKey.private.toString(), 'dummy_private_noise_key_32bytes!');
  });

  await t.test('parseWaWebToken should accept object with wa_web_access_token or creds', () => {
    const token = encodeWaWebToken(dummyCreds);

    const fromObjToken = parseWaWebToken({ wa_web_access_token: token });
    assert.ok(fromObjToken);
    assert.strictEqual(fromObjToken.creds.registrationId, 12345);

    const fromObjCreds = parseWaWebToken({ creds: dummyCreds });
    assert.ok(fromObjCreds);
    assert.strictEqual(fromObjCreds.creds.registrationId, 12345);

    const fromDirectCreds = parseWaWebToken(dummyCreds);
    assert.ok(fromDirectCreds);
    assert.strictEqual(fromDirectCreds.creds.registrationId, 12345);
  });

  await t.test('parseWaWebToken should return null on invalid input', () => {
    assert.strictEqual(parseWaWebToken(null), null);
    assert.strictEqual(parseWaWebToken(''), null);
    assert.strictEqual(parseWaWebToken('invalid_garbage_token'), null);
    assert.strictEqual(parseWaWebToken({ foo: 'bar' }), null);
  });

  await t.test('applyWaWebToken and hasValidSession in isolated directory', async () => {
    const tmpDir = path.join(os.tmpdir(), `wa-test-session-${Date.now()}`);
    await fs.ensureDir(tmpDir);

    try {
      assert.strictEqual(await hasValidSession(tmpDir), false);

      const token = encodeWaWebToken(dummyCreds);
      const applyRes = await applyWaWebToken(token, tmpDir, { syncRootFiles: false });

      assert.strictEqual(applyRes.success, true);
      assert.ok(applyRes.token);
      assert.strictEqual(await hasValidSession(tmpDir), true);

      // Verify creds.json file exists and is valid
      const credsFile = path.join(tmpDir, 'creds.json');
      assert.strictEqual(await fs.pathExists(credsFile), true);

      // Test exportWaWebToken
      const exported = await exportWaWebToken(tmpDir, { syncRootFiles: false });
      assert.ok(exported);
      assert.ok(exported.token.startsWith('WA_WEB~'));
      assert.strictEqual(exported.creds.registrationId, 12345);
    } finally {
      await fs.remove(tmpDir);
    }
  });

  await t.test('restoreWaWebSession should restore session from options token', async () => {
    const tmpDir = path.join(os.tmpdir(), `wa-test-restore-${Date.now()}`);
    await fs.ensureDir(tmpDir);

    try {
      const token = encodeWaWebToken(dummyCreds);
      const res = await restoreWaWebSession(tmpDir, { configToken: token, force: true, syncRootFiles: false });

      assert.strictEqual(res.restored, true);
      assert.strictEqual(res.source, 'config:waWebAccessToken');
      assert.strictEqual(res.me.id, '628123456789:1@s.whatsapp.net');

      // Repeated restore without force should detect existing session
      const repeated = await restoreWaWebSession(tmpDir, { configToken: token, force: false, syncRootFiles: false });
      assert.strictEqual(repeated.restored, false);
      assert.strictEqual(repeated.reason, 'Valid active session already exists');
    } finally {
      await fs.remove(tmpDir);
    }
  });

  await t.test('readWaWebSessionContent should retrieve token or file contents', async () => {
    const tmpDir = path.join(os.tmpdir(), `wa-test-read-${Date.now()}`);
    await fs.ensureDir(tmpDir);

    try {
      const token = encodeWaWebToken(dummyCreds);
      await applyWaWebToken(token, tmpDir, { syncRootFiles: false });

      const content = await readWaWebSessionContent(tmpDir);
      assert.ok(typeof content === 'string');
      assert.ok(content.length > 0);
    } finally {
      await fs.remove(tmpDir);
    }
  });
});
