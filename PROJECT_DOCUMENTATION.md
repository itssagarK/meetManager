# PCS Meet Manager 

* **System Architecture & Technical Documentation**
* **Date:** 31 Oct 2026
* **Document Version:** 1.0.0  
* **Status:** Active Production 
* **Repository:** `meetManager`

---
## Screenshots


| Calendar view | Table view |
| :---: | :---: |
| ![Calendar](docs/images/calendar.png) | ![Table](docs/images/table.png) |

| Cards view | Analytics view |
| :---: | :---: |
| ![Cards](docs/images/cards.png) | ![Analytics](docs/images/analytics.png) |

| Video call (speaker halo) | Guest knock and admit |
| :---: | :---: |
| ![Call](docs/images/call.png) | ![Lobby](docs/images/lobby.png) |

| Chrome Side Panel | Chat with lightbox |
| :---: | :---: |
| ![Side panel](docs/images/sidepanel.png) | ![Chat](docs/images/chat.png) |

---
## 1. EXECUTIVE SUMMARY & PURPOSE

### 1.1 Core Mission & Problem Statement
Modern work is fragmented across tools:

- **Video calls** (Google Meet, Zoom, Teams) live in separate tabs and need scheduled URLs and calendar syncing.
- **Task tracking** (Jira, Linear, Todoist) is disconnected from what is discussed in meetings, so action items get lost.
- **Chat** (Slack, Teams) is separate from ad-hoc project calls, which makes sharing snippets and links awkward.

PCS Meet Manager brings these into one app, available as a **web app** and as a **Chrome Manifest V3 Side Panel extension**. It provides:

- Instant WebRTC video calls, either direct or through a host-approved lobby
- Real-time channel chat with image sharing
- Automatic calendar invites (`.ics`, RFC 5545) sent by email
- Task and meeting tracking, a Pomodoro timer, and a standup generator

**Target End-Users:**
* **Executives & Engineering Managers:** Rapidly reviewing daily schedules, running 25-minute Pomodoro focus sprints, and auto-generating standup updates for Slack/Teams.
* **Agile Teams & Consultants:** Ad-hoc room generation, zero-boundary video syncs, and guest-admitted client presentations without registration barriers.
* **Remote Knowledge Workers:** Utilizing the persistent Chrome Side Panel to triage tasks and take meeting calls without leaving active work documents or code repositories.

---

