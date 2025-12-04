const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth");
const { updateStudent } = require("../controllers/studentController");
const { updateResearcher } = require("../controllers/researcherController");

router.put("/:id", authMiddleware, updateResearcher);

module.exports = router;