/**
 * Database Migrations Engine for PCS Meet Manager
 * Provides transactional, versioned schema migrations for SQLite.
 */

export const MIGRATIONS = [
  {
    version: 1,
    name: '001_core_schema',
    up: (db) => {
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
        );

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
      `);
    },
  },
  {
    version: 2,
    name: '002_storage_metadata',
    up: (db) => {
      // Add cloud storage metadata columns to room_messages if not already present
      const columns = db.pragma('table_info(room_messages)').map((c) => c.name);
      if (!columns.includes('storage_provider')) {
        db.exec("ALTER TABLE room_messages ADD COLUMN storage_provider TEXT DEFAULT 'local'");
      }
      if (!columns.includes('storage_key')) {
        db.exec('ALTER TABLE room_messages ADD COLUMN storage_key TEXT');
      }
      if (!columns.includes('file_size')) {
        db.exec('ALTER TABLE room_messages ADD COLUMN file_size INTEGER DEFAULT 0');
      }
      if (!columns.includes('mime_type')) {
        db.exec('ALTER TABLE room_messages ADD COLUMN mime_type TEXT');
      }
    },
  },
  {
    version: 3,
    name: '003_media_assets_registry',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS media_assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asset_key TEXT UNIQUE NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          storage_provider TEXT NOT NULL,
          public_url TEXT NOT NULL,
          workspace_id TEXT DEFAULT 'default',
          uploader_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_media_assets_key ON media_assets(asset_key);
        CREATE INDEX IF NOT EXISTS idx_media_assets_workspace ON media_assets(workspace_id);
      `);
    },
  },
  {
    version: 4,
    name: '004_meeting_attachments',
    up: (db) => {
      const columns = db.pragma('table_info(meetings)').map((c) => c.name);
      if (!columns.includes('attachments')) {
        db.exec("ALTER TABLE meetings ADD COLUMN attachments TEXT DEFAULT '[]'");
      }
    },
  },
];

/**
 * Initializes the migrations tracking table and executes any pending migrations.
 */
export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM _schema_migrations ORDER BY version ASC').all();
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  let newlyApplied = 0;

  for (const migration of MIGRATIONS) {
    if (!appliedSet.has(migration.version)) {
      console.log(`[Database Migration] Applying migration v${migration.version}: ${migration.name}...`);
      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO _schema_migrations (version, name) VALUES (?, ?)').run(
          migration.version,
          migration.name
        );
      })();
      newlyApplied++;
    }
  }

  const latestRow = db.prepare('SELECT version, name, applied_at FROM _schema_migrations ORDER BY version DESC LIMIT 1').get();
  const currentVersion = latestRow ? latestRow.version : 0;

  if (newlyApplied > 0) {
    console.log(`[Database Migration] Successfully applied ${newlyApplied} migration(s). Database at version ${currentVersion}.`);
  }

  return {
    currentVersion,
    totalMigrations: MIGRATIONS.length,
    newlyApplied,
  };
}

export default { MIGRATIONS, runMigrations };
