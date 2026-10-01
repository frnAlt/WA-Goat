# 🐐 Goat Bot V2 — WhatsApp Edition

[![CI](https://github.com/frnAlt/WA-Goat/actions/workflows/ci.yml/badge.svg)](https://github.com/frnAlt/WA-Goat/actions/workflows/ci.yml)
[![Baileys](https://img.shields.io/badge/Baileys-v7.0.0--rc14-green.svg)](https://github.com/WhiskeySockets/Baileys/releases/tag/v7.0.0-rc14)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete, production-ready **WhatsApp Bot implementation of Goat Bot V2**, powered by **Baileys v7.0.0-rc14**.

This project bridges the proven architecture and rich features of **Floppa-Chatbot / Goat Bot V2** with the battle-tested WhatsApp socket and serialization layers of **Knightbot-MD** and **KnightBot-Mini**, creating a high-performance, resilient WhatsApp bot.

---

## 🌟 Highlights & Features

- **WhatsApp Protocol Layer:** Powered by **`@whiskeysockets/baileys@7.0.0-rc14`**.
- **Dual Authentication Modes:** Scan QR code in terminal or request a **Pairing Code** via phone number.
- **Resilient Connection Lifecycle:** Automated reconnection with exponential backoff and auth credential persistence.
- **GoatBot V2 Role Hierarchy:**
  - `0`: Normal Member
  - `1`: Group Administrator
  - `2`: Bot Administrator (Sudo)
  - `3`: Premium Member
  - `4`: Bot Owner / Developer
- **Dynamic Command Framework:** Automatically discovers, registers, and hot-reloads commands across categories.
- **Dual Interface Compatibility:**
  - Modern Baileys format: `execute(sock, m, args, extra)`
  - Classic GoatBot format: `onStart({ message, args, usersData, threadsData, globalData, event, getLang, config })`
- **Group Moderation & Protection:**
  - Automated Antilink (deletes message, warns, or removes non-admin senders)
  - Automated Antibadword (filters abusive words and slurs)
  - AntiCall (rejects incoming calls and auto-blocks callers)
  - Warning system with threshold auto-kick
  - Mute/Unmute, Kick (with self-kick prevention), Promote, Demote, Group Subject & Description editing
  - TagAll / HideTag announcements
- **Multimedia & Sticker Suite:**
  - Image to WebP sticker
  - Video & GIF to animated WebP sticker
  - Sticker to normal Image (`!simage`)
  - Watermark editor (`!take` steals/modifies sticker packname & author)
  - Image blur, crop, and animated text sticker generator (`!attp`, `!ttp`)
- **Virtual Economy & Mini-Games:**
  - Wallet balance, daily coin claim, money transfer (`!pay`)
  - Work jobs, Central Bank deposit/withdraw (`!bank`)
  - Gambling mini-games: Coinflip, Dice battle, Casino Slots, Interactive Tic-Tac-Toe (`!ttt`)
- **AI & Integrations:**
  - Conversational AI with context memory
  - Google Gemini and GPT queries
  - AI Persona Roleplay (Yoda, Gordon Ramsay, Sherlock Holmes, Anime waifu, Pirate)
  - Live Weather reports via OpenWeatherMap
  - Scientific calculator powered by `mathjs`
  - URL shortener, jokes, quotes, facts, truth or dare, and love compatibility calculator (`!ship`)
- **Data Persistence:**
  - Zero-config safe atomic JSON storage (`data/users.json`, `data/threads.json`, `data/global.json`)
  - Optional SQLite support via `sequelize`
- **Background Tasks:** Auto-cleaning of temporary media, V8 exposed garbage collection, and cron scheduler.

---

## 📋 Requirements

- **Node.js:** v20.x or higher
- **NPM:** v8.x or higher
- **FFmpeg:** Optional on host (pre-configured `@ffmpeg-installer/ffmpeg` included)
- **Active WhatsApp Account:** Mobile phone number for QR or pairing code login

---

## 🚀 Installation & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/frnAlt/WA-Goat.git
cd WA-Goat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your settings:
```env
BOT_NAME="Goat Bot V2"
PREFIX="!"
OWNER_NAME="Farhan"
OWNER_NUMBER="1234567890"    # International phone number without + or spaces
PAIRING_CODE=false          # Set true to use pairing code instead of QR
PAIRING_NUMBER=""           # Phone number if pairing code is true
```

### 4. Run Syntax & Quality Checks
```bash
npm run check
npm test
```

### 5. Start the Bot
```bash
npm start
```

---

## 🔐 Authentication Modes

### Mode A: QR Code (Default)
When `PAIRING_CODE=false`, a terminal QR code will be generated.
1. Open WhatsApp on your phone.
2. Tap **Settings > Linked Devices > Link a Device**.
3. Scan the QR code displayed in your terminal.

### Mode B: Pairing Code
When `PAIRING_CODE=true` and `PAIRING_NUMBER=1234567890`:
1. Start the bot.
2. An 8-digit code (e.g., `ABCD-EFGH`) will appear in the console.
3. Open WhatsApp > **Linked Devices > Link a Device > Link with phone number instead**.
4. Enter the code shown in the terminal.

Authentication credentials are saved in `./auth/` and preserved across restarts.

---

## 📂 Project Architecture

```text
WA-Goat/
├── src/
│   ├── index.js                     # Master process orchestrator & supervisor
│   ├── config/                      # Unified configuration system & JID helpers
│   ├── core/
│   │   ├── client.js                # Baileys v7 socket layer & connection state
│   │   ├── message.js               # Message normalizer & GoatBot message adapter
│   │   ├── command.js               # Dynamic command loader, parser, & cooldowns
│   │   ├── permissions.js           # Multi-tier role verification (0-4)
│   │   ├── events.js                # Modular event registry
│   │   └── scheduler.js             # Background cleaner & cron scheduler
│   ├── handlers/
│   │   ├── commandHandler.js        # Command validation & execution boundary
│   │   ├── messageHandler.js        # Stream listener, moderation, onReply, chatbot
│   │   └── eventHandler.js          # Participant updates (welcome, leave), anticall
│   ├── database/
│   │   ├── index.js                 # Unified database repository
│   │   ├── safeStorage.js           # Atomic JSON read/write
│   │   └── controllers/
│   │       ├── usersData.js         # GoatBot compatible user data controller
│   │       ├── threadsData.js       # GoatBot compatible thread data controller
│   │       └── globalData.js        # Global bot-wide key-value controller
│   ├── services/
│   │   ├── mediaService.js          # Audio/video/image converter & downloader
│   │   ├── stickerService.js        # WebP encoder, animated sticker maker, EXIF
│   │   ├── groupService.js          # Group metadata caching & admin actions
│   │   ├── apiService.js            # External APIs (weather, AI, quotes, facts)
│   │   └── cacheService.js          # TTLMap and cooldown trackers
│   ├── utils/
│   │   ├── logger.js                # Structured colorized logging
│   │   ├── myfunc.js                # Baileys message serializer (smsg) & JID decoders
│   │   ├── goatUtils.js             # GoatBot compatibility helpers
│   │   ├── badwords.js              # Antibadword detector
│   │   ├── antilink.js              # WhatsApp link & URL detector
│   │   └── exif.js                  # Sticker EXIF metadata packager
│   ├── commands/                    # 75+ Commands organized by category
│   │   ├── admin/                   # Group moderation & management commands
│   │   ├── owner/                   # Bot configuration & owner commands
│   │   ├── utility/                 # Informational & utility commands
│   │   ├── media/                   # Media & sticker processing commands
│   │   ├── ai/                      # AI conversational & translation commands
│   │   ├── economy/                 # Currency, banking & gambling minigames
│   │   └── fun/                     # Entertainment, jokes & minigames
│   └── events/                      # Modular event listeners
│       ├── welcome.js
│       ├── leave.js
│       ├── autoUpdateThreadInfo.js
│       ├── checkwarn.js
│       └── logsbot.js
├── tests/                           # Unit tests covering all core systems
├── scripts/
│   ├── check.js                     # Syntax & code health validator
│   └── audit.js                     # Source vs destination feature audit
├── .github/workflows/ci.yml         # CI pipeline
├── .env.example
├── Dockerfile
├── package.json
└── README.md
```

---

## 🛠️ Command Catalog

| Category | Commands |
| :--- | :--- |
| **Admin** | `kick`, `promote`, `demote`, `mute`, `unmute`, `tagall`, `hidetag`, `groupinfo`, `groupname`, `groupdesc`, `link`, `revoke`, `warn`, `warnings`, `resetwarn`, `antilink`, `antibadword`, `welcome`, `goodbye`, `chatbot` |
| **Owner** | `admin`, `ban`, `unban`, `banchat`, `unbanchat`, `eval`, `exec`, `restart`, `shutdown`, `setprefix`, `autotyping`, `autoread`, `autostatus`, `anticall`, `broadcast`, `cleartemp` |
| **Utility** | `help`, `ping`, `alive`, `weather`, `calc`, `shorturl`, `whois`, `topmembers`, `staff` |
| **Media** | `sticker`, `simage`, `take`, `blur`, `crop`, `attp`, `ttp` |
| **AI** | `ai`, `gpt`, `gemini`, `character`, `translate` |
| **Economy** | `balance`, `daily`, `pay`, `work`, `bank`, `coinflip`, `dice`, `slot` |
| **Fun** | `meme`, `joke`, `fact`, `quote`, `eightball`, `compliment`, `insult`, `dare`, `truth`, `ship`, `tictactoe` |

---

## 🐳 Docker Deployment

Build and run using Docker:
```bash
docker build -t wa-goat .
docker run -d --name goatbot \
  -v $(pwd)/auth:/app/auth \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  wa-goat
```

---

## 🧪 Testing & Verification

Unit tests are written using Node.js's native test runner (`node:test`) and mock socket contexts, requiring no live WhatsApp connection:
```bash
npm run check    # Verify JavaScript syntax across all files
npm test         # Run all 27 unit tests across core modules
node scripts/audit.js # Run feature inventory audit
```

---

## 📜 Credits & Attribution

This project is built with respect and attribution to the authors of its upstream and foundational repositories:

- **[Floppa-Chatbot](https://github.com/frnAlt/Floppa-Chatbot)** by **Farhan Muh Tasim (Gtajisan / frnAlt)** — Functional base, commands, and architecture reference.
- **[GoatBot V2](https://github.com/NTKhang/Goat-Bot)** by **NTKhang** — Original Goat Bot ecosystem and command conventions.
- **[Knightbot-MD](https://github.com/mruniquehacker/Knightbot-MD)** & **[KnightBot-Mini](https://github.com/mruniquehacker/KnightBot-Mini)** by **Professor (mruniquehacker)** — WhatsApp bot architecture, serialization, and media handling.
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** by **WhiskeySockets & adiwajshing** — WhatsApp socket and transport protocol library.

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
