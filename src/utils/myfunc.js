/**
 * Baileys and WhatsApp Serialization Utilities
 * Derived from KnightBot-MD / Baileys with additions for Goat Bot V2
 */

const { proto, getContentType, jidDecode } = require('@whiskeysockets/baileys');
const axios = require('axios');
const moment = require('moment-timezone');
const util = require('util');

function decodeJid(jid) {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {};
    return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
  }
  return jid;
}

function parseMention(text = '') {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => `${v[1]}@s.whatsapp.net`);
}

function getGroupAdmins(participants = []) {
  const admins = [];
  for (const p of participants) {
    if (p.admin === 'admin' || p.admin === 'superadmin') {
      admins.push(p.id);
    }
  }
  return admins;
}

function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function getBuffer(url, options = {}) {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1,
        ...options.headers
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return Buffer.from(res.data);
  } catch (err) {
    throw err;
  }
}

/**
 * Serialize Baileys message object
 */
function smsg(sock, m, store) {
  if (!m) return m;
  const M = proto.WebMessageInfo;

  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id && (m.id.startsWith('BAE5') || m.id.length === 16);
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = decodeJid(m.fromMe ? sock.user?.id : m.participant || m.key.participant || m.chat || '');
    if (m.isGroup) m.participant = decodeJid(m.key.participant) || '';
  }

  if (m.message) {
    // Unwrap ephemeral, viewOnce, and other container wrappers
    if (m.message.ephemeralMessage) {
      m.message = m.message.ephemeralMessage.message;
    }
    if (m.message.viewOnceMessage) {
      m.message = m.message.viewOnceMessage.message;
    }
    if (m.message.viewOnceMessageV2) {
      m.message = m.message.viewOnceMessageV2.message;
    }
    if (m.message.documentWithCaptionMessage) {
      m.message = m.message.documentWithCaptionMessage.message;
    }
    if (m.message.editedMessage) {
      m.message = m.message.editedMessage.message?.protocolMessage?.editedMessage || m.message.editedMessage.message;
    }

    m.mtype = getContentType(m.message);
    m.msg = (m.mtype === 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
    
    // Extract text content safely
    m.body = m.message.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) ||
      (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId) ||
      (m.mtype === 'templateButtonReplyMessage' && m.msg?.selectedId) ||
      '';

    const quoted = m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
    m.mentionedJid = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid || [] : [];

    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type] || m.quoted;
      if (typeof m.quoted === 'string') {
        m.quoted = { text: m.quoted };
      }
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? (m.quoted.id.startsWith('BAE5') || m.quoted.id.length === 16) : false;
      m.quoted.sender = decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === (sock.user && decodeJid(sock.user.id));
      m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || '';
      m.quoted.mentionedJid = m.msg.contextInfo.mentionedJid || [];
      
      const vM = m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
      });

      m.quoted.delete = () => sock.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.download = () => sock.downloadMediaMessage(m.quoted);
    }
  }

  m.text = m.body || '';

  // Reply helper
  m.reply = async (text, chatId = m.chat, options = {}) => {
    if (typeof text === 'string') {
      return sock.sendMessage(chatId, { text, ...options }, { quoted: m });
    }
    return sock.sendMessage(chatId, { ...text, ...options }, { quoted: m });
  };

  m.react = async (emoji) => {
    return sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
  };

  return m;
}

module.exports = {
  decodeJid,
  parseMention,
  getGroupAdmins,
  bytesToSize,
  getBuffer,
  smsg
};
