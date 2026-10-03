/**
 * Message Normalizer and Compatibility Layer for WhatsApp
 * Unifies Baileys v7 message structure with GoatBot message helper
 */

const fs = require('fs-extra');
const path = require('path');
const { smsg, parseMention, decodeJid } = require('../utils/myfunc');
const permissions = require('./permissions');
const logger = require('../utils/logger');
const config = require('../config');

function normalizeMentions(mentions) {
  if (!mentions) return [];
  if (Array.isArray(mentions)) {
    return mentions.map(m => {
      if (typeof m === 'string') {
        const clean = m.trim().replace(/^@/, '');
        return clean.includes('@') ? clean : `${clean}@s.whatsapp.net`;
      }
      if (m && typeof m === 'object' && (m.id || m.tag)) {
        const id = String(m.id || m.tag).trim().replace(/^@/, '');
        return id.includes('@') ? id : `${id}@s.whatsapp.net`;
      }
      return String(m);
    });
  }
  if (typeof mentions === 'object') {
    return Object.keys(mentions).map(m => {
      const clean = m.trim().replace(/^@/, '');
      return clean.includes('@') ? clean : `${clean}@s.whatsapp.net`;
    });
  }
  return [];
}

async function convertAttachmentToPayload(att, caption = '', options = {}) {
  if (!att) return null;

  if (att.image || att.video || att.audio || att.sticker || att.document) {
    const payload = { ...att, ...options };
    if (caption && (payload.image || payload.video || payload.document)) {
      payload.caption = payload.caption || caption;
    }
    return payload;
  }

  let buffer = null;
  let extHint = '';

  if (typeof att.pipe === 'function') {
    if (att.path && typeof att.path === 'string') {
      extHint = path.extname(att.path).toLowerCase();
    }
    const chunks = [];
    for await (const chunk of att) {
      chunks.push(chunk);
    }
    buffer = Buffer.concat(chunks);
  } else if (Buffer.isBuffer(att)) {
    buffer = att;
  } else if (typeof att === 'string') {
    if (att.startsWith('http://') || att.startsWith('https://')) {
      const lower = att.toLowerCase().split('?')[0];
      if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.mkv')) {
        return { video: { url: att }, caption, ...options };
      } else if (lower.endsWith('.mp3') || lower.endsWith('.ogg') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.opus')) {
        return { audio: { url: att }, mimetype: options.mimetype || 'audio/mp4', ptt: Boolean(options.ptt), ...options };
      } else if (lower.endsWith('.webp')) {
        return { sticker: { url: att }, ...options };
      } else {
        return { image: { url: att }, caption, ...options };
      }
    } else if (fs.existsSync(att)) {
      extHint = path.extname(att).toLowerCase();
      buffer = await fs.readFile(att);
    }
  } else if (typeof att === 'object') {
    if (att.url) {
      const lower = String(att.url).toLowerCase().split('?')[0];
      const type = att.type || (lower.endsWith('.mp4') ? 'video' : lower.endsWith('.mp3') || lower.endsWith('.ogg') ? 'audio' : lower.endsWith('.webp') ? 'sticker' : 'image');
      if (type === 'video') return { video: { url: att.url }, caption: caption || att.caption || '', mimetype: att.mimetype || 'video/mp4', ...options };
      if (type === 'audio' || type === 'ptt') return { audio: { url: att.url }, mimetype: att.mimetype || 'audio/ogg; codecs=opus', ptt: Boolean(att.ptt || type === 'ptt' || options.ptt), ...options };
      if (type === 'sticker') return { sticker: { url: att.url }, ...options };
      return { image: { url: att.url }, caption: caption || att.caption || '', mimetype: att.mimetype || 'image/jpeg', ...options };
    }
    if (att.buffer && Buffer.isBuffer(att.buffer)) {
      buffer = att.buffer;
    } else if (att.stream && typeof att.stream.pipe === 'function') {
      const chunks = [];
      for await (const chunk of att.stream) { chunks.push(chunk); }
      buffer = Buffer.concat(chunks);
    } else if (att.path && fs.existsSync(att.path)) {
      buffer = await fs.readFile(att.path);
      extHint = path.extname(att.path).toLowerCase();
    }
  }

  if (Buffer.isBuffer(buffer)) {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49;
    const isWebp = buffer.length > 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    const isMp4 = buffer.indexOf(Buffer.from('ftyp')) >= 0 && buffer.indexOf(Buffer.from('ftyp')) <= 16;
    const isMp3 = (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0);
    const isOgg = buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53;
    const isWav = buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WAVE';

    if (isWebp || extHint === '.webp') {
      return { sticker: buffer, ...options };
    } else if (isPng || isJpg || isGif || extHint === '.png' || extHint === '.jpg' || extHint === '.jpeg' || extHint === '.gif') {
      return { image: buffer, caption, ...options };
    } else if (isMp4 || extHint === '.mp4' || extHint === '.mov' || extHint === '.webm') {
      return { video: buffer, caption, ...options };
    } else if (isMp3 || isOgg || isWav || extHint === '.mp3' || extHint === '.ogg' || extHint === '.wav' || extHint === '.m4a' || extHint === '.opus') {
      const isVoice = Boolean(options.ptt || isOgg || extHint === '.ogg' || extHint === '.opus');
      return { audio: buffer, mimetype: options.mimetype || (isVoice ? 'audio/ogg; codecs=opus' : 'audio/mp4'), ptt: isVoice, ...options };
    } else {
      return { document: buffer, mimetype: options.mimetype || 'application/octet-stream', fileName: options.fileName || 'file', caption, ...options };
    }
  }

  return null;
}

