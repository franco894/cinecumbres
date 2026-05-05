import Database from 'better-sqlite3';
import path from 'path';
import bcryptjs from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'cinecumbres.db');

let _db = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeDb(_db);
  }
  return _db;
}

function initializeDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      apartment TEXT NOT NULL,
      role TEXT DEFAULT 'resident' CHECK(role IN ('admin', 'resident')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      title TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
    CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
  `);

  // Create default admin user if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hash = bcryptjs.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (email, password_hash, name, apartment, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin@cinecumbres.cl', hash, 'Administrador', 'ADMIN', 'admin');
  }
}

// ============ USER QUERIES ============

export function getUserByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getUserById(id) {
  const db = getDb();
  return db.prepare('SELECT id, email, name, apartment, role, created_at FROM users WHERE id = ?').get(id);
}

export function getAllUsers() {
  const db = getDb();
  return db.prepare('SELECT id, email, name, apartment, role, created_at FROM users ORDER BY apartment').all();
}

export function createUser(email, password, name, apartment, role = 'resident') {
  const db = getDb();
  const hash = bcryptjs.hashSync(password, 10);
  try {
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, apartment, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, hash, name, apartment, role);
    return { id: result.lastInsertRowid, email, name, apartment, role };
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      throw new Error('Ya existe un usuario con ese email');
    }
    throw err;
  }
}

export function updateUser(id, data) {
  const db = getDb();
  const fields = [];
  const values = [];

  if (data.name) { fields.push('name = ?'); values.push(data.name); }
  if (data.apartment) { fields.push('apartment = ?'); values.push(data.apartment); }
  if (data.email) { fields.push('email = ?'); values.push(data.email); }
  if (data.role) { fields.push('role = ?'); values.push(data.role); }
  if (data.password) {
    fields.push('password_hash = ?');
    values.push(bcryptjs.hashSync(data.password, 10));
  }

  if (fields.length === 0) return null;

  values.push(id);
  return db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteUser(id) {
  const db = getDb();
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ============ RESERVATION QUERIES ============

export function getReservationsByDate(date) {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.date = ? AND r.status = 'active'
    ORDER BY r.start_time
  `).all(date);
}

export function getReservationsByDateRange(startDate, endDate) {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.date >= ? AND r.date <= ? AND r.status = 'active'
    ORDER BY r.date, r.start_time
  `).all(startDate, endDate);
}

export function getReservationsByUser(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ? AND r.status = 'active'
    ORDER BY r.date DESC, r.start_time DESC
  `).all(userId);
}

export function getReservationById(id) {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).get(id);
}

export function createReservation(userId, date, startTime, endTime, title = '', notes = '') {
  const db = getDb();

  // Check for overlapping reservations
  const conflicts = db.prepare(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.date = ? AND r.status = 'active'
    AND r.start_time < ? AND r.end_time > ?
  `).all(date, endTime, startTime);

  if (conflicts.length > 0) {
    throw new Error(`Horario en conflicto con la reserva de ${conflicts[0].user_name} (Depto ${conflicts[0].apartment})`);
  }

  const result = db.prepare(`
    INSERT INTO reservations (user_id, date, start_time, end_time, title, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, date, startTime, endTime, title, notes);

  return { id: result.lastInsertRowid };
}

export function cancelReservation(id, userId, isAdmin = false) {
  const db = getDb();
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);

  if (!reservation) {
    throw new Error('Reserva no encontrada');
  }

  if (!isAdmin && reservation.user_id !== userId) {
    throw new Error('No tienes permiso para cancelar esta reserva');
  }

  return db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(id);
}

export function getAllReservations() {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'active'
    ORDER BY r.date DESC, r.start_time DESC
  `).all();
}
