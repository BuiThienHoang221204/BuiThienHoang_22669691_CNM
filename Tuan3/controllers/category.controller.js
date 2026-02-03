const categoryRepository = require("../repositories/category.repository");
const productRepository = require("../repositories/product.repository");

class CategoryController {
  // Hiển thị danh sách categories
  async getCategories(req, res) {
    try {
      const categories = await categoryRepository.getAllCategories();
      const success = req.query.success;

      res.render("categories/list", {
        title: "Quản lý danh mục",
        categories,
        success,
        user: req.user
      });

    } catch (error) {
      console.error("Lỗi lấy danh sách danh mục:", error);
      res.status(500).render("error", {
        title: "Lỗi",
        message: "Không thể lấy danh sách danh mục"
      });
    }
  }

  // Hiển thị form thêm category
  showCreateForm(req, res) {
    res.render("categories/create", {
      title: "Thêm danh mục",
      user: req.user
    });
  }

  // Tạo category mới
  async createCategory(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.render("categories/create", {
          title: "Thêm danh mục",
          error: "Tên danh mục không được để trống",
          user: req.user
        });
      }

      await categoryRepository.createCategory({ name, description });

      res.redirect("/categories?success=created");

    } catch (error) {
      console.error("Lỗi tạo danh mục:", error);
      res.render("categories/create", {
        title: "Thêm danh mục",
        error: "Không thể tạo danh mục",
        user: req.user
      });
    }
  }

  // Hiển thị form sửa category
  async showEditForm(req, res) {
    try {
      const { id } = req.params;
      const category = await categoryRepository.findById(id);

      if (!category) {
        return res.status(404).render("error", {
          title: "Không tìm thấy",
          message: "Danh mục không tồn tại"
        });
      }

      res.render("categories/edit", {
        title: "Sửa danh mục",
        category,
        user: req.user
      });

    } catch (error) {
      console.error("Lỗi lấy thông tin danh mục:", error);
      res.status(500).render("error", {
        title: "Lỗi",
        message: "Không thể lấy thông tin danh mục"
      });
    }
  }

  // Cập nhật category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        const category = await categoryRepository.findById(id);
        return res.render("categories/edit", {
          title: "Sửa danh mục",
          category,
          error: "Tên danh mục không được để trống",
          user: req.user
        });
      }

      await categoryRepository.updateCategory(id, { name, description });

      res.redirect("/categories?success=updated");

    } catch (error) {
      console.error("Lỗi cập nhật danh mục:", error);
      const category = await categoryRepository.findById(req.params.id);
      res.render("categories/edit", {
        title: "Sửa danh mục",
        category,
        error: "Không thể cập nhật danh mục",
        user: req.user
      });
    }
  }

  // Xóa category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra xem có sản phẩm nào thuộc category này không
      const products = await productRepository.getAllProducts({ categoryId: id });
      
      if (products.length > 0) {
        return res.redirect("/categories?error=has_products");
      }

      await categoryRepository.deleteCategory(id);

      res.redirect("/categories?success=deleted");

    } catch (error) {
      console.error("Lỗi xóa danh mục:", error);
      res.redirect("/categories?error=delete_failed");
    }
  }

  // API để lấy danh sách categories (cho dropdown)
  async getCategoriesApi(req, res) {
    try {
      const categories = await categoryRepository.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Lỗi lấy API danh mục:", error);
      res.status(500).json({ error: "Không thể lấy danh sách danh mục" });
    }
  }
}

module.exports = new CategoryController();