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

const db = new Database('meetings.db');

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
    status TEXT DEFAULT 'Upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try {
  db.exec("ALTER TABLE meetings ADD COLUMN priority TEXT DEFAULT 'Medium'");
} catch (e) {
  // column already exists
}

// seed townhall meetings for local testing
const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true' || (!isProduction && process.env.SEED_DEMO_DATA !== 'false');

if (shouldSeedDemo) {
  try {
    db.prepare(`
      UPDATE meetings
      SET attendees = 'Sagar (Organizer), Priya Sharma, Rahul Verma'
      WHERE attendees LIKE '%Sarah%' OR attendees LIKE '%Candidate%' OR attendees = ''
    `).run();

    db.prepare(`
      UPDATE meetings
      SET attendees = 'Sagar (Host), Vikram Malhotra, Neha Patel, All Hands'
      WHERE title = 'Saturday Townhall'
    `).run();
  } catch (e) {}

  const insertStmt = db.prepare(`
    INSERT INTO meetings (title, date, time, link, attendees, notes, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 6) {
      const dateStr = d.toISOString().split('T')[0];
      const exists = db.prepare('SELECT id FROM meetings WHERE title = ? AND date = ?')
        .get('Saturday Townhall', dateStr);

      if (!exists) {
        insertStmt.run(
          'Saturday Townhall',
          dateStr,
          '11:00 PM',
          'https://meet.google.com/townhall',
          'Sagar (Host), Vikram Malhotra, Neha Patel, All Hands',
          'Weekly townhall: Review milestones, key updates, team achievements, and open Q&A.',
          'High',
          'Upcoming'
        );
      }
    }
  }
}

// routes
app.get('/api/meetings', (req, res) => {
  try {
    const meetings = db.prepare('SELECT * FROM meetings ORDER BY date ASC, time ASC').all();
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/meetings', (req, res) => {
  try {
    const { title, date, time, link, attendees, notes, priority, status } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Title, date, and time are required fields.' });
    }

    const stmt = db.prepare(`
      INSERT INTO meetings (title, date, time, link, attendees, notes, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      date,
      time,
      link || '',
      attendees || '',
      notes || '',
      priority || 'Medium',
      status || 'Upcoming'
    );

    const newMeeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, time, link, attendees, notes, priority, status } = req.body;

    const stmt = db.prepare(`
      UPDATE meetings
      SET title = ?, date = ?, time = ?, link = ?, attendees = ?, notes = ?, priority = ?, status = ?
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
      status || 'Upcoming',
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
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
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ message: 'Meeting deleted successfully', id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// serve frontend in production
if (isProduction) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});