/**
 * Single source of truth configuration bridge.
 * Mirrors config.json to eliminate duplicated configuration drift.
 */

const path = require('path');
const fs = require('fs-extra');

let configJson = {};
const configJsonPath = path.resolve(process.cwd(), 'config.json');

try {
  if (fs.existsSync(configJsonPath)) {
    configJson = fs.readJsonSync(configJsonPath);
  } else {
    configJson = require('../../config.json');
  }
} catch (_) {
  configJson = {};
}

// Ensure minimal required structure if config.json was empty or unparseable
const defaults = {
  botName: 'Goat Bot V2 🐐',
  version: '2.0.0',
  description: 'Goat Bot V2 WhatsApp Edition powered by Baileys v7 & Floppa-WCA',
  author: 'frnAlt',
  prefix: '!',
  language: 'en',
  timeZone: 'Asia/Dhaka',
  ownerName: 'Farhan',
  ownerNumber: '1234567890',
  adminBot: ['1234567890'],
  devUsers: ['1234567890'],
  premiumUsers: ['1234567890'],
  noPrefix: true,
  botOff: false,
  eventsOff: false,
  reactOff: false,
  antiInbox: false,
  sessionPath: './auth',
  authFolder: './auth',
  loginMode: 'pair',
  phoneNumber: '',
  pairingCode: false,
  pairingNumber: '',
  waWebAccessToken: '',
  dashBoard: {
    enable: true,
    port: 3000,
    expireVerifyCode: 300000,
    passwordProtection: {
      enable: false,
      password: '',
      notes: 'Enable password protection for dashboard access'
    }
  },
  serverUptime: {
    enable: true,
    port: 3001,
    socket: {
      enable: true,
      channelName: 'uptime',
      verifyToken: 'goatbotkey'
    }
  },
  express: {
    enable: true,
    port: 3000
  },
  listen: {
    selfListen: false,
    listenEvents: true,
    autoMarkDelivery: false,
    autoReconnect: true,
    listenRawMsg: true
  },
  wca: {
    selfListen: false,
    listenEvents: true,
    autoMarkDelivery: false,
    autoReconnect: true,
    enableTypingIndicator: false,
    typingDuration: 3000
  },
  database: {
    type: 'json',
    storagePath: './data',
    sqlitePath: './data/database.sqlite'
  },
  spamProtection: {
    commandThreshold: 8,
    timeWindow: 10,
    banDuration: 24
  },
  defaultGroupSettings: {
    antilink: false,
    antibadword: false,
    welcome: true,
    goodbye: true,
    chatbot: false,
    mute: false,
    antitag: false,
    nsfw: false,
    warnLimit: 3,
    customWelcome: '',
    customGoodbye: '',
    setRole: {}
  },
  autoRead: false,
  autoTyping: false,
  autoStatus: false,
  antiCall: true,
  apiKeys: {
    weather: 'd7e795ae6a0d44aaa8abb1a0a7ac19e4',
    gemini: '',
    openai: ''
  }
};

module.exports = {
  ...defaults,
  ...configJson
};
