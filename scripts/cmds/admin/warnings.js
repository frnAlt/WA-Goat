/**
 * Warnings Command - Check current warning count
 */

const database = require('../../../src/database');

module.exports = {
  name: 'warnings',
  aliases: ['warnlist', 'checkwarn'],
  category: 'admin',
  description: 'Check your or another member\'s warning count',
  usage: '{p}warnings [@user]',
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, mentions, quoted, sender, message } = extra;
    let target = sender;

    if (mentions && mentions.length > 0) {
      target = mentions[0];
    } else if (quoted && quoted.sender) {
      target = quoted.sender;
    }

    const count = database.getWarnings(chat, target);
    const settings = database.getGroupSettings(chat);
    const max = settings.warnLimit || 3;
    const uNum = target.split('@')[0];

    await sock.sendMessage(chat, {
      text: `📋 @${uNum} currently has *${count}* / ${max} warning(s).`,
      mentions: [target]
    }, { quoted: msg });
  }
};
