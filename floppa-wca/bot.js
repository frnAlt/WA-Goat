/**
 * WCA Test Bot  —  Full-featured WhatsApp bot
 * ─────────────────────────────────────────────────────────────────────────────
 * BD Number : 01877781655  →  international: 8801xxxxxxxxx
 * Prefix    : !
 *
 * Commands:
 *   BASIC      !ping !info !id !myid !help
 *   GROUP      !groupinfo !groupadmins !invitelink !revokeinvite !creategroup
 *              !leavegroup !addme !kick @user !add 628xxx !promote @user
 *              !demote @user !subject <text> !desc <text> !announce !open
 *   MESSAGING  !react [emoji] !reply !read !typing on|off !delete
 *              !u  (unsend last bot message in this thread)
 *   MEDIA      !image !video !audio !document !sticker !location
 *              !testmedia  (Promise.all — 4 images at once)
 *              !d  (download replied media to ./downloads/)
 *   BUTTONS    !buttons !list !template
 *   PROFILE    !userinfo !profilepic !status <text> !name <text>
 *              !fetchstatus !presence !block
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { join, dirname } = require("path");
const { mkdirSync, writeFileSync, existsSync } = require("fs");

const wca    = require("./index");
const PREFIX = "!";
const BOT_NUMBER = "";//your bot account number
const TEST_GROUP = "";//your group uid

// ── ANSI ──────────────────────────────────────────────────────────────────────
const C = {
    r: "\x1b[0m", b: "\x1b[1m", dim: "\x1b[2m",
    g: "\x1b[32m", G: "\x1b[92m", c: "\x1b[36m", C: "\x1b[96m",
    y: "\x1b[33m", Y: "\x1b[93m", m: "\x1b[35m", M: "\x1b[95m",
    red: "\x1b[31m", w: "\x1b[97m",
};

// Pad a string to fixed width for aligned columns
const pad = (s, n) => String(s).padEnd(n);

// ── Startup banner ────────────────────────────────────────────────────────────
console.log(C.b + C.C);
console.log("  ╔══════════════════════════════════════════╗");
console.log("  ║        🤖  WCA TEST BOT STARTING         ║");
console.log("  ║   Phone : " + BOT_NUMBER + "             ║");
console.log("  ║   Prefix: " + PREFIX + "                              ║");
console.log("  ╚══════════════════════════════════════════╝");
console.log(C.r);

// ── Per-thread last bot message tracker (for !u unsend) ─────────────────────
const lastBotMsg = new Map(); // threadID → { id, remoteJid }

// ── Mime → extension helper ────────────────────────────────────────────────
function mimeToExt(mime) {
    const m = {
        "image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif",
        "video/mp4":"mp4","video/mpeg":"mpeg","audio/ogg":"ogg","audio/mpeg":"mp3",
        "audio/ogg; codecs=opus":"ogg","application/pdf":"pdf",
    };
    return m[mime] || "bin";
}

wca(
    {
        authFolder:     "./wca_auth",
        phoneNumber:    BOT_NUMBER,
        usePairingCode: true,
        globalOptions: {
            selfListen:            false,
            selfListenEvent:       false,
            listenEvents:          true,
            updatePresence:        false,
            listenTyping:          false,
            autoMarkDelivery:      false,
            autoReconnect:         true,
            emitReady:             true,
            enableTypingIndicator: false,
            typingDuration:        2000,
            logLevel:              "error",
        },
    },
    async (err, api) => {
        if (err) {
            console.error(C.red + "[BOT] Failed to connect:", err, C.r);
            return;
        }
        console.log(C.G + "[BOT] Connected! JID: " + api.getCurrentUserID() + C.r);

        // ── Listen ───────────────────────────────────────────────────────────
        api.listen(async (err, msg) => {

            // ── Error / system events ────────────────────────────────────
            if (err) {
                if (err.type === "ready") {
                    console.log(C.G + "[BOT] ✅ Ready." + C.r);
                    return;
                }
                if (err.type === "stop_listen") {
                    console.log(C.y + "[BOT] ⚡ Disconnected: " + err.reason + C.r);
                    return;
                }
                console.error(C.red + "[BOT] Listener error:", err, C.r);
                return;
            }

            if (!msg) return;

            // ════════════════════════════════════════════════════════════
            //   LOG ALL EVENT TYPES TO CONSOLE
            // ════════════════════════════════════════════════════════════
            switch (msg.type) {

                // ── Regular message ──────────────────────────────────
                case "message": {
                    const kind = msg.isGroup ? C.c + "GROUP" + C.r : C.C + "DM   " + C.r;
                    const atts = msg.attachments.length
                        ? C.Y + " [" + msg.attachments.map(a => a.type).join(", ") + "]" + C.r : "";
                    const repl = msg.replyToMessage ? C.dim + " ↩reply" + C.r : "";
                    console.log(
                        C.b + C.c + "[MSG]" + C.r,
                        kind,
                        C.dim + "from=" + C.r + C.w + msg.senderID + C.r,
                        C.dim + "thread=" + C.r + msg.threadID,
                        C.Y + "body=" + C.r + JSON.stringify(msg.body) + atts + repl
                    );
                    break;
                }

                // ── Emoji reaction received ──────────────────────────
                case "message_reaction": {
                    console.log(
                        C.b + C.m + "[REACT]" + C.r,
                        C.w + msg.emoji + C.r,
                        C.dim + "by=" + C.r + msg.senderID,
                        C.dim + "on=" + C.r + msg.reactionKey?.id,
                        C.dim + "thread=" + C.r + msg.threadID
                    );
                    return; // reactions don't trigger commands
                }

                // ── Delete for everyone ──────────────────────────────
                case "message_unsend": {
                    console.log(
                        C.b + C.red + "[DELETE]" + C.r,
                        C.dim + "by=" + C.r + msg.senderID,
                        C.dim + "msgID=" + C.r + msg.deletedMessageID,
                        C.dim + "thread=" + C.r + msg.threadID
                    );
                    return;
                }

                // ── Group participant event ──────────────────────────
                case "event": {
                    const d = msg.logMessageData || {};
                    let detail = "";
                    if (d.addedParticipants?.length)    detail = "added: "    + d.addedParticipants.join(", ");
                    if (d.removedParticipants?.length)  detail = "removed: "  + d.removedParticipants.join(", ");
                    if (d.promotedParticipants?.length) detail = "promoted: " + d.promotedParticipants.join(", ");
                    if (d.demotedParticipants?.length)  detail = "demoted: "  + d.demotedParticipants.join(", ");
                    console.log(
                        C.b + C.m + "[EVENT]" + C.r,
                        C.Y + (msg.logMessageType || "?") + C.r,
                        C.dim + "thread=" + C.r + msg.threadID,
                        C.dim + "by=" + C.r + (msg.author || msg.senderID),
                        detail ? C.w + detail + C.r : ""
                    );
                    return;
                }

                // ── Group metadata change ────────────────────────────
                case "group_update": {
                    console.log(
                        C.b + C.m + "[GROUP_UPDATE]" + C.r,
                        C.Y + (msg.logMessageType || "?") + C.r,
                        C.dim + "thread=" + C.r + msg.threadID,
                        C.dim + "by=" + C.r + (msg.author || "?"),
                        C.dim + "value=" + C.r + JSON.stringify(msg.logMessageData?.value)
                    );
                    return;
                }

                // ── Message delivery/read status ─────────────────────
                case "message_status": {
                    // status codes: 0=error 1=pending 2=server 3=delivered 4=read 5=played
                    const labels = ["ERROR","PENDING","SERVER","DELIVERED","READ","PLAYED"];
                    console.log(
                        C.dim + "[STATUS]" + C.r,
                        labels[msg.status] || String(msg.status),
                        C.dim + "msgID=" + C.r + msg.messageID,
                        C.dim + "thread=" + C.r + msg.threadID
                    );
                    return;
                }

                // ── Presence / typing ────────────────────────────────
                case "presence": {
                    // Only log composing (suppress noise from available/unavailable)
                    if (msg.isTyping) {
                        console.log(C.dim + "[TYPING]" + C.r, msg.userID, C.Y + "composing..." + C.r);
                    }
                    return;
                }

                // ── Incoming call ────────────────────────────────────
                case "call": {
                    console.log(
                        C.b + C.Y + "[CALL]" + C.r,
                        C.dim + "from=" + C.r + msg.from,
                        "isVideo=" + msg.isVideo,
                        "status=" + msg.status
                    );
                    return;
                }

                // ── Contact update ───────────────────────────────────
                case "contact_update": {
                    console.log(C.dim + "[CONTACT]" + C.r, msg.userID, "name=" + msg.name);
                    return;
                }

                // ── Everything else ──────────────────────────────────
                default: {
                    console.log(C.dim + "[EVT:" + msg.type + "]" + C.r, JSON.stringify(msg).slice(0, 120));
                    return;
                }
            }

            // ── Only process command messages from here ───────────────────
            if (msg.type !== "message") return;
            const body = msg.body || "";
            if (!body.startsWith(PREFIX)) return;

            const [rawCmd, ...args] = body.slice(PREFIX.length).trim().split(/\s+/);
            const cmd      = rawCmd.toLowerCase();
            const threadID = msg.threadID;
            const senderID = msg.senderID;

            // Helpers
            const reply     = (text) => api.sendMessage(text, threadID);
            const replyQuoted = (text) => api.sendMessage(
                { body: text, replyToMessage: msg.raw }, threadID
            );
            const trackSent = (result) => {
                if (result && result.key) lastBotMsg.set(threadID, result.key);
                return result;
            };

            try {
                switch (cmd) {

                    // ══════════════════════════════════════════════════════
                    //   BASIC
                    // ══════════════════════════════════════════════════════
                    case "ping":
                        trackSent(await reply("🏓 Pong! WCA is alive."));
                        break;

                    case "help":
                    case "info":
                        trackSent(await reply(
                            "🤖 *WCA Test Bot*\n" +
                            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                            "Prefix   : " + PREFIX + "\n" +
                            "Bot JID  : " + api.getCurrentUserID() + "\n" +
                            "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                            "*Basic*: !ping !info !id !myid\n" +
                            "*Group*: !groupinfo !groupadmins !invitelink !kick !add !promote !demote !subject !desc !announce !open !creategroup !leavegroup\n" +
                            "*Msg*: !react [emoji] !reply !read !typing on|off !delete !u\n" +
                            "*Media*: !image !video !audio !document !sticker !location !testmedia\n" +
                            "*Download*: !d (reply to media)\n" +
                            "*Buttons*: !buttons !list !template\n" +
                            "*Profile*: !userinfo !profilepic !status !name !fetchstatus !presence !block"
                        ));
                        break;

                    case "myid":
                        trackSent(await reply("🆔 Bot JID: " + api.getCurrentUserID()));
                        break;

                    case "id":
                        trackSent(await reply(
                            "📌 *IDs*\n" +
                            "Thread  : " + threadID + "\n" +
                            "Sender  : " + senderID + "\n" +
                            "MsgID   : " + msg.messageID
                        ));
                        break;

                    // ══════════════════════════════════════════════════════
                    //   GROUP INFO
                    // ══════════════════════════════════════════════════════
                    case "groupinfo":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        {
                            const info = await api.getGroupInfo(threadID);
                            trackSent(await reply(
                                "📋 *Group Info*\n" +
                                "Name        : " + info.name + "\n" +
                                "Description : " + (info.description || "—") + "\n" +
                                "Members     : " + info.participantIDs.length + "\n" +
                                "Admins      : " + info.adminIDs.length + "\n" +
                                "Owner       : " + (info.owner || "—") + "\n" +
                                "Announce    : " + info.announcement
                            ));
                        }
                        break;

                    case "groupadmins":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        {
                            const admins = await api.getGroupAdmins(threadID);
                            trackSent(await reply("👑 *Group Admins*\n" + admins.join("\n")));
                        }
                        break;

                    case "invitelink":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        {
                            const link = await api.getGroupInviteLink(threadID);
                            trackSent(await reply("🔗 Invite Link:\n" + link));
                        }
                        break;

                    case "revokeinvite":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        {
                            const link = await api.groupRevokeInvite(threadID);
                            trackSent(await reply("♻️ Revoked! New link: " + link));
                        }
                        break;

                    // ══════════════════════════════════════════════════════
                    //   GROUP MANAGEMENT
                    // ══════════════════════════════════════════════════════
                    case "creategroup": {
                        const meta = await api.createGroup("WCA Test " + Date.now(), [senderID]);
                        trackSent(await reply("✅ Created: " + meta.id));
                        break;
                    }

                    case "leavegroup":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        await reply("👋 Leaving...");
                        await api.leaveGroup(threadID);
                        break;

                    case "kick":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        if (!msg.mentions?.length) { await reply("❌ Mention a user: !kick @user"); break; }
                        await api.kickUser(threadID, msg.mentions);
                        trackSent(await reply("🦵 Kicked: " + msg.mentions.join(", ")));
                        break;

                    case "add":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        if (!args[0]) { await reply("❌ Usage: !add <number>"); break; }
                        {
                            const num = args[0].replace(/\D/g, "");
                            await api.addUserToGroup(threadID, [num]);
                            trackSent(await reply("✅ Added: " + num));
                        }
                        break;

                    case "addme":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        await api.addUserToGroup(threadID, [senderID]);
                        trackSent(await reply("✅ Added you back."));
                        break;

                    case "promote":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        if (!msg.mentions?.length) { await reply("❌ Mention a user."); break; }
                        await api.promoteAdmin(threadID, msg.mentions);
                        trackSent(await reply("⬆️ Promoted: " + msg.mentions.join(", ")));
                        break;

                    case "demote":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        if (!msg.mentions?.length) { await reply("❌ Mention a user."); break; }
                        await api.demoteAdmin(threadID, msg.mentions);
                        trackSent(await reply("⬇️ Demoted: " + msg.mentions.join(", ")));
                        break;

                    case "subject":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        {
                            const s = args.join(" ");
                            if (!s) { await reply("❌ Usage: !subject <text>"); break; }
                            await api.changeGroupSubject(threadID, s);
                            trackSent(await reply("✅ Group renamed to: " + s));
                        }
                        break;

                    case "desc":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        await api.changeGroupDescription(threadID, args.join(" ") || "");
                        trackSent(await reply("✅ Description updated."));
                        break;

                    case "announce":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        await api.groupSettingUpdate(threadID, "announcement");
                        trackSent(await reply("📢 Announcements only mode ON."));
                        break;

                    case "open":
                        if (!msg.isGroup) { await reply("❌ Only works in groups."); break; }
                        await api.groupSettingUpdate(threadID, "not_announcement");
                        trackSent(await reply("🔓 Group opened for all."));
                        break;

                    // ══════════════════════════════════════════════════════
                    //   MESSAGING
                    // ══════════════════════════════════════════════════════
                    case "typing": {
                        const on = args[0] !== "off";
                        await api.sendTypingIndicator(on, threadID);
                        trackSent(await reply("⌨️ Typing: " + (on ? "ON" : "OFF")));
                        break;
                    }

                    case "read":
                        await api.markAsRead(threadID, senderID, [msg.messageID]);
                        trackSent(await reply("✅ Marked as read."));
                        break;

                    case "react": {
                        const emoji = args[0] || "👍";
                        await api.reactToMessage(threadID, msg.messageID, emoji);
                        break;
                    }

                    case "reply": {
                        // Quoted reply to the triggering message
                        const r = await api.sendMessage(
                            { body: "💬 This is a quoted reply!", replyToMessage: msg.raw },
                            threadID
                        );
                        trackSent(r);
                        break;
                    }

                    case "delete":
                        await api.deleteMessage(threadID, msg.messageID, true);
                        break;

                    // !u — unsend the bot's last message in this thread
                    case "u": {
                        const last = lastBotMsg.get(threadID);
                        if (!last) { await reply("❌ No recent bot message to unsend."); break; }
                        await api.deleteMessage(threadID, last.id, true);
                        lastBotMsg.delete(threadID);
                        break;
                    }

                    // ══════════════════════════════════════════════════════
                    //   MEDIA SEND
                    // ══════════════════════════════════════════════════════
                    case "image":
                        trackSent(await api.sendImage("https://picsum.photos/800/600", threadID, "🖼️ Test image"));
                        break;

                    case "video":
                        trackSent(await api.sendVideo("https://www.w3schools.com/html/mov_bbb.mp4", threadID, "🎬 Test video"));
                        break;

                    case "audio":
                        trackSent(await api.sendAudio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", threadID, { mimetype: "audio/mpeg" }));
                        break;

                    case "document":
                        trackSent(await api.sendDocument(
                            "https://www.w3.org/WAI/WCAG21/wcag21.pdf", threadID,
                            "📄 Test document", { filename: "test.pdf", mimetype: "application/pdf" }
                        ));
                        break;

                    case "sticker":
                        trackSent(await api.sendSticker("https://media.tenor.com/images/2bc8b5e3ddff8cc97d8ec8d6f2d71ec9/tenor.gif", threadID));
                        break;

                    case "location":
                        trackSent(await api.sendLocation(threadID, 23.8103, 90.4125, { name: "Dhaka, Bangladesh", address: "Dhaka, BD" }));
                        break;

                    // !testmedia — Promise.all: 4 images at once
                    case "testmedia": {
                        await reply("📤 Sending 4 images with Promise.all…");
                        const URLS = [
                            "https://picsum.photos/seed/wca1/800/600",
                            "https://picsum.photos/seed/wca2/800/600",
                            "https://picsum.photos/seed/wca3/800/600",
                            "https://picsum.photos/seed/wca4/800/600",
                        ];
                        const results = await api.sendMessage({
                            body: "🖼️ WCA Promise.all test — 4 images",
                            attachment: URLS.map((url, i) => ({
                                type: "image",
                                url,
                                caption: i === 0 ? "Image batch test (" + (i + 1) + "/4)" : "Image " + (i + 1) + "/4",
                            })),
                        }, threadID);
                        console.log(C.G + "[BOT] testmedia sent " + (results || []).filter(Boolean).length + " images" + C.r);
                        break;
                    }

                    // !d — download replied media to ./downloads/
                    case "d":
                    case "download": {
                        if (!msg.replyToMessage) {
                            await reply("❌ Reply to a media message and send !d");
                            break;
                        }
                        // Extract the quoted message content from raw
                        const ctxInfo = msg.raw?.message?.extendedTextMessage?.contextInfo
                            || msg.raw?.message?.imageMessage?.contextInfo
                            || msg.raw?.message?.videoMessage?.contextInfo
                            || msg.raw?.message?.audioMessage?.contextInfo
                            || msg.raw?.message?.documentMessage?.contextInfo;

                        const quotedContent = ctxInfo?.quotedMessage;
                        const quotedID      = ctxInfo?.stanzaId || msg.replyToMessage?.messageID;

                        if (!quotedContent || !quotedID) {
                            await reply("❌ Could not find quoted media. Make sure you reply to a media message.");
                            break;
                        }

                        const fakeMsg = {
                            key:     { remoteJid: threadID, id: quotedID, fromMe: false },
                            message: quotedContent,
                        };

                        try {
                            await reply("⏳ Downloading…");
                            const buf = await api.downloadMedia(fakeMsg);
                            if (!buf) { await reply("❌ No media found in that message."); break; }

                            // Determine mime & extension
                            const inner = quotedContent.imageMessage || quotedContent.videoMessage
                                || quotedContent.audioMessage || quotedContent.documentMessage
                                || quotedContent.stickerMessage || {};
                            const mime  = inner.mimetype || "application/octet-stream";
                            const ext   = mimeToExt(mime);
                            const fname = "media_" + quotedID.slice(-8) + "." + ext;

                            const dlDir  = join(__dirname, "downloads");
                            mkdirSync(dlDir, { recursive: true });
                            const fpath  = join(dlDir, fname);
                            writeFileSync(fpath, buf);

                            trackSent(await reply(
                                "✅ Downloaded!\n" +
                                "File : " + fname + "\n" +
                                "Size : " + (buf.length / 1024).toFixed(1) + " KB\n" +
                                "Path : ./downloads/" + fname
                            ));
                        } catch (de) {
                            await reply("❌ Download failed: " + de.message);
                        }
                        break;
                    }

                    // ══════════════════════════════════════════════════════
                    //   BUTTONS / INTERACTIVE
                    // ══════════════════════════════════════════════════════
                    case "buttons": {
                        const r = await api.sendButtons(threadID,
                            "Choose an option:",
                            [
                                { id: "opt1", text: "✅ Option 1" },
                                { id: "opt2", text: "🔵 Option 2" },
                                { id: "opt3", text: "🔴 Option 3" },
                            ],
                            { footer: "Powered by WCA" }
                        );
                        trackSent(r);
                        break;
                    }

                    case "list": {
                        const r = await api.sendList(threadID,
                            "WCA Menu",
                            "📋 Open Menu",
                            [
                                {
                                    title: "🛠️ Bot Features",
                                    rows: [
                                        { id: "send",    title: "Send Message",  description: "Send text or media" },
                                        { id: "group",   title: "Group Manage",  description: "Manage group members" },
                                        { id: "profile", title: "Profile",       description: "Update bot profile" },
                                    ],
                                },
                                {
                                    title: "ℹ️ Info",
                                    rows: [
                                        { id: "about",  title: "About WCA",  description: "Floppa WCA Client" },
                                        { id: "help",   title: "Help",       description: "Type !help for commands" },
                                    ],
                                },
                            ],
                            { footer: "WCA by frnAlt" }
                        );
                        trackSent(r);
                        break;
                    }

                    case "template": {
                        const r = await api.sendTemplate(threadID,
                            "🔗 Check out WCA!",
                            "WhatsApp Client API",
                            [
                                { index: 1, urlButton:  { displayText: "⭐ GitHub",  url: "https://github.com/frnAlt/WA-Goat" } },
                                { index: 2, urlButton:  { displayText: "🤖 Example Bot", url: "https://github.com/frnAlt/WA-Goat" } },
                                { index: 3, quickReply: { displayText: "👍 Nice!", id: "nice" } },
                            ]
                        );
                        trackSent(r);
                        break;
                    }

                    // ══════════════════════════════════════════════════════
                    //   PROFILE / USER
                    // ══════════════════════════════════════════════════════
                    case "userinfo": {
                        const info = await api.getUserInfo(senderID);
                        const u    = info[senderID] || {};
                        trackSent(await reply(
                            "👤 *User Info*\n" +
                            "JID    : " + (u.userID || senderID) + "\n" +
                            "Status : " + (u.status || "—") + "\n" +
                            "Pic    : " + (u.profilePicture || "—")
                        ));
                        break;
                    }

                    case "profilepic": {
                        const url = await api.getProfilePicture(senderID);
                        trackSent(await reply("🖼️ Profile pic:\n" + (url || "No profile picture.")));
                        break;
                    }

                    case "status": {
                        const text = args.join(" ");
                        if (!text) { await reply("❌ Usage: !status <text>"); break; }
                        await api.updateProfileStatus(text);
                        trackSent(await reply("✅ Status updated: " + text));
                        break;
                    }

                    case "name": {
                        const name = args.join(" ");
                        if (!name) { await reply("❌ Usage: !name <text>"); break; }
                        await api.updateProfileName(name);
                        trackSent(await reply("✅ Name updated: " + name));
                        break;
                    }

                    case "presence":
                        await api.sendPresenceUpdate("available", threadID);
                        trackSent(await reply("✅ Available presence sent."));
                        break;

                    case "fetchstatus": {
                        const st = await api.fetchStatus(senderID);
                        trackSent(await reply("📝 Status: " + (st?.status || "No status set")));
                        break;
                    }

                    case "block":
                        await api.blockContact(senderID);
                        await reply("🚫 Blocked (will unblock in 2s)…");
                        setTimeout(() => api.unblockContact(senderID).catch(() => {}), 2000);
                        break;

                    default:
                        // Unknown command — silently ignore
                        break;
                }
            } catch (e) {
                console.error(C.red + "[BOT] cmd error (" + cmd + "):", e.message, C.r);
                try { await reply("❌ Error: " + e.message); } catch (_) {}
            }
        });
    }
);
