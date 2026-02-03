const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const userRepository = require("../repositories/user.repository");
const { requireAdmin } = require("../middlewares/auth.middleware");

// Admin routes
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    const success = req.query.success;
    
    res.render("admin/users", {
      title: "Quản lý người dùng",
      users,
      success,
      user: req.user
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách users:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Không thể lấy danh sách người dùng"
    });
  }
});

router.get("/register", requireAdmin, authController.showRegisterForm);
router.post("/register", requireAdmin, authController.register);

module.exports = router;