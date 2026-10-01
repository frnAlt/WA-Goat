/**
 * AI Command - Conversational Assistant with Context
 */

const apiService = require('../../services/apiService');

module.exports = {
  name: 'ai',
  aliases: ['bot', 'ask', 'chat'],
  category: 'ai',
  description: 'Chat with Goat Bot AI assistant',
  usage: '{p}ai <your question or prompt>',

  async execute(sock, msg, args, extra) {
    const { message, sender } = extra;
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return await message.reply('🤖 Hello! Ask me anything.\nExample: *!ai How do airplanes fly?*');
    }

    try {
      await message.typing(2000);
      const uName = sender.split('@')[0];
      const response = await apiService.getAiResponse(prompt, uName);
      await message.reply(response);
    } catch (err) {
      await message.reply(`❌ AI Error: ${err.message}`);
    }
  }
};
