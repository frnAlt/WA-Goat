/**
 * Balance Command - Check coin and wallet balance (GoatBot V2 compatible)
 */

const database = require('../../database');

module.exports = {
  name: 'balance',
  aliases: ['bal', 'money', 'cash'],
  category: 'economy',
  description: 'Check your virtual coins and cash balance',
  usage: '{p}balance [@user]',

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, sender, message } = extra;
    let target = sender;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;

    const uNum = target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const user = database.usersData.get(uNum);
    const bank = user.data?.bank || 0;
    const coins = user.money || 0;
    const total = coins + bank;

    const text = `
*╭━━━〔 💰 VIRTUAL BALANCE 〕━━━╮*
*┃ 👤 Member :* @${uNum}
*┃ 💵 Wallet :* $${coins.toLocaleString()}
*┃ 🏦 Bank   :* $${bank.toLocaleString()}
*┃ 💎 Total  :* $${total.toLocaleString()}
*╰━━━━━━━━━━━━━━━━━━━━━━╯*
`.trim();

    await sock.sendMessage(extra.chat, {
      text,
      mentions: [target]
    }, { quoted: msg });
  }
};
