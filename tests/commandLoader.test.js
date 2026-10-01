const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const commandManager = require('../src/core/command');

test('Command Manager and Loader', async (t) => {
  await t.test('should load commands from directory dynamically', () => {
    const cmdDir = path.resolve(__dirname, '../src/commands');
    const count = commandManager.loadFromDirectory(cmdDir);
    assert.ok(count > 0, `Loaded ${count} commands`);
    assert.ok(commandManager.getAll().length >= count);
  });

  await t.test('should retrieve registered command by name and alias', () => {
    const ping = commandManager.get('ping');
    assert.ok(ping, 'ping command found');
    assert.strictEqual(ping.name, 'ping');

    const speed = commandManager.get('speed');
    assert.ok(speed, 'speed alias found');
    assert.strictEqual(speed.name, 'ping');

    const pfp = commandManager.get('pfp');
    assert.ok(pfp, 'pfp command found');
    assert.strictEqual(pfp.name, 'pfp');

    const dp = commandManager.get('dp');
    assert.ok(dp, 'dp alias found');
    assert.strictEqual(dp.name, 'pfp');

    const canvas = commandManager.get('canvas');
    assert.ok(canvas, 'canvas command found');
    assert.strictEqual(canvas.name, 'canvas');
  });

  await t.test('should correctly index categories', () => {
    const categories = commandManager.getCategories();
    assert.ok(categories.size > 0);
    assert.ok(categories.has('admin') || categories.has('utility') || categories.has('media'));
  });
});
