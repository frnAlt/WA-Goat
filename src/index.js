/**
 * Goat Bot V2 for WhatsApp
 * High-Performance WhatsApp Chatbot powered by Baileys v7.0.0-rc14
 * 
 * Lead Architect: frnAlt (Farhan Muh Tasim)
 * Built with: Knightbot-MD & KnightBot-Mini architecture + Floppa-Chatbot functionality
 */

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

  // 2. Discover and Load Commands
  const commandsDir = path.resolve(__dirname, 'commands');
  const loadedCmdCount = commandManager.loadFromDirectory(commandsDir);
  logger.info(`Loaded ${loadedCmdCount} commands dynamically across ${commandManager.getCategories().size} categories.`);

  // 3. Discover and Load Events
  const eventsDir = path.resolve(__dirname, 'events');
  const loadedEventCount = eventManager.loadFromDirectory(eventsDir);
  logger.info(`Loaded ${loadedEventCount} modular events.`);

  // 4. Initialize Background Scheduler & Cleaners
  scheduler.init();

  // 5. Connect to WhatsApp via Baileys v7
  try {
    const sock = await client.connect();

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
