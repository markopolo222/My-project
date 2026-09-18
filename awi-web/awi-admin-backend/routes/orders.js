const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db');
const { requireAuth } = require('../middleware/require-auth');
const upload = require('../middleware/upload');
const { sendNewOrderNotification } = require('../utils/mailer');
const { logAction } = require('../utils/audit');

const router = express.Router();

function toClientOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    internalNote: row.internal_note,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
  };
}

// NYILVÁNOS: ezt hívja a weboldal árajánlat-formja
router.post('/', async (req, res) => {
  const { customerName, phone, email, description } = req.body;

  if (!customerName) {
    return res.status(400).json({ message: 'Az ügyfél neve kötelező.' });
  }

  const result = db
    .prepare(
      'INSERT INTO orders (customer_name, phone, email, description, status) VALUES (?, ?, ?, ?, ?)'
    )
    .run(customerName, phone || '', email || '', description || '', 'uj');

  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  const clientOrder = toClientOrder(created);

  await sendNewOrderNotification(clientOrder);

  res.status(201).json(clientOrder);
});

// Innentől admin bejelentkezés szükséges
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json(rows.map(toClientOrder));
});

// CSV export - Excelben megnyitható
router.get('/export.csv', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();

  const header = 'Ügyfél,Telefon,Email,Leírás,Státusz,Határidő,Beérkezett\n';
  const body = rows
    .map((r) => {
      const cells = [
        r.customer_name,
        r.phone,
        r.email,
        (r.description || '').replace(/\n/g, ' ').replace(/"/g, "'"),
        r.status,
        r.due_date,
        r.created_at,
      ];
      return cells.map((c) => `"${c || ''}"`).join(',');
    })
    .join('\n');

  logAction(req.user.username, 'orders_export', `${rows.length} rendelés`);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rendelesek.csv"');
  res.send('\uFEFF' + header + body);
});

// Egy rendeléshez tartozó árajánlat PDF generálása
router.get('/:id/quote-pdf', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Rendelés nem található.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="arajanlat-${order.id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });

  // Arial betűtípusok regisztrálása az ékezetes karakterek támogatásához
  doc.registerFont('Arial', 'C:/Windows/Fonts/arial.ttf');
  doc.registerFont('Arial-Bold', 'C:/Windows/Fonts/arialbd.ttf');

  doc.pipe(res);

  doc
    .font('Arial-Bold')
    .fontSize(20)
    .text('Awi Hegesztés - Árajánlat', { underline: true });
  doc.moveDown();

  doc
    .font('Arial')
    .fontSize(12)
    .text(`Dátum: ${new Date().toLocaleDateString('hu-HU')}`);
  doc.moveDown();

  doc
    .font('Arial-Bold')
    .fontSize(14)
    .text('Ügyfél adatai');
  doc
    .font('Arial')
    .fontSize(12)
    .text(`Név: ${order.customer_name}`)
    .text(`Telefon: ${order.phone || '-'}`)
    .text(`E-mail: ${order.email || '-'}`);
  doc.moveDown();

  doc
    .font('Arial-Bold')
    .fontSize(14)
    .text('A megrendelt munka');
  doc
    .font('Arial')
    .fontSize(12)
    .text(order.description || '-');
  doc.moveDown();

  doc
    .font('Arial')
    .fontSize(12)
    .text('Ez az árajánlat tájékoztató jellegű, a végleges ár helyszíni felmérés után kerül megállapításra.');

  doc.end();

  logAction(req.user.username, 'quote_pdf_generated', `Rendelés #${order.id}`);
});

// Csatolmány feltöltése egy rendeléshez (pl. rajz, méret)
router.post('/:id/attachment', upload.single('file'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Rendelés nem található.' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Nem érkezett fájl.' });
  }

  const url = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE orders SET attachment_url = ? WHERE id = ?').run(url, req.params.id);

  logAction(req.user.username, 'order_attachment_uploaded', `Rendelés #${order.id}`);
  res.json({ attachmentUrl: url });
});

// Státusz, határidő és belső jegyzet módosítása
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Rendelés nem található.' });
  }

  const status = req.body.status || existing.status;
  const dueDate = req.body.dueDate !== undefined ? req.body.dueDate : existing.due_date;
  const internalNote = req.body.internalNote !== undefined ? req.body.internalNote : existing.internal_note;

  const validStatuses = ['uj', 'folyamatban', 'kesz', 'lemondva'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Érvénytelen státusz.' });
  }

  db.prepare(
    'UPDATE orders SET status = ?, due_date = ?, internal_note = ? WHERE id = ?'
  ).run(status, dueDate, internalNote, req.params.id);

  logAction(req.user.username, 'order_updated', `Rendelés #${req.params.id}`);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(toClientOrder(updated));
});

// Rendelés törlése
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  logAction(req.user.username, 'order_deleted', `Rendelés #${req.params.id}`);
  res.status(204).send();
});

module.exports = router;