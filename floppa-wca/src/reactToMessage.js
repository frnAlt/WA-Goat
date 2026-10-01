"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function reactToMessage(threadID, messageID, reaction, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(threadID);
            const ref = messageID && messageID.key ? messageID.key : messageID;
            const key = ref && typeof ref === "object"
                ? {
                    remoteJid: utils.formatJID(ref.remoteJid || jid),
                    id:        ref.id || "",
                    fromMe:    typeof ref.fromMe === "boolean" ? ref.fromMe : false,
                    ...(ref.participant ? { participant: ref.participant } : {}),
                }
                : {
                    remoteJid: jid,
                    id:        messageID,
                    fromMe:    false,
                };

            if (!key.id) throw new Error("Missing message id for reactToMessage");

            const result = await sock.sendMessage(jid, {
                react: {
                    text: reaction,
                    key: key,
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
