/**
 * Warning Limit Monitor Event
 */

const database = require('../database');
const groupService = require('../services/groupService');
const logger = require('../utils/logger');

module.exports = {
  config: {
    name: 'checkwarn',
    version: '2.0',
    author: 'frnAlt',
    description: 'Monitors member warnings and kicks if threshold is reached'
  },

  async checkAndKick({ sock, groupId, userId }) {
    const settings = database.getGroupSettings(groupId);
    const limit = settings.warnLimit || 3;
    const warnings = database.getWarnings(groupId, userId);

    if (warnings >= limit) {
      const isBotAdmin = await groupService.isBotAdmin(sock, groupId);
      if (isBotAdmin) {
        await groupService.removeParticipants(sock, groupId, userId);
        database.resetWarnings(groupId, userId);
        const uNum = userId.split('@')[0];
        await sock.sendMessage(groupId, {
          text: `🚫 @${uNum} reached ${limit} warnings and has been removed from the group.`,
          mentions: [userId]
        });
        logger.info(`[CHECKWARN] User ${userId} kicked from ${groupId} due to ${limit} warnings.`);
      }
    }
  }
};
