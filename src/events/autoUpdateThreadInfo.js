/**
 * Auto Update Group Info Event
 */

const database = require('../database');
const groupService = require('../services/groupService');

module.exports = {
  config: {
    name: 'autoUpdateThreadInfo',
    version: '2.0',
    author: 'frnAlt',
    description: 'Syncs group metadata changes to database'
  },

  async execute({ sock, groupId }) {
    if (!groupId || !groupId.endsWith('@g.us')) return;
    const metadata = await groupService.getMetadata(sock, groupId);
    if (metadata) {
      database.threadsData.set(groupId, {
        threadName: metadata.subject,
        updatedAt: Date.now()
      });
    }
  }
};
