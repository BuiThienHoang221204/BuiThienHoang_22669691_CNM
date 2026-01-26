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

router.get("/", controller.getProducts);
router.get("/create", (req, res) => res.render("products/create", { title: "Thêm sản phẩm" }));
router.post("/create", upload.single("image"), cleanupUpload, controller.createProduct);
router.get("/edit/:id", controller.getProductById);
router.post("/edit/:id", upload.single("image"), cleanupUpload, controller.updateProduct);
router.post("/delete/:id", controller.deleteProduct);

module.exports = router;