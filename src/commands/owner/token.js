/**
 * Token Command - View, export, or sync WhatsApp Web Access Token (wa_web.json / account.txt)
 */

const path = require('path');
const { exportWaWebToken, readWaWebSessionContent } = require('../../utils/waWebAuth');

module.exports = {
  name: 'token',
  aliases: ['waweb', 'sessiontoken', 'gettoken'],
  category: 'owner',
  description: 'View or export WhatsApp Web access token (wa_web.json / account.txt)',
  usage: '{p}token [export|show]',
  ownerOnly: true,
  role: 4,

  async execute(sock, msg, args, extra) {
    const sessionDir = path.resolve(process.cwd(), 'auth');
    const subAction = (args[0] || 'show').toLowerCase();

    try {
      const exported = await exportWaWebToken(sessionDir);
      if (!exported || !exported.token) {
        return extra.message.reply('❌ No active session found to generate token from.');
      }

      if (subAction === 'export' || subAction === 'sync') {
        return extra.message.reply(
          `✅ *WhatsApp Web Token Synced!*\n\n` +
          `📁 Saved to: \`wa_web.json\` & \`account.txt\`\n` +
          `🔑 Token Prefix: \`${exported.token.slice(0, 24)}...\`\n\n` +
          `You can now copy \`wa_web.json\` or set \`WA_WEB_ACCESS_TOKEN\` on your host.`
        );
      }

      // Default: reply with token and instructions
      const messageContent =
        `🔐 *WhatsApp Web Access Token*\n\n` +
        `\`\`\`\n${exported.token}\n\`\`\`\n\n` +
        `📌 *How to use:*\n` +
        `1. Paste into \`wa_web.json\` as \`{"wa_web_access_token": "..."}\`\n` +
        `2. Or paste into \`account.txt\` / \`acc.txt\` (Floppa-bot format)\n` +
        `3. Or set environment variable: \`WA_WEB_ACCESS_TOKEN\`\n` +
        `4. Or paste directly in the Web Dashboard > WA Web Token tab.`;

      await extra.message.reply(messageContent);
    } catch (err) {
      await extra.message.reply(`❌ Failed to retrieve token: ${err.message}`);
    }
  }
};
