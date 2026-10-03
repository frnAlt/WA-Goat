const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const https = require("https");
const http = require("http");
const { Readable } = require("stream");
const agent = new https.Agent({
        rejectUnauthorized: false
});
const moment = require("moment-timezone");
const mimeDB = require("mime-db");
const _ = require("lodash");
const ora = require("ora");
const log = require("./logger/log.js");
const { isHexColor, colors } = require("./func/colors.js");
const Prism = require("./func/prism.js");
const config = global.GoatBot?.config || global.FloppaBot?.config || {};

const word = [
        'A', 'Á', 'À', 'Ả', 'Ã', 'Ạ', 'a', 'á', 'à', 'ả', 'ã', 'ạ',
        'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ', 'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ',
        'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ', 'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
        'B', 'b',
        'C', 'c',
        'D', 'Đ', 'd', 'đ',
        'E', 'É', 'È', 'Ẻ', 'Ẽ', 'Ẹ', 'e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ',
        'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ', 'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ',
        'F', 'f',
        'G', 'g',
        'H', 'h',
        'I', 'Í', 'Ì', 'Ỉ', 'Ĩ', 'Ị', 'i', 'í', 'ì', 'ỉ', 'ĩ', 'ị',
        'J', 'j',
        'K', 'k',
        'L', 'l',
        'M', 'm',
        'N', 'n',
        'O', 'Ó', 'Ò', 'Ỏ', 'Õ', 'Ọ', 'o', 'ó', 'ò', 'ỏ', 'õ', 'ọ',
        'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ', 'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ',
        'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ', 'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
        'P', 'p',
        'Q', 'q',
        'R', 'r',
        'S', 's',
        'T', 't',
        'U', 'Ú', 'Ù', 'Ủ', 'Ũ', 'Ụ', 'u', 'ú', 'ù', 'ủ', 'ũ', 'ụ',
        'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự', 'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự',
        'V', 'v',
        'W', 'w',
        'X', 'x',
        'Y', 'Ý', 'Ỳ', 'Ỷ', 'Ỹ', 'Ỵ', 'y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ',
        'Z', 'z',
        ' '
];

const regCheckURL = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

class CustomError extends Error {
        constructor(obj) {
                if (typeof obj === 'string')
                        obj = { message: obj };
                if (typeof obj !== 'object' || obj === null)
                        throw new TypeError('Object required');
                obj.message ? super(obj.message) : super();
                Object.assign(this, obj);
        }
}

function lengthWhiteSpacesEndLine(text) {
        let length = 0;
        for (let i = text.length - 1; i >= 0; i--) {
                if (text[i] == ' ')
                        length++;
                else
                        break;
        }
        return length;
}

function lengthWhiteSpacesStartLine(text) {
        let length = 0;
        for (let i = 0; i < text.length; i++) {
                if (text[i] == ' ')
                        length++;
                else
                        break;
        }
        return length;
}

function setErrorUptime() {
        global.statusAccountBot = 'block spam';
        global.responseUptimeCurrent = global.responseUptimeError;
}
const defaultStderrClearLine = process.stderr.clearLine;


function convertTime(miliSeconds, replaceSeconds = "s", replaceMinutes = "m", replaceHours = "h", replaceDays = "d", replaceMonths = "M", replaceYears = "y", notShowZero = false) {
        if (typeof replaceSeconds == 'boolean') {
                notShowZero = replaceSeconds;
                replaceSeconds = "s";
        }
        const second = Math.floor(miliSeconds / 1000 % 60);
        const minute = Math.floor(miliSeconds / 1000 / 60 % 60);
        const hour = Math.floor(miliSeconds / 1000 / 60 / 60 % 24);
        const day = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 % 30);
        const month = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 / 30 % 12);
        const year = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 / 30 / 12);
        let formattedDate = '';

        const dateParts = [
                { value: year, replace: replaceYears },
                { value: month, replace: replaceMonths },
                { value: day, replace: replaceDays },
                { value: hour, replace: replaceHours },
                { value: minute, replace: replaceMinutes },
                { value: second, replace: replaceSeconds }
        ];

        for (let i = 0; i < dateParts.length; i++) {
                const datePart = dateParts[i];
                if (datePart.value)
                        formattedDate += datePart.value + datePart.replace;
                else if (formattedDate != '')
                        formattedDate += '00' + datePart.replace;
                else if (i == dateParts.length - 1)
                        formattedDate += '0' + datePart.replace;
        }

        if (formattedDate == '')
                formattedDate = '0' + replaceSeconds;

        if (notShowZero)
                formattedDate = formattedDate.replace(/00\w+/g, '');

        return formattedDate;
}

function createOraDots(text) {
        const spin = new ora({
                text: text,
                spinner: {
                        interval: 80,
                        frames: [
                                '⠋', '⠙', '⠹',
                                '⠸', '⠼', '⠴',
                                '⠦', '⠧', '⠇',
                                '⠏'
                        ]
                }
        });
        spin._start = () => {
                utils.enableStderrClearLine(false);
                spin.start();
        };
        spin._stop = () => {
                utils.enableStderrClearLine(true);
                spin.stop();
        };
        return spin;
}

class TaskQueue {
        constructor(callback) {
                this.queue = [];
                this.running = null;
                this.callback = callback;
        }
        push(task) {
                this.queue.push(task);
                if (this.queue.length == 1)
                        this.next();
        }
        next() {
                if (this.queue.length > 0) {
                        const task = this.queue[0];
                        this.running = task;
                        this.callback(task, async (err, result) => {
                                this.running = null;
                                this.queue.shift();
                                this.next();
                        });
                }
        }
        length() {
                return this.queue.length;
        }
}

function enableStderrClearLine(isEnable = true) {
        process.stderr.clearLine = isEnable ? defaultStderrClearLine : () => { };
}

function formatNumber(number) {
        const regionCode = global.GoatBot.config.language;
        if (isNaN(number))
                throw new Error('The first argument (number) must be a number');

        number = Number(number);
        return number.toLocaleString(regionCode || "en-US");
}

function getExtFromAttachmentType(type) {
        switch (type) {
                case "photo":
                        return 'png';
                case "animated_image":
                        return "gif";
                case "video":
                        return "mp4";
                case "audio":
                        return "mp3";
                default:
                        return "txt";
        }
}

function getExtFromMimeType(mimeType = "") {
        return mimeDB[mimeType] ? (mimeDB[mimeType].extensions || [])[0] || "unknow" : "unknow";
}

function getExtFromUrl(url = "") {
        if (!url || typeof url !== "string")
                throw new Error('The first argument (url) must be a string');
        const reg = /(?<=https:\/\/cdn.fbsbx.com\/v\/.*?\/|https:\/\/video.xx.fbcdn.net\/v\/.*?\/|https:\/\/scontent.xx.fbcdn.net\/v\/.*?\/).*?(\/|\?)/g;
        const fileName = url.match(reg)[0].slice(0, -1);
        return fileName.slice(fileName.lastIndexOf(".") + 1);
}

