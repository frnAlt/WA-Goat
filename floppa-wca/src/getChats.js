"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    return async function getChats(callback) {
        if (typeof callback !== "function") callback = function () {};
        try {
            const store = sock.store || null;
            let rawChats = [];

            if (store && store.chats) {
                rawChats = Object.values(store.chats.toJSON ? store.chats.toJSON() : store.chats);
            } else if (sock.chats) {
                rawChats = Object.values(sock.chats);
            }

            const chats = rawChats.map((c) => ({
                threadID:    c.id || "",
                isGroup:     utils.isGroupJID(c.id || ""),
                name:        c.name || c.subject || "",
                unreadCount: c.unreadCount || 0,
                archived:    !!c.archived,
                muted:       !!c.muteEndTime,
                pinned:      !!c.pinned,
                timestamp:   c.conversationTimestamp || c.createdAt || null,
                raw:         c,
            }));

            callback(null, chats);
            return chats;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    };
};
