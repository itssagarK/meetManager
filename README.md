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

## Chrome Extension Setup (Side Panel V3)

PCS Meet Manager runs natively docked in Chrome's **Side Panel API** (`chrome.sidePanel`) alongside Google Meet, Gmail, Jira, and Docs without switching windows.

```bash
# Build & package store-ready release zip in one step
npm run package:extension
```

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top right to **ON**.
3. Click **Load unpacked** and select the `client/dist` directory.
4. Pin the extension to your toolbar and click the icon to open the persistent side panel.
5. The generated `pcs-meet-manager-extension.zip` is ready for direct submission to the Chrome Web Store.

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
