"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return {
        blockContact: async function blockContact(userID, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(userID);
                await sock.updateBlockStatus(jid, "block");
                callback(null, true);
                return true;
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
        unblockContact: async function unblockContact(userID, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(userID);
                await sock.updateBlockStatus(jid, "unblock");
                callback(null, true);
                return true;
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
    };
};
