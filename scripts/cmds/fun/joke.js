/**
 * Joke Command - Get funny jokes
 */

const apiService = require('../../../src/services/groupService');

module.exports = {
  name: 'joke',
  aliases: ['dadjoke', 'funny'],
  category: 'fun',
  description: 'Get a random funny joke',
  usage: '{p}joke',

  async execute(sock, msg, args, extra) {
    const joke = await apiService.getJoke();
    await extra.message.reply(`🤣 *JOKE TIME:*\n\n${joke}`);
  }
};
