const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Cấu hình multer để lưu file tạm
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

const controller = require("../controllers/product.controller");
const { requireAuth, requireAdmin, requireStaff } = require("../middlewares/auth.middleware");

// Middleware để xóa file tạm sau khi upload
const cleanupUpload = (req, res, next) => {
  if (req.file && req.file.path) {
    res.on("finish", () => {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error("Error cleaning up upload file:", err);
      }
    });
  }
  next();
};

// Xem danh sách sản phẩm - yêu cầu đăng nhập (staff hoặc admin)
router.get("/", requireAuth, requireStaff, controller.getProducts);

// Tạo sản phẩm - chỉ admin
router.get("/create", requireAuth, requireAdmin, controller.showCreateProduct);
router.post("/create", requireAuth, requireAdmin, upload.single("image"), cleanupUpload, controller.createProduct);

// Chỉnh sửa sản phẩm - chỉ admin
router.get("/edit/:id", requireAuth, requireAdmin, controller.getProductById);
router.post("/edit/:id", requireAuth, requireAdmin, upload.single("image"), cleanupUpload, controller.updateProduct);

// Xóa sản phẩm - chỉ admin
router.post("/delete/:id", requireAuth, requireAdmin, controller.deleteProduct);

module.exports = router;