### 1.2 High-Level Architecture Overview
The application follows a **Modular Full-Stack Monolith with Dual-Runtime Client Deployment and Unified Real-Time Signaling**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 + Vite)                  │
├───────────────────────────────────┬────────────────────────────────────┤
│     Chrome Manifest V3 Side Panel │      Standalone Web Application    │
│  - background.js (Service Worker) │  - Responsive Executive Stage      │
│  - chrome.alarms (Desktop Alerts) │  - Public Guest Meeting Portal     │
│  - Active Tab URL Auto-Detection  │  - Zero-Boundary Room Launcher     │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  │ HTTP / REST (/api/*)               │ WebSocket (/ws)
                  │ Rate-Limited, Helmet Secured       │ Signaling & Chat
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  BACKEND APPLICATION LAYER (Node.js / Express 5)       │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│  │ Express REST Engine   │ │ WS Signaling Hub     │ │ SMTP Dispatcher│ │
│  │ - Meetings / Tasks    │ │ - WebRTC Peer Relay  │ │ - Nodemailer   │ │
│  │ - Multi-Tenant WS-ID  │ │ - Guest Knock Lobby  │ │ - RFC 5545 .ics│ │
│  │ - Public Directory    │ │ - Channel Chat / Pub │ │ - HTML Invites │ │
│  └──────────┬────────────┘ └──────────┬───────────┘ └───────┬────────┘ │
└─────────────┼─────────────────────────┼─────────────────────┼──────────┘
              │                         │                     │
              ▼                         ▼                     ▼
┌───────────────────────────┐ ┌───────────────────────┐ ┌────────────────┐
│   SQLite Database (WAL)   │ │ In-Memory State Maps  │ │ Mail Transfer  │
│  - meetings               │ │ - rooms (hosts/peers) │ │   Agent (MTA)  │
│  - room_messages          │ │ - chatRooms (sockets) │ │  SMTP Gateway  │
└───────────────────────────┘ └───────────────────────┘ └────────────────┘
```

#### Architectural Characteristics:
1. **Unified Dual-Runtime Client:** A single React 19 source base operates interchangeably in standard browser viewports (mobile, tablet, desktop) and constrained Chrome Side Panel viewports (`chrome.sidePanel`), automatically tailoring navigation and screen real estate.
2. **Synchronous High-Throughput Persistence:** Utilizes embedded SQLite through `better-sqlite3` compiled with C++ native bindings and configured in Write-Ahead Logging (`WAL`) mode, delivering sub-millisecond query responses and concurrent reader scalability without requiring external database servers.
3. **Stateful In-Memory Signaling & Knocking Engine:** Real-time WebRTC negotiation and corporate lobby admissions operate over persistent WebSocket connections managed by decoupled in-memory maps (`rooms` and `chatRooms`), ensuring zero-latency signaling dispatch.
4. **Resilient Asynchronous Email Subsystem:** Non-blocking email dispatch pipeline generates standard RFC 5545 iCalendar (`.ics`) payloads and dispatches them via SMTP in the background, keeping REST API responses at $0\text{ ms}$ perceived latency.

---

## 2. CORE FEATURES & FUNCTIONAL CAPABILITIES

### 2.1 Google Meet-Style WebRTC Video Calling Engine
* **P2P Audio/Video Mesh:** Low-latency peer-to-peer audio and video streaming using native WebRTC (`RTCPeerConnection`). Automated STUN/TURN server discovery via `/api/webrtc/ice-config`.
* **Adaptive Video Grid & Spotlight Pinning:** 16:9 responsive layout with dynamic CSS Grid adjusting to participant counts, featuring one-click spotlight pinning for speaker prominence.
* **Real-Time Active Speaker Detection:** Uses the browser Web Audio API (`AudioContext`, `AnalyserNode`) to calculate real-time root-mean-square (RMS) microphone volume levels, rendering dynamic green halo rings around actively speaking participants.
* **Executive In-Call Controls:** Floating dock providing one-click/shortcut controls for Microphone mute (`Ctrl+D`), Video toggle (`Ctrl+E`), Screen Sharing (`getDisplayMedia`), Hand Raising (`raise-hand` WS event), and Call Termination.
* **In-Call Collapsible Side Drawer:** Contextual slide-out panel offering live in-call text chat, participant roster, knocking guest queue management, and meeting details.
* **Picture-in-Picture (PiP) Multitasking:** Native video PiP support allowing executives to review schedules or write notes while keeping caller video in view.
* **Primary Implementation:**
  - Client: `client/src/App.jsx` (Lines 739–1160, 5475–6110)
  - Backend: `server/server.js` (Lines 207–234, 637–838, 902–958)
  - Styling: `client/src/App.css` (Video grid, pill dock, speaker halo classes)

---

### 2.2 Corporate Knocking Lobby & Gatekeeping Admission
* **Guest Verification Protocol:** External participants joining via room links (`?room=<code>`) are routed to a dedicated guest view requiring their Full Name and Corporate Office ID before connection.
* **Two-Phase Host Handshake:**
  1. Guest sends `guest-knock` WebSocket payload.
  2. Server queues guest in `waitingGuests` map and delivers `guest-knock-request` to the active host socket.
  3. Host receives a modal dialog displaying guest credentials with "Admit" (`admit-guest`) or "Decline" (`deny-guest` with reason) actions.
  4. Upon admission, the server transfers the socket into active room participants and initiates ICE signaling.
* **Primary Implementation:**
  - Client: `client/src/App.jsx` (Lines 1180–1369, 3482–4074, 6659–6705)
  - Backend: `server/server.js` (Lines 742–815, 935–943)

---

### 2.3 Zero-Boundaries Quick Join System
* **Instant Frictionless Entry:** Provides bypass controls for internal team members to join video calls or work chat channels immediately without waiting for host admission.
* **Universal Code Parser:** Accepts clean alphanumeric room codes, queries, or raw URLs (e.g., `?room=standup`, `general`, `https://domain.com?room=alpha`), routing users to the appropriate mode.
* **Primary Implementation:**
  - Client: `client/src/App.jsx` (Lines 840–880, 4115–4123, 6445–6540)
  - Backend: `server/server.js` (Lines 728–741)

---

### 2.4 Global Real-Time Work Chat & Asset Collaboration
* **Multi-Channel Rooms:** Persistent text and image collaboration rooms (e.g., `#general`, `#standup`, custom codes) accessible in full-screen view or as a floating dock.
* **Typing Indicators & Live Presence:** Real-time presence counter (`chat-presence`) displaying current online member count; debounced typing indicator broadcast (`chat-typing`).
* **Rich Asset Sharing:** Drag-and-drop file upload and system clipboard paste handler (`handlePasteEvent`) converting image files into base64 data payloads with instant full-resolution Lightbox inspection.
* **Message Threading & Management:** Quoted message replies (`reply_to_id`), inline copy to clipboard, and soft-deletion (`is_deleted=1`) synchronized live across all room clients.
* **Synthesized Audio Chimes:** Built-in Web Audio API tone synthesis (`playChatNotificationSound`) notifying users of new incoming messages without external MP3/WAV dependencies.
* **Primary Implementation:**
  - Client: `client/src/App.jsx` (Lines 1427–1835, 3016–3479, 6180–6440)
  - Backend: `server/server.js` (Lines 113–189, 549–626, 651–704, 839–896)

---

### 2.5 Executive Productivity Cockpit & Task Management
* **Unified Item Model:** Simultaneous tracking of tasks and scheduled meetings with attributes including priority (`High`, `Medium`, `Low`), status (`Pending`, `Completed`), scheduled date/time, external meeting link, attendees, and rich agenda notes.
* **Four Dedicated Viewports:**
  1. **Calendar View:** Dual-mode layout featuring a 30-day interactive month grid with activity density dots, and a 7-day executive sprint board.
  2. **Table View:** High-density, sortable operational table with inline status toggling, date sorting, and action triggers.
  3. **Cards View:** Kanban-style visual cards displaying tags, priority badges, and agenda previews.
  4. **Analytics View:** Comprehensive metrics dashboard including completion rates, estimated meeting hours, 90-day activity heatmap, and active streak counters.
* **Morning Overdue Triage Bar:** Automatic detection of past-due action items with single-click bulk rollover (`handleRolloverAllOverdue`) to tomorrow.
* **Up Next Focus Hero Banner:** Dynamic widget tracking the immediate upcoming meeting with live countdown timers, 1-click room launch, and Google Calendar deep-links.
* **25-Minute Pomodoro Focus Sprint:** Dedicated focus sprint buffer with visual timer, progress bar, and completion notifications.
* **Daily Standup Generator:** One-click automated synthesis of completed items, today's targets, and meetings into formatted Markdown for Slack and Microsoft Teams.
* **Meeting Notes-to-Tasks Converter:** Automatic parser scanning agenda notes for markdown bullet points (`- [ ]`, `*`) and batch-generating independent actionable tasks.
* **Primary Implementation:**
  - Client: `client/src/App.jsx` (Lines 2238–2612, 4156–5150)
  - Backend: `server/server.js` (Lines 83–111, 362–469)

---

### 2.6 Automated RFC 5545 Calendar Email Dispatch (SMTP)
* **Automated Delivery:** When a meeting with valid attendee emails is created, the backend asynchronously compiles and sends an executive HTML invitation via Nodemailer.
* **RFC 5545 iCalendar Attachment:** Generates compliant `.ics` calendar files with unique `UID`, `DTSTAMP`, `DTSTART`, `SUMMARY`, and `METHOD:REQUEST`, enabling direct one-click integration into Google Calendar, Microsoft Outlook, and Apple Calendar.
* **Primary Implementation:**
  - Backend: `server/server.js` (Lines 242–359, 402–407)

---

### 2.7 Chrome Extension (Manifest V3 Side Panel) & Desktop Alarms
* **Persistent Side Panel Integration:** Manifest V3 compliant side panel (`chrome.sidePanel`) keeping the entire productivity suite docked beside user browsing activity.
* **Background Desktop Alarms:** Service worker (`background.js`) setting Chrome Alarms 2 minutes before scheduled meetings, generating native OS desktop notifications.
* **Automated Meeting Link Detection:** Contextual inspection of active Chrome tabs and clipboard data (`handleAutoDetectCallLink`) to auto-populate meeting URLs.
* **Binary Packaging & Icon Generation:** Custom automated build scripts generating store-compliant PNG icons from raw buffers and compressing output into `pcs-meet-manager-extension.zip`.
* **Primary Implementation:**
  - Extension Config: `client/public/manifest.json`
  - Service Worker: `client/public/background.js`
  - Build Automation: `client/scripts/package-extension.js`, `client/scripts/generate-icons.js`

---

### 2.8 Public Live Meeting Directory Portal (`?public=1` / `?portal=1`)
* **Public Directory Stage:** Publicly accessible dashboard listing scheduled meetings for the current date, indicating live host presence, active participant counts, and a direct room code entry box.
* **Primary Implementation:**
  - Client: `client/src/App.jsx` (Lines 2615–3015)
  - Backend: `server/server.js` (Lines 489–547)

---

## 3. TECH STACK & SYSTEM DEPENDENCIES

### 3.1 Languages, Runtimes, and Frameworks

| Tier | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>=20.x` (Docker: `node:20-slim`) | Execution runtime for API server and build pipeline |
| **Backend Framework** | Express | `^5.2.1` | HTTP routing, middleware pipeline, and static file serving |
| **Frontend Framework** | React | `^19.2.8` | Declarative UI rendering, hooks, and virtual DOM diffing |
| **DOM Renderer** | React DOM | `^19.2.8` | Browser DOM reconciliation |
| **Client Bundler** | Vite | `^8.3.0` | Ultra-fast HMR development server and Rollup production bundler |
| **Vite React Plugin** | `@vitejs/plugin-react` | `^6.1.1` | Fast Refresh Babel/Babel-free JSX transformation |
| **Linter / Quality** | Oxlint | `^1.81.0` | High-performance Rust-based static code analysis |

---

### 3.2 Database & Persistence Architecture

| Component | Specification | Operational Detail |
| :--- | :--- | :--- |
| **Database Engine** | SQLite 3 | Embedded single-file ACID-compliant relational engine |
| **Driver / Library** | `better-sqlite3` (`^13.0.3`) | Synchronous C++ native bindings providing maximum throughput |
| **Journaling Mode** | `WAL` (Write-Ahead Logging) | Configured via `db.pragma('journal_mode = WAL');` to allow concurrent readers without blocking writers |
| **Persistence Path** | Configurable via `DATABASE_PATH` | Defaults to local `./server/meetings.db`; supports persistent cloud mount points (e.g., `/data/meetings.db`) |
| **Schema Migration** | Inline Defensive SQL | Programmatic `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN` with exception shielding |
| **Client Storage** | `localStorage` & `sessionStorage` | Client-side workspace selection caching and guest identity persistence |

---

### 3.3 Critical Third-Party Dependencies

#### Backend Dependencies (`server/package.json`):
* **`better-sqlite3` (`^13.0.3`):** Core storage engine; provides synchronous query execution avoiding event loop microtask hopping.
* **`ws` (`^8.22.0`):** RFC 6455 compliant WebSocket server engine attached to HTTP server instance for WebRTC signaling and chat rooms.
* **`helmet` (`^8.3.0`):** Enterprise HTTP header hardening; custom-configured Content Security Policy (CSP) enabling WebRTC media streams (`blob:`), Google Fonts, and WebSocket protocols (`ws:`, `wss:`).
* **`express-rate-limit` (`^8.7.1`):** DDoS mitigation and API throttling. Configured with a two-tier strategy:
  - Global API: 200 requests / 15 minutes per IP.
  - Mutating Routes (`POST`, `PUT`, `DELETE` on `/api/meetings`): 80 requests / 5 minutes per IP.
* **`nodemailer` (`^10.1.2`):** SMTP transport client for automated email delivery and MIME attachment handling.
* **`cors` (`^2.8.6`):** Cross-Origin Resource Sharing handling requests across web ports and Chrome Extension origins (`chrome-extension://*`).

#### Frontend Dependencies (`client/package.json`):
* **`react` & `react-dom` (`^19.2.8`):** UI component foundation.
* **Material Symbols Outlined:** Dynamic font icon library loaded via Google Fonts CDN for zero-overhead vector icons.
* **Inter Font:** Clean executive typography system loaded via Google Fonts.

---

## 4. DIRECTORY STRUCTURE & COMPONENT MAP

```
meetManager/
│
├── .gitignore                          # Root Git exclusion rules
├── Dockerfile                          # Multi-stage container build (Node 20 Slim)
├── package.json                        # Root workspace orchestration scripts
├── README.md                           # Quickstart guide, feature list, and deployment instructions
├── pcs-meet-manager-extension.zip      # Pre-packaged Chrome Manifest V3 extension distribution
│
├── client/                             # Frontend React 19 + Vite Application
│   ├── .gitignore                      # Client-specific Git exclusions
│   ├── index.html                      # Single Page Application HTML shell & font imports
│   ├── package.json                    # Frontend dependencies & build commands
│   ├── package-lock.json               # Deterministic frontend dependency lockfile
│   ├── vite.config.js                  # Vite configuration, network host exposure, and API/WS proxy
│   │
│   ├── public/                         # Static extension & web assets
│   │   ├── background.js               # Manifest V3 service worker (alarms, side panel launcher)
│   │   ├── favicon.svg                 # Application brand vector favicon
│   │   ├── icon-16.png                 # Chrome extension toolbar icon (16x16)
│   │   ├── icon-48.png                 # Chrome extension management icon (48x48)
│   │   ├── icon-128.png                # Chrome extension Web Store / notification icon (128x128)
│   │   └── manifest.json               # Chrome Extension Manifest V3 configuration
│   │
│   ├── scripts/                        # Build & Packaging Tooling
│   │   ├── generate-icons.js           # Pure Node.js script generating PNG icons with raw zlib deflate
│   │   └── package-extension.js        # Post-build packaging script generating extension zip bundle
│   │
│   └── src/                            # Frontend Source Code
│       ├── main.jsx                    # React root initialization (`StrictMode`, `createRoot`)
│       ├── App.jsx                     # Core application orchestrator, state manager, and UI renderer
│       └── App.css                     # Comprehensive design system, themes, and responsive rules
│
└── server/                             # Backend Node.js / Express Application
    ├── .env.example                    # Environment variable template (PORT, SMTP, TURN, DB path)
    ├── package.json                    # Backend dependencies & server launch scripts
    ├── package-lock.json               # Deterministic backend dependency lockfile
    ├── meetings.db                     # Embedded SQLite database (generated at runtime)
    └── server.js                       # Monolithic server: Express REST API, WS Signaling, SQLite, SMTP
```

---

## 5. API ENDPOINTS & DATA FLOW

### 5.1 HTTP REST API Endpoint Map

| Endpoint | Method | Rate Limit Tier | Description |
| :--- | :---: | :---: | :--- |
| `/api/health` | `GET` | Standard (200/15m) | System and SQLite connectivity healthcheck |
| `/api/webrtc/ice-config` | `GET` | Standard (200/15m) | Returns STUN/TURN server list and dynamically resolved public URL |
| `/api/meetings` | `GET` | Standard (200/15m) | Retrieves all items for the tenant specified by `x-workspace-id` |
| `/api/meetings` | `POST` | Strict (80/5m) | Creates item; triggers background RFC 5545 email invite if meeting |
| `/api/meetings/:id` | `PUT` | Strict (80/5m) | Updates existing meeting/task scoped to workspace |
| `/api/meetings/:id` | `DELETE` | Strict (80/5m) | Deletes item scoped to workspace |
| `/api/public/live-meetings` | `GET` | Standard (200/15m) | Public directory of today's meetings with active host/peer counts |
| `/api/public/room-status` | `GET` | Standard (200/15m) | Queries live status, participant count, and waiting queue for `?room=` |
| `/api/rooms/:roomId/messages` | `GET` | Standard (200/15m) | Fetches historical message log (last 300 entries) for specified room |
| `/api/rooms/:roomId/messages` | `POST` | Standard (200/15m) | REST endpoint to persist chat message and broadcast via WebSocket |
| `/api/rooms/:roomId/messages/:messageId` | `DELETE` | Standard (200/15m) | Soft-deletes message (`is_deleted=1`) and broadcasts removal |

---

### 5.2 WebSocket Real-Time Event Protocol (`/ws`)

| Event Type | Direction | Payload Structure | Architectural Function |
| :--- | :---: | :--- | :--- |
| `host-join` | Client $\rightarrow$ Server | `{ type, roomId }` | Registers socket as meeting host; returns `host-ready` and pending queue |
| `join-room` | Client $\rightarrow$ Server | `{ type, roomId }` | Direct zero-boundary entry; notifies existing peers via `peer-joined` |
| `guest-knock` | Client $\rightarrow$ Server | `{ type, roomId, guest: { id, name, officeId } }` | Queues guest in waiting lobby; emits `guest-knock-request` to host socket |
| `admit-guest` | Host $\rightarrow$ Server | `{ type, guestId }` | Admits guest; notifies guest with `guest-admitted` and peers with `peer-joined` |
| `deny-guest` | Host $\rightarrow$ Server | `{ type, guestId, reason }` | Declines guest entry; sends `guest-denied` with dismissal reason |
| `signal` | Bidirectional | `{ type, payload }` | Relays WebRTC SDP Offer, SDP Answer, or ICE Candidate to other room peer(s) |
| `raise-hand` | Client $\rightarrow$ Server | `{ type, isRaised, senderName }` | Broadcasts participant hand-raise notification across room |
| `chat-join` | Client $\rightarrow$ Server | `{ type, roomId }` | Subscribes socket to room chat; broadcasts updated `chat-presence` count |
| `chat-typing` | Client $\rightarrow$ Server | `{ type, roomId, senderName, isTyping }` | Relays ephemeral typing indicator state to room participants |
| `chat-message` | Bidirectional | `{ type, roomId, message: {...} }` | Persists message in SQLite and broadcasts to all room subscribers |
| `chat-delete` | Bidirectional | `{ type, roomId, messageId }` | Updates SQLite soft delete and notifies connected room clients |

---

### 5.3 End-to-End System Data Flows

#### Flow 1: Meeting Creation & Calendar Dispatch
```
[User Form Submit]
       │
       ▼
[apiFetch POST /api/meetings]
       │  (Adds 'x-workspace-id' header)
       ▼
[Express writeLimiter Check] ──(exceeded)──> [HTTP 429 Error]
       │ (passed)
       ▼
[SQLite Prepared INSERT] ───> Write-Ahead Log (WAL) ───> [meetings.db]
       │
       ├────────────────────────────────────────┐
       ▼ (Sync Response)                        ▼ (Async Background Task)
[HTTP 201 Created JSON]                [sendMeetingEmailNotification]
       │                                        │ (Extract attendees regex)
       ▼                                        ▼
[React setItems State Update]          [generateIcsAttachment (RFC 5545)]
       │                                        │
       ▼                                        ▼
[chrome.alarms.create (T - 2min)]      [Nodemailer SMTP Transport]
                                                │
                                                ▼
                                       [Recipient Inbox (.ics)]
```

#### Flow 2: WebRTC Video Call & Gatekeeping Handshake
```
[External Guest]                                [Backend WS Server]                           [Meeting Host]
       │                                                 │                                          │
       │─── 1. Connect WS /ws ──────────────────────────>│                                          │
       │─── 2. 'guest-knock' (Name, OfficeID) ──────────>│                                          │
       │                                                 │─── 3. 'guest-knock-request' ────────────>│
       │<── 4. 'knock-status' (pending) ─────────────────│                                          │
       │                                                 │                                    [Reviews ID]
       │                                                 │<── 5. 'admit-guest' (guestId) ───────────│
       │<── 6. 'guest-admitted' ─────────────────────────│─── 7. 'guest-admitted-ack' ─────────────>│
       │<── 8. 'peer-joined' ────────────────────────────│─── 9. 'peer-joined' ────────────────────>│
       │                                                 │                                          │
       │<══════════════ 10. WebRTC SDP Offer / Answer Exchange ('signal') ═════════════════════════>│
       │<══════════════ 11. ICE Candidate Exchange ('signal') ═════════════════════════════════════>│
       │                                                                                            │
       ▼                                                                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    Direct Peer-to-Peer Encrypted WebRTC Audio / Video Stream                         │
│                    - Web Audio API Analyser monitors RMS audio -> Active Speaker Halo                │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. PROJECT GOALS & NEXT STEPS

### 6.1 Implicit Architectural Goals Discovered in Codebase
1. **Zero-Friction Adoption:** Avoiding forced corporate logins or multi-step account creation for external attendees by implementing zero-boundary quick joins and lightweight knocking lobbies.
2. **Context-Preserving Multi-Tasking:** Designing the UI to thrive inside a 400px-wide Chrome Side Panel without breaking layout integrity, allowing simultaneous call participation and document editing.
3. **Low-Latency Operational Feel:** Favoring optimistic UI updates (0ms perceived latency for task creation, toggling, and chat) with deferred background reconciliation.
4. **Self-Contained Deployment Simplicity:** Avoiding sprawling microservices or external database clusters; the entire application can run on a single container instance with an embedded SQLite file and zero runtime infrastructure dependencies.

---

### 6.2 Technical Debt & Architectural Recommendations

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               RECOMMENDED REFACTORING ROADMAP                          │
├───────────────────────────────────┬────────────────────────────────────────────────────┤
│ Urgent Refactoring (Phase 1)      │ Scalability & Enterprise Hardening (Phase 2)       │
├───────────────────────────────────┼────────────────────────────────────────────────────┤
│ • Modularize client/src/App.jsx   │ • Selective Forwarding Unit (SFU) for WebRTC calls │
│ • Modularize client/src/App.css   │ • Cloud Object Storage for chat image attachments  │
│ • Extract custom React hooks      │ • Cryptographic JWT / Session Multi-Tenancy        │
│ • Standardize API error handler   │ • Database migration tooling & connection pooling  │
└───────────────────────────────────┴────────────────────────────────────────────────────┘
```

#### 1. Monolithic Component Decomposition (`App.jsx`)
* **Current State:** `client/src/App.jsx` is a single file containing **6,718 lines of code** and over 50 individual `useState` hooks. It manages WebRTC connections, chat websockets, calendar calculations, four main views, drag-and-drop file uploads, Pomodoro timers, and modal dialogs.
* **Risk:** High cognitive load, severe merge conflict risks, inefficient React re-rendering passes, and difficult unit testing.
* **Actionable Remediation:**
  Decompose `App.jsx` into modular functional directories:
  - `/src/components/views/`: `CalendarView.jsx`, `TableView.jsx`, `CardsView.jsx`, `AnalyticsView.jsx`, `PublicPortalView.jsx`.
  - `/src/components/webrtc/`: `VideoStage.jsx`, `VideoTile.jsx`, `FloatingDock.jsx`, `KnockLobbyModal.jsx`.
  - `/src/components/chat/`: `GlobalChatDrawer.jsx`, `ChatMessageList.jsx`, `ChatComposer.jsx`, `ImageLightbox.jsx`.
  - `/src/components/modals/`: `CommandPalette.jsx`, `TaskDrawer.jsx`, `QuickJoinModal.jsx`.
  - `/src/hooks/`: `useWebRTC.js`, `useChatSocket.js`, `usePomodoro.js`, `useMeetings.js`.

#### 2. CSS Architecture & Stylesheet Decomposition (`App.css`)
* **Current State:** `client/src/App.css` consists of **6,702 lines** in a single global stylesheet without scoping or modularization.
* **Risk:** Specificity collisions, dead styles, and performance overhead on low-power devices.
* **Actionable Remediation:** Split into CSS Modules (`VideoStage.module.css`, `GlobalChat.module.css`) or adopt Tailwind CSS utility conventions.

#### 3. WebRTC Mesh Bandwidth Scaling ($O(N^2)$)
* **Current State:** Active calling operates on a full mesh P2P topology where every participant sends video and audio streams directly to every other participant.
* **Limitation:** While highly cost-effective and zero-overhead for 2 to 3 participants, CPU and upstream network bandwidth degrade severely at 4+ participants ($N \times (N - 1)$ video streams).
* **Actionable Remediation:** For townhall sessions, integrate a Selective Forwarding Unit (SFU) such as LiveKit or Mediasoup to forward single upstream feeds to multiple subscribers.

#### 4. Binary Storage Optimization in SQLite
* **Current State:** Chat attachments accept base64 image strings up to 15MB, storing them directly into the `attachment_url` TEXT column of the `room_messages` SQLite table.
* **Risk:** Rapid bloat of the SQLite database file, memory consumption spikes during database reads, and high disk I/O.
* **Actionable Remediation:** Offload binary image payloads to an S3-compatible object store (e.g., AWS S3, Cloudflare R2, MinIO) and store lightweight CDN URLs in the database.

#### 5. Multi-Tenant Authentication & Authorization
* **Current State:** Multi-tenancy relies on the client-provided `x-workspace-id` HTTP header without server-side signature validation or user identity tokens.
* **Risk:** A client can spoof the `x-workspace-id` header to view or modify data of another tenant.
* **Actionable Remediation:** Implement proper token-based authentication (JWT or HTTP-only session cookies) containing cryptographically signed workspace claims.

#### 6. Database Replication & Cloud Durability
* **Current State:** Database resides locally on disk (`meetings.db`). In containerized environments like Docker or Render without persistent volumes, container restarts wipe data.
* **Actionable Remediation:** Ensure `DATABASE_PATH` points to a mounted persistent volume, or integrate continuous backup streaming (e.g., Litestream to S3) for continuous zero-downtime replication.