function getPrefix(threadID) {
        if (!threadID) return global.GoatBot?.config?.prefix || "!";
        threadID = String(threadID);
        let prefix = global.GoatBot?.config?.prefix || "!";
        const threadData = global.db?.allThreadData?.find(t => t.threadID == threadID);
        if (threadData)
                prefix = threadData?.data?.prefix || prefix;
        return prefix || global.GoatBot?.config?.prefix || "!";
}

function getTime(timestamps, format) {
        // check if just have timestamps -> format = timestamps
        if (!format && typeof timestamps == 'string') {
                format = timestamps;
                timestamps = undefined;
        }
        const tz = global.GoatBot?.config?.timeZone || global.FloppaBot?.config?.timeZone || config.timeZone || "Asia/Dhaka";
        try {
                const m = moment(timestamps).tz(tz);
                if (m && typeof m.format === 'function') {
                        return m.format(format);
                }
        } catch (_) {}
        return moment(timestamps).format(format);
}

/**
 * @param {any} value
 * @returns {("Null" | "Undefined" | "Boolean" | "Number" | "String" | "Symbol" | "Object" | "Function" | "AsyncFunction" | "Array" | "Date" | "RegExp" | "Error" | "Map" | "Set" | "WeakMap" | "WeakSet" | "Int8Array" | "Uint8Array" | "Uint8ClampedArray" | "Int16Array" | "Uint16Array" | "Int32Array" | "Uint32Array" | "Float32Array" | "Float64Array" | "BigInt" | "BigInt64Array" | "BigUint64Array")}
 */
function getType(value) {
        return Object.prototype.toString.call(value).slice(8, -1);
}

function isNumber(value) {
        return !isNaN(parseFloat(value));
}

function compareVersion(version1, version2) {
        const v1 = version1.split(".");
        const v2 = version2.split(".");
        for (let i = 0; i < 3; i++) {
                if (parseInt(v1[i]) > parseInt(v2[i]))
                        return 1;
                if (parseInt(v1[i]) < parseInt(v2[i]))
                        return -1;
        }
        return 0;
}

function jsonStringifyColor(obj, filter, indent, level) {
        // source: https://www.npmjs.com/package/node-json-color-stringify
        indent = indent || 0;
        level = level || 0;
        let output = '';

        if (typeof obj === 'string')
                output += colors.green(`"${obj}"`);
        else if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null)
                output += colors.yellow(obj);
        else if (obj === undefined)
                output += colors.gray('undefined');
        else if (obj !== undefined && typeof obj !== 'function')
                if (!Array.isArray(obj)) {
                        if (Object.keys(obj).length === 0)
                                output += '{}';
                        else {
                                output += colors.gray('{\n');
                                Object.keys(obj).forEach(key => {
                                        let value = obj[key];

                                        if (filter) {
                                                if (typeof filter === 'function')
                                                        value = filter(key, value);
                                                else if (typeof filter === 'object' && filter.length !== undefined)
                                                        if (filter.indexOf(key) < 0)
                                                                return;
                                        }

                                        // if (value === undefined)
                                        //      return;
                                        if (!isNaN(key[0]) || key.match(/[^a-zA-Z0-9_]/))
                                                key = colors.green(JSON.stringify(key));

                                        output += ' '.repeat(indent + level * indent) + `${key}:${indent ? ' ' : ''}`;
                                        output += utils.jsonStringifyColor(value, filter, indent, level + 1) + ',\n';
                                });

                                output = output.replace(/,\n$/, '\n');
                                output += ' '.repeat(level * indent) + colors.gray('}');
                        }
                }
                else {
                        if (obj.length === 0)
                                output += '[]';
                        else {
                                output += colors.gray('[\n');
                                obj.forEach(subObj => {
                                        output += ' '.repeat(indent + level * indent) + utils.jsonStringifyColor(subObj, filter, indent, level + 1) + ',\n';
                                });

                                output = output.replace(/,\n$/, '\n');
                                output += ' '.repeat(level * indent) + colors.gray(']');
                        }
                }
        else if (typeof obj === 'function')
                output += colors.green(obj.toString());

        output = output.replace(/,$/gm, colors.gray(','));
        if (indent === 0)
                return output.replace(/\n/g, '');

        return output;
}


