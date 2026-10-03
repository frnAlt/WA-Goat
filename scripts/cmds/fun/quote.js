/**
 * Quote Command - Random inspirational quotes
 */

const apiService = require('../../../src/services/groupService');

module.exports = {
  name: 'quote',
  aliases: ['inspiration', 'wisdom'],
  category: 'fun',
  description: 'Get an inspirational or thought-provoking quote',
  usage: '{p}quote',

  async execute(sock, msg, args, extra) {
    const quote = await apiService.getQuote();
    await extra.message.reply(`📜 *QUOTE OF THE MOMENT:*\n\n${quote}`);
  }
};
