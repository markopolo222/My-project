const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware/require-auth');
const { requireRole } = require('../middleware/require-role');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.use(requireAuth);

// Saját profil lekérése
router.get('/me', (req, res) => {
  const user = db
    .prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(user);
});

// Saját jelszó módosítása - bármelyik bejelentkezett felhasználó megteheti
router.put('/me/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'A jelenlegi és az új jelszó is kötelező.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const matches = bcrypt.compareSync(currentPassword, user.password_hash);

  if (!matches) {
    return res.status(401).json({ message: 'A jelenlegi jelszó helytelen.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  logAction(req.user.username, 'password_changed', 'Saját jelszó módosítva');
  res.json({ message: 'Jelszó frissítve.' });
});

// Felhasználók listázása (jelszó nélkül)
router.get('/', (req, res) => {
  const users = db
    .prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = db
    .prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'Felhasználó nem található.' });
  }

  res.json(user);
});

// Új felhasználó létrehozása - csak admin
router.post('/', requireRole('admin'), (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Felhasználónév és jelszó kötelező.' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = db
      .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, hash, role || 'editor');

    logAction(req.user.username, 'user_created', username);
    res.status(201).json({ id: result.lastInsertRowid, username, role: role || 'editor' });
  } catch (err) {
    res.status(409).json({ message: 'Ez a felhasználónév már foglalt.' });
  }
});

// Felhasználó módosítása - csak admin
router.put('/:id', requireRole('admin'), (req, res) => {
  const { username, password, role } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Felhasználó nem található.' });
  }

  const newHash = password ? bcrypt.hashSync(password, 10) : existing.password_hash;

  db.prepare(
    'UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?'
  ).run(username || existing.username, newHash, role || existing.role, req.params.id);

  logAction(req.user.username, 'user_updated', username || existing.username);
  res.json({ id: Number(req.params.id), username: username || existing.username, role: role || existing.role });
});

// Felhasználó törlése - csak admin
router.delete('/:id', requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logAction(req.user.username, 'user_deleted', existing ? existing.username : `#${req.params.id}`);
  res.status(204).send();
});

module.exports = router;