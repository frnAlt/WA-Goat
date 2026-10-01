/**
 * HideTag Command - Mention all members invisibly or with media/caption
 */

const groupService = require('../../services/groupService');

module.exports = {
  name: 'hidetag',
  aliases: ['htag', 'tag'],
  category: 'admin',
  description: 'Invisibly tag all members with your announcement or replied message',
  usage: '{p}hidetag <text> (or reply to media/message)',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    const { chat, message, quoted } = extra;
    const metadata = await groupService.getMetadata(sock, chat);
    if (!metadata || !metadata.participants) {
      return await message.reply('❌ Could not retrieve group participant list.');
    }

    const mentions = metadata.participants.map(p => p.id);
    const text = args.join(' ') || quoted?.text || 'Announcement';

    if (quoted && quoted.mtype && quoted.mtype !== 'conversation' && quoted.mtype !== 'extendedTextMessage') {
      try {
        const mediaService = require('../../services/mediaService');
        const buffer = await mediaService.downloadMedia(quoted);
        const type = mediaService.getMediaType(quoted);

        if (type === 'image') {
          return await sock.sendMessage(chat, { image: buffer, caption: text, mentions });
        } else if (type === 'video') {
          return await sock.sendMessage(chat, { video: buffer, caption: text, mentions });
        } else if (type === 'sticker') {
          return await sock.sendMessage(chat, { sticker: buffer, mentions });
        }
      } catch (_) {}
    }

    await sock.sendMessage(chat, { text, mentions });
  }
};
