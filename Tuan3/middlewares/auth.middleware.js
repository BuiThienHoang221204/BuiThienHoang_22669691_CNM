const userRepository = require("../repositories/user.repository");

// Middleware kiểm tra đăng nhập
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  
  // Gắn user vào req để sử dụng trong controller
  req.user = req.session.user;
  next();
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  
  if (req.session.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "Forbidden",
      message: "Bạn không có quyền truy cập chức năng này. Chỉ admin mới có thể thực hiện."
    });
  }
  
  req.user = req.session.user;
  next();
};

// Middleware kiểm tra quyền staff trở lên
const requireStaffOrAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  
  const allowedRoles = ["staff", "admin"];
  if (!allowedRoles.includes(req.session.user.role)) {
    return res.status(403).render("error", {
      title: "Forbidden", 
      message: "Bạn không có quyền truy cập."
    });
  }
  
  req.user = req.session.user;
  next();
};

// Middleware redirect nếu đã đăng nhập
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireStaffOrAdmin,
  redirectIfAuthenticated
};