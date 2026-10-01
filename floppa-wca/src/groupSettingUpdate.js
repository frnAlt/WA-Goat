"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function groupSettingUpdate(threadID, setting, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            await sock.groupSettingUpdate(jid, setting);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
