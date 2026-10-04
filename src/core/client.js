/**
 * Baileys v7 Socket Connection and Client Layer
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidDecode,
  delay
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
let NodeCache;
try {
  NodeCache = require('node-cache');
} catch (_) {
  NodeCache = class SimpleCache {
    constructor() { this.cache = new Map(); }
    get(k) { return this.cache.get(k); }
    set(k, v) { this.cache.set(k, v); return this; }
    del(k) { return this.cache.delete(k); }
    flushAll() { this.cache.clear(); }
  };
}
const qrcode = require('qrcode-terminal');
const config = require('../config');
const logger = require('../utils/logger');
const { decodeJid } = require('../utils/myfunc');
const {
  restoreWaWebSession,
  exportWaWebToken,
  applyWaWebToken
} = require('../utils/waWebAuth');

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.state = null;
    this.saveCreds = null;
    this.isReconnecting = false;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.socketListeners = [];
  }

  async connect() {
    const sessionDir = path.resolve(process.cwd(), config.sessionPath);
    await fs.ensureDir(sessionDir);

    // Auto-restore credentials from wa_web_access_token / wa_web.json / account.txt
    const restoreResult = await restoreWaWebSession(sessionDir, {
      configToken: config.waWebAccessToken
    });
    if (restoreResult.restored) {
      logger.info(`[AUTH] Credentials restored from ${restoreResult.source}`);
      if (restoreResult.me?.id) {
        logger.info(`[AUTH] Logged-in profile: ${restoreResult.me.name || 'Bot'} (${restoreResult.me.id})`);
      }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    this.state = state;
    this.saveCreds = saveCreds;

    let version;
    try {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    } catch (_) {
      version = [2, 3000, 1015901307];
    }

    const msgRetryCounterCache = new NodeCache();

    logger.info('Initializing Baileys v7.0.0-rc14 socket...');

    this.sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: !config.pairingCode,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
      },
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      getMessage: async () => null
    });

    // Attach utility decoders to socket instance
    this.sock.decodeJid = (jid) => decodeJid(jid);

    // Bind credentials update
    this.sock.ev.on('creds.update', saveCreds);

    // Pairing code mode
    if (config.pairingCode && !this.sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const number = config.pairingNumber || config.ownerNumber;
          if (!number) {
            logger.warn('[AUTH] Pairing code requested but PAIRING_NUMBER is empty.');
            return;
          }
          const code = await this.sock.requestPairingCode(number);
          const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log('\n' + '='.repeat(40));
          console.log(`📱 YOUR PAIRING CODE: ${formattedCode}`);
          console.log('='.repeat(40) + '\n');
        } catch (err) {
          logger.error('[AUTH] Failed to request pairing code:', err.message);
        }
      }, 3000);
    }

    // Attach connection events
    this.bindConnectionEvents();

    // Trigger registered socket listeners for the new socket
    for (const listener of this.socketListeners) {
      try {
        listener(this.sock);
      } catch (listenerErr) {
        logger.error('[SOCKET_LISTENER_ERROR]', listenerErr.message);
      }
    }

    return this.sock;
  }

  bindConnectionEvents() {
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !config.pairingCode) {
        logger.info('QR Code generated. Scan with WhatsApp Linked Devices:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'connecting') {
        logger.info('Connecting to WhatsApp...');
      }

      if (connection === 'open') {
        this.retryCount = 0;
        this.isReconnecting = false;
        logger.info('WhatsApp Connected Successfully!');
        logger.master('LOGIN', `Logged in as: ${this.sock.user?.name || 'Bot'} (${this.sock.user?.id})`);

        // Automatically sync active session to wa_web.json and account.txt
        exportWaWebToken(path.resolve(process.cwd(), config.sessionPath)).then((res) => {
          if (res?.token) {
            logger.info('[AUTH] Active wa_web_access_token synced to wa_web.json ✓');
          }
        }).catch(() => {});
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.warn(`Connection closed (Status Code: ${statusCode}). Reconnect: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          logger.error('Session logged out. Clearing auth credentials...');
          try {
            await fs.remove(path.resolve(process.cwd(), config.sessionPath));
          } catch (_) {}
          logger.info('Please restart bot to generate a new QR code or pairing code.');
          return;
        }

        if (shouldReconnect && !this.isReconnecting) {
          this.isReconnecting = true;
          this.retryCount++;
          const delayTime = Math.min(5000 * Math.pow(1.5, this.retryCount), 30000);
          logger.info(`Reconnecting in ${(delayTime / 1000).toFixed(1)}s (Attempt ${this.retryCount})...`);
          await delay(delayTime);
          this.connect().catch((err) => {
            logger.error('Reconnection attempt failed:', err.message);
            this.isReconnecting = false;
          });
        }
      }
    });
  }

  async getWaWebToken() {
    const sessionDir = path.resolve(process.cwd(), config.sessionPath);
    return exportWaWebToken(sessionDir);
  }

  async setWaWebToken(token) {
    const sessionDir = path.resolve(process.cwd(), config.sessionPath);
    return applyWaWebToken(token, sessionDir);
  }

  onSocketCreated(listener) {
    if (typeof listener === 'function') {
      this.socketListeners.push(listener);
      if (this.sock) {
        try {
          listener(this.sock);
        } catch (err) {
          logger.error('[SOCKET_LISTENER_ERROR]', err.message);
        }
      }
    }
  }

  isLoggedIn() {
    return Boolean(this.sock?.user?.id);
  }

  getUser() {
    return this.sock?.user || null;
  }

  getSocket() {
    return this.sock;
  }
}

module.exports = new WhatsAppClient();
