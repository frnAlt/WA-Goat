"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function addUserToGroup(threadID, userIDs, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            if (!Array.isArray(userIDs)) userIDs = [userIDs];

            const normalizedIDs = userIDs.map((id) => utils.formatJID(id));
            const result = await sock.groupParticipantsUpdate(jid, normalizedIDs, "add");

            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
