"use strict";

module.exports = {
  config: {
    name: "pp",
    aliases: ["avatar", "pfp"],
    version: "1.2.0",
    author: "ST | frnAlt",
    countDown: 5,
    role: 0,
    shortDescription: "Get profile picture of a user or group",
    longDescription: "Sends the profile picture of a mentioned user, replied user, or yourself.",
    category: "info",
    guide: { en: "{pn} [@mention | reply | uid]" }
  },

  onStart: async ({ api, event, args, message }) => {
    const targetUID = global.getTargetUser
      ? global.getTargetUser(event, args)
      : (event.mentions && Object.keys(event.mentions)[0]) || event.senderID;

    await message.react("⏳");

    let ppUrl = null;
    try {
      ppUrl = await api.getProfilePicture(targetUID);
    } catch (_) {}

    // Fallback: try with phone JID format
    if (!ppUrl) {
      try {
        const clean = String(targetUID).replace(/[^0-9]/g, "");
        if (clean) ppUrl = await api.getProfilePicture(`${clean}@s.whatsapp.net`);
      } catch (_) {}
    }

    if (!ppUrl) {
      await message.react("❌");
      return message.reply("❌ Could not fetch profile picture — user may have it hidden or default.");
    }

    const phone = String(targetUID).replace(/[^0-9]/g, "");

    try {
      await message.reply({
        body: `📸 Profile picture of ${phone || targetUID}`,
        attachment: { type: "image", url: ppUrl, mimetype: "image/jpeg" },
      });
      await message.react("✅");
    } catch (e) {
      await message.react("❌");
      return message.reply("❌ Failed to send profile picture: " + e.message);
    }
  }
};
