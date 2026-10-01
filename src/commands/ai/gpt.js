/**
 * GPT Command - General knowledge and writing assistant
 */

const apiService = require('../../services/apiService');

module.exports = {
  name: 'gpt',
  aliases: ['chatgpt', 'openai'],
  category: 'ai',
  description: 'Query GPT language model for coding, writing, and questions',
  usage: '{p}gpt <query>',

  async execute(sock, msg, args, extra) {
    const { message, sender } = extra;
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return await message.reply('🤖 Please provide a question or topic for GPT.\nExample: *!gpt Write a poem about coding.*');
    }

    try {
      await message.typing(2000);
      const answer = await apiService.getAiResponse(`You are GPT, a helpful assistant. ${prompt}`, sender.split('@')[0]);
      await message.reply(answer);
    } catch (err) {
      await message.reply(`❌ GPT Error: ${err.message}`);
    }
  }
};
