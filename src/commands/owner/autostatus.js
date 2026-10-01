/**
 * AutoStatus Command - Toggle automatic status viewing
 */

const config = require('../../config');

module.exports = {
  name: 'autostatus',
  aliases: ['statusread'],
  category: 'owner',
  description: 'Toggle automatic viewing of WhatsApp status stories',
  usage: '{p}autostatus [on|off]',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    let nextState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable') nextState = true;
      else if (opt === 'off' || opt === 'disable') nextState = false;
    } else {
      nextState = !config.autoStatus;
    }

    config.autoStatus = nextState;
    await extra.message.reply(`📱 Auto-status viewing is now ${nextState ? '*ENABLED*' : '*DISABLED*'}.`);
  }
};
