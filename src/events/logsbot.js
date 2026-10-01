/**
 * Bot Event Logger - Goat Bot V2 WhatsApp Edition
 */

const logger = require('../utils/logger');

module.exports = {
  config: {
    name: 'logsbot',
    version: '2.0',
    author: 'frnAlt',
    description: 'Logs important group events to terminal'
  },

  async execute({ type, groupId, actor, target }) {
    logger.info(`[EVENT] Type: ${type} | Group: ${groupId} | Actor: ${actor} | Target: ${target || 'N/A'}`);
  }
};
