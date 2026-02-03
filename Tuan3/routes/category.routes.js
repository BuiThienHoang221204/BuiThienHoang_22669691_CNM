const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { requireAdmin, requireStaffOrAdmin } = require("../middlewares/auth.middleware");

// Category routes (chỉ admin mới có thể CRUD categories)
router.get("/", requireStaffOrAdmin, categoryController.getCategories);
router.get("/create", requireAdmin, categoryController.showCreateForm);
router.post("/create", requireAdmin, categoryController.createCategory);
router.get("/edit/:id", requireAdmin, categoryController.showEditForm);
router.post("/edit/:id", requireAdmin, categoryController.updateCategory);
router.post("/delete/:id", requireAdmin, categoryController.deleteCategory);

// API endpoint để lấy danh sách categories
router.get("/api/list", requireStaffOrAdmin, categoryController.getCategoriesApi);

module.exports = router;