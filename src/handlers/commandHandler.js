/**
 * Centralized Command Execution and Permission Handler
 */

const commandManager = require('../core/command');
const permissions = require('../core/permissions');
const database = require('../database');
const { cooldownManager } = require('../services/cacheService');
const groupService = require('../services/groupService');
const logger = require('../utils/logger');
const config = require('../config');

async function handleCommand(ctx) {
  const { command: commandName, sender, chat, isGroup, sock, message, m } = ctx;

  if (!commandName) return;

  const cmd = commandManager.get(commandName);
  if (!cmd) return;

  // 1. Check if user is banned
  if (database.isBanned(sender)) {
    return; // Silently ignore banned users
  }

  // 2. Check if thread/group is banned
  if (isGroup && database.isThreadBanned(chat) && !ctx.isOwner && !ctx.isBotAdmin) {
    return; // Silently ignore banned groups
  }

  // 3. Group only check
  if (cmd.groupOnly && !isGroup) {
    return await message.reply('👥 This command can only be used in group chats.');
  }

  // 4. Permission verification
  const hasPerm = await permissions.hasPermission(sock, chat, sender, cmd.role);
  if (!hasPerm) {
    if (cmd.role === permissions.ROLES.GROUP_ADMIN) {
      return await message.reply('⚠️ You must be a Group Admin to use this command.');
    }
    if (cmd.role === permissions.ROLES.BOT_ADMIN) {
      return await message.reply('⚠️ This command is restricted to Bot Administrators.');
    }
    if (cmd.role >= permissions.ROLES.OWNER) {
      return await message.reply('👑 This command is restricted to the Bot Owner.');
    }
    return await message.reply('❌ You do not have permission to execute this command.');
  }

  // 5. Bot Admin needed verification
  if (cmd.botAdminNeeded && isGroup) {
    const isBotAdmin = await groupService.isBotAdmin(sock, chat);
    if (!isBotAdmin) {
      return await message.reply('⚠️ I need to be an Admin in this group to perform this action.');
    }
  }

  // 6. Cooldown verification
  if (!ctx.isOwner && !ctx.isBotAdmin) {
    const remainingCooldown = cooldownManager.isOnCooldown(sender, cmd.name, cmd.cooldown);
    if (remainingCooldown > 0) {
      return await message.reply(`⏳ Please wait ${remainingCooldown}s before reusing the "${cmd.name}" command.`);
    }
    cooldownManager.setCooldown(sender, cmd.name, cmd.cooldown);
  }

  // 7. Execute command safely
  logger.command(cmd.name, sender, isGroup);

  try {
    await cmd.execute(ctx);
  } catch (error) {
    logger.error(`[COMMAND_ERROR] Error running "${cmd.name}":`, error.message);
    logger.debug(error.stack);
    try {
      await message.reply(`❌ An error occurred while executing "${cmd.name}": ${error.message}`);
    } catch (_) {}
  }
}

module.exports = {
  handleCommand
};
