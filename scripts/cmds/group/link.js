const groupService = require('../../../src/services/groupService');

module.exports = {
  config: {
    name: "link",
    aliases: ["grouplink", "invitelink", "gclink"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get WhatsApp group invite link"
    },
    longDescription: {
      en: "Fetches and displays the permanent or temporary WhatsApp group invite link"
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
      const inviteCode = await groupService.getInviteCode(rawSock, dest);
      const inviteUrl = `https://chat.whatsapp.com/${inviteCode}`;
      return message.reply(`🔗 Group Invite Link:\n${inviteUrl}`);
    } catch (err) {
      return message.reply(`❌ Failed to retrieve invite link: ${err.message}`);
    }
  }
};
