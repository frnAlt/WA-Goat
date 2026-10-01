/**
 * GroupDesc Command - Change group description
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'groupdesc',
  aliases: ['setdesc', 'setdescription'],
  category: 'admin',
  description: 'Change the group description',
  usage: '{p}groupdesc <new description>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const newDesc = args.join(' ').trim();
    if (!newDesc) {
      return await extra.message.reply('⚠️ Please provide the new description text.');
    }

    try {
      await groupService.updateDescription(sock, extra.chat, newDesc);
      await extra.message.reply('✅ Group description updated successfully.');
    } catch (err) {
      await extra.message.reply(`❌ Failed to update description: ${err.message}`);
    }
  }
};
