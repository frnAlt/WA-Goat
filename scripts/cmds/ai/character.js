/**
 * Character Command - AI Persona Roleplay
 */

const apiService = require('../../../src/services/apiService');

const PERSONAS = {
  yoda: 'Speak as Master Yoda from Star Wars. Invert sentence structures and use wisdom.',
  ramsay: 'Speak as Chef Gordon Ramsay. Be passionate, sarcastic, and dramatic about food and perfection.',
  sherlock: 'Speak as Sherlock Holmes. Be analytical, observant, logical, and slightly aloof.',
  anime: 'Speak as an enthusiastic anime waifu/protagonist, cute and spirited, with cheerful expressions.',
  pirate: 'Speak like a 17th century pirate captain on the high seas. Ahoy, matey!'
};

module.exports = {
  name: 'character',
  aliases: ['persona', 'roleplay'],
  category: 'ai',
  description: 'Roleplay chat with famous characters (yoda, ramsay, sherlock, anime, pirate)',
  usage: '{p}character <character> <message>',

  async execute(sock, msg, args, extra) {
    const { message } = extra;
    const charName = (args[0] || '').toLowerCase();
    const prompt = args.slice(1).join(' ').trim();

    if (!PERSONAS[charName] || !prompt) {
      const list = Object.keys(PERSONAS).join(', ');
      return await message.reply(`🎭 Available characters: *${list}*\n\nUsage: *!character <name> <message>*\nExample: *!character yoda what is the force?*`);
    }

    try {
      await message.typing(2000);
      const personaInstruction = PERSONAS[charName];
      const reply = await apiService.getAiResponse(`[System Instruction: ${personaInstruction}] User says: ${prompt}`);
      await message.reply(`🎭 *[${charName.toUpperCase()}]:*\n${reply}`);
    } catch (err) {
      await message.reply(`❌ Character Error: ${err.message}`);
    }
  }
};
