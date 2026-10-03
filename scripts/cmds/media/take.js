const mediaService = require('../../../src/services/mediaService');
const stickerService = require('../../../src/services/stickerService');
const config = require('../../../src/config');

module.exports = {
  config: {
    name: "take",
    aliases: ["steal", "wm", "rename"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Change packname and author of a sticker"
    },
    longDescription: {
      en: "Change the packname and author watermark of a replied WhatsApp sticker"
    },
    category: "media",
    guide: {
      en: "{pn} <packname>|<author> (reply to a sticker)"
    }
  },

  onStart: async function ({ sock, message, args, event }) {
    const rawSock = sock || event.sock;
    const quoted = event.quoted || event.messageReply;

    if (!quoted || (quoted.mtype !== 'stickerMessage' && quoted.type !== 'sticker')) {
      return message.reply('⚠️ Please reply to a sticker with *!take <packname>|<author>*.');
    }

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

    try {
      const buffer = await mediaService.downloadMedia(quoted.raw || quoted);
      const newSticker = await stickerService.modifyPack(buffer, packname, author);
      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(event.threadID || event.chat, { sticker: newSticker }, { quoted: event.m || event.raw });
      } else {
        await message.reply({ attachment: newSticker });
      }
    } catch (err) {
      return message.reply(`❌ Failed to update sticker metadata: ${err.message}`);
    }
  }
};
