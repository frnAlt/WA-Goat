# 💻 WA-Goat Web Dashboard Documentation

The **WA-Goat Web Dashboard** is a built-in web management interface that provides live telemetry, real-time terminal log streaming, and an integrated file explorer for your WhatsApp bot.

---

## 🚀 Key Features

* 📺 **Real-Time Live Console Stream (SSE)**: View bot console logs in your web browser with zero lag and zero page reloading via Server-Sent Events.
* 📁 **STAI File System Explorer**: Safely browse project files, read source code, and create new commands with built-in templates.
* 🔐 **Secure Password Authentication**: Optional session-based password authentication to prevent unauthorized web access.
* ⏱️ **Integrated Uptime Monitoring**: Built-in `/uptime` route compatible with UptimeRobot, BetterUptime, and cron pingers.
* ⚡ **Vercel Serverless Ready**: Compatible with Vercel and cloud serverless architectures via `api/index.js`.

---

## 🌐 Accessing the Dashboard

When WA-Goat starts, the dashboard automatically mounts on:

```
http://localhost:5000
```
*(Or your server's public IP / domain with port 5000).*

---

## ⚙️ Configuration Reference

Configure the dashboard inside `config.json`:

```json
{
  "dashBoard": {
    "enable": true,
    "port": 5000,
    "expireVerifyCode": 300000,
    "passwordProtection": {
      "enable": false,
      "password": "your_secure_password",
      "notes": "Set enable to true to enforce login before viewing the dashboard"
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
  }
}
```

### Configuration Options Explained
| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `dashBoard.enable` | `boolean` | `true` | Enables or disables mounting the web dashboard. |
| `dashBoard.port` | `number` | `5000` | The HTTP port the dashboard listens on. |
| `dashBoard.passwordProtection.enable` | `boolean` | `false` | Enables password authentication gate. |
| `dashBoard.passwordProtection.password` | `string` | `""` | The required password to access the web panel. |
| `serverUptime.socket.enable` | `boolean` | `true` | Enables Socket.IO uptime streaming. |
| `serverUptime.socket.verifyToken` | `string` | `"goatbotkey"` | Secret token for external Socket.IO clients. |

---

## 🔒 Security Architecture

1. **Path Traversal Protection**: The FS Explorer strictly validates paths using `path.resolve` and verifies that all requested files reside strictly inside the project root directory.
2. **Blacklist Shield**: Folders such as `node_modules`, `.git`, `.cache`, and sensitive system stores cannot be accessed or modified via the web UI.
3. **Session Secret**: Authenticated sessions are signed via `express-session` cookies.
4. **Rate Limiting**: Integrated `express-rate-limit` prevents brute-force login attempts.

---

## 📡 Web Routes & API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Dashboard home view (stats, system health, live console). |
| `/login` | `GET / POST` | Login page and credential authentication handler. |
| `/logout` | `POST` | Destroys current web session. |
| `/uptime` | `GET` | Lightweight JSON health status (`{ status: "online", uptime: ... }`). |
| `/api/console/stream` | `GET` | Server-Sent Events (SSE) feed streaming terminal logs. |
| `/api/stai/files` | `GET` | Lists project files for the STAI file explorer. |
| `/api/stai/read` | `GET` | Reads a file's contents safely. |
| `/api/stai/write` | `POST` | Saves file changes safely. |
| `/api/stai/create` | `POST` | Creates a new command or event file from templates. |

---

## 🛠️ Disabling the Dashboard

If you prefer to run the bot in headless mode without a web server:
* Set `"dashBoard": { "enable": false }` in `config.json`, OR
* Run with environment variable: `NO_DASHBOARD=1 npm start`
