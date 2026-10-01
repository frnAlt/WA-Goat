"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return {
        promoteAdmin: async function (threadID, userIDs, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(threadID);
                if (!Array.isArray(userIDs)) userIDs = [userIDs];
                const normalized = userIDs.map((id) => utils.formatJID(id));
                const result = await sock.groupParticipantsUpdate(jid, normalized, "promote");
                callback(null, result);
                return result;
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
        demoteAdmin: async function (threadID, userIDs, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(threadID);
                if (!Array.isArray(userIDs)) userIDs = [userIDs];
                const normalized = userIDs.map((id) => utils.formatJID(id));
                const result = await sock.groupParticipantsUpdate(jid, normalized, "demote");
                callback(null, result);
                return result;
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
    };
};
