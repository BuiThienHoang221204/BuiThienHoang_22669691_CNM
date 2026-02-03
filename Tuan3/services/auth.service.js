const bcrypt = require("bcrypt");
const userRepository = require("../repositories/user.repository");
const { v4: uuidv4 } = require("uuid");

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Đăng ký user mới
exports.register = async (username, password, role = "staff") => {
  // Kiểm tra username đã tồn tại chưa
  const existingUser = await userRepository.getUserByUsername(username);
  if (existingUser) {
    throw new Error("Username đã tồn tại");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Tạo user mới
  const user = {
    userId: uuidv4(),
    username,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };

  return await userRepository.createUser(user);
};

// Đăng nhập
exports.login = async (username, password) => {
  // Tìm user theo username
  const user = await userRepository.getUserByUsername(username);
  if (!user) {
    throw new Error("Username hoặc password không đúng");
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new Error("Username hoặc password không đúng");
  }

  // Trả về user (không bao gồm password)
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Verify user session
exports.verifySession = async (userId) => {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    return null;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Kiểm tra xem đã có admin nào chưa
exports.hasAdmin = async () => {
  const users = await userRepository.getAllUsers();
  return users.some(user => user.role === "admin");
};
