const authService = require("../services/auth.service");

// Hiển thị trang đăng nhập
exports.showLogin = async (req, res) => {
  // Nếu đã đăng nhập, redirect về trang chủ
  if (req.session && req.session.userId) {
    return res.redirect("/");
  }

  // Kiểm tra xem đã có admin chưa, nếu chưa thì redirect đến setup
  try {
    const hasAdmin = await authService.hasAdmin();
    if (!hasAdmin) {
      return res.redirect("/setup");
    }
  } catch (error) {
    console.error("Error checking admin:", error);
    // Nếu có lỗi, vẫn hiển thị trang login
  }

  const error = req.query.error;
  const message = req.query.message;
  const redirect = req.query.redirect || "/";

  res.render("auth/login", {
    title: "Đăng nhập",
    error,
    message,
    redirect
  });
};

// Xử lý đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    let redirect = req.body.redirect || "/";
    
    // Đảm bảo redirect URL luôn bắt đầu bằng /
    if (!redirect.startsWith('/')) {
      redirect = '/';
    }

    if (!username || !password) {
      return res.render("auth/login", {
        title: "Đăng nhập",
        error: "Vui lòng nhập đầy đủ thông tin",
        redirect: redirect
      });
    }

    // Đăng nhập
    const user = await authService.login(username, password);

    // Tạo session
    req.session.userId = user.userId;
    req.session.username = user.username;
    req.session.role = user.role;

    // Lưu session trước khi redirect (quan trọng!)
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.render("auth/login", {
          title: "Đăng nhập",
          error: "Lỗi khi lưu phiên đăng nhập",
          redirect: redirect
        });
      }
      // Redirect sau khi session đã được lưu
      res.redirect(redirect);
    });
  } catch (error) {
    console.error("Login error:", error);
    res.render("auth/login", {
      title: "Đăng nhập",
      error: error.message || "Đăng nhập thất bại",
      redirect: req.body.redirect || "/"
    });
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
};

// Hiển thị trang đăng ký admin đầu tiên
exports.showSetup = async (req, res) => {
  try {
    const hasAdmin = await authService.hasAdmin();
    if (hasAdmin) {
      return res.redirect("/login");
    }

    const error = req.query.error;
    res.render("auth/setup", {
      title: "Thiết lập tài khoản admin đầu tiên",
      error
    });
  } catch (error) {
    console.error("Show setup error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi kiểm tra hệ thống: " + error.message
    });
  }
};

// Xử lý đăng ký admin đầu tiên
exports.setup = async (req, res) => {
  try {
    const hasAdmin = await authService.hasAdmin();
    if (hasAdmin) {
      return res.redirect("/login");
    }

    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.render("auth/setup", {
        title: "Thiết lập tài khoản admin đầu tiên",
        error: "Vui lòng nhập đầy đủ thông tin"
      });
    }

    if (password !== confirmPassword) {
      return res.render("auth/setup", {
        title: "Thiết lập tài khoản admin đầu tiên",
        error: "Mật khẩu xác nhận không khớp"
      });
    }

    if (password.length < 6) {
      return res.render("auth/setup", {
        title: "Thiết lập tài khoản admin đầu tiên",
        error: "Mật khẩu phải có ít nhất 6 ký tự"
      });
    }

    // Tạo admin đầu tiên
    await authService.register(username, password, "admin");

    res.redirect("/login?message=Tạo tài khoản admin thành công! Vui lòng đăng nhập.");
  } catch (error) {
    console.error("Setup error:", error);
    res.render("auth/setup", {
      title: "Thiết lập tài khoản admin đầu tiên",
      error: error.message || "Lỗi khi tạo tài khoản admin"
    });
  }
};
