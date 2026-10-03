const test = require('node:test');
const assert = require('node:assert');
const database = require('../src/database');

test('Database Layer Operations', async (t) => {
  await t.test('usersData operations (get, set, money)', () => {
    const testUser = '999888777';
    database.usersData.create(testUser, { name: 'Test User' });

    assert.strictEqual(database.usersData.get(testUser, 'name'), 'Test User');

    database.usersData.addMoney(testUser, 250);
    assert.strictEqual(database.usersData.get(testUser, 'money'), 250);

    database.usersData.subtractMoney(testUser, 50);
    assert.strictEqual(database.usersData.get(testUser, 'money'), 200);

    database.usersData.remove(testUser);
    assert.strictEqual(database.usersData.exists(testUser), false);
  });

  await t.test('threadsData operations (settings, warnings)', () => {
    const testGroup = '123456789-987654321@g.us';
    database.threadsData.create(testGroup, { threadName: 'Test Group' });

    assert.strictEqual(database.threadsData.get(testGroup, 'threadName'), 'Test Group');

    // Warning helper
    assert.strictEqual(database.getWarnings(testGroup, 'user1'), 0);
    database.addWarning(testGroup, 'user1');
    assert.strictEqual(database.getWarnings(testGroup, 'user1'), 1);

    database.resetWarnings(testGroup, 'user1');
    assert.strictEqual(database.getWarnings(testGroup, 'user1'), 0);

    database.threadsData.remove(testGroup);
  });

  await t.test('MongoDB optional resilience and graceful fallback', async () => {
    // 1. Unified src/database init fallback
    const origType = process.env.DATABASE_TYPE;
    const origUri = process.env.MONGODB_URI;
    try {
      process.env.DATABASE_TYPE = 'mongodb';
      process.env.MONGODB_URI = 'mongodb://127.0.0.1:27019/non_existent_wa_goat_test';
      const initResult = await database.init();
      assert.strictEqual(initResult, true);
    } finally {
      if (origType !== undefined) process.env.DATABASE_TYPE = origType;
      else delete process.env.DATABASE_TYPE;
      if (origUri !== undefined) process.env.MONGODB_URI = origUri;
      else delete process.env.MONGODB_URI;
    }

    // 2. Classic database controller fallback
    try {
      const controllerInit = require('../database/controller/index.js');
      const res = await controllerInit({});
      assert.ok(res, 'Controller init must return database controller object');
      assert.ok(res.databaseType === 'json' || res.databaseType === 'mongodb');
    } catch (e) {
      assert.fail(`Controller init should not throw when MongoDB is unavailable: ${e.message}`);
    }
  });
});
