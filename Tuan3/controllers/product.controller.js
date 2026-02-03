const productRepository = require("../repositories/product.repository");
const categoryRepository = require("../repositories/category.repository");
const { uploadImage, deleteImage } = require("../services/s3.service");

class ProductController {
  // Hiển thị danh sách sản phẩm với filter và search
  async getProducts(req, res) {
    try {
      const { categoryId, minPrice, maxPrice, search, page = 1 } = req.query;
      
      // Tạo filter object
      const filters = {};
      if (categoryId) filters.categoryId = categoryId;
      if (minPrice) filters.minPrice = minPrice;
      if (maxPrice) filters.maxPrice = maxPrice;
      if (search) filters.name = search;

      // Lấy sản phẩm và categories
      const [products, categories] = await Promise.all([
        productRepository.getAllProducts(filters),
        categoryRepository.getAllCategories()
      ]);

      // Phân trang
      const itemsPerPage = 10;
      const totalItems = products.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const currentPage = Math.max(1, Math.min(page, totalPages));
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

      // Thêm thông tin category vào product
      const productsWithCategories = await Promise.all(
        paginatedProducts.map(async (product) => {
          if (product.categoryId) {
            const category = await categoryRepository.findById(product.categoryId);
            return { ...product, category };
          }
          return product;
        })
      );

      res.render("products/list", {
        title: "Danh sách sản phẩm",
        products: productsWithCategories,
        categories,
        filters: { categoryId, minPrice, maxPrice, search },
        pagination: {
          currentPage,
          totalPages,
          totalItems,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        },
        user: req.user
      });

    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm:", error);
      res.status(500).render("error", {
        title: "Lỗi",
        message: "Không thể lấy danh sách sản phẩm"
      });
    }
  }

  // Hiển thị form thêm sản phẩm
  async showCreateForm(req, res) {
    try {
      const categories = await categoryRepository.getAllCategories();
      
      res.render("products/create", {
        title: "Thêm sản phẩm",
        categories,
        user: req.user
      });
    } catch (error) {
      console.error("Lỗi lấy danh sách category:", error);
      res.render("products/create", {
        title: "Thêm sản phẩm",
        categories: [],
        error: "Không thể lấy danh sách danh mục",
        user: req.user
      });
    }
  }

  // Tạo sản phẩm mới
  async createProduct(req, res) {
    try {
      const { name, price, quantity, categoryId } = req.body;

      if (!name || !price || !quantity) {
        const categories = await categoryRepository.getAllCategories();
        return res.render("products/create", {
          title: "Thêm sản phẩm",
          categories,
          error: "Vui lòng nhập đầy đủ thông tin",
          user: req.user
        });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadImage(req.file);
      }

      // Tạo sản phẩm
      const product = await productRepository.createProduct({
        name,
        price: Number(price),
        quantity: Number(quantity),
        categoryId: categoryId || null,
        url_image: imageUrl
      });

      // Log action
      if (req.user) {
        await productRepository.logProductAction(product.id, "CREATE", req.user.userId);
      }

      res.redirect("/?success=created");

    } catch (error) {
      console.error("Lỗi tạo sản phẩm:", error);
      const categories = await categoryRepository.getAllCategories();
      res.render("products/create", {
        title: "Thêm sản phẩm",
        categories,
        error: "Không thể tạo sản phẩm",
        user: req.user
      });
    }
  }

  // Hiển thị form sửa sản phẩm
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      
      const [product, categories] = await Promise.all([
        productRepository.findById(id),
        categoryRepository.getAllCategories()
      ]);

      if (!product) {
        return res.status(404).render("error", {
          title: "Không tìm thấy",
          message: "Sản phẩm không tồn tại"
        });
      }

