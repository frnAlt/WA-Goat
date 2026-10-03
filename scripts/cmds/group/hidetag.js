module.exports = {
  config: {
    name: "hidetag",
    aliases: ["htag", "invisibletag"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "Tag all group members with a custom message"
    },
    longDescription: {
      en: "Broadcast a message mentioning all group members in the background"
    },
    category: "group",
    guide: {
      en: "{pn} <announcement text>"
    }
  },

  onStart: async function ({ sock, message, args, event }) {
    if (!event.threadID || !event.threadID.endsWith("@g.us")) {
      return message.reply("ℹ️ This command can only be used in WhatsApp groups.");
    }

    const text = args.join(" ").trim() || "Attention everyone!";
    const rawSock = sock || event.sock;
    const dest = event.threadID || event.chat;

    try {
      const groupMetadata = await rawSock.groupMetadata(dest);
      const participants = groupMetadata.participants.map(p => p.id);

      await rawSock.sendMessage(dest, {
        text,
        mentions: participants
      }, { quoted: event.m || event.raw });
    } catch (err) {
      return message.reply(`❌ Failed to hidetag: ${err.message}`);
    }
  }
};
