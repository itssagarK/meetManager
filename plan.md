# PCS Meet Manager: Comprehensive Product Specification & Architecture Plan

- **Project**: PCS Meet Manager
- **Version**: 2.0.0
- **Document Status**: Approved Engineering & Product Blueprint
- **Target Platforms**: Standalone Web App (React + Node/SQLite) and Cross-Browser Extension (Chrome, Edge, Firefox, Safari)

---

## 1. Executive Summary & Vision

**PCS Meet Manager** is a high-speed, keyboard-first executive workspace engineered to eliminate meeting fatigue, keep daily action items organized, and bridge the gap between schedule planning and task execution.

### Core Tenets:
1. **Zero-Lag Interactions**: Every user action (completing a task, rolling an item over, filtering views) executes optimistically in 0ms with background database synchronization.
2. **Tactile Executive Aesthetic**: High-contrast, clean monochrome foundation with a strict 3-color accent system (Blue, Green, Red), solid black borders, and zero decorative noise or emojis.
3. **Ambient Browser Presence**: Evolves from an isolated tab into a persistent side panel extension that detects meetings in real time and alerts users before calls begin.

---

## 2. Real-World Problems Solved & Feature Specifications

### A. Problem: Pre-Meeting Rush & Context Scrambling
* **Pain Point**: Professionals often scramble 2 minutes before a call searching through tabs, calendar invites, and chat channels to find the meeting link, attendee names, and discussion points.
* **Feature: "Up Next" Focus Hero Banner**
  * **Location**: Pinned at the top of the main workspace (above the calendar and agenda).
  * **Behavior**:
    * Dynamically calculates the next upcoming meeting scheduled for the current date based on the user's local clock.
    * Displays a real-time countdown badge: `Starts in [X] mins` (or `In Progress` if within the meeting duration).
    * Provides a prominent, bold **Join Call** button that launches the Google Meet/Zoom link immediately.
    * Displays attendee initials/chips and a one-line preview of the agenda note.
  * **Empty State**: When no meetings remain for the day, displays a clean confirmation: `All meetings concluded for today`.

### B. Problem: Backlog Decay & Morning Task Amnesia
* **Pain Point**: Tasks left incomplete yesterday or earlier in the week stay hidden in past dates, quietly decaying and causing backlog anxiety.
* **Feature: Morning Overdue Triage Bar**
  * **Location**: Inline alert banner at the top of Today's view.
  * **Behavior**:
    * Automatically queries all tasks where `status = 'Pending'` and `date < today`.
    * If count > 0, renders a high-visibility alert:  
      `[N] pending tasks from past dates require review.`
    * **Action 1**: `[Move All to Today]` - Instantly updates all overdue items' dates to today's date in a single batch operation.
    * **Action 2**: `[Review]` - Opens a filtered list of overdue items for selective rollover or deletion.

### C. Problem: Calendar Silos & Double Data Entry
* **Pain Point**: Users want their meetings tracked in PCS Meet Manager but still need them reflected on external calendar applications (Google Calendar, Outlook, Apple Calendar) without configuring complex OAuth API credentials.
* **Feature: 1-Click External Calendar Sync Suite**
  * **Google Calendar Direct Web Link**:
    * A dedicated **Add to Google Calendar** button on meeting cards and the edit drawer.
    * Generates a pre-filled URL using the Google Calendar web standard:  
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=[TITLE]&dates=[START]/[END]&details=[NOTES]&location=[LINK]`
    * Launches in a new browser tab with zero API keys or user authentication required.
  * **Universal `.ics` iCalendar File Export**:
    * Generates an RFC 5545 compliant `.ics` calendar file in memory.
    * Downloads directly on click for instant import into Microsoft Outlook, Apple Calendar, or Thunderbird.

### D. Problem: Lost Action Items ("Post-Meeting Amnesia")
* **Pain Point**: Discussions end with notes taken in the agenda, but the action items never get transferred into trackable tasks.
* **Feature: Meeting Notes to Task Converter**
  * **Location**: Inside the meeting card action row and within the drawer view.
  * **Behavior**:
    * Parses bullet points or text inside the meeting's `notes` field.
    * Single click creates linked follow-up tasks due tomorrow with priority set to `Medium`.

### E. Problem: Visual Clutter & Focus Switching
* **Pain Point**: Having all tasks, meetings, and finished items rendered in a single stream overwhelms the user during high-focus work blocks.
* **Feature: Quick Filter Segmented Chips**
  * **Location**: Directly below the search bar in the header or top of workspace.
  * **Pills**: `All Items` | `Meetings Only` | `Tasks Only` | `High Priority` | `Pending`
  * Instant client-side filtering without reloading or re-fetching data.

---

## 3. Strict Design System & UI/UX Guidelines

To ensure the interface feels crisp, authoritative, and distraction-free:

### Color Palette (Strict 3 Accents)
* **Primary Blue (`#1d4ed8`)**: Used for primary action buttons (+ New Task, Submit, Active Navigation).
* **Success Green (`#16a34a`)**: Used for meetings, completed task states, + Schedule Meeting button, and connection status.
* **Alert Red (`#dc2626`)**: Used for high priority tags, delete actions, and overdue alerts.
* **Monochrome Canvas**:
  * Background: Pure White (`#ffffff`)
  * Surface Panels: Pure White (`#ffffff`)
  * Borders: True Black (`#000000`, 1.5px solid)
  * Headings & Body: Deep Charcoal (`#111827`)
  * Subtext / Secondary: Slate Gray (`#64748b`)

