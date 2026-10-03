module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 8,
    role: 1,
    shortDescription: "Manage pending group join requests",
    longDescription: "Accept or view pending join requests in WhatsApp groups",
    category: "group",
    guide: {
      en: "{pn} - View pending group join requests\n{pn} approve <jid> - Approve a request\n{pn} reject <jid> - Reject a request"
    }
  },

  onStart: async function ({ event, api, message, args }) {
    if (!event.threadID || !event.threadID.endsWith("@g.us")) {
      return message.reply("ℹ️ This command is for managing join requests in WhatsApp groups.");
    }

    const sock = api.sock || api._sock;
    const action = args[0]?.toLowerCase();
    const targetJid = args[1];

    if (sock && typeof sock.groupRequestParticipantsList === "function") {
      try {
        if (action === "approve" || action === "reject") {
          if (!targetJid) {
            return message.reply("❌ Please provide the JID or phone number of the requester to " + action + ".");
          }
          const cleanJid = targetJid.includes("@") ? targetJid : `${targetJid.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
          const act = action === "approve" ? "approve" : "reject";
          await sock.groupRequestParticipantsUpdate(event.threadID, [cleanJid], act);
          return message.reply(`✅ Successfully ${act}d request for ${cleanJid}`);
        }

        const requests = await sock.groupRequestParticipantsList(event.threadID);
        if (!requests || requests.length === 0) {
          return message.reply("ℹ️ No pending join requests in this group.");
        }

        let msg = "📋 Pending Group Join Requests:\n";
        requests.forEach((req, idx) => {
          msg += `\n${idx + 1}. User: ${req.jid}`;
        });
        msg += "\n\nUse: accept approve <jid> or accept reject <jid>";
        return message.reply(msg);
      } catch (err) {
        return message.reply(`⚠️ Group request error: ${err.message}`);
      }
    }

    return message.reply("ℹ️ In WhatsApp, users can chat directly without friend requests. Pending group membership requests can be managed via WhatsApp group settings.");
  }
};
