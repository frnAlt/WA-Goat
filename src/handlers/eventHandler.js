/**
 * Group & System Event Handler
 * Processes group participant updates, group metadata, and incoming calls
 */

const database = require('../database');
const groupService = require('../services/groupService');
const eventManager = require('../core/events');
const config = require('../config');
const logger = require('../utils/logger');
const { decodeJid } = require('../utils/myfunc');

async function handleGroupParticipantsUpdate(sock, update) {
  try {
    const { id: groupId, participants, action } = update;
    if (!groupId || !participants || participants.length === 0) return;

    groupService.invalidateCache(groupId);
    const settings = database.getGroupSettings(groupId);

    // 1. Participant Joined (add)
    if (action === 'add') {
      const welcomeEvent = eventManager.get('welcome');
      if (welcomeEvent && typeof welcomeEvent.execute === 'function') {
        try {
          await welcomeEvent.execute({ sock, groupId, participants, settings });
          return;
        } catch (e) {
          logger.warn('[EVENT_WELCOME] Custom handler error:', e.message);
        }
      }

      if (settings.welcome) {
        const metadata = await groupService.getMetadata(sock, groupId);
        const groupName = metadata?.subject || 'this group';
        for (const user of participants) {
          const uNum = user.split('@')[0];
          const text = settings.customWelcome
            ? settings.customWelcome.replace('{user}', `@${uNum}`).replace('{group}', groupName)
            : `👋 Welcome @${uNum} to *${groupName}*! Please follow the rules and enjoy your stay.`;

          await sock.sendMessage(groupId, { text, mentions: [user] });
        }
      }
    }

    // 2. Participant Left / Removed (remove)
    if (action === 'remove') {
      const leaveEvent = eventManager.get('leave');
      if (leaveEvent && typeof leaveEvent.execute === 'function') {
        try {
          await leaveEvent.execute({ sock, groupId, participants, settings });
          return;
        } catch (e) {
          logger.warn('[EVENT_LEAVE] Custom handler error:', e.message);
        }
      }

      if (settings.goodbye) {
        const metadata = await groupService.getMetadata(sock, groupId);
        const groupName = metadata?.subject || 'the group';
        for (const user of participants) {
          const uNum = user.split('@')[0];
          const text = settings.customGoodbye
            ? settings.customGoodbye.replace('{user}', `@${uNum}`).replace('{group}', groupName)
            : `👋 Goodbye @${uNum}! We'll miss you from *${groupName}*.`;

          await sock.sendMessage(groupId, { text, mentions: [user] });
        }
      }
    }

    // 3. Promote to Admin
    if (action === 'promote') {
      for (const user of participants) {
        const uNum = user.split('@')[0];
        await sock.sendMessage(groupId, {
          text: `🎉 Congratulations @${uNum}! You have been promoted to Group Admin.`,
          mentions: [user]
        });
      }
    }

    // 4. Demote from Admin
    if (action === 'demote') {
      for (const user of participants) {
        const uNum = user.split('@')[0];
        await sock.sendMessage(groupId, {
          text: `ℹ️ @${uNum} is no longer a Group Admin.`,
          mentions: [user]
        });
      }
    }
  } catch (err) {
    logger.error('[GROUP_PARTICIPANTS] Error handling update:', err.message);
  }
}

async function handleGroupUpdate(sock, updates) {
  try {
    for (const update of updates) {
      if (update.id) {
        groupService.invalidateCache(update.id);
      }
    }
  } catch (err) {
    logger.error('[GROUP_UPDATE] Error:', err.message);
  }
}

async function handleCalls(sock, calls) {
  try {
    if (!config.antiCall) return;

    for (const call of calls) {
      const callerJid = call.from || call.peerJid;
      if (!callerJid) continue;

      try {
        if (typeof sock.rejectCall === 'function' && call.id) {
          await sock.rejectCall(call.id, callerJid);
        }
      } catch (_) {}

      try {
        await sock.sendMessage(callerJid, {
          text: '📵 Anticall is active. Voice and video calls are not allowed. You will be blocked.'
        });
      } catch (_) {}

      setTimeout(async () => {
        try {
          await sock.updateBlockStatus(callerJid, 'block');
          logger.info(`[ANTICALL] Blocked caller: ${callerJid}`);
        } catch (_) {}
      }, 1000);
    }
  } catch (err) {
    logger.error('[ANTICALL] Error handling call:', err.message);
  }
}

module.exports = {
  handleGroupParticipantsUpdate,
  handleGroupUpdate,
  handleCalls
};
