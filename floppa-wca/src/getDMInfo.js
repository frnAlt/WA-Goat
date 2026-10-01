"use strict";

const utils = require("../utils");

/**
 * getDMInfo — fetch full info about a DM (single-user chat).
 * Returns structured data suitable for database storage.
 *
 * @param {string} userID   Phone JID or raw phone number
 * @param {function} [callback]
 * @returns {Promise<object>}
 */
module.exports = function (sock, api, ctx) {
    return async function getDMInfo(userID, callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const jid = utils.formatJID(userID);
            if (!jid.endsWith("@s.whatsapp.net"))
                throw new Error("getDMInfo: not a DM JID — " + jid);

            const [statusRes, picRes, busRes] = await Promise.allSettled([
                sock.fetchStatus(jid),
                sock.profilePictureUrl(jid, "image"),
                sock.getBusinessProfile(jid).catch(() => null),
            ]);

            const contactMap = sock.contacts || {};
            const contactEntry = contactMap[jid] || contactMap[jid.split(":")[0] + "@s.whatsapp.net"] || {};

            const result = {
                userID:         jid,
                phone:          jid.split("@")[0],
                name:           contactEntry.name || contactEntry.notify || contactEntry.verifiedName || null,
                status:         statusRes.status === "fulfilled" ? (statusRes.value?.status || "") : "",
                statusTimestamp: statusRes.status === "fulfilled" ? (statusRes.value?.setAt || null) : null,
                profilePicture: picRes.status === "fulfilled" ? picRes.value : null,
                isBusiness:     busRes.status === "fulfilled" && !!busRes.value,
                businessProfile: busRes.status === "fulfilled" ? busRes.value : null,
                isMe:           jid === ctx.selfID || jid.split(":")[0] + "@s.whatsapp.net" === ctx.selfID,
                raw: {
                    status:          statusRes.status === "fulfilled" ? statusRes.value : null,
                    businessProfile: busRes.status === "fulfilled" ? busRes.value : null,
                    contact:         contactEntry,
                },
            };

            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
