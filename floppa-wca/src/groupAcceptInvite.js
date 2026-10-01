"use strict";

module.exports = function (sock, api, ctx) {
    return async function groupAcceptInvite(code, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const cleanCode = code.replace("https://chat.whatsapp.com/", "");
            const jid = await sock.groupAcceptInvite(cleanCode);
            callback(null, jid);
            return jid;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
