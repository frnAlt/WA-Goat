"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getGroupInviteLink(threadID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            const code = await sock.groupInviteCode(jid);
            const link = "https://chat.whatsapp.com/" + code;
            callback(null, link);
            return link;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
