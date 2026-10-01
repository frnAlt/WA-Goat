"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function changeGroupSubject(threadID, subject, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            await sock.groupUpdateSubject(jid, subject);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
