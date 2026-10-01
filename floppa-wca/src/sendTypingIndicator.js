"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function sendTypingIndicator(isTyping, threadID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            await sock.sendPresenceUpdate(isTyping ? "composing" : "paused", jid);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
