require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình session
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set true nếu dùng HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Cấu hình view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Global middleware để pass user info to views
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/admin", adminRoutes);

// Home redirect to products
app.get("/", (req, res) => {
  res.redirect("/products");
});

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
