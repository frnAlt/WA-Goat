/**
 * UnbanChat Command - Unban a group thread
 */

const database = require('../../../src/database');

module.exports = {
  name: 'unbanchat',
  aliases: ['unbangroup'],
  category: 'owner',
  description: 'Unban a group thread',
  usage: '{p}unbanchat',
  ownerOnly: true,
  role: 2,
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    database.unbanThread(chat);
    await message.reply('✅ Group ban lifted. Bot commands are now available in this group.');
  }
};
