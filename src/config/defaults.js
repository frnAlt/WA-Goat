/**
 * Default configuration values for Goat Bot V2 (WhatsApp Edition)
 */

module.exports = {
  botName: 'Goat Bot V2',
  version: '2.0.0',
  description: 'Goat Bot V2 WhatsApp Edition powered by Baileys v7',
  author: 'frnAlt',
  prefix: '!',
  language: 'en',
  timeZone: 'Asia/Dhaka',

  // Owner & Admins
  ownerName: 'Farhan',
  ownerNumber: '1234567890',
  adminBot: [],
  devUsers: [],
  premiumUsers: [],

  // Bot Behavioral Flags
  noPrefix: true, // Allow Owner/Admin to execute commands without prefix
  botOff: false,
  eventsOff: false,
  reactOff: false,
  antiInbox: false,

  // Authentication & Connection
  sessionPath: './auth',
  pairingCode: false,
  pairingNumber: '',
  waWebAccessToken: '',

  // Database
  database: {
    type: 'json', // 'json' | 'sqlite'
    storagePath: './data',
    sqlitePath: './data/database.sqlite'
  },

  // Spam protection
  spamProtection: {
    commandThreshold: 8,
    timeWindow: 10, // seconds
    banDuration: 24 // hours
  },

  // Group default settings
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
    setRole: {} // per-command role overrides
  },

  // System Automation
  autoRead: false,
  autoTyping: false,
  autoStatus: false,
  antiCall: false,

  // Dashboard & Server
  dashBoard: {
    enable: true,
    port: 5000,
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

  // WCA (WhatsApp Chat API)
  wca: {
    selfListen: false,
    listenEvents: true,
    autoMarkDelivery: false,
    autoReconnect: true,
    enableTypingIndicator: false,
    typingDuration: 3000
  },
  authFolder: './auth',
  loginMode: 'pair',
  phoneNumber: '',

  // External APIs
  apiKeys: {
    weather: 'd7e795ae6a0d44aaa8abb1a0a7ac19e4',
    gemini: '',
    openai: ''
  }
};