function message(api, event) {
        function recordBotMessage(mid, threadID) {
                if (!mid || !threadID) return;
                if (!global.botSentMessages) global.botSentMessages = new Map();
                const list = global.botSentMessages.get(threadID) || [];
                list.push(mid);
                if (list.length > 60) list.shift();
                global.botSentMessages.set(threadID, list);
        }

        async function sendMessageError(err) {
                if (typeof err === "object" && !err.stack)
                        err = utils.removeHomeDir(JSON.stringify(err, null, 2));
                else
                        err = utils.removeHomeDir(`${err.name || err.error}: ${err.message}`);
                const sent = await api.sendMessage(utils.getText("utils", "errorOccurred", err), event.threadID, event.messageID);
                if (sent?.messageID) {
                        recordBotMessage(sent.messageID, event.threadID);
                        setTimeout(() => {
                                api.unsendMessage(sent.messageID).catch(() => {});
                        }, 8000);
                }
                return sent;
        }

        // Helper function to send typing indicator
        async function sendTypingIndicator(threadID, duration = 2000) {
                try {
                        // Enable typing indicator
                        await api.sendTypingIndicator(true, threadID);
                        // Wait for specified duration to simulate typing
                        await new Promise(resolve => setTimeout(resolve, duration));
                        // Disable typing indicator
                        await api.sendTypingIndicator(false, threadID);
                } catch (err) {
                        // Silently fail - typing indicator is not critical
                }
        }

        const resolvedIsGroup = event.isGroup !== undefined
                ? Boolean(event.isGroup)
                : (event.threadID && event.senderID ? String(event.threadID) !== String(event.senderID) : false);

        return {
                send: async (form, callback, options = {}) => {
                        try {
                                global.statusAccountBot = 'good';

                                // Check if typing indicator is enabled in config or active DM (non-blocking)
                                const typingConfig = global.GoatBot?.config?.typingIndicator;
                                const typingEnabled = !resolvedIsGroup || typingConfig === true || (typeof typingConfig === 'object' && typingConfig?.enable === true);
                                if (typingEnabled && (typeof form === 'string' || form?.body) && typeof api?.sendTypingIndicator === 'function') {
                                        try {
                                                const typingRes = api.sendTypingIndicator(true, event.threadID);
                                                if (typingRes && typeof typingRes.catch === 'function') {
                                                        typingRes.catch(() => {});
                                                }
                                        } catch (_) {}
                                }

                                const cb = typeof callback === 'function' ? callback : undefined;
                                const res = await api.sendMessage(form, event.threadID, cb, undefined, resolvedIsGroup);
                                if (res?.messageID) {
                                        recordBotMessage(res.messageID, event.threadID);
                                        const text = typeof form === 'string' ? form : (form?.body || '');
                                        if (options.autoUnsend || text.startsWith("❌") || text.toLowerCase().startsWith("error:")) {
                                                const delayMs = options.autoUnsendDelay || 8000;
                                                setTimeout(() => {
                                                        api.unsendMessage(res.messageID, event.threadID).catch(() => {});
                                                }, delayMs);
                                        }
                                }
                                return res;
                        }
                        catch (err) {
                                const errStr = String(err?.message || err || "");
                                if (!resolvedIsGroup && (errStr.includes("1545116") || errStr.includes("E2EE") || errStr.includes("cutover") || errStr.includes("1545041"))) {
                                        const senderUID = String(event.senderID || event.userID || event.author || event.threadID || "");
                                        const userObj = (global.db?.allUserData || []).find(u => String(u.userID) === senderUID);
                                        const uName = userObj?.name || `User ${senderUID}`;

                                        // 1. Try routing to dedicated unencrypted private room IF already created
                                        try {
                                                let pMgr = global.privateThreadManager;
                                                if (!pMgr) {
                                                        try { pMgr = require(require('path').join(process.cwd(), "func/privateThreadManager")); } catch (_) {}
                                                }
                                                if (pMgr) {
                                                        const privateTID = pMgr.getPrivateThread(senderUID);
                                                        if (privateTID && String(privateTID) !== String(event.threadID)) {
                                                                log.warn("DM_ROUTER", `Routed DM message for ${uName} (${senderUID}) to private room ${privateTID} due to Facebook E2EE`);
                                                                return await api.sendMessage(form, privateTID, undefined, undefined, true);
                                                        }
                                                }
                                        } catch (pErr) {
                                                log.warn("DM_ROUTER", `Private room routing failed: ${pErr.message}`);
                                        }

                                        // 2. Fallback to shared active group chat
                                        let sharedGroup = null;
                                        if (global.db && Array.isArray(global.db.allThreadData)) {
                                                sharedGroup = global.db.allThreadData.find(t => 
                                                        t.isGroup && t.members && t.members.some(m => String(m.userID || m.id || m) === senderUID)
                                                );
                                        }
                                        if (sharedGroup) {
                                                try {
                                                        const textContent = typeof form === "string" ? form : (form?.body || "");
                                                        const bridgeMsg = typeof form === "object" ? { ...form } : {};
                                                        bridgeMsg.body = `💬 [DM Bridge for ${uName}]:\n\n${textContent}\n\nℹ️ (Facebook E2EE restricts 1-on-1 private bot messages; bridged to your active group chat)`;
                                                        log.warn("DM_BRIDGE", `Bridged DM message for ${uName} (${senderUID}) to group ${sharedGroup.threadID} due to Facebook E2EE`);
                                                        return await api.sendMessage(bridgeMsg, sharedGroup.threadID, undefined, undefined, true);
                                                } catch (bErr) {
                                                        log.warn("DM_BRIDGE", `Failed to bridge DM to group: ${bErr.message}`);
                                                }
                                        }
                                }
                                if (JSON.stringify(err).includes('spam')) {
                                        setErrorUptime();
                                }
                                log.err("MESSAGE_SEND", `Failed to send message to thread ${event.threadID}:`, err.message || err);
                                throw err;
                        }
                },
                reply: async (form, callback, options = {}) => {
                        try {
                                global.statusAccountBot = 'good';

                                // Check if typing indicator is enabled in config or active DM (non-blocking)
                                const typingConfig = global.GoatBot?.config?.typingIndicator;
                                const typingEnabled = !resolvedIsGroup || typingConfig === true || (typeof typingConfig === 'object' && typingConfig?.enable === true);
                                if (typingEnabled && (typeof form === 'string' || form?.body) && typeof api?.sendTypingIndicator === 'function') {
                                        try {
                                                const typingRes = api.sendTypingIndicator(true, event.threadID);
                                                if (typingRes && typeof typingRes.catch === 'function') {
                                                        typingRes.catch(() => {});
                                                }
                                        } catch (_) {}
                                }

                                const cb = typeof callback === 'function' ? callback : undefined;
                                const replyId = event.messageID || undefined;
                                const res = await api.sendMessage(form, event.threadID, cb, replyId, resolvedIsGroup);
                                if (res?.messageID) {
                                        recordBotMessage(res.messageID, event.threadID);
                                        const text = typeof form === 'string' ? form : (form?.body || '');
                                        if (options.autoUnsend || text.startsWith("❌") || text.toLowerCase().startsWith("error:")) {
                                                const delayMs = options.autoUnsendDelay || 8000;
                                                setTimeout(() => {
                                                        api.unsendMessage(res.messageID, event.threadID).catch(() => {});
                                                }, delayMs);
                                        }
                                }
                                return res;
                        }
                        catch (err) {
                                const errStr = String(err?.message || err || "");
                                if (!resolvedIsGroup && (errStr.includes("1545116") || errStr.includes("E2EE") || errStr.includes("cutover") || errStr.includes("1545041"))) {
                                        const senderUID = String(event.senderID || event.userID || event.author || event.threadID || "");
                                        const userObj = (global.db?.allUserData || []).find(u => String(u.userID) === senderUID);
                                        const uName = userObj?.name || `User ${senderUID}`;

                                        // 1. Try routing to dedicated unencrypted private room IF already created
                                        try {
                                                let pMgr = global.privateThreadManager;
                                                if (!pMgr) {
                                                        try { pMgr = require(require('path').join(process.cwd(), "func/privateThreadManager")); } catch (_) {}
                                                }
                                                if (pMgr) {
                                                        const privateTID = pMgr.getPrivateThread(senderUID);
                                                        if (privateTID && String(privateTID) !== String(event.threadID)) {
                                                                log.warn("DM_ROUTER", `Routed DM reply for ${uName} (${senderUID}) to private room ${privateTID} due to Facebook E2EE`);
                                                                return await api.sendMessage(form, privateTID, undefined, undefined, true);
                                                        }
                                                }
                                        } catch (pErr) {
                                                log.warn("DM_ROUTER", `Private room routing failed: ${pErr.message}`);
                                        }

                                        // 2. Fallback to shared active group chat
                                        let sharedGroup = null;
                                        if (global.db && Array.isArray(global.db.allThreadData)) {
                                                sharedGroup = global.db.allThreadData.find(t => 
                                                        t.isGroup && t.members && t.members.some(m => String(m.userID || m.id || m) === senderUID)
                                                );
                                        }
                                        if (sharedGroup) {
                                                try {
                                                        const textContent = typeof form === "string" ? form : (form?.body || "");
                                                        const bridgeMsg = typeof form === "object" ? { ...form } : {};
                                                        bridgeMsg.body = `💬 [DM Bridge for ${uName}]:\n\n${textContent}\n\nℹ️ (Facebook E2EE restricts 1-on-1 private bot messages; bridged to your active group chat)`;
                                                        log.warn("DM_BRIDGE", `Bridged DM reply for ${uName} (${senderUID}) to group ${sharedGroup.threadID} due to Facebook E2EE`);
                                                        return await api.sendMessage(bridgeMsg, sharedGroup.threadID, undefined, undefined, true);
                                                } catch (bErr) {
                                                        log.warn("DM_BRIDGE", `Failed to bridge DM reply to group: ${bErr.message}`);
                                                }
                                        }
                                }
                                if (JSON.stringify(err).includes('spam')) {
                                        setErrorUptime();
                                }
                                log.err("MESSAGE_REPLY", `Failed to reply in thread ${event.threadID}:`, err.message || err);
                                throw err;
                        }
                },
                sendDM: async (form, targetUIDOrCallback, maybeCallback, options = {}) => {
                        let uid = event.senderID || event.userID || event.author;
                        let cb = undefined;
                        let opts = options;
                        if (typeof targetUIDOrCallback === "function") {
                                cb = targetUIDOrCallback;
                                opts = typeof maybeCallback === "object" ? maybeCallback : {};
                        } else if (typeof targetUIDOrCallback === "string" || typeof targetUIDOrCallback === "number") {
                                uid = String(targetUIDOrCallback);
                                cb = typeof maybeCallback === "function" ? maybeCallback : undefined;
                                opts = typeof options === "object" ? options : {};
                        } else if (typeof targetUIDOrCallback === "object" && targetUIDOrCallback !== null && !targetUIDOrCallback.body) {
                                opts = targetUIDOrCallback;
                                cb = typeof maybeCallback === "function" ? maybeCallback : undefined;
                        }
                        if (!uid) throw new Error("sendDM requires a valid sender/user ID");
                        let pMgr = global.privateThreadManager;
                        if (!pMgr) {
                                try { pMgr = require(require("path").join(process.cwd(), "func/privateThreadManager")); } catch (_) {}
                        }
                        if (pMgr) {
                                return await pMgr.sendDM(api, uid, form, { callback: cb, ...opts });
                        }
                        return await api.sendMessage(form, uid, cb, undefined, false);
                },
                sendToUser: async (userID, form, callback) => {
                        const targetID = userID || event.senderID;
                        const cb = typeof callback === 'function' ? callback : undefined;
                        if (typeof api.sendMessageToUser === 'function') {
                                return await api.sendMessageToUser(form, targetID, cb);
                        }
                        return await api.sendMessage(form, targetID, cb, undefined, false);
                },
                sendGroup: async (form, callback, options = {}) => {
                        if (!event.threadID) throw new Error("sendGroup requires a valid threadID");
                        const cb = typeof callback === 'function' ? callback : undefined;
                        return api.sendMessage(form, event.threadID, cb, undefined, true);
                },
                unsend: async (messageID, threadIDOrCallback, maybeCallback) => {
                        let threadID = event?.threadID;
                        let callback = undefined;
                        if (typeof threadIDOrCallback === 'function') {
                                callback = threadIDOrCallback;
                        } else if (threadIDOrCallback) {
                                threadID = threadIDOrCallback;
                                callback = maybeCallback;
                        }
                        return await api.unsendMessage(messageID, threadID, callback);
                },
                reaction: async (emoji, messageID, callback) => {
                        try {
                                if (global.GoatBot?.reactOff || global.FloppaBot?.reactOff || global.GoatBot?.config?.reactOff) {
                                        return;
                                }
                                global.statusAccountBot = 'good';
                                const targetMessageID = messageID || event.messageID;
                                const normalizedEmoji = emoji === "✅" ? "👍" : (emoji === "❌" ? "👎" : emoji);
                                return await api.setMessageReaction(normalizedEmoji, targetMessageID, callback, true);
                        }
                        catch (err) {
                                if (JSON.stringify(err).includes('spam')) {
                                        setErrorUptime();
                                }
                                console.error("❌ [REACTION] Error setting reaction:", err.message || err);
                        }
                },
                typing: async (isTyping = true, threadID) => {
                        const targetThreadID = threadID || event.threadID;
                        if (typeof api.sendTypingIndicator === 'function' && targetThreadID) {
                                try {
                                        return await api.sendTypingIndicator(Boolean(isTyping), targetThreadID);
                                } catch (_) {}
                        }
                },
                err: async (err) => await sendMessageError(err),
                error: async (err) => await sendMessageError(err)
        };
}