### Tactile Micro-Interactions
* Buttons feature a solid 1.5px black border and a crisp 1px drop shadow:
  * Rest state: `box-shadow: 1px 1px 0 #000000`
  * Active state: `transform: translate(1px, 1px); box-shadow: none`
* Tabular Numerals: All timestamps, dates, counters, and countdowns use `font-variant-numeric: tabular-nums` to guarantee exact vertical alignment.
* Zero Emoji Policy: Absolutely zero emojis are permitted across UI labels, button text, notification dialogs, clipboard templates, or project documentation.

---

## 4. System Architecture & Data Schema

### Current Architecture (Full-Stack Web App)
* **Frontend**: React 19 + Vite 8
* **Styling**: Native CSS3 with CSS variables in `client/src/App.css`
* **Local Persistence**: `localStorage` cached state for 0ms startup and offline resilience
* **Backend**: Express server in `server/server.js` running on Node.js
* **Database**: Embedded SQLite using `better-sqlite3` located at `server/meetings.db`

### SQLite Database Schema (`meetings` Table)
```sql
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,         -- Format: YYYY-MM-DD
  time TEXT NOT NULL,         -- Format: hh:mm AM/PM
  link TEXT,                  -- Video conference URL (Meet, Zoom, Teams)
  attendees TEXT,             -- Comma-separated list of attendees
  notes TEXT,                 -- Agenda, description, and discussion points
  priority TEXT DEFAULT 'Medium', -- 'High' | 'Medium' | 'Low'
  status TEXT DEFAULT 'Pending',  -- 'Pending' | 'Completed'
  type TEXT DEFAULT 'task',       -- 'task' | 'meeting'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Browser Extension Evolution (Chrome, Edge, Firefox, Safari)

### Form Factor Options
1. **Chrome Side Panel (`chrome.sidePanel`)**:
   * Pinned alongside open tabs (Google Meet, Gmail, Jira).
   * Remains visible while attending calls without alt-tabbing.
2. **Toolbar Action Popup (`default_popup`)**:
   * Quick glance dropdown for checking the next call or adding a fast task.
3. **Omnipresent Quick Capture**:
   * Global keyboard shortcut (e.g., `Alt+M`) triggers quick entry from any web page.

### Cross-Browser Tech Stack
* **Standards**: W3C WebExtensions Specification (Manifest V3).
* **Tooling**: React + Vite bundled with `@crxjs/vite-plugin` or **WXT**.
* **Cross-Browser Polyfill**: `webextension-polyfill` for unified Promise-based APIs across Chrome, Edge, Firefox, and Safari.
* **Extension Capabilities**:
  * `chrome.alarms`: Triggers background alarms 2 minutes before scheduled meetings.
  * `chrome.notifications`: Sends native OS notifications with a direct "Join Now" button.
  * `chrome.tabs`: Detects active meeting URLs on `meet.google.com`, `zoom.us`, and `teams.microsoft.com` to auto-populate meeting creation.
  * `chrome.storage.local`: High-capacity local extension storage with background sync to the SQLite API server.

---

## 6. Phased Implementation Roadmap

### Phase 1: Daily Workflow Essentials (Current Priority)
- [x] **1.1 "Up Next" Focus Hero Banner**: Real-time next meeting card with countdown timer and Join Call button.
- [x] **1.2 Morning Overdue Triage Bar**: Detect past pending tasks and provide a 1-click "Move All to Today" action.
- [x] **1.3 Quick Filter Segmented Chips**: Instant filtering by `All`, `Meetings`, `Tasks`, `High Priority`, and `Pending`.

### Phase 2: External Calendar & Export Suite
- [x] **2.1 Google Calendar Direct Link**: 1-click pre-filled URL generator for Google Calendar.
- [x] **2.2 External Calendar Export**: Streamlined to 1-Click Google Calendar direct URL (removed redundant .ics export).
- [x] **2.3 Markdown / Plain Text Copy**: Clean formatted clipboard export of daily agenda.

### Phase 3: Executive Power Tools
- [x] **3.1 Command Palette (`Ctrl+K` / `Cmd+K`)**: Keyboard-driven search, date switching, and batch actions.
- [x] **3.2 90-Day Activity Heatmap**: GitHub-style activity grid of completed tasks and meetings.
- [x] **3.3 Meeting Notes to Task Converter**: Automatic extraction of action items into tasks.

### Phase 4: Browser Extension Packaging
- [x] **4.1 Manifest V3 Configuration**: Setup `manifest.json` with Side Panel and Popup views.
- [x] **4.2 Pre-Meeting Desktop Notifications**: Alarms triggered 2 minutes before meetings.
- [x] **4.3 Active Tab URL Detector**: Auto-grab meeting links from Google Meet and Zoom.

---

## 7. Quality & Verification Standards
* Every feature change must pass `npm run build` in `client/` with 0 errors.
* Database operations must maintain transaction safety with SQLite.
* UI latency standard: 0ms visual feedback via optimistic updates on all clicks.
* Strict compliance with the Zero-Emoji directive across all interfaces and data outputs.
