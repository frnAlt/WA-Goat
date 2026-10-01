const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const eventManager = require('../src/core/events');

test('Event Manager and Loader', async (t) => {
  await t.test('should load modular events from directory', () => {
    const eventDir = path.resolve(__dirname, '../src/events');
    const count = eventManager.loadFromDirectory(eventDir);
    assert.ok(count > 0, `Loaded ${count} events`);

    const welcomeEvent = eventManager.get('welcome');
    assert.ok(welcomeEvent, 'welcome event found');
    assert.strictEqual(typeof welcomeEvent.execute, 'function');

    const leaveEvent = eventManager.get('leave');
    assert.ok(leaveEvent, 'leave event found');
    assert.strictEqual(typeof leaveEvent.execute, 'function');
  });
});
