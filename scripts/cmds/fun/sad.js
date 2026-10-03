const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sad",
    aliases: ["greyscale", "gray"],
    version: "1.0.0",
    author: "frnAlt",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Apply sad effect"
    },
    longDescription: {
      en: "Apply greyscale effect to a mentioned or replied user's PFP"
    },
    category: "fun",
    guide: {
      en: "{pn} @mention\n{pn} (reply to a user)"
    }
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    let filePath;

    try {
      let uid;

      if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        uid = Object.keys(event.mentions)[0];
      } else if (event.messageReply?.senderID) {
        uid = event.messageReply.senderID;
      } else {
        return api.sendMessage(
          "😔 Please mention or reply to a user.",
          event.threadID,
          event.messageID
        );
      }

      let image;
      try {
        if (typeof global.utils?.getAvatar === "function") {
          image = await global.utils.getAvatar(api, uid);
        }
        if (!image && typeof api?.getProfilePicture === "function") {
          image = await api.getProfilePicture(uid);
        }
      } catch (_) {}
      if (!image) {
        image = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(uid)}&size=512`;
      }

      const apiUrl =
        `https://toshiro-api-editz6t9.vercel.app/api/canvas/greyscale` +
        `?image=${encodeURIComponent(image)}`;

      filePath = path.join(
        cacheDir,
        `sad_${uid}_${Date.now()}.png`
      );

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "image/png,image/jpeg,image/*,*/*"
        }
      });

      if (!response.data) {
        throw new Error("Empty response from Greyscale API.");
      }

      await fs.writeFile(
        filePath,
        Buffer.from(response.data)
      );

      await api.sendMessage(
        {
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error(
        "Sad:",
        error.response?.status || error.message
      );

      await api.sendMessage(
        `❌ Failed to generate sad image.\n\n${error.response?.status || error.message}`,
        event.threadID,
        event.messageID
      );

    } finally {
      if (
        filePath &&
        await fs.pathExists(filePath)
      ) {
        await fs.remove(filePath).catch(() => {});
      }
    }
  }
};