const axios = require('axios');

module.exports = {
  config: {
    name: "attp",
    aliases: ["animtext", "attpsticker"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate an animated rainbow text sticker"
    },
    longDescription: {
      en: "Converts specified text into an animated color-cycling WhatsApp sticker"
    },
    category: "media",
    guide: {
      en: "{pn} <text>\nExample: {pn} Hello World"
    }
  },

  onStart: async function ({ sock, message, args, event }) {
    const text = args.join(' ').trim();
    if (!text) {
      return message.reply('⚠️ Please provide the text to convert into an animated sticker.\nExample: *!attp Hello*');
    }

    const rawSock = sock || event.sock;
    const dest = event.threadID || event.chat;

    try {
      const url = `https://api.lolhuman.xyz/api/attp?apikey=GataDios&text=${encodeURIComponent(text)}`;
      let res;
      try {
        res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      } catch (_) {
        const fallbackUrl = `https://api.erdwpe.com/api/maker/attp?text=${encodeURIComponent(text)}`;
        res = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });
      }

      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(dest, { sticker: Buffer.from(res.data) }, { quoted: event.m || event.raw });
      } else {
        await message.reply({ attachment: Buffer.from(res.data) });
      }
    } catch (err) {
      return message.reply(`❌ Failed to generate animated text sticker: ${err.message}`);
    }
  }
};
