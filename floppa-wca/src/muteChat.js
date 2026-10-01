"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return {
        muteChat: async function muteChat(threadID, durationMs, callback) {
            if (typeof durationMs === "function") { callback = durationMs; durationMs = 8 * 60 * 60 * 1000; }
            if (typeof callback !== "function") callback = function () {};
            durationMs = durationMs || 8 * 60 * 60 * 1000;
            try {
                const jid = utils.formatJID(threadID);
                const muteEndTime = Date.now() + durationMs;
                await sock.chatModify({ mute: muteEndTime }, jid);
                callback(null, { threadID: jid, muted: true, muteEndTime });
                return { threadID: jid, muted: true, muteEndTime };
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
        unmuteChat: async function unmuteChat(threadID, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(threadID);
                await sock.chatModify({ mute: null }, jid);
                callback(null, { threadID: jid, muted: false });
                return { threadID: jid, muted: false };
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
    };
};
