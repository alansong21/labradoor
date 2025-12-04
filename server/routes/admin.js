/**
 * Admin routes.
 * Handles admin-specific actions like verifying researchers.
 * Includes inline admin authentication middleware.
 */
const router = require('express').Router();
const {
    getAllResearchers,
    updateResearcherVerification,
} = require('../controllers/adminController');

function adminAuth(req, res, next) {
    const adminToken = req.cookies?.admin_session;
    if (!adminToken) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = JSON.parse(Buffer.from(adminToken, 'base64').toString());
        req.adminEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid session" });
    }
}

router.get('/researchers', adminAuth, getAllResearchers);
router.patch('/researchers/:userId/verify', adminAuth, updateResearcherVerification);

module.exports = router;
