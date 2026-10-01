"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return {
        archiveChat: async function archiveChat(threadID, archive, callback) {
            if (typeof archive === "function") { callback = archive; archive = true; }
            if (typeof callback !== "function") callback = function () {};
            archive = archive !== false;
            try {
                const jid = utils.formatJID(threadID);
                await sock.chatModify({ archive }, jid);
                callback(null, { threadID: jid, archived: archive });
                return { threadID: jid, archived: archive };
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
        unarchiveChat: async function unarchiveChat(threadID, callback) {
            if (typeof callback !== "function") callback = function () {};
            try {
                const jid = utils.formatJID(threadID);
                await sock.chatModify({ archive: false }, jid);
                callback(null, { threadID: jid, archived: false });
                return { threadID: jid, archived: false };
            } catch (err) {
                callback(err, null);
                throw err;
            }
        },
    };
};
