const groupService = require('../../../src/services/groupService');

module.exports = {
  config: {
    name: "revoke",
    aliases: ["resetlink", "newlink"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "Revoke and reset group invite link"
    },
    longDescription: {
      en: "Invalidates the previous invite link and creates a new one"
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ sock, message, event }) {
    if (!event.threadID || !event.threadID.endsWith("@g.us")) {
      return message.reply("ℹ️ This command can only be used in WhatsApp groups.");
    }

    const rawSock = sock || event.sock;
    const dest = event.threadID || event.chat;

    try {
      const newCode = await groupService.revokeInviteCode(rawSock, dest);
      const newUrl = `https://chat.whatsapp.com/${newCode}`;
      return message.reply(`🔄 Previous link revoked! New invite link:\n${newUrl}`);
    } catch (err) {
      return message.reply(`❌ Failed to revoke invite link: ${err.message}`);
    }
  }
};
