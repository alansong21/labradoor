const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth");
const { updateStudent } = require("../controllers/studentController");

router.put("/:id", authMiddleware, updateStudent);

module.exports = router;
