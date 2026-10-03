module.exports = {
  config: {
    name: "fork",
    aliases: ["repo", "source"],
    version: "1.0",
    author: "frnAlt",
    countDown: 3,
    role: 0,
    longDescription: "Returns the link to the official, updated fork of the bot's repository.",
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function({ message }) {
    const text = "🐐 *WA-Goat (WhatsApp Edition)*\n\n" +
                 "Powered by Baileys v7 & Floppa-WCA\n\n" +
                 "Features:\n" +
                 "• Native WhatsApp Chat API (WCA) powered by Baileys v7\n" +
                 "• Headless authentication via WA_WEB_ACCESS_TOKEN and pairing codes\n" +
                 "• Web Dashboard with real-time stats\n" +
                 "• 700+ commands ported with full media and group support\n" +
                 "• GitHub Actions runner and cloud deployment workflows";
    
    message.reply(text);
  }
};
