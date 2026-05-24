const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, login, forgotPassword, getMe, updateMe, updatePassword, deleteMe, refresh, logout } = require('../controllers/usersController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.get('/me', auth, getMe);
router.patch('/me', auth, updateMe);
router.patch('/password', auth, updatePassword);
router.delete('/me', auth, deleteMe);

module.exports = router;
