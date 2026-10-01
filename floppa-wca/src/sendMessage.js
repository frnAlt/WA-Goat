"use strict";

const utils = require("../utils");

/**
 * Build a single Baileys content object from an attachment descriptor.
 */
function attToContent(att, caption) {
    const src = att.url    ? { url: att.url }
              : att.buffer ? att.buffer
              : att.stream ? { stream: att.stream }
              : att.path   ? { url: att.path }
              : null;
    if (!src) return null;

    if (att.type === "image")
        return { image: src, caption: caption || att.caption || "", mimetype: att.mimetype || "image/jpeg" };
    if (att.type === "video")
        return { video: src, caption: caption || att.caption || "", mimetype: att.mimetype || "video/mp4", gifPlayback: !!att.gif };
    if (att.type === "audio" || att.type === "ptt")
        return { audio: src, mimetype: att.mimetype || "audio/ogg; codecs=opus", ptt: att.ptt || att.type === "ptt" };
    if (att.type === "document")
        return { document: src, mimetype: att.mimetype || "application/octet-stream", fileName: att.filename || att.name || "file", caption: caption || att.caption || "" };
    if (att.type === "sticker")
        return { sticker: src, mimetype: "image/webp", isAnimated: att.isAnimated || false };
    return null;
}

/**
 * api.sendMessage(msg, threadID, [callback], [options])
 *
 * --- String form ---
 *   api.sendMessage("Hello", threadID)
 *
 * --- Object form ---
 *   api.sendMessage({ body: "text", attachment: { type, url } }, threadID)
 *   api.sendMessage({ body: "text", attachment: [ att1, att2 ] }, threadID)  ← Promise.all
 *   api.sendMessage({ body: "text", replyToMessage: msg.raw },   threadID)
 *   api.sendMessage({ body: "text", mentions: ["628xxx@s.whatsapp.net"] }, threadID)
 *   api.sendMessage({ location: { latitude, longitude, name } }, threadID)
 *   api.sendMessage({ sticker: { url } }, threadID)
 *   api.sendMessage({ emoji: "👍" },      threadID)
 *
 * --- options ---
 *   { replyToMessage: rawWAMessage | messageID }
 */
module.exports = function (sock, api, ctx) {
    return async function sendMessage(msg, threadID, callback, options) {
        if (typeof callback !== "function") {
            options  = callback;
            callback = function () {};
        }
        options = options || {};

        try {
            // Resolve @lid JIDs → phone JIDs before sending so Baileys can deliver
            let _tid = threadID;
            if (utils.isLID(_tid)) {
                const resolved = utils.resolveLID(_tid, ctx.sock);
                if (resolved && resolved !== _tid) _tid = resolved;
            }
            const jid = utils.formatJID(_tid);

            // ── Resolve quoted / reply option ─────────────────────────────
            const quoteRef = options.replyToMessage || (msg && msg.replyToMessage);
            let sendOptions = {};
            if (quoteRef) {
                if (quoteRef && typeof quoteRef === "object" && quoteRef.key) {
                    sendOptions.quoted = quoteRef;
                } else if (quoteRef && typeof quoteRef === "object" && quoteRef.quoted) {
                    sendOptions.quoted = quoteRef.quoted;
                } else if (typeof quoteRef === "string") {
                    sendOptions.quoted = { key: { id: quoteRef, remoteJid: jid, fromMe: false }, message: { conversation: "" } };
                }
            }

            // ── Typing indicator ──────────────────────────────────────────
            const typing = ctx.globalOptions && ctx.globalOptions.enableTypingIndicator;
            if (typing) {
                try {
                    await sock.sendPresenceUpdate("composing", jid);
                    await utils.delay(ctx.globalOptions.typingDuration || 3000);
                } catch (_) {}
            }

            // ── Multiple attachments → Promise.all ────────────────────────
            if (msg && typeof msg === "object" && Array.isArray(msg.attachment)) {
                const atts = msg.attachment;
                const results = await Promise.all(
                    atts.map((att, i) => {
                        const cap = i === 0 ? (msg.body || msg.text || "") : "";
                        const content = attToContent(att, cap);
                        if (!content) return Promise.resolve(null);
                        return sock.sendMessage(jid, content, sendOptions);
                    })
                );
                if (typing) sock.sendPresenceUpdate("paused", jid).catch(() => {});
                if (typeof callback === "function") callback(null, results);
                return results;
            }

            // ── Single message ────────────────────────────────────────────
            let content = {};

            if (typeof msg === "string") {
                content = { text: msg };

            } else if (msg && typeof msg === "object") {
                const textBody = msg.body || msg.text || "";
                if (textBody) content.text = textBody;

                // mentions
                if (msg.mentions && msg.mentions.length) {
                    content.mentions = msg.mentions.map((m) => m.includes("@") ? m : utils.formatJID(m));
                }

                // single attachment
                if (msg.attachment && !Array.isArray(msg.attachment)) {
                    const c = attToContent(msg.attachment, textBody);
                    if (c) content = Object.assign(c, msg.mentions && msg.mentions.length ? { mentions: content.mentions } : {});
                }

                // sticker shorthand
                if (msg.sticker) {
                    const src = msg.sticker.url ? { url: msg.sticker.url } : (msg.sticker.buffer || msg.sticker);
                    content = { sticker: src };
                }

                // emoji
                if (msg.emoji) content.text = msg.emoji;

                // location
                if (msg.location) {
                    content = {
                        location: {
                            degreesLatitude:  msg.location.latitude  || msg.location.lat  || 0,
                            degreesLongitude: msg.location.longitude || msg.location.lon  || 0,
                            name:    msg.location.name    || "",
                            address: msg.location.address || "",
                        },
                    };
                }
            }

            const result = await sock.sendMessage(jid, content, sendOptions);
            if (typing) sock.sendPresenceUpdate("paused", jid).catch(() => {});
            if (typeof callback === "function") callback(null, result);
            return result;

        } catch (err) {
            if (typeof callback === "function") callback(err, null);
            throw err;
        }
    };
};
