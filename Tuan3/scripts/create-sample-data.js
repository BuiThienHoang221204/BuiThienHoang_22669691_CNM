require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION || "us-east-1" 
});
const docClient = DynamoDBDocumentClient.from(client);

async function createSampleCategories() {
  const CATEGORIES_TABLE = process.env.DYNAMODB_CATEGORIES_TABLE || "Categories";
  
  const categories = [
    { 
      name: "Điện thoại", 
      description: "Điện thoại thông minh các hãng: iPhone, Samsung, Xiaomi, OPPO, Vivo..." 
    },
    { 
      name: "Laptop", 
      description: "Máy tính xách tay: Dell, HP, Asus, Lenovo, Macbook..." 
    },
    { 
      name: "Tablet", 
      description: "Máy tính bảng: iPad, Samsung Tab, Xiaomi Pad..." 
    },
    { 
      name: "Phụ kiện", 
      description: "Phụ kiện điện tử: Tai nghe, sạc, cáp, ốp lưng, bao da..." 
    },
    { 
      name: "Smartwatch", 
      description: "Đồng hồ thông minh: Apple Watch, Samsung Galaxy Watch, Xiaomi Mi Band..." 
    },
    { 
      name: "Âm thanh", 
      description: "Thiết bị âm thanh: Loa, tai nghe, micro, soundbar..." 
    }
  ];
  
  console.log("\n🏷️  TẠO CATEGORIES MẪU\n");
  
  // Kiểm tra xem đã có categories chưa
  const existingCategories = await docClient.send(new ScanCommand({
    TableName: CATEGORIES_TABLE
  }));
  
  if (existingCategories.Items && existingCategories.Items.length > 0) {
    console.log("⚠️  Đã có categories trong database:");
    existingCategories.Items.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });
    console.log("\n💡 Bỏ qua tạo categories mẫu.");
    return existingCategories.Items;
  }
  
  const createdCategories = [];
  
  for (const cat of categories) {
    const category = {
      categoryId: uuidv4(),
      name: cat.name,
      description: cat.description,
      createdAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: CATEGORIES_TABLE,
      Item: category
    }));
    
    createdCategories.push(category);
    console.log(`✅ Tạo category: ${cat.name}`);
  }
  
  console.log("\n🎉 Hoàn thành tạo categories!\n");
  return createdCategories;
}

async function createSampleProducts(categories) {
  const PRODUCTS_TABLE = process.env.DYNAMODB_TABLE || "Products";
  
  // Kiểm tra có categories không
  if (!categories || categories.length === 0) {
    console.log("⚠️  Không có categories để tạo products mẫu.");
    return;
  }
  
  // Lấy categoryId từ categories
  const phoneCategory = categories.find(c => c.name === "Điện thoại");
  const laptopCategory = categories.find(c => c.name === "Laptop");
  const tabletCategory = categories.find(c => c.name === "Tablet");
  const accessoryCategory = categories.find(c => c.name === "Phụ kiện");
  
  const sampleProducts = [
    {
      name: "iPhone 15 Pro Max",
      price: 29990000,
      quantity: 15,
      categoryId: phoneCategory?.categoryId,
      url_image: null
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      price: 27990000,
      quantity: 8,
      categoryId: phoneCategory?.categoryId,
      url_image: null
    },
    {
      name: "MacBook Pro M3",
      price: 45990000,
      quantity: 5,
      categoryId: laptopCategory?.categoryId,
      url_image: null
    },
    {
      name: "Dell XPS 15",
      price: 35990000,
      quantity: 3,
      categoryId: laptopCategory?.categoryId,
      url_image: null
    },
    {
      name: "iPad Pro 12.9",
      price: 25990000,
      quantity: 10,
      categoryId: tabletCategory?.categoryId,
      url_image: null
    },
    {
      name: "AirPods Pro 2",
      price: 5990000,
      quantity: 25,
      categoryId: accessoryCategory?.categoryId,
      url_image: null
    },
    {
      name: "Xiaomi 14 Pro",
      price: 18990000,
      quantity: 2, // Low stock
      categoryId: phoneCategory?.categoryId,
      url_image: null
    },
    {
      name: "OPPO Find X7",
      price: 15990000,
      quantity: 0, // Out of stock
      categoryId: phoneCategory?.categoryId,
      url_image: null
    }
  ];
  
  console.log("\n📦 TẠO PRODUCTS MẪU\n");
  
  for (const prod of sampleProducts) {
    const product = {
      id: uuidv4(),
      ...prod,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: product
    }));
    
    let stockStatus = "✅";
    if (product.quantity === 0) stockStatus = "❌";
    else if (product.quantity <= 5) stockStatus = "⚠️";
    
    console.log(`${stockStatus} ${product.name} - ${product.quantity} sản phẩm`);
  }
  
  console.log("\n🎉 Hoàn thành tạo products!\n");
}

// Main
(async () => {
  try {
    console.log("\n🚀 TẠO DỮ LIỆU MẪU\n");
    console.log("═══════════════════════════════════════\n");
    
    // Tạo categories
    const categories = await createSampleCategories();
    
    // Tạo products
    await createSampleProducts(categories);
    
    console.log("═══════════════════════════════════════");
    console.log("\n✨ HOÀN THÀNH!\n");
    console.log("📊 Tổng quan:");
    console.log(`   - Categories: ${categories?.length || 0}`);
    console.log("   - Products: 8 (bao gồm các mức tồn kho khác nhau)");
    console.log("\n💡 Bây giờ bạn có thể:");
    console.log("   1. Đăng nhập vào hệ thống");
    console.log("   2. Xem danh sách sản phẩm");
    console.log("   3. Lọc theo category");
    console.log("   4. Kiểm tra inventory status");
    console.log("   5. Thêm/sửa/xóa sản phẩm\n");
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ LỖI:", error.message);
    
    if (error.name === "ResourceNotFoundException") {
      console.error("\n💡 Giải pháp:");
      console.error("   - Kiểm tra các tables đã được tạo chưa:");
      console.error("     + Categories");
      console.error("     + Products");
      console.error("   - Kiểm tra AWS_REGION trong file .env");
      console.error("   - Kiểm tra IAM permissions cho DynamoDB");
    }
    
    process.exit(1);
  }
})();
