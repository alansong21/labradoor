/**
 * Admin routes.
 * Handles admin-specific actions like verifying researchers.
 * Includes inline admin authentication middleware.
 */
const router = require('express').Router();
const {
    getAllResearchers,
    updateResearcherVerification,
    listAllUsers,
    getUserById,
    deleteUser,
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

// Researcher management routes
router.get('/researchers', adminAuth, getAllResearchers);
router.patch('/researchers/:userId/verify', adminAuth, updateResearcherVerification);

// User management routes
router.get('/users', adminAuth, listAllUsers);
router.get('/users/:id', adminAuth, getUserById);
router.delete('/users/:id', adminAuth, deleteUser);

module.exports = router;
