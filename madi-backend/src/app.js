const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/users', require('./routes/users'));

app.use(auth);
app.use('/practices', require('./routes/practices'));
app.use('/logs', require('./routes/logs'));
app.use('/packs', require('./routes/packs'));
app.use('/shop', require('./routes/shop'));
app.use('/ads', require('./routes/ads'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류' });
});

module.exports = app;
