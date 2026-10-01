
<div align="center">

# WA-GOAT (FLOPPA-CHATBOT WHATSAPP EDITION)
### *Next-Gen Autonomous WhatsApp Multi-Agent Microservice Engine with WCA & Web Dashboard*

[![Node.js Engine](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![WCA Core](https://img.shields.io/badge/WCA%20Client-floppa--wca%20v1.1.1-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](floppa-wca/README.md)
[![Baileys Socket](https://img.shields.io/badge/Baileys%20Socket-v7.0.0--rc14-00f2fe?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Web Dashboard](https://img.shields.io/badge/Web%20Dashboard-Active%20%28Port%205000%29-ff6b6b?style=for-the-badge&logo=express&logoColor=white)](DASHBOARD.md)
[![Test Suite](https://img.shields.io/badge/Tests-36%2F36%20Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](tests/)
[![Commands](https://img.shields.io/badge/Commands-290%2B%20Loaded-blueviolet?style=for-the-badge)](#-command-matrix--ecosystem)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br>

**[WCA API Suite](#-wca-whatsapp-chat-api-engine)** •
**[Web Dashboard](#-interactive-web-dashboard--live-stream)** •
**[Group & DM Engine](#-group-and-private-dm-engine)** •
**[Command Matrix](#-command-matrix--ecosystem)** •
**[Runners & Multi-Entrypoints](#-multi-runner-ecosystem)** •
**[Deployment & 24/7 Hosting](#-deployment--247-hosting)** •
**[Documentation Guides](#-documentation--guides)**

---

</div>

## 🌟 Overview

**WA-Goat** is a production-grade WhatsApp bot ecosystem combining the best of:
1. **[Floppa-WCA (WhatsApp Chat API)](floppa-wca/README.md)**: FCA-style WhatsApp client API built on Baileys, providing standard Messenger/GoatBot callback APIs (`sendMessage`, `sendMedia`, `getGroupInfo`, `listenMqtt`, etc.).
2. **[Stock Goat Bot V2 & Floppa-Chatbot](https://github.com/lazyneoaz/Goatbot-V2)**: Modular command dispatching, multi-tier permissions, economy tier, thread/user storage controllers, anti-spam, and 290+ commands.
3. **[Interactive Web Dashboard](DASHBOARD.md)**: Web administration dashboard with live SSE log streaming, FS explorer / STAI file manager, system telemetry, and password-protected access.
4. **ST Bot Ecosystem**: Support for ST bot architecture, direct globals, and multiple execution entrypoints (`npm start`, `npm run st`, `npm run goat`, `npm run floppa`).

---

## ⚡ WCA (WhatsApp Chat API) Engine

WA-Goat incorporates the complete **Floppa-WCA** suite, bringing the beloved FCA (Facebook Chat API) developer experience directly to WhatsApp:

```javascript
// Native FCA/WCA signature in any GoatBot module
module.exports = {
  config: {
    name: "ping",
    version: "1.0.0",
    role: 0,
    category: "utility"
  },
  onStart: async function ({ api, message, event, args, usersData, threadsData }) {
    // String message
    await api.sendMessage("Pong! 🏓", event.threadID);

    // Rich media with attachment
    await api.sendMessage({
      body: "Here is your media:",
      attachment: { type: "image", url: "https://example.com/photo.jpg" }
    }, event.threadID);

    // React with emoji
    await api.reactToMessage("🔥", event.messageID, event.threadID);
  }
};
```

### Supported WCA Methods
| Category | Methods |
| :--- | :--- |
| **Messaging** | `sendMessage`, `sendMedia`, `sendImage`, `sendVideo`, `sendAudio`, `sendPTT`, `sendDocument`, `sendSticker`, `sendGif`, `reactToMessage`, `deleteMessage`, `editMessage`, `pinMessage`, `unpinMessage` |
| **Interactive** | `sendButtons`, `sendList`, `sendTemplate`, `sendPoll`, `sendLocation` |
| **Group Administration** | `getGroupInfo`, `getAllGroups`, `getGroupAdmins`, `getGroupInviteLink`, `createGroup`, `leaveGroup`, `addUserToGroup`, `kickUser`, `removeUserFromGroup`, `promoteAdmin`, `demoteAdmin`, `changeGroupSubject`, `changeGroupDescription`, `groupSettingUpdate`, `groupRevokeInvite`, `groupAcceptInvite` |
| **Profile & Contacts** | `getUserInfo`, `getDMInfo`, `getContacts`, `getChats`, `getProfilePicture`, `updateProfileName`, `updateProfilePicture`, `updateProfileStatus`, `blockContact`, `unblockContact` |
| **Presence & Status** | `sendTypingIndicator`, `sendPresenceUpdate`, `sendReadReceipt`, `markAsRead`, `fetchStatus` |
| **Event Stream** | `listen`, `listenMqtt`, `getAppState` |

See **[WCA Reference Documentation](WCA.md)** for detailed parameters and code samples.

---

## 💻 Interactive Web Dashboard & Live Stream

WA-Goat features a web dashboard for monitoring, administration, and code management:

```
http://localhost:5000
```

### Key Features
* 📺 **Live SSE Console Stream**: Streams terminal logs in real-time to your browser without page refresh.
* 📁 **STAI File System Explorer**: Inspect project files, edit configurations, and manage scripts directly from the browser.
* 🔐 **Optional Password Protection**: Secure the web UI with configurable password authentication.
* 📊 **Live System Telemetry**: CPU, RSS memory, process uptime, registered commands, and event counters.
* ☁️ **Vercel Serverless Ready**: Integrated via `api/index.js` for zero-configuration serverless deployment.

See **[Dashboard Guide](DASHBOARD.md)** for complete configuration options.

---

## 💬 Group and Private DM Engine

* **Universal Command Execution**: Commands run with zero friction in **both Group chats and 1-on-1 Direct Messages (DMs)**.
* **Intelligent Moderation Safeguard**: Purely administrative actions (`kick`, `promote`, `demote`, `mute`, `tagall`) verify group context gracefully without crashing.
* **No-Prefix Command Recognition**: When users send commands (like `help`, `ping`, `sticker`, `daily`) in DMs or groups, the router auto-matches without requiring manual prefix typing.
* **Automatic Chatbot Fallback**: In private chats, conversational queries automatically invoke the multi-LLM AI companion.

---

## 📖 Iconic GoatBot V2 Help Format

Precisely matches the iconic GoatBot V2 format:

```text
☠️ Goat Bot V2 ☠️

╭─『 ADMIN 』
│ antibadword • antilink • chatbot • demote • goodbye • groupdesc • groupinfo • groupname • hidetag • kick • link • mute • promote • resetwarn • revoke • tagall • unmute • warn • warnings • welcome
╰───────────────♢

╭─『 AI 』
│ ai • character • gemini • gpt • translate
╰───────────────♢

╭─『 ECONOMY 』
│ balance • bank • coinflip • daily • dice • pay • slot • work
╰───────────────♢

╭─『 FUN 』
│ compliment • dare • dice • eightball • fact • insult • joke • meme • quote • ship • tictactoe • truth
╰───────────────♢

╭─『 MEDIA 』
│ attp • blur • crop • simage • sticker • take • ttp
╰───────────────♢

╭─『 OWNER 』
│ admin • anticall • autoread • autostatus • autotyping • ban • banchat • broadcast • cleartemp • eval • exec • restart • setprefix • shutdown • unban • unbanchat
╰───────────────♢

╭─『 UTILITY 』
│ alive • calc • help • ping • shorturl • staff • topmembers • weather • whois
╰───────────────♢

Total Commands: 290
Type: !help <command> for details
```

### Specialized Subflags
* `!help <cmd> -i` (or `info`): Displays command metadata card with Author and Version.
* `!help <cmd> -u` (or `usage` / `-g` / `guide`): Displays only usage syntax.
* `!help <cmd> -r` (or `role`): Displays permission requirement.
* `!help <cmd> -a` (or `alias`): Displays alternate aliases.

---

## 🚀 Multi-Runner Ecosystem

WA-Goat provides flexible entrypoints for different workflows:

```bash
# 1. Standard Production Start (Baileys v7 + WCA + Web Dashboard)
npm start
# OR: node src/index.js

# 2. ST Bot Runner (WCA Native CLI with 7 startup steps)
npm run st
# OR: node ST.js

# 3. Goat Bot Classic Runner
npm run goat
# OR: node Goat.js

# 4. Floppa Bot Backward-Compatible Runner
npm run floppa
# OR: node Floppa.js
```

---
## 🚀 Key Engineering Highlights

### 1. 🛡️ Baileys v7.0.0-rc14 WhatsApp Socket Layer
* **Multi-Device Session Resilience**: Built upon `@whiskeysockets/baileys@7.0.0-rc14` with automated reconnect backoff, keepalive pings, and credential persistence in `auth/`.
* **Flexible Authentication**: Log in via interactive QR code in terminal or request an 8-digit **Pairing Code** directly for headless servers.
* **Dual API Command Dispatcher**: Native support for both modern Baileys `execute(sock, m, args, extra)` and classic GoatBot `onStart({ api, message, event, args, usersData, threadsData, globalData, prefix })`.

### 2. ⚡ Zero-Disk Streaming & Pipeline Processing
* **Automated FFmpeg Transcoding**: Integrated `@ffmpeg-installer/ffmpeg` and `node-webpmux` for zero-system-dependency animated WebP sticker conversion and EXIF metadata injection.
* **Pure JavaScript Image Manipulation**: Powered by `jimp@^1.6.1` for blur, crop, resize, and watermark filters without native C++ compilation requirements.
* **Universal Media Downloader**: Integrated `btch-downloader` and `savetube` APIs for high-definition streaming from YouTube, TikTok, Facebook, and Instagram.

### 3. 💬 Group and Private DM Engine
* **Universal Command Execution**: Commands run with zero friction in **both Group chats and 1-on-1 Direct Messages (DMs)**.
* **Intelligent Moderation Safeguard**: Purely administrative actions (`kick`, `promote`, `demote`, `mute`, `tagall`) verify group context gracefully without crashes.
* **No-Prefix Command Recognition**: When users send commands (like `help`, `ping`, `sticker`, `daily`) in DMs or groups, the router auto-matches without requiring manual prefix typing.
* **Automatic Chatbot Fallback**: In private chats, conversational queries automatically invoke the multi-LLM AI companion.

---


## 📦 Command Matrix & Ecosystem

With over **290+ native modules**, WA-Goat covers all operational domains:

```
WA-Goat/
├── wca/              :: Complete WhatsApp Chat API engine (42+ methods)
├── dashboard/        :: Web administration UI, Eta views, static assets
├── scripts/cmds/     :: GoatBot V2 modular command collection
├── scripts/events/   :: Modular background event listeners
├── src/commands/     :: Core categorized microservices
│   ├── 🛠️ admin/     :: kick, promote, demote, mute, unmute, warn, antilink, antibadword...
│   ├── 👑 owner/     :: admin, ban, unban, banchat, eval, exec, restart, setprefix, broadcast...
│   ├── ℹ️ utility/   :: help, ping, alive, weather, calc, shorturl, whois, staff...
│   ├── 🎨 media/     :: sticker, simage, take, blur, crop, attp, ttp...
│   ├── 🤖 ai/        :: ai, gpt, gemini, character, translate...
│   ├── 💰 economy/   :: balance, daily, pay, work, bank, coinflip, dice, slot...
│   └── 🎮 fun/       :: meme, joke, fact, quote, eightball, insult, ship, tictactoe...
```

---

## 🛠️ Quick Start & Setup

### 1. Requirements
* **Runtime**: Node.js `>= 18.0.0` (Node 20+ recommended)
* **Package Manager**: npm `>= 8.0.0`
* **RAM**: Minimum 512 MB (1 GB+ recommended)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/frnAlt/WA-Goat.git
cd WA-Goat

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Verify codebase & syntax
npm run check
npm test

# Start the bot
npm start
```

### 3. Login Flow
When you first run the bot, it will prompt for login mode:
1. **Pairing Code (Recommended)**: Enter your phone number with country code (e.g. `8801712345678`), copy the 8-digit pairing code shown in terminal, and enter it in WhatsApp → Linked Devices → Link with Phone Number.
2. **QR Code**: Scan the QR code rendered in the terminal directly using WhatsApp → Linked Devices → Link a Device.

Session credentials are saved securely in `auth/` and automatically restore on future restarts.

---

## 🌐 Deployment & 24/7 Hosting

### Docker Deployment
```bash
# Build the Docker image
docker build -t wa-goat .

# Run with persistent auth volume
docker run -d --name wa-goat --restart unless-stopped -p 5000:5000 -v $(pwd)/auth:/app/auth wa-goat
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start src/index.js --name "wa-goat" --time
pm2 logs wa-goat
```

### Systemd Service (Linux VPS)
Create `/etc/systemd/system/wa-goat.service`:
```ini
[Unit]
Description=WA-Goat Bot Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/WA-Goat
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```
Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wa-goat
sudo systemctl start wa-goat
```

---

## 📚 Documentation & Guides

| Document | Purpose |
| :--- | :--- |
| **[GUIDE.md](GUIDE.md)** | Step-by-step setup, configuration, custom command & event creation, and troubleshooting guide. |
| **[WCA.md](WCA.md)** | Full WhatsApp Chat API reference with all 42+ methods, parameters, and examples. |
| **[DASHBOARD.md](DASHBOARD.md)** | Detailed guide for the Web Dashboard, live terminal streaming, and STAI file explorer. |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Guidelines for writing commands, testing, and submitting pull requests. |

---

## 📜 Author

* **Author & Lead Architect**: [frnAlt](https://github.com/frnAlt)

Released under the [MIT License](LICENSE).
