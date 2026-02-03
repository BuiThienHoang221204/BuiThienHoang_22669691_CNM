const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { redirectIfAuthenticated } = require("../middlewares/auth.middleware");

// Auth routes
router.get("/login", redirectIfAuthenticated, authController.showLoginForm);
router.post("/login", redirectIfAuthenticated, authController.login);
router.post("/logout", authController.logout);

module.exports = router;