const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // létrehozza az adatbázist és a táblákat induláskor

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const siteContentRoutes = require('./routes/site-content');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/audit', auditRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Awi Hegesztés admin API fut: http://localhost:${PORT}`);
});