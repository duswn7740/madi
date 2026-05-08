const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /users/register - 회원가입
exports.register = async (req, res) => {
  const { email, password, nickname } = req.body;
  if (!email || !password || !nickname)
    return res.status(400).json({ error: 'email, password, nickname 필요' });

  const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ error: '이미 사용중인 이메일입니다.' });

  const password_hash = await bcrypt.hash(password, 10);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
      [email, password_hash, nickname]
    );
    const [[defaultPack]] = await conn.query("SELECT id FROM sticker_packs WHERE unlock_type = 'default' LIMIT 1");
    if (defaultPack) {
      await conn.query('INSERT INTO unlocked_packs (user_id, pack_id) VALUES (?, ?)', [result.insertId, defaultPack.id]);
    }

    await conn.commit();
    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ token, nickname });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// POST /users/login - 로그인, JWT 토큰 발급
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

// GET /users/me - 내 정보 조회
exports.getMe = async (req, res) => {
  const [[user]] = await db.query(
    'SELECT id, email, nickname, coins, expo_push_token, total_ad_count, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(user);
};

// PATCH /users/me - 닉네임 또는 expo 푸시 토큰 수정
exports.updateMe = async (req, res) => {
  const { nickname, expo_push_token } = req.body;
  await db.query(
    'UPDATE users SET nickname = COALESCE(?, nickname), expo_push_token = COALESCE(?, expo_push_token) WHERE id = ?',
    [nickname ?? null, expo_push_token ?? null, req.user.id]
  );
  res.json({ ok: true });
};

// PATCH /users/password - 비밀번호 변경
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'currentPassword, newPassword 필요' });

  const [[user]] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: '현재 비밀번호가 틀렸습니다.' });

  const password_hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);
  res.json({ ok: true });
};

// DELETE /users/me - 회원 탈퇴 (소프트 삭제)
exports.deleteMe = async (req, res) => {
  await db.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [req.user.id]);
  res.json({ ok: true });
};
