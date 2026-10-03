module.exports = {
  config: {
    name: "broadcast",
    aliases: ["bc", "bcast", "gcbroadcast"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 10,
    role: 2,
    shortDescription: {
      en: "Broadcast a message to all joined groups"
    },
    longDescription: {
      en: "Broadcasts an announcement to all WhatsApp groups the bot is currently in"
    },
    category: "owner",
    guide: {
      en: "{pn} <message text>"
    }
  },

  onStart: async function ({ sock, message, args, event }) {
    const text = args.join(" ").trim();
    if (!text) {
      return message.reply("⚠️ Please provide the announcement message to broadcast.\nExample: *!broadcast Hello all groups!*");
    }

    const rawSock = sock || event.sock;

    try {
      const chats = await rawSock.groupFetchAllParticipating();
      const groupJids = Object.keys(chats);

      if (groupJids.length === 0) {
        return message.reply("❌ The bot is not part of any groups.");
      }

      await message.reply(`📢 Broadcasting announcement to ${groupJids.length} groups...`);

      let sent = 0;
      let failed = 0;

      for (const jid of groupJids) {
        try {
          await rawSock.sendMessage(jid, {
            text: `📢 *[ BOT BROADCAST ]*\n\n${text}`
          });
          sent++;
          await new Promise(r => setTimeout(r, 1000));
        } catch (_) {
          failed++;
        }
      }

      return message.reply(`✅ Broadcast finished!\n• Sent: ${sent}\n• Failed: ${failed}`);
    } catch (err) {
      return message.reply(`❌ Broadcast failed: ${err.message}`);
    }
  }
};
