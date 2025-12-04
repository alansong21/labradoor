/**
 * Authentication routes.
 * Handles user signup, login, logout, and session verification.
 * Also handles admin authentication.
 */
const router = require('express').Router();
const {
    requestSignup,
    verifySignup,
    login,
    getMe,
    logout,
    adminLogin,
    adminVerify,
    adminLogout
} = require('../controllers/authController');

const { authMiddleware } = require('../middleware/auth');

router.post('/signup', requestSignup);
router.post('/verify-signup', verifySignup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.post('/admin/login', adminLogin);
router.get('/admin/verify', adminVerify);
router.post('/admin/logout', adminLogout);

module.exports = router;
