/**
 * Sticker Command - Convert image, video, or GIF to WebP sticker
 */

const mediaService = require('../../services/mediaService');
const stickerService = require('../../services/stickerService');
const config = require('../../config');

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stik', 'stick'],
  category: 'media',
  description: 'Convert an image or short video into a WhatsApp sticker',
  usage: '{p}sticker [packname|author] (reply to image/video or attach caption)',

  async execute(sock, msg, args, extra) {
    const { m, quoted, message } = extra;
    let target = null;

    if (m.mtype === 'imageMessage' || m.mtype === 'videoMessage') {
      target = m;
    } else if (quoted && (quoted.mtype === 'imageMessage' || quoted.mtype === 'videoMessage')) {
      target = quoted;
    }

    if (!target) {
      return await message.reply('📸 Please send or reply to an image or short video (max 7s) with *!sticker*.');
    }

    try {
      const buffer = await mediaService.downloadMedia(target);
      const isVideo = target.mtype === 'videoMessage';

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

      const stickerBuffer = await stickerService.createSticker(buffer, isVideo, { packname, author });
      await sock.sendMessage(extra.chat, { sticker: stickerBuffer }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to create sticker: ${err.message}`);
    }
  }
};
