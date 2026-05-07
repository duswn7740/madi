const db = require('../config/db');

// PATCH /logs/:practiceId/increment - 스티커 +1
exports.increment = async (req, res) => {
  const [[log]] = await db.query(
    `SELECT l.count FROM logs l
     JOIN practices p ON p.id = l.practice_id
     WHERE l.practice_id = ? AND p.user_id = ?`,
    [req.params.practiceId, req.user.id]
  );
  if (!log) return res.status(404).json({ error: '없는 연습' });
  if (log.count >= 10) return res.status(400).json({ error: '이미 10개 다 찍었어요' });

  await db.query(
    'UPDATE logs SET count = count + 1, updated_at = NOW() WHERE practice_id = ?',
    [req.params.practiceId]
  );
  res.json({ count: log.count + 1 });
};

// PATCH /logs/:practiceId/decrement - 스티커 -1 (마지막 칸만 취소)
exports.decrement = async (req, res) => {
  const [[log]] = await db.query(
    `SELECT l.count FROM logs l
     JOIN practices p ON p.id = l.practice_id
     WHERE l.practice_id = ? AND p.user_id = ?`,
    [req.params.practiceId, req.user.id]
  );
  if (!log) return res.status(404).json({ error: '없는 연습' });
  if (log.count <= 0) return res.status(400).json({ error: '취소할 스티커가 없어요' });

  await db.query(
    'UPDATE logs SET count = count - 1, updated_at = NOW() WHERE practice_id = ?',
    [req.params.practiceId]
  );
  res.json({ count: log.count - 1 });
};
