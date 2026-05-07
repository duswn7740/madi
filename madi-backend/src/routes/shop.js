const router = require('express').Router();
const { getAll, buy } = require('../controllers/shopController');

router.get('/', getAll);
router.post('/:packId/buy', buy);

module.exports = router;
