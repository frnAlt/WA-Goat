const groupService = require('../../../src/services/groupService');

module.exports = {
  config: {
    name: "promote",
    aliases: ["adminadd", "makeadmin"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 1,
    shortDescription: {
      en: "Promote members to Group Admin"
    },
    longDescription: {
      en: "Promote mentioned or replied members to WhatsApp Group Admin"
    },
    category: "admin",
    guide: {
      en: "{pn} @user (or reply to a user)"
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
      return message.reply("👤 Please mention a user or reply to their message to promote.");
    }

    try {
      await groupService.promoteParticipants(rawSock, dest, targets);
      const usernames = targets.map(j => `@${j.split('@')[0]}`);
      if (rawSock && typeof rawSock.sendMessage === 'function') {
        await rawSock.sendMessage(dest, {
          text: `👑 Promoted to admin: ${usernames.join(', ')}`,
          mentions: targets
        }, { quoted: event.m || event.raw });
      } else {
        await message.reply(`👑 Promoted to admin: ${usernames.join(', ')}`);
      }
    } catch (err) {
      return message.reply(`❌ Failed to promote user(s): ${err.message}`);
    }
  }
};
