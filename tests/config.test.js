const test = require('node:test');
const assert = require('node:assert');
const config = require('../src/config');
const defaults = require('../src/config/defaults');

test('Configuration Loader', async (t) => {
  await t.test('should load default bot configuration', () => {
    assert.strictEqual(typeof config.botName, 'string');
    assert.strictEqual(typeof config.prefix, 'string');
    assert.ok(config.prefix.length > 0);
  });

  await t.test('should have valid database config', () => {
    assert.ok(['json', 'sqlite'].includes(config.database.type));
    assert.strictEqual(typeof config.database.storagePath, 'string');
  });

  await t.test('should have owner credentials defined', () => {
    assert.strictEqual(typeof config.ownerName, 'string');
    assert.strictEqual(typeof config.ownerNumber, 'string');
    assert.strictEqual(typeof config.ownerJid, 'string');
  });
});
