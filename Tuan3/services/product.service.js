const productRepository = require("../repositories/product.repository");
const { uploadImage, deleteImage } = require("./s3.service");
const { v4: uuidv4 } = require("uuid");

// Tạo product mới
exports.createProduct = async (productData, imageFile) => {
  // Upload ảnh lên S3
  let imageUrl = null;
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  const product = {
    id: uuidv4(),
    name: productData.name,
    price: Number(productData.price),
    quantity: Number(productData.quantity),
    categoryId: productData.categoryId || null,
    url_image: imageUrl,
    isDeleted: false,
    createdAt: new Date().toISOString()
  };

  return await productRepository.createProduct(product);
};

// Lấy product theo ID
exports.getProductById = async (id) => {
  const product = await productRepository.getProductById(id);
  if (!product || product.isDeleted === true) {
    return null;
  }
  return product;
};

// Lấy products với filter, search và pagination
exports.getProducts = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const result = await productRepository.getProductsWithFilter(
    filters,
    limit,
    null // lastEvaluatedKey cho pagination
  );

  // Tính toán inventory status cho mỗi product
  const productsWithStatus = result.items.map(product => ({
    ...product,
    inventoryStatus: getInventoryStatus(product.quantity)
  }));

  return {
    products: productsWithStatus,
    pagination: {
      page,
      limit,
      total: result.count,
      hasMore: result.lastEvaluatedKey !== null
    }
  };
};

// Cập nhật product
exports.updateProduct = async (id, productData, imageFile) => {
  // Lấy product hiện tại
  const currentProduct = await productRepository.getProductById(id);
  if (!currentProduct || currentProduct.isDeleted === true) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // Upload ảnh mới nếu có
  let imageUrl = currentProduct.url_image;
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
    // Xóa ảnh cũ nếu có
    if (currentProduct.url_image) {
      await deleteImage(currentProduct.url_image);
    }
  }

  const updateData = {
    name: productData.name,
    price: Number(productData.price),
    quantity: Number(productData.quantity),
    categoryId: productData.categoryId || null,
    url_image: imageUrl
  };

  return await productRepository.updateProduct(id, updateData);
};

// Soft delete product
exports.deleteProduct = async (id) => {
  const product = await productRepository.getProductById(id);
  if (!product || product.isDeleted === true) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // Soft delete
  await productRepository.softDeleteProduct(id);

  // Xóa ảnh từ S3
  if (product.url_image) {
    await deleteImage(product.url_image);
  }

  return true;
};

// Helper function: Xác định trạng thái tồn kho
const getInventoryStatus = (quantity) => {
  if (quantity === 0) {
    return {
      status: "out_of_stock",
      label: "Hết hàng",
      color: "red"
    };
  } else if (quantity < 5) {
    return {
      status: "low_stock",
      label: "Sắp hết",
      color: "orange"
    };
  } else {
    return {
      status: "in_stock",
      label: "Còn hàng",
      color: "green"
    };
  }
};

// Export helper function
exports.getInventoryStatus = getInventoryStatus;
