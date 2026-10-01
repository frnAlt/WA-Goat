/**
 * Fact Command - Random interesting facts
 */

const apiService = require('../../services/apiService');

module.exports = {
  name: 'fact',
  aliases: ['didyouknow', 'funfact'],
  category: 'fun',
  description: 'Get an interesting random fact',
  usage: '{p}fact',

  async execute(sock, msg, args, extra) {
    const fact = await apiService.getFact();
    await extra.message.reply(`💡 *DID YOU KNOW?*\n\n${fact}`);
  }
};
