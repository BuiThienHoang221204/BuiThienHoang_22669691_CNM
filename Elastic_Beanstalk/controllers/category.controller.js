const categoryService = require("../services/category.service");

// Lấy danh sách categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.render("categories/list", {
      title: "Quản lý danh mục",
      categories,
      user: req.user
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi lấy danh sách danh mục: " + error.message
    });
  }
};

// Hiển thị form tạo category
exports.showCreateCategory = (req, res) => {
  res.render("categories/create", {
    title: "Thêm danh mục mới"
  });
};

// Tạo category mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.render("categories/create", {
        title: "Thêm danh mục mới",
        error: "Vui lòng nhập tên danh mục"
      });
    }

    await categoryService.createCategory(name, description || "");
    res.redirect("/categories");
  } catch (error) {
    console.error("Create category error:", error);
    res.render("categories/create", {
      title: "Thêm danh mục mới",
      error: error.message || "Lỗi khi tạo danh mục"
    });
  }
};

// Hiển thị form chỉnh sửa category
exports.showEditCategory = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).render("error", {
        title: "Không tìm thấy",
        message: "Danh mục không tồn tại"
      });
    }

    res.render("categories/edit", {
      title: "Chỉnh sửa danh mục",
      category
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: "Lỗi khi lấy thông tin danh mục: " + error.message
    });
  }
};

// Cập nhật category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      const category = await categoryService.getCategoryById(req.params.id);
      return res.render("categories/edit", {
        title: "Chỉnh sửa danh mục",
        category,
        error: "Vui lòng nhập tên danh mục"
      });
    }

    await categoryService.updateCategory(req.params.id, name, description || "");
    res.redirect("/categories");
  } catch (error) {
    console.error("Update category error:", error);
    const category = await categoryService.getCategoryById(req.params.id);
    res.render("categories/edit", {
      title: "Chỉnh sửa danh mục",
      category,
      error: error.message || "Lỗi khi cập nhật danh mục"
    });
  }
};

// Xóa category
exports.deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.redirect("/categories");
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).render("error", {
      title: "Lỗi",
      message: error.message || "Lỗi khi xóa danh mục"
    });
  }
};
