/**
 * TTP Command - Text to sticker
 */

const axios = require('axios');
const stickerService = require('../../services/stickerService');

module.exports = {
  name: 'ttp',
  aliases: ['textsticker'],
  category: 'media',
  description: 'Generate a text sticker',
  usage: '{p}ttp <text>',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const text = args.join(' ').trim();

    if (!text) {
      return await message.reply('⚠️ Please provide the text to convert into a sticker.\nExample: *!ttp Goat Bot*');
    }

    try {
      const url = `https://api.lolhuman.xyz/api/ttp?apikey=GataDios&text=${encodeURIComponent(text)}`;
      let buffer;
      try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        buffer = Buffer.from(res.data);
      } catch (_) {
        const fallbackUrl = `https://api.erdwpe.com/api/maker/ttp?text=${encodeURIComponent(text)}`;
        const res = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });
        buffer = Buffer.from(res.data);
      }

      const sticker = await stickerService.createSticker(buffer, false);
      await sock.sendMessage(extra.chat, { sticker }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to generate text sticker: ${err.message}`);
    }
  }
};
