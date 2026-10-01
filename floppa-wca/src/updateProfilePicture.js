"use strict";

module.exports = function (sock, api, ctx) {
    return async function updateProfilePicture(media, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const selfJid = ctx.selfID;
            await sock.updateProfilePicture(selfJid, media);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
