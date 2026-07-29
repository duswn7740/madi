const router = require('express').Router();
const { getByDate, getDates, getTemplates, create, update, remove, copy, reorder } = require('../controllers/practicesController');

router.get('/', getByDate);
router.get('/dates', getDates);
router.get('/templates', getTemplates);
router.post('/', create);
router.patch('/reorder', reorder);
router.patch('/:id', update);
router.delete('/:id', remove);
router.post('/:id/copy', copy);

module.exports = router;