async function formatBaileysPayload(content, options = {}) {
  const mergedOptions = { ...options };
  const mentions = normalizeMentions(content?.mentions || options?.mentions);
  if (mentions.length > 0) {
    mergedOptions.mentions = mentions;
  }

  if (typeof content === 'string') {
    return { text: content, ...mergedOptions };
  }
  if (!content || typeof content !== 'object') {
    return { text: String(content || ''), ...mergedOptions };
  }

  // Native Baileys payload
  if (content.text || content.image || content.video || content.audio || content.sticker || content.document) {
    return { ...content, ...mergedOptions };
  }

  // Floppa / GoatBot format with single attachment
  if (content.attachment) {
    const caption = content.body || content.text || '';
    const attPayload = await convertAttachmentToPayload(content.attachment, caption, mergedOptions);
    if (attPayload) return attPayload;
  }

  // Floppa / GoatBot text body format
  if (content.body) {
    return { text: content.body, ...mergedOptions };
  }

  return { text: JSON.stringify(content, null, 2), ...mergedOptions };
}

/**
 * Creates the GoatBot-compatible message helper object
 */
function createMessageHelper(sock, m) {
  return {
    async sendTo(targetChat, content, arg2, arg3) {
      const callback = typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : null;
      const opts = (typeof arg2 === 'object' && arg2 !== null) ? arg2 : (typeof arg3 === 'object' && arg3 !== null) ? arg3 : {};
      const dest = targetChat || m.chat;

      try {
        // Multi-attachment support (Promise.all sequence)
        if (content && typeof content === 'object' && Array.isArray(content.attachment) && content.attachment.length > 0) {
          const atts = content.attachment;
          const caption = content.body || content.text || '';
          const results = [];
          const sendOpts = opts.quoted ? { quoted: opts.quoted } : {};

          for (let i = 0; i < atts.length; i++) {
            const cap = i === 0 ? caption : '';
            const payload = await convertAttachmentToPayload(atts[i], cap, opts);
            if (payload) {
              const sent = await sock.sendMessage(dest, payload, sendOpts);
              results.push(sent);
            }
          }
          const primary = results[0] || null;
          const ret = { messageID: primary?.key?.id, ...primary, results };
          if (callback) callback(null, ret);
          return primary;
        }

        const payload = await formatBaileysPayload(content, opts);
        const sendOpts = opts.quoted ? { quoted: opts.quoted } : {};
        const sent = await sock.sendMessage(dest, payload, sendOpts);
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

    async reply(content, arg2, arg3) {
      const callback = typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : null;
      const opts = (typeof arg2 === 'object' && arg2 !== null) ? arg2 : (typeof arg3 === 'object' && arg3 !== null) ? arg3 : {};
      return this.sendTo(m.chat, content, { quoted: m, ...opts }, callback);
    },

    async send(content, arg2, arg3) {
      return this.sendTo(m.chat, content, arg2, arg3);
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

  // Mentions dictionary & array compatibility
  const mentionsObj = {};
  for (const jid of (m.mentionedJid || [])) {
    const clean = String(jid).split('@')[0];
    mentionsObj[jid] = `@${clean}`;
    mentionsObj[clean] = `@${clean}`;
  }

  // Populate messageReply if quoted message exists
  let messageReply = null;
  if (m.quoted) {
    const qSender = m.quoted.sender || '';
    const qClean = qSender.split('@')[0];
    const qMtype = m.quoted.mtype || '';
    const isImg = qMtype === 'imageMessage' || !!m.quoted.imageMessage;
    const isVid = qMtype === 'videoMessage' || !!m.quoted.videoMessage;
    const isAud = qMtype === 'audioMessage' || !!m.quoted.audioMessage;
    const isStk = qMtype === 'stickerMessage' || !!m.quoted.stickerMessage;
    const isDoc = qMtype === 'documentMessage' || !!m.quoted.documentMessage;

    const qAttachments = [];
    if (isImg || isVid || isAud || isStk || isDoc) {
      let buf = null;
      let tmpPath = null;
      try {
        if (typeof m.quoted.download === 'function') {
          buf = await m.quoted.download().catch(() => null);
        } else if (typeof sock.downloadMediaMessage === 'function') {
          buf = await sock.downloadMediaMessage(m.quoted).catch(() => null);
        }
        if (buf && Buffer.isBuffer(buf)) {
          const ext = isImg ? 'jpg' : isVid ? 'mp4' : isAud ? 'mp3' : isStk ? 'webp' : 'bin';
          const cacheDir = path.resolve(process.cwd(), 'cache');
          await fs.ensureDir(cacheDir);
          tmpPath = path.join(cacheDir, `q_${m.quoted.id || Date.now()}.${ext}`);
          await fs.writeFile(tmpPath, buf).catch(() => {});
        }
      } catch (_) {}

      qAttachments.push({
        type: isImg ? 'photo' : isVid ? 'video' : isAud ? 'audio' : isStk ? 'sticker' : 'file',
        url: tmpPath || '',
        path: tmpPath || '',
        buffer: buf,
        mimetype: m.quoted.mimetype || (isImg ? 'image/jpeg' : isVid ? 'video/mp4' : isAud ? 'audio/mp4' : isStk ? 'image/webp' : 'application/octet-stream'),
        download: async () => buf,
        raw: m.quoted
      });
    }

    messageReply = {
      messageID: m.quoted.id,
      id: m.quoted.id,
      senderID: qSender,
      userID: qClean,
      actorFbId: qClean,
      body: m.quoted.text || '',
      text: m.quoted.text || '',
      attachments: qAttachments,
      mtype: qMtype,
      raw: m.quoted
    };
  }

  // Populate current message attachments
  const currentAttachments = [];
  const curMtype = m.mtype || '';
  const isCurImg = curMtype === 'imageMessage';
  const isCurVid = curMtype === 'videoMessage';
  const isCurAud = curMtype === 'audioMessage';
  const isCurStk = curMtype === 'stickerMessage';
  const isCurDoc = curMtype === 'documentMessage';

  if (isCurImg || isCurVid || isCurAud || isCurStk || isCurDoc) {
    let buf = null;
    let tmpPath = null;
    try {
      if (typeof sock.downloadMediaMessage === 'function') {
        buf = await sock.downloadMediaMessage(m).catch(() => null);
        if (buf && Buffer.isBuffer(buf)) {
          const ext = isCurImg ? 'jpg' : isCurVid ? 'mp4' : isCurAud ? 'mp3' : isCurStk ? 'webp' : 'bin';
          const cacheDir = path.resolve(process.cwd(), 'cache');
          await fs.ensureDir(cacheDir);
          tmpPath = path.join(cacheDir, `cur_${m.id || Date.now()}.${ext}`);
          await fs.writeFile(tmpPath, buf).catch(() => {});
        }
      }
    } catch (_) {}

    currentAttachments.push({
      type: isCurImg ? 'photo' : isCurVid ? 'video' : isCurAud ? 'audio' : isCurStk ? 'sticker' : 'file',
      url: tmpPath || '',
      path: tmpPath || '',
      buffer: buf,
      mimetype: m.msg?.mimetype || (isCurImg ? 'image/jpeg' : isCurVid ? 'video/mp4' : isCurAud ? 'audio/mp4' : isCurStk ? 'image/webp' : 'application/octet-stream'),
      download: async () => buf,
      raw: m
    });
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
    messageReply,
    attachments: currentAttachments,
    mentions: mentionsObj,
    mentionedJid: m.mentionedJid || [],
    type: m.quoted ? 'message_reply' : 'message',
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
