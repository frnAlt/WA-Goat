/**
 * Group Management Service for WhatsApp
 */

const { decodeJid } = require('../utils/myfunc');
const logger = require('../utils/logger');

class GroupService {
  constructor() {
    this.metadataCache = new Map();
    this.cacheTTL = 60 * 1000; // 1 minute
  }

  /**
   * Get cached group metadata to prevent rate limits
   */
  async getMetadata(sock, groupId) {
    if (!groupId || !groupId.endsWith('@g.us')) return null;
    if (!sock || typeof sock.groupMetadata !== 'function') return null;

    const cached = this.metadataCache.get(groupId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const data = await sock.groupMetadata(groupId);
      this.metadataCache.set(groupId, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      if (err.message && (err.message.includes('forbidden') || err.message.includes('403'))) {
        this.metadataCache.set(groupId, { data: null, timestamp: Date.now() });
      }
      return cached ? cached.data : null;
    }
  }

  /**
   * Invalidate cache when group changes occur
   */
  invalidateCache(groupId) {
    this.metadataCache.delete(groupId);
  }

  /**
   * Check if a specific user is group admin
   */
  async isUserAdmin(sock, groupId, userId) {
    const metadata = await this.getMetadata(sock, groupId);
    if (!metadata || !metadata.participants) return false;

    const cleanUser = decodeJid(userId);
    return metadata.participants.some(
      p => decodeJid(p.id) === cleanUser && (p.admin === 'admin' || p.admin === 'superadmin')
    );
  }

  /**
   * Check if the bot is group admin
   */
  async isBotAdmin(sock, groupId) {
    const botId = decodeJid(sock.user?.id);
    return this.isUserAdmin(sock, groupId, botId);
  }

  /**
   * Add participants to group
   */
  async addParticipants(sock, groupId, participants) {
    const jids = Array.isArray(participants) ? participants : [participants];
    this.invalidateCache(groupId);
    return await sock.groupParticipantsUpdate(groupId, jids, 'add');
  }

  /**
   * Remove participants from group
   */
  async removeParticipants(sock, groupId, participants) {
    const jids = Array.isArray(participants) ? participants : [participants];
    this.invalidateCache(groupId);
    return await sock.groupParticipantsUpdate(groupId, jids, 'remove');
  }

  /**
   * Promote participants to admin
   */
  async promoteParticipants(sock, groupId, participants) {
    const jids = Array.isArray(participants) ? participants : [participants];
    this.invalidateCache(groupId);
    return await sock.groupParticipantsUpdate(groupId, jids, 'promote');
  }

  /**
   * Demote admin participants
   */
  async demoteParticipants(sock, groupId, participants) {
    const jids = Array.isArray(participants) ? participants : [participants];
    this.invalidateCache(groupId);
    return await sock.groupParticipantsUpdate(groupId, jids, 'demote');
  }

  /**
   * Update group subject (name)
   */
  async updateSubject(sock, groupId, subject) {
    this.invalidateCache(groupId);
    return await sock.groupUpdateSubject(groupId, subject);
  }

  /**
   * Update group description
   */
  async updateDescription(sock, groupId, description) {
    this.invalidateCache(groupId);
    return await sock.groupUpdateDescription(groupId, description);
  }

  /**
   * Set announcement mode (only admins can send messages)
   */
  async setMute(sock, groupId, isMuted = true) {
    return await sock.groupSettingUpdate(groupId, isMuted ? 'announcement' : 'not_announcement');
  }

  /**
   * Get group invite link
   */
  async getInviteCode(sock, groupId) {
    return await sock.groupInviteCode(groupId);
  }

  /**
   * Revoke group invite link
   */
  async revokeInviteCode(sock, groupId) {
    return await sock.groupRevokeInvite(groupId);
  }
}

module.exports = new GroupService();
