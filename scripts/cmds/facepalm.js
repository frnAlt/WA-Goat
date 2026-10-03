const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "facepalm",
    aliases: ["fp"],
    version: "1.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Apply facepalm effect"
    },
    longDescription: {
      en: "Apply facepalm effect to a mentioned or replied user's PFP"
    },
    category: "fun",
    guide: {
      en: "{pn} @mention\n{pn} (reply to a user)"
    }
  },

  onStart: async function ({ api, event, message, args }) {
    let imageUrl = "";
    const getTargetAvatar = async (targetId) => {
      try {
        if (typeof global.utils?.getAvatar === "function") {
          const av = await global.utils.getAvatar(api, targetId);
          if (av) return av;
        }
        if (typeof api?.getProfilePicture === "function") {
          const av = await api.getProfilePicture(targetId);
          if (av) return av;
        }
      } catch (_) {}
      return `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(targetId)}&size=512`;
    };

    if (event.messageReply?.attachments?.length > 0) {
      const att = event.messageReply.attachments[0];
      let u = att.url || att.previewUrl || att.largePreviewUrl;
      if (!u && att.ID && api?.resolvePhotoUrl) {
        try { u = await api.resolvePhotoUrl(att.ID); } catch (_) {}
      }
      if (u) imageUrl = u;
    }
    if (!imageUrl && event.attachments?.length > 0) {
      const att = event.attachments[0];
      let u = att.url || att.previewUrl || att.largePreviewUrl;
      if (!u && att.ID && api?.resolvePhotoUrl) {
        try { u = await api.resolvePhotoUrl(att.ID); } catch (_) {}
      }
      if (u) imageUrl = u;
    }
    if (!imageUrl && event.mentions && Object.keys(event.mentions).length > 0) {
      const uid = Object.keys(event.mentions)[0];
      imageUrl = await getTargetAvatar(uid);
    } else if (!imageUrl && event.messageReply) {
      const uid = event.messageReply.senderID || event.messageReply.actorFbId;
      if (uid) imageUrl = await getTargetAvatar(uid);
    } else if (!imageUrl && args[0] && /^\d+$/.test(args[0].trim())) {
      imageUrl = await getTargetAvatar(args[0].trim());
    } else if (!imageUrl && args[0] && args[0].startsWith("http")) {
      imageUrl = args[0];
    } else if (!imageUrl) {
      imageUrl = await getTargetAvatar(event.senderID);
    }

    if (api.setMessageReaction) {
      api.setMessageReaction("🤦", event.messageID, () => {}, true);
    }

    try {
      const apiUrl = `https://toshiro-api-editz6t9.vercel.app/api/canvas/facepalm?image=${encodeURIComponent(imageUrl)}`;
      const stream = await global.utils.getStreamFromURL(apiUrl, "facepalm.png");

      return message.reply({
        body: "🤦 *Facepalm*",
        attachment: stream
      });
    } catch (error) {
      console.error("Facepalm error:", error.message);
      return message.reply(`❌ Failed to generate facepalm: ${error.message}`);
    }
  }
};