function randomString(max, onlyOnce = false, possible) {
        if (!max || isNaN(max))
                max = 10;
        let text = "";
        possible = possible || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < max; i++) {
                let random = Math.floor(Math.random() * possible.length);
                if (onlyOnce) {
                        while (text.includes(possible[random]))
                                random = Math.floor(Math.random() * possible.length);
                }
                text += possible[random];
        }
        return text;
}

function randomNumber(min, max) {
        if (!max) {
                max = min;
                min = 0;
        }
        if (min == null || min == undefined || isNaN(min))
                throw new Error('The first argument (min) must be a number');
        if (max == null || max == undefined || isNaN(max))
                throw new Error('The second argument (max) must be a number');
        return Math.floor(Math.random() * (max - min + 1)) + min;
}

function removeHomeDir(fullPath) {
        if (!fullPath || typeof fullPath !== "string")
                throw new Error('The first argument (fullPath) must be a string');
        while (fullPath.includes(process.cwd()))
                fullPath = fullPath.replace(process.cwd(), "");
        return fullPath;
}

function splitPage(arr, limit) {
        const allPage = _.chunk(arr, limit);
        return {
                totalPage: allPage.length,
                allPage
        };
}

async function translateAPI(text, lang) {
        try {
                const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
                return res.data[0][0][0];
        }
        catch (err) {
                throw new CustomError(err.response ? err.response.data : err);
        }
}

async function downloadFile(url = "", path = "") {
        if (!url || typeof url !== "string")
                throw new Error(`The first argument (url) must be a string`);
        if (!path || typeof path !== "string")
                throw new Error(`The second argument (path) must be a string`);
        let getFile;
        try {
                getFile = await axios.get(url, {
                        responseType: "arraybuffer"
                });
        }
        catch (err) {
                throw new CustomError(err.response ? err.response.data : err);
        }
        fs.writeFileSync(path, Buffer.from(getFile.data));
        return path;
}

async function findUid(link) {
        if (!link) throw new Error("Please provide a Facebook profile link or user ID.");
        const clean = String(link).trim();
        // 1. Direct numeric UID
        if (/^\d+$/.test(clean)) return clean;

        // 2. Direct regex extraction from URL (e.g. ?id=1000... or facebook.com/1000...)
        const directMatch = clean.match(/[?&]id=(\d+)/) || clean.match(/facebook\.com\/(?:profile\.php\?id=)?(\d+)/);
        if (directMatch && directMatch[1]) return directMatch[1];

        // 3. Try lookup via public lookup APIs
        try {
                const response = await axios.post(
                        'https://seomagnifier.com/fbid',
                        new URLSearchParams({
                                'facebook': '1',
                                'sitelink': clean
                        }),
                        {
                                headers: {
                                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                                },
                                timeout: 10000
                        }
                );
                const id = String(response.data).trim();
                if (/^\d+$/.test(id)) return id;
        } catch (_) {}

        try {
                const html = await axios.get(clean, {
                        headers: {
                                "User-Agent": "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
                        },
                        timeout: 10000
                });
                const $ = cheerio.load(html.data);
                const el = $('meta[property="al:android:url"]').attr('content');
                if (el) {
                        const number = el.split('/').pop();
                        if (/^\d+$/.test(number)) return number;
                }
                const entityMatch = html.data.match(/"entity_id":"(\d+)"/) || html.data.match(/"userID":"(\d+)"/);
                if (entityMatch && entityMatch[1]) return entityMatch[1];
        } catch (_) {}

        throw new Error("Could not resolve Facebook UID from this link.");
}

