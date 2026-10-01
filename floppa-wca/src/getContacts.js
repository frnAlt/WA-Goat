"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getContacts(callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const raw = sock.contacts || {};
            const contacts = Object.entries(raw).map(([jid, c]) => ({
                userID:  utils.normalizeJID(jid, sock),
                name:    c.name || c.notify || c.verifiedName || "",
                phone:   jid.split("@")[0] || "",
                isMe:    jid === ctx.selfID,
                raw:     c,
            }));
            callback(null, contacts);
            return contacts;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
