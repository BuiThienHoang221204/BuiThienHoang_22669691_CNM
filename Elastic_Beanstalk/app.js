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

// Cấu hình view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false để hoạt động với HTTP (không cần HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Middleware để gắn user vào request từ session
app.use(async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const authService = require("./services/auth.service");
      const user = await authService.verifySession(req.session.userId);
      req.user = user;
    } catch (error) {
      console.error("Error loading user from session:", error);
      req.user = null;
    }
  }
  next();
});

// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const userRoutes = require("./routes/user.routes");

app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/users", userRoutes);

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
  console.log(`👤 Users Table: ${process.env.USERS_TABLE || "Users"}`);
  console.log(`📁 Categories Table: ${process.env.CATEGORIES_TABLE || "Categories"}`);
});
