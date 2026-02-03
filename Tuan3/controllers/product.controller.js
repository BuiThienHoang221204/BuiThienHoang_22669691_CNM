const productService = require("../services/product.service");
const categoryService = require("../services/category.service");
const auditService = require("../services/audit.service");

// Lấy danh sách sản phẩm với filter, search và pagination
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.categoryId || null;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined;
    const name = req.query.name || null;

    const filters = {};
    if (categoryId) filters.categoryId = categoryId;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (name) filters.name = name;

    const result = await productService.getProducts(filters, page, limit);
    const categories = await categoryService.getAllCategories();

    res.render("products/list", {
      title: "Danh sách sản phẩm",
      products: result.products,
      categories,
      pagination: result.pagination,
      filters: {
        categoryId,
        minPrice,
        maxPrice,
        name
      },
      user: req.user
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi lấy danh sách sản phẩm: " + error.message
    });
  }
};

// Hiển thị form tạo sản phẩm
exports.showCreateProduct = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.render("products/create", {
      title: "Thêm sản phẩm mới",
      categories
    });
  } catch (error) {
    console.error("Show create product error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi tải form: " + error.message
    });
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    if (!req.file) {
      const categories = await categoryService.getAllCategories();
      return res.render("products/create", {
        title: "Thêm sản phẩm mới",
        categories,
        error: "Vui lòng chọn hình ảnh sản phẩm"
      });
    }

    const created = await productService.createProduct(req.body, req.file);

    // Audit log
    await auditService.logCreate(created.id, req.user?.userId);

    res.redirect("/");
  } catch (error) {
    console.error("Create product error:", error);
    const categories = await categoryService.getAllCategories();
    res.render("products/create", {
      title: "Thêm sản phẩm mới",
      categories,
      error: error.message || "Lỗi khi thêm sản phẩm"
    });
  }
};

// Lấy thông tin sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).render("error", {
        title: "Không tìm thấy",
        message: "Sản phẩm không tồn tại"
      });
    }

    const categories = await categoryService.getAllCategories();
    res.render("products/edit", {
      title: "Chỉnh sửa sản phẩm",
      product,
      categories
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi lấy thông tin sản phẩm: " + error.message
    });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const updated = await productService.updateProduct(
      req.params.id,
      req.body,
      req.file
    );

    // Audit log
    await auditService.logUpdate(updated.id, req.user?.userId);

    res.redirect("/");
  } catch (error) {
    console.error("Update product error:", error);
    const product = await productService.getProductById(req.params.id);
    const categories = await categoryService.getAllCategories();
    res.render("products/edit", {
      title: "Chỉnh sửa sản phẩm",
      product,
      categories,
      error: error.message || "Lỗi khi cập nhật sản phẩm"
    });
  }
};

// Xóa sản phẩm (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);

    // Audit log
    await auditService.logDelete(req.params.id, req.user?.userId);

    res.redirect("/");
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: error.message || "Lỗi khi xóa sản phẩm"
    });
  }
};
