"use strict";

module.exports = function (sock, api, ctx) {
    return async function sendPresenceUpdate(type, threadID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = threadID ? require("../utils").formatJID(threadID) : undefined;
            await sock.sendPresenceUpdate(type, jid);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