async function getStreamsFromAttachment(attachments) {
        const streams = [];
        for (const attachment of attachments) {
                const url = attachment.url;
                const ext = utils.getExtFromUrl(url);
                const fileName = `${utils.randomString(10)}.${ext}`;
                streams.push({
                        pending: axios({
                                url,
                                method: "GET",
                                responseType: "stream"
                        }),
                        fileName
                });
        }
        for (let i = 0; i < streams.length; i++) {
                const stream = await streams[i].pending;
                stream.data.path = streams[i].fileName;
                streams[i] = stream.data;
        }
        return streams;
}

async function getStreamFromURL(url = "", pathName = "", options = {}) {
        if (!options && typeof pathName === "object") {
                options = pathName;
                pathName = "";
        }
        if (!url || typeof url !== "string")
                throw new Error(`The first argument (url) must be a string`);
        const response = await axios({
                url,
                method: "GET",
                responseType: "stream",
                ...options
        });
        if (!pathName)
                pathName = utils.randomString(10) + (response.headers["content-type"] ? '.' + utils.getExtFromMimeType(response.headers["content-type"]) : ".noext");
        response.data.path = pathName;
        return response.data;
}

async function translate(text, lang) {
        if (typeof text !== "string")
                throw new Error(`The first argument (text) must be a string`);
        if (!lang)
                lang = 'en';
        if (typeof lang !== "string")
                throw new Error(`The second argument (lang) must be a string`);
        const wordTranslate = [''];
        const wordNoTranslate = [''];
        const wordTransAfter = [];
        let lastPosition = 'wordTranslate';

        if (word.indexOf(text.charAt(0)) == -1)
                wordTranslate.push('');
        else
                wordNoTranslate.splice(0, 1);

        for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (word.indexOf(char) !== -1) { // is word
                        const lengWordNoTranslate = wordNoTranslate.length - 1;
                        if (wordNoTranslate[lengWordNoTranslate] && wordNoTranslate[lengWordNoTranslate].includes('{') && !wordNoTranslate[lengWordNoTranslate].includes('}')) {
                                wordNoTranslate[lengWordNoTranslate] += char;
                                continue;
                        }
                        const lengWordTranslate = wordTranslate.length - 1;
                        if (lastPosition == 'wordTranslate') {
                                wordTranslate[lengWordTranslate] += char;
                        }
                        else {
                                wordTranslate.push(char);
                                lastPosition = 'wordTranslate';
                        }
                }
                else { // is no word
                        const lengWordNoTranslate = wordNoTranslate.length - 1;
                        const twoWordLast = wordNoTranslate[lengWordNoTranslate]?.slice(-2) || '';
                        if (lastPosition == 'wordNoTranslate') {
                                if (twoWordLast == '}}') {
                                        wordTranslate.push("");
                                        wordNoTranslate.push(char);
                                }
                                else
                                        wordNoTranslate[lengWordNoTranslate] += char;
                        }
                        else {
                                wordNoTranslate.push(char);
                                lastPosition = 'wordNoTranslate';
                        }
                }
        }

        for (let i = 0; i < wordTranslate.length; i++) {
                const text = wordTranslate[i];
                if (!text.match(/[^\s]+/))
                        wordTransAfter.push(text);
                else
                        wordTransAfter.push(utils.translateAPI(text, lang));
        }

        let output = '';

        for (let i = 0; i < wordTransAfter.length; i++) {
                let wordTrans = (await wordTransAfter[i]);
                if (wordTrans.trim().length === 0) {
                        output += wordTrans;
                        if (wordNoTranslate[i] != undefined)
                                output += wordNoTranslate[i];
                        continue;
                }

                wordTrans = wordTrans.trim();
                const numberStartSpace = lengthWhiteSpacesStartLine(wordTranslate[i]);
                const numberEndSpace = lengthWhiteSpacesEndLine(wordTranslate[i]);

                wordTrans = ' '.repeat(numberStartSpace) + wordTrans.trim() + ' '.repeat(numberEndSpace);

                output += wordTrans;
                if (wordNoTranslate[i] != undefined)
                        output += wordNoTranslate[i];
        }
        return output;
}

async function shortenURL(url) {
        try {
                const result = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                return result.data;
        }
        catch (err) {
                let error;
                if (err.response) {
                        error = new Error();
                        Object.assign(error, err.response.data);
                }
                else
                        error = new Error(err.message);
        }
}

async function uploadImgbb(file /* stream or image url */) {
        let type = "file";
        try {
                if (!file)
                        throw new Error('The first argument (file) must be a stream or a image url');
                if (regCheckURL.test(file) == true)
                        type = "url";
                if (
                        (type != "url" && (!(typeof file._read === 'function' && typeof file._readableState === 'object')))
                        || (type == "url" && !regCheckURL.test(file))
                )
                        throw new Error('The first argument (file) must be a stream or an image URL');

                const res_ = await axios({
                        method: 'GET',
                        url: 'https://imgbb.com'
                });

                const auth_token = res_.data.match(/auth_token="([^"]+)"/)[1];
                const timestamp = Date.now();

                const res = await axios({
                        method: 'POST',
                        url: 'https://imgbb.com/json',
                        headers: {
                                "content-type": "multipart/form-data"
                        },
                        data: {
                                source: file,
                                type: type,
                                action: 'upload',
                                timestamp: timestamp,
                                auth_token: auth_token
                        }
                });

                return res.data;
                // {
                //      "status_code": 200,
                //      "success": {
                //              "message": "image uploaded",
                //              "code": 200
                //      },
                //      "image": {
                //              "name": "Banner-Project-Goat-Bot",
                //              "extension": "png",
                //              "width": 2560,
                //              "height": 1440,
                //              "size": 194460,
                //              "time": 1688352855,
                //              "expiration": 0,
                //              "likes": 0,
                //              "description": null,
                //              "original_filename": "Banner Project Goat Bot.png",
                //              "is_animated": 0,
                //              "is_360": 0,
                //              "nsfw": 0,
                //              "id_encoded": "D1yzzdr",
                //              "size_formatted": "194.5 KB",
                //              "filename": "Banner-Project-Goat-Bot.png",
                //              "url": "https://i.ibb.co/wdXBBtc/Banner-Project-Goat-Bot.png",  // => this is url image
                //              "url_viewer": "https://ibb.co/D1yzzdr",
                //              "url_viewer_preview": "https://ibb.co/D1yzzdr",
                //              "url_viewer_thumb": "https://ibb.co/D1yzzdr",
                //              "image": {
                //                      "filename": "Banner-Project-Goat-Bot.png",
                //                      "name": "Banner-Project-Goat-Bot",
                //                      "mime": "image/png",
                //                      "extension": "png",
                //                      "url": "https://i.ibb.co/wdXBBtc/Banner-Project-Goat-Bot.png",
                //                      "size": 194460
                //              },
                //              "thumb": {
                //                      "filename": "Banner-Project-Goat-Bot.png",
                //                      "name": "Banner-Project-Goat-Bot",
                //                      "mime": "image/png",
                //                      "extension": "png",
                //                      "url": "https://i.ibb.co/D1yzzdr/Banner-Project-Goat-Bot.png"
                //              },
                //              "medium": {
                //                      "filename": "Banner-Project-Goat-Bot.png",
                //                      "name": "Banner-Project-Goat-Bot",
                //                      "mime": "image/png",
                //                      "extension": "png",
                //                      "url": "https://i.ibb.co/tHtQQRL/Banner-Project-Goat-Bot.png"
                //              },
                //              "display_url": "https://i.ibb.co/tHtQQRL/Banner-Project-Goat-Bot.png",
                //              "display_width": 2560,
                //              "display_height": 1440,
                //              "delete_url": "https://ibb.co/D1yzzdr/<TOKEN>",
                //              "views_label": "lượt xem",
                //              "likes_label": "thích",
                //              "how_long_ago": "mới đây",
                //              "date_fixed_peer": "2023-07-03 02:54:15",
                //              "title": "Banner-Project-Goat-Bot",
                //              "title_truncated": "Banner-Project-Goat-Bot",
                //              "title_truncated_html": "Banner-Project-Goat-Bot",
                //              "is_use_loader": false
                //      },
                //      "request": {
                //              "type": "file",
                //              "action": "upload",
                //              "timestamp": "1688352853967",
                //              "auth_token": "a2606b39536a05a81bef15558bb0d61f7253dccb"
                //      },
                //      "status_txt": "OK"
                // }
        }
        catch (err) {
                throw new CustomError(err.response ? err.response.data : err);
        }
}

