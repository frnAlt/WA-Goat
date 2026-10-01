const test = require('node:test');
const assert = require('node:assert');
const { CooldownManager, TTLMap } = require('../src/services/cacheService');

test('Cache and Cooldown Services', async (t) => {
  await t.test('CooldownManager tracking', () => {
    const cm = new CooldownManager();
    const user = 'user1';
    const cmd = 'ping';

    assert.strictEqual(cm.isOnCooldown(user, cmd, 5), 0);
    cm.setCooldown(user, cmd, 5);

    const remaining = cm.isOnCooldown(user, cmd, 5);
    assert.ok(remaining > 0 && remaining <= 5);
  });

  await t.test('TTLMap storage and expiry', () => {
    const ttl = new TTLMap({ ttl: 50 });
    ttl.set('k1', 'val1');

    assert.strictEqual(ttl.get('k1'), 'val1');
    assert.strictEqual(ttl.has('k1'), true);

    ttl.delete('k1');
    assert.strictEqual(ttl.has('k1'), false);
    ttl.destroy();
  });
});
