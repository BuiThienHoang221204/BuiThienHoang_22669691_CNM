const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

router.use(requireAuth);
router.use(requireAdmin);

router.get("/", userController.listUsers);
router.get("/create", userController.showCreateStaff);
router.post("/create", userController.createStaff);

module.exports = router;

