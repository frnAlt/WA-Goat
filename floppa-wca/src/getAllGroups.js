"use strict";

const utils = require("../utils");

/**
 * getAllGroups — fetch metadata for every group the bot is currently in.
 * Useful for building a group database on startup.
 *
 * @param {function} [callback]
 * @returns {Promise<object[]>}
 */
module.exports = function (sock, api, ctx) {
    return async function getAllGroups(callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const raw = await sock.groupFetchAllParticipating();
            const groups = Object.values(raw).map((meta) => ({
                threadID:    meta.id,
                name:        meta.subject || "",
                description: meta.desc || "",
                owner:       meta.owner || null,
                creation:    meta.creation || null,
                size:        meta.size || (meta.participants || []).length,
                adminIDs:    (meta.participants || []).filter((p) => p.admin).map((p) => p.id),
                participantIDs: (meta.participants || []).map((p) => p.id),
                participants: (meta.participants || []).map((p) => ({
                    userID:       p.id,
                    isAdmin:      p.admin === "admin" || p.admin === "superadmin",
                    isSuperAdmin: p.admin === "superadmin",
                })),
                announcement: !!meta.announce,
                restrict:     !!meta.restrict,
                ephemeralDuration: meta.ephemeralDuration || null,
                isCommunity:  !!meta.isCommunity,
                isCommunityAnnounce: !!meta.isCommunityAnnounce,
                raw: meta,
            }));

            callback(null, groups);
            return groups;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
