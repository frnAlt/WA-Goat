/**
 * WebP Sticker Exif and Converter Utility
 */

const fs = require('fs-extra');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const webp = require('node-webpmux');
const path = require('path');

// Configure ffmpeg binary if available
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ff.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (_) {}

async function imageToWebp(media) {
  const tmpFileOut = path.join(tmpdir(), `sticker_${Crypto.randomBytes(6).toString('hex')}.webp`);
  const tmpFileIn = path.join(tmpdir(), `input_${Crypto.randomBytes(6).toString('hex')}.jpg`);

  await fs.writeFile(tmpFileIn, media);

  try {
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
        ])
        .toFormat('webp')
        .save(tmpFileOut);
    });

    const buff = await fs.readFile(tmpFileOut);
    return buff;
  } finally {
    fs.unlink(tmpFileIn).catch(() => {});
    fs.unlink(tmpFileOut).catch(() => {});
  }
}

async function videoToWebp(media) {
  const tmpFileOut = path.join(tmpdir(), `sticker_${Crypto.randomBytes(6).toString('hex')}.webp`);
  const tmpFileIn = path.join(tmpdir(), `input_${Crypto.randomBytes(6).toString('hex')}.mp4`);

  await fs.writeFile(tmpFileIn, media);

  try {
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
          '-loop', '0',
          '-ss', '00:00:00',
          '-t', '00:00:07',
          '-preset', 'default',
          '-an',
          '-vsync', '0'
        ])
        .toFormat('webp')
        .save(tmpFileOut);
    });

    const buff = await fs.readFile(tmpFileOut);
    return buff;
  } finally {
    fs.unlink(tmpFileIn).catch(() => {});
    fs.unlink(tmpFileOut).catch(() => {});
  }
}

async function writeExifImg(media, metadata = {}) {
  let wMedia = await imageToWebp(media);
  const tmpFileIn = path.join(tmpdir(), `raw_${Crypto.randomBytes(6).toString('hex')}.webp`);
  const tmpFileOut = path.join(tmpdir(), `exif_${Crypto.randomBytes(6).toString('hex')}.webp`);

  await fs.writeFile(tmpFileIn, wMedia);

  try {
    if (metadata.packname || metadata.author) {
      const img = new webp.Image();
      const json = {
        'sticker-pack-id': metadata.packId || 'https://github.com/frnAlt/WA-Goat',
        'sticker-pack-name': metadata.packname || 'Goat Bot V2',
        'sticker-pack-publisher': metadata.author || 'Farhan Muh Tasim',
        'emojis': metadata.categories || ['🐐']
      };
      const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00
      ]);
      const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
      const exif = Buffer.concat([exifAttr, jsonBuff]);
      exif.writeUIntLE(jsonBuff.length, 14, 4);

      await img.load(tmpFileIn);
      img.exif = exif;
      await img.save(tmpFileOut);
      return await fs.readFile(tmpFileOut);
    }
    return wMedia;
  } finally {
    fs.unlink(tmpFileIn).catch(() => {});
    fs.unlink(tmpFileOut).catch(() => {});
  }
}

async function writeExifVid(media, metadata = {}) {
  let wMedia = await videoToWebp(media);
  const tmpFileIn = path.join(tmpdir(), `raw_${Crypto.randomBytes(6).toString('hex')}.webp`);
  const tmpFileOut = path.join(tmpdir(), `exif_${Crypto.randomBytes(6).toString('hex')}.webp`);

  await fs.writeFile(tmpFileIn, wMedia);

  try {
    if (metadata.packname || metadata.author) {
      const img = new webp.Image();
      const json = {
        'sticker-pack-id': metadata.packId || 'https://github.com/frnAlt/WA-Goat',
        'sticker-pack-name': metadata.packname || 'Goat Bot V2',
        'sticker-pack-publisher': metadata.author || 'Farhan Muh Tasim',
        'emojis': metadata.categories || ['🐐']
      };
      const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00
      ]);
      const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
      const exif = Buffer.concat([exifAttr, jsonBuff]);
      exif.writeUIntLE(jsonBuff.length, 14, 4);

      await img.load(tmpFileIn);
      img.exif = exif;
      await img.save(tmpFileOut);
      return await fs.readFile(tmpFileOut);
    }
    return wMedia;
  } finally {
    fs.unlink(tmpFileIn).catch(() => {});
    fs.unlink(tmpFileOut).catch(() => {});
  }
}

async function writeExif(media, metadata = {}) {
  let wMedia = media;
  const tmpFileIn = path.join(tmpdir(), `raw_${Crypto.randomBytes(6).toString('hex')}.webp`);
  const tmpFileOut = path.join(tmpdir(), `exif_${Crypto.randomBytes(6).toString('hex')}.webp`);

  await fs.writeFile(tmpFileIn, wMedia);

  try {
    const img = new webp.Image();
    const json = {
      'sticker-pack-id': metadata.packId || 'https://github.com/frnAlt/WA-Goat',
      'sticker-pack-name': metadata.packname || 'Goat Bot V2',
      'sticker-pack-publisher': metadata.author || 'Farhan Muh Tasim',
      'emojis': metadata.categories || ['🐐']
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
    return await fs.readFile(tmpFileOut);
  } finally {
    fs.unlink(tmpFileIn).catch(() => {});
    fs.unlink(tmpFileOut).catch(() => {});
  }
}

module.exports = {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  writeExif
};
