const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/require-auth');
const { requireRole } = require('../middleware/require-role');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200')
    .all();

  res.json(
    rows.map((r) => ({
      id: r.id,
      username: r.username,
      action: r.action,
      details: r.details,
      createdAt: r.created_at,
    }))
  );
});

module.exports = router;