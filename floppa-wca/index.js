"use strict";

const path = require("path");
const fs = require("fs");
const utils = require("./utils");

// ─── ANSI colours ────────────────────────────────────────────────────────────
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    bGreen: "\x1b[92m",
    bCyan: "\x1b[96m",
    bYellow: "\x1b[93m",
    bWhite: "\x1b[97m",
    dim: "\x1b[2m",
};

/**
 * Main WCA entry point — mirrors FCA login() style.
 *
 * @param {object}   options
 * @param {string}   [options.authFolder]         Folder to store auth state   (default: './wca_auth')
 * @param {string}   [options.phoneNumber]        Phone number for pair code   (e.g. '8801xxxxxxxxx')
 * @param {boolean}  [options.usePairingCode]     Force pairing-code flow      (default: auto if phoneNumber provided)
 * @param {boolean}  [options.printQR]            Print QR in terminal         (default: true when no phoneNumber)
 * @param {boolean}  [options.skipUpdateCheck]    Skip auto-update check       (default: false)
 * @param {object}   [options.globalOptions]      FCA-style global options
 * @param {boolean}  [options.globalOptions.selfListen]          Listen to own messages    (default: false)
 * @param {boolean}  [options.globalOptions.listenEvents]        Emit group/call events    (default: true)
 * @param {boolean}  [options.globalOptions.autoReconnect]       Auto reconnect on drop    (default: true)
 * @param {boolean}  [options.globalOptions.autoMarkDelivery]    Auto-read on receive      (default: false)
 * @param {boolean}  [options.globalOptions.emitReady]           Emit ready event          (default: false)
 * @param {boolean}  [options.globalOptions.updatePresence]      Emit presence events      (default: false)
 * @param {boolean}  [options.globalOptions.enableTypingIndicator] Show typing before send (default: false)
 * @param {number}   [options.globalOptions.typingDuration]      Typing duration ms        (default: 3000)
 *
 * @param {function} callback  (err, api)
 */
