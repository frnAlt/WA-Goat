const mediaService = require('../../../src/services/mediaService');
const stickerService = require('../../../src/services/stickerService');

module.exports = {
  config: {
    name: "simage",
    aliases: ["toimg", "stickertoimg"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Convert sticker into an image"
    },
    longDescription: {
      en: "Convert replied sticker back into a normal picture image"
    },
    category: "media",
    guide: {
      en: "{pn} (reply to a sticker)"
    }
  },

  onStart: async function ({ sock, message, event }) {
    const rawSock = sock || event.sock;
    const quoted = event.quoted || event.messageReply;

    if (!quoted || (quoted.mtype !== 'stickerMessage' && quoted.type !== 'sticker')) {
      return message.reply('⚠️ Please reply to a static sticker with *!simage*.');
    }

    try {
      const buffer = await mediaService.downloadMedia(quoted.raw || quoted);
      const imgBuffer = await stickerService.stickerToImage(buffer);
      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(event.threadID || event.chat, { image: imgBuffer, caption: '✅ Here is your converted image.' }, { quoted: event.m || event.raw });
      } else {
        await message.reply({ attachment: imgBuffer });
      }
    } catch (err) {
      return message.reply(`❌ Failed to convert sticker to image: ${err.message}`);
    }
  }
};
