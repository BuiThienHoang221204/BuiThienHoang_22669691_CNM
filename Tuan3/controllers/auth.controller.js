const userRepository = require("../repositories/user.repository");

class AuthController {
  // Hiển thị trang đăng nhập
  showLoginForm(req, res) {
    res.render("auth/login", { 
      title: "Đăng nhập",
      error: null 
    });
  }

  // Xử lý đăng nhập
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.render("auth/login", {
          title: "Đăng nhập",
          error: "Vui lòng nhập đầy đủ thông tin"
        });
      }

      // Xác thực user
      const user = await userRepository.authenticate(username, password);

      if (!user) {
        return res.render("auth/login", {
          title: "Đăng nhập",
          error: "Tên đăng nhập hoặc mật khẩu không đúng"
        });
      }

      // Lưu user vào session
      req.session.user = user;

      // Redirect về trang chủ
      res.redirect("/");

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      res.render("auth/login", {
        title: "Đăng nhập",
        error: "Đã xảy ra lỗi, vui lòng thử lại"
      });
    }
  }

  // Xử lý đăng xuất
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Lỗi đăng xuất:", err);
      }
      res.redirect("/login");
    });
  }

  // Hiển thị trang đăng ký (chỉ admin)
  showRegisterForm(req, res) {
    res.render("auth/register", {
      title: "Đăng ký tài khoản",
      error: null
    });
  }

  // Xử lý đăng ký (chỉ admin)
  async register(req, res) {
    try {
      const { username, password, confirmPassword, role } = req.body;

      if (!username || !password || !confirmPassword) {
        return res.render("auth/register", {
          title: "Đăng ký tài khoản",
          error: "Vui lòng nhập đầy đủ thông tin"
        });
      }

      if (password !== confirmPassword) {
        return res.render("auth/register", {
          title: "Đăng ký tài khoản",
          error: "Mật khẩu xác nhận không khớp"
        });
      }

      if (password.length < 6) {
        return res.render("auth/register", {
          title: "Đăng ký tài khoản",
          error: "Mật khẩu phải có ít nhất 6 ký tự"
        });
      }

      // Kiểm tra user đã tồn tại
      const existingUser = await userRepository.findByUsername(username);
      if (existingUser) {
        return res.render("auth/register", {
          title: "Đăng ký tài khoản",
          error: "Tên đăng nhập đã tồn tại"
        });
      }

      // Tạo user mới
      await userRepository.createUser({
        username,
        password,
        role: role || "staff"
      });

      res.redirect("/admin/users?success=1");

    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      res.render("auth/register", {
        title: "Đăng ký tài khoản",
        error: "Đã xảy ra lỗi, vui lòng thử lại"
      });
    }
  }
}

module.exports = new AuthController();