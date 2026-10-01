"use strict";

const utils = require("../utils");

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
    reset:   "\x1b[0m",  bold:    "\x1b[1m",  dim:     "\x1b[2m",
    green:   "\x1b[32m", bGreen:  "\x1b[92m", cyan:    "\x1b[36m",
    bCyan:   "\x1b[96m", yellow:  "\x1b[33m", bYellow: "\x1b[93m",
    magenta: "\x1b[35m", bMag:    "\x1b[95m", bWhite:  "\x1b[97m",
    red:     "\x1b[31m", blue:    "\x1b[34m", bBlue:   "\x1b[94m",
    purple:  "\x1b[38;5;135m",
    pink:    "\x1b[38;5;213m",
    sky:     "\x1b[38;5;39m",
};

// ── Typing animation — Unicode-safe (Array.from splits by codepoint, not byte)
function typeWrite(text, color, delayMs) {
    return new Promise((resolve) => {
        const chars = Array.from(text);   // handles emojis correctly
        let i = 0;
        function next() {
            if (i >= chars.length) {
                process.stdout.write("\n");
                return resolve();
            }
            process.stdout.write(color + chars[i] + C.reset);
            i++;
            setTimeout(next, delayMs || 26);
        }
        next();
    });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Startup banner (only the typeWrite lines, no 3D block, no color bar) ──────
async function printBanner(ctx) {
    let pkg = { version: "1.0.0" };
    try { pkg = require("../package.json"); } catch (_) {
        try { pkg = require("../../wca/package.json"); } catch (_2) {}
    }

    const version = pkg.version || "1.0.0";
    const jid     = ctx.selfID || "";
    const phone   = jid.split(":")[0].split("@")[0] || jid;

    await sleep(100);
    process.stdout.write("\n");
    await typeWrite("  [+] Connected as : " + phone,                             C.bGreen,  22);
    await typeWrite("  [+] WCA Version  : v" + version,                          C.bCyan,   22);
    await typeWrite("  [+] Author       : frnAlt",                                C.bYellow, 22);
    process.stdout.write("\n");
}

// ── Normalise participant list: Baileys may send objects or strings ─────────────
function resolveParticipants(participants, sock) {
    if (!Array.isArray(participants)) return [];
    return participants.map((p) => {
        const raw = typeof p === "object" ? (p.id || p.lid || "") : p;
        return utils.normalizeJID(raw, sock);
    });
}

/**
 * WCA event listener — maps ALL Baileys socket events to FCA-style callbacks.
 *
 * Event types emitted to globalCallback(err, event):
 *
 *   message              text / media / location / poll / buttons
 *   message_reaction     emoji reaction on a message
 *   message_unsend       delete-for-everyone (protocolMessage type 0)
 *   message_status       delivery / read / played status update
 *   message_receipt      per-device read/play receipt
 *   message_delete       bulk message delete (server-side)
 *   event                group-participant change (add/remove/promote/demote/leave)
 *   group_update         group metadata change (name/desc/icon/announce/restrict)
 *   group_join_request   join-request needing admin approval
 *   chat_upsert          new chat opened / synced from history
 *   chat_update          chat read/unread/pin/mute/archive state change
 *   chat_delete          chat removed
 *   contact_upsert       new contact added to address book
 *   contact_update       contact name / picture changed
 *   presence             typing / online / offline / recording
 *   blocklist_set        full blocklist synced
 *   blocklist_update     contact blocked or unblocked
 *   label_edit           label created or modified
 *   label_association    label added/removed from a chat or message
 *   call                 incoming/outgoing call lifecycle events
 *   stop_listen          connection closed
 *   ready                connection opened  (emitReady option)
 */
module.exports = function listenMqtt(sock, ctx, globalCallback) {
    if (typeof globalCallback !== "function") return;

    // Animated startup banner
    printBanner(ctx).catch(() => {});

    const selfID = () => ctx.selfID || "";

    // Normalise bot's own JID for comparison (strip device suffix)
    function botJID() {
        const id = selfID();
        if (!id) return "";
        return id.includes(":") ? id.split(":")[0] + "@s.whatsapp.net" : id;
    }

    const opts = () => ctx.globalOptions || {};

    // Always fires — used for group/account-level events that must work
    // regardless of selfListen setting.
    const emit = (payload) => globalCallback(null, payload);

    // Fires only when listenEvents is enabled
    const emitEvent = (payload) => {
        if (!opts().listenEvents) return;
        globalCallback(null, payload);
    };

    const reactionSeen = new Map();
    function emitReaction(payload) {
        const rk = payload.reactionKey || {};
        const key = [
            rk.id || payload.messageID || "",
            payload.senderID || "",
            payload.emoji || "",
            payload.removed ? "1" : "0",
        ].join("|");
        const now = Date.now();
        const last = reactionSeen.get(key) || 0;
        if (now - last < 2500) return;
        reactionSeen.set(key, now);
        for (const [seenKey, ts] of reactionSeen) {
            if (now - ts > 10000) reactionSeen.delete(seenKey);
        }
        globalCallback(null, payload);
    }

    // ── Incoming messages ──────────────────────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify" && type !== "append") return;

        for (const msg of messages) {
            if (!msg.message) continue;

            const remoteJid = msg.key?.remoteJid || "";
            if (remoteJid === "status@broadcast") continue;

            const fmtMsg = utils.formatMessageEvent(msg, selfID(), sock);
            if (!fmtMsg) continue;

            // selfListen / selfListenEvent gating (messages only, not group events)
            if (fmtMsg.fromMe) {
                if (fmtMsg.type === "message" && !opts().selfListen) continue;
                if (fmtMsg.type !== "message" && !opts().selfListenEvent) continue;
            }

            if (opts().autoMarkDelivery && msg.key) {
                try { await sock.readMessages([msg.key]); } catch (_) {}
            }

            if (fmtMsg.type === "message_reaction") emitReaction(fmtMsg);
            else globalCallback(null, fmtMsg);
        }
    });

    // ── Dedicated reaction events (messages.reaction) ──────────────────────────
    sock.ev.on("messages.reaction", (reactions) => {
        if (!opts().listenEvents) return;
        for (const { key, reaction } of reactions) {
            const reactorKey = reaction?.key || {};
            const threadID = utils.normalizeJID(key?.remoteJid || reactorKey.remoteJid || "", sock);
            const senderRaw = reactorKey.fromMe
                ? selfID()
                : (reactorKey.participant || reactorKey.remoteJid || key?.participant || key?.remoteJid || "");
            const sender = utils.normalizeJID(senderRaw, sock);
            emitReaction({
                type:        "message_reaction",
                threadID,
                senderID:    sender,
                author:      sender,
                messageID:   reactorKey.id || key?.id || "",
                isGroup:     utils.isGroupJID(key?.remoteJid || reactorKey.remoteJid || ""),
                isSingleUser:!utils.isGroupJID(key?.remoteJid || reactorKey.remoteJid || ""),
                fromMe:      !!reactorKey.fromMe,
                emoji:       reaction.text || "",
                removed:     !reaction.text,
                reactionKey: {
                    id:          key?.id || "",
                    remoteJid:   threadID,
                    fromMe:      !!key?.fromMe,
                    participant: key?.participant ? utils.normalizeJID(key.participant, sock) : undefined,
                },
                raw: { key, reaction },
            });
        }
    });

    // ── Message delivery / read status ────────────────────────────────────────
    sock.ev.on("messages.update", (updates) => {
        if (!opts().listenEvents) return;
        for (const update of updates) {
            if (update.update?.status !== undefined) {
                const threadID = utils.normalizeJID(update.key?.remoteJid || "", sock);
                const sender   = utils.normalizeJID(
                    update.key?.participant || update.key?.remoteJid || "", sock
                );
                // Status map: 0=ERROR, 1=PENDING, 2=SERVER_ACK, 3=DELIVERY_ACK, 4=READ, 5=PLAYED
                const STATUS_MAP = {
                    0: "error", 1: "pending", 2: "server_ack",
                    3: "delivery_ack", 4: "read", 5: "played",
                };
                globalCallback(null, {
                    type:       "message_status",
                    threadID,
                    senderID:   sender,
                    author:     sender,
                    messageID:  update.key?.id,
                    status:     update.update.status,
                    statusText: STATUS_MAP[update.update.status] || String(update.update.status),
                    isSeen:     update.update.status === 4,
                    isDelivered:update.update.status === 3,
                    isRead:     update.update.status === 4,
                    isPlayed:   update.update.status === 5,
                    raw:        update,
                });
            }
        }
    });

    // ── Bulk message delete ────────────────────────────────────────────────────
    sock.ev.on("messages.delete", (item) => {
        if (!opts().listenEvents) return;
        if (item.keys) {
            for (const key of item.keys) {
                globalCallback(null, {
                    type:      "message_delete",
                    threadID:  utils.normalizeJID(key.remoteJid || "", sock),
                    messageID: key.id,
                    fromMe:    !!key.fromMe,
                    raw:       item,
                });
            }
        } else if (item.jid) {
            // all messages in chat deleted
            globalCallback(null, {
                type:     "message_delete",
                threadID: utils.normalizeJID(item.jid, sock),
                all:      true,
                raw:      item,
            });
        }
    });

    // ── Per-device receipts (seen/delivered by specific device) ───────────────
    sock.ev.on("message-receipt.update", (updates) => {
        if (!opts().listenEvents) return;
        for (const update of updates) {
            const threadID = utils.normalizeJID(update.key?.remoteJid || "", sock);
            // receipt.readTimestamp = seen, receipt.receiptTimestamp = delivered
            const receipt = update.receipt || {};
            globalCallback(null, {
                type:           "message_receipt",
                threadID,
                messageID:      update.key?.id,
                receiptUserJID: utils.normalizeJID(receipt.userJid || "", sock),
                isSeen:         !!receipt.readTimestamp,
                isDelivered:    !!receipt.receiptTimestamp,
                readTimestamp:  receipt.readTimestamp   || null,
                deliverTimestamp: receipt.receiptTimestamp || null,
                raw:            update,
            });
        }
    });

    // ── Presence / typing / recording ─────────────────────────────────────────
    sock.ev.on("presence.update", ({ id, presences }) => {
        if (!opts().updatePresence && !opts().listenTyping) return;
        for (const [jid, presence] of Object.entries(presences)) {
            const pType = presence.lastKnownPresence;
            if (opts().listenTyping && !opts().updatePresence) {
                if (pType !== "composing" && pType !== "paused" && pType !== "recording") continue;
            }
            globalCallback(null, {
                type:        "presence",
                userID:      utils.normalizeJID(jid, sock),
                senderID:    utils.normalizeJID(jid, sock),
                author:      utils.normalizeJID(jid, sock),
                threadID:    utils.normalizeJID(id, sock),
                presence:    pType,
                isTyping:    pType === "composing",
                isRecording: pType === "recording",
                isOnline:    pType === "available",
                isOffline:   pType === "unavailable",
                lastSeen:    presence.lastSeen || null,
                raw:         { id, jid, presence },
            });
        }
    });

    // ── Group metadata changes ─────────────────────────────────────────────────
    sock.ev.on("groups.update", (updates) => {
        if (!opts().listenEvents) return;
        for (const update of updates) {
            const threadID = update.id || "";
            const author   = utils.normalizeJID(update.author || update.participant || "", sock);
            const changes  = [];

            if (update.subject    !== undefined) changes.push({ logMessageType: "log:thread-name",        value: update.subject });
            if (update.desc       !== undefined) changes.push({ logMessageType: "log:thread-description", value: update.desc });
            if (update.icon       !== undefined) changes.push({ logMessageType: "log:thread-icon",        value: update.icon });
            if (update.picture    !== undefined) changes.push({ logMessageType: "log:thread-image",       value: update.picture });
            if (update.announce   !== undefined) changes.push({ logMessageType: "log:thread-admins",      value: update.announce ? "announcement" : "not_announcement" });
            if (update.restrict   !== undefined) changes.push({ logMessageType: "log:thread-lock",        value: update.restrict });
            if (update.ephemeralDuration !== undefined) changes.push({ logMessageType: "log:thread-ephemeral", value: update.ephemeralDuration });
            if (changes.length    === 0)         changes.push({ logMessageType: "log:thread-name",        value: null });

            for (const change of changes) {
                emit({
                    type:           "group_update",
                    logMessageType: change.logMessageType,
                    threadID,
                    author,
                    senderID:       author,
                    logMessageData: { value: change.value, raw: update },
                    raw:            update,
                });
            }
        }
    });

    // ── New group joined / synced ──────────────────────────────────────────────
    sock.ev.on("groups.upsert", (groups) => {
        if (!opts().listenEvents) return;
        for (const meta of groups) {
            emit({
                type:     "group_upsert",
                threadID: meta.id,
                name:     meta.subject || "",
                owner:    meta.owner || null,
                raw:      meta,
            });
        }
    });

    // ── Group participant events (add / remove / promote / demote / leave) ─────
    // NOTE: isBotAdded / isBotRemoved etc. ALWAYS fire regardless of selfListen.
    // selfListen only gates *message* events, not structural group changes.
    sock.ev.on("group-participants.update", ({ id, participants, action, author: rawAuthor, authorPn }) => {
        if (!opts().listenEvents) return;

        const threadID  = id || "";
        const author    = utils.normalizeJID(rawAuthor || "", sock);
        const logType   = utils.GROUP_ACTION_TO_LOG[action] || ("log:" + action);
        const resolved  = resolveParticipants(participants, sock);
        const botJid    = botJID();

        const isBotAdded     = action === "add"     && resolved.some((p) => p === botJid);
        const isBotRemoved   = (action === "remove" || action === "leave") && resolved.some((p) => p === botJid);
        const isBotPromoted  = action === "promote" && resolved.some((p) => p === botJid);
        const isBotDemoted   = action === "demote"  && resolved.some((p) => p === botJid);
        const isBotLeft      = action === "leave"   && resolved.some((p) => p === botJid);

        emit({
            type:            "event",
            logMessageType:  logType,
            threadID,
            author,
            authorPn:        authorPn || null,
            senderID:        author,
            action,
            participants:    resolved,
            // ── Bot-self flags (always populated, selfListen-independent) ──
            isBotAdded,
            isBotRemoved,
            isBotPromoted,
            isBotDemoted,
            isBotLeft,
            botID:           botJid,
            logMessageData:  {
                addedParticipants:    action === "add"                          ? resolved : [],
                removedParticipants:  (action === "remove" || action === "leave") ? resolved : [],
                promotedParticipants: action === "promote"                      ? resolved : [],
                demotedParticipants:  action === "demote"                       ? resolved : [],
                action,
                isBotAdded,
                isBotRemoved,
                isBotPromoted,
                isBotDemoted,
            },
            raw: { id, participants, action, author: rawAuthor },
        });
    });

    // ── Group join-request (approval required) ─────────────────────────────────
    // Fires when someone requests to join a group that requires admin approval.
    // action: 'created' | 'revoked' | 'rejected' | 'approved'
    // method: 'invite_link' | 'linked_group_join' | 'non_admin_add' | etc.
    sock.ev.on("group.join-request", ({ id, participant, participantPn, author, authorPn, action, method }) => {
        if (!opts().listenEvents) return;
        const threadID    = id || "";
        const requesterID = utils.normalizeJID(participant || "", sock);
        const approverID  = utils.normalizeJID(author || "", sock);

        emit({
            type:          "group_join_request",
            logMessageType:"log:group-join-request",
            threadID,
            requesterID,
            requesterPn:   participantPn || null,
            approverID,
            approverPn:    authorPn || null,
            senderID:      requesterID,
            author:        approverID,
            action,          // 'created' | 'revoked' | 'rejected' | 'approved'
            method,          // how they tried to join
            isPending:     action === "created",
            isApproved:    action === "approved",
            isRejected:    action === "rejected",
            isRevoked:     action === "revoked",
            raw:           { id, participant, participantPn, author, authorPn, action, method },
        });
    });

    // ── Contacts upserted (new / history sync) ────────────────────────────────
    sock.ev.on("contacts.upsert", (contacts) => {
        if (!opts().listenEvents) return;
        for (const contact of contacts) {
            const userID = utils.normalizeJID(contact.id || "", sock);
            emit({
                type:      "contact_upsert",
                userID,
                senderID:  userID,
                author:    userID,
                name:      contact.name || contact.notify || contact.verifiedName || "",
                phone:     userID.split("@")[0] || "",
                raw:       contact,
            });
        }
    });

    // ── Contact name / picture updates ────────────────────────────────────────
    sock.ev.on("contacts.update", (updates) => {
        if (!opts().listenEvents) return;
        for (const contact of updates) {
            const userID = utils.normalizeJID(contact.id || "", sock);
            emit({
                type:           "contact_update",
                logMessageType: "log:user-nickname",
                userID,
                senderID:       userID,
                author:         userID,
                name:           contact.name || contact.notify || "",
                imgUrl:         contact.imgUrl || null,
                raw:            contact,
            });
        }
    });

    // ── Chat upsert (history sync / new chat opened) ───────────────────────────
    sock.ev.on("chats.upsert", (chats) => {
        if (!opts().listenEvents) return;
        for (const chat of chats) {
            emit({
                type:        "chat_upsert",
                threadID:    utils.normalizeJID(chat.id || "", sock),
                isGroup:     utils.isGroupJID(chat.id || ""),
                name:        chat.name || chat.subject || "",
                unreadCount: chat.unreadCount || 0,
                archived:    !!chat.archived,
                pinned:      !!chat.pinned,
                muted:       !!chat.muteEndTime,
                timestamp:   chat.conversationTimestamp || null,
                raw:         chat,
            });
        }
    });

    // ── Chat state updates (read/unread/pin/mute/archive) ─────────────────────
    sock.ev.on("chats.update", (updates) => {
        if (!opts().listenEvents) return;
        for (const update of updates) {
            emit({
                type:        "chat_update",
                threadID:    utils.normalizeJID(update.id || "", sock),
                isGroup:     utils.isGroupJID(update.id || ""),
                unreadCount: update.unreadCount,
                archived:    update.archived,
                pinned:      update.pinned,
                muted:       update.muteEndTime !== undefined ? !!update.muteEndTime : undefined,
                muteEndTime: update.muteEndTime || null,
                timestamp:   update.conversationTimestamp || null,
                raw:         update,
            });
        }
    });

    // ── Chat deleted ──────────────────────────────────────────────────────────
    sock.ev.on("chats.delete", (ids) => {
        if (!opts().listenEvents) return;
        for (const id of ids) {
            emit({
                type:     "chat_delete",
                threadID: utils.normalizeJID(id, sock),
                raw:      id,
            });
        }
    });

    // ── Blocklist set / update ────────────────────────────────────────────────
    sock.ev.on("blocklist.set", ({ blocklist }) => {
        if (!opts().listenEvents) return;
        emit({
            type:      "blocklist_set",
            blocklist: (blocklist || []).map((j) => utils.normalizeJID(j, sock)),
            raw:       { blocklist },
        });
    });

    sock.ev.on("blocklist.update", ({ blocklist, type }) => {
        if (!opts().listenEvents) return;
        const resolved = (blocklist || []).map((j) => utils.normalizeJID(j, sock));
        emit({
            type:      "blocklist_update",
            action:    type,            // 'add' | 'remove'
            isBlocked: type === "add",
            users:     resolved,
            blocklist: resolved,
            raw:       { blocklist, type },
        });
    });

    // ── Label events ──────────────────────────────────────────────────────────
    sock.ev.on("labels.edit", (label) => {
        if (!opts().listenEvents) return;
        emit({
            type: "label_edit",
            label,
            raw:  label,
        });
    });

    sock.ev.on("labels.association", ({ association, type }) => {
        if (!opts().listenEvents) return;
        emit({
            type:        "label_association",
            action:      type,   // 'add' | 'remove'
            association,
            raw:         { association, type },
        });
    });

    // ── Chat lock event ───────────────────────────────────────────────────────
    sock.ev.on("chats.lock", ({ id, locked }) => {
        if (!opts().listenEvents) return;
        emit({
            type:     "chat_lock",
            threadID: utils.normalizeJID(id, sock),
            locked,
            raw:      { id, locked },
        });
    });

    // ── Settings update ───────────────────────────────────────────────────────
    sock.ev.on("settings.update", (update) => {
        if (!opts().listenEvents) return;
        emit({
            type:    "settings_update",
            setting: update.setting,
            value:   update.value,
            raw:     update,
        });
    });

    // ── Calls — full lifecycle ─────────────────────────────────────────────────
    // Statuses: offer, ringing, preaccept, transport, relaylatency,
    //           timeout, reject, accept, terminate
    sock.ev.on("call", (calls) => {
        if (!opts().listenEvents) return;
        for (const call of calls) {
            const from = utils.normalizeJID(call.from || "", sock);
            emit({
                type:       "call",
                callID:     call.id,
                chatID:     utils.normalizeJID(call.chatId || call.from || "", sock),
                from,
                callerPn:   call.callerPn || null,
                senderID:   from,
                author:     from,
                isVideo:    !!call.isVideo,
                isGroup:    !!call.isGroup,
                groupJid:   call.groupJid ? utils.normalizeJID(call.groupJid, sock) : null,
                status:     call.status,
                // Semantic booleans for easy handling
                isOffer:    call.status === "offer",
                isRinging:  call.status === "ringing",
                isAccepted: call.status === "accept",
                isRejected: call.status === "reject",
                isTimeout:  call.status === "timeout",
                isTerminated: call.status === "terminate",
                offline:    !!call.offline,
                latencyMs:  call.latencyMs || null,
                date:       call.date,
                raw:        call,
            });
        }
    });

    // ── Connection state ──────────────────────────────────────────────────────
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            globalCallback({
                type:            "stop_listen",
                logMessageType:  "log:disconnect",
                reason:          "connection_closed",
                shouldReconnect: opts().autoReconnect &&
                    lastDisconnect?.error?.output?.statusCode !== 401,
                error: lastDisconnect?.error || null,
            }, null);
        }
        if (connection === "open" && opts().emitReady) {
            globalCallback({ type: "ready", logMessageType: "log:ready", error: null }, null);
        }
    });

    return sock;
};
