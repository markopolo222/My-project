const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Add meg a felhasználónevet és a jelszót.' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  if (!user) {
    return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó.' });
  }

  const passwordMatches = bcrypt.compareSync(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Hibás felhasználónév vagy jelszó.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

module.exports = router;