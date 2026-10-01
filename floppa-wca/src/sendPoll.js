"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function sendPoll(threadID, question, options, opts, callback) {
        if (typeof opts === "function") { callback = opts; opts = {}; }
        if (typeof callback !== "function") callback = function () {};
        opts = opts || {};
        try {
            const jid = utils.formatJID(threadID);
            if (!Array.isArray(options) || options.length < 2)
                throw new Error("sendPoll: options must be an array with at least 2 items");

            const pollOptions = options.map((o) => ({ optionName: typeof o === "string" ? o : String(o) }));
            const result = await sock.sendMessage(jid, {
                poll: {
                    name: question || "Poll",
                    values: pollOptions.map((o) => o.optionName),
                    selectableCount: opts.selectableCount !== undefined ? opts.selectableCount : 1,
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
