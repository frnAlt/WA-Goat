/**
 * Meme Command - Fetch top memes from reddit/public API
 */

const axios = require('axios');

module.exports = {
  name: 'meme',
  aliases: ['memes'],
  category: 'fun',
  description: 'Get a fresh random meme from Reddit',
  usage: '{p}meme',

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    try {
      const res = await axios.get('https://meme-api.com/gimme', { timeout: 8000 });
      const meme = res.data;

      if (!meme.url) throw new Error('No meme image returned');

      await sock.sendMessage(chat, {
        image: { url: meme.url },
        caption: `😂 *${meme.title}*\nSubreddit: r/${meme.subreddit} | Upvotes: 👍 ${meme.ups}`
      }, { quoted: msg });
    } catch (err) {
      await message.reply(`❌ Could not fetch meme: ${err.message}`);
    }
  }
};
