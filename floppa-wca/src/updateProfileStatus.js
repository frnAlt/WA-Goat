"use strict";

module.exports = function (sock, api, ctx) {
    return async function updateProfileStatus(status, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            await sock.updateProfileStatus(status);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
