/**
 * AntiCall Command - Toggle automatic call rejection and blocking
 */

const config = require('../../../src/config');

module.exports = {
  name: 'anticall',
  aliases: ['blockcall', 'nocall'],
  category: 'owner',
  description: 'Toggle automatic call rejection and caller blocking',
  usage: '{p}anticall [on|off]',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    let nextState;
    if (args[0]) {
      const opt = args[0].toLowerCase();
      if (opt === 'on' || opt === 'enable') nextState = true;
      else if (opt === 'off' || opt === 'disable') nextState = false;
    } else {
      nextState = !config.antiCall;
    }

    config.antiCall = nextState;
    await extra.message.reply(`📵 Anti-Call protection is now ${nextState ? '*ENABLED*' : '*DISABLED*'}.`);
  }
};
