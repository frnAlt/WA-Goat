const groupService = require('../../../src/services/groupService');

module.exports = {
  config: {
    name: "demote",
    aliases: ["adminrem", "removeadmin"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 1,
    shortDescription: {
      en: "Demote an admin back to regular member"
    },
    longDescription: {
      en: "Remove admin privileges from mentioned or replied users in the group"
    },
    category: "admin",
    guide: {
      en: "{pn} @user (or reply to an admin)"
    }
  },

  onStart: async function ({ sock, message, event }) {
    if (!event.threadID || !event.threadID.endsWith("@g.us")) {
      return message.reply("ℹ️ This command can only be used in WhatsApp groups.");
    }

    const rawSock = sock || event.sock;
    const dest = event.threadID || event.chat;
    let targets = [];

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targets = Object.keys(event.mentions).map(m => m.includes("@") ? m : `${m}@s.whatsapp.net`);
    } else if (event.messageReply && event.messageReply.senderID) {
      const s = event.messageReply.senderID;
      targets = [s.includes("@") ? s : `${s}@s.whatsapp.net`];
    }

    if (targets.length === 0) {
      return message.reply("👤 Please mention an admin or reply to their message to demote.");
    }

    try {
      await groupService.demoteParticipants(rawSock, dest, targets);
      const usernames = targets.map(j => `@${j.split('@')[0]}`);
      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(dest, {
          text: `🔻 Demoted from admin: ${usernames.join(', ')}`,
          mentions: targets
        }, { quoted: event.m || event.raw });
      } else {
        await message.reply(`🔻 Demoted from admin: ${usernames.join(', ')}`);
      }
    } catch (err) {
      return message.reply(`❌ Failed to demote user(s): ${err.message}`);
    }
  }
};
