import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'standalone-school-app-secret-2024';
const PORT = process.env.PORT || 3001;

// ─── Database Setup ────────────────────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'teacher',
    created_date TEXT DEFAULT (datetime('now'))
  )
`);

// Generic entity table
const ensureTable = (name) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "${name}" (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_date TEXT DEFAULT (datetime('now')),
      updated_date TEXT DEFAULT (datetime('now'))
    )
  `);
};

// ─── Seed Default Users ────────────────────────────────────────────────────────
const seedUser = (email, password, name, role) => {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!exists) {
    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)').run(id, email, hash, name, role);
  }
};

seedUser('admin@school.local', 'admin123', 'מנהל המערכת', 'admin');
seedUser('teacher@school.local', 'teacher123', 'מורה לדוגמה', 'teacher');
seedUser('secretary@school.local', 'secretary123', 'מזכירה', 'secretary');
seedUser('hr@school.local', 'hr123', 'מנהל משאבי אנוש', 'hr');

// ─── App ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Auth Routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/auth/me', auth, (req, res) => {
  const { full_name } = req.body;
  db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(full_name, req.user.id);
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ─── Users Routes ──────────────────────────────────────────────────────────────
app.get('/api/users', auth, (req, res) => {
  const users = db.prepare('SELECT id, email, full_name, role, created_date FROM users').all();
  res.json(users);
});

app.post('/api/users/invite', auth, (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'User already exists' });

  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync('changeme123', 10);
  db.prepare('INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)').run(
    id, email, hash, email.split('@')[0], role || 'teacher'
  );
  res.json({ id, email, role, message: 'User created. Temporary password: changeme123' });
});

// ─── SSE for Real-Time Subscriptions ──────────────────────────────────────────
const sseClients = new Map(); // entityName -> Set<res>

const broadcast = (entityName, event) => {
  const clients = sseClients.get(entityName);
  if (!clients?.size) return;
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    try { client.write(data); } catch { clients.delete(client); }
  }
};

app.get('/api/subscribe/:name', (req, res) => {
  const { token } = req.query;
  try { jwt.verify(token, JWT_SECRET); } catch {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(': connected\n\n');

  const { name } = req.params;
  if (!sseClients.has(name)) sseClients.set(name, new Set());
  sseClients.get(name).add(res);

  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(keepAlive); }
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.get(name)?.delete(res);
  });
});

// ─── Generic Entity CRUD ───────────────────────────────────────────────────────
app.get('/api/entities/:name', auth, (req, res) => {
  const { name } = req.params;
  ensureTable(name);

  const { sort = '-created_date', limit = '500', ...filters } = req.query;

  const rows = db.prepare(`SELECT * FROM "${name}"`).all();
  let items = rows.map(row => ({ id: row.id, created_date: row.created_date, updated_date: row.updated_date, ...JSON.parse(row.data) }));

  // Filter
  for (const [key, val] of Object.entries(filters)) {
    items = items.filter(item => String(item[key]) === String(val));
  }

  // Sort
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDir = sort.startsWith('-') ? -1 : 1;
  items.sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    return sortDir * (av < bv ? -1 : av > bv ? 1 : 0);
  });

  res.json(items.slice(0, parseInt(limit)));
});

app.post('/api/entities/:name', auth, (req, res) => {
  const { name } = req.params;
  ensureTable(name);

  const id = crypto.randomUUID();
  const created_date = new Date().toISOString();
  const data = { ...req.body, created_by: req.user.id };

  db.prepare(`INSERT INTO "${name}" (id, data, created_date) VALUES (?, ?, ?)`).run(id, JSON.stringify(data), created_date);
  const item = { id, created_date, ...data };
  broadcast(name, { type: 'create', data: item });
  res.json(item);
});

app.post('/api/entities/:name/bulk', auth, (req, res) => {
  const { name } = req.params;
  ensureTable(name);

  const items = Array.isArray(req.body) ? req.body : [req.body];
  const created = [];

  const insert = db.prepare(`INSERT INTO "${name}" (id, data, created_date) VALUES (?, ?, ?)`);
  const insertMany = db.transaction((rows) => {
    for (const item of rows) {
      const id = crypto.randomUUID();
      const created_date = new Date().toISOString();
      const data = { ...item, created_by: req.user.id };
      insert.run(id, JSON.stringify(data), created_date);
      created.push({ id, created_date, ...data });
    }
  });

  insertMany(items);
  created.forEach(item => broadcast(name, { type: 'create', data: item }));
  res.json(created);
});

app.put('/api/entities/:name/:id', auth, (req, res) => {
  const { name, id } = req.params;
  ensureTable(name);

  const existing = db.prepare(`SELECT * FROM "${name}" WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const newData = { ...JSON.parse(existing.data), ...req.body };
  const updated_date = new Date().toISOString();
  db.prepare(`UPDATE "${name}" SET data = ?, updated_date = ? WHERE id = ?`).run(JSON.stringify(newData), updated_date, id);

  const item = { id, created_date: existing.created_date, updated_date, ...newData };
  broadcast(name, { type: 'update', data: item });
  res.json(item);
});

app.delete('/api/entities/:name/:id', auth, (req, res) => {
  const { name, id } = req.params;
  ensureTable(name);
  db.prepare(`DELETE FROM "${name}" WHERE id = ?`).run(id);
  broadcast(name, { type: 'delete', data: { id } });
  res.json({ success: true });
});

// ─── File Upload ───────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const file_url = `/uploads/${req.file.filename}`;
  res.json({ file_url, url: file_url });
});

// ─── Cloud Functions (stubs) ───────────────────────────────────────────────────
app.post('/api/functions/:name', auth, (req, res) => {
  console.log(`Function called: ${req.params.name}`, req.body);
  res.json({ success: true, result: null });
});

// ─── Serve Built Frontend ──────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('Run "npm run build" first, then restart the server.'));
}

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ School Management App: http://localhost:${PORT}\n`);
  console.log('Default users:');
  console.log('  Admin:     admin@school.local     / admin123');
  console.log('  Teacher:   teacher@school.local   / teacher123');
  console.log('  Secretary: secretary@school.local / secretary123');
  console.log('  HR:        hr@school.local        / hr123\n');
});
