/**
 * Centralized Media Service for WhatsApp
 */

const { downloadMediaMessage, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const FileType = require('file-type');
const logger = require('../utils/logger');

// Set ffmpeg path if installed
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ff.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (_) {}

class MediaService {
  /**
   * Download media from a Baileys message object or quoted message
   */
  async downloadMedia(msg, returnType = 'buffer') {
    try {
      if (!msg) throw new Error('No message provided for media download');

      // If it's already a buffer
      if (Buffer.isBuffer(msg)) return msg;

      // Extract raw message content
      let target = msg.msg || msg;
      if (target.quoted) target = target.quoted;

      // If downloadMediaMessage is applicable
      if (msg.message || target.mtype) {
        return await downloadMediaMessage(
          msg,
          returnType,
          {},
          { logger: { level: 'silent', child: () => ({ info: () => {}, error: () => {} }) } }
        );
      }

      // Fallback using downloadContentFromMessage
      const type = this.getMediaType(target);
      if (!type) throw new Error('Could not determine media type from message');

      const stream = await downloadContentFromMessage(target, type);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    } catch (err) {
      logger.error('Failed to download media:', err.message);
      throw err;
    }
  }

  /**
   * Determine media type string (image, video, audio, sticker, document)
   */
  getMediaType(message) {
    if (!message) return null;
    const m = message.message || message;
    if (m.imageMessage) return 'image';
    if (m.videoMessage) return 'video';
    if (m.audioMessage) return 'audio';
    if (m.stickerMessage) return 'sticker';
    if (m.documentMessage) return 'document';
    if (message.mtype) {
      return message.mtype.replace('Message', '').toLowerCase();
    }
    return null;
  }

  /**
   * Convert audio/video using ffmpeg
   */
  async convertAudio(inputBuffer, targetFormat = 'mp3', extraOptions = []) {
    const inputExt = 'ogg';
    const tmpIn = path.join(tmpdir(), `in_${Crypto.randomBytes(6).toString('hex')}.${inputExt}`);
    const tmpOut = path.join(tmpdir(), `out_${Crypto.randomBytes(6).toString('hex')}.${targetFormat}`);

    await fs.writeFile(tmpIn, inputBuffer);

    try {
      await new Promise((resolve, reject) => {
        let cmd = ff(tmpIn)
          .on('error', reject)
          .on('end', resolve)
          .toFormat(targetFormat);

        if (extraOptions.length > 0) {
          cmd.addOutputOptions(extraOptions);
        }
        cmd.save(tmpOut);
      });

      return await fs.readFile(tmpOut);
    } finally {
      fs.unlink(tmpIn).catch(() => {});
      fs.unlink(tmpOut).catch(() => {});
    }
  }

  /**
   * Detect buffer MIME type
   */
  async detectType(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) return null;
    if (typeof FileType.fileTypeFromBuffer === 'function') {
      return await FileType.fileTypeFromBuffer(buffer);
    }
    if (typeof FileType.fromBuffer === 'function') {
      return await FileType.fromBuffer(buffer);
    }
    return null;
  }
}

module.exports = new MediaService();
