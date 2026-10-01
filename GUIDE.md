# 📖 Comprehensive WA-Goat Setup & Operations Guide

Welcome to the official setup, configuration, and developer guide for **WA-Goat** (Goat Bot V2 WhatsApp Edition with WCA and Web Dashboard).

---

## 📑 Table of Contents

1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Installation Step-by-Step](#2-installation-step-by-step)
3. [WhatsApp Authentication & Login Modes](#3-whatsapp-authentication--login-modes)
4. [Configuration Files Reference](#4-configuration-files-reference)
   - [config.json](#configjson)
   - [configCommands.json](#configcommandsjson)
   - [.env](#env)
5. [Multi-Runner System](#5-multi-runner-system)
6. [Interactive Web Dashboard](#6-interactive-web-dashboard)
7. [Writing Custom Commands](#7-writing-custom-commands)
   - [Classic GoatBot V2 Format](#classic-goatbot-v2-format)
   - [Modern Baileys Format](#modern-baileys-format)
8. [Writing Custom Events](#8-writing-custom-events)
9. [Direct WCA API Usage](#9-direct-wca-api-usage)
10. [Database Options (JSON, SQLite, MongoDB)](#10-database-options)
11. [24/7 Production Hosting](#11-247-production-hosting)
12. [Troubleshooting & FAQs](#12-troubleshooting--faqs)

---

## 1. Prerequisites & System Requirements

Before setting up WA-Goat, ensure your machine or server meets these requirements:

* **Node.js**: Version `18.0.0` or higher (Node `20.x` LTS recommended). Verify with:
  ```bash
  node -v
  ```
* **npm**: Version `8.0.0` or higher. Verify with:
  ```bash
  npm -v
  ```
* **Git**: Installed and available in PATH.
* **Operating System**: Linux (Ubuntu, Debian, CentOS, Alpine), macOS, or Windows (WSL recommended).
* **RAM**: Minimum 512 MB (1 GB+ recommended for media and canvas commands).

---

## 2. Installation Step-by-Step

### Step 1: Clone the Repository
```bash
git clone https://github.com/frnAlt/WA-Goat.git
cd WA-Goat
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Copy Environment Variables
```bash
cp .env.example .env
```

### Step 4: Verify Installation
Run the built-in syntax checker and test suite to ensure all dependencies and modules are verified:
```bash
npm run check
npm test
```
You should see:
```text
✅ Checked 425 JavaScript files.
🎉 0 syntax errors detected! All modules parsed cleanly.
ℹ pass 35
ℹ fail 0
```

---

## 3. WhatsApp Authentication & Login Modes

WA-Goat supports two login methods: **Pairing Code** (recommended for VPS / headless servers) and **QR Code**.

### Mode 1: 8-Digit Pairing Code (Recommended)
1. In `config.json`, set:
   ```json
   {
     "loginMode": "pair",
     "pairingCode": true,
     "phoneNumber": "8801712345678"
   }
   ```
   *(Replace with your phone number including country code, without '+' or spaces).*
2. Start the bot:
   ```bash
   npm start
   ```
3. Look for the pairing code displayed in the terminal:
   ```text
   ========================================
   📱 YOUR PAIRING CODE: ABCD-1234
   ========================================
   ```
4. Open WhatsApp on your phone:
   - Tap **Settings** (or three dots on Android) → **Linked Devices**
   - Tap **Link a Device**
   - Tap **Link with phone number instead**
   - Enter the 8-digit code displayed in your terminal.

### Mode 2: Interactive Terminal QR Code
1. In `config.json`, set:
   ```json
   {
     "loginMode": "qr",
     "pairingCode": false
   }
   ```
2. Start the bot:
   ```bash
   npm start
   ```
3. A QR code will render directly in your terminal.
4. Open WhatsApp → **Linked Devices** → **Link a Device** → Scan the QR code.

> [!NOTE]
> All session credentials are saved automatically in the `auth/` directory. Subsequent starts will restore the session instantly without prompting for login.

---

## 4. Configuration Files Reference

### `config.json`
Main runtime configuration:

```json
{
  "botName": "Goat Bot V2 🐐",
  "prefix": "!",
  "language": "en",
  "timeZone": "Asia/Dhaka",
  "ownerName": "Farhan",
  "ownerNumber": "8801712345678",
  "adminBot": [
    "8801712345678"
  ],
  "noPrefix": true,
  "antiInbox": false,
  "botOff": false,
  "eventsOff": false,
  "reactOff": false,
  "autoTyping": false,
  "autoRead": false,
  "autoStatus": false,
  "antiCall": true,
  "sessionPath": "./auth",
  "authFolder": "./auth",
  "loginMode": "pair",
  "phoneNumber": "8801712345678",
  "pairingCode": true,
  "dashBoard": {
    "enable": true,
    "port": 5000,
    "expireVerifyCode": 300000,
    "passwordProtection": {
      "enable": false,
      "password": "",
      "notes": "Set enable to true and define a password to protect the dashboard"
    }
  },
  "serverUptime": {
    "enable": true,
    "port": 3001,
    "socket": {
      "enable": true,
      "channelName": "uptime",
      "verifyToken": "goatbotkey"
    }
  },
  "database": {
    "type": "json",
    "storagePath": "./data",
    "sqlitePath": "./data/database.sqlite"
  },
  "spamProtection": {
    "commandThreshold": 8,
    "timeWindow": 10,
    "banDuration": 24
  },
  "defaultGroupSettings": {
    "antilink": false,
    "antibadword": false,
    "welcome": true,
    "goodbye": true,
    "chatbot": false,
    "mute": false,
    "antitag": false,
    "warnLimit": 3
  }
}
```

### `configCommands.json`
Controls per-command environmental options and unloads:

```json
{
  "commandUnload": [],
  "commandEventUnload": [],
  "commandAllowLoad": [],
  "commandBanned": {},
  "envGlobal": {
    "weatherApiKey": "d7e795ae6a0d44aaa8abb1a0a7ac19e4",
    "goatbotApikey": ""
  },
  "envCommands": {
    "daily": {
      "rewardDay1": { "coin": 100, "exp": 10 }
    }
  },
  "envEvents": {
    "logsbot": { "allow": true }
  }
}
```

### `.env`
Environment variable overrides (useful for Docker and cloud deployments):

```env
# Bot Basic Config
BOT_NAME="Goat Bot V2 🐐"
PREFIX="!"
LANGUAGE="en"
TIMEZONE="Asia/Dhaka"

# Owner Identity
OWNER_NAME="Farhan"
OWNER_NUMBER="8801712345678"
SUDO_NUMBERS=""

# Pairing Mode
PAIRING_CODE=true
PAIRING_NUMBER="8801712345678"

# Dashboard & Port
PORT=5000
NO_DASHBOARD=0

# AI Services
GEMINI_API_KEY=""
OPENAI_API_KEY=""
WEATHER_API_KEY="d7e795ae6a0d44aaa8abb1a0a7ac19e4"
```

---

## 5. Multi-Runner System

WA-Goat supports multiple runners to suit your preferred environment:

### Runner 1: Main Autonomous Engine (`npm start`)
Runs the unified Baileys v7 + WCA bridge + Web Dashboard + 290+ commands.
```bash
npm start
# Equivalent to: node src/index.js
```

### Runner 2: ST Bot WCA Native CLI (`npm run st`)
Runs the ST 7-step startup sequence with colorful CLI badges and direct WCA connection:
```bash
npm run st
# Equivalent to: node ST.js
```

### Runner 3: Goat Bot Classic Runner (`npm run goat`)
Standard entrypoint mirroring classic GoatBot V2:
```bash
npm run goat
# Equivalent to: node Goat.js
```

### Runner 4: Floppa Bot Runner (`npm run floppa`)
Backward-compatible entrypoint for Floppa-Chatbot scripts:
```bash
npm run floppa
# Equivalent to: node Floppa.js
```

---

## 6. Interactive Web Dashboard

When the bot boots, the Web Dashboard automatically starts on port `5000` (or the port defined in `config.dashBoard.port`).

### Accessing the Dashboard
Open your web browser and navigate to:
```
http://localhost:5000
```

### Features
1. **Live Console Stream**: Real-time terminal log output via Server-Sent Events (SSE) with no page reloads.
2. **STAI File Manager**: Explore project directories, read source code, and create new commands directly from the browser.
3. **Bot Statistics**: View active command count, event listeners, process uptime, and memory usage.
4. **Password Security**: Enable `config.dashBoard.passwordProtection.enable: true` and configure a password to restrict web access.

---

## 7. Writing Custom Commands

Custom commands can be added to `scripts/cmds/` or `src/commands/<category>/`.

### Classic GoatBot V2 Format
```javascript
module.exports = {
  config: {
    name: "hello",
    version: "1.0.0",
    author: "YourName",
    countDown: 3,
    role: 0, // 0: Everyone, 1: Group Admin, 2: Bot Admin, 4: Owner
    shortDescription: { en: "Say hello to the user" },
    category: "fun",
    guide: { en: "{pn}: Greets the sender" }
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const name = await global.getDisplayName(event.senderID);
    return message.reply(`Hello, ${name}! 👋 Welcome to WA-Goat.`);
  }
};
```

### Modern Baileys Format
```javascript
module.exports = {
  name: "ping",
  aliases: ["p"],
  category: "utility",
  description: "Check bot latency",
  role: 0,
  cooldown: 2,

  async execute(sock, m, args, extra) {
    const start = Date.now();
    await extra.message.reply(`🏓 Pong! Latency: ${Date.now() - start}ms`);
  }
};
```

---

## 8. Writing Custom Events

Events listen to group changes, member joins, and calls. Place event files in `scripts/events/` or `src/events/`.

```javascript
module.exports = {
  config: {
    name: "onJoin",
    version: "1.0.0",
    author: "YourName"
  },

  onStart: async function ({ api, event, threadsData }) {
    if (event.logMessageType === "log:subscribe") {
      const threadID = event.threadID;
      const addedParticipants = event.logMessageData.addedParticipants;

      for (const user of addedParticipants) {
        await api.sendMessage(
          `👋 Welcome @${user.userJid.split('@')[0]} to the group!`,
          threadID
        );
      }
    }
  }
};
```

---

## 9. Direct WCA API Usage

You can use the WCA client anywhere in your code:

```javascript
const wca = require("@sheikhtamim/wca");

// Or use the globally attached API instance:
// global.api or global.wcaApi

// Send text
await global.api.sendMessage("Hello world", "8801712345678@s.whatsapp.net");

// Send image with caption
await global.api.sendImage("https://example.com/pic.png", "ThreadID", "Check this out!");

// React to message
await global.api.reactToMessage("❤️", "MESSAGE_ID", "ThreadID");

// Get Group Info
const groupInfo = await global.api.getGroupInfo("123456-7890@g.us");
console.log("Group name:", groupInfo.subject);
```

---

## 10. Database Options

Configure your database in `config.json`:

```json
"database": {
  "type": "json" // "json" | "sqlite" | "mongodb"
}
```

* **JSON (Default)**: Lightweight, file-based atomic storage in `data/`. Best for local development and small-to-medium bots.
* **SQLite**: Fast relational database using SQLite3 and Sequelize. Best for high-concurrency production deployments.
* **MongoDB**: Cloud-based NoSQL storage. Supply your MongoDB Atlas connection string in `config.database.uriMongodb`.

---

## 11. 24/7 Production Hosting

### Method A: PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start src/index.js --name "wa-goat" --time
pm2 save
pm2 startup
```

### Method B: Docker
```bash
# Build
docker build -t wa-goat .

# Run with persistent auth volume and exposed dashboard
docker run -d \
  --name wa-goat \
  --restart unless-stopped \
  -p 5000:5000 \
  -v $(pwd)/auth:/app/auth \
  -v $(pwd)/data:/app/data \
  wa-goat
```

### Method C: Render / Railway
1. Connect your GitHub repository.
2. Build command: `npm install`
3. Start command: `npm start`
4. Set environment variable: `PORT=5000`
5. Configure persistent volume mounted at `/app/auth` to retain session logins across container reboots.

---

## 12. Troubleshooting & FAQs

### Q: The bot says "Session logged out" or 401 on start?
**A:** Your session key expired or was disconnected from WhatsApp. Clear the `auth/` directory:
```bash
rm -rf auth/*
```
Then restart `npm start` to generate a fresh pairing code.

### Q: Port 5000 is already in use?
**A:** Change the port in `config.json` under `"dashBoard": { "port": 5001 }` or pass `PORT=5001 npm start`.

### Q: Can I run this bot without the Web Dashboard?
**A:** Yes. Set `"dashBoard": { "enable": false }` in `config.json` or pass `NO_DASHBOARD=1 npm start`.

### Q: How do I make myself Owner or Bot Admin?
**A:** In `config.json`, add your phone number (digits only, e.g. `"8801712345678"`) into `"ownerNumber"` and `"adminBot"`.
