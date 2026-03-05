const userRepository = require("../repositories/user.repository");
const authService = require("../services/auth.service");

// Danh sách users (admin)
exports.listUsers = async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    // Không render password
    const safeUsers = (users || []).map(({ password, ...u }) => u);

    res.render("users/list", {
      title: "Quản lý người dùng",
      users: safeUsers,
      user: req.user
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi lấy danh sách người dùng: " + error.message
    });
  }
};

// Form tạo staff
exports.showCreateStaff = (req, res) => {
  res.render("users/create", {
    title: "Tạo tài khoản staff",
    error: null
  });
};

// Tạo staff (admin)
exports.createStaff = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.render("users/create", {
        title: "Tạo tài khoản staff",
        error: "Vui lòng nhập đầy đủ thông tin"
      });
    }

    if (password !== confirmPassword) {
      return res.render("users/create", {
        title: "Tạo tài khoản staff",
        error: "Mật khẩu xác nhận không khớp"
      });
    }

    if (password.length < 6) {
      return res.render("users/create", {
        title: "Tạo tài khoản staff",
        error: "Mật khẩu phải có ít nhất 6 ký tự"
      });
    }

    await authService.register(username, password, "staff");
    return res.redirect("/users");
  } catch (error) {
    console.error("Create staff error:", error);
    return res.render("users/create", {
      title: "Tạo tài khoản staff",
      error: error.message || "Lỗi khi tạo tài khoản staff"
    });
  }
};