async function uploadZippyshare(stream) {
        const res = await axios({
                method: 'POST',
                url: 'https://api.zippysha.re/upload',
                httpsAgent: agent,
                headers: {
                        'Content-Type': 'multipart/form-data'
                },
                data: {
                        file: stream
                }
        });

        const fullUrl = res.data.data.file.url.full;
        const res_ = await axios({
                method: 'GET',
                url: fullUrl,
                httpsAgent: agent,
                headers: {
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43"
                }
        });

        const downloadUrl = res_.data.match(/id="download-url"(?:.|\n)*?href="(.+?)"/)[1];
        res.data.data.file.url.download = downloadUrl;

        return res.data;
}

class GoatBotApis {
        constructor(apiKey) {
                this.apiKey = apiKey;
                const url = `https://goatbot.tk/api`;
                this.api = axios.create({
                        baseURL: url,
                        headers: {
                                "x-api-key": apiKey
                        }
                });

                // modify axios response
                this.api.interceptors.response.use((response) => {
                        return {
                                status: response.status,
                                statusText: response.statusText,
                                responseHeaders: {
                                        'x-remaining-requests': parseInt(response.headers['x-remaining-requests']),
                                        'x-free-remaining-requests': parseInt(response.headers['x-free-remaining-requests']),
                                        'x-used-requests': parseInt(response.headers['x-used-requests'])
                                },
                                data: response.data
                        };
                });

                // modify axios response error
                this.api.interceptors.response.use(undefined, async (error) => {
                        let responseDataError;
                        const promise = () => new Promise((resolveFunc) => {
                                // decode all response data to utf8 (string) if responseType is 
                                if (error.response.config.responseType === "arraybuffer") {
                                        responseDataError = Buffer.from(error.response.data, "binary").toString("utf8");
                                        resolveFunc();
                                }
                                else if (error.response.config.responseType === "stream") {
                                        let data = "";
                                        error.response.data.on("data", (chunk) => {
                                                data += chunk;
                                        });
                                        error.response.data.on("end", () => {
                                                responseDataError = data;
                                                resolveFunc();
                                        });
                                }
                                else {
                                        responseDataError = error.response.data;
                                        resolveFunc();
                                }
                        });

                        await promise();
                        try {
                                responseDataError = JSON.parse(responseDataError);
                        }
                        catch (err) { }
                        return Promise.reject({
                                status: error.response.status,
                                statusText: error.response.statusText,
                                responseHeaders: {
                                        'x-remaining-requests': parseInt(error.response.headers['x-remaining-requests']),
                                        'x-free-remaining-requests': parseInt(error.response.headers['x-free-remaining-requests']),
                                        'x-used-requests': parseInt(error.response.headers['x-used-requests'])
                                },
                                data: responseDataError
                        });
                });
        }

        isSetApiKey() {
                return this.apiKey && typeof this.apiKey === "string";
        }

        getApiKey() {
                return this.apiKey;
        }

        async getAccountInfo() {
                const { data } = await this.api.get("/info");
                return data;
        }
}

function extractImageUrlFromAttachment(att) {
        if (!att || typeof att !== "object") return null;
        return (
                att.url ||
                att.path ||
                att.largePreviewUrl ||
                att.large_preview_url ||
                att.previewUrl ||
                att.preview_url ||
                att.thumbnailUrl ||
                att.thumbnail_url ||
                att.image ||
                att.photoUrl ||
                att.image_data?.url ||
                att.media?.image?.uri ||
                att.story_attachment?.media?.image?.uri ||
                att.facebookUrl ||
                null
        );
}

function extractImageUrl(event, args = [], options = {}) {
        const { allowAvatar = false, fallbackSender = false } = (typeof options === "boolean" ? { allowAvatar: options } : options);
        
        // 1. Direct URL in args
        if (Array.isArray(args) && args.length > 0) {
                const urlArg = args.find(a => typeof a === "string" && /^https?:\/\//i.test(a.trim()));
                if (urlArg) return urlArg.trim();
        }

        // 2. Replied message attachments (highest priority when replying to any image in chat)
        if (event?.messageReply?.attachments?.length > 0) {
                for (const att of event.messageReply.attachments) {
                        const u = extractImageUrlFromAttachment(att);
                        if (u) return u;
                }
        }

        // 3. Current message attachments
        if (event?.attachments?.length > 0) {
                for (const att of event.attachments) {
                        const u = extractImageUrlFromAttachment(att);
                        if (u) return u;
                }
        }

        // 4. URL inside replied message body (e.g. user replied to a link or imgur URL)
        if (event?.messageReply?.body) {
                const match = event.messageReply.body.match(/https?:\/\/[^\s]+/i);
                if (match && /\.(jpe?g|png|webp|gif|bmp)(\?.*)?$/i.test(match[0])) {
                        return match[0];
                }
        }

        // 5. Mentioned user or sender avatar (ONLY when explicitly allowed)
        if (allowAvatar) {
                if (event?.mentions && Object.keys(event.mentions).length > 0) {
                        const uid = Object.keys(event.mentions)[0];
                        return `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(uid)}`;
                }
                if (event?.messageReply?.senderID) {
                        return `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(event.messageReply.senderID)}`;
                }
                if (fallbackSender && event?.senderID) {
                        return `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(event.senderID)}`;
                }
        }

        return null;
}

async function extractImageUrlAsync(event, args = [], api = null, options = {}) {
        let url = extractImageUrl(event, args, options);
        if (url) return url;

        if (api && typeof api.resolvePhotoUrl === "function") {
                const sources = [event?.messageReply?.attachments, event?.attachments];
                for (const list of sources) {
                        if (Array.isArray(list)) {
                                for (const att of list) {
                                        const photoId = att.ID || att.fbid || att.id;
                                        if (photoId) {
                                                try {
                                                        const resolved = await api.resolvePhotoUrl(photoId);
                                                        if (resolved && typeof resolved === "string" && /^https?:\/\//i.test(resolved)) {
                                                                return resolved;
                                                        }
                                                } catch (_) {}
                                        }
                                }
                        }
                }
        }

        return null;
}

function getMessageReply(event) {
        return (event && (event.messageReply || event.replyToMessage)) || null;
}

function getBase64FromUrl(url) {
        return new Promise((resolve, reject) => {
                const proto = url.startsWith("https") ? https : http;
                proto.get(url, (res) => {
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                                return resolve(getBase64FromUrl(res.headers.location));
                        }
                        const chunks = [];
                        res.on("data", (chunk) => chunks.push(chunk));
                        res.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
                        res.on("error", reject);
                }).on("error", reject);
        });
}

