/**
 * Goat Bot V2 for WhatsApp (Floppa-WCA & Dashboard Edition)
 * High-Performance WhatsApp Chatbot powered by Baileys v7.0.0-rc14 & Floppa-WCA
 * 
 * Lead Architect: frnAlt
 * Built with: Floppa-WCA Client Engine
 */

require('./utils/moduleAliases');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const database = require('./database');
const commandManager = require('./core/command');
const eventManager = require('./core/events');
const scheduler = require('./core/scheduler');
const client = require('./core/client');
const { handleMessages } = require('./handlers/messageHandler');
const { handleGroupParticipantsUpdate, handleGroupUpdate, handleCalls } = require('./handlers/eventHandler');

// Graceful process error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[UNHANDLED_REJECTION]', reason && reason.stack ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
  logger.error('[UNCAUGHT_EXCEPTION]', err && err.stack ? err.stack : err);
});

async function main() {
  logger.banner();

  // 1. Initialize Database
  await database.init();

  // Initialize global.utils for Floppa/GoatBot commands
  if (!global.utils) {
    try {
      global.utils = require(path.resolve(process.cwd(), 'utils.js'));
    } catch (_) {
      global.utils = require('./utils/goatUtils');
    }
  }

  global.GoatBot = global.GoatBot || {};
  global.GoatBot.config = global.GoatBot.config || config;
  global.GoatBot.configCommands = global.GoatBot.configCommands || { commandUnload: [], commandEventUnload: [], commandAllowLoad: [] };

  global.ST = global.ST || {};
  global.ST.config = global.ST.config || config;
  global.ST.configCommands = global.ST.configCommands || global.GoatBot.configCommands;
  global.ST.startTime = global.ST.startTime || Date.now();

  // 2. Discover and Load Commands (Floppa / GoatBot scripts structure)
  const scriptsCmdsDir = path.resolve(process.cwd(), 'scripts/cmds');
  commandManager.loadFromDirectory(scriptsCmdsDir);
  logger.info(`Loaded ${commandManager.getAll().length} unique commands dynamically across ${commandManager.getCategories().size} categories.`);

  // 3. Discover and Load Events
  const scriptsEventsDir = path.resolve(process.cwd(), 'scripts/events');
  const loadedEventCount = eventManager.loadFromDirectory(scriptsEventsDir);
  logger.info(`Loaded ${loadedEventCount} modular events.`);

  // Attach command and event collections to runtime globals
  global.ST.cmds = commandManager.getAll();
  global.ST.events = eventManager.getAll();
  global.GoatBot.commands = commandManager.getAll();
  global.GoatBot.events = eventManager.getAll();

  // 4. Initialize Background Scheduler & Cleaners
  scheduler.init();

  // 4.5. Initialize Web Dashboard & Server
  if (config.dashBoard && config.dashBoard.enable !== false && process.env.NO_DASHBOARD !== '1') {
    try {
      const dashboardInit = require(path.resolve(process.cwd(), 'dashboard/app.js'));
      await dashboardInit();
      logger.info(`Web Dashboard mounted on port ${process.env.PORT || config.dashBoard.port || 5000}`);
    } catch (err) {
      logger.warn(`[DASHBOARD] Could not initialize web dashboard: ${err.message}`);
    }
  }

  // 5. Connect to WhatsApp via Baileys v7
  try {
    const sock = await client.connect();

    // Initialize and bridge Floppa-WCA Engine
    try {
      let buildAPI;
      try {
        buildAPI = require(path.resolve(process.cwd(), 'floppa-wca')).buildAPI;
      } catch (_) {
        buildAPI = require(path.resolve(process.cwd(), 'wca')).buildAPI;
      }
      const wcaApi = buildAPI(sock, {
        selfID: sock.user?.id || '',
        sock,
        globalOptions: config.wca || {}
      });
      global.floppaWca = wcaApi;
      global.wcaApi = wcaApi;
      global.api = wcaApi;
      global.GoatBot = global.GoatBot || {};
      global.GoatBot.api = wcaApi;
      logger.info('Floppa-WCA Engine & Conduit extensions mounted successfully.');
    } catch (wcaErr) {
      logger.warn(`[FLOPPA-WCA] Note: Engine wrapper could not be auto-bound: ${wcaErr.message}`);
    }

    // Bind Core Message Stream
    sock.ev.on('messages.upsert', async (chatUpdate) => {
      await handleMessages(sock, chatUpdate);
    });

    // Bind Group Events
    sock.ev.on('group-participants.update', async (update) => {
      await handleGroupParticipantsUpdate(sock, update);
    });

    sock.ev.on('groups.update', async (updates) => {
      await handleGroupUpdate(sock, updates);
    });

    // Bind Call Moderation
    sock.ev.on('call', async (calls) => {
      await handleCalls(sock, calls);
    });

  } catch (error) {
    logger.error('Failed to initialize WhatsApp connection:', error.message);
    process.exit(1);
  }
}

// Graceful Shutdown on termination signals
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  scheduler.stopAll();
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

main().catch((err) => {
  logger.error('Critical boot failure:', err.message);
  process.exit(1);
});
