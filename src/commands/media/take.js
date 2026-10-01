/**
 * Take Command - Steal and customize sticker packname and author
 */

const mediaService = require('../../services/mediaService');
const stickerService = require('../../services/stickerService');
const config = require('../../config');

module.exports = {
  name: 'take',
  aliases: ['steal', 'wm', 'rename'],
  category: 'media',
  description: 'Change the packname and author watermark of a replied sticker',
  usage: '{p}take <packname>|<author>',

  async execute(sock, msg, args, extra) {
    const { quoted, message } = extra;

    if (!quoted || quoted.mtype !== 'stickerMessage') {
      return await message.reply('⚠️ Please reply to a sticker with *!take <packname>|<author>*.');
    }

    let packname = config.botName;
    let author = config.ownerName;

    if (args.length > 0) {
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
      const buffer = await mediaService.downloadMedia(quoted);
      const newSticker = await stickerService.modifyPack(buffer, packname, author);
      await sock.sendMessage(extra.chat, { sticker: newSticker }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to update sticker metadata: ${err.message}`);
    }
  }
};
