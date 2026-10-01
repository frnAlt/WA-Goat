"use strict";

module.exports = function (sock, api, ctx) {
    return async function updateProfileName(name, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            await sock.updateProfileName(name);
            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
