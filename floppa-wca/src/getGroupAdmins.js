"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getGroupAdmins(threadID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            const meta = await sock.groupMetadata(jid);
            const admins = (meta.participants || [])
                .filter((p) => p.admin)
                .map((p) => p.id);
            callback(null, admins);
            return admins;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
