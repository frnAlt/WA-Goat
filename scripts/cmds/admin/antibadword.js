/**
 * AntiBadword Command - Toggle foul language filter
 */

const database = require('../../../src/database');

module.exports = {
  name: 'antibadword',
  aliases: ['nofoul', 'antislur'],
  category: 'admin',
  description: 'Toggle automatic bad word filtering and moderation in this group',
  usage: '{p}antibadword [on|off]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message } = extra;
    const current = database.getGroupSettings(chat).antibadword;

    let targetState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable' || opt === '1') targetState = true;
      else if (opt === 'off' || opt === 'disable' || opt === '0') targetState = false;
    } else {
      targetState = !current;
    }

    database.updateGroupSettings(chat, { antibadword: targetState });
    await message.reply(`🛡️ Anti-Badword filter has been ${targetState ? '*ENABLED*' : '*DISABLED*'} for this group.`);
  }
};
