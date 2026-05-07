const db = require('../config/db');

const DAILY_LIMIT = 5;
const COINS_PER_AD = 1;

// POST /ads/watch - 광고 시청 (KST 기준 하루 5회 제한, 코인 적립)
exports.watch = async (req, res) => {
  const [[user]] = await db.query(
    'SELECT today_ad_count, last_ad_date, coins FROM users WHERE id = ?',
    [req.user.id]
  );

  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const isNewDay = !user.last_ad_date || user.last_ad_date.toISOString().slice(0, 10) !== todayKST;
  const todayCount = isNewDay ? 0 : user.today_ad_count;

  if (todayCount >= DAILY_LIMIT)
    return res.status(400).json({ error: `오늘 광고는 ${DAILY_LIMIT}번까지만 볼 수 있어요` });

  await db.query(
    `UPDATE users SET
      coins = coins + ?,
      total_ad_count = total_ad_count + 1,
      today_ad_count = ? + 1,
      last_ad_date = ?
     WHERE id = ?`,
    [COINS_PER_AD, todayCount, todayKST, req.user.id]
  );

  res.json({ coins: user.coins + COINS_PER_AD, todayCount: todayCount + 1 });
};
