const groupService = require('../../../src/services/groupService');

module.exports = {
  config: {
    name: "mute",
    aliases: ["closegc", "lockgc"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 3,
    role: 1,
    shortDescription: {
      en: "Mute group so only admins can send messages"
    },
    longDescription: {
      en: "Restricts group messaging to administrators only"
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
      await groupService.setGroupMute(rawSock, dest, true);
      return message.reply("🔒 Group has been muted! Only admins can send messages now.");
    } catch (err) {
      return message.reply(`❌ Failed to mute group: ${err.message}`);
    }
  }
};
