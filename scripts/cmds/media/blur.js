/**
 * Blur Command - Apply blur effect to an image
 */

const mediaService = require('../../../src/services/mediaService');
const { Jimp } = require('jimp');

module.exports = {
  name: 'blur',
  aliases: ['imgblur'],
  category: 'media',
  description: 'Blur a replied or attached image',
  usage: '{p}blur [radius 1-20]',

  async execute(sock, msg, args, extra) {
    const { m, quoted, message } = extra;
    let target = null;

    if (m.mtype === 'imageMessage') target = m;
    else if (quoted && quoted.mtype === 'imageMessage') target = quoted;

    if (!target) {
      return await message.reply('📸 Please send or reply to an image to blur.');
    }

    try {
      const buffer = await mediaService.downloadMedia(target);
      const radius = Math.min(20, Math.max(1, parseInt(args[0] || '8', 10)));

      const image = await Jimp.read(buffer);
      image.blur(radius);
      const blurredBuffer = await image.getBuffer('image/jpeg');

      await sock.sendMessage(extra.chat, { image: blurredBuffer, caption: '✅ Image blurred successfully.' }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to blur image: ${err.message}`);
    }
  }
};
