const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

// Tất cả routes đều yêu cầu đăng nhập và quyền admin
router.use(requireAuth);
router.use(requireAdmin);

// Danh sách categories
router.get("/", categoryController.getCategories);

// Form tạo category
router.get("/create", categoryController.showCreateCategory);
router.post("/create", categoryController.createCategory);

// Form chỉnh sửa category
router.get("/edit/:id", categoryController.showEditCategory);
router.post("/edit/:id", categoryController.updateCategory);

// Xóa category
router.post("/delete/:id", categoryController.deleteCategory);

module.exports = router;
