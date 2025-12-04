/**
 * User management routes.
 * Handles listing, retrieving, updating, and deleting users.
 * Protected by authentication middleware.
 */
const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth");
const {
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
} = require("../controllers/userController");

router.use(authMiddleware);
router.get("/", listUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;