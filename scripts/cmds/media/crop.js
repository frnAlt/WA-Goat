/**
 * Crop Command - Crop image into a square sticker
 */

const mediaService = require('../../../src/services/mediaService');
const stickerService = require('../../../src/services/stickerService');
const { Jimp } = require('jimp');

module.exports = {
  name: 'crop',
  aliases: ['stickercrop', 'scrop'],
  category: 'media',
  description: 'Crop an image into a 1:1 square sticker',
  usage: '{p}crop (reply to image)',

  async execute(sock, msg, args, extra) {
    const { m, quoted, message } = extra;
    let target = null;

    if (m.mtype === 'imageMessage') target = m;
    else if (quoted && quoted.mtype === 'imageMessage') target = quoted;

    if (!target) {
      return await message.reply('📸 Please send or reply to an image to crop into a square sticker.');
    }

    try {
      const buffer = await mediaService.downloadMedia(target);
      const img = await Jimp.read(buffer);
      const size = Math.min(img.width, img.height);
      const x = Math.floor((img.width - size) / 2);
      const y = Math.floor((img.height - size) / 2);

      img.crop({ x, y, w: size, h: size });
      const croppedBuffer = await img.getBuffer('image/jpeg');

      const sticker = await stickerService.createSticker(croppedBuffer, false);
      await sock.sendMessage(extra.chat, { sticker }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to crop image: ${err.message}`);
    }
  }
};
