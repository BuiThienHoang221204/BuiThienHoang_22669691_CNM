require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
const productRoutes = require("./routes/product.routes");
app.use("/", productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).render("error", {
    title: "Lỗi",
    message: err.message || "Đã xảy ra lỗi không xác định"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Không tìm thấy",
    message: "Trang bạn tìm kiếm không tồn tại"
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📦 DynamoDB Table: ${process.env.DYNAMODB_TABLE || "Products"}`);
  console.log(`🪣 S3 Bucket: ${process.env.S3_BUCKET_NAME || "Not configured"}`);
});
