/**
 * @author frnAlt
 * Profile Picture (PFP / DP) Command for WhatsApp
 * Fetches high-definition profile picture of caller, tagged member, quoted sender, or group icon
 */

const axios = require('axios');
const { decodeJid } = require('../../utils/myfunc');

module.exports = {
  config: {
    name: 'pfp',
    aliases: ['profilepic', 'getpfp', 'dp', 'pp', 'avatar'],
    version: '2.5.0',
    author: "frnAlt",
    countDown: 3,
    role: 0,
    category: 'utility',
    shortDescription: {
      en: 'Fetch HD profile picture of user, mentioned contact, or group'
    },
    longDescription: {
      en: 'Fetches high-resolution profile picture for yourself, a mentioned user, replied message, phone number, or group chat icon.'
    },
    guide: {
      en: '   {pn}: Fetch your own WhatsApp profile picture\n' +
        '   {pn} @user: Fetch profile picture of mentioned user\n' +
        '   {pn} <phone_number>: Fetch profile picture of phone number\n' +
        '   {pn} group: Fetch current group chat icon\n' +
        '   (Or reply to any user\'s message and type {pn})'
    }
  },

  name: 'pfp',
  aliases: ['profilepic', 'getpfp', 'dp', 'pp', 'avatar'],
  category: 'utility',
  description: 'Fetch HD profile picture of user, mentioned contact, or group',
  usage: '{p}pfp [@user | phone_number | group]',
  author: "frnAlt",
  version: '2.5.0',
  cooldown: 3,
  role: 0,

  async execute(sock, m, args, extra) {
    const { message, chat, isGroup, sender, quoted, mentions } = extra;

    let targetJid = sender;
    let isTargetGroup = false;

    // 1. Quoted message priority
    if (quoted && quoted.sender) {
      targetJid = quoted.sender;
    }
    // 2. Mentioned user priority
    else if (mentions && mentions.length > 0) {
      targetJid = mentions[0];
    }
    // 3. Arguments (group or phone number)
    else if (args.length > 0) {
      const query = args[0].toLowerCase().trim().replace(/^@/, '');
      if (['group', 'gc', 'chat'].includes(query)) {
        if (!isGroup) {
          return await message.reply('👥 Group avatar lookup is only available inside group chats.');
        }
        targetJid = chat;
        isTargetGroup = true;
      } else if (/^\d+$/.test(query)) {
        targetJid = `${query}@s.whatsapp.net`;
      }
    }

    targetJid = decodeJid(targetJid);
    const cleanNumber = targetJid.replace(/@.*$/, '');

    await message.typing(1000).catch(() => {});

    // Try fetching profile picture from WhatsApp Baileys socket
    let ppUrl = null;
    try {
      ppUrl = await sock.profilePictureUrl(targetJid, 'image');
    } catch (_) {
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'preview');
      } catch (_) {}
    }

    if (ppUrl) {
      try {
        const res = await axios.get(ppUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const imageBuffer = Buffer.from(res.data);
        const caption = isTargetGroup
          ? '🖼️ *Group Icon*'
          : `🖼️ *HD Profile Picture for* @${cleanNumber}`;

        return await message.reply({
          image: imageBuffer,
          caption
        }, { mentions: [targetJid] });
      } catch (err) {
        // Fallback to direct url send
        const caption = isTargetGroup
          ? '🖼️ *Group Icon*'
          : `🖼️ *HD Profile Picture for* @${cleanNumber}`;

        return await message.reply({
          image: { url: ppUrl },
          caption
        }, { mentions: [targetJid] });
      }
    }

    // Fallback when user profile picture is private or not set
    try {
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanNumber)}&background=075E54&color=fff&size=512&bold=true`;
      const res = await axios.get(fallbackUrl, {
        responseType: 'arraybuffer',
        timeout: 8000
      });

      return await message.reply({
        image: Buffer.from(res.data),
        caption: `ℹ️ @${cleanNumber} has set their profile picture to private or has no photo. Showing default avatar.`
      }, { mentions: [targetJid] });
    } catch (err) {
      return await message.reply(`⚠️ Could not retrieve profile picture for @${cleanNumber} (privacy settings or no photo set).`, {
        mentions: [targetJid]
      });
    }
  },

  async onStart({ sock, api, message, event, args, extra }) {
    const s = sock || api;
    const ctx = extra || event;
    return this.execute(s, ctx?.m, args, ctx);
  }
};
