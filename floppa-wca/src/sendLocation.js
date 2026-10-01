"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function sendLocation(threadID, latitude, longitude, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        if (typeof callback !== "function") callback = function () {};
        options = options || {};

        try {
            const jid = utils.formatJID(threadID);
            const result = await sock.sendMessage(jid, {
                location: {
                    degreesLatitude: latitude,
                    degreesLongitude: longitude,
                    name: options.name || "",
                    address: options.address || "",
                },
            });
            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
