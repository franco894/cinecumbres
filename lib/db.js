import { createClient } from '@libsql/client';
import bcryptjs from 'bcryptjs';

const dbUrl = process.env.TURSO_DATABASE_URL || 'file:cinecumbres.db';
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

let _db = null;

export async function getDb() {
  if (!_db) {
    _db = createClient({
      url: dbUrl,
      authToken: dbAuthToken,
    });
    await initializeDb(_db);
  }
  return _db;
}

async function initializeDb(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      apartment TEXT NOT NULL,
      role TEXT DEFAULT 'resident' CHECK(role IN ('admin', 'resident')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      facility TEXT DEFAULT 'cine' CHECK(facility IN ('cine', 'reuniones')),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      title TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);`);

  try {
    await db.execute("ALTER TABLE reservations ADD COLUMN facility TEXT DEFAULT 'cine'");
  } catch (err) {
    // Column might already exist, safe to ignore
  }

  // Create default admin user if no users exist
  const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
  if (userCount.rows[0].count === 0) {
    const hash = bcryptjs.hashSync('admin123', 10);
    await db.execute({
      sql: `INSERT INTO users (email, password_hash, name, apartment, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['admin@cinecumbres.cl', hash, 'Administrador', 'ADMIN', 'admin']
    });
  }
}

// ============ USER QUERIES ============

export async function getUserByEmail(email) {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  return res.rows[0];
}

export async function getUserById(id) {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT id, email, name, apartment, role, created_at FROM users WHERE id = ?', args: [id] });
  return res.rows[0];
}

export async function getAllUsers() {
  const db = await getDb();
  const res = await db.execute('SELECT id, email, name, apartment, role, created_at FROM users ORDER BY apartment');
  return res.rows;
}

export async function createUser(email, password, name, apartment, role = 'resident') {
  const db = await getDb();
  const hash = bcryptjs.hashSync(password, 10);
  try {
    const result = await db.execute({
      sql: `INSERT INTO users (email, password_hash, name, apartment, role) VALUES (?, ?, ?, ?, ?)`,
      args: [email, hash, name, apartment, role]
    });
    return { id: result.lastInsertRowid?.toString(), email, name, apartment, role };
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      throw new Error('Ya existe un usuario con ese email');
    }
    throw err;
  }
}

export async function updateUser(id, data) {
  const db = await getDb();
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
  const res = await db.execute({
    sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    args: values
  });
  return res;
}

export async function deleteUser(id) {
  const db = await getDb();
  return await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
}

// ============ RESERVATION QUERIES ============

export async function getReservationsByDate(date, facility = 'cine') {
  const db = await getDb();
  if (facility === 'all') {
    const res = await db.execute({
      sql: `
        SELECT r.*, u.name as user_name, u.apartment
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        WHERE r.date = ? AND r.status = 'active'
        ORDER BY r.start_time
      `,
      args: [date]
    });
    return res.rows;
  }
  const res = await db.execute({
    sql: `
      SELECT r.*, u.name as user_name, u.apartment
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.date = ? AND r.facility = ? AND r.status = 'active'
      ORDER BY r.start_time
    `,
    args: [date, facility]
  });
  return res.rows;
}

export async function getReservationsByDateRange(startDate, endDate, facility = 'cine') {
  const db = await getDb();
  if (facility === 'all') {
    const res = await db.execute({
      sql: `
        SELECT r.*, u.name as user_name, u.apartment
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        WHERE r.date >= ? AND r.date <= ? AND r.status = 'active'
        ORDER BY r.date, r.start_time
      `,
      args: [startDate, endDate]
    });
    return res.rows;
  }
  const res = await db.execute({
    sql: `
      SELECT r.*, u.name as user_name, u.apartment
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.date >= ? AND r.date <= ? AND r.facility = ? AND r.status = 'active'
      ORDER BY r.date, r.start_time
    `,
    args: [startDate, endDate, facility]
  });
  return res.rows;
}

export async function getReservationsByUser(userId) {
  const db = await getDb();
  const res = await db.execute({
    sql: `
      SELECT r.*, u.name as user_name, u.apartment
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ? AND r.status = 'active'
      ORDER BY r.date DESC, r.start_time DESC
    `,
    args: [userId]
  });
  return res.rows;
}

export async function getReservationById(id) {
  const db = await getDb();
  const res = await db.execute({
    sql: `
      SELECT r.*, u.name as user_name, u.apartment
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `,
    args: [id]
  });
  return res.rows[0];
}

export async function createReservation(userId, facility, date, startTime, endTime, title = '', notes = '') {
  const db = await getDb();

  const conflicts = await db.execute({
    sql: `
      SELECT r.*, u.name as user_name, u.apartment
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.date = ? AND r.facility = ? AND r.status = 'active'
      AND r.start_time < ? AND r.end_time > ?
    `,
    args: [date, facility, endTime, startTime]
  });

  if (conflicts.rows.length > 0) {
    throw new Error(`Horario en conflicto con la reserva de ${conflicts.rows[0].user_name} (Depto ${conflicts.rows[0].apartment})`);
  }

  const result = await db.execute({
    sql: `
      INSERT INTO reservations (user_id, facility, date, start_time, end_time, title, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [userId, facility, date, startTime, endTime, title, notes]
  });

  return { id: result.lastInsertRowid?.toString() };
}

export async function cancelReservation(id, userId, isAdmin = false) {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM reservations WHERE id = ?', args: [id] });
  const reservation = res.rows[0];

  if (!reservation) {
    throw new Error('Reserva no encontrada');
  }

  if (!isAdmin && String(reservation.user_id) !== String(userId)) {
    throw new Error('No tienes permiso para cancelar esta reserva');
  }

  return await db.execute({ sql: "UPDATE reservations SET status = 'cancelled' WHERE id = ?", args: [id] });
}

export async function getAllReservations() {
  const db = await getDb();
  const res = await db.execute(`
    SELECT r.*, u.name as user_name, u.apartment
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'active'
    ORDER BY r.date DESC, r.start_time DESC
  `);
  return res.rows;
}
