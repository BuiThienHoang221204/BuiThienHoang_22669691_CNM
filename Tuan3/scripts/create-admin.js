require("dotenv").config();
const userRepository = require("../repositories/user.repository");

async function createAdminUser() {
  try {
    console.log("🔧 Tạo admin user...");
    
    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await userRepository.findByUsername("admin");
    
    if (existingAdmin) {
      console.log("⚠️  Admin user đã tồn tại!");
      console.log("Username:", existingAdmin.username);
      console.log("Role:", existingAdmin.role);
      return;
    }
    
    // Tạo admin user mới
    const adminUser = await userRepository.createUser({
      username: "admin",
      password: "admin123", // Thay đổi password này!
      role: "admin"
    });
    
    console.log("✅ Tạo admin user thành công!");
    console.log("Username:", adminUser.username);
    console.log("Role:", adminUser.role);
    console.log("\n⚠️  QUAN TRỌNG: Hãy thay đổi password sau khi đăng nhập lần đầu!");
    console.log("\nThông tin đăng nhập:");
    console.log("- Username: admin");
    console.log("- Password: admin123");
    
  } catch (error) {
    console.error("❌ Lỗi khi tạo admin user:", error);
    
    if (error.name === "ResourceNotFoundException") {
      console.error("\n💡 Lưu ý: Hãy đảm bảo table 'Users' đã được tạo trong DynamoDB");
      console.error("Chạy lệnh sau để tạo table:");
      console.error("\naws dynamodb create-table \\");
      console.error("  --table-name Users \\");
      console.error("  --attribute-definitions AttributeName=userId,AttributeType=S \\");
      console.error("  --key-schema AttributeName=userId,KeyType=HASH \\");
      console.error("  --billing-mode PAY_PER_REQUEST");
    }
  }
}

// Tạo thêm staff user để test
async function createStaffUser() {
  try {
    const existingStaff = await userRepository.findByUsername("staff");
    
    if (existingStaff) {
      console.log("\n⚠️  Staff user đã tồn tại!");
      return;
    }
    
    const staffUser = await userRepository.createUser({
      username: "staff",
      password: "staff123",
      role: "staff"
    });
    
    console.log("\n✅ Tạo staff user thành công!");
    console.log("Username:", staffUser.username);
    console.log("Role:", staffUser.role);
    console.log("\nThông tin đăng nhập:");
    console.log("- Username: staff");
    console.log("- Password: staff123");
    
  } catch (error) {
    console.error("❌ Lỗi khi tạo staff user:", error);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("     THIẾT LẬP TÀI KHOẢN BAN ĐẦU");
  console.log("=".repeat(60));
  console.log();
  
  await createAdminUser();
  await createStaffUser();
  
  console.log();
  console.log("=".repeat(60));
  console.log("Hoàn thành! Bạn có thể đăng nhập vào hệ thống.");
  console.log("=".repeat(60));
}

main().catch(console.error);