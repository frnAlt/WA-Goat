"use strict";

module.exports = function (sock, api, ctx) {
    return async function downloadMedia(message, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const { downloadMediaMessage } = await import("../../lib/Utils/messages-media.js");
            const buffer = await downloadMediaMessage(message, "buffer", {});
            callback(null, buffer);
            return buffer;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
