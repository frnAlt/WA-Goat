/**
 * Permissions & Role Management System
 * Emulates GoatBot V2 role hierarchy:
 * 0 = Normal Member
 * 1 = Group Admin
 * 2 = Bot Admin
 * 3 = Premium User
 * 4 = Bot Owner / Developer
 */

const config = require('../config');
const groupService = require('../services/groupService');
const { decodeJid } = require('../utils/myfunc');

const ROLES = {
  MEMBER: 0,
  GROUP_ADMIN: 1,
  BOT_ADMIN: 2,
  PREMIUM: 3,
  OWNER: 4
};

function cleanNumber(jid) {
  if (!jid) return '';
  return decodeJid(jid).replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');
}

class PermissionManager {
  /**
   * Check if a sender is Bot Owner
   */
  isOwner(senderJid, sock = null) {
    const num = cleanNumber(senderJid);
    if (!num) return false;

    // Configured owner number and dev users
    if (num === config.ownerNumber || (config.devUsers && config.devUsers.includes(num))) {
      return true;
    }

    // Auto-detect logged-in bot account as owner (supports GitHub Actions headless runs)
    try {
      const client = require('./client');
      const activeSock = sock || client?.sock || global.api?.sock;
      const botNum = cleanNumber(activeSock?.user?.id || global.floppaWca?.selfID || global.api?.selfID);
      if (botNum && num === botNum) {
        return true;
      }
      // If ownerNumber is still default dummy '1234567890' or unconfigured, treat the bot account as owner
      if ((!config.ownerNumber || config.ownerNumber === '1234567890') && botNum) {
        return num === botNum;
      }
    } catch (_) {}

    return false;
  }

  /**
   * Check if sender is Bot Admin (role 2+)
   */
  isBotAdmin(senderJid, sock = null) {
    const num = cleanNumber(senderJid);
    if (!num) return false;
    if (this.isOwner(senderJid, sock)) return true;
    return Boolean(config.adminBot && config.adminBot.includes(num));
  }

  /**
   * Check if sender is Premium User (role 3+)
   */
  isPremium(senderJid) {
    const num = cleanNumber(senderJid);
    if (!num) return false;
    if (this.isBotAdmin(senderJid)) return true;
    return config.premiumUsers && config.premiumUsers.includes(num);
  }

  /**
   * Resolve maximum role for a sender in a specific chat
   */
  async getRole(sock, chatJid, senderJid) {
    if (this.isOwner(senderJid, sock)) return ROLES.OWNER;
    if (this.isBotAdmin(senderJid, sock)) return ROLES.BOT_ADMIN;
    if (this.isPremium(senderJid)) return ROLES.PREMIUM;

    if (chatJid && chatJid.endsWith('@g.us')) {
      const isGroupAdmin = await groupService.isUserAdmin(sock, chatJid, senderJid);
      if (isGroupAdmin) return ROLES.GROUP_ADMIN;
    }

    return ROLES.MEMBER;
  }

  /**
   * Validate whether sender has required role for a command
   */
  async hasPermission(sock, chatJid, senderJid, requiredRole = 0) {
    if (requiredRole === 0) return true;
    const userRole = await this.getRole(sock, chatJid, senderJid);

    // Group admin requirement
    if (requiredRole === ROLES.GROUP_ADMIN) {
      return userRole >= ROLES.GROUP_ADMIN;
    }

    // Bot admin requirement
    if (requiredRole === ROLES.BOT_ADMIN) {
      return userRole >= ROLES.BOT_ADMIN;
    }

    // Premium requirement
    if (requiredRole === ROLES.PREMIUM) {
      return userRole >= ROLES.PREMIUM;
    }

    // Owner requirement
    if (requiredRole >= ROLES.OWNER) {
      return userRole >= ROLES.OWNER;
    }

    return userRole >= requiredRole;
  }
}

module.exports = new PermissionManager();
module.exports.ROLES = ROLES;
