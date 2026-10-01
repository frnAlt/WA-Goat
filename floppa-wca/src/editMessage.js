"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function editMessage(threadID, messageID, newText, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            const result = await sock.sendMessage(jid, {
                text: newText || "",
                edit: { remoteJid: jid, id: messageID, fromMe: true },
            });
            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
