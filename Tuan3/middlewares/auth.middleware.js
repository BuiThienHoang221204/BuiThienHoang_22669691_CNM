const authService = require("../services/auth.service");

// Middleware kiểm tra đăng nhập
exports.requireAuth = async (req, res, next) => {
  try {
    // Kiểm tra session
    if (!req.session || !req.session.userId) {
      return res.redirect("/login?redirect=" + encodeURIComponent(req.originalUrl));
    }

    // Verify user từ session
    const user = await authService.verifySession(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect("/login?error=session_expired");
    }

    // Gắn user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.redirect("/login?error=auth_error");
  }
};

// Middleware kiểm tra quyền admin
exports.requireAdmin = async (req, res, next) => {
  try {
    // Phải đăng nhập trước
    if (!req.user) {
      return res.redirect("/login?redirect=" + encodeURIComponent(req.originalUrl));
    }

    // Kiểm tra role
    if (req.user.role !== "admin") {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Bạn không có quyền truy cập trang này. Chỉ admin mới có quyền này."
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Đã xảy ra lỗi khi kiểm tra quyền"
    });
  }
};

// Middleware kiểm tra quyền staff (chỉ xem)
exports.requireStaff = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect("/login?redirect=" + encodeURIComponent(req.originalUrl));
    }

    if (req.user.role !== "admin" && req.user.role !== "staff") {
      return res.status(403).render("error", {
        title: "Không có quyền",
        message: "Bạn không có quyền truy cập trang này."
      });
    }

    next();
  } catch (error) {
    console.error("Staff middleware error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Đã xảy ra lỗi khi kiểm tra quyền"
    });
  }
};
