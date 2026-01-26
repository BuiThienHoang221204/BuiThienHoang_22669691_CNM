const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const db = require("../services/dynamodb.service");
const { uploadImage, deleteImage } = require("../services/s3.service");
const { v4: uuidv4 } = require("uuid");

// Create - Thêm sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Vui lòng chọn hình ảnh sản phẩm");
    }

    const imageUrl = await uploadImage(req.file);

    const product = {
      id: uuidv4(),
      name: req.body.name,
      price: Number(req.body.price),
      quantity: Number(req.body.quantity),
      url_image: imageUrl
    };

    await db.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: product
      })
    );

    res.redirect("/");
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).render("error", { 
      message: "Lỗi khi thêm sản phẩm: " + error.message 
    });
  }
};

// Read - Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    const data = await db.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE
      })
    );

    res.render("products/list", {
      title: "Danh sách sản phẩm",
      products: data.Items || []
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).render("error", { 
      message: "Lỗi khi lấy danh sách sản phẩm: " + error.message 
    });
  }
};

// Read - Lấy thông tin sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const data = await db.send(
      new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: req.params.id }
      })
    );

    if (!data.Item) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }

    res.render("products/edit", {
      title: "Chỉnh sửa sản phẩm",
      product: data.Item
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).render("error", { 
      message: "Lỗi khi lấy thông tin sản phẩm: " + error.message 
    });
  }
};

// Update - Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    // Lấy thông tin sản phẩm hiện tại để xóa ảnh cũ nếu có ảnh mới
    let oldImageUrl = null;
    if (req.file) {
      const currentData = await db.send(
        new GetCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Key: { id: req.params.id }
        })
      );
      oldImageUrl = currentData.Item?.url_image;
    }

    // Upload ảnh mới nếu có
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    // Cập nhật DynamoDB
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    updateExpression.push("#n = :n");
    expressionAttributeNames["#n"] = "name";
    expressionAttributeValues[":n"] = req.body.name;

    updateExpression.push("price = :p");
    expressionAttributeValues[":p"] = Number(req.body.price);

    updateExpression.push("quantity = :q");
    expressionAttributeValues[":q"] = Number(req.body.quantity);

    if (imageUrl) {
      updateExpression.push("url_image = :img");
      expressionAttributeValues[":img"] = imageUrl;
    }

    await db.send(
      new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: req.params.id },
        UpdateExpression: "SET " + updateExpression.join(", "),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      })
    );

    // Xóa ảnh cũ từ S3 nếu có ảnh mới
    if (oldImageUrl && imageUrl) {
      await deleteImage(oldImageUrl);
    }

    res.redirect("/");
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).render("error", { 
      message: "Lỗi khi cập nhật sản phẩm: " + error.message 
    });
  }
};

// Delete - Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    // Lấy thông tin sản phẩm để xóa ảnh từ S3
    const data = await db.send(
      new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: req.params.id }
      })
    );

    // Xóa sản phẩm từ DynamoDB
    await db.send(
      new DeleteCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: req.params.id }
      })
    );

    // Xóa ảnh từ S3 nếu có
    if (data.Item && data.Item.url_image) {
      await deleteImage(data.Item.url_image);
    }

    res.redirect("/");
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).render("error", { 
      message: "Lỗi khi xóa sản phẩm: " + error.message 
    });
  }
};
