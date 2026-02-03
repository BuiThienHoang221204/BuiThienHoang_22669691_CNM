const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Thiết lập admin đầu tiên (chỉ khi chưa có admin)
router.get("/setup", authController.showSetup);
router.post("/setup", authController.setup);

// Hiển thị trang đăng nhập
router.get("/login", authController.showLogin);

// Xử lý đăng nhập
router.post("/login", authController.login);

// Đăng xuất
router.post("/logout", authController.logout);
router.get("/logout", authController.logout);

module.exports = router;
