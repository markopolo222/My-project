const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'avi-admin.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'uj',
    due_date TEXT DEFAULT '',
    internal_note TEXT DEFAULT '',
    attachment_url TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS site_content (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hero_title TEXT NOT NULL,
    hero_lead TEXT NOT NULL,
    hero_image_url TEXT NOT NULL DEFAULT '',
    contact_phone TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL DEFAULT '',
    services_json TEXT NOT NULL DEFAULT '[]',
    weld_types_json TEXT NOT NULL DEFAULT '[]',
    pricing_json TEXT NOT NULL DEFAULT '[]'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed egy admin felhasználót, ha az adatbázis még üres.
const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();

if (userCount.count === 0) {
  const defaultPassword = 'admin1234';
  const hash = bcrypt.hashSync(defaultPassword, 10);

  db.prepare(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
  ).run('admin', hash, 'admin');

  console.log('Alap admin felhasználó létrehozva:');
  console.log('  felhasználónév: admin');
  console.log(`  jelszó: ${defaultPassword}`);
  console.log('Jelentkezz be, és utána azonnal változtasd meg a jelszót.');
}

// Seed a weboldal alaptartalmát, ha még nincs.
const contentRow = db.prepare('SELECT COUNT(*) AS count FROM site_content').get();

if (contentRow.count === 0) {
  const defaultServices = [
    { title: 'MIG/MAG hegesztés', description: 'Szén- és ötvözött acél szerkezetek gyors, tiszta varratú összeépítése.' },
    { title: 'Ipari acélszerkezetek', description: 'Csarnokvázak, tartókonzolok, lépcsők és korlátok gyártása.' },
    { title: 'Egyedi fémmegmunkálás', description: 'Egyedi méretű alkatrészek hajlítása, vágása, hegesztése.' },
    { title: 'Helyszíni kiszállás', description: 'Mobil felszereléssel dolgozunk az Ön telephelyén.' },
    { title: 'Karbantartás, javítás', description: 'Elhasználódott fémszerkezetek felújítása, megerősítése.' },
    { title: 'Minőségbiztosítás', description: 'Minden varratról jegyzőkönyv és tanúsítvány készül.' },
  ];
  const defaultWeldTypes = [
    { title: 'MIG/MAG hegesztés', description: 'Gyors, tiszta varratú eljárás szén- és ötvözött acélokhoz.' },
    { title: 'Ívhegesztés', description: 'Bevont elektródás technológia vastagabb anyagokhoz.' },
    { title: 'TIG hegesztés', description: 'Precíz, esztétikus varrat vékonyabb lemezekhez.' },
    { title: 'Ponthegesztés', description: 'Gyors, pontszerű kötés vékony lemezekhez.' },
    { title: 'Robothegesztés', description: 'Ismétlődő, nagy pontosságú varratokhoz.' },
  ];
  const defaultPricing = [
    { name: 'Alap', title: 'Felmérés és kisebb javítás', price: '15 000 Ft / kiszállástól', features: 'Helyszíni felmérés\nKisebb varrat javítása\nEgy munkanapos átfutás' },
    { name: 'Legnépszerűbb', title: 'Ipari szerkezet gyártása', price: 'Egyedi ár', features: 'Tervezés vagy rajz alapján\nMinőségi tanúsítvány\nHelyszíni összeszerelés' },
    { name: 'Vállalati', title: 'Folyamatos partnerség', price: 'Havi keretszerződés', features: 'Rendszeres karbantartás\nKiemelt időpontok\nKedvezményes díjak' },
  ];

  db.prepare(
    `INSERT INTO site_content
     (id, hero_title, hero_lead, contact_phone, contact_email, services_json, weld_types_json, pricing_json)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'Ahol az acél tartós kötést kap',
    'Az Awi Hegesztés MIG/MAG és ívhegesztési technológiával készít egyedi fémszerkezeteket, gépipari alkatrészeket és ipari csarnokelemeket — helyszíni kiszállással és teljes körű minőségi tanúsítvánnyal.',
    '+36 30 000 0000',
    'info@awihegesztes.hu',
    JSON.stringify(defaultServices),
    JSON.stringify(defaultWeldTypes),
    JSON.stringify(defaultPricing)
  );
}

module.exports = db;
