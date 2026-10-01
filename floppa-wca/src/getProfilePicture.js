"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getProfilePicture(userID, type, callback) {
        if (typeof type === "function") {
            callback = type;
            type = "image";
        }
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(userID);
            const url = await sock.profilePictureUrl(jid, type || "image");
            callback(null, url);
            return url;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