function extFromMime(mime) {
        if (!mime) return "bin";
        const map = {
                "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
                "video/mp4": "mp4", "video/webm": "webm",
                "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3",
                "application/pdf": "pdf",
        };
        return map[mime.split(";")[0].trim()] || "bin";
}

async function getAttachmentStream({ event, type, url, api } = {}) {
        const replied = getMessageReply(event);
        if (replied && replied.attachments) {
                const filter = type ? [type] : ["image", "photo", "video", "audio", "ptt", "document", "sticker"];
                const att = replied.attachments.find(a => filter.includes(a.type));
                if (att && att.url) {
                        const stream = await getStreamFromURL(att.url);
                        return { stream, mimetype: att.mimetype || "application/octet-stream", ext: extFromMime(att.mimetype) };
                }
                if (att && att.path && fs.existsSync(att.path)) {
                        const stream = fs.createReadStream(att.path);
                        return { stream, mimetype: att.mimetype || "application/octet-stream", ext: extFromMime(att.mimetype) };
                }
                if (att && (api?.downloadMedia || global.floppaWca?.downloadMedia)) {
                        try {
                                const downloader = api?.downloadMedia || global.floppaWca?.downloadMedia;
                                const buf = await downloader(replied.raw || replied);
                                const stream = Readable.from(buf);
                                return { stream, mimetype: att.mimetype || "application/octet-stream", ext: extFromMime(att.mimetype) };
                        } catch (_) {}
                }
        }
        if (event && event.attachments && event.attachments.length > 0) {
                const filter = type ? [type] : ["image", "photo", "video", "audio", "ptt", "document", "sticker"];
                const att = event.attachments.find(a => filter.includes(a.type));
                if (att && att.url) {
                        const stream = await getStreamFromURL(att.url);
                        return { stream, mimetype: att.mimetype || "application/octet-stream", ext: extFromMime(att.mimetype) };
                }
                if (att && att.path && fs.existsSync(att.path)) {
                        const stream = fs.createReadStream(att.path);
                        return { stream, mimetype: att.mimetype || "application/octet-stream", ext: extFromMime(att.mimetype) };
                }
        }
        if (url) {
                const stream = await getStreamFromURL(url);
                return { stream, mimetype: "application/octet-stream", ext: "bin" };
        }
        return null;
}

function getTargetUser(event, args = []) {
        const replied = getMessageReply(event);
        if (event?.mentions) {
                if (Array.isArray(event.mentions) && event.mentions.length > 0) {
                        return event.mentions[0];
                }
                if (typeof event.mentions === 'object' && Object.keys(event.mentions).length > 0) {
                        return Object.keys(event.mentions)[0];
                }
        }
        if (replied && (replied.senderID || replied.sender || replied.userID)) {
                return replied.senderID || replied.sender || replied.userID;
        }
        if (args && args[0]) {
                const candidate = String(args[0]).replace('@', '').trim();
                if (/^\d{7,}$/.test(candidate)) return candidate + '@s.whatsapp.net';
                if (candidate.includes('@s.whatsapp.net') || candidate.includes('@g.us')) return candidate;
        }
        return event?.senderID || event?.sender || '';
}

async function getAvatar(api, uid) {
        try {
                const targetApi = api || global.floppaWca || global.wcaApi || global.api || global.ST?.api;
                if (targetApi && typeof targetApi.getProfilePicture === 'function') {
                        return await targetApi.getProfilePicture(uid);
                }
        } catch (_) {}
        return null;
}

function normalizeContent(msgOrObj) {
        if (typeof msgOrObj === "string") return { body: msgOrObj };
        if (msgOrObj && typeof msgOrObj === "object") {
                if (msgOrObj.body || msgOrObj.text || msgOrObj.attachment || msgOrObj.location || msgOrObj.sticker) {
                        return msgOrObj;
                }
        }
        return msgOrObj || { body: "" };
}

