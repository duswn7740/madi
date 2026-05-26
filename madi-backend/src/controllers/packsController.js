const db = require('../config/db');

// POST /packs/:packId/select - 팩 선택 (오늘 날짜로 pack_history 기록)
exports.select = async (req, res) => {
  const packId = req.params.packId;
  const today = new Date().toISOString().slice(0, 10);

  const [[unlocked]] = await db.query(
    'SELECT id FROM unlocked_packs WHERE user_id = ? AND pack_id = ?',
    [req.user.id, packId]
  );
  if (!unlocked) return res.status(403).json({ error: '해금되지 않은 팩' });

  await db.query(
    `INSERT INTO pack_history (user_id, pack_id, from_date) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE pack_id = VALUES(pack_id)`,
    [req.user.id, packId, today]
  );
  res.json({ ok: true });
};

// GET /packs/active?date= - 특정 날짜에 사용 중이던 팩 조회 (과거 날짜 팩 유지용)
exports.getActive = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date 필요' });

  const [[row]] = await db.query(
    `SELECT sp.name FROM pack_history ph
     JOIN sticker_packs sp ON sp.id = ph.pack_id
     WHERE ph.user_id = ? AND ph.from_date <= ?
     ORDER BY ph.from_date DESC LIMIT 1`,
    [req.user.id, date]
  );

  if (row) return res.json({ packId: row.name });

  const [[defaultPack]] = await db.query(
    "SELECT name FROM sticker_packs WHERE unlock_type = 'default' LIMIT 1"
  );
  res.json({ packId: defaultPack?.name });
};
