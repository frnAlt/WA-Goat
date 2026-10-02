"use strict";

const { Server } = require("socket.io");

const log = {
  info: (tag, ...a) => console.log(`[INFO] ${tag}:`, ...a),
  err:  (tag, ...a) => console.error(`[ERR]  ${tag}:`, ...a),
  warn: (tag, ...a) => console.warn(`[WARN] ${tag}:`, ...a),
  success: (tag, ...a) => console.log(`[DONE] ${tag}:`, ...a)
};

let _server = null;
let _io     = null;

/**
 * Socket.IO setup — attaches to an existing http.Server.
 */
async function _socketSetup(server) {
  const cfg = (global.GoatBot && global.GoatBot.config && global.GoatBot.config.serverUptime &&
               global.GoatBot.config.serverUptime.socket) || {};
  const channelName = cfg.channelName || "uptime";
  const verifyToken = cfg.verifyToken || "goatbotkey";

  let io;
  try {
    io = new Server(server, { cors: { origin: "*" } });
    _io = io;
    log.info("SOCKET.IO", `Listening — channel="${channelName}"`);
  } catch (err) {
    return log.err("SOCKET.IO", `Init failed: ${err && err.message ? err.message : err}`);
  }

  io.on("connection", (socket) => {
    const token = (socket.handshake.auth && socket.handshake.auth.verifyToken) ||
                  (socket.handshake.query && socket.handshake.query.verifyToken);
    if (token !== verifyToken) {
      socket.emit(channelName, { status: "error", message: "Token is invalid" });
      socket.disconnect();
      return;
    }
    log.info("SOCKET.IO", `Client connected: ${socket.id}`);
    socket.emit(channelName, { status: "success", message: "Connected to server successfully" });

    const tick = setInterval(() => {
      try {
        socket.emit(channelName, {
          status: "ok", uptime: process.uptime(),
          memory: process.memoryUsage().rss, ts: Date.now(),
        });
      } catch (_) {}
    }, 30000);

    socket.on("disconnect", () => {
      clearInterval(tick);
      log.info("SOCKET.IO", `Client disconnected: ${socket.id}`);
    });
  });
}

function getIO()     { return _io; }
function getServer() { return _server; }

module.exports = {
  _socketSetup,
  getIO,
  getServer
};
