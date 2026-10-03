const axios = require("axios");
const { Readable } = require("stream");
const { renderJailEffect, isCanvasAvailable } = require("../../func/canvasHelper.js");

module.exports = {
  config: {
    name: "jail",
    aliases: ["prison", "inmate", "jailcanvas"],
    version: "2.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Apply jail canvas effect"
    },
    longDescription: {
      en: "Generate a realistic jail iron bars effect image for yourself, a mentioned user, or a replied photo/avatar"
    },
    category: "canvas",
    guide: {
      en: "{pn} (self avatar)\n{pn} @mention\n{pn} (reply to user or image)\n{pn} <image-url | UID>"
    }
  },

  onStart: async function ({ api, event, message, args }) {
    let imageUrl = "";

    // 1. Check for image attachment in replied message
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
    // 2. Check for mentioned user
    if (!imageUrl && event.mentions && Object.keys(event.mentions).length > 0) {
      const targetUID = Object.keys(event.mentions)[0];
      imageUrl = (await global.utils?.getAvatar?.(api, targetUID)) || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(targetUID)}`;
    }
    // 3. Check for replied message sender
    else if (!imageUrl && event.messageReply?.senderID) {
      imageUrl = (await global.utils?.getAvatar?.(api, event.messageReply.senderID)) || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(event.messageReply.senderID)}`;
    }
    // 4. Check for direct URL or UID argument
    else if (!imageUrl && args[0] && args[0].startsWith("http")) {
      imageUrl = args[0];
    }
    else if (!imageUrl && args[0]) {
      const targetUID = args[0].trim();
      imageUrl = (await global.utils?.getAvatar?.(api, targetUID)) || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(targetUID)}`;
    }
    // 5. Default to sender's own avatar
    else if (!imageUrl) {
      imageUrl = (await global.utils?.getAvatar?.(api, event.senderID)) || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(event.senderID)}`;
    }

    if (api && api.setMessageReaction) {
      api.setMessageReaction("⛓️", event.messageID, () => {}, true);
    }

    try {
      let attachmentStream;

      // 1. Try local Canvas rendering first (fastest, offline, high fidelity)
      if (isCanvasAvailable && typeof renderJailEffect === "function") {
        try {
          const buffer = await renderJailEffect(imageUrl);
          attachmentStream = Readable.from(buffer);
          attachmentStream.path = "jail_canvas.png";
        } catch (canvasErr) {
          console.warn("[JAIL] Canvas rendering failed, trying API fallback:", canvasErr.message);
        }
      }

      // 2. Try remote API fallback if canvas stream was not created
      if (!attachmentStream) {
        const apiUrl = `https://toshiro-api-editz6t9.vercel.app/api/canvas/jail?image=${encodeURIComponent(imageUrl)}`;
        if (global.utils && typeof global.utils.getStreamFromURL === "function") {
          attachmentStream = await global.utils.getStreamFromURL(apiUrl, "jail.png");
        } else {
          const res = await axios.get(apiUrl, { responseType: "stream", timeout: 15000 });
          attachmentStream = res.data;
          attachmentStream.path = "jail.png";
        }
      }

      await message.reply({
        body: "⛓️ Behind bars! You've been put in jail! 🚓",
        attachment: attachmentStream
      });

      if (api && api.setMessageReaction) {
        api.setMessageReaction("👍", event.messageID, () => {}, true);
      }
    } catch (error) {
      console.error("Jail command error:", error);
      if (api && api.setMessageReaction) {
        api.setMessageReaction("👎", event.messageID, () => {}, true);
      }
      return message.reply(`❌ Failed to generate jail image: ${error.message || error}`);
    }
  }
};