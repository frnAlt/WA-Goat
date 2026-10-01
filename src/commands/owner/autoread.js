/**
 * AutoRead Command - Toggle automatic message read receipts
 */

const config = require('../../config');

module.exports = {
  name: 'autoread',
  aliases: ['readreceipts'],
  category: 'owner',
  description: 'Toggle automatic read marks on incoming messages',
  usage: '{p}autoread [on|off]',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    let nextState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable') nextState = true;
      else if (opt === 'off' || opt === 'disable') nextState = false;
    } else {
      nextState = !config.autoRead;
    }

    config.autoRead = nextState;
    await extra.message.reply(`👁️ Auto-read receipts are now ${nextState ? '*ENABLED*' : '*DISABLED*'}.`);
  }
};
