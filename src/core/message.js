/**
 * Message Normalizer and Compatibility Layer for WhatsApp
 * Unifies Baileys v7 message structure with GoatBot message helper
 */

const { smsg, parseMention, decodeJid } = require('../utils/myfunc');
const permissions = require('./permissions');
const logger = require('../utils/logger');
const config = require('../config');

async function formatBaileysPayload(content, options = {}) {
  if (typeof content === 'string') {
    return { text: content, ...options };
  }
  if (!content || typeof content !== 'object') {
    return { text: String(content || ''), ...options };
  }

  // Native Baileys payload
  if (content.text || content.image || content.video || content.audio || content.sticker || content.document) {
    return { ...content, ...options };
  }

  // Floppa / GoatBot format with attachment
  if (content.attachment) {
    const att = content.attachment;
    const caption = content.body || content.text || '';

    let buffer = att;
    if (att && typeof att.pipe === 'function') {
      const chunks = [];
      for await (const chunk of att) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    }

    if (Buffer.isBuffer(buffer)) {
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8;
      const isGif = buffer[0] === 0x47 && buffer[1] === 0x49;
      const isWebp = buffer.length > 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
      const isMp4 = buffer.indexOf(Buffer.from('ftyp')) >= 0 && buffer.indexOf(Buffer.from('ftyp')) <= 12;
      const isMp3 = (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0);

      if (isWebp) {
        return { sticker: buffer, ...options };
      } else if (isPng || isJpg || isGif) {
        return { image: buffer, caption, ...options };
      } else if (isMp4) {
        return { video: buffer, caption, ...options };
      } else if (isMp3) {
        return { audio: buffer, mimetype: 'audio/mp4', ptt: false, ...options };
      } else {
        return { document: buffer, mimetype: 'application/octet-stream', fileName: 'file', caption, ...options };
      }
    } else if (typeof att === 'string' && (att.startsWith('http://') || att.startsWith('https://'))) {
      return { image: { url: att }, caption, ...options };
    }
  }

  // Floppa / GoatBot text body format
  if (content.body) {
    return { text: content.body, ...options };
  }

  return { text: JSON.stringify(content, null, 2), ...options };
}

/**
 * Creates the GoatBot-compatible message helper object
 */
function createMessageHelper(sock, m) {
  return {
    async reply(content, arg2, arg3) {
      const callback = typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : null;
      const opts = (typeof arg2 === 'object' && arg2 !== null) ? arg2 : (typeof arg3 === 'object' && arg3 !== null) ? arg3 : {};
      try {
        const payload = await formatBaileysPayload(content, opts);
        const sent = await sock.sendMessage(m.chat, payload, { quoted: m });
        if (callback) {
          callback(null, { messageID: sent?.key?.id, ...sent });
        }
        return sent;
      } catch (err) {
        logger.error('[MESSAGE_REPLY] Error:', err.message);
        if (callback) callback(err, null);
        throw err;
      }
    },

    async send(content, arg2, arg3) {
      const callback = typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : null;
      const opts = (typeof arg2 === 'object' && arg2 !== null) ? arg2 : (typeof arg3 === 'object' && arg3 !== null) ? arg3 : {};
      try {
        const payload = await formatBaileysPayload(content, opts);
        const sent = await sock.sendMessage(m.chat, payload);
        if (callback) {
          callback(null, { messageID: sent?.key?.id, ...sent });
        }
        return sent;
      } catch (err) {
        logger.error('[MESSAGE_SEND] Error:', err.message);
        if (callback) callback(err, null);
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
        const payload = await formatBaileysPayload(content, options);
        return await sock.sendMessage(targetJid, payload);
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
  const isGroup = Boolean(m.isGroup);
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

  const commandManager = require('./command');

  if (text.startsWith(botPrefix)) {
    hasPrefix = true;
    usedPrefix = botPrefix;
    const withoutPrefix = text.slice(botPrefix.length).trim();
    const parts = withoutPrefix.split(/\s+/);
    commandName = (parts[0] || '').toLowerCase();
    args = parts.slice(1);
    commandText = parts.slice(1).join(' ');
  } else {
    // Check if the first word directly matches any command (works in DM and group)
    const parts = text.trim().split(/\s+/);
    const candidate = (parts[0] || '').toLowerCase();
    if (candidate && commandManager.get(candidate)) {
      commandName = candidate;
      args = parts.slice(1);
      commandText = parts.slice(1).join(' ');
      usedPrefix = '';
      hasPrefix = false;
    }
  }

  // Create unified context matching GoatBot V2 event shape
  const context = {
    id: m.id,
    messageID: m.id,
    chat,
    threadID: chat,
    sender,
    senderID: sender,
    participant: m.participant || sender,
    jid: sender,
    isGroup,
    isPrivate,
    isOwner,
    isAdmin,
    isBotAdmin,
    isBotGroupAdmin,
    text,
    body: text,
    command: commandName,
    commandName,
    args,
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
