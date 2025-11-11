const router = require('express').Router();
const {
    requestSignup,
    verifySignup,
    login,
    getMe,
    logout
} = require('../controllers/authController');

const {
    requestResearcherSignup
} = require('../controllers/researcherController');

const { authMiddleware } = require('../middleware/auth');

router.post('/signup', requestSignup);
router.post('/researchers/signup', requestResearcherSignup);
router.post('/verify-signup', verifySignup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;
