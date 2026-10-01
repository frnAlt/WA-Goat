/**
 * Warn Command - Issue warning to group member
 */

const database = require('../../database');
const groupService = require('../../services/groupService');
const { decodeJid } = require('../../utils/myfunc');

module.exports = {
  name: 'warn',
  aliases: ['warning'],
  category: 'admin',
  description: 'Issue a warning to a member. Reaching 3 warnings results in automatic kick',
  usage: '{p}warn @user [reason]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, mentions, quoted, message } = extra;
    let target = null;

    if (mentions && mentions.length > 0) {
      target = mentions[0];
    } else if (quoted && quoted.sender) {
      target = quoted.sender;
    }

    if (!target) {
      return await message.reply('👤 Please mention a user or reply to their message to warn.');
    }

    const botId = decodeJid(sock.user?.id);
    if (decodeJid(target) === botId) {
      return await message.reply('❌ You cannot warn the bot.');
    }

    const reason = args.slice(mentions.length > 0 ? 1 : 0).join(' ') || 'Breaking group rules';
    const warnings = database.addWarning(chat, target);
    const settings = database.getGroupSettings(chat);
    const maxWarn = settings.warnLimit || 3;
    const uNum = target.split('@')[0];

    if (warnings >= maxWarn) {
      const isBotAdmin = await groupService.isBotAdmin(sock, chat);
      if (isBotAdmin) {
        try {
          await groupService.removeParticipants(sock, chat, target);
          database.resetWarnings(chat, target);
          return await sock.sendMessage(chat, {
            text: `🚫 @${uNum} reached ${warnings}/${maxWarn} warnings and has been removed.\nReason: ${reason}`,
            mentions: [target]
          });
        } catch (_) {}
      }
      return await sock.sendMessage(chat, {
        text: `⚠️ @${uNum} has reached ${warnings}/${maxWarn} warnings! (Bot is not admin so cannot kick).`,
        mentions: [target]
      });
    }

    await sock.sendMessage(chat, {
      text: `⚠️ @${uNum} has received a warning (${warnings}/${maxWarn}).\nReason: *${reason}*`,
      mentions: [target]
    }, { quoted: msg });
  }
};
