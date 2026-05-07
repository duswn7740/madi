const db = require('../config/db');

// GET /practices?date= - 날짜별 연습 목록 (스티커 count 포함)
exports.getByDate = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date 필요' });

  const [rows] = await db.query(
    `SELECT p.*, COALESCE(l.count, 0) AS sticker_count
     FROM practices p
     LEFT JOIN logs l ON l.practice_id = p.id
     WHERE p.user_id = ? AND p.date = ?
     ORDER BY p.order_index`,
    [req.user.id, date]
  );
  res.json(rows);
};

// GET /practices/templates - 최근 연습 목록 (빠른 입력 칩용)
exports.getTemplates = async (req, res) => {
  const [rows] = await db.query(
    `SELECT content, MAX(created_at) AS last_used
     FROM practices
     WHERE user_id = ?
     GROUP BY content
     ORDER BY last_used DESC
     LIMIT 10`,
    [req.user.id]
  );
  res.json(rows);
};

// POST /practices - 연습 추가 (logs 행 자동 생성)
exports.create = async (req, res) => {
  const { date, content } = req.body;
  if (!date || !content) return res.status(400).json({ error: 'date, content 필요' });

  const [[{ maxOrder }]] = await db.query(
    'SELECT COALESCE(MAX(order_index), -1) AS maxOrder FROM practices WHERE user_id = ? AND date = ?',
    [req.user.id, date]
  );

  const [result] = await db.query(
    'INSERT INTO practices (user_id, date, content, order_index) VALUES (?, ?, ?, ?)',
    [req.user.id, date, content, maxOrder + 1]
  );

  await db.query('INSERT INTO logs (practice_id, count) VALUES (?, 0)', [result.insertId]);

  res.status(201).json({ id: result.insertId });
};

// PATCH /practices/:id - 연습 내용 수정
exports.update = async (req, res) => {
  const { content } = req.body;
  await db.query(
    'UPDATE practices SET content = ? WHERE id = ? AND user_id = ?',
    [content, req.params.id, req.user.id]
  );
  res.json({ ok: true });
};

// DELETE /practices/:id - 연습 삭제
exports.remove = async (req, res) => {
  await db.query('DELETE FROM practices WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
};

// POST /practices/:id/copy - 다른 날짜에 연습 복사 (스티커 0으로 초기화)
exports.copy = async (req, res) => {
  const { targetDate } = req.body;
  if (!targetDate) return res.status(400).json({ error: 'targetDate 필요' });

  const [[source]] = await db.query(
    'SELECT * FROM practices WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!source) return res.status(404).json({ error: '없는 연습' });

  const [[{ maxOrder }]] = await db.query(
    'SELECT COALESCE(MAX(order_index), -1) AS maxOrder FROM practices WHERE user_id = ? AND date = ?',
    [req.user.id, targetDate]
  );

  const [result] = await db.query(
    'INSERT INTO practices (user_id, date, content, order_index) VALUES (?, ?, ?, ?)',
    [req.user.id, targetDate, source.content, maxOrder + 1]
  );

  await db.query('INSERT INTO logs (practice_id, count) VALUES (?, 0)', [result.insertId]);

  res.status(201).json({ id: result.insertId });
};