function wca(options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    if (typeof callback !== "function") callback = function () {};

    options = options || {};

    const authFolder = options.authFolder || "./wca_auth";
    utils.ensureDir(authFolder);

    const globalOptions = Object.assign(
        {
            // ── Listen ──────────────────────────────────────────────
            selfListen:             false,
            selfListenEvent:        false,
            listenEvents:           true,
            // ── Presence / typing ────────────────────────────────────
            updatePresence:         false,
            listenTyping:           false,
            // ── Delivery / receipts ──────────────────────────────────
            autoMarkDelivery:       false,
            // ── Connection ───────────────────────────────────────────
            autoReconnect:          true,
            forceLogin:             false,
            online:                 true,
            emitReady:              false,
            // ── Typing indicator before send ─────────────────────────
            enableTypingIndicator:  false,
            typingDuration:         3000,
            // ── Logging ──────────────────────────────────────────────
            logLevel:               "error",
        },
        options.globalOptions || {}
    );

    let sockInstance = null;
    let ctx = {
        selfID:    null,
        authState: null,
        globalOptions,
        sock:      null,
        lidCache:  {},
    };

    // ── Auto-update check (runs before connection) ───────────────────────────
    const skipUpdate = options.skipUpdateCheck === true;

    function runUpdateThenConnect() {
        if (skipUpdate) {
            doConnect();
            return;
        }
        let checkUpdate;
        try {
            checkUpdate = require("./checkUpdate").checkForWCAUpdate;
        } catch (_) {
            doConnect();
            return;
        }
        checkUpdate({ autoUpdate: true, silent: false, exitOnUpdate: true })
            .then(() => doConnect())
            .catch(() => doConnect());
    }

    // ── Dynamic ESM import of Baileys ────────────────────────────────────────
    function doConnect() {
        import("@whiskeysockets/baileys")
            .then(async (Baileys) => {
                const {
                    default: makeWASocket,
                    useMultiFileAuthState,
                    DisconnectReason,
                    fetchLatestBaileysVersion,
                    Browsers,
                    makeInMemoryStore,
                    downloadMediaMessage,
                } = Baileys;

                let qrCodeTerminal;
                try { qrCodeTerminal = require("qrcode-terminal"); } catch (_) {}

                const { state, saveCreds } = await useMultiFileAuthState(authFolder);

                let { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1023451250] }));

                const phoneNumber = options.phoneNumber
                    ? utils.normalizePhoneNumber(String(options.phoneNumber))
                    : null;
                const usePairingCode = options.usePairingCode || !!phoneNumber;
                const printQR = options.printQR !== false && !usePairingCode;

                // Track whether we've already resolved the initial connect callback,
                // and store the listen callback so it can be re-bound on reconnect.
                let builtAPI          = null;
                let _globalListenCb   = null;
                let reconnectAttempts = 0;
                const MAX_RECONNECTS  = 5; // clear auth after this many consecutive failures

                function clearAuthFolder() {
                    try {
                        const _fs = require("fs");
                        if (_fs.existsSync(authFolder)) {
                            _fs.rmSync(authFolder, { recursive: true, force: true });
                        }
                    } catch (_) {}
                }

                function createSocket() {
                    const sock = makeWASocket({
                        version,
                        auth: state,
                        printQRInTerminal: printQR,
                        browser: Browsers ? Browsers.ubuntu("Chrome") : ["Ubuntu", "Chrome", "20.0.04"],
                        syncFullHistory: false,
                        markOnlineOnConnect: globalOptions.online !== false,
                        logger: require("pino")({ level: "silent" }).child({}),
                        generateHighQualityLinkPreview: true,
                        connectTimeoutMs: 60000,
                        defaultQueryTimeoutMs: 60000,
                        keepAliveIntervalMs: 30000,
                    });

                    sockInstance = sock;
                    ctx.sock = sock;

                    sock.ev.on("creds.update", saveCreds);

                    let pairCodeRequested = false;
                    sock.ev.on("connection.update", async (update) => {
                        const { connection, lastDisconnect, qr } = update;

                        if (qr && printQR) {
                            if (qrCodeTerminal) {
                                console.log(C.cyan + "Scan QR Code:\n" + C.reset);
                                qrCodeTerminal.generate(qr, { small: true });
                            } else {
                                console.log(C.yellow + "QR: " + qr + C.reset);
                            }
                        }

                        if (qr && usePairingCode && phoneNumber && !pairCodeRequested) {
                            pairCodeRequested = true;
                            try {
                                await utils.delay(2000);
                                const code = await sock.requestPairingCode(phoneNumber);
                                console.log(C.bGreen + "Pairing Code: " + C.bYellow + code + C.reset);
                                console.log(C.dim + "Enter in WhatsApp → Linked Devices → Link with phone number" + C.reset);
                            } catch (e) {
                                console.log(C.red + "Failed to get pairing code: " + e.message + C.reset);
                            }
                        }

                        if (connection === "open") {
                            ctx.selfID       = sock.user?.id || "";
                            ctx.authState    = state;
                            reconnectAttempts = 0; // reset on successful connect

                            if (!builtAPI) {
                                builtAPI = buildAPI(sock, ctx, globalOptions, (cb) => { _globalListenCb = cb; });
                                callback(null, builtAPI);
                            } else {
                                if (_globalListenCb) {
                                    try {
                                        require("./src/listenMqtt")(sock, ctx, _globalListenCb);
                                    } catch (_) {}
                                }
                            }
                        }

                        if (connection === "close") {
                            const statusCode = lastDisconnect?.error?.output?.statusCode;
                            const loggedOut  = statusCode === DisconnectReason.loggedOut;
                            // Also treat auth-level codes as hard failures that require fresh login
                            const authFailed = [401, 403, 405, 428].includes(statusCode);

                            if (loggedOut || authFailed) {
                                clearAuthFolder();
                                if (!builtAPI) {
                                    callback(new Error("logged_out"), null);
                                } else {
                                    console.log(C.red + "  [WCA] Session expired — auth cleared, restarting…" + C.reset);
                                    setTimeout(() => process.exit(2), 1500);
                                }
                                return;
                            }

                            // Persistent reconnect failure — clear auth after MAX_RECONNECTS attempts
                            reconnectAttempts++;
                            if (reconnectAttempts >= MAX_RECONNECTS) {
                                console.log(C.red + `  [WCA] Reconnect failed ${reconnectAttempts}× — clearing auth and restarting…` + C.reset);
                                clearAuthFolder();
                                setTimeout(() => process.exit(2), 1500);
                                return;
                            }

                            const delay = Math.min(3000 * reconnectAttempts, 15000);
                            console.log(C.yellow + `  [WCA] Connection closed. Reconnecting… (attempt ${reconnectAttempts}/${MAX_RECONNECTS})` + C.reset);
                            if (globalOptions.autoReconnect) {
                                await utils.delay(delay);
                                createSocket();
                            }
                        }
                    });

                    return sock;
                }

                createSocket();
            })
            .catch((err) => {
                console.error(C.red + "  [WCA] Failed to load Baileys:" + C.reset, err);
                callback(err, null);
            });
    }

    runUpdateThenConnect();
}

