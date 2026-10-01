/**
 * WhoIs Command - View user details and profile
 */

const database = require('../../database');
const permissions = require('../../core/permissions');
const moment = require('moment-timezone');

module.exports = {
  name: 'whois',
  aliases: ['profile', 'userinfo'],
  category: 'utility',
  description: 'View profile, balance, role, and details of a user',
  usage: '{p}whois [@user]',

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, sender, chat, message } = extra;
    let target = sender;

    if (mentions && mentions.length > 0) target = mentions[0];
    else if (quoted && quoted.sender) target = quoted.sender;

    const uNum = target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
    const user = database.usersData.get(uNum);
    const roleId = await permissions.getRole(sock, chat, target);
    const roleNames = ['Member', 'Group Admin', 'Bot Admin', 'Premium User', 'Bot Owner'];

    const warnings = database.getWarnings(chat, target);
    const joined = user.createdAt ? moment(user.createdAt).format('DD MMM YYYY') : 'Unknown';

    const text = `
*╭━━━〔 USER PROFILE 〕━━━╮*
*┃ 👤 Name      :* ${user.name || 'User'}
*┃ 📱 Number    :* +${uNum}
*┃ 🛡️ Role      :* ${roleNames[roleId] || 'Member'}
*┃ 💰 Coins     :* $${(user.money || 0).toLocaleString()}
*┃ 📈 Level     :* Lv.${user.level || 1} (${user.exp || 0} EXP)
*┃ ⚠️ Warnings  :* ${warnings}
*┃ 🚫 Banned    :* ${user.banned ? 'Yes' : 'No'}
*┃ 📅 Registered:* ${joined}
*╰━━━━━━━━━━━━━━━━━━━━╯*
`.trim();

    await sock.sendMessage(chat, {
      text,
      mentions: [target]
    }, { quoted: msg });
  }
};
