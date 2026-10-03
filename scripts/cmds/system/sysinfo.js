"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const { createCanvas, isCanvasAvailable } = require('../../../func/canvasHelper.js');
const GIFEncoder = require("gif-encoder-2");

const WIDTH = 900;
const HEIGHT = 520;
const CACHE_DIR = path.join(__dirname, "cache");

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function truncate(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 0 && ctx.measureText(out + "...").width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + "...";
}

function readPackageJson(filePath) {
  try {
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (_) {
    return {};
  }
}

async function collectInfo(api) {
  const pkg = readPackageJson(path.resolve(process.cwd(), "package.json"));
  const wcaPkg = readPackageJson(path.resolve(process.cwd(), "floppa-wca", "package.json"));
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedSystemMem = totalMem - freeMem;
  const cpu = os.cpus()[0]?.model || "unknown";
  const uptime = global.humanDuration
    ? global.humanDuration(Date.now() - (global.ST?.startTime || Date.now()))
    : `${Math.floor(process.uptime())}s`;

  let users = 0;
  let threads = 0;
  try {
    if (global.ST?.DB) {
      users = await global.ST.DB.users.count();
      threads = await global.ST.DB.threads.count();
    } else if (global.db) {
      users = global.db.allUserData?.length || 0;
      threads = global.db.allThreadData?.length || 0;
    }
  } catch (_) {}

  const selfID = (api && typeof api.getCurrentUserID === "function" ? api.getCurrentUserID() : "") || "";
  const phone = selfID.split(":")[0].split("@")[0] || selfID || "unknown";
  const cfg = global.ST?.config || global.GoatBot?.config || {};
  const express = cfg.express || cfg.dashBoard || {};
  const listen = cfg.listen || {};

  return {
    botName: cfg.botName || "WA-Goat Bot",
    project: `${pkg.name || "WA-Goat"} v${pkg.version || "2.0.0"}`,
    account: phone,
    prefix: cfg.prefix || "!",
    uptime,
    node: process.version,
    platform: `${os.platform()} ${os.arch()}`,
    cpu,
    pid: process.pid,
    rss: mem.rss,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    usedSystemMem,
    totalMem,
    commands: global.ST?.cmds ? global.ST.cmds.size : (global.GoatBot?.commands?.size || 0),
    events: global.ST?.events ? global.ST.events.size : 0,
    onReply: global.ST?.onReply ? global.ST.onReply.size : 0,
    onReaction: global.ST?.onReaction ? global.ST.onReaction.size : 0,
    dbType: (cfg.database && cfg.database.type) || "json",
    users,
    threads,
    express: express.enable ? `on:${express.port || 5000}` : "off",
    listenEvents: listen.listenEvents !== false ? "on" : "off",
    selfListen: listen.selfListen ? "on" : "off",
    wca: wcaPkg.version || "floppa-wca",
    baileys: pkg.dependencies?.["@whiskeysockets/baileys"] || "v7.0.0",
    deps: Object.keys(pkg.dependencies || {}).length,
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawText(ctx, text, x, y, size = 16, color = "#e6edf3", weight = "normal", maxWidth = null) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Courier New", monospace`;
  ctx.textBaseline = "middle";
  if (maxWidth) {
    ctx.fillText(truncate(ctx, text, maxWidth), x, y);
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function drawCard(ctx, title, rows, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(13, 17, 23, 0.88)";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(48, 54, 61, 0.9)";
  ctx.stroke();

  drawText(ctx, title, x + 16, y + 22, 14, "#58a6ff", "bold");

  const startY = y + 48;
  const rowHeight = 24;
  rows.forEach(([label, value], idx) => {
    const curY = startY + idx * rowHeight;
    drawText(ctx, label, x + 16, curY, 13, "#8b949e", "normal");
    drawText(ctx, String(value), x + w - 16, curY, 13, "#f0f6fc", "bold", 220);
  });
  ctx.restore();
}

function drawFrame(ctx, info, frameIndex) {
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  drawText(ctx, info.botName, 44, 42, 28, "#58a6ff", "bold");
  drawText(ctx, "SYSTEM MONITOR", 44, 76, 12, "#7ee787", "bold");

  drawCard(ctx, "System", [
    ["Project", info.project],
    ["Account", info.account],
    ["Prefix", info.prefix],
    ["Uptime", info.uptime],
    ["DB", `${info.dbType} (${info.users} users, ${info.threads} threads)`],
  ], 44, 110, 390, 180);

  drawCard(ctx, "Memory", [
    ["RSS", formatBytes(info.rss)],
    ["Heap Used", formatBytes(info.heapUsed)],
    ["Heap Total", formatBytes(info.heapTotal)],
    ["Sys Mem", `${formatBytes(info.usedSystemMem)} / ${formatBytes(info.totalMem)}`],
  ], 466, 110, 390, 180);

  drawCard(ctx, "Runtime", [
    ["Node", info.node],
    ["Platform", info.platform],
    ["CPU", info.cpu],
    ["Engine", info.wca],
  ], 44, 310, 390, 170);

  drawCard(ctx, "Bot Stats", [
    ["Commands", `${info.commands}`],
    ["Events", `${info.events}`],
    ["Dashboard", `${info.express}`],
    ["Baileys", `${info.baileys}`],
  ], 466, 310, 390, 170);
}

async function createSystemGif(info) {
  if (!isCanvasAvailable || typeof createCanvas !== "function") return null;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  const encoder = new GIFEncoder(WIDTH, HEIGHT);

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(150);
  encoder.setQuality(10);

  for (let i = 0; i < 5; i++) {
    drawFrame(ctx, info, i);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

module.exports = {
  config: {
    name: "sysinfo",
    aliases: ["botinfo", "systeminfo"],
    version: "2.0.0",
    author: "ST | frnAlt",
    countDown: 10,
    role: 0,
    shortDescription: "Animated system info card",
    longDescription: "Generates an animated system info card using canvas and gif encoder.",
    category: "system",
    guide: { en: "{pn}" },
  },

  onStart: async ({ api, message }) => {
    const wait = await message.reply("⚡ Rendering system information...");
    let filePath = null;

    try {
      const info = await collectInfo(api);
      const buffer = await createSystemGif(info);

      if (buffer) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        filePath = path.join(CACHE_DIR, `sysinfo_${Date.now()}.gif`);
        fs.writeFileSync(filePath, buffer);

        if (wait?.messageID) await message.unsend(wait.messageID).catch(() => {});
        return await message.reply({
          body: `📊 ${info.botName} System Status\n⏱ Uptime: ${info.uptime}\n💾 Memory: ${formatBytes(info.rss)} / ${formatBytes(info.totalMem)}`,
          attachment: {
            type: "image",
            path: filePath,
            mimetype: "image/gif",
          },
        });
      }

      // Text fallback
      if (wait?.messageID) await message.unsend(wait.messageID).catch(() => {});
      return await message.reply(
        `🖥️ *${info.botName} System Status*\n\n` +
        `• *Project:* ${info.project}\n` +
        `• *Prefix:* ${info.prefix}\n` +
        `• *Uptime:* ${info.uptime}\n` +
        `• *Node:* ${info.node} (${info.platform})\n` +
        `• *CPU:* ${info.cpu}\n` +
        `• *Memory:* ${formatBytes(info.rss)} / ${formatBytes(info.totalMem)}\n` +
        `• *Database:* ${info.dbType} (${info.users} users, ${info.threads} groups)\n` +
        `• *Commands:* ${info.commands} loaded\n` +
        `• *Dashboard:* ${info.express}`
      );
    } catch (e) {
      if (wait?.messageID) await message.unsend(wait.messageID).catch(() => {});
      return message.reply("Failed to generate system info: " + e.message);
    } finally {
      if (filePath) {
        setTimeout(() => {
          try { fs.unlinkSync(filePath); } catch (_) {}
        }, 5000);
      }
    }
  },
};
