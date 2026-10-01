/**
 * Admin Command - Manage Bot Administrators (GoatBot V2 compatible)
 */

const config = require('../../config');
const database = require('../../database');

module.exports = {
  name: 'admin',
  aliases: ['botadmin', 'sudo'],
  category: 'owner',
  description: 'Add, remove, or list bot administrators',
  usage: '{p}admin [add|remove|list] [@user|phone]',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    const { mentions, quoted, message } = extra;
    const action = (args[0] || 'list').toLowerCase();

    let target = null;
    if (mentions && mentions.length > 0) {
      target = mentions[0];
    } else if (quoted && quoted.sender) {
      target = quoted.sender;
    } else if (args[1] && /^[0-9]+$/.test(args[1])) {
      target = `${args[1]}@s.whatsapp.net`;
    }

    const cleanNum = target ? target.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '') : '';

    if (action === 'add' || action === '-a') {
      if (!cleanNum) return await message.reply('⚠️ Please mention or provide the phone number of the user to add as Bot Admin.');
      database.addSudo(cleanNum);
      return await message.reply(`✅ Added @${cleanNum} as a Bot Administrator.`, { mentions: [target] });
    }

    if (action === 'remove' || action === '-r' || action === 'del') {
      if (!cleanNum) return await message.reply('⚠️ Please mention or provide the phone number of the user to remove.');
      if (cleanNum === config.ownerNumber) return await message.reply('❌ Cannot remove the primary Bot Owner.');
      database.removeSudo(cleanNum);
      return await message.reply(`✅ Removed @${cleanNum} from Bot Administrators.`, { mentions: [target] });
    }

    // Default: list
    const admins = config.adminBot || [];
    let listText = `👑 *BOT ADMINISTRATORS LIST*\n\n*Owner:* ${config.ownerName} (@${config.ownerNumber})\n\n`;
    if (admins.length > 0) {
      listText += `*Administrators (${admins.length}):*\n`;
      admins.forEach((num, i) => {
        listText += `${i + 1}. @${num}\n`;
      });
    } else {
      listText += 'No additional bot administrators configured.';
    }

    const mentionsList = admins.map(n => `${n}@s.whatsapp.net`).concat([`${config.ownerNumber}@s.whatsapp.net`]);
    await sock.sendMessage(extra.chat, { text: listText.trim(), mentions: mentionsList }, { quoted: msg });
  }
};
