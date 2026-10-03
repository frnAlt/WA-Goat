const path = require('path');
const config = require('../../../src/config');
const stickerService = require('../../../src/services/stickerService');
const mediaService = require('../../../src/services/mediaService');

module.exports = {
  config: {
    name: "sticker",
    aliases: ["s", "stik", "stick"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Convert image, video or GIF to WhatsApp sticker"
    },
    longDescription: {
      en: "Convert replied image or video into a custom WebP sticker with optional pack/author name"
    },
    category: "media",
    guide: {
      en: "{pn} [packname|author] (reply to image/video or attach caption)"
    }
  },

  onStart: async function ({ sock, message, args, event }) {
    const rawSock = sock || event.sock;
    const m = event.m || event.raw;
    const quoted = event.quoted || event.messageReply;

    let target = null;
    if (m?.mtype === 'imageMessage' || m?.mtype === 'videoMessage') {
      target = m;
    } else if (quoted && (quoted.mtype === 'imageMessage' || quoted.mtype === 'videoMessage')) {
      target = quoted.raw || quoted;
    } else if (event.attachments && event.attachments.length > 0) {
      target = event.attachments[0];
    }

    if (!target) {
      return message.reply('📸 Please send or reply to an image or short video (max 7s) with *!sticker*.');
    }

    try {
      let buffer = null;
      if (target.buffer && Buffer.isBuffer(target.buffer)) {
        buffer = target.buffer;
      } else if (target.path && require('fs').existsSync(target.path)) {
        buffer = await require('fs-extra').readFile(target.path);
      } else {
        buffer = await mediaService.downloadMedia(target);
      }

      const isVideo = target.mtype === 'videoMessage' || target.type === 'video';
      let packname = config.botName || 'Goat Bot V2';
      let author = config.ownerName || 'frnAlt';

      if (args && args.length > 0) {
        const fullArgs = args.join(' ');
        if (fullArgs.includes('|')) {
          const parts = fullArgs.split('|');
          packname = parts[0].trim();
          author = parts[1].trim();
        } else {
          packname = fullArgs.trim();
        }
      }

      const stickerBuffer = await stickerService.createSticker(buffer, isVideo, { packname, author });
      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(event.threadID || event.chat, { sticker: stickerBuffer }, { quoted: m });
      } else {
        await message.reply({ attachment: stickerBuffer });
      }
    } catch (err) {
      return message.reply(`❌ Failed to create sticker: ${err.message}`);
    }
  }
};
