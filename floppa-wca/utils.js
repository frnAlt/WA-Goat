"use strict";

const path = require("path");
const fs = require("fs");
const { createWriteStream } = require("fs");
const https = require("https");
const http = require("http");

// ─── JID helpers ──────────────────────────────────────────────────────────────

function formatJID(jid) {
    if (!jid) return "";
    if (typeof jid !== "string") jid = String(jid);
    if (jid.includes("@")) return jid;
    const cleaned = jid.replace(/[^0-9]/g, "");
    return cleaned + "@s.whatsapp.net";
}

function isGroupJID(jid) {
    return typeof jid === "string" && jid.endsWith("@g.us");
}

function isDMJID(jid) {
    return typeof jid === "string" &&
        (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid"));
}

function isLID(jid) {
    return typeof jid === "string" && jid.endsWith("@lid");
}

function normalizePhoneNumber(phone) {
    return String(phone).replace(/[^0-9]/g, "");
}

/**
 * Resolve a @lid JID to a @s.whatsapp.net JID using the Baileys contact store.
 * Returns the original jid if resolution fails.
 *
 * @param {string} jid
 * @param {object} sock  Baileys socket (has sock.contacts map)
 * @returns {string}
 */
function resolveLID(jid, sock) {
    if (!jid || !isLID(jid)) return jid;
    if (!sock) return jid;

    // Method 1: sock.contacts is a map  phoneJid → { id, name, lid, … }
    const contacts = sock.contacts || {};
    for (const [phoneJid, contact] of Object.entries(contacts)) {
        if (contact && contact.lid === jid) return phoneJid;
    }

    // Method 2: try the store if available
    if (sock.store && sock.store.contacts) {
        for (const [phoneJid, contact] of Object.entries(sock.store.contacts)) {
            if (contact && contact.lid === jid) return phoneJid;
        }
    }

    // Method 3: Bail — strip @lid, keep numeric part as phone number hint
    // e.g. 186393124970625@lid  — the numeric part is NOT a phone number,
    // it is an internal ID.  Return as-is so the caller can still work.
    return jid;
}

/**
 * Normalise any JID (resolve LID, strip device suffix).
 * e.g. "628xxx:5@s.whatsapp.net" → "628xxx@s.whatsapp.net"
 *      "186xxx@lid"              → "628xxx@s.whatsapp.net"  (when known)
 *
 * @param {string} jid
 * @param {object} [sock]
 * @returns {string}
 */
function normalizeJID(jid, sock) {
    if (!jid) return "";
    // Resolve LID first
    let resolved = sock ? resolveLID(jid, sock) : jid;
    // Strip device suffix  628xxx:5@s.whatsapp.net → 628xxx@s.whatsapp.net
    if (resolved.includes(":") && resolved.endsWith("@s.whatsapp.net")) {
        resolved = resolved.split(":")[0] + "@s.whatsapp.net";
    }
    return resolved;
}

// ─── Event formatting ─────────────────────────────────────────────────────────

/**
 * Maps Baileys group-participants action to FCA log type.
 */
const GROUP_ACTION_TO_LOG = {
    add:     "log:subscribe",
    remove:  "log:unsubscribe",
    leave:   "log:unsubscribe",
    promote: "log:thread-admins",
    demote:  "log:thread-admins",
};

/**
 * Extract body + contextInfo from any message content object.
 * Returns { body, contextInfo, mentions }
 */
function extractContent(msgContent) {
    if (!msgContent) return { body: "", contextInfo: null, mentions: [] };

    // Unwrap view-once / ephemeral wrappers
    const inner =
        msgContent.viewOnceMessage?.message ||
        msgContent.viewOnceMessageV2?.message?.viewOnceMessage?.message ||
        msgContent.ephemeralMessage?.message ||
        msgContent.documentWithCaptionMessage?.message ||
        msgContent;

    // Text variants
    if (inner.conversation)
        return { body: inner.conversation, contextInfo: null, mentions: [] };

    if (inner.extendedTextMessage) {
        const ctx = inner.extendedTextMessage.contextInfo || null;
        return {
            body: inner.extendedTextMessage.text || "",
            contextInfo: ctx,
            mentions: ctx?.mentionedJid || [],
        };
    }

    if (inner.imageMessage) {
        const ctx = inner.imageMessage.contextInfo || null;
        return {
            body: inner.imageMessage.caption || "",
            contextInfo: ctx,
            mentions: ctx?.mentionedJid || [],
        };
    }
    if (inner.videoMessage) {
        const ctx = inner.videoMessage.contextInfo || null;
        return {
            body: inner.videoMessage.caption || "",
            contextInfo: ctx,
            mentions: ctx?.mentionedJid || [],
        };
    }
    if (inner.audioMessage)
        return { body: "", contextInfo: inner.audioMessage.contextInfo || null, mentions: [] };
    if (inner.documentMessage)
        return {
            body: inner.documentMessage.caption || "",
            contextInfo: inner.documentMessage.contextInfo || null,
            mentions: [],
        };
    if (inner.stickerMessage)
        return { body: "", contextInfo: null, mentions: [] };
    if (inner.locationMessage)
        return { body: inner.locationMessage.name || "", contextInfo: null, mentions: [] };
    if (inner.contactMessage)
        return { body: inner.contactMessage.displayName || "", contextInfo: null, mentions: [] };
    if (inner.reactionMessage)
        return { body: inner.reactionMessage.text || "", contextInfo: null, mentions: [] };
    if (inner.pollCreationMessage)
        return { body: inner.pollCreationMessage.name || "", contextInfo: null, mentions: [] };
    if (inner.buttonsResponseMessage)
        return {
            body: inner.buttonsResponseMessage.selectedDisplayText ||
                  inner.buttonsResponseMessage.selectedButtonId || "",
            contextInfo: null,
            mentions: [],
        };
    if (inner.listResponseMessage)
        return { body: inner.listResponseMessage.title || "", contextInfo: null, mentions: [] };
    if (inner.templateButtonReplyMessage)
        return { body: inner.templateButtonReplyMessage.selectedDisplayText || "", contextInfo: null, mentions: [] };

    return { body: "", contextInfo: null, mentions: [] };
}

/**
 * Extract the body text from a quoted/raw message content map.
 */
function extractBodyFromMessage(msgContent) {
    if (!msgContent) return "";
    if (msgContent.conversation) return msgContent.conversation;
    if (msgContent.extendedTextMessage) return msgContent.extendedTextMessage.text || "";
    if (msgContent.imageMessage) return msgContent.imageMessage.caption || "[Image]";
    if (msgContent.videoMessage) return msgContent.videoMessage.caption || "[Video]";
    if (msgContent.audioMessage) return "[Audio]";
    if (msgContent.documentMessage) return msgContent.documentMessage.fileName || "[Document]";
    if (msgContent.stickerMessage) return "[Sticker]";
    if (msgContent.locationMessage) return "[Location]";
    if (msgContent.contactMessage) return "[Contact]";
    if (msgContent.reactionMessage) return msgContent.reactionMessage.text || "[Reaction]";
    return "";
}

/**
 * Build the attachments array from a message content object.
 */
function buildAttachments(msgContent) {
    const atts = [];
    if (!msgContent) return atts;

    const inner =
        msgContent.viewOnceMessage?.message ||
        msgContent.viewOnceMessageV2?.message?.viewOnceMessage?.message ||
        msgContent.ephemeralMessage?.message ||
        msgContent.documentWithCaptionMessage?.message ||
        msgContent;

    if (inner.imageMessage)
        atts.push({
            type: "image",
            mimetype: inner.imageMessage.mimetype || "image/jpeg",
            caption: inner.imageMessage.caption || "",
            fileLength: inner.imageMessage.fileLength,
            width: inner.imageMessage.width,
            height: inner.imageMessage.height,
            url: inner.imageMessage.url,
            raw: inner.imageMessage,
        });
    else if (inner.videoMessage)
        atts.push({
            type: inner.videoMessage.gifPlayback ? "gif" : "video",
            mimetype: inner.videoMessage.mimetype || "video/mp4",
            caption: inner.videoMessage.caption || "",
            fileLength: inner.videoMessage.fileLength,
            seconds: inner.videoMessage.seconds,
            gif: !!inner.videoMessage.gifPlayback,
            url: inner.videoMessage.url,
            raw: inner.videoMessage,
        });
    else if (inner.audioMessage)
        atts.push({
            type: inner.audioMessage.ptt ? "ptt" : "audio",
            mimetype: inner.audioMessage.mimetype || "audio/ogg; codecs=opus",
            ptt: !!inner.audioMessage.ptt,
            seconds: inner.audioMessage.seconds,
            fileLength: inner.audioMessage.fileLength,
            url: inner.audioMessage.url,
            raw: inner.audioMessage,
        });
    else if (inner.documentMessage)
        atts.push({
            type: "document",
            mimetype: inner.documentMessage.mimetype || "application/octet-stream",
            filename: inner.documentMessage.fileName || "file",
            fileLength: inner.documentMessage.fileLength,
            caption: inner.documentMessage.caption || "",
            url: inner.documentMessage.url,
            raw: inner.documentMessage,
        });
    else if (inner.stickerMessage)
        atts.push({
            type: "sticker",
            mimetype: inner.stickerMessage.mimetype || "image/webp",
            isAnimated: !!inner.stickerMessage.isAnimated,
            isAvatar: !!inner.stickerMessage.isAvatar,
            raw: inner.stickerMessage,
        });
    else if (inner.contactMessage)
        atts.push({
            type: "contact",
            displayName: inner.contactMessage.displayName || "",
            vcard: inner.contactMessage.vcard || "",
        });
    else if (inner.contactsArrayMessage)
        atts.push({
            type: "contacts",
            contacts: (inner.contactsArrayMessage.contacts || []).map((c) => ({
                displayName: c.displayName || "",
                vcard: c.vcard || "",
            })),
        });

    return atts;
}

/**
 * Full message formatter — the heart of the WCA delta system.
 *
 * @param {object} msg     Raw Baileys WAMessage
 * @param {string} selfID  Bot's own JID
 * @param {object} [sock]  Baileys socket — used to resolve @lid JIDs
 * @returns {object|null}
 */
function formatMessageEvent(msg, selfID, sock) {
    try {
        const key = msg.key;
        const msgContent = msg.message;
        if (!key || !msgContent) return null;

        const remoteJid = key.remoteJid || "";
        if (remoteJid === "status@broadcast") return null;

        const isGroup = isGroupJID(remoteJid);
        const fromMe = !!key.fromMe;

        // ── Resolve threadID ────────────────────────────────────────────────
        // For groups  → threadID = group JID  (e.g. 120363420139499137@g.us)
        // For DMs     → threadID = contact JID resolved from @lid if needed
        const threadID = isGroup
            ? remoteJid
            : normalizeJID(remoteJid, sock);

        // ── Resolve senderID ───────────────────────────────────────────────
        // For fromMe  → own JID (normalised, no device suffix)
        // For groups  → key.participant / msg.participant (resolved from @lid)
        // For DMs     → same as threadID
        let rawSender;
        if (fromMe) {
            rawSender = selfID || "";
        } else if (isGroup) {
            rawSender = key.participant || msg.participant || remoteJid;
        } else {
            rawSender = remoteJid;
        }
        const senderID = normalizeJID(rawSender, sock);

        const messageID = key.id || "";
        const timestamp = Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000);

        // ── Reaction messages — special type ───────────────────────────────
        const inner =
            msgContent.viewOnceMessage?.message ||
            msgContent.viewOnceMessageV2?.message?.viewOnceMessage?.message ||
            msgContent.ephemeralMessage?.message ||
            msgContent.documentWithCaptionMessage?.message ||
            msgContent;

        if (inner.reactionMessage) {
            const rk = inner.reactionMessage.key || {};
            return {
                type:        "message_reaction",
                threadID,
                senderID,
                messageID,
                fromMe,
                isGroup,
                isSingleUser: !isGroup,
                timestamp,
                emoji:        inner.reactionMessage.text || "",
                reactionKey: {
                    id:        rk.id || "",
                    remoteJid: normalizeJID(rk.remoteJid || remoteJid, sock),
                    fromMe:    !!rk.fromMe,
                    participant: rk.participant ? normalizeJID(rk.participant, sock) : undefined,
                },
                author: senderID,
                raw: msg,
            };
        }

        // ── Protocol messages (delete, history sync) ──────────────────────
        if (inner.protocolMessage) {
            const pm = inner.protocolMessage;
            if (pm.type === 0 /* REVOKE */ && pm.key) {
                return {
                    type:      "message_unsend",
                    logMessageType: "log:unsend",
                    threadID,
                    senderID,
                    messageID,
                    deletedMessageID: pm.key.id || "",
                    author: senderID,
                    fromMe,
                    isGroup,
                    isSingleUser: !isGroup,
                    timestamp,
                    raw: msg,
                };
            }
            return null; // other protocol messages silently ignored
        }

        // ── Build the standard message event ──────────────────────────────
        const { body, contextInfo, mentions: rawMentions } = extractContent(msgContent);
        const attachments = buildAttachments(msgContent);

        // Resolve @lid in mentions list
        const mentions = (rawMentions || []).map((m) => normalizeJID(m, sock));

        // ── Reply-to (quoted message) ──────────────────────────────────────
        let replyToMessage = null;
        if (contextInfo && contextInfo.stanzaId) {
            const quotedSender = contextInfo.participant || (isGroup ? contextInfo.remoteJid : selfID) || "";
            replyToMessage = {
                messageID:  contextInfo.stanzaId,
                messageId:  contextInfo.stanzaId,
                senderID:   normalizeJID(quotedSender, sock),
                body:       contextInfo.quotedMessage
                    ? extractBodyFromMessage(contextInfo.quotedMessage)
                    : "",
                attachments: contextInfo.quotedMessage
                    ? buildAttachments(contextInfo.quotedMessage)
                    : [],
                raw:        contextInfo.quotedMessage || null,
            };
        }

        // ── Location ──────────────────────────────────────────────────────
        let location = null;
        if (inner.locationMessage || inner.liveLocationMessage) {
            const lm = inner.locationMessage || inner.liveLocationMessage;
            location = {
                latitude:  lm.degreesLatitude,
                longitude: lm.degreesLongitude,
                name:      lm.name || "",
                address:   lm.address || "",
                url:       lm.url || "",
            };
        }

        // ── Poll ──────────────────────────────────────────────────────────
        let poll = null;
        if (inner.pollCreationMessage) {
            poll = {
                name:            inner.pollCreationMessage.name || "",
                options:         (inner.pollCreationMessage.options || []).map((o) => o.optionName),
                selectableCount: inner.pollCreationMessage.selectableOptionsCount,
            };
        }

        const result = {
            type:         "message",
            body,
            threadID,
            senderID,
            author:       senderID,         // FCA-compatible alias
            messageID,
            isGroup,
            isSingleUser: !isGroup,
            fromMe,
            timestamp,
            attachments,
            mentions,
            replyToMessage,
            messageReply: replyToMessage,
            location,
            poll,
            // Sender display name (from Baileys pushName — best-effort, may be empty)
            pushName:     msg.pushName || msg.verifiedBizName || "",
            senderName:   msg.pushName || msg.verifiedBizName || "",
            // quoteOptions: ready to pass to sendMessage for replies
            quoteOptions: { quoted: msg },
            args: body.trim().split(/\s+/).filter(Boolean),
            raw: msg,
        };

        return result;
    } catch (e) {
        return null;
    }
}

// ─── General utilities ────────────────────────────────────────────────────────

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const file = createWriteStream(dest);
        protocol
            .get(url, (res) => {
                res.pipe(file);
                file.on("finish", () => file.close(resolve));
            })
            .on("error", (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
    });
}

/**
 * normUID — extract the bare numeric/alphanumeric ID from any JID format.
 * Works for:  "628xxx:5@s.whatsapp.net" → "628xxx"
 *             "186393124970625@lid"       → "186393124970625"
 *             "628xxx@s.whatsapp.net"    → "628xxx"
 *             "628xxx"                   → "628xxx"
 * Use this for admin matching and DB keys so LID and phone JIDs both match.
 */
function normUID(jid) {
    if (!jid) return "";
    return String(jid).split(":")[0].split("@")[0];
}

module.exports = {
    formatJID,
    isGroupJID,
    isDMJID,
    isLID,
    normalizePhoneNumber,
    normalizeJID,
    resolveLID,
    normUID,
    formatMessageEvent,
    extractBodyFromMessage,
    buildAttachments,
    extractContent,
    GROUP_ACTION_TO_LOG,
    delay,
    ensureDir,
    downloadFile,
};
