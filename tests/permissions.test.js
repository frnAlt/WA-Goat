const test = require('node:test');
const assert = require('node:assert');
const permissions = require('../src/core/permissions');
const config = require('../src/config');

test('Permission & Role System', async (t) => {
  await t.test('should identify owner correctly', () => {
    const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
    assert.strictEqual(permissions.isOwner(ownerJid), true);
    assert.strictEqual(permissions.isOwner('999999999999@s.whatsapp.net'), false);
  });

  await t.test('should identify bot admin correctly', () => {
    const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
    assert.strictEqual(permissions.isBotAdmin(ownerJid), true);
  });

  await t.test('should verify required roles', async () => {
    const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
    const randomJid = '111111111111@s.whatsapp.net';

    // Owner has permission for all roles
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', ownerJid, 0), true);
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', ownerJid, 1), true);
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', ownerJid, 2), true);
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', ownerJid, 4), true);

    // Random user has role 0 permission, but not role 2+
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', randomJid, 0), true);
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', randomJid, 2), false);
    assert.strictEqual(await permissions.hasPermission(null, 'chat@g.us', randomJid, 4), false);
  });
});
