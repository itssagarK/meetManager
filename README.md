# PCS Meet Manager

An executive, zero-lag, keyboard-driven productivity workspace and ambient **Chrome Side Panel Extension (Manifest V3)** engineered to eliminate meeting fatigue, track agendas, and bridge the gap between schedule planning and task execution.

Live Web Demo: [https://meetmanager-p55v.onrender.com](https://meetmanager-p55v.onrender.com)

---

## Chrome Extension Setup Guide

PCS Meet Manager is packaged directly into Chrome's native **Side Panel API** (`chrome.sidePanel`), allowing it to dock alongside any browser tab (Google Meet, Gmail, Jira, Docs) without alt-tabbing.

### 1. Build the Extension Bundle
Make sure the client production bundle is compiled:
```bash
cd client
npm run build
```
This outputs the unpacked extension bundle into `client/dist/` containing `manifest.json`, `background.js`, `index.html`, and bundled assets.

### 2. Load into Chrome or Edge
1. Open **Google Chrome** (or **Microsoft Edge**).
2. Navigate to `chrome://extensions` (or `edge://extensions` in Edge).
3. Toggle **Developer mode** in the top-right corner to **ON**.
4. In the top-left corner, click **Load unpacked**.
5. Select the `client/dist` directory from this project:
   ```text
   C:\Users\Home\Desktop\projects\meetManager\client\dist
   ```
6. Click **Select Folder**.

### 3. Open the Side Panel
1. Click the **Extensions puzzle icon** in your browser toolbar and pin **PCS Meet Manager**.
2. Click the **PCS Meet Manager** icon in the toolbar.
3. The persistent Side Panel will slide open on the right edge of your screen.

---

## Key Features

* **Chrome Side Panel Integration**: Docks alongside any tab; remains visible during video calls without losing focus.
* **"Up Next" Focus Hero Banner**: Pinned at the top of the workspace with a real-time countdown ticker, attendee preview, and 1-click **Join Call** button.
* **Active Tab Video Call Detector**: 1-click **Grab Active Tab / Link** button inspects open tabs (`meet.google.com`, `zoom.us`, `teams.microsoft.com`) and auto-captures meeting links and titles.
* **Pre-Meeting Desktop Notifications**: Background service worker triggers native OS alerts 2 minutes before scheduled calls via `chrome.alarms` and `chrome.notifications`.
* **Morning Overdue Triage Bar**: Detects incomplete tasks from past dates and offers a 1-click batch rollover to today.
* **1-Click Google Calendar Sync**: Generates pre-filled Google Calendar web URLs (`+ GCal`) with zero API keys or authentication required.
* **Command Palette (`Ctrl+K` / `Cmd+K`)**: Instant modal for fuzzy searching tasks, jumping dates, and executing batch actions from the keyboard.
* **90-Day Activity Heatmap**: GitHub-style activity grid measuring completed tasks and meetings with an active streak counter.
* **Meeting Notes to Task Converter**: Automatically parses bullet points and discussion notes into next-day action items.
* **Tactile Executive Design System**: Crisp monochrome canvas with solid 1.5px black borders, a strict 3-accent color palette (Blue `#1d4ed8`, Green `#16a34a`, Red `#dc2626`), tabular numerals, and zero emojis.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open Command Palette |
| `T` | Quick Add Task |
| `M` | Quick Schedule Meeting |
| `/` | Focus Global Search Bar |
| `1` | Switch to Calendar & Day View |
| `2` | Switch to Table View |
| `3` | Switch to Cards View |
| `4` | Switch to Analytics View |
| `Esc` | Close Drawer / Dismiss Palette |

---

## Tech Stack

* **Browser Extension**: Manifest V3, `chrome.sidePanel`, `chrome.alarms`, `chrome.notifications`, `chrome.tabs`, `chrome.storage`
* **Frontend**: React 19, Vite 8, Native CSS3 (CSS Variables, Flexbox, CSS Grid)
* **Backend**: Node.js (ES Modules), Express 5, CORS
* **Database**: SQLite 3 (`better-sqlite3`) with automatic schema migration
* **Deployment**: Render / Unpacked Chrome Extension

---

## Running Locally (Standalone Web App)

### 1. Clone Repository
```bash
git clone https://github.com/itssagarK/meetManager.git
cd meetManager
```

### 2. Start Backend API
```bash
cd server
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

### 3. Start Frontend
```bash
cd ../client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` and proxies API calls to port 5000.

---

## Author
Sagar ([@itssagarK](https://github.com/itssagarK))
