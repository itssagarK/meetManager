# 📑 PCS Meet Manager — Complete System Architecture & Documentation

<div align="center">

![PCS Meet Manager Banner](images/sidepanel.png)

### **Executive Productivity Workspace • Zero-Boundary WebRTC Calling • Chrome Side Panel (MV3)**

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Chrome%20Extension%20MV3-blue.svg)](https://meetmanager-p55v.onrender.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61dafb.svg)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%2020%20%2B%20Express%205-339933.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57.svg)](https://sqlite.org/)
[![Signaling](https://img.shields.io/badge/Realtime-WebSockets%20(ws)-010101.svg)](https://github.com/websockets/ws)
[![Calling](https://img.shields.io/badge/Video-WebRTC%20Mesh%20%2B%20Web%20Audio-FF6F00.svg)](https://webrtc.org/)

**[🌐 Live Production Demo](https://meetmanager-p55v.onrender.com)** • **[🎓 Beginner's Study Guide](STUDY_GUIDE.md)** • **[🚀 Quickstart Guide](#15-installation-local-development--deployment-guide)** • **[📊 API Reference](#11-complete-rest-api-specification-reference)** • **[🔌 WebSocket Events](#12-complete-websocket-event-protocol-specification-ws)**

</div>

---

## 🧭 Navigation Index

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Visual Interface Gallery](#2-visual-interface-gallery)
3. [High-Level Architecture & System Flowchart](#3-high-level-architecture--system-flowchart)
4. [End-to-End System Working Analysis & Entity-Relationship (ER) Architecture](#4-end-to-end-system-working-analysis--entity-relationship-er-architecture)
5. [WebRTC Multi-Peer Mesh Calling Engine](#5-webrtc-multi-peer-mesh-calling-engine)
6. [Corporate Knocking Lobby & Gatekeeping Handshake](#6-corporate-knocking-lobby--gatekeeping-handshake)
7. [Global Real-Time Chat & Asset Collaboration](#7-global-real-time-chat--asset-collaboration)
8. [Automated RFC 5545 Calendar Email Pipeline](#8-automated-rfc-5545-calendar-email-pipeline)
9. [Chrome Extension Manifest V3 & Desktop Alarms](#9-chrome-extension-manifest-v3--desktop-alarms)
10. [Executive Productivity Cockpit & Viewports](#10-executive-productivity-cockpit--viewports)
11. [Complete REST API Specification Reference](#11-complete-rest-api-specification-reference)
12. [Complete WebSocket Event Protocol Specification (`/ws`)](#12-complete-websocket-event-protocol-specification-ws)
13. [Security, Hardening & Compliance Architecture](#13-security-hardening--compliance-architecture)
14. [Environment Configuration Reference](#14-environment-configuration-reference)
15. [Installation, Local Development & Deployment Guide](#15-installation-local-development--deployment-guide)
16. [Troubleshooting & Frequently Asked Questions (FAQ)](#16-troubleshooting--frequently-asked-questions-faq)
17. [Strategic Engineering Roadmap](#17-strategic-engineering-roadmap)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Workplace Context: The "Tab-Switching Tax"
Modern knowledge workers, executives, and distributed software engineering teams suffer from acute workflow fragmentation. Completing a single working day typically requires juggling four or five disconnected applications:

* **Video Conferencing Tools** (Google Meet, Zoom, Teams): Operate in isolated browser tabs, require pre-generated links, authentication screens, and separate calendar invites.
* **Task Management Systems** (Linear, Jira, Todoist, Asana): Disconnected from active meetings; commitments and action items made during calls are frequently forgotten.
* **Team Messaging** (Slack, Microsoft Teams): Siloed from project agendas, making screenshot sharing and document coordination cumbersome.
* **Calendar Schedulers** (Google Calendar, Outlook): Inconvenient to check during active work sessions without leaving the current workspace.

### 1.2 The Solution: PCS Meet Manager
**PCS Meet Manager** unifies these critical workflows into a single, high-speed, zero-friction executive cockpit. It operates in two complementary modes:

1. **Standalone Responsive Web Application:** A full-featured web app running in any modern browser on desktop, tablet, or mobile.
2. **Persistent Chrome Manifest V3 Side Panel (`chrome.sidePanel`):** Docks directly into the browser viewport beside active code, pull requests, or documents, eliminating tab-switching entirely.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PCS MEET MANAGER COCKPIT                           │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  Video Conferencing  │  Executive Cockpit   │  Real-Time Collaboration      │
│  • WebRTC P2P Mesh   │  • Month Calendar    │  • Global Online Chat Rooms   │
│  • Active Audio Halo │  • Sprint Table View │  • Threaded Quoted Replies    │
│  • Knocking Lobby    │  • Kanban Cards View │  • In-Line Image Lightbox     │
│  • Spotlight Mode    │  • Analytics Heatmap │  • Typing & Presence Counters │
│  • Picture-in-Picture│  • Daily Standup Gen │  • RFC 5545 .ics Calendar Sync│
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

> [!NOTE]
> **Zero-Boundary Philosophy**: Anyone can join a video meeting or public chat room using an instant room code (`?room=code`). No sign-up, registration, or password creation is required for guests.

---

## 2. Visual Interface Gallery

PCS Meet Manager features eight carefully designed interfaces tailored for desktop monitors and narrow Chrome Side Panel dimensions.

### 2.1 Video Conferencing & Security Gatekeeping

| WebRTC Multi-User Calling | Corporate Knocking Lobby |
| :---: | :---: |
| ![WebRTC Calling](images/call.png) | ![Knocking Lobby](images/lobby.png) |
| *Multi-peer video calling with dynamic grids, active speaker halo, floating dock, and collapsible drawer.* | *Two-phase guest verification requiring Full Name & Office ID with host admit/deny controls.* |

### 2.2 Operational Viewports

| Month & Week Calendar View | Sprint Table View |
| :---: | :---: |
| ![Calendar View](images/calendar.png) | ![Table View](images/table.png) |
| *30-day interactive month grid with activity density indicators and 7-day executive sprint view.* | *High-density table with sortable columns, inline status toggling, and priority tags.* |

### 2.3 Collaboration & Metrics

| Global Real-Time Work Chat | Executive Analytics & Metrics |
| :---: | :---: |
| ![Work Chat](images/chat.png) | ![Analytics View](images/analytics.png) |
| *Instant messaging with live presence, typing bubbles, quoted replies, and image lightbox.* | *Completion rates, estimated weekly meeting hours, 90-day activity heatmap, and streak tracking.* |

### 2.4 Multitasking & Cards

| Chrome Side Panel (MV3) | Kanban Cards View |
| :---: | :---: |
| ![Chrome Side Panel](images/sidepanel.png) | ![Cards View](images/cards.png) |
| *Persistent 400px side panel docked next to active browser tabs with auto-call detection.* | *Visual card overview with priority indicators, markdown notes, and one-click launch links.* |

---

## 3. High-Level Architecture & System Flowchart

The system is constructed as a **Modular Full-Stack Monolith with Dual-Runtime Client Deployment and Unified Real-Time Signaling**.

```mermaid
flowchart TD
    subgraph ClientRuntime["Client Layer (React 19 + Vite 8)"]
        WebSPA["Web Single Page App\n(Responsive Viewports)"]
        ChromeExt["Chrome Side Panel Extension\n(Manifest V3 / background.js)"]
    end

    subgraph SecurityGateway["Security & Ingress Gateway"]
        HelmetHeaders["Helmet Enterprise Security Headers\n(CSP, X-Frame-Options, HSTS)"]
        RateLimits["Two-Tier Rate Limiting & ETag Caching\n(2,500 req/15min API & 300 req/5min Write\nLAN/Localhost Whitelisted)"]
        CORSControl["CORS Policy Handler\n(Web Origins & chrome-extension://)"]
    end

    subgraph ServerCore["Backend Application Engine (Express 5 + Node.js 20)"]
        RESTControllers["REST API Controllers\n(/api/meetings, /api/rooms, /api/public)"]
        SignalingEngine["WebSocket Signaling Server (/ws)\n(WebRTC Mesh, Lobby, Realtime Chat)"]
        EmailWorker["Asynchronous SMTP Dispatcher\n(Nodemailer + RFC 5545 .ics Calendar)"]
    end

    subgraph DataStorage["Data & State Persistence"]
        SQLiteEngine[("SQLite Database (WAL Mode)\nmeetings.db")]
        MemoryRooms["In-Memory State Maps\n(rooms, participants, waitingGuests)"]
    end

    subgraph ExternalNetwork["External Infrastructure & Peers"]
        SMTPRelay["Corporate SMTP Server\n(Google / Microsoft / Sendgrid)"]
        STUNTURN["STUN / TURN Relays\n(Google STUN + Coturn Server)"]
        RemotePeers["Remote WebRTC Peer Browsers\n(DTLS-SRTP Audio/Video Stream)"]
    end

    WebSPA --> SecurityGateway
    ChromeExt --> SecurityGateway
    ChromeExt -. "Desktop Pre-Meeting Alarms" .-> ChromeExt

    SecurityGateway --> RESTControllers
    SecurityGateway --> SignalingEngine

    RESTControllers --> SQLiteEngine
    RESTControllers -. "Trigger Async Invite" .-> EmailWorker
    EmailWorker --> SMTPRelay

    SignalingEngine --> MemoryRooms
    SignalingEngine --> SQLiteEngine
    SignalingEngine -. "ICE Candidate Exchange" .-> STUNTURN
    WebSPA <== "Encrypted P2P Media (Mesh)" ==> RemotePeers
```

### 3.1 Architectural Pillars

1. **Dual-Runtime Client:** A single React 19 codebase dynamically detects whether it is running in a standard browser tab or inside Google Chrome's `chrome.sidePanel` via `window.location.protocol === 'chrome-extension:'`. It applies specialized CSS layouts for constrained widths (360px–420px).
2. **Local-First Optimistic UI:** Client-side updates occur at $0\text{ ms}$ perceived latency. State mutations are reflected immediately in the UI while synchronization takes place in the background.
3. **Synchronous C++ Database Execution:** Embedded SQLite powered by `better-sqlite3` runs directly against C++ SQLite APIs without the overhead of thread-pool context switches. Write-Ahead Logging (`WAL`) allows concurrent reads while writes take place.
4. **Zero-Dependency Real-Time Signaling:** Standard Node.js `ws` library handles WebSockets for WebRTC SDP signaling, room presence, chat events, and lobby admission over port 5000.

### 3.2 Modular Frontend Component Architecture & Directory Structure

The frontend application has been decoupled into modular, reusable, and maintainable components organized by domain:

```
client/src/
├── App.jsx                               # Master Application State Orchestrator (~3.9k lines)
├── App.css                               # Unified responsive & theme stylesheet
├── config/
│   └── constants.js                      # Environment detection, API endpoints, RTC STUN/TURN, default schemas
├── utils/
│   └── dateUtils.js                      # Date chips, humanized time labels, meeting duration formatters
├── hooks/
│   ├── useAgendaTimer.js                 # In-call agenda timeboxing, countdown, Web Audio chimes & step navigation
│   ├── useSpeakerQueue.js                # FIFO hand-raise queue, speaker countdown & floor turn-taking management
│   ├── useFileTransfer.js                # WebRTC RTCDataChannel P2P file & document streaming engine
│   ├── useWhiteboard.js                  # Collaborative whiteboard canvas, normalized coordinates & laser pointers
│   └── useMeetingRecorder.js             # Client-side audio/video mixing & MediaRecorder pipeline
└── components/
    ├── common/                           # Shared Atomic UI Blocks
    │   ├── RemoteParticipantTile.jsx     # Memoized video tile with audio halo, floor badge & pin indicators
    │   ├── ImageLightbox.jsx             # Fullscreen interactive work asset viewer
    │   └── Toast.jsx                     # Non-blocking animated alert banners
    ├── chat/                             # Global Collaboration & Real-Time Messaging
    │   ├── ChatMessageContent.jsx        # Rich message parser (URL auto-linker, quotes, lightbox hooks)
    │   └── FloatingChatDock.jsx          # Reusable floating chat dock (Dashboard, Lobby, and Portal)
    ├── views/                            # Primary Application Screen Views
    │   ├── CalendarView.jsx              # Month grid & 7-day sprint board with density indicators
    │   ├── TableView.jsx                 # Sortable, filterable enterprise data table
    │   ├── CardsView.jsx                 # Responsive card grid for meetings & tasks
    │   ├── AnalyticsView.jsx             # 90-day consistency heatmap & sprint metrics
    │   ├── DayScheduleSidebar.jsx        # Right-hand daily schedule drawer & quick actions
    │   ├── PublicPortalView.jsx          # Standalone public read-only directory (?public=1)
    │   ├── GlobalChatView.jsx            # Dedicated full-viewport team chat (?chat=room)
    │   └── GuestLobbyView.jsx            # Zero-install guest check-in & knocking lobby
    ├── modals/                           # Interactive Dialogs & Drawers
    │   ├── ItemDrawer.jsx                # Right-sliding task & meeting creation/editor drawer
    │   ├── CommandPalette.jsx            # Ctrl+K spotlight search & quick action navigation
    │   ├── QuickJoinModal.jsx            # Instant direct room access (Call & Chat)
    │   ├── CreateRoomModal.jsx           # Global work collaboration room creator
    │   ├── HostKnockModal.jsx            # Host gatekeeper admission approval dialog
    │   └── RecordingModal.jsx            # In-call meeting recording review, player & export dialog
    └── conference/                       # Real-Time WebRTC Calling Engine
        ├── AgendaQueuePanel.jsx          # In-call Agenda Timebox checklist & Speaker Turn-Taking FIFO queue drawer
        ├── FileTransferPanel.jsx         # P2P encrypted file dropper, transfer progress & instant downloader
        ├── WhiteboardOverlay.jsx         # Interactive collaborative canvas, shapes, sticky notes & laser stage
        └── ConferenceOverlay.jsx         # Google Meet calling stage, PiP mode, top bar agenda pill & pill dock controls
```

---

## 4. End-to-End System Working Analysis & Entity-Relationship (ER) Architecture

### 4.1 In-Depth Subsystem Working Analysis
To understand how data flows and how entities interact across PCS Meet Manager, the system can be decomposed into seven tightly integrated operational subsystems:

#### 1. Multi-Tenant Workspace Partitioning Engine
* **Isolation Scope:** Every schedule record and meeting item belongs to a specific tenant workspace, tracked by `workspace_id`.
* **Runtime Resolution:** The client detects or initializes a persistent workspace ID in `localStorage` (`mm_workspace_id`) and attaches it to all outbound HTTP requests via the `x-workspace-id` header.
* **Database Isolation:** SQLite queries strictly scope mutations and reads (`WHERE workspace_id = ?`), preventing data leaks between distinct client sessions, teams, or testing environments.

#### 2. Unified Schedule & Action Items Engine
* **Single-Table Design:** Rather than maintaining disparate tables for calendar events and to-do items, the `meetings` table unifies both concepts using the `type` column discriminator (`'meeting'` vs `'task'`).
* **Intelligent Auto-Classification:** If a user submits a quick entry without explicitly setting a type, the server inspects the payload: if a video conference link or email attendees are provided, the system auto-promotes the item to a `'meeting'`, otherwise categorizing it as a `'task'`.
* **Productivity Lifecycle Automations:**
  - **24-Hour Standup Digest:** Aggregates all completed tasks from the preceding 24 hours, alongside today's agenda, outputting formatted Markdown for Slack/Teams.
  - **25-Minute Pomodoro Focus Intervals:** State machine tracking 25-minute sprint timers with pause/resume and notification chimes.
  - **Morning Overdue Triage:** Flags items where `date < todayStr` and `status == 'Pending'`, exposing a single-click "Roll All to Today" bulk update.
  - **Notes-to-Tasks Conversion:** Regex scanner parsing Markdown checklists (`- [ ]`) inside meeting agendas, spawning discrete child task records.

#### 3. WebRTC Decentralized P2P Mesh Video Calling Subsystem
* **Mesh Network Topology:** Avoids expensive central media servers (SFU/MCU). For a room with $N$ participants, $N \times (N-1) / 2$ direct encrypted DTLS-SRTP peer connections are formed.
* **Deterministic Signaling Protocol:** Operates over WebSockets (`/ws`). When a new peer enters, the server transmits `room-users`. The new peer acts as the offering initiator (`isInitiator = true`) to existing members, while existing peers receive `peer-joined` and wait for offers, guaranteeing zero signaling glare.
* **Client-Side Web Audio Active Speaker Halo:** Eliminates server CPU load by attaching `AnalyserNode` (`fftSize = 256`) instances to each incoming `MediaStream`. If average amplitude exceeds threshold ($> 18$), the peer ID is added to `speakingPeers`, rendering a glowing green aura around their video tile.
* **Adaptive Video Stages:** Dynamic CSS Grid calculations adjust the canvas between 1-tile focus, 50/50 splits, $2 \times 2$, $3 \times 3$, or spotlight filmstrips with docked Picture-in-Picture (PiP) multitasking.

#### 4. Corporate Knocking Lobby & Gatekeeping Handshake
* **Zero-Friction Guest Access:** External attendees access rooms via public links (`?room=<code>`). No sign-up or credentials are required.
* **Two-Phase Security Handshake:**
  1. The guest submits their Full Name and Corporate Office ID (`guest-knock`).
  2. The server records the guest in `room.waitingGuests` and dispatches `guest-knock-request` to the active host socket with a doorbell chime.
  3. The host can either admit, deny, or bulk-admit all waiting guests.
  4. Admitted sockets transition to `room.participants`, emitting `peer-joined` to start WebRTC ICE negotiation.

#### 5. Real-Time Global & In-Call Collaboration Chat
* **Channel & Room Partitioning:** Operates across persistent channels (`general`, `standup`) and transient in-call video rooms.
* **Optimistic Local Delivery & Idempotency:** The client creates a local UUID `client_msg_id` and renders the message in $0\text{ ms}$. If network reconnects cause retries, SQLite's indexed `client_msg_id` guarantees that duplicate inserts are rejected and existing records are safely reconciled.
* **Rich Messaging:** Threaded quote replies (`reply_to_id`, `reply_to_sender`), Base64 image pasting/dropping with full-resolution lightbox viewer, live typing indicators, and soft message deletion (`is_deleted = 1`).
* **Synthesized Audio Notifications:** Incoming messages trigger dual-tone sine-wave chimes (800 Hz / 1000 Hz) created with the browser Web Audio API, avoiding external audio file dependencies.

#### 6. Automated RFC 5545 Calendar Email Pipeline
* **Asynchronous Execution:** When `POST /api/meetings` registers a meeting with attendee emails, the HTTP 201 response returns immediately to ensure snappy UI interaction.
* **Background MIME Construction:** Background worker parses attendee emails using regex, formats an RFC 5545 `.ics` calendar payload with `METHOD:REQUEST`, generates a responsive HTML email with a direct join link, and delivers it via Nodemailer SMTP.

#### 7. Chrome Extension Manifest V3 & Desktop Alarms
* **Persistent Docking:** Uses `chrome.sidePanel` to run in a continuous 400px vertical sidebar beside browser tabs.
* **Pre-Meeting Desktop Alerts:** Evaluates scheduled meetings and registers `chrome.alarms` for $T - 2\text{ minutes}$. When fired, `background.js` triggers a high-priority system notification. Clicking the alert opens the side panel directly into the video room.
* **Contextual Tab Detection:** Queries `chrome.tabs.query()` to detect active Google Meet, Zoom, or Teams tabs, pulling meeting links directly into the scheduling form.

#### 8. Object Storage & Cloud Media Offloader Subsystem (Cloudflare R2 / AWS S3)
* **Zero-Dependency Native AWS SigV4 Signing:** Implemented entirely with Node.js standard libraries (`crypto.createHmac`, `crypto.createHash`, and native `fetch`), avoiding heavy `@aws-sdk/client-s3` runtime bloat while providing complete S3-compatible cloud compatibility.
* **Multi-Driver Architecture:** Configurable via `STORAGE_PROVIDER`:
  - `r2`: Direct integration with Cloudflare R2 object storage with zero egress fees.
  - `s3`: Integration with AWS S3, MinIO, or any S3-compatible cloud bucket.
  - `local`: Automatic fail-safe fallback storing assets in `server/uploads/` with HTTP static serving.
* **Automated Legacy Migration & Vacuuming:** On startup or on-demand (`POST /api/storage/migrate`), the engine scans SQLite messages for legacy Base64 `data:` URIs, uploads the binary buffers to cloud/disk storage, swaps database URLs for lightweight CDN links, records entries in `media_assets`, and runs an atomic SQLite `VACUUM` to reclaim disk space.
* **Transactional Schema Migrations:** Managed through `server/migrations.js` with version tracking in `_schema_migrations`.

---

### 4.2 Physical SQLite Database ER Diagram
This diagram represents the physical relational schema persisted in SQLite via `better-sqlite3` in Write-Ahead Logging (`WAL`) mode.

```mermaid
erDiagram
    _SCHEMA_MIGRATIONS {
        INTEGER id PK "Surrogate Primary Key"
        INTEGER version "Monotonically increasing version (Unique)"
        TEXT name "Migration descriptor"
        DATETIME applied_at "Timestamp of successful execution"
    }

    MEETINGS {
        INTEGER id PK "Surrogate Primary Key (Autoincrement)"
        TEXT title "Meeting subject or task description"
        TEXT date "Target date (YYYY-MM-DD)"
        TEXT time "Target time in 24h format (HH:MM)"
        TEXT link "Video call URL, room code, or external link"
        TEXT attendees "Comma-separated list of email addresses"
        TEXT notes "Markdown formatted agenda items and notes"
        TEXT priority "Categorization: High | Medium | Low"
        TEXT status "Operational state: Pending | Completed"
        TEXT type "Item discriminator: meeting | task"
        TEXT workspace_id "Multi-tenant partition key (Default: default)"
        DATETIME created_at "Record creation timestamp"
    }

    ROOM_MESSAGES {
        INTEGER id PK "Surrogate Primary Key (Autoincrement)"
        TEXT room_id "Channel namespace or room code (Indexed)"
        TEXT sender_name "Display name of message author"
        TEXT sender_id "Unique session or peer identifier"
        TEXT content "Message text body"
        TEXT attachment_url "CDN URL or static asset link"
        TEXT attachment_type "Content classification: text | image"
        TEXT client_msg_id "UUID generated by client for deduplication (Indexed)"
        INTEGER reply_to_id FK "Self-referencing parent message ID"
        TEXT reply_to_sender "Parent sender name for quote banner"
        TEXT reply_to_content "Parent message excerpt"
        INTEGER is_deleted "Soft-delete flag: 0 (Active) | 1 (Deleted)"
        DATETIME created_at "Message timestamp"
    }

    MEDIA_ASSETS {
        TEXT id PK "Unique asset identifier / UUID"
        TEXT original_name "Original upload file name"
        TEXT mime_type "Standard MIME type"
        INTEGER size_bytes "Byte size of payload"
        TEXT provider "Storage provider: r2 | s3 | local"
        TEXT bucket "Target bucket or folder name"
        TEXT key "Object key or storage path"
        TEXT url "Publicly accessible asset URL"
        DATETIME created_at "Timestamp of asset ingestion"
    }

    MEETING_ATTACHMENTS {
        INTEGER id PK "Surrogate Primary Key"
        INTEGER meeting_id FK "References MEETINGS(id)"
        TEXT asset_id FK "References MEDIA_ASSETS(id)"
        DATETIME attached_at "Timestamp"
    }

    ROOM_MESSAGES ||--o{ ROOM_MESSAGES : "replies to (reply_to_id)"
    MEETINGS ||--o{ MEETING_ATTACHMENTS : "has"
    MEDIA_ASSETS ||--o{ MEETING_ATTACHMENTS : "referenced by"
```

---

### 4.3 Full-System Conceptual & Logical Domain ER Diagram
This diagram models the entire domain architecture of PCS Meet Manager. It bridges physical database records, in-memory WebSocket signaling states, WebRTC peer topology, knocking lobby queues, email automation, and Chrome Extension alarms.

```mermaid
erDiagram
    WORKSPACE ||--o{ MEETING : "partitions"
    WORKSPACE ||--o{ ROOM_MESSAGE : "partitions"
    MEETING ||--o{ ATTENDEE : "invites"
    MEETING ||--o| CALENDAR_INVITATION : "dispatches"
    MEETING ||--o| CHROME_ALARM : "schedules"
    MEETING ||--o| CONFERENCE_ROOM : "activates"
    CONFERENCE_ROOM ||--o| HOST_SESSION : "governed by"
    CONFERENCE_ROOM ||--o{ WAITING_GUEST : "queues"
    CONFERENCE_ROOM ||--o{ PEER_PARTICIPANT : "connects"
    PEER_PARTICIPANT ||--o{ P2P_CONNECTION : "establishes"
    CONFERENCE_ROOM ||--o{ ROOM_MESSAGE : "logs"
    ROOM_MESSAGE ||--o{ ROOM_MESSAGE : "threaded replies"
    ROOM_MESSAGE ||--o| MEDIA_ATTACHMENT : "contains"

    WORKSPACE {
        string id PK "Unique workspace identifier"
        string name "Workspace display title"
        string mode "Web runtime or Chrome Side Panel"
    }

    MEETING {
        int id PK "Autoincrement primary key"
        string title "Meeting title or task description"
        string date "Target date (YYYY-MM-DD)"
        string time "Target time in 24h format (HH:MM)"
        string link "Call URL or room code"
        string attendees "Comma-separated email list"
        string notes "Markdown notes or agendas"
        string priority "High, Medium, or Low"
        string status "Pending or Completed"
        string type "meeting or task discriminator"
        string workspace_id FK "Tenant partition foreign key"
        datetime created_at "Timestamp of record creation"
    }

    ATTENDEE {
        string email PK "Normalized email address"
        int meeting_id FK "Foreign key to meeting record"
        string status "Invited or RSVP pending"
    }

    CALENDAR_INVITATION {
        string uid PK "RFC 5545 Unique Identifier"
        int meeting_id FK "Associated meeting ID"
        string method "MIME method: REQUEST"
        string ics_content "Raw VEVENT calendar payload"
        string dispatch_status "Dispatched or Skipped"
    }

    CHROME_ALARM {
        string alarm_name PK "Prefix meet-alert:Title"
        int meeting_id FK "Associated meeting ID"
        datetime scheduled_for "T minus 2 minutes trigger"
        boolean notified "Notification fired flag"
    }

    CONFERENCE_ROOM {
        string room_id PK "Unique room namespace"
        string status "Active or Idle state"
        int peer_count "Connected mesh peers count"
        int queue_length "Knocking lobby queue count"
    }

    HOST_SESSION {
        string host_peer_id PK "Host participant peer ID"
        string room_id FK "Governed conference room"
        boolean is_online "Host WebSocket active status"
    }

    WAITING_GUEST {
        string guest_id PK "Surrogate guest session UUID"
        string room_id FK "Target conference room"
        string guest_name "Full name provided by guest"
        string office_id "Corporate office identifier"
        string status "pending, admitted, or denied"
        datetime timestamp "Knock submission timestamp"
    }

    PEER_PARTICIPANT {
        string peer_id PK "WebRTC peer identifier"
        string room_id FK "Active conference room"
        string name "User display name"
        boolean is_host "Host moderation role"
        boolean is_audio_muted "Microphone mute state"
        boolean is_video_off "Camera disable state"
        boolean is_hand_raised "Raised hand indicator"
        boolean is_speaking "Web Audio halo active"
    }

    P2P_CONNECTION {
        string connection_id PK "Initiator to receiver pair"
        string initiator_id FK "Offering peer ID"
        string receiver_id FK "Answering peer ID"
        string ice_state "new, checking, or connected"
        string media_types "audio, video, or screen"
    }

    ROOM_MESSAGE {
        int id PK "Autoincrement primary key"
        string room_id FK "Target channel or room code"
        string sender_name "Author display name"
        string sender_id "User or peer session ID"
        string content "Message text content"
        string client_msg_id "Client UUID for idempotency"
        int reply_to_id FK "Self-referencing parent ID"
        int is_deleted "Soft delete flag: 0 or 1"
        datetime created_at "Creation timestamp"
    }

    MEDIA_ATTACHMENT {
        string attachment_id PK "Generated asset hash"
        int message_id FK "Associated message primary key"
        string attachment_type "text or image classification"
        string base64_url "Base64 data URI payload"
    }
```

---

### 4.4 Comprehensive Entity Dictionary & Attribute Catalog

| Entity Name | Domain Scope | Storage Layer | Primary Key | Description & Cardinality |
| :--- | :--- | :--- | :--- | :--- |
| **`WORKSPACE`** | Tenancy | Client / Header | `id` (string) | Tenant boundary that scopes all tasks, meetings, and channels. One workspace contains many meetings and messages ($1:N$). |
| **`MEETING`** | Schedule | SQLite (`meetings`) | `id` (int autoincrement) | Core scheduling record. Can represent a collaborative video meeting or a discrete task depending on the `type` column. |
| **`ATTENDEE`** | Collaboration | Parsed / In-Memory | `email` (string) | Recipient parsed from `MEETING.attendees`. Receives automated email invites and RFC 5545 calendar files. |
| **`CALENDAR_INVITATION`**| Notification | SMTP Transport | `uid` (string) | Generated MIME iCalendar entity (`METHOD:REQUEST`) attached to invitation emails for one-click calendar import. |
| **`CHROME_ALARM`** | Extension | Chrome Storage API | `alarm_name` (string) | Pre-meeting desktop alarm registered $T - 2\text{ minutes}$ prior to call time via Chrome Manifest V3 Alarms API. |
| **`CONFERENCE_ROOM`** | Real-Time | Node.js Memory Map | `room_id` (string) | Real-time conference namespace. Manages host sockets, active mesh participants, and knocking lobby queues. |
| **`HOST_SESSION`** | Moderation | Node.js Memory Map | `host_peer_id` (string) | Active WebSocket connection holding host privileges; receives knock notifications and admits/denies guests. |
| **`WAITING_GUEST`** | Security | Node.js Memory Map | `guest_id` (string) | Queued attendee in the Corporate Knocking Lobby awaiting host approval with Full Name and Corporate Office ID. |
| **`PEER_PARTICIPANT`** | Media | Browser WebRTC | `peer_id` (string) | Connected video call member maintaining audio/video tracks, mute toggles, and Web Audio speaker halo state. |
| **`P2P_CONNECTION`** | WebRTC | Browser WebRTC | `connection_id` (string)| Direct DTLS-SRTP encrypted peer-to-peer connection between two calling nodes ($N \times (N-1) / 2$ mesh). |
| **`ROOM_MESSAGE`** | Chat | SQLite (`room_messages`) | `id` (int autoincrement) | Persistent channel message with client UUID idempotency, threaded quoted replies, and soft delete capabilities. |
| **`MEDIA_ATTACHMENT`** | Collaboration | SQLite / Lightbox | `attachment_id` (string)| Base64 data URI image payload pasted or dragged into chat, viewable in a full-screen interactive lightbox. |

---

### 4.5 Schema DDL, Constraints & Indexing Strategy

#### 1. Table: `meetings`
Stores scheduled meetings, operational tasks, and sprint goals partitioned by workspace.

```sql
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  link TEXT,
  attendees TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  type TEXT DEFAULT 'task',
  workspace_id TEXT DEFAULT 'default',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Table: `room_messages`
Stores channel and in-call chat histories, threaded replies, and image assets.

```sql
CREATE TABLE IF NOT EXISTS room_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_id TEXT,
  content TEXT,
  attachment_url TEXT,
  attachment_type TEXT DEFAULT 'text',
  client_msg_id TEXT,
  reply_to_id INTEGER,
  reply_to_sender TEXT,
  reply_to_content TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_client_id ON room_messages(client_msg_id);
```

> [!TIP]
> **Idempotent Messaging:** The index on `client_msg_id` allows the server to detect and reject accidental duplicate submissions caused by network retries.

---

### 4.6 Server In-Memory State Models
Real-time WebRTC signaling and guest lobby queues are maintained in decoupled in-memory Maps on the Node.js server:

* `rooms`: `Map<roomId, RoomState>`
  - `hostSocket`: WebSocket connection of the registered meeting host.
  - `hostPeerId`: Peer ID string of the active room host.
  - `participants`: `Map<peerId, { ws, peerId, name, officeId, isHost, isAudioMuted, isVideoOff, isHandRaised }>`
  - `waitingGuests`: `Map<guestId, { id, name, officeId, ws, timestamp }>`
* `chatRooms`: `Map<roomId, Set<WebSocket>>`: Sockets subscribed to real-time chat broadcasts, presence updates, and typing notifications.

---

## 5. WebRTC Multi-Peer Mesh Calling Engine

### 5.1 Multi-User Mesh Architecture
PCS Meet Manager uses a **Fully Decentralized Multi-Peer WebRTC Mesh Network**:

* Every room participant opens a direct, peer-to-peer DTLS-SRTP encrypted audio/video connection (`RTCPeerConnection`) with every other participant in the room.
* When a new peer enters, the server provides an array of existing peer IDs (`room-users`).
* The new joiner acts as the **initiator** (`isInitiator = true`) and generates SDP offers for each existing peer.
* Existing peers receive `peer-joined`, configure their local connection handlers, and await incoming offers. This structured role assignment prevents offer/answer collisions (signaling glare).

```
          ┌────────────────────────────────────────────────┐
          │               [Peer C (Joiner)]                │
          │                   Initiator                    │
          └───────────▲────────────────────────▲───────────┘
                      │                        │
             SDP Offer / Answer       SDP Offer / Answer
             DTLS-SRTP Stream         DTLS-SRTP Stream
                      │                        │
          ┌───────────▼──────────┐  ┌──────────▼───────────┐
          │   [Peer A (Host)]    │◄─┼──────────────────────┤ [Peer B (Member)]
          │      Receiver        │  │       Receiver       │
          └──────────────────────┘  └──────────────────────┘
                     ▲                         ▲
                     └────────P2P Stream───────┘
```

### 5.2 Multi-Peer Signaling Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Joiner as "Joining Peer (Peer C)"
    participant Signaling as "Node.js Signaling Hub (/ws)"
    participant Existing as "Existing Peer (Peer A)"

    Joiner->>Signaling: join-room { roomId: "standup", name: "Charlie" }
    Signaling-->>Joiner: room-users { peers: [Peer A, Peer B], yourPeerId: "peer_c" }
    Signaling-->>Existing: peer-joined { peerId: "peer_c", name: "Charlie" }

    Note over Joiner,Existing: Peer C initiates call to Peer A
    Joiner->>Joiner: createPeerConnection(to: Peer A, isInitiator: true)
    Joiner->>Joiner: createOffer() -> setLocalDescription(offer)
    Joiner->>Signaling: signal { toPeerId: "peer_a", payload: { type: "offer", sdp } }
    Signaling->>Existing: signal { fromPeerId: "peer_c", payload: { type: "offer", sdp } }

    Existing->>Existing: setRemoteDescription(offer)
    Existing->>Existing: createAnswer() -> setLocalDescription(answer)
    Existing->>Signaling: signal { toPeerId: "peer_c", payload: { type: "answer", sdp } }
    Signaling->>Joiner: signal { fromPeerId: "peer_a", payload: { type: "answer", sdp } }
    Joiner->>Joiner: setRemoteDescription(answer)

    Note over Joiner,Existing: ICE Candidate Discovery via STUN
    Joiner->>Signaling: signal { toPeerId: "peer_a", payload: { candidate } }
    Signaling->>Existing: signal { fromPeerId: "peer_c", payload: { candidate } }
    Existing->>Signaling: signal { toPeerId: "peer_c", payload: { candidate } }
    Signaling->>Joiner: signal { fromPeerId: "peer_a", payload: { candidate } }

    Note over Joiner,Existing: Media Pipe Established
    Joiner<<-->>Existing: Direct DTLS-SRTP Encrypted Video & Audio
```

### 5.3 Active Speaker Detection via Web Audio API
Active speaker detection is executed entirely on the client, avoiding server audio processing:

1. A master browser `AudioContext` initializes upon joining a call.
2. For the local media stream and every remote participant stream, `createMediaStreamSource()` connects to an `AnalyserNode` (`fftSize = 256`).
3. A continuous `requestAnimationFrame` loop polls `getByteFrequencyData()`.
4. When average volume exceeds the sound threshold ($> 18$), the participant's `peerId` is flagged in the `speakingPeers` Set, activating a green animated halo ring around their video card.

### 5.4 Dynamic Responsive Video Grids & Spotlight Mode
The UI dynamically selects responsive CSS grid classes based on total active participants (`connectedPeers.length + 1`):

| Participant Count | CSS Grid Selector | Layout Pattern |
| :---: | :--- | :--- |
| **1 User** | `.grid-count-1` | Centered full-stage video canvas |
| **2 Users** | `.grid-count-2` | Side-by-side 50/50 split |
| **3–4 Users** | `.grid-count-4` | Balanced $2 \times 2$ grid |
| **5–6 Users** | `.grid-count-6` | Matrix grid ($3 \times 2$) |
| **7–9 Users** | `.grid-count-9` | Boardroom view ($3 \times 3$) |
| **10+ Users** | `.grid-count-many` | Responsive auto-fill tiles |

In **Spotlight Mode**, the pinned participant fills the hero canvas (`.meet-spotlight-hero`), while all other peers are placed in a horizontal scrollable bottom filmstrip (`.meet-filmstrip`).

### 5.5 Picture-in-Picture (PiP) Multitasking
Clicking the minimize button (`isCallMinimized = true`) docks the meeting into a floating PiP card in the lower corner of the viewport. This card displays the active speaker's video, a self-view preview, and floating controls for mic mute, camera toggle, maximize, and call end, allowing users to navigate tasks and calendar items while remaining in the call.

### 5.6 In-Call Meeting Recording & Client-Side Audio/Video Mixing Engine
PCS Meet Manager includes a **100% client-side Meeting Recording Pipeline** powered by the native `MediaRecorder` and `AudioContext` APIs without requiring external cloud media servers or additional CPU overhead:

```mermaid
flowchart TD
    subgraph AudioSources["Audio Mixing Pipeline (Web Audio API)"]
        LocalMic["Local Microphone Track\n(localStream.getAudioTracks())"]
        RemotePeersAudio["Remote Participant Tracks\n(remoteStreams.forEach)"]
        TabDisplayAudio["Tab / System Audio\n(displayStream.getAudioTracks())"]
        AudioCtx["AudioContext Mixer Node\n(createMediaStreamDestination())"]
    end

    subgraph VideoSources["Visual Capture Sources"]
        DisplayCap["Tab / Window / Screen Video\n(navigator.mediaDevices.getDisplayMedia)"]
        DirectFallback["Active Camera / Screen Stream\n(Direct P2P Fallback)"]
    end

    subgraph RecorderEngine["MediaRecorder Processing Engine"]
        MimeNegotiation["Adaptive Codec Negotiation\n(video/webm;codecs=vp9,opus -> vp8 -> mp4)"]
        ChunkCollector["1-Second Timeslice Chunks\n(Resilient In-Memory Buffer)"]
        BlobAssembler["Final Blob & Object URL Generator"]
    end

    subgraph UserReviewModal["Recording Preview & Export Hub"]
        VideoPreview["HTML5 Video Player Preview"]
        WebmExport["Download .webm"]
        Mp4Export["Download .mp4"]
        MeetingNoteLink["Attach Note to Workspace Meeting"]
    end

    LocalMic --> AudioCtx
    RemotePeersAudio --> AudioCtx
    TabDisplayAudio --> AudioCtx

    DisplayCap --> MimeNegotiation
    DirectFallback -. "Fallback" .-> MimeNegotiation
    AudioCtx --> MimeNegotiation

    MimeNegotiation --> ChunkCollector
    ChunkCollector --> BlobAssembler
    BlobAssembler --> UserReviewModal
```

1. **Dual-Mode Video Capture:**
   - **Screen / Current Tab Mode (Default):** Captures high-definition (up to 1080p/60fps) conference canvas, presentations, and active speaker tiles via `getDisplayMedia` with `preferCurrentTab: true`.
   - **Direct Stream Fallback:** Captures active camera / screen stream directly if display media is declined.
2. **Multi-Track Audio Mixing:**
   - Standard browser display capture captures tab audio, but omits the speaker's local microphone.
   - The engine creates a master `AudioContext` with a `MediaStreamDestination`, routing:
     - Local microphone audio from `localStreamRef.current`
     - Remote peers' audio tracks from `remoteStreamsRef.current`
     - Tab / presentation audio from `displayStream`
   - This ensures **both the speaker and all remote participants** are audible in the final recording.
3. **Resilient Chunk Streaming:**
   - The `MediaRecorder` runs with a `1,000ms` timeslice buffer (`recorder.start(1000)`), capturing continuous slices so data is never lost if a call is abruptly closed.
4. **Interactive Export & Workspace Integration:**
   - On completion, the `<RecordingModal />` opens with an embedded video player, duration, file size metrics, one-click `.webm` and `.mp4` downloads, and an optional button to attach recording metadata directly to the scheduled meeting in the workspace database.

### 5.7 Meeting Agenda Timeboxing & Speaker Turn-Taking Manager
PCS Meet Manager integrates a comprehensive in-call **Agenda Timeboxing and Speaker Turn-Taking Engine** to prevent meeting drift, keep distributed standups on schedule, and democratize speaking turns:

```mermaid
flowchart TD
    subgraph HostControls["Host & Facilitator Engine"]
        AutoAgenda["Auto-Parsed Agenda from Scheduled Notes\n(Item Checklists & Custom Durations)"]
        TimeboxTimer["Per-Topic Countdown & Overtime Clock\n(+MM:SS Overrun Alert & Chimes)"]
        FloorModeration["Speaker Moderation\n(Give Floor, Pass Next, Clear Floor)"]
    end

    subgraph SyncEngine["Real-Time State Synchronization (/ws)"]
        AgendaSync["agenda-sync Event\n(Active Index, Remaining Secs, Status)"]
        QueueSync["speaker-queue-sync Event\n(FIFO Queue, Active Speaker, Remaining Secs)"]
    end

    subgraph ParticipantExperience["Participant & Audience View"]
        TopBarPill["Top Bar Active Topic Pill\n(Time Remaining Badge & Progress Bar)"]
        FloorTileBadge["RemoteParticipantTile 'On Floor' Badge\n(2-Min Turn Countdown & Speaker Aura)"]
        DrawerPanel["Dual-Tab Side Drawer\n(Agenda Checklist & Live Speaker Queue)"]
        AudioChimes["Web Audio Chimes\n(Warning Chime at 1 Min, Overtime Double Chime)"]
    end

    AutoAgenda --> TimeboxTimer
    TimeboxTimer --> AgendaSync
    FloorModeration --> QueueSync

    AgendaSync --> TopBarPill
    AgendaSync --> DrawerPanel
    AgendaSync --> AudioChimes

    QueueSync --> FloorTileBadge
    QueueSync --> DrawerPanel
    QueueSync --> AudioChimes
```

1. **Agenda Timeboxing & Step Progression (`useAgendaTimer`):**
   - Automatically populates agenda topics from meeting notes bullet points upon joining, or allows custom topic creation with customizable durations (default 10m).
   - Real-time countdown timer tracking allocated minutes and seconds per item.
   - **Overtime Tracking (`+MM:SS`):** When a topic exceeds its allocated time, the timer dynamically shifts to a pulsating amber/red state with overtime incrementation.
   - **Web Audio Auditory Warnings:** Distinct synthesized chimes notify participants when 1 minute remains (880 Hz tone) and when overtime is triggered (two-tone alert).
   - **Host & Guest Controls:** Hosts possess start, pause, reset, step-forward, step-back, add, remove, and completion toggles. State is broadcast via `agenda-sync` to ensure zero-latency synchronization across all peer viewports.

2. **FIFO Speaker Turn-Taking & Floor Manager (`useSpeakerQueue`):**
   - Participants queue up using the "Raise Hand" button, maintaining a synchronized First-In-First-Out (FIFO) speaker queue.
   - Hosts grant the floor to any queued participant or pass to the next member with one click.
   - **2-Minute Speaking Limit:** When a participant is granted the floor, a 120-second turn countdown commences. At 30 seconds remaining, a warning chime sounds; at expiration, a transition chime signals turn completion.
   - **Visual Floor Indicators:** The active speaker is prominently badged with a pulsating `🎙️ On Floor (MM:SS)` tag across their video tile and spotlight canvas.

3. **In-Call UI Integration (`ConferenceOverlay.jsx` & `AgendaQueuePanel.jsx`):**
   - **Top Bar Pill:** A minimalist top bar status pill displays the active topic name, remaining time badge, and completion progress bar.
   - **Pill Dock Action:** A dedicated Agenda & Queue button in the bottom floating dock displays queue count badges.
   - **Collapsible Drawer:** A dual-tab side panel (`Agenda` vs `Speakers`) enables rapid timebox tracking and floor moderation without obscuring video streams.

### 5.8 WebRTC Peer-to-Peer Encrypted File & Document Sharing (`RTCDataChannel`)
PCS Meet Manager includes a **Zero-Cloud, Peer-to-Peer File & Document Sharing Engine** operating directly over WebRTC `RTCDataChannel` connections:

```mermaid
flowchart TD
    subgraph SenderNode["Sender Browser Node"]
        SelectFile["User Drags & Drops File\n(PDF, Archive, Images, Code, Docs)"]
        Slicer["Binary Chunk Slicer\n(48 KB slices -> Base64 packets)"]
        FlowControl["WebRTC Buffer Flow Controller\n(Checks bufferedAmount <= 256 KB)"]
        MetaPacket["Send file-meta Packet\n(fileId, name, size, mimeType, chunks)"]
        ChunkStream["Stream file-chunk Packets\n(fileId, chunkIndex, binaryData)"]
    end

    subgraph P2PMesh["Encrypted WebRTC P2P Data Mesh"]
        DC1["Direct RTCDataChannel ('pcs-p2p-files')\n(DTLS-SRTP 100% P2P Encryption)"]
    end

    subgraph ReceiverNode["Receiver Browser Node"]
        MetaOffer["Receive file-meta Offer\n(Display Incoming File & Trigger Toast)"]
        BufferQueue["Buffer Array Reassembly\n(tracks receivedChunks & progress %)"]
        BlobGen["Assemble Final Blob & Object URL\n(new Blob(chunks, { type: mimeType }))"]
        AudioNotice["Synthesized Audio Chime (587Hz -> 880Hz)"]
        UIAction["Render 'Available' Card with One-Click Download"]
    end

    SelectFile --> Slicer
    Slicer --> MetaPacket
    MetaPacket --> DC1
    Slicer --> FlowControl
    FlowControl --> ChunkStream
    ChunkStream --> DC1

    DC1 --> MetaOffer
    DC1 --> BufferQueue
    BufferQueue --> BlobGen
    BlobGen --> AudioNotice
    BlobGen --> UIAction
```

1. **Zero-Cloud Privacy & Bandwidth Efficiency:**
   - Files are transferred point-to-point directly between participant browsers using WebRTC `RTCDataChannel` (`ordered: true`).
   - Files never touch backend application servers, cloud storage buckets (AWS S3), or the SQLite database, guaranteeing zero egress bandwidth expenses and total data confidentiality.

2. **Chunking & Flow Control Protocol:**
   - Files of any size or type are sliced into `48 KB` binary slices, converted into resilient Base64 packets.
   - **Backpressure & Flow Control:** To prevent socket buffer drops on fast connections or large files, the streaming loop monitors `dc.bufferedAmount`. When exceeding `256 KB`, the loop awaits the `bufferedamountlow` event before transmitting subsequent chunks.

3. **In-Call User Experience (`FileTransferPanel.jsx`):**
   - **Modern Drag-and-Drop Dropzone:** Intuitive drop target supporting multi-file selection with file type detection (PDF, images, zip archives, spreadsheets, code files).
   - **Live Transfer Progress:** Dual-direction progress bars tracking upload/download percentage, transferred byte counts, and transfer statuses (`Sending`, `Receiving`, `Available`, `Cancelled`).
   - **Instant Download & Lightbox Preview:** Completed transfers expose a 1-click native download link with original filenames, plus lightbox image previewing for image files.
   - **Notification Chimes & Unread Badges:** Unread file counters on side drawer tabs and dock icons, combined with Web Audio chimes upon arrival.

### 5.9 In-Call Collaborative Whiteboard & Stage Annotator
PCS Meet Manager features a **Real-Time Collaborative Whiteboard & Stage Annotation Engine** built for architectural sketching, brainstorm diagramming, and interactive presentation marking during live video calls:

```mermaid
flowchart TD
    subgraph LocalDrawing["Local User Interaction"]
        PointerInput["Mouse / Stylus / Touch Coordinates\n(Normalized 0.0 to 1.0)"]
        ToolEngine["Tool Dispatcher\n(Pen, Highlighter, Laser, Shapes, Sticky)"]
        LocalCanvas["Immediate Local Canvas Render\n(Zero Perceived Lag)"]
    end

    subgraph SyncTransport["Real-Time Synchronization Layer (/ws)"]
        DrawPacket["whiteboard-draw (stroke / shape)"]
        LaserPacket["whiteboard-laser (ephemeral beacon)"]
        StickyPacket["whiteboard-sticky (upsert / delete)"]
        SyncPacket["whiteboard-sync (state delivery for new joiners)"]
    end

    subgraph RemotePeers["Remote Conference Participants"]
        RemoteRender["Proportional Canvas Scaling\n(Responsive Render on Any Display)"]
        LaserDecay["Laser Glowing Radial Trail\n(Auto-fades in 1.4s)"]
        StickyLayer["Draggable Markdown Sticky Notes"]
    end

    subgraph ExportIntegration["Export & Workspace Persistence"]
        ExportPNG["Download 1080p PNG Snapshot"]
        MeetingNotesAttach["Auto-attach Markdown Image Link\nto Scheduled Meeting Notes in SQLite"]
    end

    PointerInput --> ToolEngine
    ToolEngine --> LocalCanvas
    ToolEngine --> DrawPacket
    ToolEngine --> LaserPacket
    ToolEngine --> StickyPacket

    DrawPacket --> RemoteRender
    LaserPacket --> LaserDecay
    StickyPacket --> StickyLayer
    SyncPacket --> RemoteRender

    LocalCanvas --> ExportPNG
    LocalCanvas --> MeetingNotesAttach
```

1. **Normalized Proportional Coordinate System:**
   - Raw pointer events are converted into normalized relative coordinates ($x \in [0, 1], y \in [0, 1]$) rather than fixed pixel dimensions.
   - When rendering, the canvas dynamically scales elements to its actual container width and height. This guarantees that an architectural diagram looks identical whether viewed on a 400px Chrome Side Panel, a 13-inch laptop, or a 4K external boardroom display.

2. **Creative Drawing & Annotation Primitives:**
   - **Freehand Pen & Highlighter:** Smooth polyline rendering with customizable stroke widths ($2\text{px}$, $4\text{px}$, $8\text{px}$, $14\text{px}$) and alpha transparency ($35\%$ opacity for highlighters).
   - **Geometric Shapes:** Live preview and rendering of straight lines, directional arrows with arrowheads, rectangles, and ellipses (with optional semi-transparent fill).
   - **Proportional Point Eraser:** Proximity-based hit-testing ($3.5\%$ radius) to erase strokes and shapes cleanly.
   - **Collaborative Laser Pointer:** Real-time glowing beacon with radial gradient and participant name tag that automatically decays after $1.4\text{ seconds}$ without permanently marking the canvas.

3. **Draggable Sticky Notes Layer:**
   - Color-coded notes (`yellow`, `blue`, `green`, `pink`) with author labels, live editable text areas, and drag handles.
   - Position updates are broadcast via `whiteboard-sticky` events and synchronized across all peer viewports.

4. **Snapshot Export & Workspace Integration:**
   - **1-Click 1080p PNG Export:** Renders an offscreen $1920 \times 1080$ canvas with dark grid background, strokes, shapes, and formatted sticky notes, downloading a clean PNG file.
   - **Save to Meeting Notes:** Direct integration with the SQLite database—attaches the whiteboard image as a Markdown attachment directly into the active scheduled meeting's notes.

---

## 6. Corporate Knocking Lobby & Gatekeeping Handshake

### 6.1 Two-Phase Admission Protocol
External visitors accessing meetings via guest links (`?room=<code>`) enter a security gatekeeping lobby:

1. **Guest Verification:** Guests submit their Full Name and Corporate Office ID before connecting.
2. **Host Alert & Audio Chime:** The host receives a notification banner and a doorbell audio chime.
3. **Host Admission Action:** The host can admit or deny the guest individually, or admit all waiting guests at once.

### 6.2 Knocking Lobby Workflow Diagram

```mermaid
flowchart TD
    GuestStart["Guest Navigates to Room Link (?room=code)"] --> CheckHost{"Is Host Online in Room?"}

    CheckHost -- No --> DisplayWaitHost["Display Lobby: Host Has Not Arrived\n(Auto-connects when host enters)"]
    CheckHost -- Yes --> InputCredentials["Guest Enters Full Name & Corporate Office ID"]

    InputCredentials --> EmitKnock["Guest Emits WebSocket: guest-knock\n(Name, Office ID, Timestamp)"]
    EmitKnock --> ServerQueue["Server Queues Guest in room.waitingGuests Map\n(Status: pending)"]

    ServerQueue --> AlertHost["Host Interface Displays Knock Banner & Plays Doorbell Chime\n(WS: guest-knock-request)"]

    AlertHost --> HostDecision{"Host Decision"}

    HostDecision -- "Deny Entry" --> SendDenial["Server Emits WS: guest-denied\n(Reason: Host declined entry)"]
    SendDenial --> ShowDenied["Guest UI: Admission Declined\n(Offers Re-try Action)"]

    HostDecision -- "Admit Guest" --> SendAdmit["Server Emits WS: guest-admitted\n(Transfers socket to room.participants)"]
    SendAdmit --> BroadcastPeers["Server Broadcasts peer-joined to All In-Room Peers"]
    BroadcastPeers --> WebRTCMesh["WebRTC Mesh Handshake Initiated\n(Direct Video & Audio Stream)"]
```

### 6.3 Bulk Admission ("Admit All")
When multiple attendees arrive simultaneously (`pendingKnocks.length > 1`), the host interface provides an **Admit All ({count})** button in both the top banner and the People tab. Clicking this button admits all queued guests in a single batch.

---

## 7. Global Real-Time Chat & Asset Collaboration

### 7.1 Channels, Presence & Messaging Flowchart
The chat engine functions across global workspace channels (`general`, `standup`) and within active video calls.

```mermaid
flowchart TD
    Composer["User Types Message or Pastes Image Asset"] --> GenUUID["Client Generates Local UUID (client_msg_id)\nRenders Message Optimistically (0ms)"]

    GenUUID --> CheckWS{"Is WebSocket Open?"}
    CheckWS -- Yes --> EmitWS["Emit WS: chat-message\n(roomId, content, client_msg_id)"]
    CheckWS -- No --> PostREST["Fallback: POST /api/rooms/:roomId/messages"]

    EmitWS --> ServerCheck{"Check client_msg_id in SQLite"}
    PostREST --> ServerCheck

    ServerCheck -- "Already Exists (Duplicate)" --> ReturnExisting["Return Existing Message\n(Prevents duplicate entries)"]
    ServerCheck -- "New Message" --> SaveDB["INSERT INTO room_messages\n(Synchronous WAL Commit)"]

    SaveDB --> BroadcastAll["Broadcast WS chat-message to All Channel Sockets"]
    BroadcastAll --> PlayChime["Remote Peers Receive Message & Play Synthesized Audio Chime"]
    BroadcastAll --> ReconcileClient["Local Client Reconciles Temporary UUID with Database ID"]
    ReturnExisting --> ReconcileClient
```

### 7.2 Threaded Replies, Media Lightbox & Soft Deletions
* **Threaded Replies:** Clicking reply populates the quote preview banner with the parent message's author and content excerpt, storing `reply_to_id`, `reply_to_sender`, and `reply_to_content` in SQLite.
* **In-Line Image Lightbox:** Dragging and dropping or pasting images (`Ctrl+V`) converts assets into Base64 data URIs. Clicking any image opens a full-screen interactive lightbox modal.
* **Soft Deletions:** Senders can delete their messages. The server updates `is_deleted = 1` and replaces the body with *"This message was deleted"*, preserving thread hierarchy.
* **Web Audio Notification Chimes:** Incoming messages trigger `playChatNotificationSound()`, which synthesizes dual-tone sine waves (800 Hz and 1000 Hz) using the Web Audio API, eliminating the need for external MP3 audio files.

---

## 8. Automated RFC 5545 Calendar Email Pipeline

### 8.1 Zero-Latency Asynchronous Trigger
When a meeting is scheduled via `POST /api/meetings`, the server returns an HTTP 201 response immediately, providing an instant UI experience. Email generation and SMTP transport execute asynchronously in the background.

```mermaid
flowchart TD
    ClientPost["Client Submits Meeting Form\n(POST /api/meetings)"] --> SaveDatabase["Save Record to SQLite Database\n(Status: Pending)"]

    SaveDatabase --> Immediate201["Return HTTP 201 Created Response\n(0ms Perceived User Latency)"]

    SaveDatabase -. "Asynchronous Background Trigger" .-> CheckType{"Type == 'meeting' AND Has Attendees?"}

    CheckType -- No --> ExitWorker["End Pipeline (No emails required)"]
    CheckType -- Yes --> ParseEmails["Extract & Validate Email Addresses via Regex\n(/[^\\s,]+@[^\\s,]+\\.[^\\s,]+/g)"]

    ParseEmails --> GenICS["Generate RFC 5545 iCalendar Payload (.ics)\n(UID, DTSTAMP, DTSTART, DTEND, SUMMARY)"]
    GenICS --> CompileHTML["Compile Responsive Branded HTML Email Template\n(Includes One-Click Video Join Button)"]

    CompileHTML --> SMTPRelay["Dispatch via Nodemailer SMTP Transport\n(MIME Type: text/calendar; method=REQUEST)"]
    SMTPRelay --> Inboxes["Attendee Inboxes\n(Google Calendar, Microsoft Outlook, Apple Mail Sync)"]
```

### 8.2 RFC 5545 iCalendar Payload Structure
The system generates standard iCalendar attachments using `METHOD:REQUEST` for single-click calendar imports:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PCS Meet Manager//Executive Meeting//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:pcs-1730985600000@meetmanager.com
DTSTAMP:20261106T000000Z
DTSTART:20261106T100000Z
SUMMARY:Sprint Architecture Review
DESCRIPTION:Agenda items and direct link: https://meetmanager.com?room=sprint-review
URL:https://meetmanager.com?room=sprint-review
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

---

## 9. Chrome Extension Manifest V3 Architecture (v2.0.0)

### 9.1 Overview & Manifest V3 Declaration
PCS Meet Manager is natively distributed as a Google Chrome Manifest V3 Extension. Unlike conventional extensions that open in popups that disappear whenever a user clicks elsewhere, PCS Meet Manager mounts inside Chrome's native **Side Panel API (`chrome.sidePanel`)**, docking alongside any document, pull request, or active web application.

```mermaid
flowchart TD
    subgraph Browser["Google Chrome Environment (v2.0.0)"]
        Toolbar["Browser Toolbar Action"] -->|"Click Icon (Alt+Shift+M)"| SidePanel["Persistent Side Panel\n(React 19 App)"]
        Omnibox["Chrome Omnibox (pcs ...)"] -->|"pcs call <room>\npcs task <title>"| BackgroundWorker["Background Service Worker\n(background.js)"]
        ContextMenu["Webpage Right-Click Context Menu"] -->|"Clip Selection / Clip Page"| BackgroundWorker
        ActiveTab["Active Browser Tab"] -->|"Alt+Shift+C Shortcut"| BackgroundWorker
    end

    subgraph ServiceWorker["Background Service Worker Tasks"]
        BackgroundWorker -->|"Store Pending Items"| LocalStorage[("chrome.storage.local\n(pendingClips)")]
        BackgroundWorker -->|"Set Badge (Count & Color)"| ActionBadge["chrome.action Badge\n(Urgent Red / Blue / Green)"]
        BackgroundWorker -->|"Schedule Alarms (T - 2min)"| ChromeAlarms["chrome.alarms API"]
        ChromeAlarms -->|"Trigger Notification"| DesktopNotif["chrome.notifications\n(Rich Desktop Banner)"]
    end

    subgraph SyncEngine["React UI Ingestion Bridge"]
        LocalStorage -.->|"Auto-detect & Ingest on mount/poll"| SidePanel
        SidePanel -->|"Persist Task / Meeting"| SQLiteDB[("SQLite WAL Database\n(/api/meetings)")]
    end
```

### 9.2 Key Manifest V3 Capabilities & Permissions

1. **`sidePanel` (`openPanelOnActionClick: true`):**
   - Configured in `client/public/manifest.json` with `"default_path": "index.html"`.
   - In `background.js`, `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` ensures clicking the extension icon directly mounts the workspace beside your web tabs.

2. **`contextMenus`:**
   - Adds right-click options to any page:
     - **Clip Selection to PCS Meet Manager**: Captures highlighted text, page URL, and page title as a task.
     - **Clip Current Page as Research Task**: Saves current URL and article title.
     - **Open PCS Side Panel**: Direct launch shortcut.
   - Provides immediate confirmation via `chrome.notifications.create` and flash updates on the toolbar badge.

3. **`omnibox` (`keyword: "pcs"`):**
   - Enables browser address-bar commands without opening the panel:
     - `pcs call sprint-review`: Immediately opens or switches to the WebRTC video meeting room.
     - `pcs task Review PR #104`: Instantly records an executive task to local storage.

4. **`commands` (Global Keyboard Shortcuts):**
   - `_execute_action` (<kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>): Directly opens or toggles the side panel.
   - `clip-active-tab` (<kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>): Instant one-stroke clipping of the current webpage URL and title into your task backlog.

5. **`activeTab` & `tabs`:**
   - Inspects the active tab URL to auto-detect Google Meet, Zoom, or Teams video calls.
   - Extracts page metadata (`tab.title`, `tab.url`) when clipping content.

6. **Dynamic Toolbar Badges (`chrome.action.setBadgeText`):**
   - **Urgent Red (`#ef4444`)**: Displays `!` or meeting time when a call starts in less than 15 minutes.
   - **Productive Blue (`#1d4ed8`)**: Displays count of pending tasks due today (e.g. `"3"`).
   - **Quiet Emerald (`#16a34a`)**: Displays `✓` or clears when all today's commitments are completed.

7. **Desktop Alarms & Notifications (`chrome.alarms` & `chrome.notifications`):**
   - Registers alarms $T - 2\text{ minutes}$ prior to scheduled calls.
   - Displays a rich OS notification banner. Clicking the notification immediately focuses the browser window and opens the meeting room.

### 9.3 Ingestion Pipeline (Dual-Runtime Storage Bridge)

Because service workers run headless without direct access to the React DOM or API tokens, clips captured via context menus or keyboard shortcuts are written to `chrome.storage.local` under the key `pendingClips`.

When the user opens the side panel:
1. `App.jsx` polls `chrome.storage.local.get(['pendingClips'])`.
2. Any queued clips are converted into `POST /api/meetings` payloads with priority `High` and type `task`.
3. The pending queue in `chrome.storage.local` is atomically cleared.
4. An interactive toast notification confirms: *"Ingested 1 clipped task from browser context menu"*.

### 9.4 Automated Packaging & Distribution
The build script (`client/scripts/package-extension.js`) automates bundling:
```bash
npm run package:extension
```
- Executes `vite build` into `client/dist`.
- Validates and packages PNG icons (`icon-16.png`, `icon-48.png`, `icon-128.png`).
- Generates `pcs-meet-manager-extension.zip` in the project root ready for Chrome Web Store upload or manual unpacked developer loading (`chrome://extensions` -> "Load unpacked").

---

## 10. Executive Productivity Cockpit & Viewports

### 10.1 Four Specialized Viewports

```mermaid
flowchart LR
    Navbar["Navigation Bar\n(Keys: 1, 2, 3, 4)"] --> CalView["1: Calendar View\n• 30-Day Grid\n• 7-Day Sprint\n• Density Indicators"]
    Navbar --> TableView["2: Table View\n• Sortable Columns\n• Quick Status Check\n• One-Click Edit/Delete"]
    Navbar --> CardsView["3: Cards View\n• Kanban Cards\n• Priority Badges\n• Agenda Previews"]
    Navbar --> AnalyticsView["4: Analytics View\n• Completion Rates\n• Weekly Meeting Hours\n• 90-Day Heatmap"]
```

### 10.2 Executive Focus Modules

1. **Daily Standup Generator:** Parses all completed items from the past 24 hours, today's pending tasks, and upcoming meetings into a formatted Markdown report ready to copy into Slack or Teams.
2. **25-Minute Pomodoro Focus Timer:** Built-in focus sprint timer with circular progress ring, pause/resume controls, and audio alerts for working between meetings.
3. **Morning Overdue Triage:** Automatically flags past-due items and provides a one-click **Roll All to Today** bulk action.
4. **Notes-to-Tasks Converter:** Scans meeting agenda notes for Markdown checkbox items (`- [ ]`, `*`) and batch-converts them into standalone tasks in SQLite.

### 10.3 Complete Keyboard Shortcuts Cheatsheet

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd> | Browser Global | Open or Toggle Chrome Side Panel (`_execute_action`) |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> | Browser Global | Clip Active Browser Tab into Task Backlog |
| `pcs call <room>` | Omnibox | Jump directly into WebRTC video meeting room |
| `pcs task <title>` | Omnibox | Fast-create a new task directly from the address bar |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Global | Open Command Palette |
| <kbd>1</kbd> | Global | Switch to Calendar View |
| <kbd>2</kbd> | Global | Switch to Table View |
| <kbd>3</kbd> | Global | Switch to Cards View |
| <kbd>4</kbd> | Global | Switch to Analytics View |
| <kbd>T</kbd> | Global | Open Quick Add Task Modal |
| <kbd>M</kbd> | Global | Open Quick Schedule Meeting Modal |
| <kbd>/</kbd> | Global | Focus Search Bar |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | In-Call | Toggle Microphone Mute |
| <kbd>Ctrl</kbd> + <kbd>E</kbd> | In-Call | Toggle Camera On/Off |
| <kbd>Esc</kbd> | Global | Close Active Drawer or Dismiss Modal |

---

## 11. Complete REST API Specification Reference

All endpoints are served from `/api` and consume/return `application/json`.

| Method | Endpoint | Rate Limit | Headers / Payload | Status | Description |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `GET` | `/api/health` | Standard | None | `200` | Health check endpoint returning server and SQLite status. |
| `GET` | `/api/webrtc/ice-config` | Standard | None | `200` | Returns STUN/TURN server configurations and public URL. |
| `GET` | `/api/meetings` | Standard | `x-workspace-id: string` | `200` | Fetches all meetings and tasks for the specified workspace. |
| `POST` | `/api/meetings` | Strict | `x-workspace-id`, `{ title, date, time, link, attendees, notes, priority, status, type }` | `201` | Creates an item; triggers background RFC 5545 email invite if meeting. |
| `PUT` | `/api/meetings/:id` | Strict | `x-workspace-id`, `{ title, date, time, link, attendees, notes, priority, status }` | `200` | Updates an existing meeting or task record. |
| `DELETE` | `/api/meetings/:id` | Strict | `x-workspace-id: string` | `200` | Deletes an item from the specified workspace. |
| `GET` | `/api/public/live-meetings` | Standard | None | `200` | Public directory of today's meetings with live participant counts. |
| `GET` | `/api/public/room-status` | Standard | `?room=code` | `200` | Checks if a room has an active host and returns queue length. |
| `GET` | `/api/rooms/:roomId/messages` | Standard | None | `200` | Returns historical chat log (up to 300 messages) for the room. |
| `POST` | `/api/rooms/:roomId/messages` | Standard | `{ senderName, senderId, content, attachmentUrl, clientMsgId, replyToId }` | `201` | Saves a chat message to SQLite, auto-migrates base64 to disk, and broadcasts. |
| `DELETE` | `/api/rooms/:roomId/messages/:id`| Standard | None | `200` | Soft-deletes a message (`is_deleted = 1`) and broadcasts removal. |
| `POST` | `/api/upload` | Standard | `{ dataUrl, filename, attachmentType }` | `200` | Saves base64/file payload to active storage provider (R2/S3/local) and returns clean static asset URL. |
| `GET` | `/api/storage/status` | Standard | None | `200` | Returns active storage provider, target bucket, validation status, and asset volume metrics. |
| `POST` | `/api/storage/migrate` | Strict | `{ dryRun: boolean }` | `200` | Batch offloads all legacy Base64 messages to active storage provider and runs database `VACUUM`. |
| `GET` | `/api/storage/assets` | Standard | `?limit=50&offset=0` | `200` | Returns catalog of tracked media assets with provider metadata, mime types, and public URLs. |
| `GET` | `/api/backup` | Standard | `x-workspace-id: string`, `?all=true` | `200` | Generates complete JSON database export of meetings, tasks, and room messages. |
| `POST` | `/api/restore` | Strict | `?mode=merge\|replace`, `{ data: { meetings, room_messages } }` | `200` | Safely restores/merges database state within an atomic SQLite transaction. |

---

## 12. Complete WebSocket Event Protocol Specification (`/ws`)

The WebSocket server operates at path `/ws` over RFC 6455 protocols.

| Event Type | Direction | Payload Schema | Architectural Function |
| :--- | :---: | :--- | :--- |
| `host-join` | Client $\rightarrow$ Server | `{ type, roomId }` | Registers socket as meeting host; returns `host-ready` and pending lobby queue. |
| `join-room` | Client $\rightarrow$ Server | `{ type, roomId, name, officeId }` | Direct entry; returns `room-users` to joiner and broadcasts `peer-joined` to room. |
| `guest-knock` | Client $\rightarrow$ Server | `{ type, roomId, guest: { id, name, officeId } }` | Queues guest in waiting lobby; emits `guest-knock-request` to host socket. |
| `admit-guest` | Host $\rightarrow$ Server | `{ type, roomId, guestId }` | Admits guest; emits `guest-admitted` to guest and `peer-joined` to room. |
| `deny-guest` | Host $\rightarrow$ Server | `{ type, roomId, guestId, reason }` | Declines guest entry; emits `guest-denied` with dismissal reason. |
| `signal` | Bidirectional | `{ type, roomId, toPeerId, fromPeerId, payload }` | Relays WebRTC SDP Offer, SDP Answer, or ICE Candidate directly to target peer. |
| `peer-status` | Client $\rightarrow$ Server | `{ type, roomId, isAudioMuted, isVideoOff, isHandRaised }` | Broadcasts live mic, camera, or hand-raise state updates to all room peers. |
| `raise-hand` | Client $\rightarrow$ Server | `{ type, roomId, senderName, isRaised }` | Broadcasts hand-raise status notification across room participants. |
| `agenda-sync` | Bidirectional | `{ type, roomId, agendaItems, activeTopicIndex, isTimerActive, remainingSeconds, isOvertime }` | Synchronizes active agenda topic timebox, countdown state, and completion status across all meeting peers. |
| `speaker-queue-sync` | Bidirectional | `{ type, roomId, speakerQueue, activeSpeaker }` | Synchronizes FIFO hand-raise turn-taking queue and active floor speaker countdown across all meeting peers. |
| `whiteboard-draw` | Bidirectional | `{ type, roomId, element: { id, type, tool, color, width, points, ... } }` | Relays drawing strokes, shapes, and eraser actions to all in-call whiteboard canvases. |
| `whiteboard-clear` | Bidirectional | `{ type, roomId }` | Clears all drawing elements and sticky notes across all connected peers. |
| `whiteboard-sticky` | Bidirectional | `{ type, roomId, action: 'upsert'\|'delete', sticky, stickyId }` | Synchronizes draggable markdown sticky notes position, color, and content across peers. |
| `whiteboard-laser` | Bidirectional | `{ type, roomId, point: { x, y } }` | Relays live ephemeral laser pointer beacon coordinates with radial glowing decay. |
| `whiteboard-sync` | Server $\rightarrow$ Client | `{ type, roomId, elements, stickies }` | Transmits current cumulative whiteboard state and sticky notes to newly joined participants. |
| `chat-join` | Client $\rightarrow$ Server | `{ type, roomId }` | Subscribes socket to room chat; broadcasts updated `chat-presence` count. |
| `chat-typing` | Client $\rightarrow$ Server | `{ type, roomId, senderName, isTyping }` | Relays ephemeral typing indicators to room subscribers. |
| `chat-message` | Bidirectional | `{ type, roomId, message: {...} }` | Persists message in SQLite and broadcasts to all room subscribers. |
| `chat-delete` | Bidirectional | `{ type, roomId, messageId }` | Sets soft-delete marker in SQLite and notifies connected room clients. |

---

## 13. Security, Hardening & Compliance Architecture

```mermaid
flowchart TD
    Request["Incoming Inbound HTTP / WebSocket Request"] --> Proxy["app.set('trust proxy', 1)\n(Resolves True Client IP)"]

    Proxy --> Helmet["Helmet Security Middleware\n• Strict Content Security Policy (CSP)\n• X-Frame-Options: SAMEORIGIN\n• Cross-Origin-Opener-Policy"]

    Helmet --> CORS["CORS Policy Middleware\n• Allows Web Origins\n• Allows chrome-extension:// origins"]

    CORS --> LocalCheck{"Localhost or Private LAN IP?\n(127.0.0.1, ::1, 10.x, 192.168.x)"}
    LocalCheck -- "Yes (Local/Office Dev)" --> BypassLimiter["Bypass Rate Limiting\n(Zero Friction for Internal Work)"]
    LocalCheck -- "No (Public/Remote IP)" --> RateLimitCheck{"Rate Limiter Tiers"}

    RateLimitCheck -- "GET Requests" --> GlobalLimiter["2,500 Requests / 15 Minutes per IP\n(Health & ICE Routes Exempt)"]
    RateLimitCheck -- "POST / PUT / DELETE" --> StrictLimiter["300 Requests / 5 Minutes per IP"]

    BypassLimiter --> ETagCheck{"HTTP ETag Conditional Check\n(If-None-Match Header)"}
    GlobalLimiter --> ETagCheck
    ETagCheck -- "Match (No Change)" --> Send304["HTTP 304 Not Modified\n(0-byte Payload, Instant Cache)"]
    ETagCheck -- "Stale / New" --> Sanitization["Parameterized SQL Execution\n(Prepared Statements via better-sqlite3)"]
    StrictLimiter --> Sanitization
    Sanitization --> Dispatch["Execute Request Handler"]
```

1. **Content Security Policy (CSP):** Relaxed specifically to permit inline scripts required by Vite HMR, Google Fonts stylesheets, WebRTC media streams (`blob:`), and WebSocket connections (`ws:`, `wss:`).
2. **High-Capacity Two-Tier DDoS Rate Limiting:**
   - **General API Limiter:** 2,500 requests per 15-minute window (raised from 200) prevents denial-of-service while accommodating multi-tab collaboration. Critical infrastructure endpoints (`/api/health`, `/api/webrtc/ice-config`, and static `/uploads`) are unthrottled.
   - **Write Limiter:** 300 requests per 5-minute window for mutating endpoints (`POST`, `PUT`, `DELETE`).
   - **LAN / Localhost Whitelisting:** Loopback (`127.0.0.1`, `::1`) and RFC 1918 private LAN IP subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`) are automatically exempted from rate limits, preventing multiple colleagues on the same office Wi-Fi from triggering false alarms.
   - **Backoff & `Retry-After` Header:** When rate limits are triggered, the server returns `HTTP 429 Too Many Requests` along with a standard `Retry-After` header. The client captures this header, surfaces a non-disruptive toast notification, and automatically pauses background polling.
3. **HTTP ETag Conditional Caching (`304 Not Modified`):**
   - Endpoints `/api/meetings` and `/api/rooms/:roomId/messages` compute lightweight cryptographic ETags based on record count, maximum ID, and newest modification timestamp.
   - When clients send `If-None-Match`, the server immediately responds with `304 Not Modified` (0-byte body payload), eliminating unnecessary database serialization and saving 95%+ of network bandwidth.
4. **Adaptive Client Polling:**
   - **WebSocket-Aware Silence:** Chat REST polling completely pauses whenever the real-time WebSocket connection is active (`readyState === WebSocket.OPEN`).
   - **Page Visibility Optimization:** Polling intervals automatically halt when browser tabs are hidden or minimized (`document.hidden`), resuming instantly when the tab regains focus (`visibilitychange`).
5. **CORS Policy for Chrome Extensions:** Explicitly allows requests originating from `chrome-extension://` schemes.
6. **SQL Injection Prevention:** 100% of queries use `better-sqlite3` prepared statements with parameterized inputs.

---

## 14. Environment Configuration Reference

Create a `.env` file in the `server/` directory based on the following reference:

```env
# Server Network Port
PORT=5000

# SQLite Database Storage Location (Supports absolute cloud volume paths)
DATABASE_PATH=./server/meetings.db

# Public URL (Used in automated email invitations and guest links)
PUBLIC_URL=https://meetmanager-p55v.onrender.com

# SMTP Outgoing Mail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="PCS Meet Manager" <your-email@gmail.com>

# Optional Production TURN Relay Server
TURN_URL=
TURN_USERNAME=
TURN_CREDENTIAL=

# Object Storage Subsystem (Cloudflare R2, AWS S3, or Local Disk Fallback)
# Options: 'auto' | 'r2' | 's3' | 'local'
STORAGE_PROVIDER=auto

# Cloudflare R2 Credentials (Zero egress fees S3-compatible API)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=pcs-meet-manager-assets
R2_PUBLIC_DOMAIN=

# AWS S3 / MinIO Configuration (Alternative S3-compatible provider)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
AWS_S3_ENDPOINT=
```

---

## 15. Installation, Local Development & Deployment Guide

### 15.1 Quickstart Local Development

```bash
# 1. Clone the repository
git clone https://github.com/itssagarK/meetManager.git
cd meetManager

# 2. Install dependencies for all workspaces
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Start development servers concurrently
# Terminal 1: Backend API & WebSocket Server (Port 5000)
npm run server

# Terminal 2: React Vite Client with Hot Module Replacement (Port 5173)
npm run client
```

### 15.2 Public HTTPS Tunneling (Testing on Mobile Devices)
To test cross-device video calling without deploying to a cloud host:

```bash
# Expose port 5000 via secure public HTTPS tunnel
npm run tunnel
```

### 15.3 Installing the Chrome Side Panel Extension
1. Run the packaging command:
   ```bash
   npm run package:extension
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `client/dist` directory (or extract `pcs-meet-manager-extension.zip`).
5. Click the extension puzzle icon in Chrome and pin **PCS Meet Manager**. Click the icon to open the persistent side panel.

### 15.4 Production Docker Deployment
The repository includes a multi-stage `Dockerfile`:

```bash
# Build the container image
docker build -t pcs-meet-manager .

# Run the container with persistent storage
docker run -d \
  -p 5000:5000 \
  -v meet_data:/data \
  -e DATABASE_PATH=/data/meetings.db \
  --name meet-manager \
  pcs-meet-manager
```

---

## 16. Troubleshooting & Frequently Asked Questions (FAQ)

<details>
<summary><strong>Q1: Why is my camera or microphone not showing in the video call?</strong></summary>

* **Browser Permissions:** Ensure your browser has granted camera and microphone permissions for the site.
* **HTTPS Requirement:** WebRTC requires a secure context (`https://` or `localhost`). If testing over a local network IP (e.g., `http://192.168.x.x`), browsers will block camera access. Use `npm run tunnel` to obtain a valid HTTPS URL.
</details>

<details>
<summary><strong>Q2: Why are automated email invitations not being delivered?</strong></summary>

* Verify your SMTP credentials in `server/.env`.
* For Gmail, use an **App Password** rather than your primary Google account password.
* When SMTP is unconfigured, meetings are still saved successfully, and the server logs: `[SMTP Not Configured] Skipped sending automated invite...`.
</details>

<details>
<summary><strong>Q3: How do guests join meetings without an account?</strong></summary>

* Direct guests to the meeting link (e.g., `https://your-domain.com?room=sprint-review`).
* The guest will see the **Corporate Knocking Lobby**, enter their name, and wait for the meeting host to admit them.
</details>

<details>
<summary><strong>Q4: Why does the Chrome Side Panel say "Server Disconnected"?</strong></summary>

* Ensure the backend server is running on port 5000 (`npm run server`).
* The extension connects to `http://localhost:5000` by default. If using a remote server, update `DEFAULT_BACKEND_ORIGIN` in `client/src/config/constants.js`.
</details>

---

## 17. Strategic Engineering Roadmap

```mermaid
flowchart LR
    Phase1["Phase 1: Calling Suite & Productivity [COMPLETED]\n• Split App.jsx into modular components\n• Client-Side Recording & Multi-Audio Mixer\n• Agenda Timeboxing & Speaker Turn-Taking\n• P2P Encrypted File Sharing (RTCDataChannel)\n• Real-Time Collaborative Whiteboard Stage"] --> Phase2["Phase 2: Scalability & Cloud Assets [COMPLETED]\n• Offload base64 images to S3/Cloudflare R2\n• Zero-dependency SigV4 signing engine\n• Automated SQLite schema migrations\n• Storage management & migration cockpit"]
    Phase2 --> Phase3["Phase 3: Enterprise Calling Engine\n• Optional SFU Relay (LiveKit / Mediasoup)\n• Cloud meeting archiving\n• AI meeting transcription & action items"]
```

* **Phase 1 (Component Modularization & Real-Time Calling Suite) — [COMPLETED]:** Decomposed the monolithic frontend into focused components (`components/views`, `components/conference`, `components/chat`, `components/modals`, `components/common`, `config/`, `utils/`), completed client-side audio/video meeting recording with multi-track mixing, deployed real-time in-call Agenda Timeboxing and Speaker Turn-Taking FIFO moderation, engineered zero-cloud peer-to-peer encrypted file and document sharing over WebRTC `RTCDataChannel`, and launched the full-featured collaborative whiteboard stage with synchronized drawing, sticky notes, and laser pointer.
* **Phase 2 (Cloud Asset Storage & Schema Migrations) — [COMPLETED]:** Built a multi-driver Object Storage Subsystem supporting Cloudflare R2 (zero egress fees), AWS S3 / MinIO, and high-speed local disk storage with native AWS SigV4 signing (0 external dependencies). Built versioned database schema migration engine (`_schema_migrations`), automated Base64-to-cloud asset migration with SQLite `VACUUM`, and an interactive Cloud Storage status & migration card in the executive Analytics view.
* **Phase 3 (Enterprise Calling & SFU):** Introduce an optional Selective Forwarding Unit (SFU) for large-scale conferences with 8+ participants, while preserving lightweight P2P mesh for 1:1 and small team calls.

---

<div align="center">

**PCS Meet Manager** • Engineered for focused productivity and seamless real-time collaboration.

*Maintained by the Executive Engineering Team • Version 2.0.0*

</div>
