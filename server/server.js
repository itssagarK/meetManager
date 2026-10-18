import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy (Render, Cloudflare, Nginx, Docker)
app.set('trust proxy', 1);

// Enterprise HTTP security headers with relaxed CSP for WebRTC & Google Fonts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https://*.google.com'],
        mediaSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json());

// Rate Limiting: 200 requests per 15 minutes per IP for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again in 15 minutes.' },
});

// Stricter rate limit for write operations: 80 requests per 5 minutes
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many updates, please slow down.' },
});

app.use('/api/', apiLimiter);
app.use('/api/meetings', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

// Configurable database path for cloud persistent disks (e.g. Render /data/meetings.db)
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'meetings.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
// High-concurrency Write-Ahead Logging (WAL)
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
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
  )
`);

try {
  db.exec("ALTER TABLE meetings ADD COLUMN priority TEXT DEFAULT 'Medium'");
} catch (e) {}

try {
  db.exec("ALTER TABLE meetings ADD COLUMN type TEXT DEFAULT 'task'");
} catch (e) {}

try {
  db.exec("ALTER TABLE meetings ADD COLUMN workspace_id TEXT DEFAULT 'default'");
} catch (e) {}

// Clean up any Saturday Townhall meetings scheduled on non-Saturdays
try {
  db.prepare(`
    DELETE FROM meetings 
    WHERE title LIKE '%Saturday Townhall%' 
    AND strftime('%w', date) != '6'
  `).run();
} catch (e) {
  console.error('Townhall date cleanup error:', e);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// WebRTC ICE Server Configuration Endpoint (STUN + optional TURN Relay + Public Base URL)
app.get('/api/webrtc/ice-config', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ];

  // If production environment variables for a TURN server are provided
  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    });
  }

  // Derive public URL from environment or reverse proxy headers
  const forwardedProto = req.headers['x-forwarded-proto'] || req.protocol;
  const detectedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const publicUrl = process.env.PUBLIC_URL 
    ? process.env.PUBLIC_URL.replace(/\/$/, '') 
    : `${forwardedProto}://${detectedHost}`;

  res.json({ iceServers, publicUrl });
});

// Workspace extraction helper for multi-tenancy
const getWorkspaceId = (req) => {
  const ws = req.headers['x-workspace-id'];
  return (typeof ws === 'string' && ws.trim() !== '') ? ws.trim().toLowerCase() : 'default';
};

// Configure SMTP Transporter (if environment variables are present)
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate standard .ics iCalendar file content
const generateIcsAttachment = ({ title, date, time, link, notes }) => {
  const cleanDate = (date || '').replace(/-/g, '');
  const uid = `pcs-${Date.now()}@meetmanager.com`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PCS Meet Manager//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${cleanDate}T000000Z`,
    `DTSTART:${cleanDate}T100000Z`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${notes ? notes.replace(/\n/g, '\\n') : 'Scheduled via PCS Meet Manager'}`,
    `URL:${link || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

// Send Meeting Email Notification
const sendMeetingEmailNotification = async (meeting) => {
  const { title, date, time, link, attendees, notes } = meeting;
  if (!attendees) return;

  // Extract all valid emails from attendees string
  const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
  const recipientEmails = attendees.match(emailRegex);
  if (!recipientEmails || recipientEmails.length === 0) return;

  const transporter = createEmailTransporter();
  if (!transporter) {
    console.log(`[SMTP Not Configured] Skipped sending automated invite for "${title}" to: ${recipientEmails.join(', ')}`);
    return;
  }

  // Ensure meeting link resolves to an absolute public URL
  let resolvedLink = link;
  if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
    const base = process.env.PUBLIC_URL ? process.env.PUBLIC_URL.replace(/\/$/, '') : 'http://localhost:5000';
    const query = link.startsWith('?') ? link : (link.startsWith('room=') ? `?${link}` : `?room=${link}`);
    resolvedLink = `${base}${query}`;
  }

  const joinButtonHtml = resolvedLink
    ? `<div style="margin: 24px 0;">
        <a href="${resolvedLink}" style="background: #1d4ed8; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Join Video Meeting
        </a>
       </div>`
    : '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1.5px solid #000000; padding: 24px; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #09090b; border-bottom: 1.5px solid #000000; padding-bottom: 10px;">Meeting Invitation: ${title}</h2>
      <p style="font-size: 14px; color: #334155;">You have been invited to a meeting scheduled on <strong>PCS Meet Manager</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 80px; color: #64748b;">Date:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #09090b;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Time:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #09090b;">${time}</td>
        </tr>
        ${resolvedLink ? `<tr><td style="padding: 6px 0; font-weight: bold; color: #64748b;">Link:</td><td style="padding: 6px 0;"><a href="${resolvedLink}" style="color: #1d4ed8;">${resolvedLink}</a></td></tr>` : ''}
      </table>

      ${notes ? `<div style="background: #f8fafc; border-left: 3px solid #1d4ed8; padding: 12px; margin: 16px 0; font-size: 13px; color: #1e293b;"><strong style="display:block; margin-bottom:4px;">Agenda / Notes:</strong>${notes}</div>` : ''}

      ${joinButtonHtml}

      <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
        Calendar invitation (.ics) is attached. Open the attachment to add this event to Google Calendar, Outlook, or Apple Calendar.
      </p>
    </div>
  `;

  const icsContent = generateIcsAttachment({ title, date, time, link: resolvedLink, notes });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"PCS Meet Manager" <${process.env.SMTP_USER}>`,
      to: recipientEmails.join(', '),
      subject: `Meeting Invitation: ${title} (${date} at ${time})`,
      html: htmlContent,
      attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ],
    });
    console.log(`[Email Sent] Successfully delivered invite for "${title}" to: ${recipientEmails.join(', ')}`);
  } catch (err) {
    console.error('[Email Error] Failed to send meeting invitation:', err.message);
  }
};

