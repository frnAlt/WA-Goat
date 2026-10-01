/**
 * ATTP Command - Animated text to sticker
 */

const axios = require('axios');

module.exports = {
  name: 'attp',
  aliases: ['animtext'],
  category: 'media',
  description: 'Generate an animated rainbow text sticker',
  usage: '{p}attp <text>',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const text = args.join(' ').trim();

    if (!text) {
      return await message.reply('⚠️ Please provide the text to convert into an animated sticker.\nExample: *!attp Hello*');
    }

    try {
      const url = `https://api.lolhuman.xyz/api/attp?apikey=GataDios&text=${encodeURIComponent(text)}`;
      let res;
      try {
        res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      } catch (_) {
        // Fallback endpoint
        const fallbackUrl = `https://api.erdwpe.com/api/maker/attp?text=${encodeURIComponent(text)}`;
        res = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });
      }

      await sock.sendMessage(extra.chat, { sticker: Buffer.from(res.data) }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Failed to generate animated text sticker: ${err.message}`);
    }
  }
};
