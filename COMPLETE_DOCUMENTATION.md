# PCS Meet Manager — Complete Codebase & Architectural Guide

Welcome to the comprehensive, all-in-one technical manual for **PCS Meet Manager**. This document is designed to be crystal-clear and easy to understand for developers of all experience levels, while providing complete, unabridged architectural depth covering every file, subsystem, workflow, and data structure in the repository.

---

## Table of Contents
1. [Product Overview & Architectural Philosophy](#1-product-overview--architectural-philosophy)
2. [Complete Directory & File Map](#2-complete-directory--file-map)
3. [Backend Deep Dive (`server/server.js`)](#3-backend-deep-dive-serverserverjs)
   - [3.1 Express App, Security Headers & Rate Limiting](#31-express-app-security-headers--rate-limiting)
   - [3.2 Database Engine & SQLite WAL Architecture](#32-database-engine--sqlite-wal-architecture)
   - [3.3 Real-Time WebSocket Engine & State Architecture](#33-real-time-websocket-engine--state-architecture)
   - [3.4 Automated Email & RFC 5545 `.ics` Calendar Generation](#34-automated-email--rfc-5545-ics-calendar-generation)
   - [3.5 REST API Endpoint Reference](#35-rest-api-endpoint-reference)
4. [Frontend Deep Dive (`client/src/App.jsx`)](#4-frontend-deep-dive-clientsrcappjsx)
   - [4.1 Dual-Runtime Architecture (Web & Chrome Extension)](#41-dual-runtime-architecture-web--chrome-extension)
   - [4.2 Complete State Variable Catalog](#42-complete-state-variable-catalog)
   - [4.3 WebRTC Video Conferencing Engine](#43-webrtc-video-conferencing-engine)
   - [4.4 Active Speaker Detection via Web Audio API](#44-active-speaker-detection-via-web-audio-api)
   - [4.5 Knocking Lobby & Gatekeeping Handshake](#45-knocking-lobby--gatekeeping-handshake)
   - [4.6 Global Online Work Chat & Image Collaboration](#46-global-online-work-chat--image-collaboration)
   - [4.7 Four Core Viewports (Calendar, Table, Cards, Analytics)](#47-four-core-viewports-calendar-table-cards-analytics)
   - [4.8 Executive Productivity Modules](#48-executive-productivity-modules)
   - [4.9 Command Palette (`Ctrl+K`) & Keyboard Shortcuts](#49-command-palette-ctrlk--keyboard-shortcuts)
5. [Styling & Design System (`client/src/App.css`)](#5-styling--design-system-clientsrcappcss)
6. [Chrome Extension Manifest V3 Subsystem](#6-chrome-extension-manifest-v3-subsystem)
   - [6.1 Extension Manifest (`manifest.json`)](#61-extension-manifest-manifestjson)
   - [6.2 Background Service Worker (`background.js`)](#62-background-service-worker-backgroundjs)
   - [6.3 Programmatic Icon Generator (`generate-icons.js`)](#63-programmatic-icon-generator-generate-iconsjs)
   - [6.4 Packaging Script (`package-extension.js`)](#64-packaging-script-package-extensionjs)
7. [Containerization & DevOps (`Dockerfile`)](#7-containerization--devops-dockerfile)
8. [End-to-End Execution & Data Flows](#8-end-to-end-execution--data-flows)
9. [Developer Guide: Running, Testing & Extending](#9-developer-guide-running-testing--extending)
10. [Technical Debt & Recommended Roadmap](#10-technical-debt--recommended-roadmap)

---

## 1. Product Overview & Architectural Philosophy

### 1.1 The Core Mission
Modern knowledge workers and executives typically juggle 4 to 6 separate applications to manage their daily routine:
* A calendar tool (Google Calendar or Outlook) to check meetings.
* A conferencing app (Google Meet, Zoom, or Teams) to attend calls.
* A task manager (Linear, Jira, Todoist, or Notion) to track deliverables.
* A team messenger (Slack or Teams) for real-time collaboration.

**PCS Meet Manager** unifies all these capabilities into a single, high-speed, zero-friction cockpit. It runs either as a **full web application** or docked directly inside Google Chrome as a **Manifest V3 Side Panel Extension** (`chrome.sidePanel`). This allows a user to keep their calendar, action items, work chat, and video calls visible in a persistent sidebar without having to toggle between browser tabs or windows.

### 1.2 Key Architectural Principles
1. **Zero Mandatory Logins for Guests:** Meeting rooms can be joined immediately using a room code or external guest link without requiring attendees to create accounts.
2. **Instant Perceived Speed (Optimistic UI):** When an executive creates a task, marks an item complete, or sends a chat message, the interface updates in $0\text{ ms}$. Network persistence and synchronization take place silently in the background.
3. **Self-Contained Simplicity:** Rather than requiring external microservices, cloud message brokers, or heavy SQL clusters, the entire backend runs in a single Node.js process with an embedded, blazing-fast SQLite database using Write-Ahead Logging (`WAL`).
4. **Resilient Dual Deployment:** The same React frontend codebase compiles to both a standard responsive web build and a Chrome Side Panel extension bundle.

---

## 2. Complete Directory & File Map

```
meetManager/
├── .gitignore                          # Standard git ignores (node_modules, dist, .env, DB files)
├── Dockerfile                          # Multi-stage production container build (Node.js 20 Slim)
├── package.json                        # Root workspace scripts (start, client, server, build, tunnel)
├── pcs-meet-manager-extension.zip      # Production-ready zipped Chrome extension package
├── README.md                           # Quickstart guide and user manual
├── PROJECT_DOCUMENTATION.md            # High-level architecture summary
├── COMPLETE_DOCUMENTATION.md           # This document (comprehensive, granular guide)
│
├── client/                             # React 19 + Vite Frontend Application
│   ├── .gitignore                      # Client-specific git ignore rules
│   ├── index.html                      # HTML5 entry shell; preloads Inter font and Material Symbols
│   ├── package.json                    # Frontend dependencies (React 19, Vite, Oxlint)
│   ├── package-lock.json               # Deterministic frontend lockfile
│   ├── vite.config.js                  # Vite configuration, dev server proxy, and host network binding
│   │
│   ├── public/                         # Static extension & public assets
│   │   ├── background.js               # Manifest V3 Background Service Worker (alarms, side panel)
│   │   ├── favicon.svg                 # SVG brand vector icon
│   │   ├── icon-16.png                 # Extension toolbar icon (16x16)
│   │   ├── icon-48.png                 # Extension manager icon (48x48)
│   │   ├── icon-128.png                # Extension store/notification icon (128x128)
│   │   └── manifest.json               # Chrome Extension Manifest V3 configuration
│   │
│   ├── scripts/                        # Extension Build Utilities
│   │   ├── generate-icons.js           # Binary generator creating store-compliant PNG icons from raw buffers
│   │   └── package-extension.js        # Post-build script archiving client/dist into extension ZIP
│   │
│   └── src/                            # Application Source Code
│       ├── main.jsx                    # React entrypoint: initializes DOM root with React.StrictMode
│       ├── App.jsx                     # Complete application state, views, calling, and chat logic
│       └── App.css                     # Complete stylesheet: responsive layouts, themes, and animations
│
└── server/                             # Node.js + Express + WebSocket Backend
    ├── .env.example                    # Environment configuration template
    ├── package.json                    # Backend dependencies (Express 5, better-sqlite3, ws, helmet)
    ├── package-lock.json               # Deterministic backend lockfile
    ├── meetings.db                     # Embedded SQLite database file (created on launch)
    ├── meetings.db-wal                 # SQLite Write-Ahead Log journal (active runtime)
    ├── meetings.db-shm                 # SQLite shared-memory index for WAL mode
    └── server.js                       # Express REST API, WebRTC WebSocket signaling, SQLite DB, and SMTP
```

---

## 3. Backend Deep Dive (`server/server.js`)

The backend is contained in `server/server.js` (998 lines) and acts as an all-in-one HTTP REST API, WebSocket signaling hub, SQLite storage manager, and SMTP email dispatcher.

### 3.1 Express App, Security Headers & Rate Limiting
* **Port & Environment:** Defaults to port `5000` (`process.env.PORT || 5000`). Checks `process.env.NODE_ENV === 'production'`.
* **Reverse Proxy Trust:** `app.set('trust proxy', 1)` ensures real client IP addresses are correctly extracted when running behind Render, Nginx, Docker, or Cloudflare.
* **Security Headers via Helmet:**
  Uses `helmet()` with a customized Content Security Policy (CSP):
  - `defaultSrc: ["'self'"]`
  - `scriptSrc: ["'self'", "'unsafe-inline'"]`
  - `styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']`
  - `fontSrc: ["'self'", 'https://fonts.gstatic.com']`
  - `connectSrc: ["'self'", 'ws:', 'wss:', 'https://*.google.com']` (allows WebRTC STUN traffic and WebSockets)
  - `mediaSrc: ["'self'", 'blob:']` (allows browser camera/microphone media streams)
  - `imgSrc: ["'self'", 'data:', 'blob:']` (permits base64 image attachments in chat)
  - `crossOriginEmbedderPolicy: false` (prevents cross-origin blocking of external avatars and media)
* **Tiered Rate Limiting (`express-rate-limit`):**
  - **General API Limiter:** 200 requests per 15-minute window per IP applied across `/api/*`.
  - **Mutating Write Limiter:** 80 requests per 5-minute window applied specifically to `POST`, `PUT`, and `DELETE` requests on `/api/meetings`.
* **JSON Body Parser:** Set to `express.json({ limit: '15mb' })` to support direct drag-and-drop base64 image uploads in the work chat.

---

### 3.2 Database Engine & SQLite WAL Architecture
* **Library:** `better-sqlite3` is chosen over asynchronous wrappers because it runs directly on Node.js C++ bindings, delivering ultra-low query latency without microtask event loop delays.
* **Write-Ahead Logging (WAL):**
  ```javascript
  db.pragma('journal_mode = WAL');
  ```
  WAL mode allows multiple concurrent readers to query the database simultaneously without being blocked by ongoing write operations.
* **Configurable Database Path:** Checks `process.env.DATABASE_PATH || path.join(__dirname, 'meetings.db')`. Automatically creates the parent folder if it does not exist (essential for persistent cloud volume mounts like `/data/meetings.db`).
* **Table Schemas:**

  #### 1. `meetings` Table (Tasks & Scheduled Calls)
  | Column | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique item identifier |
  | `title` | `TEXT` | `NOT NULL` | Title of the task or meeting |
  | `date` | `TEXT` | `NOT NULL` | Date in `YYYY-MM-DD` format |
  | `time` | `TEXT` | `NOT NULL` | Time string (e.g., `09:30` or `14:00`) |
  | `link` | `TEXT` | `''` | Room code or external video conference URL |
  | `attendees` | `TEXT` | `''` | Comma/space separated emails of participants |
  | `notes` | `TEXT` | `''` | Agenda items, markdown notes, descriptions |
  | `priority` | `TEXT` | `'Medium'` | `'High'`, `'Medium'`, or `'Low'` |
  | `status` | `TEXT` | `'Pending'` | `'Pending'` or `'Completed'` |
  | `type` | `TEXT` | `'task'` | `'task'` or `'meeting'` |
  | `workspace_id` | `TEXT` | `'default'` | Multi-tenant workspace identifier |
  | `created_at` | `DATETIME` | `CURRENT_TIMESTAMP` | Creation timestamp |

  #### 2. `room_messages` Table (Real-Time Work Chat)
  | Column | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique message ID |
  | `room_id` | `TEXT` | `NOT NULL` | Room channel name (e.g. `'general'`, `'standup'`) |
  | `sender_name` | `TEXT` | `NOT NULL` | Name of the person who posted |
  | `sender_id` | `TEXT` | `'user'` | Client identifier |
  | `content` | `TEXT` | `''` | Text body of the message |
  | `attachment_url`| `TEXT` | `NULL` | Base64 data URI or link of attached image |
  | `attachment_type`| `TEXT` | `'text'` | `'text'`, `'image'`, or `'link'` |
  | `client_msg_id`| `TEXT` | `NULL` | Client-generated ID for idempotent deduplication |
  | `reply_to_id` | `INTEGER` | `NULL` | ID of parent message if threaded |
  | `reply_to_sender`| `TEXT` | `NULL` | Author of parent message |
  | `reply_to_content`| `TEXT` | `NULL` | Content snippet of parent message |
  | `is_deleted` | `INTEGER` | `0` | Soft delete flag (`1` = deleted) |
  | `created_at` | `DATETIME` | `CURRENT_TIMESTAMP` | Message timestamp |

---

### 3.3 Real-Time WebSocket Engine & State Architecture
Mounted directly on the HTTP server at path `/ws`:
```javascript
const wss = new WebSocketServer({ server, path: '/ws' });
```
The server maintains two separate in-memory maps to isolate video calling state from chat state:
1. `rooms = new Map()`: Tracks video calling rooms.
   - Key: `roomId` (e.g., `'standup'`).
   - Value: `{ hostSocket, participants: Set(ws), waitingGuests: Map(guestId, { id, name, officeId, ws, timestamp }) }`.
2. `chatRooms = new Map()`: Tracks work chat subscriptions.
   - Key: `roomId` (e.g., `'general'`).
   - Value: `Set(ws)`.

#### Supported WebSocket Protocol Events:
* `chat-join`: Subscribes socket to a chat room. Calculates online count and broadcasts `chat-presence` to all users in that channel.
* `chat-typing`: Relays `{ senderName, isTyping }` to all other participants in the chat channel.
* `chat-message`: Validates and saves the message into SQLite via `saveRoomMessage()`, then immediately broadcasts the saved record to all subscribers of `chatRooms` and video `rooms`.
* `chat-delete`: Soft-deletes the record in SQLite (`is_deleted = 1`) and sends a `chat-delete` broadcast to clear the message on all screens.
* `host-join`: Identifies the socket as the room host. If guests are already knocking, sends them in a `host-ready` list. Signals any connected peers with `peer-joined`.
* `join-room`: Direct join (zero boundaries). Adds socket to `participants` and notifies peers with `peer-joined`.
* `guest-knock`: Guest requests entry with Full Name and Office ID. Stored in `waitingGuests`. If host is online, host receives `guest-knock-request`. Guest receives `knock-status: pending`.
* `admit-guest`: Host admits a waiting guest. Guest socket is moved from `waitingGuests` to `participants`, receives `guest-admitted`, and triggers WebRTC negotiation via `peer-joined`.
* `deny-guest`: Host denies admission. Guest socket receives `guest-denied` with the host's specified reason and is removed from the queue.
* `signal`: Relays WebRTC signaling data (`RTCSessionDescription` offers/answers and `RTCIceCandidate` packets) directly between peers in the room.
* `raise-hand`: Broadcasts a participant's raised-hand state to everyone in the video call.
* `close`: Cleans up memory. If host leaves, emits `host-left`. If a participant leaves, emits `peer-left`. Updates online counters.

---

### 3.4 Automated Email & RFC 5545 `.ics` Calendar Generation
When a meeting is scheduled via `POST /api/meetings` and contains attendee email addresses:
1. Regex `[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}` parses all valid email addresses.
2. Checks for configured SMTP environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). If not configured, logs a clean skip message.
3. Generates a standard RFC 5545 iCalendar (`.ics`) file attachment on the fly:
   ```ics
   BEGIN:VCALENDAR
   VERSION:2.0
   PRODID:-//PCS Meet Manager//EN
   METHOD:REQUEST
   BEGIN:VEVENT
   UID:pcs-1730346000000@meetmanager.com
   DTSTAMP:20261031T000000Z
   DTSTART:20261031T100000Z
   SUMMARY:Sprint Review
   DESCRIPTION:Agenda details...
   URL:https://meetmanager-p55v.onrender.com?room=sprint-review
   STATUS:CONFIRMED
   END:VEVENT
   END:VCALENDAR
   ```
4. Dispatches an executive HTML email containing meeting details and a direct "Join Video Meeting" button.
5. The `.ics` file is delivered with `contentType: 'text/calendar; charset=utf-8; method=REQUEST'`, prompting Google Calendar, Microsoft Outlook, and Apple Calendar to automatically offer an "Add to Calendar" prompt to the recipient.
6. This entire process runs asynchronously in a detached Promise so the HTTP API response returns in under $5\text{ ms}$.

---

### 3.5 REST API Endpoint Reference

| Method | Endpoint | Description | Query / Body Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck & DB status | None | `{ status: 'ok', database: 'connected' }` |
| `GET` | `/api/webrtc/ice-config` | STUN/TURN server credentials & public URL | None | `{ iceServers: [...], publicUrl: '...' }` |
| `GET` | `/api/meetings` | List all tasks/meetings for workspace | Header: `x-workspace-id` | Array of meeting objects |
| `POST` | `/api/meetings` | Create a new task or meeting | `{ title, date, time, link, attendees, notes, priority, status, type }` | Created meeting object (HTTP 201) |
| `PUT` | `/api/meetings/:id` | Update an existing item | Fields to update | Updated meeting object |
| `DELETE` | `/api/meetings/:id` | Delete an item | ID in path, Header: `x-workspace-id` | `{ message: 'Deleted successfully', id: N }` |
| `GET` | `/api/public/live-meetings`| Public meeting directory for today | None | Array of `{ id, title, roomId, isLive, participantCount }` |
| `GET` | `/api/public/room-status` | Check live status of specific room | `?room=<roomId>` | `{ roomId, isLive, participantCount, hasWaitingQueue }` |
| `GET` | `/api/rooms/:roomId/messages` | Fetch chat history (last 300) | Room in path | Array of message objects |
| `POST` | `/api/rooms/:roomId/messages` | Post chat message via REST | `{ senderName, senderId, content, attachmentUrl, attachmentType, clientMsgId }` | Created message object |
| `DELETE`| `/api/rooms/:roomId/messages/:messageId` | Soft delete chat message | Room & messageId in path | `{ success: true, messageId: N }` |

---

## 4. Frontend Deep Dive (`client/src/App.jsx`)

The entire frontend experience is managed in `client/src/App.jsx` (6,718 lines). It is a comprehensive, self-contained single-page application built on React 19.

### 4.1 Dual-Runtime Architecture (Web & Chrome Extension)
At the very top of `App.jsx`, the code inspects the execution environment:
```javascript
const isChromeExtension = typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';
const DEFAULT_BACKEND_ORIGIN = isChromeExtension ? 'http://localhost:5000' : '';
```
* **Chrome Extension Mode:** Routes all network and WebSocket requests to `http://localhost:5000` or the configured server host.
* **Web Mode:** Uses relative paths (`/api` and `/ws`), which are seamlessly routed to the backend via Vite's proxy during local development, or served directly from the same origin in production.

---

### 4.2 Complete State Variable Catalog
Here is the complete functional reference for the major state variables used inside `App`:

#### Workspace & Persistence
* `workspaceId`: Current multi-tenant workspace key (stored in `localStorage['pcs_workspace_id']`, defaults to `'default'`).
* `items`: Array of all tasks and meetings fetched from `/api/meetings`.
* `loading`: Boolean showing initial skeleton loaders while fetching items.
* `serverOnline`: Boolean indicating whether backend healthcheck succeeded.

#### Filters & Navigation
* `searchTerm`: Current string in global search bar (`[/]`).
* `statusFilter`: Filter for items (`'All'`, `'Pending'`, `'Completed'`).
* `typeFilter`: Filter for item types (`'All'`, `'tasks'`, `'meetings'`).
* `viewMode`: Main workspace view (`'calendar'`, `'table'`, `'cards'`, `'analytics'`).
* `calSubView`: Calendar mode (`'month'` for 30-day grid, `'week'` for 7-day executive sprint board).
* `currentCalendarDate`: The reference date object for calendar navigation.
* `selectedDate`: Currently focused date in `YYYY-MM-DD` format.

#### WebRTC Video Calling
* `activeCallRoom`: Active room ID string when in a call; `null` when idle.
* `isCallConnected`: True when peer WebRTC connection has reached `'connected'` state.
* `isAudioMuted`: Microphone mute toggle (`Ctrl+D`).
* `isVideoOff`: Camera disable toggle (`Ctrl+E`).
* `isScreenSharing`: Active screen capture toggle (`getDisplayMedia`).
* `isCallMinimized`: Enables Picture-in-Picture (PiP) multitasking mode.
* `callStatusText`: Current connection indicator (e.g., `'Connecting to peer...'`, `'Call Active'`).
* `callQuality`: Quality tier indicator (`'connecting'`, `'stable'`, `'relayed'`).
* `callDuration`: Elapsed call time in seconds.
* `isHandRaised`: Local hand-raise toggle.
* `peerHandRaised`: State of remote peer's hand-raise.
* `meetingDrawerTab`: In-call side drawer tab (`null`, `'chat'`, `'people'`, `'info'`).
* `meetingLayout`: Video stage layout (`'grid'` or `'spotlight'`).
* `pinnedParticipant`: ID of participant pinned to spotlight (`null`, `'local'`, `'remote'`).
* `isLocalSpeaking`: Web Audio API detected local voice activity (green halo).
* `isRemoteSpeaking`: Web Audio API detected remote voice activity (green halo).
* `isCallFullscreen`: Fullscreen stage toggle.

#### Guest Lobby & Knocking Admission
* `isGuestMode`: Automatically enabled if URL contains `?room=...` and user is not host.
* `guestName`: Full name entered by guest (cached in `sessionStorage`).
* `guestOfficeId`: Corporate Office ID entered by guest (cached in `sessionStorage`).
* `guestKnockStatus`: Status of guest admission (`'idle'`, `'knocking'`, `'admitted'`, `'denied'`).
* `guestDeniedReason`: Explanation string shown if host declines admission.
* `isHostOnlineInRoom`: Indicates whether room host is connected and listening.
* `pendingKnocks`: Array of knocking guests displayed to the host for approval.

#### Global Work Chat & Image Collaboration
* `isGlobalChatMode`: Standalone full-screen chat view (`?chat=...`).
* `activeChatRoom`: Currently connected channel code (e.g. `'general'`, `'standup'`).
* `chatMessages`: Message history array for active channel.
* `chatInputText`: Pending text input in message composer.
* `chatAttachment`: Pending file upload `{ url, type, name }`.
* `isRoomChatOpen`: Floating docked chat widget toggle.
* `activeImageLightbox`: Full-resolution image URL currently open in lightbox.
* `replyingTo`: Quoted message reference `{ id, sender, content }`.
* `chatOnlineCount`: Live participant count in current chat room.
* `typingUsers`: Array of usernames actively typing in room.
* `isDraggingOverChat`: Drag-and-drop file hover highlight state.
* `unreadWhileScrolled`: Counter of incoming messages received while user was scrolled up.

#### Executive Productivity Modules
* `focusSprintSeconds`: Remaining seconds in active 25-minute Pomodoro sprint.
* `isSprintActive`: Active Pomodoro sprint countdown toggle.
* `dismissTriage`: Dismiss state for morning overdue items banner.
* `isPaletteOpen`: Global command palette modal toggle (`Ctrl+K`).
* `paletteQuery`: Search query inside command palette.

---

### 4.3 WebRTC Video Conferencing Engine
The calling engine is implemented natively using the browser's `RTCPeerConnection` API without heavy third-party SDKs.
* **Initialization (`createPeerConnection`):**
  1. Requests ICE configuration from `/api/webrtc/ice-config` to discover Google STUN servers and any custom TURN relays.
  2. Creates `new RTCPeerConnection(rtcConfig)`.
  3. Registers `onicecandidate`: whenever a candidate is discovered, it is packaged into a `{ type: 'signal', payload: { candidate } }` WebSocket message and forwarded to the peer.
  4. Registers `ontrack`: attaches incoming audio/video tracks to the remote video HTML element (`remoteVideoRef.current.srcObject = event.streams[0]`).
  5. Acquires local user media via `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` and attaches tracks via `pc.addTrack()`.
* **Spotlight & Grid Layouts:**
  Executives can click the spotlight pin icon on any video tile. When pinned, that participant expands to fill the primary stage, while other participants collapse into a neat thumbnail strip along the right side.
* **Screen Sharing:**
  Toggled with one click or shortcut. Invokes `navigator.mediaDevices.getDisplayMedia({ video: true })`. The screen track dynamically replaces the camera track on the active WebRTC sender without dropping the call. When screen sharing stops, the camera track is automatically restored.

---

### 4.4 Active Speaker Detection via Web Audio API
To replicate Google Meet's green glowing speaker halo:
1. When local microphone or remote audio streams become active, an `AudioContext` is created.
2. An `AnalyserNode` is connected to the media stream source with an FFT size of 512.
3. Every 100 milliseconds, an analysis loop (`checkVolume()`) calculates the Root-Mean-Square (RMS) volume of the audio buffer:
   ```javascript
   let sum = 0;
   for (let i = 0; i < bufferLength; i++) {
     const val = (dataArray[i] - 128) / 128;
     sum += val * val;
   }
   const rms = Math.sqrt(sum / bufferLength);
   ```
4. If `rms > 0.08`, `setIsLocalSpeaking(true)` or `setIsRemoteSpeaking(true)` is triggered, which dynamically applies the `active-speaker-halo` glowing CSS class to the participant's video container.

---

### 4.5 Knocking Lobby & Gatekeeping Handshake
To prevent unauthorized entry into executive video calls:
1. **Guest Joins:** Navigating to `?room=board-meeting` presents the guest admission screen.
2. **Identification:** The guest enters their Full Name and Corporate Office ID.
3. **Knock Dispatch:** The guest clicks "Knock to Enter". The client sends:
   ```json
   {
     "type": "guest-knock",
     "roomId": "board-meeting",
     "guest": { "name": "Sarah Connor", "officeId": "PCS-8841" }
   }
   ```
4. **Host Alert:** If the host is currently in the room, an admission card immediately slides onto the host's screen showing the guest's credentials.
5. **Admission / Decline:**
   - If the host clicks **Admit**, the server sends `guest-admitted` to the guest, and both sides begin exchanging WebRTC SDP offers and answers.
   - If the host clicks **Decline**, the server sends `guest-denied`, and the guest's screen displays a polite notice explaining that entry was declined.

---

### 4.6 Global Online Work Chat & Image Collaboration
* **Dedicated Full View vs Floating Dock:** Chat can be accessed either as a full-screen view (`?chat=general`) or as a floating dock minimized in the bottom right corner of the dashboard.
* **Drag-and-Drop & Clipboard Image Uploads:**
  Users can drag any image file over the chat window or simply press `Ctrl+V` with an image in their clipboard. The `handlePasteEvent` or `handleChatDrop` reads the file with `FileReader.readAsDataURL()` and attaches it to the message as a base64 payload.
* **Full-Resolution Lightbox:**
  Clicking any image inside chat opens a full-screen modal lightbox (`activeImageLightbox`) allowing users to inspect diagrams, mockups, or screenshots at original resolution.
* **Sound Synthesizer Notification:**
  When a new message arrives from a colleague, `playChatNotificationSound()` creates a 0.15-second melodic sine-wave chime using the browser's Web Audio `OscillatorNode`, giving an immediate audible notification without needing any external `.mp3` assets.

---

### 4.7 Four Core Viewports (Calendar, Table, Cards, Analytics)
The application offers 4 viewing perspectives accessible via top tabs or keyboard shortcuts `1`, `2`, `3`, `4`:

1. **Calendar View (`1`):**
   - **Month Grid:** Displays all days in the current month. Each date cell shows meeting titles, task counts, and colored density indicator dots representing workload.
   - **7-Day Executive Week Sprint Board:** Switched via sub-tab. Arranges the week across 7 vertical columns, grouping items by time slots for weekly planning.
2. **Table View (`2`):**
   - A high-density spreadsheet-like table. Provides single-click status checkboxes, priority badges, direct video launch buttons, and edit/delete actions.
3. **Cards View (`3`):**
   - A Kanban-style card matrix grouping items by date and status, ideal for visual standup reviews and task status tracking.
4. **Analytics View (`4`):**
   - High-level executive productivity metrics: Total Items, Completion Rate %, Estimated Meeting Load in hours.
   - **90-Day GitHub-Style Activity Heatmap:** Computes completed actions and attended meetings for the past 90 days, rendering an interactive activity matrix.
   - **Active Streak Counter:** Computes consecutive days with completed tasks or meetings.

---

### 4.8 Executive Productivity Modules

#### 1. Morning Overdue Triage Bar
Scans all items where `date < today` and `status === 'Pending'`. If overdue items exist, an amber triage bar appears at the top of the dashboard. Executives can click **"Roll Over All to Today"** (`handleRolloverAllOverdue`) to advance all past-due items to today with a single click.

#### 2. Up Next Focus Hero Banner
Identifies the immediate next scheduled meeting for today. Displays a live countdown timer (`"Starts in 14 minutes"` or `"In progress"`), a 1-click **"Join Call Now"** button, a copyable invite link, and an **"Add to Google Calendar"** shortcut.

#### 3. 25-Minute Pomodoro Focus Sprint
Clicking "Focus Sprint" starts a 25-minute (1,500 seconds) countdown timer. The top header displays a live ticking progress bar, helping executives focus on deep work between meetings. At 0 seconds, a completion chime sounds.

#### 4. Daily Standup Generator (`handleCopyDailyStandup`)
Automatically compiles all workspace data into a formatted Markdown block ready to paste into Slack or Microsoft Teams:
```markdown
*Daily Standup - 31/10/2026*
*Yesterday / Completed:*
- Completed client presentation review
- Finalized Q4 hiring plan

*Today / In Progress:*
- Architecture review with core team
- Review database WAL performance

*Upcoming Meetings:*
- 10:30 AM: Sprint Sync (PCS Meet)
```

#### 5. Meeting Notes-to-Tasks Converter (`handleConvertNotesToTasks`)
Executives often write meeting minutes with action items inside the meeting's `notes` field. This converter scans the notes text for bullet points (`- [ ]`, `*`, `-`, or numbered lists `1.`), splits them into individual tasks, and creates them directly in the workspace.

---

### 4.9 Command Palette (`Ctrl+K`) & Keyboard Shortcuts
Pressing `Ctrl+K` or `Cmd+K` opens a global spotlight modal. Users can type to filter both system commands (switching views, starting calls, copying standup) and actual tasks/meetings by title or notes.

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+K` / `Cmd+K` | Open Global Command Palette |
| `Ctrl+D` / `Cmd+D` | Toggle Microphone in call |
| `Ctrl+E` / `Cmd+E` | Toggle Camera in call |
| `T` | Quick Create New Task |
| `M` | Quick Schedule New Meeting |
| `/` | Focus Global Search Input |
| `1` | Switch to Calendar View |
| `2` | Switch to Table View |
| `3` | Switch to Cards View |
| `4` | Switch to Analytics View |
| `Esc` | Close Drawer / Modal / Palette |

---

## 5. Styling & Design System (`client/src/App.css`)

The design system in `client/src/App.css` (6,702 lines) is engineered specifically for executive clarity, tactile responsiveness, and high contrast.

* **Color Palette & CSS Variables:**
  - `--color-blue: #1d4ed8` (Executive royal blue primary)
  - `--color-blue-bg: #eff6ff` (Soft blue accent fill)
  - `--color-green: #16a34a` (Emerald success / online / completed)
  - `--color-green-bg: #f0fdf4` (Soft green accent fill)
  - `--color-red: #dc2626` (Danger / call hangup / overdue)
  - `--color-black: #000000` (High contrast primary text and borders)
  - `--border-black: #000000` (Crisp 1.5px high-contrast borders)
* **Neo-Brutalist Tactical Aesthetics:**
  Buttons and cards feature subtle box shadows (`box-shadow: 2px 2px 0 var(--border-black)`), giving interactive elements an immediate, tangible feel.
* **Responsive Breakpoints:**
  - `@media (max-width: 900px)`: Switches 2-column executive workspace into a stacked 1-column layout.
  - `@media (max-width: 600px)`: Optimizes padding, adjusts video grids for mobile screens, and activates the sticky mobile quick-action dock (`.mobile-action-bar`).
* **Side Panel Optimization:**
  Special styles ensure that when rendered inside a 400px-wide Chrome Side Panel, grids collapse cleanly, headers remain accessible, and dialogs fit without horizontal scrolling.

---

## 6. Chrome Extension Manifest V3 Subsystem

PCS Meet Manager includes a full Manifest V3 Chrome Extension located in `client/public/`.

### 6.1 Extension Manifest (`client/public/manifest.json`)
```json
{
  "manifest_version": 3,
  "name": "PCS Meet Manager",
  "version": "1.0.0",
  "description": "Executive meeting manager, independent WebRTC video calls, calendar sync, and action item tracker with native Chrome Side Panel integration.",
  "action": {
    "default_title": "Open PCS Meet Manager Side Panel",
    "default_icon": { "16": "icon-16.png", "48": "icon-48.png" }
  },
  "side_panel": {
    "default_path": "index.html"
  },
  "permissions": [
    "sidePanel",
    "alarms",
    "notifications",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "http://localhost:5000/*",
    "http://127.0.0.1:5000/*",
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icon-16.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  }
}
```

---

### 6.2 Background Service Worker (`client/public/background.js`)
Contains 3 core listeners:
1. **Click Action Listener:**
   Sets `openPanelOnActionClick: true` via `chrome.sidePanel.setPanelBehavior()`, ensuring that clicking the extension toolbar icon immediately opens the side panel.
2. **Pre-Meeting Desktop Alarm Listener:**
   Listens for alarms prefixed with `meet-alert:`. Triggers a high-priority Chrome desktop notification 2 minutes before the meeting starts:
   `"Meeting Title starts in 2 minutes."`
3. **Notification Click Listener:**
   When the user clicks the desktop notification, the background script immediately focuses the browser window and opens the PCS Meet Manager side panel.

---

### 6.3 Programmatic Icon Generator (`client/scripts/generate-icons.js`)
Instead of bundling large third-party image manipulation libraries, this script builds valid PNG files from raw memory buffers:
* Computes standard CRC-32 tables and PNG chunk structures (`IHDR`, `IDAT`, `IEND`).
* Generates pixel matrices with charcoal backgrounds (`#09090b`), blue borders (`#1d4ed8`), and emerald center accent dots (`#16a34a`).
* Compresses scanlines with Node's native `zlib.deflateSync()`.
* Generates store-compliant `icon-16.png`, `icon-48.png`, and `icon-128.png` in seconds.

---

### 6.4 Packaging Script (`client/scripts/package-extension.js`)
Automates building and distributing the extension:
* Verifies that `client/dist` exists (or reminds the developer to run `npm run build`).
* On Windows, invokes `Compress-Archive` via PowerShell. On Linux/macOS, invokes `zip -r`.
* Produces the distributable archive `pcs-meet-manager-extension.zip` in the project root.

---

## 7. Containerization & DevOps (`Dockerfile`)

The project includes an optimized multi-stage production Dockerfile:

```dockerfile
# Multi-stage production Dockerfile for PCS Meet Manager
FROM node:20-slim AS builder

WORKDIR /app

# Build Client
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# Production Server Runner
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install Server Dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy Built Client Assets and Server Code
COPY --from=builder /app/client/dist ./client/dist
COPY server/ ./server/

EXPOSE 5000

CMD ["node", "server/server.js"]
```

### Why this design is enterprise-grade:
* **Minimal Attack Surface:** Uses `node:20-slim` Debian base, discarding unnecessary build utilities.
* **Zero DevDependencies in Production:** The runner stage executes `npm ci --omit=dev`, leaving out compilers and test tools.
* **Single Container Deployment:** The Express server automatically serves the built static frontend assets from `client/dist` when `NODE_ENV === 'production'`, eliminating the need for a separate frontend container or reverse proxy.

---

## 8. End-to-End Execution & Data Flows

### Flow A: Meeting Scheduling & Calendar Synchronization
```
[User Clicks "+ Schedule"]
          │
          ▼
[Fills Form: Title, Date, Time, Attendees, Notes]
          │
          ▼
[App.jsx handleSubmit] ──(Optimistic 0ms local state update)──> [UI updates immediately]
          │
          ▼
[apiFetch POST /api/meetings]
          │ (Attaches 'x-workspace-id' header)
          ▼
[Express Server /server.js]
          │
          ├──> [Rate Limiter Check (80/5m)]
          │
          ├──> [SQLite: INSERT INTO meetings ...] ──> [meetings.db in WAL mode]
          │
          ├──> [Async: sendMeetingEmailNotification]
          │          │
          │          ├──> Regex extracts email recipients
          │          ├──> generateIcsAttachment builds RFC 5545 .ics payload
          │          └──> Nodemailer dispatches HTML invite via SMTP
          │
          └──> Returns HTTP 201 Created with new row JSON
                    │
                    ▼
          [App.jsx receives response]
                    │
                    ▼
          [scheduleExtensionAlarms]
                    │
                    ▼
          [chrome.alarms.create("meet-alert:Title", triggerAt = T - 2 min)]
```

---

### Flow B: WebRTC Video Call Signaling & Admission Handshake
```
[External Guest (?room=alpha)]                     [Node.js WebSocket (/ws)]                     [Host in Executive App]
              │                                                │                                            │
              │─── 1. Connects WS ────────────────────────────>│                                            │
              │─── 2. 'guest-knock' (Name, OfficeID) ─────────>│                                            │
              │                                                │─── 3. 'guest-knock-request' ──────────────>│
              │<── 4. 'knock-status' (pending) ────────────────│                                            │
              │                                                │                                      [Clicks "Admit"]
              │                                                │<── 5. 'admit-guest' (guestId) ─────────────│
              │<── 6. 'guest-admitted' ────────────────────────│                                            │
              │<── 7. 'peer-joined' ───────────────────────────│─── 8. 'peer-joined' ──────────────────────>│
              │                                                │                                            │
              │<═══════════════ 9. WebRTC SDP Offer / Answer ('signal') ═══════════════════════════════════>│
              │<══════════════ 10. ICE Candidates Exchange ('signal') ═════════════════════════════════════>│
              │                                                                                             │
              ▼                                                                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            Encrypted Peer-to-Peer Audio / Video Streaming                                    │
│                            Web Audio API Analyser detects RMS volume -> Active Speaker Halo                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Developer Guide: Running, Testing & Extending

### 9.1 Local Development Setup

#### 1. Start the Backend Server (Terminal 1)
```bash
npm run server
```
* Starts Express and WebSocket server on `http://localhost:5000`.
* Creates `server/meetings.db` automatically if not present.
* Uses `node --watch server.js` for automatic reloads on file changes.

#### 2. Start the Frontend Dev Server (Terminal 2)
```bash
npm run client
```
* Starts Vite development server on `http://localhost:5173`.
* Network host exposure is enabled (`host: true`), allowing testing from your phone on local Wi-Fi.

#### 3. Instant Public HTTPS Tunnel (Terminal 3)
```bash
npm run tunnel
```
* Uses LocalTunnel to expose port `5000` to an external HTTPS URL (e.g., `https://random.loca.lt`).
* Perfect for testing WebRTC video calls across two different devices.

---

### 9.2 Building and Installing the Chrome Extension
1. Run the package command from the root directory:
   ```bash
   npm run package:extension
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `client/dist` directory (or unzip `pcs-meet-manager-extension.zip` and select that folder).
5. Pin **PCS Meet Manager** to your browser toolbar. Click it to open the side panel.

---

### 9.3 Environment Variables Reference (`server/.env`)
Copy `server/.env.example` to `server/.env` to configure optional production settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Public Base URL for email invite links & guest joins
PUBLIC_URL=https://meetmanager-p55v.onrender.com

# Optional Cloud Persistent Database Path
DATABASE_PATH=/data/meetings.db

# Optional WebRTC TURN Server Relay (for corporate VPNs & symmetric NATs)
TURN_URL=turn:turn.example.com:3478
TURN_USERNAME=myuser
TURN_CREDENTIAL=mypassword

# Optional SMTP Email Configuration (for automated email invites)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=myemail@gmail.com
SMTP_PASS=my-app-password
SMTP_FROM="PCS Meet Manager" <no-reply@pcsmeet.com>
```

---

## 10. Technical Debt & Recommended Roadmap

### 1. Refactor Monolithic Components (`App.jsx`)
* **Current State:** `client/src/App.jsx` contains 6,718 lines of code and ~50 state variables in a single component.
* **Target Architecture:**
  ```
  client/src/
  ├── components/
  │   ├── webrtc/      # VideoStage, VideoTile, FloatingDock, KnockLobby
  │   ├── chat/        # ChatDrawer, ChatMessageList, ChatComposer, Lightbox
  │   ├── views/       # CalendarView, TableView, CardsView, AnalyticsView
  │   └── modals/      # CommandPalette, TaskDrawer, QuickJoinModal
  └── hooks/           # useWebRTC, useChatSocket, usePomodoro, useMeetings
  ```

### 2. Refactor Global Stylesheet (`App.css`)
* **Current State:** `client/src/App.css` contains 6,702 lines in a single global stylesheet.
* **Target Architecture:** Adopt CSS Modules (`VideoStage.module.css`, `Chat.module.css`) or migrate to Tailwind CSS to ensure component encapsulation.

### 3. Offload Chat Image Attachments from SQLite
* **Current State:** Images are stored directly in SQLite as base64 strings up to 15MB.
* **Target Architecture:** Upload image files directly to an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO) and store lightweight public URLs in the database.

### 4. Upgrade WebRTC Mesh to SFU for Large Calls
* **Current State:** Active calling operates on a full mesh P2P topology ($O(N^2)$ network connections).
* **Target Architecture:** For groups larger than 4 participants, incorporate a Selective Forwarding Unit (SFU) like LiveKit or Mediasoup to reduce upstream bandwidth.

### 5. Multi-Tenant Cryptographic Authentication
* **Current State:** Workspaces are partitioned by an unauthenticated client header (`x-workspace-id`).
* **Target Architecture:** Implement signed JWTs or session cookies to ensure secure tenant isolation in corporate enterprise deployments.
