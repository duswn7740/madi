const router = require('express').Router();
const { increment, decrement } = require('../controllers/logsController');

router.patch('/:practiceId/increment', increment);
router.patch('/:practiceId/decrement', decrement);

module.exports = router;
