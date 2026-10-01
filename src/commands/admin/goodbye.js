/**
 * Goodbye Command - Toggle leave messages or set custom goodbye
 */

const database = require('../../database');

module.exports = {
  name: 'goodbye',
  aliases: ['leavemsg', 'setgoodbye'],
  category: 'admin',
  description: 'Toggle goodbye messages or customize goodbye text using {user}',
  usage: '{p}goodbye [on|off|<custom message>]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const settings = database.getGroupSettings(chat);

    if (args.length === 0) {
      const nextState = !settings.goodbye;
      database.updateGroupSettings(chat, { goodbye: nextState });
      return await message.reply(`👋 Goodbye messages have been ${nextState ? '*ENABLED*' : '*DISABLED*'}.`);
    }

    const first = args[0].toLowerCase();
    if (first === 'on' || first === 'enable') {
      database.updateGroupSettings(chat, { goodbye: true });
      return await message.reply('👋 Goodbye messages are now *ENABLED*.');
    }
    if (first === 'off' || first === 'disable') {
      database.updateGroupSettings(chat, { goodbye: false });
      return await message.reply('👋 Goodbye messages are now *DISABLED*.');
    }

    const customText = args.join(' ');
    database.updateGroupSettings(chat, { goodbye: true, customGoodbye: customText });
    await message.reply(`✅ Custom goodbye message saved and enabled:\n"${customText}"\n(Hint: You can use {user} and {group} placeholders)`);
  }
};
