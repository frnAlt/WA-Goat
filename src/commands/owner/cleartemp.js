/**
 * ClearTemp Command - Clean temporary cache directory
 */

const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'cleartemp',
  aliases: ['clearcache', 'purgetemp'],
  category: 'owner',
  description: 'Delete temporary files and free disk space',
  usage: '{p}cleartemp',
  ownerOnly: true,
  role: 2,

  async execute(sock, msg, args, extra) {
    const tempDir = path.resolve(process.cwd(), 'temp');
    try {
      const files = await fs.readdir(tempDir);
      let deleted = 0;
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file)).catch(() => {});
        deleted++;
      }
      await extra.message.reply(`🧹 Cleaned temporary cache! Removed ${deleted} files.`);
    } catch (err) {
      await extra.message.reply(`❌ Error cleaning temp directory: ${err.message}`);
    }
  }
};
