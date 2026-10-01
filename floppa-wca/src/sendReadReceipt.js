"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function sendReadReceipt(threadID, senderID, messageIDs, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            if (!Array.isArray(messageIDs)) messageIDs = [messageIDs];

            const keys = messageIDs.map((id) => ({
                remoteJid: jid,
                id: id,
                fromMe: false,
                participant: utils.isGroupJID(jid) ? utils.formatJID(senderID) : undefined,
            }));

            await sock.readMessages(keys);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
