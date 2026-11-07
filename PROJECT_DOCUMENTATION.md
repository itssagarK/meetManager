# 📑 PCS Meet Manager — Complete System Architecture & Documentation

<div align="center">

![PCS Meet Manager Banner](docs/images/sidepanel.png)

### **Executive Productivity Workspace • Zero-Boundary WebRTC Calling • Chrome Side Panel (MV3)**

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Chrome%20Extension%20MV3-blue.svg)](https://meetmanager-p55v.onrender.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61dafb.svg)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%2020%20%2B%20Express%205-339933.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57.svg)](https://sqlite.org/)
[![Signaling](https://img.shields.io/badge/Realtime-WebSockets%20(ws)-010101.svg)](https://github.com/websockets/ws)
[![Calling](https://img.shields.io/badge/Video-WebRTC%20Mesh%20%2B%20Web%20Audio-FF6F00.svg)](https://webrtc.org/)

**[🌐 Live Production Demo](https://meetmanager-p55v.onrender.com)** • **[🎓 Beginner's Study Guide](docs/STUDY_GUIDE.md)** • **[🚀 Quickstart Guide](#15-installation-local-development--deployment-guide)** • **[📊 API Reference](#11-complete-rest-api-specification-reference)** • **[🔌 WebSocket Events](#12-complete-websocket-event-protocol-specification-ws)**

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
| ![WebRTC Calling](docs/images/call.png) | ![Knocking Lobby](docs/images/lobby.png) |
| *Multi-peer video calling with dynamic grids, active speaker halo, floating dock, and collapsible drawer.* | *Two-phase guest verification requiring Full Name & Office ID with host admit/deny controls.* |

### 2.2 Operational Viewports

| Month & Week Calendar View | Sprint Table View |
| :---: | :---: |
| ![Calendar View](docs/images/calendar.png) | ![Table View](docs/images/table.png) |
| *30-day interactive month grid with activity density indicators and 7-day executive sprint view.* | *High-density table with sortable columns, inline status toggling, and priority tags.* |

### 2.3 Collaboration & Metrics

| Global Real-Time Work Chat | Executive Analytics & Metrics |
| :---: | :---: |
| ![Work Chat](docs/images/chat.png) | ![Analytics View](docs/images/analytics.png) |
| *Instant messaging with live presence, typing bubbles, quoted replies, and image lightbox.* | *Completion rates, estimated weekly meeting hours, 90-day activity heatmap, and streak tracking.* |

### 2.4 Multitasking & Cards

| Chrome Side Panel (MV3) | Kanban Cards View |
| :---: | :---: |
| ![Chrome Side Panel](docs/images/sidepanel.png) | ![Cards View](docs/images/cards.png) |
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
        RateLimits["Two-Tier Rate Limiting\n(200 req/15min API & 80 req/5min Write)"]
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

---

### 4.2 Physical SQLite Database ER Diagram
This diagram represents the physical relational schema persisted in SQLite via `better-sqlite3` in Write-Ahead Logging (`WAL`) mode.

```mermaid
erDiagram
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
        TEXT attachment_url "Base64 image URI or asset link"
        TEXT attachment_type "Content classification: text | image"
        TEXT client_msg_id "UUID generated by client for deduplication (Indexed)"
        INTEGER reply_to_id FK "Self-referencing parent message ID"
        TEXT reply_to_sender "Parent sender name for quote banner"
        TEXT reply_to_content "Parent message excerpt"
        INTEGER is_deleted "Soft-delete flag: 0 (Active) | 1 (Deleted)"
        DATETIME created_at "Message timestamp"
    }

    ROOM_MESSAGES ||--o{ ROOM_MESSAGES : "replies to (reply_to_id)"
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
    Signaling->>Joiner: signal { fromPeerId: "peer_a", payload: { answer } }
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

## 9. Chrome Extension Manifest V3 & Desktop Alarms

### 9.1 Background Service Worker Architecture
The extension complies with Google Chrome Manifest V3 standards:

* **Persistent Side Panel:** Clicking the browser toolbar icon triggers `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.
* **Contextual Call Detection:** The "Auto-Detect Call Link" button inspects the active browser tab via `chrome.tabs.query()`. If the active tab is an active Google Meet, Zoom, or Teams call, its URL is automatically copied into the meeting link field.

```mermaid
flowchart TD
    AppLaunch["Meeting Scheduled or Fetched in Side Panel"] --> CalculateDelta["Compute Pre-Meeting Alert Time\n(Target Start Time - 2 Minutes)"]

    CalculateDelta --> RegisterAlarm["Register chrome.alarms\n(alarmName: meet-alert:Title)"]

    RegisterAlarm -. "Timer Elapsed (T - 2min)" .-> BackgroundWorker["background.js onAlarm Listener"]

    BackgroundWorker --> TriggerNotification["chrome.notifications.create\n(Title: Meeting Starting in 2 Minutes)"]

    TriggerNotification --> UserClicks{"User Clicks Notification"}
    UserClicks --> FocusSidePanel["chrome.sidePanel.open\n(Directs User into Meeting Room)"]
```

### 9.2 Automated Packaging Script
The packaging pipeline (`client/scripts/package-extension.js`) automates extension distribution:
1. Runs `vite build` to output production assets to `client/dist`.
2. Generates store-compliant PNG icons (`icon-16.png`, `icon-48.png`, `icon-128.png`).
3. Compresses `client/dist` into `pcs-meet-manager-extension.zip`.

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
| `POST` | `/api/rooms/:roomId/messages` | Standard | `{ senderName, senderId, content, attachmentUrl, clientMsgId, replyToId }` | `201` | Saves a chat message to SQLite and broadcasts to the room. |
| `DELETE` | `/api/rooms/:roomId/messages/:id`| Standard | None | `200` | Soft-deletes a message (`is_deleted = 1`) and broadcasts removal. |

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

    CORS --> RateLimitCheck{"Rate Limiter Tiers"}
    RateLimitCheck -- "GET Requests" --> GlobalLimiter["200 Requests / 15 Minutes per IP"]
    RateLimitCheck -- "POST / PUT / DELETE" --> StrictLimiter["80 Requests / 5 Minutes per IP"]

    GlobalLimiter --> Sanitization["Parameterized SQL Execution\n(Prepared Statements via better-sqlite3)"]
    StrictLimiter --> Sanitization
    Sanitization --> Dispatch["Execute Request Handler"]
```

1. **Content Security Policy (CSP):** Relaxed specifically to permit inline scripts required by Vite HMR, Google Fonts stylesheets, WebRTC media streams (`blob:`), and WebSocket connections (`ws:`, `wss:`).
2. **Two-Tier DDoS Rate Limiting:** Global limiter prevents endpoint scraping, while strict write limiters protect database write operations from spam.
3. **CORS Policy for Chrome Extensions:** Explicitly allows requests originating from `chrome-extension://` schemes.
4. **SQL Injection Prevention:** 100% of queries use `better-sqlite3` prepared statements with parameterized inputs.

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
* The extension connects to `http://localhost:5000` by default. If using a remote server, update `DEFAULT_BACKEND_ORIGIN` in `client/src/App.jsx`.
</details>

---

## 17. Strategic Engineering Roadmap

```mermaid
flowchart LR
    Phase1["Phase 1: Component Modularization\n• Split App.jsx into feature subdirectories\n• Adopt CSS Modules for scoped styling\n• Extract custom WebRTC hooks"] --> Phase2["Phase 2: Scalability & Cloud Assets\n• Offload base64 images to S3/Cloudflare R2\n• Add JWT-based multi-tenancy\n• Automated SQLite schema migrations"]
    Phase2 --> Phase3["Phase 3: Enterprise Calling Engine\n• Optional SFU Relay (LiveKit / Mediasoup)\n• Server-side meeting recording\n• AI meeting transcription & action items"]
```

* **Phase 1 (Component Modularization):** Decompose the single `App.jsx` orchestrator into focused components (`components/views`, `components/webrtc`, `components/chat`).
* **Phase 2 (Cloud Asset Storage):** Transition from Base64 data URIs in SQLite to object storage (AWS S3 or Cloudflare R2), storing clean CDN URLs in the database.
* **Phase 3 (Enterprise Calling & SFU):** Introduce an optional Selective Forwarding Unit (SFU) for large-scale conferences with 8+ participants, while preserving lightweight P2P mesh for 1:1 and small team calls.

---

<div align="center">

**PCS Meet Manager** • Engineered for focused productivity and seamless real-time collaboration.

*Maintained by the Executive Engineering Team • Version 2.0.0*

</div>
