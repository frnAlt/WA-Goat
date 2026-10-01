/**
 * Antilink Command - Toggle automatic link deletion and warnings
 */

const database = require('../../database');

module.exports = {
  name: 'antilink',
  aliases: ['linkblock', 'nolink'],
  category: 'admin',
  description: 'Toggle automatic link deletion and moderation in this group',
  usage: '{p}antilink [on|off]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const current = database.getGroupSettings(chat).antilink;

    let targetState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable' || opt === '1') targetState = true;
      else if (opt === 'off' || opt === 'disable' || opt === '0') targetState = false;
    } else {
      targetState = !current;
    }

    database.updateGroupSettings(chat, { antilink: targetState });
    await message.reply(`🛡️ Antilink protection has been ${targetState ? '*ENABLED*' : '*DISABLED*'} for this group.`);
  }
};
