/**
 * Welcome Command - Toggle welcome messages or set custom welcome
 */

const database = require('../../database');

module.exports = {
  name: 'welcome',
  aliases: ['setwelcome'],
  category: 'admin',
  description: 'Toggle welcome messages or customize welcome text using {user}',
  usage: '{p}welcome [on|off|<custom message>]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const settings = database.getGroupSettings(chat);

    if (args.length === 0) {
      const nextState = !settings.welcome;
      database.updateGroupSettings(chat, { welcome: nextState });
      return await message.reply(`👋 Welcome messages have been ${nextState ? '*ENABLED*' : '*DISABLED*'}.`);
    }

    const first = args[0].toLowerCase();
    if (first === 'on' || first === 'enable') {
      database.updateGroupSettings(chat, { welcome: true });
      return await message.reply('👋 Welcome messages are now *ENABLED*.');
    }
    if (first === 'off' || first === 'disable') {
      database.updateGroupSettings(chat, { welcome: false });
      return await message.reply('👋 Welcome messages are now *DISABLED*.');
    }

    // Set custom welcome message
    const customText = args.join(' ');
    database.updateGroupSettings(chat, { welcome: true, customWelcome: customText });
    await message.reply(`✅ Custom welcome message saved and enabled:\n"${customText}"\n(Hint: You can use {user} and {group} placeholders)`);
  }
};