function buildMessage(api, event) {
        const threadID = event?.threadID || event?.chat;
        const rawMsg = event?.raw || null;

        return {
                async reply(msgOrObj, cb) {
                        const content = normalizeContent(msgOrObj);
                        const opts = rawMsg ? { replyToMessage: rawMsg } : {};
                        const targetApi = api || global.floppaWca || global.wcaApi || global.api;
                        const sent = await targetApi.sendMessage(content, threadID, opts).catch((e) => { if (cb) cb(e, null); throw e; });

                        const info = {
                                messageID: sent?.key?.id || sent?.id || (Array.isArray(sent) && sent[0]?.key?.id) || null,
                                threadID,
                                sent,
                        };

                        if (typeof cb === "function") cb(null, info);
                        return info;
                },

                async send(msgOrObj, tid, cb) {
                        if (typeof tid === "function") { cb = tid; tid = null; }
                        tid = tid || threadID;
                        const content = normalizeContent(msgOrObj);
                        const targetApi = api || global.floppaWca || global.wcaApi || global.api;
                        const sent = await targetApi.sendMessage(content, tid).catch((e) => { if (cb) cb(e, null); throw e; });
                        const info = { messageID: sent?.key?.id || null, threadID: tid, sent };
                        if (typeof cb === "function") cb(null, info);
                        return info;
                },

                async react(emoji, msgID) {
                        try {
                                const targetID = msgID || event?.messageID;
                                const key = { remoteJid: threadID, id: targetID, fromMe: false };
                                const targetApi = api || global.floppaWca || global.wcaApi || global.api;
                                return await targetApi.reactToMessage(threadID, key, emoji);
                        } catch (_) {}
                },

                async unsend(msgID) {
                        try {
                                const id = msgID || event?.messageID;
                                const key = { remoteJid: threadID, id, fromMe: true };
                                const targetApi = api || global.floppaWca || global.wcaApi || global.api;
                                return await targetApi.deleteMessage(threadID, key, true);
                        } catch (_) {}
                },

                async edit(msgID, newText) {
                        try {
                                const targetApi = api || global.floppaWca || global.wcaApi || global.api;
                                return await targetApi.editMessage(threadID, msgID, newText);
                        } catch (_) {}
                },

                async typing(tid) {
                        try {
                                const targetApi = api || global.floppaWca || global.wcaApi || global.api;
                                return await targetApi.sendTypingIndicator(tid || threadID, 3000);
                        } catch (_) {}
                },
        };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function ensureDir(dir) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function jidToPhone(jid) {
        if (!jid) return "";
        return String(jid).split("@")[0].split(":")[0];
}

function humanDuration(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
        if (m > 0) return `${m}m ${s % 60}s`;
        return `${s}s`;
}

async function resolveUserDisplayName(api, uid, userData) {
        const raw = String(uid || "");
        if (!raw) return "";

        const bare = raw.split(":")[0].split("@")[0];
        const candidates = Array.from(new Set([
                raw,
                bare,
                bare ? bare + "@s.whatsapp.net" : "",
                bare ? bare + "@lid" : "",
        ].filter(Boolean)));

        const getUser = userData || (global.ST && global.ST.DB && global.ST.DB.userData) || (global.userData);
        if (typeof getUser === "function") {
                for (const key of candidates) {
                        try {
                                const u = await getUser(key);
                                if (u && u.name && u.name !== "Unknown") return u.name;
                        } catch (_) {}
                }
        } else if (getUser && typeof getUser.getName === "function") {
                try {
                        const name = await getUser.getName(bare);
                        if (name && name !== "Unknown User") return name;
                } catch (_) {}
        }

        const sock = (api && api.sock) || (global.ST && global.ST.api && global.ST.api.sock) || (global.floppaWca && global.floppaWca.sock);
        const contacts = (sock && (sock.contacts || (sock.store && sock.store.contacts))) || {};
        for (const key of candidates) {
                const contact = contacts[key];
                const name = contact?.name || contact?.notify || contact?.verifiedName || contact?.pushName;
                if (name) return name;
        }
        for (const [contactJid, contact] of Object.entries(contacts)) {
                if (
                        contactJid === raw ||
                        contactJid === bare ||
                        contactJid.split(":")[0].split("@")[0] === bare ||
                        contact?.id === raw ||
                        contact?.lid === raw
                ) {
                        const name = contact?.name || contact?.notify || contact?.verifiedName || contact?.pushName;
                        if (name) return name;
                }
        }

        return bare || raw;
}

const utils = {
        CustomError,
        TaskQueue,
        extractImageUrl,
        extractImageUrlAsync,
        extractImageUrlFromAttachment,
        extractImageUrlFromEvent: extractImageUrl,

        colors,
        convertTime,
        createOraDots,
        defaultStderrClearLine,
        enableStderrClearLine,
        formatNumber,
        getExtFromAttachmentType,
        getExtFromMimeType,
        getExtFromUrl,
        getPrefix,
        getText: require("./languages/makeFuncGetLangs.js"),
        getTime,
        getType,
        compareVersion,
        isHexColor,
        isNumber,
        jsonStringifyColor,
        loading: require("./logger/loading.js"),
        log,
        logColor: require("./logger/logColor.js"),
        eventLogger: require("./logger/eventLogger.js"),
        message,
        randomString,
        randomNumber,
        removeHomeDir,
        splitPage,
        translateAPI,
        // async functions
        downloadFile,
        findUid,
        getStreamsFromAttachment,
        getStreamFromURL,
        getStreamFromUrl: getStreamFromURL,
        getBase64FromUrl,
        getMessageReply,
        extFromMime,
        getAttachmentStream,
        getTargetUser,
        getAvatar,
        buildMessage,
        normalizeContent,
        sleep,
        ensureDir,
        jidToPhone,
        humanDuration,
        resolveUserDisplayName,
        Prism,
        translate,
        shortenURL,
        uploadZippyshare,
        uploadImgbb,
        getAvatarUrl: require("./func/canvasHelper.js").getAvatarUrl,
        fetchAvatarBuffer: require("./func/canvasHelper.js").fetchAvatarBuffer,

        GoatBotApis,
        sendMessageToUser: async (api, targetUID, form, callback) => {
            if (typeof api?.sendMessageToUser === 'function') {
                return await api.sendMessageToUser(form, targetUID, callback);
            }
            return await api.sendMessage(form, targetUID, callback, undefined, false);
        },
        sendDM: async (api, targetUID, form, options = {}) => {
            let pMgr = global.privateThreadManager;
            if (!pMgr) {
                try { pMgr = require(require("path").join(process.cwd(), "func/privateThreadManager")); } catch (_) {}
            }
            if (pMgr) {
                return await pMgr.sendDM(api, targetUID, form, options);
            }
            return await api.sendMessage(form, targetUID, options.callback, undefined, false);
        },
        privateThreadManager: require("./func/privateThreadManager.js"),
        parseCookies: (c) => Array.isArray(c) ? c : [],
        parseUniversalCookies: (c) => Array.isArray(c) ? c : [],
        ...require("./func")
};

// Direct globals for zero-import script compatibility
if (typeof global.getTargetUser === 'undefined') global.getTargetUser = getTargetUser;
if (typeof global.getMessageReply === 'undefined') global.getMessageReply = getMessageReply;
if (typeof global.resolveUserDisplayName === 'undefined') global.resolveUserDisplayName = resolveUserDisplayName;
if (typeof global.jidToPhone === 'undefined') global.jidToPhone = jidToPhone;
if (typeof global.getAvatar === 'undefined') global.getAvatar = getAvatar;
if (typeof global.buildMessage === 'undefined') global.buildMessage = buildMessage;
if (typeof global.getStreamFromUrl === 'undefined') global.getStreamFromUrl = getStreamFromURL;
if (typeof global.getBase64FromUrl === 'undefined') global.getBase64FromUrl = getBase64FromUrl;
if (typeof global.downloadFile === 'undefined') global.downloadFile = downloadFile;
if (typeof global.getAttachmentStream === 'undefined') global.getAttachmentStream = getAttachmentStream;
if (typeof global.humanDuration === 'undefined') global.humanDuration = humanDuration;
if (typeof global.sleep === 'undefined') global.sleep = sleep;
if (typeof global.ensureDir === 'undefined') global.ensureDir = ensureDir;
if (typeof global.normalizeContent === 'undefined') global.normalizeContent = normalizeContent;
if (typeof global.extFromMime === 'undefined') global.extFromMime = extFromMime;
if (typeof global.extractImageUrl === 'undefined') global.extractImageUrl = extractImageUrl;
if (typeof global.extractImageUrlAsync === 'undefined') global.extractImageUrlAsync = extractImageUrlAsync;

global.utils = utils;
module.exports = utils;
