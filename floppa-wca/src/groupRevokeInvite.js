"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function groupRevokeInvite(threadID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            const newCode = await sock.groupRevokeInvite(jid);
            const link = newCode ? "https://chat.whatsapp.com/" + newCode : null;
            callback(null, link);
            return link;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
