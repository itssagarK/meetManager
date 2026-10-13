import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'meetings.db');
const db = new Database(dbPath);

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try {
  db.exec("ALTER TABLE meetings ADD COLUMN priority TEXT DEFAULT 'Medium'");
} catch (e) {}

try {
  db.exec("ALTER TABLE meetings ADD COLUMN type TEXT DEFAULT 'task'");
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

// Routes
app.get('/api/meetings', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM meetings ORDER BY date ASC, time ASC').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/meetings', (req, res) => {
  try {
    const { title, date, time, link, attendees, notes, priority, status, type } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Title, date, and time are required fields.' });
    }

    const itemType = type || (link || (attendees && attendees.trim() !== '') ? 'meeting' : 'task');

    const stmt = db.prepare(`
      INSERT INTO meetings (title, date, time, link, attendees, notes, priority, status, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      itemType
    );

    const newItem = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, time, link, attendees, notes, priority, status, type } = req.body;

    const itemType = type || (link || (attendees && attendees.trim() !== '') ? 'meeting' : 'task');

    const stmt = db.prepare(`
      UPDATE meetings
      SET title = ?, date = ?, time = ?, link = ?, attendees = ?, notes = ?, priority = ?, status = ?, type = ?
      WHERE id = ?
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
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
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
    const stmt = db.prepare('DELETE FROM meetings WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});