const db = require('../config/db');

// GET /shop - 전체 스티커팩 목록 + 해금 여부 + 구매 가능 여부
exports.getAll = async (req, res) => {
  const [packs] = await db.query('SELECT * FROM sticker_packs ORDER BY id');
  const [unlocked] = await db.query(
    'SELECT pack_id FROM unlocked_packs WHERE user_id = ?',
    [req.user.id]
  );
  const [[{ totalStickers }]] = await db.query(
    `SELECT COALESCE(SUM(l.count), 0) AS totalStickers
     FROM logs l JOIN practices p ON p.id = l.practice_id
     WHERE p.user_id = ?`,
    [req.user.id]
  );

  const unlockedIds = new Set(unlocked.map(r => r.pack_id));

  const result = packs.map(pack => ({
    ...pack,
    unlocked: unlockedIds.has(pack.id),
    canUnlock:
      pack.unlock_type === 'default' ||
      pack.unlock_type === 'coins' ||
      (pack.unlock_type === 'stickers' && totalStickers >= pack.required_stickers),
  }));

  res.json({ totalStickers, packs: result });
};

// POST /shop/:packId/buy - 스티커팩 구매 (코인 차감 또는 스티커 달성 조건 확인)
exports.buy = async (req, res) => {
  const packId = req.params.packId;

  const [[pack]] = await db.query('SELECT * FROM sticker_packs WHERE id = ?', [packId]);
  if (!pack) return res.status(404).json({ error: '없는 팩' });

  const [[already]] = await db.query(
    'SELECT id FROM unlocked_packs WHERE user_id = ? AND pack_id = ?',
    [req.user.id, packId]
  );
  if (already) return res.status(409).json({ error: '이미 해금된 팩' });

  if (pack.unlock_type === 'stickers') {
    const [[{ totalStickers }]] = await db.query(
      `SELECT COALESCE(SUM(l.count), 0) AS totalStickers
       FROM logs l JOIN practices p ON p.id = l.practice_id
       WHERE p.user_id = ?`,
      [req.user.id]
    );
    if (totalStickers < pack.required_stickers)
      return res.status(400).json({ error: `스티커 ${pack.required_stickers}개 달성 후 해금 가능해요` });
  }

  if (pack.unlock_type === 'coins') {
    const [[user]] = await db.query('SELECT coins FROM users WHERE id = ?', [req.user.id]);
    if (user.coins < pack.price) return res.status(400).json({ error: '코인 부족' });
    await db.query('UPDATE users SET coins = coins - ? WHERE id = ?', [pack.price, req.user.id]);
  }

  await db.query('INSERT INTO unlocked_packs (user_id, pack_id) VALUES (?, ?)', [req.user.id, packId]);
  res.status(201).json({ ok: true });
};
