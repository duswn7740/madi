const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/db');

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function generateTokens(userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { token, refreshToken, refreshTokenExpiresAt };
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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

    const { token, refreshToken, refreshTokenExpiresAt } = generateTokens(result.insertId);
    await conn.query(
      'UPDATE users SET refresh_token = ?, refresh_token_expires_at = ? WHERE id = ?',
      [refreshToken, refreshTokenExpiresAt, result.insertId]
    );
    await conn.commit();
    res.status(201).json({ token, refreshToken, nickname });
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

  const { token, refreshToken, refreshTokenExpiresAt } = generateTokens(user.id);
  await db.query(
    'UPDATE users SET refresh_token = ?, refresh_token_expires_at = ? WHERE id = ?',
    [refreshToken, refreshTokenExpiresAt, user.id]
  );
  res.json({ token, refreshToken, nickname: user.nickname });
};

// POST /users/forgot-password - 임시 비밀번호 발급 및 이메일 전송
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email 필요' });

  const [[user]] = await db.query('SELECT id, nickname FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
  if (!user) return res.status(404).json({ error: '가입된 이메일이 아닙니다.' });

  const tempPassword = generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, 10);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user.id]);

  await mailer.sendMail({
    from: `"마디" <${process.env.MAIL_USER}>`,
    to: email,
    subject: '[마디] 임시 비밀번호 안내',
    text: `안녕하세요 ${user.nickname}님!\n\n임시 비밀번호: ${tempPassword}\n\n로그인 후 비밀번호를 변경해주세요.`,
  });

  res.json({ ok: true });
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

// POST /users/refresh - access token 재발급 (refresh token rotation)
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken 필요' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[user]] = await conn.query(
      'SELECT id, refresh_token_expires_at FROM users WHERE refresh_token = ? AND deleted_at IS NULL FOR UPDATE',
      [refreshToken]
    );
    if (!user) {
      await conn.rollback();
      return res.status(401).json({ error: '유효하지 않은 refresh token' });
    }
    if (new Date() > new Date(user.refresh_token_expires_at)) {
      await conn.rollback();
      return res.status(401).json({ error: 'refresh token 만료' });
    }

    const newToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const newRefreshToken = generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await conn.query(
      'UPDATE users SET refresh_token = ?, refresh_token_expires_at = ? WHERE id = ?',
      [newRefreshToken, newExpiresAt, user.id]
    );

    await conn.commit();
    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// POST /users/logout - 로그아웃 (refresh token 무효화)
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query(
      'UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE refresh_token = ?',
      [refreshToken]
    );
  }
  res.json({ ok: true });
};
