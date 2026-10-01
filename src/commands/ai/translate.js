/**
 * Translate Command - Multi-language translation
 */

const axios = require('axios');

module.exports = {
  name: 'translate',
  aliases: ['tr', 'trans'],
  category: 'ai',
  description: 'Translate text between languages',
  usage: '{p}translate <lang_code> <text> (or reply to a message)',

  async execute(sock, msg, args, extra) {
    const { quoted, message } = extra;
    let targetLang = args[0] ? args[0].toLowerCase() : 'en';
    let textToTranslate = args.slice(1).join(' ').trim();

    if (!textToTranslate && quoted && quoted.text) {
      textToTranslate = quoted.text;
    }

    if (!textToTranslate) {
      return await message.reply('🌐 Please provide text to translate or reply to a message.\nExample: *!translate es Hello my friend*');
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const res = await axios.get(url, { timeout: 6000 });
      const translated = res.data[0].map(item => item[0]).join('');

      await message.reply(`🌐 *TRANSLATION [${targetLang.toUpperCase()}]:*\n${translated}`);
    } catch (err) {
      await message.reply(`❌ Translation error: ${err.message}`);
    }
  }
};
