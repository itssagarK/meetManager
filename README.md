# PCS Meet Manager

An executive, zero-lag productivity workspace and **Chrome Side Panel Extension (Manifest V3)** with independent WebRTC video calling, automated email invites with `.ics` calendars, cloud multi-tenancy, and smartphone optimization.

Live Web Demo: [https://meetmanager-p55v.onrender.com](https://meetmanager-p55v.onrender.com)

---

## Quick Start (Local & Public)

### 1. Install & Run
```bash
# Start backend server with WebRTC signaling & SQLite (Port 5000)
npm run server

# In a second terminal, start React client with Vite (Port 5173)
npm run client
```

### 2. Make It Public (Instant HTTPS Tunnel)
Allow anyone in the world to join meetings from any smartphone, tablet, or laptop:
```bash
npm run tunnel
```
Share the generated HTTPS URL (`https://<subdomain>.loca.lt?room=pcs-xxx`) with attendees.

---

## Chrome Extension Pack (Manifest V3 Side Panel)

PCS Meet Manager includes a pre-compiled, store-ready extension pack: **`pcs-meet-manager-extension.zip`** (92 KB) located in the project root. It docks natively in Chrome's **Side Panel API** (`chrome.sidePanel`), allowing you to manage tasks and join WebRTC calls alongside Google Meet, Gmail, Jira, and Docs without switching windows.

### What is Inside the Extension Pack
* `manifest.json`: Manifest V3 configuration with side panel permissions.
* `background.js`: Background service worker managing pre-meeting alarms (`chrome.alarms`) and system notifications (`chrome.notifications`).
* `icon-16.png`, `icon-48.png`, `icon-128.png`: Chrome Web Store compliant icons.
* `dist/index.html` & assets: Optimized production React 19 side panel bundle.

---

### Installation Options

#### Option A: Install from Pre-Built Pack
1. Extract `pcs-meet-manager-extension.zip` into a folder.
2. Open Chrome (or Edge) and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted folder (or `client/dist`).
5. Pin **PCS Meet Manager** to your toolbar and click the icon to launch the side panel.

#### Option B: Build & Repackage from Source
To regenerate the extension bundle and ZIP archive after making any code changes:
```bash
npm run package:extension
```
This automatically compiles the frontend with Vite and generates a fresh `pcs-meet-manager-extension.zip`.

---

### Publishing to Chrome Web Store
The generated `pcs-meet-manager-extension.zip` meets all Chrome Web Store requirements:
1. Log in to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **New Item** and upload `pcs-meet-manager-extension.zip`.
3. Fill in description details and submit for review.

---

## Core Capabilities

* **Independent WebRTC Video Calling**: Encrypted P2P video/audio conferencing with screen sharing, self-healing ICE restart (`restartIce()`), and live connection health pills (`P2P Direct`, `TURN Relay`).
* **Dedicated Public Guest Room**: Opening a room link (`?room=pcs-xxx`) launches an isolated, full-screen guest video room. The host's private workspace tasks, database, and standups remain hidden.
* **Automated Email Notifications & `.ics` Invites**: Asynchronously sends executive HTML invites with RFC 5545 `.ics` attachments on meeting creation.
* **Smartphone Optimization**: Responsive touch layout with a sticky 1-tap mobile bottom dock (`+ Task`, `+ Meet`, `Call`, `Search`, `Standup`), full-width mobile bottom sheets, and iOS auto-zoom prevention.
* **Cloud Multi-Tenancy & Persistence**: Isolated workspaces via `X-Workspace-Id`, backed by SQLite in high-concurrency WAL mode (`PRAGMA journal_mode = WAL`).
* **Enterprise Security & Lifecycle**: Hardened with Helmet CSP (tuned for WebSockets and WebRTC), tiered rate limiting, and graceful process shutdown (`SIGTERM`/`SIGINT`).
* **Keyboard-Driven Workflow**: Global hotkeys (`Ctrl+K` command palette, `T` quick task, `M` quick meeting, `/` search, `Esc` dismiss).
* **Focus & Productivity Tools**: 25-minute Pomodoro buffer timer, 1-click Slack/Teams daily standup exporter, overdue triage rollover, and 90-day activity heatmap.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+K` / `Cmd+K` | Open Command Palette |
| `T` | Quick Add Task |
| `M` | Quick Schedule Meeting |
| `/` | Focus Global Search Bar |
| `1` / `2` / `3` / `4` | Switch Views (Calendar, Table, Cards, Analytics) |
| `Esc` | Close Drawer / Dismiss Palette |

---

## Tech Stack

* **Browser Extension**: Manifest V3, `chrome.sidePanel`, `chrome.alarms`, `chrome.notifications`
* **Frontend**: React 19, Vite 8, Material Symbols, Touch-First CSS3
* **Backend**: Node.js ES Modules, Express 5, `ws` (WebSocket signaling), `nodemailer`
* **Security & Storage**: SQLite (`better-sqlite3` in WAL mode), Helmet, Express Rate Limit
* **Containerization**: Multi-stage production `Dockerfile`

---

## Author
Sagar ([@itssagarK](https://github.com/itssagarK))
