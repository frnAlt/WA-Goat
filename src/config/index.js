/**
 * Unified Configuration Manager for Goat Bot V2 (WhatsApp Edition)
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const defaults = require('./defaults');

let localConfig = {};
const configJsonPath = path.resolve(process.cwd(), 'config.json');
if (fs.existsSync(configJsonPath)) {
  try {
    localConfig = fs.readJsonSync(configJsonPath);
  } catch (err) {
    console.warn('[CONFIG] Failed to parse config.json, using defaults & env:', err.message);
  }
}

// Clean and normalize phone numbers into jids
function cleanNumber(num) {
  if (!num) return '';
  return String(num).replace(/[^0-9]/g, '');
}

function toJid(num) {
  const cleaned = cleanNumber(num);
  if (!cleaned) return '';
  return cleaned + '@s.whatsapp.net';
}

const ownerNumber = process.env.OWNER_NUMBER || localConfig.ownerNumber || defaults.ownerNumber;
const sudoRaw = process.env.SUDO_NUMBERS || localConfig.sudoNumbers || '';
const sudoList = sudoRaw
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const adminBot = (localConfig.adminBot || defaults.adminBot || [])
  .concat(sudoList)
  .concat([ownerNumber])
  .map(cleanNumber)
  .filter(Boolean);

const config = {
  ...defaults,
  ...localConfig,

  botName: process.env.BOT_NAME || localConfig.botName || defaults.botName,
  version: defaults.version,
  prefix: process.env.PREFIX || localConfig.prefix || defaults.prefix,
  language: process.env.LANGUAGE || localConfig.language || defaults.language,
  timeZone: process.env.TIMEZONE || localConfig.timeZone || defaults.timeZone,
  port: parseInt(process.env.PORT || '3000', 10),

  ownerName: process.env.OWNER_NAME || localConfig.ownerName || defaults.ownerName,
  ownerNumber: cleanNumber(ownerNumber),
  ownerJid: toJid(ownerNumber),
  adminBot: [...new Set(adminBot)],
  adminJids: [...new Set(adminBot.map(toJid))],
  devUsers: (localConfig.devUsers || defaults.devUsers || []).map(cleanNumber),
  premiumUsers: (localConfig.premiumUsers || defaults.premiumUsers || []).map(cleanNumber),

  sessionPath: process.env.SESSION_PATH || localConfig.sessionPath || defaults.sessionPath,
  pairingCode: process.env.PAIRING_CODE === 'true' || localConfig.pairingCode || defaults.pairingCode,
  pairingNumber: cleanNumber(process.env.PAIRING_NUMBER || localConfig.pairingNumber || ''),
  waWebAccessToken: process.env.WA_WEB_ACCESS_TOKEN || process.env.SESSION_ID || localConfig.waWebAccessToken || localConfig.wa_web_access_token || defaults.waWebAccessToken,

  database: {
    type: (process.env.DATABASE_TYPE || localConfig.database?.type || defaults.database.type).toLowerCase(),
    storagePath: path.resolve(process.cwd(), localConfig.database?.storagePath || defaults.database.storagePath),
    sqlitePath: path.resolve(process.cwd(), process.env.DATABASE_URL || localConfig.database?.sqlitePath || defaults.database.sqlitePath)
  },

  autoRead: process.env.AUTO_READ === 'true' || Boolean(localConfig.autoRead),
  autoTyping: process.env.AUTO_TYPING === 'true' || Boolean(localConfig.autoTyping),
  autoStatus: process.env.AUTO_STATUS === 'true' || Boolean(localConfig.autoStatus),
  antiCall: process.env.ANTI_CALL === 'true' || Boolean(localConfig.antiCall),

  apiKeys: {
    weather: process.env.WEATHER_API_KEY || localConfig.apiKeys?.weather || defaults.apiKeys.weather,
    gemini: process.env.GEMINI_API_KEY || localConfig.apiKeys?.gemini || '',
    openai: process.env.OPENAI_API_KEY || localConfig.apiKeys?.openai || ''
  }
};

module.exports = config;
