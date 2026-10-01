"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getGroupInfo(threadID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            if (!jid.endsWith("@g.us")) throw new Error("Not a group JID: " + jid);

            const meta = await sock.groupMetadata(jid);
            const formatted = {
                threadID: meta.id,
                name: meta.subject,
                description: meta.desc || "",
                adminIDs: (meta.participants || [])
                    .filter((p) => p.admin)
                    .map((p) => p.id),
                participantIDs: (meta.participants || []).map((p) => p.id),
                participants: (meta.participants || []).map((p) => ({
                    userID: p.id,
                    isAdmin: p.admin === "admin" || p.admin === "superadmin",
                    isSuperAdmin: p.admin === "superadmin",
                })),
                inviteLink: null,
                announcement: !!meta.announce,
                restrict: !!meta.restrict,
                creation: meta.creation,
                owner: meta.owner,
                size: meta.size || (meta.participants || []).length,
                ephemeralDuration: meta.ephemeralDuration,
                raw: meta,
            };

            callback(null, formatted);
            return formatted;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
