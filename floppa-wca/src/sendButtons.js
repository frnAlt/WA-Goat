"use strict";

const utils = require("../utils");

/**
 * api.sendButtons(threadID, body, buttons, options)
 *
 * @param {string}   threadID
 * @param {string}   body       Main text
 * @param {Array}    buttons    Array of { id, text } or { buttonId, displayText }
 * @param {object}   [options]  { footer, header, image, video }
 *
 * Example:
 *   api.sendButtons("628xxx@s.whatsapp.net", "Choose an option:", [
 *     { id: "btn1", text: "Option 1" },
 *     { id: "btn2", text: "Option 2" },
 *   ], { footer: "Powered by WCA" });
 */
function sendButtonsFactory(sock, api, ctx) {
    return async function sendButtons(threadID, body, buttons, options) {
        options = options || {};
        const jid = utils.formatJID(threadID);

        const btns = (buttons || []).map((b, i) => ({
            buttonId:   String(b.id || b.buttonId || String(i + 1)),
            buttonText: { displayText: String(b.text || b.displayText || b.title || "") },
            type:       1,
        }));

        const msg = {
            text:       body || "",
            footer:     options.footer || "",
            buttons:    btns,
            headerType: 1,
        };

        if (options.image) msg.image = options.image.url ? { url: options.image.url } : options.image;
        if (options.video) msg.video = options.video.url ? { url: options.video.url } : options.video;

        return sock.sendMessage(jid, msg);
    };
}

/**
 * api.sendList(threadID, title, buttonText, sections, options)
 *
 * @param {string}   threadID
 * @param {string}   title       List header title
 * @param {string}   buttonText  Text on the open-list button
 * @param {Array}    sections    [{ title, rows: [{ id, title, description }] }]
 * @param {object}   [options]   { body, footer }
 *
 * Example:
 *   api.sendList("628xxx@s.whatsapp.net", "Menu", "View options", [
 *     {
 *       title: "Main Menu",
 *       rows: [
 *         { id: "item1", title: "Item 1", description: "First item" },
 *         { id: "item2", title: "Item 2", description: "Second item" },
 *       ]
 *     }
 *   ], { footer: "WCA Bot" });
 */
function sendListFactory(sock, api, ctx) {
    return async function sendList(threadID, title, buttonText, sections, options) {
        options = options || {};
        const jid = utils.formatJID(threadID);

        const rows = [];
        for (const sec of (sections || [])) {
            for (const row of (sec.rows || [])) {
                rows.push({
                    title:       row.title || "",
                    rowId:       row.id || row.rowId || String(rows.length + 1),
                    description: row.description || "",
                });
            }
        }

        return sock.sendMessage(jid, {
            text:       options.body || title || "",
            footer:     options.footer || "",
            title:      title || "",
            buttonText: buttonText || "Open",
            sections:   (sections || []).map((sec) => ({
                title: sec.title || "",
                rows:  (sec.rows || []).map((r) => ({
                    title:       r.title || "",
                    rowId:       r.id || r.rowId || "",
                    description: r.description || "",
                })),
            })),
        });
    };
}

/**
 * api.sendTemplate(threadID, body, footer, templateButtons)
 *
 * templateButtons can be:
 *   - Quick reply:  { index, quickReply: { displayText, id } }
 *   - URL button:   { index, urlButton:  { displayText, url } }
 *   - Call button:  { index, callButton: { displayText, phoneNumber } }
 *
 * Example:
 *   api.sendTemplate("628xxx@s.whatsapp.net", "Check this out!", "WCA", [
 *     { index: 1, urlButton:  { displayText: "Visit", url: "https://github.com/frnAlt" } },
 *     { index: 2, callButton: { displayText: "Call", phoneNumber: "+8801xxxxxxxxx" } },
 *     { index: 3, quickReply: { displayText: "Yes!", id: "yes" } },
 *   ]);
 */
function sendTemplateFactory(sock, api, ctx) {
    return async function sendTemplate(threadID, body, footer, templateButtons) {
        const jid = utils.formatJID(threadID);
        return sock.sendMessage(jid, {
            text:            body || "",
            footer:          footer || "",
            templateButtons: templateButtons || [],
        });
    };
}

module.exports = function (sock, api, ctx) {
    return {
        sendButtons:  sendButtonsFactory(sock, api, ctx),
        sendList:     sendListFactory(sock, api, ctx),
        sendTemplate: sendTemplateFactory(sock, api, ctx),
    };
};
