"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getUserInfo(userIDs, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            if (!Array.isArray(userIDs)) userIDs = [userIDs];
            const result = {};

            for (const id of userIDs) {
                const jid = utils.formatJID(id);
                try {
                    const [status, pic] = await Promise.allSettled([
                        sock.fetchStatus(jid),
                        sock.profilePictureUrl(jid, "image").catch(() => null),
                    ]);

                    result[id] = {
                        userID: jid,
                        name: null,
                        status: status.status === "fulfilled" ? status.value?.status || "" : "",
                        profilePicture: pic.status === "fulfilled" ? pic.value : null,
                    };
                } catch (_) {
                    result[id] = { userID: jid, name: null, status: "", profilePicture: null };
                }
            }

            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
