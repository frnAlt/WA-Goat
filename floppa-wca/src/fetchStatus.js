"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function fetchStatus(userID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(userID);
            const result = await sock.fetchStatus(jid);
            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
