"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function deleteMessage(threadID, messageID, forEveryone, callback) {
        if (typeof forEveryone === "function") {
            callback = forEveryone;
            forEveryone = true;
        }
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            const ref = messageID && messageID.key ? messageID.key : messageID;
            const key = ref && typeof ref === "object"
                ? {
                    remoteJid: utils.formatJID(ref.remoteJid || jid),
                    id:        ref.id || "",
                    fromMe:    typeof ref.fromMe === "boolean" ? ref.fromMe : true,
                    ...(ref.participant ? { participant: ref.participant } : {}),
                }
                : {
                    remoteJid: jid,
                    id:        messageID,
                    fromMe:    true,
                };

            if (!key.id) throw new Error("Missing message id for deleteMessage");

            if (forEveryone) {
                await sock.sendMessage(jid, { delete: key });
            } else {
                await sock.chatModify(
                    { clear: { messages: [{ id: key.id, fromMe: key.fromMe }] } },
                    jid
                );
            }

            callback(null, true);
            return true;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
