/**
 * Message Normalizer and Compatibility Layer for WhatsApp
 * Unifies Baileys v7 message structure with GoatBot message helper
 */

const { smsg, parseMention, decodeJid } = require('../utils/myfunc');
const permissions = require('./permissions');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Creates the GoatBot-compatible message helper object
 */
function createMessageHelper(sock, m) {
  return {
    async reply(content, options = {}) {
      try {
        if (typeof content === 'string') {
          return await sock.sendMessage(m.chat, { text: content, ...options }, { quoted: m });
        }
        return await sock.sendMessage(m.chat, { ...content, ...options }, { quoted: m });
      } catch (err) {
        logger.error('[MESSAGE_REPLY] Error:', err.message);
        throw err;
      }
    },

    async send(content, options = {}) {
      try {
        if (typeof content === 'string') {
          return await sock.sendMessage(m.chat, { text: content, ...options });
        }
        return await sock.sendMessage(m.chat, { ...content, ...options });
      } catch (err) {
        logger.error('[MESSAGE_SEND] Error:', err.message);
        throw err;
      }
    },

    async reaction(emoji, messageKey = m.key) {
      try {
        const key = messageKey && messageKey.remoteJid ? messageKey : m.key;
        return await sock.sendMessage(m.chat, {
          react: {
            text: emoji,
            key
          }
        });
      } catch (err) {
        logger.warn('[REACTION] Error:', err.message);
      }
    },

    async react(emoji) {
      return this.reaction(emoji);
    },

    async unsend(messageKey = m.key) {
      try {
        const key = messageKey && messageKey.remoteJid ? messageKey : m.key;
        return await sock.sendMessage(m.chat, { delete: key });
      } catch (err) {
        logger.warn('[UNSEND] Error:', err.message);
      }
    },

    async sendDM(userId, content, options = {}) {
      try {
        const cleanUser = String(userId).replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
        const targetJid = `${cleanUser}@s.whatsapp.net`;
        if (typeof content === 'string') {
          return await sock.sendMessage(targetJid, { text: content, ...options });
        }
        return await sock.sendMessage(targetJid, { ...content, ...options });
      } catch (err) {
        logger.error('[SEND_DM] Error:', err.message);
        throw err;
      }
    },

    async typing(duration = 2000) {
      try {
        await sock.sendPresenceUpdate('composing', m.chat);
        if (duration > 0) {
          setTimeout(async () => {
            try {
              await sock.sendPresenceUpdate('paused', m.chat);
            } catch (_) {}
          }, duration);
        }
      } catch (_) {}
    },

    async error(err) {
      const errMsg = err?.message || String(err);
      return await this.reply(`❌ An error occurred: ${errMsg}`);
    },

    async err(err) {
      return this.error(err);
    }
  };
}

/**
 * Normalizes raw Baileys messages into a unified rich context
 */
async function normalizeMessage(sock, rawMsg) {
  if (!rawMsg || !rawMsg.message) return null;

  // Serialize via smsg
  const m = smsg(sock, rawMsg);
  if (!m || !m.chat) return null;

  const chat = m.chat;
  const sender = m.sender || '';
  const isGroup = m.isGroup;
  const isPrivate = !isGroup;
  const isOwner = permissions.isOwner(sender);
  const isBotAdmin = permissions.isBotAdmin(sender);

  // Group admin check
  let isAdmin = false;
  let isBotGroupAdmin = false;
  if (isGroup) {
    try {
      const groupService = require('../services/groupService');
      isAdmin = await groupService.isUserAdmin(sock, chat, sender);
      isBotGroupAdmin = await groupService.isBotAdmin(sock, chat);
    } catch (_) {}
  }

  const text = m.text || '';
  const messageHelper = createMessageHelper(sock, m);

  // Parse prefix and command
  const botPrefix = config.prefix || '!';
  let hasPrefix = false;
  let usedPrefix = '';
  let commandName = '';
  let args = [];
  let commandText = '';

  if (text.startsWith(botPrefix)) {
    hasPrefix = true;
    usedPrefix = botPrefix;
    const withoutPrefix = text.slice(botPrefix.length).trim();
    const parts = withoutPrefix.split(/\s+/);
    commandName = (parts[0] || '').toLowerCase();
    args = parts.slice(1);
    commandText = parts.slice(1).join(' ');
  } else if (config.noPrefix && (isOwner || isBotAdmin)) {
    // No-prefix support for Bot Admin & Owner
    const parts = text.trim().split(/\s+/);
    commandName = (parts[0] || '').toLowerCase();
    args = parts.slice(1);
    commandText = parts.slice(1).join(' ');
  }

  // Create unified context
  const context = {
    id: m.id,
    chat,
    sender,
    participant: m.participant || sender,
    jid: sender,
    isGroup,
    isPrivate,
    isOwner,
    isAdmin,
    isBotAdmin,
    isBotGroupAdmin,
    text,
    command: commandName,
    commandName,
    args,
    body: text,
    prefix: usedPrefix,
    hasPrefix,
    quoted: m.quoted || null,
    mentions: m.mentionedJid || [],
    message: messageHelper,
    m,
    raw: rawMsg,
    sock
  };

  return context;
}

module.exports = {
  createMessageHelper,
  normalizeMessage
};
