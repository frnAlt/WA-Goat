/**
 * GroupName Command - Change group subject
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'groupname',
  aliases: ['setname', 'setsubject'],
  category: 'admin',
  description: 'Change the group name/subject',
  usage: '{p}groupname <new name>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    const newName = args.join(' ').trim();
    if (!newName) {
      return await extra.message.reply('⚠️ Please provide a new name for the group.');
    }
    if (newName.length > 100) {
      return await extra.message.reply('⚠️ Group name cannot exceed 100 characters.');
    }

    try {
      await groupService.updateSubject(sock, extra.chat, newName);
      await extra.message.reply(`✅ Group name changed to: *${newName}*`);
    } catch (err) {
      await extra.message.reply(`❌ Failed to update group name: ${err.message}`);
    }
  }
};
