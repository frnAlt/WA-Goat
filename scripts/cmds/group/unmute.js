const groupService = require('../../../src/services/groupService');

module.exports = {
  config: {
    name: "unmute",
    aliases: ["opengc", "unlockgc"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 1,
    shortDescription: {
      en: "Unmute group so all members can send messages"
    },
    longDescription: {
      en: "Re-opens group messaging to all participants"
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
      await groupService.setGroupMute(rawSock, dest, false);
      return message.reply("🔓 Group has been unmuted! All members can send messages now.");
    } catch (err) {
      return message.reply(`❌ Failed to unmute group: ${err.message}`);
    }
  }
};
