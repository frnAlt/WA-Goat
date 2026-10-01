# 📱 WCA (WhatsApp Chat API) Developer Reference

The **WCA** library ([floppa-wca](floppa-wca/README.md)) is an FCA-style WhatsApp client API built on top of Baileys. It provides the standard callback-driven and Promise-compatible interface made famous by Facebook Messenger bots (such as GoatBot V2 and Floppa-Chatbot).

---

## 📑 Table of Contents

1. [Initialization](#1-initialization)
2. [Messaging API](#2-messaging-api)
3. [Media API](#3-media-api)
4. [Interactive Components](#4-interactive-components)
5. [Group Administration API](#5-group-administration-api)
6. [User Profile & Contacts](#6-user-profile--contacts)
7. [Presence & Read Receipts](#7-presence--read-receipts)
8. [Event Listener (listen / listenMqtt)](#8-event-listener)
9. [FCA to WCA Migration Guide](#9-fca-to-wca-migration-guide)

---

## 1. Initialization

### Method A: Standalone WCA Engine
```javascript
const wca = require("floppa-wca"); // or require("./floppa-wca")

wca({
  authFolder: "./auth",
  phoneNumber: "12345678901",
  usePairingCode: true,
  globalOptions: {
    selfListen: false,
    listenEvents: true,
    autoReconnect: true
  }
}, (err, api) => {
  if (err) return console.error("WCA Connection Failed:", err);
  console.log("Connected as:", api.getCurrentUserID());

  api.listen((err, event) => {
    if (err) return;
    if (event.body === "ping") {
      api.sendMessage("pong!", event.threadID);
    }
  });
});
```

### Method B: Attach WCA to Existing Baileys Socket
```javascript
const { buildAPI } = require("./floppa-wca");

const api = buildAPI(sock, {
  selfID: sock.user?.id,
  sock,
  globalOptions: { autoReconnect: true }
});
```

---

## 2. Messaging API

### `api.sendMessage(msg, threadID, [callback], [options])`

#### A. Plain String Message
```javascript
await api.sendMessage("Hello WhatsApp!", threadID);
```

#### B. Message with Quoted Reply
```javascript
await api.sendMessage({
  body: "This is a reply to your message",
  replyToMessage: event.raw // Or raw Baileys message key
}, threadID);
```

#### C. Message with User Mentions
```javascript
await api.sendMessage({
  body: "Hello @user!",
  mentions: ["8801712345678@s.whatsapp.net"]
}, threadID);
```

#### D. Message with Single Attachment
```javascript
await api.sendMessage({
  body: "Photo caption",
  attachment: {
    type: "image", // "image" | "video" | "audio" | "document" | "sticker"
    url: "https://example.com/image.jpg"
  }
}, threadID);
```

#### E. Message with Multiple Attachments (Promise.all)
```javascript
await api.sendMessage({
  body: "Gallery",
  attachment: [
    { type: "image", url: "https://example.com/1.jpg" },
    { type: "image", url: "https://example.com/2.jpg" }
  ]
}, threadID);
```

### Message Editing & Deletion
```javascript
// Edit a previously sent message
await api.editMessage("Updated text content", messageID, threadID);

// Unsend / delete a message
await api.deleteMessage(messageID, threadID);

// Pin a message in chat
await api.pinMessage(messageID, threadID, 86400); // Duration in seconds
await api.unpinMessage(messageID, threadID);

// React with emoji
await api.reactToMessage("🔥", messageID, threadID);
```

---

## 3. Media API

Dedicated convenience helpers for media sending:

```javascript
// Image
await api.sendImage("https://example.com/photo.jpg", threadID, "Caption text");

// Video
await api.sendVideo("https://example.com/clip.mp4", threadID, "Video caption");

// Audio / Voice Note (PTT)
await api.sendAudio("https://example.com/track.mp3", threadID);
await api.sendPTT("https://example.com/voicenote.ogg", threadID);

// Document / File
await api.sendDocument("https://example.com/file.pdf", threadID, "Report.pdf");

// WebP Sticker
await api.sendSticker("https://example.com/sticker.webp", threadID);
```

---

## 4. Interactive Components

```javascript
// Send interactive buttons
await api.sendButtons({
  body: "Please choose an option:",
  buttons: [
    { buttonId: "btn_yes", buttonText: { displayText: "Yes" } },
    { buttonId: "btn_no", buttonText: { displayText: "No" } }
  ]
}, threadID);

// Send Poll
await api.sendPoll({
  name: "What is your favorite language?",
  values: ["JavaScript", "Python", "Rust", "Go"],
  selectableCount: 1
}, threadID);

// Send Location
await api.sendLocation({
  latitude: 23.8103,
  longitude: 90.4125,
  name: "Dhaka, Bangladesh"
}, threadID);
```

---

## 5. Group Administration API

```javascript
// Fetch detailed group metadata
const info = await api.getGroupInfo(threadID);
console.log("Subject:", info.subject);
console.log("Participants:", info.participants.length);

// Get list of group admins
const admins = await api.getGroupAdmins(threadID);

// Add member to group
await api.addUserToGroup(["8801712345678@s.whatsapp.net"], threadID);

// Remove member from group
await api.kickUser(["8801712345678@s.whatsapp.net"], threadID);

// Promote / Demote group admin
await api.promoteAdmin(["8801712345678@s.whatsapp.net"], threadID);
await api.demoteAdmin(["8801712345678@s.whatsapp.net"], threadID);

// Change group subject & description
await api.changeGroupSubject("New Group Name", threadID);
await api.changeGroupDescription("Updated group rules...", threadID);

// Group Invite Link
const link = await api.getGroupInviteLink(threadID);
console.log("Join link:", link);

// Leave group
await api.leaveGroup(threadID);
```

---

## 6. User Profile & Contacts

```javascript
// Get user info and profile name
const userInfo = await api.getUserInfo("8801712345678@s.whatsapp.net");

// Get profile picture URL
const pfpUrl = await api.getProfilePicture("8801712345678@s.whatsapp.net");

// Update bot profile
await api.updateProfileName("Goat Bot V2 🐐");
await api.updateProfileStatus("Online and ready!");
await api.updateProfilePicture("./assets/avatar.jpg");

// Block / Unblock contact
await api.blockContact("8801712345678@s.whatsapp.net");
await api.unblockContact("8801712345678@s.whatsapp.net");
```

---

## 7. Presence & Read Receipts

```javascript
// Send typing indicator (composing)
await api.sendTypingIndicator(true, threadID);

// Stop typing indicator
await api.sendTypingIndicator(false, threadID);

// Send read receipt (blue tick)
await api.markAsRead(messageKey, threadID);
```

---

## 8. Event Listener

`api.listen` (or `api.listenMqtt`) listens to all WhatsApp messages and system events:

```javascript
api.listen((err, event) => {
  if (err) return;

  switch (event.type) {
    case "message":
    case "message_reply":
      console.log(`[MSG] ${event.senderID}: ${event.body}`);
      break;

    case "event":
      console.log(`[EVENT] ${event.logMessageType} in ${event.threadID}`);
      break;

    case "change_thread_image":
      console.log("Thread avatar changed:", event.threadID);
      break;
  }
});
```

---

## 9. FCA to WCA Migration Guide

If you are porting commands from Facebook Messenger FCA to WhatsApp WCA:

| FCA Pattern | WCA Equivalent |
| :--- | :--- |
| `api.sendMessage(msg, threadID, callback)` | Identical signature supported! |
| `api.setMessageReaction(emoji, mid)` | `api.reactToMessage(emoji, mid, threadID)` |
| `api.unsendMessage(mid)` | `api.deleteMessage(mid, threadID)` |
| `api.removeUserFromGroup(uid, tid)` | `api.kickUser(uid, tid)` |
| `api.addUserToGroup(uid, tid)` | `api.addUserToGroup(uid, tid)` |
| `api.changeGroupImage(stream, tid)` | Supported via Baileys socket (`api.sock.updateProfilePicture`) |
| `api.getThreadInfo(tid)` | `api.getGroupInfo(tid)` |
| `event.senderID` | Fully normalized phone number or WhatsApp JID |
| `event.threadID` | Group JID (`...-...@g.us`) or DM JID (`...@s.whatsapp.net`) |
