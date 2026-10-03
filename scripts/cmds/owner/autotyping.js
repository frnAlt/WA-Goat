/**
 * AutoTyping Command - Toggle automatic typing indicator simulation
 */

const config = require('../../../src/config');

module.exports = {
  name: 'autotyping',
  aliases: ['typing'],
  category: 'owner',
  description: 'Toggle automatic typing indicator on incoming messages',
  usage: '{p}autotyping [on|off]',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    let nextState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable') nextState = true;
      else if (opt === 'off' || opt === 'disable') nextState = false;
    } else {
      nextState = !config.autoTyping;
    }

    config.autoTyping = nextState;
    await extra.message.reply(`⌨️ Auto-typing simulation is now ${nextState ? '*ENABLED*' : '*DISABLED*'}.`);
  }
};
