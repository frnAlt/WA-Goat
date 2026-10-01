"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function createGroup(name, participantIDs, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            if (!Array.isArray(participantIDs)) participantIDs = [participantIDs];
            const participants = participantIDs.map((id) => utils.formatJID(id));
            const meta = await sock.groupCreate(name, participants);
            callback(null, { threadID: meta.id, name: meta.subject, raw: meta });
            return meta;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
