const router = require('express').Router();
const { getByDate, getTemplates, create, update, remove, copy } = require('../controllers/practicesController');

router.get('/', getByDate);
router.get('/templates', getTemplates);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);
router.post('/:id/copy', copy);

module.exports = router;
