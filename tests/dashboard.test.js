/**
 * Unit Tests for Dashboard Suite and Web Server
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const passwordAuth = require('../dashboard/middleware/passwordAuth');

describe('Dashboard and Server Suite', () => {

  test('should load dashboard app module and return express handler', async () => {
    process.env.NO_SERVER_LISTEN = '1';
    const dashboardInit = require('../dashboard/app.js');
    assert.equal(typeof dashboardInit, 'function', 'dashboard/app.js must export an async function');

    const app = await dashboardInit(null);
    assert.ok(app, 'dashboardInit must return an Express application instance');
    assert.equal(typeof app.use, 'function');
    assert.equal(typeof app.get, 'function');
  });

  test('should allow unrestricted access when password protection is disabled', (t, done) => {
    const config = {
      dashBoard: {
        passwordProtection: {
          enable: false,
          password: 'secretpassword'
        }
      }
    };

    const middleware = passwordAuth(config);
    const req = { path: '/status', method: 'GET', session: {} };
    const res = {};
    const next = () => {
      assert.ok(true, 'next() should be called');
      done();
    };

    middleware(req, res, next);
  });

  test('should redirect to /login when password protection is enabled and not authenticated', (t, done) => {
    const config = {
      dashBoard: {
        passwordProtection: {
          enable: true,
          password: 'secretpassword'
        }
      }
    };

    const middleware = passwordAuth(config);
    const req = { path: '/admin', method: 'GET', session: {} };
    const res = {
      redirect: (url) => {
        assert.equal(url, '/login');
        done();
      }
    };
    const next = () => {
      assert.fail('Should not call next when unauthenticated');
    };

    middleware(req, res, next);
  });

  test('should allow access to serverless Vercel handler in api/index.js', async () => {
    const vercelHandler = require('../api/index.js');
    assert.equal(typeof vercelHandler, 'function', 'api/index.js must export a callable function');
  });

});
