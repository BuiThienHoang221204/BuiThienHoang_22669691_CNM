const categoryRepository = require("../repositories/category.repository");
const productRepository = require("../repositories/product.repository");
const { v4: uuidv4 } = require("uuid");

// Tạo category mới
exports.createCategory = async (name, description = "") => {
  const category = {
    categoryId: uuidv4(),
    name,
    description,
    createdAt: new Date().toISOString()
  };

  return await categoryRepository.createCategory(category);
};

// Lấy category theo ID
exports.getCategoryById = async (categoryId) => {
  return await categoryRepository.getCategoryById(categoryId);
};

// Lấy tất cả categories
exports.getAllCategories = async () => {
  return await categoryRepository.getAllCategories();
};

// Cập nhật category
exports.updateCategory = async (categoryId, name, description) => {
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;

  return await categoryRepository.updateCategory(categoryId, updateData);
};

// Xóa category
// Lưu ý: Không xóa sản phẩm khi xóa category (business rule)
exports.deleteCategory = async (categoryId) => {
  // Kiểm tra xem có sản phẩm nào đang dùng category này không
  const products = await productRepository.getAllProducts();
  const productsUsingCategory = products.filter(p => p.categoryId === categoryId);
  
  if (productsUsingCategory.length > 0) {
    throw new Error(`Không thể xóa category này vì có ${productsUsingCategory.length} sản phẩm đang sử dụng`);
  }

  return await categoryRepository.deleteCategory(categoryId);
};
