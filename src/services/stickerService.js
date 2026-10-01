/**
 * Sticker Service for WhatsApp
 */

const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif } = require('../utils/exif');
const ff = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const logger = require('../utils/logger');

// Set ffmpeg path
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ff.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (_) {}

class StickerService {
  /**
   * Create sticker from image buffer
   */
  async createStickerFromImage(buffer, metadata = {}) {
    return await writeExifImg(buffer, {
      packname: metadata.packname || 'Goat Bot V2',
      author: metadata.author || 'Farhan',
      ...metadata
    });
  }

  /**
   * Create animated sticker from video or gif buffer
   */
  async createStickerFromVideo(buffer, metadata = {}) {
    return await writeExifVid(buffer, {
      packname: metadata.packname || 'Goat Bot V2',
      author: metadata.author || 'Farhan',
      ...metadata
    });
  }

  /**
   * Universal create sticker helper
   */
  async createSticker(buffer, isVideo = false, metadata = {}) {
    if (isVideo) {
      return this.createStickerFromVideo(buffer, metadata);
    }
    return this.createStickerFromImage(buffer, metadata);
  }

  /**
   * Convert WebP sticker to PNG/JPG image
   */
  async stickerToImage(webpBuffer) {
    const tmpIn = path.join(tmpdir(), `stk_${Crypto.randomBytes(6).toString('hex')}.webp`);
    const tmpOut = path.join(tmpdir(), `img_${Crypto.randomBytes(6).toString('hex')}.png`);

    await fs.writeFile(tmpIn, webpBuffer);

    try {
      await new Promise((resolve, reject) => {
        ff(tmpIn)
          .on('error', reject)
          .on('end', resolve)
          .toFormat('png')
          .save(tmpOut);
      });

      return await fs.readFile(tmpOut);
    } catch (err) {
      logger.error('Failed to convert sticker to image:', err.message);
      throw err;
    } finally {
      fs.unlink(tmpIn).catch(() => {});
      fs.unlink(tmpOut).catch(() => {});
    }
  }

  /**
   * Modify sticker packname and author
   */
  async modifyPack(webpBuffer, packname, author) {
    return await writeExif(webpBuffer, { packname, author });
  }
}

module.exports = new StickerService();