// Routes
app.get('/api/meetings', (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const items = db.prepare('SELECT * FROM meetings WHERE workspace_id = ? ORDER BY date ASC, time ASC').all(workspaceId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/meetings', (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { title, date, time, link, attendees, notes, priority, status, type } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Title, date, and time are required fields.' });
    }

    const itemType = type || (link || (attendees && attendees.trim() !== '') ? 'meeting' : 'task');

    const stmt = db.prepare(`
      INSERT INTO meetings (title, date, time, link, attendees, notes, priority, status, type, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      date,
      time,
      link || '',
      attendees || '',
      notes || '',
      priority || 'Medium',
      status || 'Pending',
      itemType,
      workspaceId
    );

    const newItem = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);

    // Asynchronous automated email notification dispatch (0ms latency to client)
    if (itemType === 'meeting' && attendees && attendees.trim()) {
      sendMeetingEmailNotification(newItem).catch((err) =>
        console.error('Email notification background error:', err)
      );
    }

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = getWorkspaceId(req);
    const { title, date, time, link, attendees, notes, priority, status, type } = req.body;

    const itemType = type || (link || (attendees && attendees.trim() !== '') ? 'meeting' : 'task');

    const stmt = db.prepare(`
      UPDATE meetings
      SET title = ?, date = ?, time = ?, link = ?, attendees = ?, notes = ?, priority = ?, status = ?, type = ?
      WHERE id = ? AND workspace_id = ?
    `);

    const result = stmt.run(
      title,
      date,
      time,
      link || '',
      attendees || '',
      notes || '',
      priority || 'Medium',
      status || 'Pending',
      itemType,
      id,
      workspaceId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found in this workspace' });
    }

    const updated = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = getWorkspaceId(req);
    const stmt = db.prepare('DELETE FROM meetings WHERE id = ? AND workspace_id = ?');
    const result = stmt.run(id, workspaceId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found in this workspace' });
    }

    res.json({ message: 'Deleted successfully', id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production static assets
if (isProduction) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// WebSocket Signaling Server for Instant WebRTC Calling
const wss = new WebSocketServer({ server, path: '/ws' });
const rooms = new Map(); // roomId -> Set of WebSocket clients

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, roomId, payload } = data;

      if (type === 'join-room') {
        currentRoom = roomId;
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        const roomClients = rooms.get(roomId);
        roomClients.add(ws);

        // Notify other peers in this room that a peer has joined
        roomClients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'peer-joined', roomId }));
          }
        });
      } else if (type === 'signal') {
        // Relay WebRTC SDP offers, answers, and ICE candidate signals to the other peer(s) in room
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'signal', payload }));
            }
          });
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const roomClients = rooms.get(currentRoom);
      roomClients.delete(ws);
      roomClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'peer-left' }));
        }
      });
      if (roomClients.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server with WebRTC signaling running on port ${PORT}`);
});

// Graceful shutdown handling (SIGTERM / SIGINT)
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Initiating graceful shutdown...`);

  // 1. Notify and close active WebSockets
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1001, 'Server restarting or shutting down');
    }
  });

  // 2. Stop accepting new HTTP requests
  server.close(() => {
    console.log('HTTP and WebSocket server closed.');

    // 3. Close SQLite database connection cleanly
    try {
      db.close();
      console.log('SQLite database connection closed cleanly.');
    } catch (dbErr) {
      console.error('Error closing SQLite database:', dbErr);
    }

    process.exit(0);
  });

  // Force exit if shutdown hangs after 5 seconds
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));