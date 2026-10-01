/**
 * Unified Database Layer - Goat Bot V2 WhatsApp Edition
 * Bridges GoatBot database controllers with WhatsApp/KnightBot helpers
 */

const path = require('path');
const fs = require('fs-extra');
const config = require('../config');
const UsersData = require('./controllers/usersData');
const ThreadsData = require('./controllers/threadsData');
const GlobalData = require('./controllers/globalData');
const logger = require('../utils/logger');

const dataDir = path.resolve(process.cwd(), 'data');
fs.ensureDirSync(dataDir);

const usersData = new UsersData({ storagePath: path.join(dataDir, 'users.json') });
const threadsData = new ThreadsData({ storagePath: path.join(dataDir, 'threads.json') });
const globalData = new GlobalData({ storagePath: path.join(dataDir, 'global.json') });

// Sudo / Owner JIDs
const sudoJids = new Set(config.adminJids || []);

// Helper to normalize user identifiers
function cleanId(id) {
  if (!id) return '';
  return String(id).replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
}

const database = {
  usersData,
  threadsData,
  globalData,

  // Initialize DB subsystem
  async init() {
    logger.info('Database initialized (Storage:', config.database.type, ')');
    return true;
  },

  // Group settings helper (KnightBot compatibility)
  getGroupSettings(groupId) {
    return threadsData.getSettings(groupId);
  },

  updateGroupSettings(groupId, settings) {
    return threadsData.updateSettings(groupId, settings);
  },

  // User helper
  getUser(userId) {
    return usersData.get(userId);
  },

  updateUser(userId, data) {
    return usersData.set(userId, data);
  },

  // Warning system
  getWarnings(groupId, userId) {
    const uId = cleanId(userId);
    const warnings = threadsData.get(groupId, `data.warnings.${uId}`, 0);
    return Number(warnings) || 0;
  },

  addWarning(groupId, userId) {
    const uId = cleanId(userId);
    const current = database.getWarnings(groupId, uId);
    const updated = current + 1;
    threadsData.set(groupId, updated, `data.warnings.${uId}`);
    return updated;
  },

  resetWarnings(groupId, userId) {
    const uId = cleanId(userId);
    threadsData.set(groupId, 0, `data.warnings.${uId}`);
    return 0;
  },

  // Ban management
  isBanned(userId) {
    const uId = cleanId(userId);
    return Boolean(usersData.get(uId, 'banned', false));
  },

  banUser(userId, reason = 'Banned by Administrator') {
    const uId = cleanId(userId);
    usersData.set(uId, { banned: true, banReason: reason, bannedAt: Date.now() });
    return true;
  },

  unbanUser(userId) {
    const uId = cleanId(userId);
    usersData.set(uId, { banned: false, banReason: '', bannedAt: null });
    return true;
  },

  isThreadBanned(threadId) {
    return Boolean(threadsData.get(threadId, 'banned', false));
  },

  banThread(threadId, reason = 'Group Banned by Bot Administrator') {
    threadsData.set(threadId, { banned: true, banReason: reason, bannedAt: Date.now() });
    return true;
  },

  unbanThread(threadId) {
    threadsData.set(threadId, { banned: false, banReason: '', bannedAt: null });
    return true;
  },

  // Sudo management
  isSudo(userId) {
    const uId = cleanId(userId);
    const jid = `${uId}@s.whatsapp.net`;
    return sudoJids.has(jid) || config.adminBot.includes(uId);
  },

  addSudo(userId) {
    const uId = cleanId(userId);
    const jid = `${uId}@s.whatsapp.net`;
    sudoJids.add(jid);
    if (!config.adminBot.includes(uId)) config.adminBot.push(uId);
    return true;
  },

  removeSudo(userId) {
    const uId = cleanId(userId);
    const jid = `${uId}@s.whatsapp.net`;
    sudoJids.delete(jid);
    config.adminBot = config.adminBot.filter(id => id !== uId);
    return true;
  }
};

module.exports = database;