function buildAPI(sock, ctx, globalOptions, onListenStore) {
    const api = {
        setOptions: function (opts) {
            Object.assign(ctx.globalOptions, opts);
        },

        getAppState: require("./src/getAppState")(sock, null, ctx),
    };

    // ── Load every feature file from src/ ────────────────────────────────────
    const srcDir = path.join(__dirname, "src");
    const SKIP = new Set(["listenMqtt.js"]);
    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".js") && !SKIP.has(f));

    for (const file of files) {
        const name = file.replace(".js", "");
        try {
            const mod = require(path.join(srcDir, file))(sock, api, ctx);

            if (typeof mod === "function") {
                api[name] = mod;
            } else if (mod && typeof mod === "object") {
                Object.assign(api, mod);
            }
        } catch (e) {
            console.warn(C.yellow + "  [WCA] Warning: failed to load " + file + ": " + e.message + C.reset);
        }
    }

    // ── Convenience aliases (FCA-style) ─────────────────────────────────────
    api.listen = function (callback) {
        // Store callback so it can be re-bound to a new socket on reconnect
        if (typeof onListenStore === "function") onListenStore(callback);
        require("./src/listenMqtt")(ctx.sock, ctx, callback);
        return ctx.sock;
    };
    api.listenMqtt = api.listen;

    api.sendMessage = require("./src/sendMessage")(sock, api, ctx);

    const mediaMod = require("./src/sendMedia")(sock, api, ctx);
    api.sendImage    = mediaMod.sendImage;
    api.sendVideo    = mediaMod.sendVideo;
    api.sendAudio    = mediaMod.sendAudio;
    api.sendPTT      = mediaMod.sendPTT;
    api.sendDocument = mediaMod.sendDocument;
    api.sendSticker  = mediaMod.sendSticker;
    api.sendGif      = mediaMod.sendGif;
    api.sendMedia    = mediaMod.sendMedia;

    api.sendTypingIndicator = require("./src/sendTypingIndicator")(sock, api, ctx);
    api.markAsRead          = require("./src/sendReadReceipt")(sock, api, ctx);
    api.sendReadReceipt     = api.markAsRead;

    // ── Groups ───────────────────────────────────────────────────────────────
    api.getGroupInfo         = require("./src/getGroupInfo")(sock, api, ctx);
    api.addUserToGroup       = require("./src/addUserToGroup")(sock, api, ctx);
    api.kickUser             = require("./src/kickUser")(sock, api, ctx);
    api.removeUserFromGroup  = api.kickUser;
    api.changeGroupSubject   = require("./src/changeGroupSubject")(sock, api, ctx);
    api.changeGroupDescription = require("./src/changeGroupDescription")(sock, api, ctx);
    api.getGroupAdmins       = require("./src/getGroupAdmins")(sock, api, ctx);
    api.getGroupInviteLink   = require("./src/getGroupInviteLink")(sock, api, ctx);
    api.createGroup          = require("./src/createGroup")(sock, api, ctx);
    api.leaveGroup           = require("./src/leaveGroup")(sock, api, ctx);
    api.getAllGroups          = require("./src/getAllGroups")(sock, api, ctx);

    const adminMod = require("./src/setGroupAdmin")(sock, api, ctx);
    api.promoteAdmin = adminMod.promoteAdmin;
    api.demoteAdmin  = adminMod.demoteAdmin;

    api.groupSettingUpdate = require("./src/groupSettingUpdate")(sock, api, ctx);
    api.groupRevokeInvite  = require("./src/groupRevokeInvite")(sock, api, ctx);
    api.groupAcceptInvite  = require("./src/groupAcceptInvite")(sock, api, ctx);

    // ── Profile & user ───────────────────────────────────────────────────────
    api.getProfilePicture   = require("./src/getProfilePicture")(sock, api, ctx);
    api.updateProfilePicture = require("./src/updateProfilePicture")(sock, api, ctx);
    api.updateProfileStatus = require("./src/updateProfileStatus")(sock, api, ctx);
    api.updateProfileName   = require("./src/updateProfileName")(sock, api, ctx);

    const blockMod = require("./src/blockContact")(sock, api, ctx);
    api.blockContact   = blockMod.blockContact;
    api.unblockContact = blockMod.unblockContact;

    api.reactToMessage  = require("./src/reactToMessage")(sock, api, ctx);
    api.deleteMessage   = require("./src/deleteMessage")(sock, api, ctx);
    api.downloadMedia   = require("./src/downloadMedia")(sock, api, ctx);
    api.getUserInfo     = require("./src/getUserInfo")(sock, api, ctx);
    api.getDMInfo       = require("./src/getDMInfo")(sock, api, ctx);
    api.getContacts     = require("./src/getContacts")(sock, api, ctx);
    api.getChats        = require("./src/getChats")(sock, api, ctx);

    api.sendPresenceUpdate = require("./src/sendPresenceUpdate")(sock, api, ctx);
    api.fetchStatus        = require("./src/fetchStatus")(sock, api, ctx);
    api.sendLocation       = require("./src/sendLocation")(sock, api, ctx);

    const buttonsMod = require("./src/sendButtons")(sock, api, ctx);
    api.sendButtons  = buttonsMod.sendButtons;
    api.sendList     = buttonsMod.sendList;
    api.sendTemplate = buttonsMod.sendTemplate;

    // ── New features ─────────────────────────────────────────────────────────
    api.sendPoll  = require("./src/sendPoll")(sock, api, ctx);
    api.editMessage = require("./src/editMessage")(sock, api, ctx);

    const pinMod = require("./src/pinMessage")(sock, api, ctx);
    api.pinMessage   = pinMod.pinMessage;
    api.unpinMessage = pinMod.unpinMessage;

    const archiveMod = require("./src/archiveChat")(sock, api, ctx);
    api.archiveChat   = archiveMod.archiveChat;
    api.unarchiveChat = archiveMod.unarchiveChat;

    const muteMod = require("./src/muteChat")(sock, api, ctx);
    api.muteChat   = muteMod.muteChat;
    api.unmuteChat = muteMod.unmuteChat;

    // ── Expose raw Baileys sock for power users ──────────────────────────────
    api.sock = sock;
    api.ctx  = ctx;

    // ── Helper: get self JID ─────────────────────────────────────────────────
    api.getCurrentUserID = function () {
        return ctx.selfID;
    };

    // ── Legacy FCA aliases for total cross-compatibility ─────────────────────
    api.getThreadInfo           = api.getGroupInfo;
    api.setTitle                = api.changeGroupSubject;
    api.changeThreadSubject     = api.changeGroupSubject;
    api.changeThreadDescription = api.changeGroupDescription;
    api.changeAdminStatus       = (tid, uid, isAdmin, cb) => api.setGroupAdmin(uid, tid, isAdmin, cb);
    api.setMessageReaction      = (emoji, mid, cb, tid) => api.reactToMessage(emoji, mid, tid, cb);
    api.unsendMessage           = (mid, cb, tid) => api.deleteMessage(mid, tid, cb);

    // ── Floppa Extension Layer (Conduit builders, sliding cache, queues, Axera suites) ──
    try {
        const extendFCA = require("./src/extensions/fcaExtension.js");
        if (typeof extendFCA === "function") {
            extendFCA(api);
        }
    } catch (_) {}

    return api;
}

module.exports = wca;
module.exports.default = wca;
module.exports.buildAPI = buildAPI;
module.exports.utils = utils;
