/**
 * SImage Command - Convert sticker back into image
 */

const mediaService = require('../../services/mediaService');
const stickerService = require('../../services/stickerService');

module.exports = {
  name: 'simage',
  aliases: ['toimg', 'stickertoimg'],
  category: 'media',
  description: 'Convert a sticker into a normal picture image',
  usage: '{p}simage (reply to a sticker)',

  async execute(sock, msg, args, extra) {
    const { quoted, message } = extra;

    if (!quoted || quoted.mtype !== 'stickerMessage') {
      return await message.reply('⚠️ Please reply to a static or animated sticker with *!simage*.');
    }

    try {
      const buffer = await mediaService.downloadMedia(quoted);
      const imgBuffer = await stickerService.stickerToImage(buffer);
      await sock.sendMessage(extra.chat, { image: imgBuffer, caption: '✅ Here is your converted image.' }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to convert sticker to image: ${err.message}`);
    }
  }
};
