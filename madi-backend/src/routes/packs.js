const router = require('express').Router();
const { getActive, select } = require('../controllers/packsController');

router.get('/active', getActive);
router.post('/:packId/select', select);

module.exports = router;
