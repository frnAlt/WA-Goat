/**
 * ShortURL Command - Shorten URLs via TinyURL
 */

const apiService = require('../../services/apiService');

module.exports = {
  name: 'shorturl',
  aliases: ['tinyurl', 'shorten'],
  category: 'utility',
  description: 'Shorten any long URL into a clean tiny link',
  usage: '{p}shorturl <url>',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const url = args[0];

    if (!url || !/^https?:\/\//i.test(url)) {
      return await message.reply('⚠️ Please provide a valid URL starting with http:// or https://');
    }

    try {
      const short = await apiService.shortenUrl(url);
      await message.reply(`🔗 *Shortened Link:*\n${short}`);
    } catch (err) {
      await message.reply(`❌ Failed to shorten URL: ${err.message}`);
    }
  }
};
