"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return {
        pinMessage: async function pinMessage(threadID, messageID, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(threadID);
                const result = await sock.sendMessage(jid, {
                    pin: { type: 1, time: 604800 },
                    edit: { remoteJid: jid, id: messageID, fromMe: false },
                });
                callback(null, result);
                return result;
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
        unpinMessage: async function unpinMessage(threadID, messageID, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(threadID);
                const result = await sock.sendMessage(jid, {
                    pin: { type: 2, time: 0 },
                    edit: { remoteJid: jid, id: messageID, fromMe: false },
                });
                callback(null, result);
                return result;
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
    };
};
