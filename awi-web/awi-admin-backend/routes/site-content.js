const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/require-auth');
const upload = require('../middleware/upload');
const { logAction } = require('../utils/audit');

const router = express.Router();

function toClientContent(row) {
  // Ha még nem létezik az id = 1 sor az adatbázisban, alapértelmezett objektumot adunk vissza
  if (!row) {
    return {
      heroTitle: '',
      heroLead: '',
      heroImageUrl: '',
      contactPhone: '',
      contactEmail: '',
      services: [],
      weldTypes: [],
      pricing: [],
    };
  }

  return {
    heroTitle: row.hero_title || '',
    heroLead: row.hero_lead || '',
    heroImageUrl: row.hero_image_url || '',
    contactPhone: row.contact_phone || '',
    contactEmail: row.contact_email || '',
    services: JSON.parse(row.services_json || '[]'),
    weldTypes: JSON.parse(row.weld_types_json || '[]'),
    pricing: JSON.parse(row.pricing_json || '[]'),
  };
}

// NYILVÁNOS: ezt hívja a weboldal induláskor
router.get('/', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM site_content WHERE id = 1').get();
    res.json(toClientContent(row));
  } catch (err) {
    console.error('Hiba a site_content lekérésekor:', err);
    res.status(500).json({ message: 'Szerver hiba az adatok lekérésekor.' });
  }
});

// Innentől admin bejelentkezés szükséges
router.use(requireAuth);

// Képfeltöltés (POST /api/site-content/image)
router.post('/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nem érkezett kép.' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.put('/', (req, res) => {
  const {
    heroTitle, heroLead, heroImageUrl,
    contactPhone, contactEmail,
    services, weldTypes, pricing,
  } = req.body;

  if (!heroTitle || !heroLead) {
    return res.status(400).json({ message: 'A cím és a bevezető szöveg kötelező.' });
  }

  try {
    // INSERT OR REPLACE / UPSERT biztosítja, hogy akkor is elmentse, ha még nem létezett az id = 1 rekord
    const stmt = db.prepare(
      `INSERT INTO site_content (id, hero_title, hero_lead, hero_image_url, contact_phone, contact_email, services_json, weld_types_json, pricing_json)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hero_title = excluded.hero_title,
         hero_lead = excluded.hero_lead,
         hero_image_url = excluded.hero_image_url,
         contact_phone = excluded.contact_phone,
         contact_email = excluded.contact_email,
         services_json = excluded.services_json,
         weld_types_json = excluded.weld_types_json,
         pricing_json = excluded.pricing_json`
    );

    stmt.run(
      heroTitle, heroLead, heroImageUrl || '',
      contactPhone || '', contactEmail || '',
      JSON.stringify(services || []),
      JSON.stringify(weldTypes || []),
      JSON.stringify(pricing || [])
    );

    logAction(req.user ? req.user.username : 'admin', 'site_content_updated');

    const updated = db.prepare('SELECT * FROM site_content WHERE id = 1').get();
    res.json(toClientContent(updated));
  } catch (err) {
    console.error('Hiba a site_content mentésekor:', err);
    res.status(500).json({ message: 'Adatbázis hiba a mentés során.' });
  }
});

module.exports = router;