      res.render("products/edit", {
        title: "Sửa sản phẩm",
        product,
        categories,
        user: req.user
      });

    } catch (error) {
      console.error("Lỗi lấy thông tin sản phẩm:", error);
      res.status(500).render("error", {
        title: "Lỗi",
        message: "Không thể lấy thông tin sản phẩm"
      });
    }
  }

  // Cập nhật sản phẩm
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, price, quantity, categoryId } = req.body;

      if (!name || !price || !quantity) {
        const [product, categories] = await Promise.all([
          productRepository.findById(id),
          categoryRepository.getAllCategories()
        ]);
        
        return res.render("products/edit", {
          title: "Sửa sản phẩm",
          product,
          categories,
          error: "Vui lòng nhập đầy đủ thông tin",
          user: req.user
        });
      }

      // Lấy thông tin sản phẩm hiện tại
      const currentProduct = await productRepository.findById(id);
      if (!currentProduct) {
        return res.status(404).render("error", {
          title: "Không tìm thấy",
          message: "Sản phẩm không tồn tại"
        });
      }

      // Upload ảnh mới nếu có
      let imageUrl = currentProduct.url_image;
      if (req.file) {
        const newImageUrl = await uploadImage(req.file);
        
        // Xóa ảnh cũ nếu có
        if (imageUrl) {
          await deleteImage(imageUrl);
        }
        
        imageUrl = newImageUrl;
      }

      // Cập nhật sản phẩm
      await productRepository.updateProduct(id, {
        name,
        price: Number(price),
        quantity: Number(quantity),
        categoryId: categoryId || null,
        url_image: imageUrl
      });

      // Log action
      if (req.user) {
        await productRepository.logProductAction(id, "UPDATE", req.user.userId);
      }

      res.redirect("/?success=updated");

    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm:", error);
      const [product, categories] = await Promise.all([
        productRepository.findById(req.params.id),
        categoryRepository.getAllCategories()
      ]);
      
      res.render("products/edit", {
        title: "Sửa sản phẩm",
        product,
        categories,
        error: "Không thể cập nhật sản phẩm",
        user: req.user
      });
    }
  }

  // Soft delete sản phẩm
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await productRepository.findById(id);
      if (!product) {
        return res.status(404).json({ error: "Sản phẩm không tồn tại" });
      }

      // Soft delete
      await productRepository.softDeleteProduct(id);

      // Log action
      if (req.user) {
        await productRepository.logProductAction(id, "DELETE", req.user.userId);
      }

      res.redirect("/?success=deleted");

    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      res.redirect("/?error=delete_failed");
    }
  }

  // Khôi phục sản phẩm
  async restoreProduct(req, res) {
    try {
      const { id } = req.params;

      await productRepository.restoreProduct(id);

      // Log action
      if (req.user) {
        await productRepository.logProductAction(id, "RESTORE", req.user.userId);
      }

      res.redirect("/?success=restored");

    } catch (error) {
      console.error("Lỗi khôi phục sản phẩm:", error);
      res.redirect("/?error=restore_failed");
    }
  }

  // Hiển thị inventory status
  async getInventoryStatus(req, res) {
    try {
      const inventoryData = await productRepository.getProductsByInventoryStatus();
      
      res.render("products/inventory", {
        title: "Tình trạng tồn kho",
        inventory: inventoryData,
        user: req.user
      });

    } catch (error) {
      console.error("Lỗi lấy tình trạng tồn kho:", error);
      res.status(500).render("error", {
        title: "Lỗi",
        message: "Không thể lấy thông tin tồn kho"
      });
    }
  }

  // Xem lịch sử thao tác
  async getProductLogs(req, res) {
    try {
      const { id } = req.params;
      
      const [product, logs] = await Promise.all([
        productRepository.findById(id, true), // Include deleted
        productRepository.getProductLogs(id)
      ]);

      if (!product) {
        return res.status(404).render("error", {
          title: "Không tìm thấy",
          message: "Sản phẩm không tồn tại"
        });
      }

      res.render("products/logs", {
        title: "Lịch sử thao tác",
        product,
        logs,
        user: req.user
      });

    } catch (error) {
      console.error("Lỗi lấy lịch sử thao tác:", error);
      res.status(500).render("error", {
        title: "Lỗi",
        message: "Không thể lấy lịch sử thao tác"
      });
    }
  }
}

module.exports = new ProductController();
