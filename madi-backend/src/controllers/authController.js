const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  const { email, password, nickname } = req.body;
  if (!email || !password || !nickname)
    return res.status(400).json({ error: 'email, password, nickname 필요' });

  const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ error: '이미 사용중인 이메일입니다.' });

  const password_hash = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
    [email, password_hash, nickname]
  );
  res.status(201).json({ ok: true });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email, password 필요' });

  const [[user]] = await db.query(
    'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );
  const valid = user && await bcrypt.compare(password, user.password_hash);
  if (!user || !valid) return res.status(401).json({ error: '이메일 또는 비밀번호가 틀렸습니다.' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ token, nickname: user.nickname });
};
