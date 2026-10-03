const axios = require('axios');

module.exports = {
  config: {
    name: "ttp",
    aliases: ["textsticker", "ttpsticker"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Generate a plain text sticker"
    },
    longDescription: {
      en: "Converts text into a static WhatsApp text sticker"
    },
    category: "media",
    guide: {
      en: "{pn} <text>\nExample: {pn} Hi there"
    }
  },

  onStart: async function ({ sock, message, args, event }) {
    const text = args.join(' ').trim();
    if (!text) {
      return message.reply('⚠️ Please provide the text to convert into a sticker.\nExample: *!ttp Hello*');
    }

    const rawSock = sock || event.sock;
    const dest = event.threadID || event.chat;

    try {
      const url = `https://api.lolhuman.xyz/api/ttp?apikey=GataDios&text=${encodeURIComponent(text)}`;
      let res;
      try {
        res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      } catch (_) {
        const fallbackUrl = `https://api.erdwpe.com/api/maker/ttp?text=${encodeURIComponent(text)}`;
        res = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 10000 });
      }

      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(dest, { sticker: Buffer.from(res.data) }, { quoted: event.m || event.raw });
      } else {
        await message.reply({ attachment: Buffer.from(res.data) });
      }
    } catch (err) {
      return message.reply(`❌ Failed to generate text sticker: ${err.message}`);
    }
  }
};
