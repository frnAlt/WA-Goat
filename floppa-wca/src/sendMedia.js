"use strict";

const utils = require("../utils");

module.exports = function (sock, api, ctx) {
    async function sendMedia(mediaType, media, threadID, caption, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        if (typeof callback !== "function") callback = function () {};
        options = options || {};

        try {
            const jid = utils.formatJID(threadID);
            let content = {};

            const mediaSource =
                typeof media === "string"
                    ? { url: media }
                    : media && typeof media.pipe === "function"
                        ? { stream: media }
                        : media && media.path
                            ? { url: media.path }
                            : media && media.stream
                                ? { stream: media.stream }
                                : media;

            switch (mediaType) {
                case "image":
                    content = {
                        image: mediaSource,
                        caption: caption || "",
                        mimetype: options.mimetype || "image/jpeg",
                    };
                    break;
                case "video":
                    content = {
                        video: mediaSource,
                        caption: caption || "",
                        mimetype: options.mimetype || "video/mp4",
                        seconds: options.seconds,
                    };
                    break;
                case "audio":
                    content = {
                        audio: mediaSource,
                        mimetype: options.mimetype || "audio/mpeg",
                        ptt: options.ptt || false,
                        seconds: options.seconds,
                    };
                    break;
                case "ptt":
                    content = {
                        audio: mediaSource,
                        mimetype: options.mimetype || "audio/ogg; codecs=opus",
                        ptt: true,
                        seconds: options.seconds,
                    };
                    break;
                case "document":
                    content = {
                        document: mediaSource,
                        mimetype: options.mimetype || "application/octet-stream",
                        fileName: options.filename || options.name || "file",
                        caption: caption || "",
                    };
                    break;
                case "sticker":
                    content = {
                        sticker: mediaSource,
                        mimetype: "image/webp",
                        isAnimated: options.isAnimated || false,
                    };
                    break;
                case "gif":
                    content = {
                        video: mediaSource,
                        gifPlayback: true,
                        caption: caption || "",
                        mimetype: options.mimetype || "video/mp4",
                    };
                    break;
                default:
                    throw new Error("Unknown media type: " + mediaType);
            }

            const sendOptions = {};
            if (options.quoted) sendOptions.quoted = options.quoted;
            if (options.replyToMessage) {
                sendOptions.quoted = {
                    key: { id: options.replyToMessage, remoteJid: jid },
                };
            }

            const result = await sock.sendMessage(jid, content, sendOptions);
            callback(null, result);
            return result;
        } catch (err) {
            callback(err, null);
            throw err;
        }
    }

    return {
        sendImage: (url, threadID, caption, options, callback) =>
            sendMedia("image", url, threadID, caption, options, callback),
        sendVideo: (url, threadID, caption, options, callback) =>
            sendMedia("video", url, threadID, caption, options, callback),
        sendAudio: (url, threadID, options, callback) =>
            sendMedia("audio", url, threadID, null, options, callback),
        sendPTT: (url, threadID, options, callback) =>
            sendMedia("ptt", url, threadID, null, options, callback),
        sendDocument: (url, threadID, caption, options, callback) =>
            sendMedia("document", url, threadID, caption, options, callback),
        sendSticker: (url, threadID, options, callback) =>
            sendMedia("sticker", url, threadID, null, options, callback),
        sendGif: (url, threadID, caption, options, callback) =>
            sendMedia("gif", url, threadID, caption, options, callback),
        sendMedia,
    };
};
