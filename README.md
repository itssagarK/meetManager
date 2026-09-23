# MeetManager

A simple full-stack web application to schedule meetings, track agendas, and organize action items.

Live Demo: [https://meetmanager-p55v.onrender.com](https://meetmanager-p55v.onrender.com)

## Features

- Calendar view with day-by-day filtering
- Table view and card view for quick scanning
- Priority and discussion notes tracker for each meeting
- Slide-out side drawer for adding and editing meetings
- Responsive layout for mobile and desktop

## Tech Stack

- **Frontend**: React 19, Vite, CSS
- **Backend**: Node.js (ES Modules), Express 5, CORS
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Render

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/itssagarK/meetManager.git
   cd meetManager
   ```

2. Start the server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. Start the client:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

The frontend runs on `http://localhost:5173` and proxies API requests to `http://localhost:5000`.

## Author
Sagar ([@itssagarK](https://github.com/itssagarK))
