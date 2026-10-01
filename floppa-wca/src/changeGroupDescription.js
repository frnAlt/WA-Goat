"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function changeGroupDescription(threadID, description, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            await sock.groupUpdateDescription(jid, description);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
