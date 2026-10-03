/**
 * Gemini Command - Google Gemini model query
 */

const apiService = require('../../../src/services/apiService');

module.exports = {
  name: 'gemini',
  aliases: ['bard'],
  category: 'ai',
  description: 'Query Google Gemini AI model',
  usage: '{p}gemini <prompt>',

  async execute(sock, msg, args, extra) {
    const { message, sender } = extra;
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return await message.reply('🌟 What would you like to ask Google Gemini?\nExample: *!gemini Explain quantum computing simply.*');
    }

    try {
      await message.typing(2000);
      const answer = await apiService.getAiResponse(prompt, sender.split('@')[0]);
      await message.reply(answer);
    } catch (err) {
      await message.reply(`❌ Gemini Error: ${err.message}`);
    }
  }
};
