const router = require('express').Router();
const { watch } = require('../controllers/adsController');

router.post('/watch', watch);

module.exports = router;
