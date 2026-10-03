/**
 * Chatbot Command - Toggle autonomous AI chatbot in group
 */

const database = require('../../../src/database');

module.exports = {
  name: 'chatbot',
  aliases: ['aichat', 'autobot'],
  category: 'admin',
  description: 'Toggle autonomous AI responses to messages in this group',
  usage: '{p}chatbot [on|off]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const settings = database.getGroupSettings(chat);

    let nextState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable') nextState = true;
      else if (opt === 'off' || opt === 'disable') nextState = false;
    } else {
      nextState = !settings.chatbot;
    }

    database.updateGroupSettings(chat, { chatbot: nextState });
    await message.reply(`🤖 AI Chatbot has been ${nextState ? '*ENABLED*' : '*DISABLED*'} for this group.`);
  }
};
