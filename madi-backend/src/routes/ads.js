const router = require('express').Router();
const { watch } = require('../controllers/ads.controller');

router.post('/watch', watch);

module.exports = router;
